-- Checkout in steps: reserve -> buyer & attendee details -> confirm -> pay.
-- Depends on 20261005120000_orders_payments.sql.
--
-- create_order still reserves the seats (now before the details step). The
-- buyer then saves their own data plus one attendee per ticket with
-- save_order_details, and only the server starts the Flow payment through
-- begin_order_payment, which checks the details are complete and extends the
-- hold once so the payment window is always backed by the seats.
-- confirm_order_payment now writes each attendee onto their ticket.

-- ---------------------------------------------------------------------------
-- Columns
-- ---------------------------------------------------------------------------

alter table public.orders
  add column if not exists buyer_first_name text,
  add column if not exists buyer_last_name text,
  add column if not exists buyer_document text,
  add column if not exists buyer_phone text,
  add column if not exists payment_started_at timestamptz;

alter table public.tickets
  add column if not exists holder_name text,
  add column if not exists holder_document text;

create table if not exists public.order_attendees (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  position integer not null check (position >= 1),
  sector_id uuid not null references public.event_sectors (id) on delete restrict,
  seat_label text,
  first_name text not null,
  last_name text not null,
  document text not null,
  birth_date date not null,
  created_at timestamptz not null default now(),
  unique (order_id, position)
);

create index if not exists order_attendees_order_idx on public.order_attendees (order_id);

alter table public.order_attendees enable row level security;

drop policy if exists "Owners and staff read attendees" on public.order_attendees;
create policy "Owners and staff read attendees" on public.order_attendees
  for select using (
    exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid())
    or public.is_admin_or_staff()
  );

-- ---------------------------------------------------------------------------
-- save_order_details: called by the signed-in buyer while the order is held.
-- p_buyer:     { first_name, last_name, document, phone }
-- p_attendees: [{ sector_id, seat_label | null, first_name, last_name, document, birth_date }]
--              one per ticket; numbered sectors must name each held seat once.
-- ---------------------------------------------------------------------------

create or replace function public.save_order_details(p_order_id uuid, p_buyer jsonb, p_attendees jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders;
  v_item public.order_items;
  v_att jsonb;
  v_first text;
  v_last text;
  v_doc text;
  v_birth date;
  v_seat text;
  v_total integer;
  v_pos integer := 0;
begin
  select * into v_order from public.orders where id = p_order_id for update;
  if not found or v_order.user_id is distinct from auth.uid() then
    raise exception 'ORDER_NOT_FOUND';
  end if;
  if v_order.status <> 'pending' or v_order.expires_at < now() then
    raise exception 'ORDER_EXPIRED';
  end if;
  if v_order.flow_token is not null then
    raise exception 'PAYMENT_ALREADY_STARTED';
  end if;

  v_first := btrim(coalesce(p_buyer ->> 'first_name', ''));
  v_last := btrim(coalesce(p_buyer ->> 'last_name', ''));
  v_doc := upper(btrim(coalesce(p_buyer ->> 'document', '')));
  if length(v_first) not between 1 and 80 or length(v_last) not between 1 and 80
     or length(v_doc) not between 5 and 20
     or length(btrim(coalesce(p_buyer ->> 'phone', ''))) not between 8 and 20 then
    raise exception 'DETAILS_INVALID';
  end if;

  update public.orders
     set buyer_first_name = v_first,
         buyer_last_name = v_last,
         buyer_name = v_first || ' ' || v_last,
         buyer_document = v_doc,
         buyer_phone = btrim(p_buyer ->> 'phone'),
         updated_at = now()
   where id = p_order_id;

  select coalesce(sum(quantity), 0) into v_total from public.order_items where order_id = p_order_id;
  if jsonb_typeof(p_attendees) <> 'array' or jsonb_array_length(p_attendees) <> v_total then
    raise exception 'DETAILS_INVALID';
  end if;

  -- Each ticket in the order must be covered exactly once.
  for v_item in select * from public.order_items where order_id = p_order_id loop
    if cardinality(v_item.seat_labels) > 0 then
      foreach v_seat in array v_item.seat_labels loop
        if (select count(*) from jsonb_array_elements(p_attendees) a
             where a ->> 'sector_id' = v_item.sector_id::text and a ->> 'seat_label' = v_seat) <> 1 then
          raise exception 'DETAILS_INVALID';
        end if;
      end loop;
    elsif (select count(*) from jsonb_array_elements(p_attendees) a
            where a ->> 'sector_id' = v_item.sector_id::text and coalesce(a ->> 'seat_label', '') = '') <> v_item.quantity then
      raise exception 'DETAILS_INVALID';
    end if;
  end loop;

  if (select count(distinct upper(btrim(a ->> 'document'))) from jsonb_array_elements(p_attendees) a) <> v_total then
    raise exception 'DUPLICATE_DOCUMENT';
  end if;

  delete from public.order_attendees where order_id = p_order_id;

  for v_att in select a from jsonb_array_elements(p_attendees) a loop
    v_pos := v_pos + 1;
    v_first := btrim(coalesce(v_att ->> 'first_name', ''));
    v_last := btrim(coalesce(v_att ->> 'last_name', ''));
    v_doc := upper(btrim(coalesce(v_att ->> 'document', '')));
    begin
      v_birth := (v_att ->> 'birth_date')::date;
    exception when others then
      raise exception 'DETAILS_INVALID';
    end;
    if length(v_first) not between 1 and 80 or length(v_last) not between 1 and 80
       or length(v_doc) not between 5 and 20
       or v_birth is null or v_birth > current_date or v_birth < date '1900-01-01' then
      raise exception 'DETAILS_INVALID';
    end if;
    insert into public.order_attendees (order_id, position, sector_id, seat_label, first_name, last_name, document, birth_date)
    values (p_order_id, v_pos, (v_att ->> 'sector_id')::uuid, nullif(v_att ->> 'seat_label', ''), v_first, v_last, v_doc, v_birth);
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- begin_order_payment: server only, right before creating the Flow payment.
-- Extends the hold once (p_minutes from now) so the whole payment window is
-- covered; later retries keep the original deadline.
-- ---------------------------------------------------------------------------

create or replace function public.begin_order_payment(p_order_id uuid, p_minutes integer default 17)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders;
  v_total integer;
  v_expires timestamptz;
begin
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'ORDER_NOT_FOUND';
  end if;
  if v_order.status <> 'pending' or v_order.expires_at < now() then
    raise exception 'ORDER_EXPIRED';
  end if;
  if v_order.flow_token is not null then
    raise exception 'PAYMENT_ALREADY_STARTED';
  end if;

  select coalesce(sum(quantity), 0) into v_total from public.order_items where order_id = p_order_id;
  if (select count(*) from public.order_attendees where order_id = p_order_id) <> v_total
     or v_order.buyer_document is null then
    raise exception 'DETAILS_MISSING';
  end if;

  if v_order.payment_started_at is null then
    v_expires := now() + make_interval(mins => greatest(5, least(p_minutes, 30)));
    update public.seat_holds set expires_at = v_expires where order_id = p_order_id and status = 'held';
    update public.orders
       set expires_at = v_expires, payment_started_at = now(), updated_at = now()
     where id = p_order_id
    returning * into v_order;
  end if;

  return v_order;
end;
$$;

-- ---------------------------------------------------------------------------
-- confirm_order_payment: same as before, plus the attendee on each ticket.
-- ---------------------------------------------------------------------------

create or replace function public.confirm_order_payment(p_order_id uuid, p_flow_order bigint, p_amount integer)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders;
  v_hold public.seat_holds;
  v_sector public.event_sectors;
  v_item public.order_items;
  v_att public.order_attendees;
  v_taken integer;
  v_seat text;
  v_qty integer := 0;
  i integer;
begin
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'ORDER_NOT_FOUND';
  end if;
  if v_order.status in ('paid', 'refund_required') then
    return v_order.status;
  end if;
  if p_amount <> v_order.total then
    update public.orders set status = 'refund_required', updated_at = now() where id = p_order_id;
    update public.seat_holds set status = 'released' where order_id = p_order_id and status = 'held';
    return 'refund_required';
  end if;

  begin
    for v_hold in select * from public.seat_holds where order_id = p_order_id order by sector_id loop
      if v_hold.status = 'held' then
        update public.seat_holds set status = 'sold' where id = v_hold.id;
      elsif v_hold.status = 'released' then
        select * into v_sector from public.event_sectors where id = v_hold.sector_id for update;
        if v_hold.seat_label is null then
          select coalesce(sum(quantity), 0) into v_taken
            from public.seat_holds
           where sector_id = v_hold.sector_id
             and (status = 'sold' or (status = 'held' and expires_at > now()));
          if v_taken + v_hold.quantity > v_sector.capacity then
            raise exception 'CONFLICT';
          end if;
        end if;
        update public.seat_holds set status = 'sold' where id = v_hold.id;
      end if;
    end loop;
  exception when unique_violation or raise_exception then
    update public.orders set status = 'refund_required', updated_at = now() where id = p_order_id;
    update public.seat_holds set status = 'released' where order_id = p_order_id;
    return 'refund_required';
  end;

  update public.orders
     set status = 'paid', paid_at = now(), flow_order = coalesce(p_flow_order, flow_order), updated_at = now()
   where id = p_order_id;

  for v_item in select * from public.order_items where order_id = p_order_id loop
    if cardinality(v_item.seat_labels) > 0 then
      foreach v_seat in array v_item.seat_labels loop
        select * into v_att from public.order_attendees
         where order_id = p_order_id and sector_id = v_item.sector_id and seat_label = v_seat
         limit 1;
        insert into public.tickets (order_id, event_id, sector_id, sector_name, seat_label, holder_user_id, holder_name, holder_document)
        values (p_order_id, v_order.event_id, v_item.sector_id, v_item.sector_name, v_seat, v_order.user_id,
                case when v_att.id is null then null else v_att.first_name || ' ' || v_att.last_name end,
                v_att.document);
      end loop;
    else
      for i in 1..v_item.quantity loop
        v_att := null;
        select * into v_att from public.order_attendees
         where order_id = p_order_id and sector_id = v_item.sector_id and seat_label is null
         order by position
         offset i - 1 limit 1;
        insert into public.tickets (order_id, event_id, sector_id, sector_name, holder_user_id, holder_name, holder_document)
        values (p_order_id, v_order.event_id, v_item.sector_id, v_item.sector_name, v_order.user_id,
                case when v_att.id is null then null else v_att.first_name || ' ' || v_att.last_name end,
                v_att.document);
      end loop;
    end if;
    update public.event_sectors set sold = sold + v_item.quantity where id = v_item.sector_id;
    v_qty := v_qty + v_item.quantity;
  end loop;

  update public.events set sold = sold + v_qty, updated_at = now() where id = v_order.event_id;

  return 'paid';
end;
$$;

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------

revoke all on function public.save_order_details(uuid, jsonb, jsonb) from public, anon;
revoke all on function public.begin_order_payment(uuid, integer) from public, anon, authenticated;
revoke all on function public.confirm_order_payment(uuid, bigint, integer) from public, anon, authenticated;

grant execute on function public.save_order_details(uuid, jsonb, jsonb) to authenticated;
grant execute on function public.begin_order_payment(uuid, integer) to service_role;
grant execute on function public.confirm_order_payment(uuid, bigint, integer) to service_role;
