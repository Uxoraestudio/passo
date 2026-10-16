-- Validación de entradas en la puerta.
-- Depends on the base schema (supabase/baseline/2026-10-16_esquema_completo.sql).
--
-- A door operator scans a ticket's QR (its 64-character code) or types the
-- short code printed on it (PS-XXXXXXXXXX-01). validate_ticket marks the ticket
-- as used in the same statement that checks it is still valid, so two doors
-- can never let the same ticket in. Every attempt is logged in ticket_scans,
-- which feeds the live counters and the incident list.
--
-- Access: staff with at least "view" on the "validacion" module (the door
-- operator role has exactly that). Nobody reads ticket_scans directly; the
-- functions below are the only way in.

create table if not exists public.ticket_scans (
  id bigserial primary key,
  event_id uuid not null references public.events (id) on delete cascade,
  ticket_id uuid references public.tickets (id) on delete set null,
  -- What was scanned or typed, trimmed and shortened (never more than a code).
  input text not null,
  result text not null check (result in ('valid', 'already_used', 'void', 'wrong_event', 'not_found')),
  gate text,
  scanned_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists ticket_scans_event_idx on public.ticket_scans (event_id, created_at desc);

alter table public.ticket_scans enable row level security;

alter table public.tickets add column if not exists used_by uuid references auth.users (id) on delete set null;

create or replace function public.can_validate_tickets()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.staff_permission('validacion') in ('view', 'edit');
$$;

-- "Fila A · Asiento 4" from a ticket's seat: plan seats carry row and number,
-- grid seats ("A12") are read from the label.
create or replace function public.ticket_seat_text(p_sector_id uuid, p_label text)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select case
           when p_label is null then 'Acceso general'
           else coalesce(
             (select 'Fila ' || s.row_label || ' · Asiento ' || s.number
                from public.event_seats s
               where s.sector_id = p_sector_id and s.label = p_label
                 and s.row_label is not null and s.number is not null),
             case when p_label ~ '^[A-Z]{1,2}[0-9]+$'
                  then 'Fila ' || substring(p_label from '^[A-Z]+') || ' · Asiento ' || substring(p_label from '[0-9]+$')
                  else 'Asiento ' || p_label end)
         end;
$$;

-- The ticket a code points to: the QR code itself, or "ORDERCODE-NN" where NN
-- is the ticket's position in its order (same order as the printed tickets).
create or replace function public.find_ticket_by_code(p_code text)
returns public.tickets
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_code text := btrim(coalesce(p_code, ''));
  v_ticket public.tickets;
  v_order text;
  v_pos integer;
begin
  if v_code ~* '^[0-9a-f]{64}$' then
    select * into v_ticket from public.tickets where code = lower(v_code);
    return v_ticket;
  end if;
  if upper(v_code) ~ '^[A-Z]{2}-[0-9A-Z]{6,20}-[0-9]{1,3}$' then
    v_order := upper(substring(v_code from '^(.*)-[0-9]+$'));
    v_pos := substring(v_code from '([0-9]+)$')::integer;
    select t.* into v_ticket
      from (
        select t.*, row_number() over (order by t.seat_label asc nulls last, t.created_at asc) as pos
          from public.tickets t
          join public.orders o on o.id = t.order_id
         where o.code = v_order
      ) t
     where t.pos = v_pos;
    return v_ticket;
  end if;
  return null;
end;
$$;

-- Checks a ticket at the door and lets it in. Returns:
--   { result: valid | already_used | void | wrong_event | not_found,
--     ticket: { holder, document, sector, seat, used_at, used_gate, event } | null }
create or replace function public.validate_ticket(p_event_id uuid, p_code text, p_gate text default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_input text := left(btrim(coalesce(p_code, '')), 80);
  v_gate text := nullif(left(btrim(coalesce(p_gate, '')), 40), '');
  v_found public.tickets;
  v_ticket public.tickets;
  v_result text;
  v_event_title text;
begin
  if not public.can_validate_tickets() then
    raise exception 'FORBIDDEN';
  end if;
  if not exists (select 1 from public.events where id = p_event_id) then
    raise exception 'EVENT_NOT_FOUND';
  end if;
  if v_input = '' then
    raise exception 'EMPTY_CODE';
  end if;

  v_found := public.find_ticket_by_code(v_input);

  if v_found.id is null then
    v_result := 'not_found';
  elsif v_found.event_id <> p_event_id then
    v_result := 'wrong_event';
    v_ticket := v_found;
  else
    -- Check and use in one statement: only one door can win.
    update public.tickets
       set status = 'used', used_at = now(), used_gate = v_gate, used_by = auth.uid()
     where id = v_found.id and status = 'valid'
    returning * into v_ticket;
    if v_ticket.id is not null then
      v_result := 'valid';
    else
      select * into v_ticket from public.tickets where id = v_found.id;
      v_result := case v_ticket.status when 'used' then 'already_used' else 'void' end;
    end if;
  end if;

  insert into public.ticket_scans (event_id, ticket_id, input, result, gate, scanned_by)
  values (p_event_id, v_found.id, v_input, v_result, v_gate, auth.uid());

  if v_ticket.id is null then
    return jsonb_build_object('result', v_result, 'ticket', null);
  end if;
  select title into v_event_title from public.events where id = v_ticket.event_id;
  return jsonb_build_object(
    'result', v_result,
    'ticket', jsonb_build_object(
      'holder', v_ticket.holder_name,
      'document', v_ticket.holder_document,
      'sector', v_ticket.sector_name,
      'seat', public.ticket_seat_text(v_ticket.sector_id, v_ticket.seat_label),
      'used_at', v_ticket.used_at,
      'used_gate', v_ticket.used_gate,
      'event', v_event_title
    )
  );
end;
$$;

-- Live numbers for the validation screen.
create or replace function public.validation_overview(p_event_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.can_validate_tickets() then
    raise exception 'FORBIDDEN';
  end if;
  return jsonb_build_object(
    'tickets', (select count(*) from public.tickets where event_id = p_event_id and status <> 'void'),
    'entered', (select count(*) from public.tickets where event_id = p_event_id and status = 'used'),
    'scans_ok', (select count(*) from public.ticket_scans where event_id = p_event_id and result = 'valid'),
    'scans_rejected', (select count(*) from public.ticket_scans where event_id = p_event_id and result <> 'valid'),
    'last_15_min', (select count(*) from public.ticket_scans where event_id = p_event_id and result = 'valid' and created_at > now() - interval '15 minutes'),
    'by_result', coalesce((
      select jsonb_object_agg(result, n)
        from (select result, count(*) as n from public.ticket_scans where event_id = p_event_id group by result) r
    ), '{}'::jsonb),
    'sectors', coalesce((
      select jsonb_agg(jsonb_build_object('name', name, 'tickets', tickets, 'entered', entered) order by name)
        from (
          select t.sector_name as name, count(*) filter (where t.status <> 'void') as tickets, count(*) filter (where t.status = 'used') as entered
            from public.tickets t
           where t.event_id = p_event_id
           group by t.sector_name
        ) s
    ), '[]'::jsonb),
    'gates', coalesce((
      select jsonb_agg(jsonb_build_object('gate', gate, 'entered', entered, 'rejected', rejected, 'last_at', last_at) order by entered desc)
        from (
          select coalesce(gate, 'Sin puerta') as gate,
                 count(*) filter (where result = 'valid') as entered,
                 count(*) filter (where result <> 'valid') as rejected,
                 max(created_at) as last_at
            from public.ticket_scans
           where event_id = p_event_id
           group by coalesce(gate, 'Sin puerta')
        ) g
    ), '[]'::jsonb),
    'recent', coalesce((
      select jsonb_agg(r order by r ->> 'at' desc)
        from (
          select jsonb_build_object(
                   'id', s.id, 'at', s.created_at, 'result', s.result, 'gate', s.gate,
                   'holder', t.holder_name, 'sector', t.sector_name,
                   'seat', case when t.id is null then null else public.ticket_seat_text(t.sector_id, t.seat_label) end,
                   'input', case when s.input ~* '^[0-9a-f]{64}$' then left(s.input, 8) || '…' else s.input end
                 ) as r
            from public.ticket_scans s
            left join public.tickets t on t.id = s.ticket_id
           where s.event_id = p_event_id
           order by s.created_at desc
           limit 40
        ) recent
    ), '[]'::jsonb)
  );
end;
$$;

revoke all on function public.can_validate_tickets() from public, anon;
revoke all on function public.ticket_seat_text(uuid, text) from public, anon, authenticated;
revoke all on function public.find_ticket_by_code(text) from public, anon, authenticated;
revoke all on function public.validate_ticket(uuid, text, text) from public, anon;
revoke all on function public.validation_overview(uuid) from public, anon;

grant execute on function public.can_validate_tickets() to authenticated;
grant execute on function public.validate_ticket(uuid, text, text) to authenticated;
grant execute on function public.validation_overview(uuid) to authenticated;

-- New Supabase projects grant EXECUTE to anon and authenticated by default.
revoke execute on function public.can_validate_tickets() from anon;
revoke execute on function public.ticket_seat_text(uuid, text) from anon, authenticated;
revoke execute on function public.find_ticket_by_code(text) from anon, authenticated;
revoke execute on function public.validate_ticket(uuid, text, text) from anon;
revoke execute on function public.validation_overview(uuid) from anon;
