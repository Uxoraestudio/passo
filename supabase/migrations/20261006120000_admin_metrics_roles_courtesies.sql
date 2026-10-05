-- Admin: real metrics, client directory, custom staff roles and courtesy tickets.
-- Depends on 20261005120000_orders_payments.sql.

-- ---------------------------------------------------------------------------
-- Staff roles
-- ---------------------------------------------------------------------------
-- profiles.role (enum) keeps the coarse access level: admin | staff | cliente.
-- A staff member can additionally carry a custom role whose permissions say,
-- per admin module, 'none' | 'view' | 'edit'. Admins always have full access;
-- staff without a custom role keep full access as before.

create table if not exists public.staff_roles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  color text not null default '#6534f5',
  permissions jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists staff_roles_name_key on public.staff_roles (lower(name));

-- RESTRICT: deleting a role must never silently widen its members' access.
alter table public.profiles add column if not exists staff_role_id uuid references public.staff_roles (id) on delete restrict;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role::text = 'admin');
$$;

-- Effective permission of the current user for one admin module.
create or replace function public.staff_permission(p_module text)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((
    select case
             when p.role::text = 'admin' then 'edit'
             when p.role::text = 'staff' and p.staff_role_id is null then 'edit'
             when p.role::text = 'staff' then coalesce(r.permissions ->> p_module, 'none')
             else 'none'
           end
      from public.profiles p
      left join public.staff_roles r on r.id = p.staff_role_id
     where p.id = auth.uid()
  ), 'none');
$$;

-- Everything the admin UI needs to decide what to show.
create or replace function public.my_access()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
           'role', p.role::text,
           'staff_role_id', p.staff_role_id,
           'staff_role_name', r.name,
           'permissions', case
                            when p.role::text = 'admin' or (p.role::text = 'staff' and p.staff_role_id is null) then null
                            else coalesce(r.permissions, '{}'::jsonb)
                          end
         )
    from public.profiles p
    left join public.staff_roles r on r.id = p.staff_role_id
   where p.id = auth.uid();
$$;

alter table public.staff_roles enable row level security;

drop policy if exists "Staff read staff roles" on public.staff_roles;
create policy "Staff read staff roles" on public.staff_roles
  for select using (public.is_admin_or_staff());

drop policy if exists "Role managers write staff roles" on public.staff_roles;
create policy "Role managers write staff roles" on public.staff_roles
  for all using (public.staff_permission('roles') = 'edit')
  with check (public.staff_permission('roles') = 'edit');

-- Staff can see every profile (client directory, team list). Writes stay out:
-- role changes go through admin_set_member.
drop policy if exists "Staff read all profiles" on public.profiles;
create policy "Staff read all profiles" on public.profiles
  for select using (public.is_admin_or_staff());

-- Grants or removes panel access for an existing account (matched by email).
-- Only admins can grant or remove the admin level, and the last admin can't be demoted.
create or replace function public.admin_set_member(p_email text, p_role text, p_staff_role_id uuid default null)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  v_target public.profiles;
  v_admins integer;
begin
  if public.staff_permission('roles') <> 'edit' then
    raise exception 'FORBIDDEN';
  end if;
  if p_role not in ('admin', 'staff', 'cliente') then
    raise exception 'INVALID_ROLE';
  end if;

  select * into v_target from public.profiles where lower(email) = lower(trim(p_email));
  if not found then
    raise exception 'USER_NOT_FOUND';
  end if;

  if (p_role = 'admin' or v_target.role::text = 'admin') and not public.is_admin() then
    raise exception 'ADMIN_ONLY';
  end if;

  if v_target.role::text = 'admin' and p_role <> 'admin' then
    select count(*) into v_admins from public.profiles where role::text = 'admin';
    if v_admins <= 1 then
      raise exception 'LAST_ADMIN';
    end if;
  end if;

  if p_staff_role_id is not null and not exists (select 1 from public.staff_roles where id = p_staff_role_id) then
    raise exception 'ROLE_NOT_FOUND';
  end if;

  update public.profiles
     set role = p_role::public.user_role,
         staff_role_id = case when p_role = 'staff' then p_staff_role_id else null end
   where id = v_target.id
  returning * into v_target;

  return v_target;
end;
$$;

-- ---------------------------------------------------------------------------
-- Courtesy and press tickets
-- ---------------------------------------------------------------------------

alter table public.orders add column if not exists kind text not null default 'sale';
alter table public.orders drop constraint if exists orders_kind_check;
alter table public.orders add constraint orders_kind_check check (kind in ('sale', 'cortesia', 'prensa'));
alter table public.orders add column if not exists issued_by uuid references auth.users (id) on delete set null;
alter table public.orders add column if not exists note text;

alter table public.tickets alter column holder_user_id drop not null;
alter table public.tickets add column if not exists holder_email text;
alter table public.tickets add column if not exists holder_name text;

create index if not exists orders_kind_event_idx on public.orders (event_id, kind);

-- A courtesy sent to an email without an account shows up once that person signs up.
drop policy if exists "Owners and staff read orders" on public.orders;
create policy "Owners and staff read orders" on public.orders
  for select using (
    user_id = auth.uid()
    or lower(buyer_email) = lower(auth.jwt() ->> 'email')
    or public.is_admin_or_staff()
  );

drop policy if exists "Holders and staff read tickets" on public.tickets;
create policy "Holders and staff read tickets" on public.tickets
  for select using (
    holder_user_id = auth.uid()
    or lower(holder_email) = lower(auth.jwt() ->> 'email')
    or public.is_admin_or_staff()
  );

-- Issues free tickets that consume real capacity. Numbered sectors get the
-- first free seats in order.
create or replace function public.issue_courtesy(
  p_event_id uuid,
  p_sector_id uuid,
  p_quantity integer,
  p_kind text,
  p_name text,
  p_email text,
  p_note text default null
)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller uuid := auth.uid();
  v_sector public.event_sectors;
  v_recipient uuid;
  v_order public.orders;
  v_taken integer;
  v_seats text[] := '{}';
  v_label text;
  v_row integer;
  v_n integer;
  v_seat text;
  i integer;
begin
  if public.staff_permission('eventos') <> 'edit' then
    raise exception 'FORBIDDEN';
  end if;
  if p_kind not in ('cortesia', 'prensa') then
    raise exception 'INVALID_KIND';
  end if;
  if p_quantity is null or p_quantity < 1 or p_quantity > 50 then
    raise exception 'QTY_LIMIT';
  end if;
  if coalesce(trim(p_name), '') = '' or coalesce(trim(p_email), '') !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'RECIPIENT_REQUIRED';
  end if;

  select * into v_sector
    from public.event_sectors
   where id = p_sector_id and event_id = p_event_id
     for update;
  if not found then
    raise exception 'SECTOR_NOT_FOUND';
  end if;

  perform public.release_expired_holds(v_sector.id);

  select coalesce(sum(quantity), 0) into v_taken
    from public.seat_holds
   where sector_id = v_sector.id
     and (status = 'sold' or (status = 'held' and expires_at > now()));
  if v_taken + p_quantity > v_sector.capacity then
    raise exception 'SOLD_OUT';
  end if;

  select id into v_recipient from public.profiles where lower(email) = lower(trim(p_email));

  insert into public.orders (user_id, event_id, status, kind, buyer_email, buyer_name, issued_by, note, expires_at, paid_at)
  values (coalesce(v_recipient, v_caller), p_event_id, 'paid', p_kind, lower(trim(p_email)), trim(p_name), v_caller, nullif(trim(p_note), ''), now(), now())
  returning * into v_order;

  if v_sector.numbered then
    v_row := 0;
    v_n := 0;
    while cardinality(v_seats) < p_quantity loop
      v_n := v_n + 1;
      if v_n > v_sector.seats_per_row then
        v_n := 1;
        v_row := v_row + 1;
      end if;
      if v_row * v_sector.seats_per_row + v_n > v_sector.capacity then
        raise exception 'SOLD_OUT';
      end if;
      v_label := case when v_row < 26 then chr(65 + v_row) else chr(64 + v_row / 26) || chr(65 + v_row % 26) end || v_n;
      if not exists (
        select 1 from public.seat_holds
         where sector_id = v_sector.id and seat_label = v_label
           and (status = 'sold' or (status = 'held' and expires_at > now()))
      ) then
        insert into public.seat_holds (order_id, event_id, sector_id, seat_label, quantity, status, expires_at)
        values (v_order.id, p_event_id, v_sector.id, v_label, 1, 'sold', now());
        v_seats := v_seats || v_label;
      end if;
    end loop;
  else
    insert into public.seat_holds (order_id, event_id, sector_id, seat_label, quantity, status, expires_at)
    values (v_order.id, p_event_id, v_sector.id, null, p_quantity, 'sold', now());
  end if;

  insert into public.order_items (order_id, sector_id, sector_name, unit_price, quantity, seat_labels)
  values (v_order.id, v_sector.id, v_sector.name, 0, p_quantity, v_seats);

  if cardinality(v_seats) > 0 then
    foreach v_seat in array v_seats loop
      insert into public.tickets (order_id, event_id, sector_id, sector_name, seat_label, holder_user_id, holder_email, holder_name)
      values (v_order.id, p_event_id, v_sector.id, v_sector.name, v_seat, v_recipient, lower(trim(p_email)), trim(p_name));
    end loop;
  else
    for i in 1..p_quantity loop
      insert into public.tickets (order_id, event_id, sector_id, sector_name, holder_user_id, holder_email, holder_name)
      values (v_order.id, p_event_id, v_sector.id, v_sector.name, v_recipient, lower(trim(p_email)), trim(p_name));
    end loop;
  end if;

  update public.event_sectors set sold = sold + p_quantity where id = v_sector.id;
  update public.events set sold = sold + p_quantity, updated_at = now() where id = p_event_id;

  return v_order;
end;
$$;

-- Cancels a courtesy: voids its unused tickets and frees the capacity.
create or replace function public.void_courtesy(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders;
  v_qty integer;
begin
  if public.staff_permission('eventos') <> 'edit' then
    raise exception 'FORBIDDEN';
  end if;
  select * into v_order from public.orders where id = p_order_id and kind in ('cortesia', 'prensa') for update;
  if not found then
    raise exception 'ORDER_NOT_FOUND';
  end if;
  if v_order.status = 'cancelled' then
    return;
  end if;
  if exists (select 1 from public.tickets where order_id = p_order_id and status = 'used') then
    raise exception 'ALREADY_USED';
  end if;

  update public.tickets set status = 'void' where order_id = p_order_id;
  update public.seat_holds set status = 'released' where order_id = p_order_id;
  update public.orders set status = 'cancelled', updated_at = now() where id = p_order_id;

  update public.event_sectors s
     set sold = greatest(0, s.sold - i.quantity)
    from public.order_items i
   where i.order_id = p_order_id and s.id = i.sector_id;
  select coalesce(sum(quantity), 0) into v_qty from public.order_items where order_id = p_order_id;
  update public.events set sold = greatest(0, sold - v_qty), updated_at = now() where id = v_order.event_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- Metrics
-- ---------------------------------------------------------------------------

-- Sales metrics for [p_from, p_to). Only paid sale orders count as revenue;
-- courtesies are reported separately. Deltas compare with the previous period
-- of the same length.
create or replace function public.admin_metrics(p_from timestamptz, p_to timestamptz, p_event_id uuid default null)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_len interval := p_to - p_from;
  v_result jsonb;
begin
  if public.staff_permission('ventas') = 'none' and public.staff_permission('resumen') = 'none' then
    raise exception 'FORBIDDEN';
  end if;

  with paid as (
    select o.*
      from public.orders o
     where o.status = 'paid' and o.kind = 'sale'
       and (p_event_id is null or o.event_id = p_event_id)
  ),
  cur as (select * from paid where paid_at >= p_from and paid_at < p_to),
  prev as (select * from paid where paid_at >= p_from - v_len and paid_at < p_from),
  cur_items as (select i.*, c.event_id, c.paid_at from public.order_items i join cur c on c.id = i.order_id),
  prev_items as (select i.* from public.order_items i join prev p on p.id = i.order_id),
  attempts as (
    select count(*) filter (where status = 'paid') as paid,
           count(*) as total
      from public.orders
     where kind = 'sale' and created_at >= p_from and created_at < p_to
       and status <> 'cancelled'
       and (p_event_id is null or event_id = p_event_id)
  )
  select jsonb_build_object(
    'revenue', (select coalesce(sum(total), 0) from cur),
    'revenue_prev', (select coalesce(sum(total), 0) from prev),
    'service_fees', (select coalesce(sum(service_fee), 0) from cur),
    'tickets', (select coalesce(sum(quantity), 0) from cur_items),
    'tickets_prev', (select coalesce(sum(quantity), 0) from prev_items),
    'orders', (select count(*) from cur),
    'orders_prev', (select count(*) from prev),
    'conversion', (select case when total > 0 then round(paid::numeric * 100 / total, 1) else null end from attempts),
    'courtesies', (
      select coalesce(sum(i.quantity), 0)
        from public.orders o join public.order_items i on i.order_id = o.id
       where o.kind in ('cortesia', 'prensa') and o.status = 'paid'
         and o.created_at >= p_from and o.created_at < p_to
         and (p_event_id is null or o.event_id = p_event_id)
    ),
    'daily', (
      select coalesce(jsonb_agg(jsonb_build_object('day', d.day, 'tickets', coalesce(t.tickets, 0), 'revenue', coalesce(r.revenue, 0)) order by d.day), '[]'::jsonb)
        from (
          select generate_series(
                   (p_from at time zone 'America/Santiago')::date,
                   ((p_to - interval '1 second') at time zone 'America/Santiago')::date,
                   interval '1 day'
                 )::date as day
        ) d
        left join (
          select (paid_at at time zone 'America/Santiago')::date as day, sum(quantity) as tickets
            from cur_items group by 1
        ) t on t.day = d.day
        left join (
          select (paid_at at time zone 'America/Santiago')::date as day, sum(total) as revenue
            from cur group by 1
        ) r on r.day = d.day
    ),
    'by_event', (
      select coalesce(jsonb_agg(row_to_json(x) order by x.revenue desc, x.title), '[]'::jsonb)
        from (
          select e.id, e.title, e.status, e.event_date, e.category, e.capacity, e.sold,
                 coalesce(sum(i.quantity), 0)::integer as tickets,
                 coalesce((select sum(c.total) from cur c where c.event_id = e.id), 0)::integer as revenue
            from public.events e
            left join cur_items i on i.event_id = e.id
           where (p_event_id is null or e.id = p_event_id)
             and (e.status <> 'borrador' or exists (select 1 from cur c where c.event_id = e.id))
           group by e.id
        ) x
    ),
    'by_category', (
      select coalesce(jsonb_agg(jsonb_build_object('category', category, 'tickets', tickets) order by tickets desc), '[]'::jsonb)
        from (
          select coalesce(nullif(e.category, ''), 'Sin categoría') as category, sum(i.quantity)::integer as tickets
            from cur_items i join public.events e on e.id = i.event_id
           group by 1
        ) c
    ),
    'recent_orders', (
      select coalesce(jsonb_agg(row_to_json(r) order by r.created_at desc), '[]'::jsonb)
        from (
          select o.id, o.code, o.status, o.kind, o.total, o.created_at, o.paid_at,
                 o.buyer_name, o.buyer_email, e.title as event_title,
                 (select coalesce(sum(quantity), 0) from public.order_items i where i.order_id = o.id)::integer as quantity
            from public.orders o
            join public.events e on e.id = o.event_id
           where o.created_at >= p_from and o.created_at < p_to
             and o.status <> 'cancelled'
             and (p_event_id is null or o.event_id = p_event_id)
           order by o.created_at desc
           limit 50
        ) r
    )
  ) into v_result;

  return v_result;
end;
$$;

-- Registered buyers with their purchase history (sales only).
create or replace function public.admin_clients()
returns table (
  id uuid,
  email text,
  full_name text,
  created_at timestamptz,
  orders_paid integer,
  tickets integer,
  total_spent integer,
  last_purchase_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if public.staff_permission('clientes') = 'none' then
    raise exception 'FORBIDDEN';
  end if;
  return query
    select p.id, p.email, p.full_name, p.created_at,
           count(o.id)::integer,
           coalesce(sum((select sum(i.quantity) from public.order_items i where i.order_id = o.id)), 0)::integer,
           coalesce(sum(o.total), 0)::integer,
           max(o.paid_at)
      from public.profiles p
      left join public.orders o on o.user_id = p.id and o.status = 'paid' and o.kind = 'sale'
     where p.role::text = 'cliente'
     group by p.id
     order by p.created_at desc;
end;
$$;

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------

revoke all on function public.admin_set_member(text, text, uuid) from public, anon;
revoke all on function public.issue_courtesy(uuid, uuid, integer, text, text, text, text) from public, anon;
revoke all on function public.void_courtesy(uuid) from public, anon;
revoke all on function public.admin_metrics(timestamptz, timestamptz, uuid) from public, anon;
revoke all on function public.admin_clients() from public, anon;
revoke all on function public.my_access() from public, anon;

grant execute on function public.is_admin() to authenticated;
grant execute on function public.staff_permission(text) to authenticated;
grant execute on function public.my_access() to authenticated;
grant execute on function public.admin_set_member(text, text, uuid) to authenticated;
grant execute on function public.issue_courtesy(uuid, uuid, integer, text, text, text, text) to authenticated;
grant execute on function public.void_courtesy(uuid) to authenticated;
grant execute on function public.admin_metrics(timestamptz, timestamptz, uuid) to authenticated;
grant execute on function public.admin_clients() to authenticated;
