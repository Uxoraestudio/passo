-- Orders, seat holds, tickets and Flow payments.
--
-- Every write goes through SECURITY DEFINER functions: buyers can only call
-- create_order (as themselves), and only the server (service_role) can attach
-- a Flow payment, confirm it or fail it. Seat and capacity checks run inside
-- the database under a row lock on the sector, so two buyers racing for the
-- same seat or the last units of a sector cannot both win.

-- ---------------------------------------------------------------------------
-- Sector seating
-- ---------------------------------------------------------------------------

alter table public.event_sectors
  add column if not exists numbered boolean not null default false,
  add column if not exists seats_per_row integer not null default 20,
  add column if not exists sold integer not null default 0;

alter table public.event_sectors drop constraint if exists event_sectors_seats_per_row_check;
alter table public.event_sectors add constraint event_sectors_seats_per_row_check check (seats_per_row between 1 and 100);

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  code text not null unique default ('PS-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10))),
  user_id uuid not null references auth.users (id) on delete restrict,
  event_id uuid not null references public.events (id) on delete restrict,
  status text not null default 'pending'
    check (status in ('pending', 'paid', 'rejected', 'cancelled', 'expired', 'refund_required')),
  subtotal integer not null default 0 check (subtotal >= 0),
  service_fee integer not null default 0 check (service_fee >= 0),
  total integer not null default 0 check (total >= 0),
  currency text not null default 'CLP',
  buyer_email text not null,
  buyer_name text,
  flow_token text unique,
  flow_order bigint,
  expires_at timestamptz not null,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists orders_user_idx on public.orders (user_id, created_at desc);
create index if not exists orders_event_status_idx on public.orders (event_id, status);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  sector_id uuid not null references public.event_sectors (id) on delete restrict,
  sector_name text not null,
  unit_price integer not null check (unit_price >= 0),
  quantity integer not null check (quantity between 1 and 20),
  seat_labels text[] not null default '{}'
);

create index if not exists order_items_order_idx on public.order_items (order_id);

-- One row per held seat (numbered sectors) or per held block (general admission).
-- A hold counts against availability while status = 'sold', or 'held' and not expired.
create table if not exists public.seat_holds (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  event_id uuid not null references public.events (id) on delete restrict,
  sector_id uuid not null references public.event_sectors (id) on delete restrict,
  seat_label text,
  quantity integer not null default 1 check (quantity > 0),
  status text not null default 'held' check (status in ('held', 'sold', 'released')),
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create unique index if not exists seat_holds_one_per_seat
  on public.seat_holds (sector_id, seat_label)
  where seat_label is not null and status in ('held', 'sold');
create index if not exists seat_holds_sector_status_idx on public.seat_holds (sector_id, status);
create index if not exists seat_holds_order_idx on public.seat_holds (order_id);

create table if not exists public.tickets (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete restrict,
  event_id uuid not null references public.events (id) on delete restrict,
  sector_id uuid not null references public.event_sectors (id) on delete restrict,
  sector_name text not null,
  seat_label text,
  holder_user_id uuid not null references auth.users (id) on delete restrict,
  -- 256 bits from two v4 UUIDs (gen_random_uuid uses a CSPRNG): not guessable.
  code text not null unique default (replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '')),
  status text not null default 'valid' check (status in ('valid', 'used', 'void')),
  used_at timestamptz,
  used_gate text,
  created_at timestamptz not null default now()
);

create index if not exists tickets_holder_idx on public.tickets (holder_user_id);
create index if not exists tickets_event_idx on public.tickets (event_id);

create table if not exists public.payment_events (
  id bigserial primary key,
  order_id uuid references public.orders (id) on delete set null,
  provider text not null default 'flow',
  source text not null,
  flow_token text,
  flow_status integer,
  amount numeric,
  payload jsonb,
  created_at timestamptz not null default now()
);

create index if not exists payment_events_order_idx on public.payment_events (order_id);

-- ---------------------------------------------------------------------------
-- Row level security: read-only for owners and staff, no direct writes.
-- ---------------------------------------------------------------------------

alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.seat_holds enable row level security;
alter table public.tickets enable row level security;
alter table public.payment_events enable row level security;

drop policy if exists "Owners and staff read orders" on public.orders;
create policy "Owners and staff read orders" on public.orders
  for select using (user_id = auth.uid() or public.is_admin_or_staff());

drop policy if exists "Owners and staff read order items" on public.order_items;
create policy "Owners and staff read order items" on public.order_items
  for select using (
    exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid())
    or public.is_admin_or_staff()
  );

drop policy if exists "Staff read seat holds" on public.seat_holds;
create policy "Staff read seat holds" on public.seat_holds
  for select using (public.is_admin_or_staff());

drop policy if exists "Holders and staff read tickets" on public.tickets;
create policy "Holders and staff read tickets" on public.tickets
  for select using (holder_user_id = auth.uid() or public.is_admin_or_staff());

drop policy if exists "Staff read payment events" on public.payment_events;
create policy "Staff read payment events" on public.payment_events
  for select using (public.is_admin_or_staff());

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

-- Seat labels are row letters + seat number ("A12", "AB3"). Rows are filled
-- left to right, seats_per_row per row, until the sector capacity is reached.
create or replace function public.seat_label_valid(p_label text, p_capacity integer, p_per_row integer)
returns boolean
language plpgsql
immutable
as $$
declare
  v_match text[];
  v_letters text;
  v_row integer;
  v_seat integer;
begin
  v_match := regexp_match(p_label, '^([A-Z]{1,2})([0-9]{1,3})$');
  if v_match is null then
    return false;
  end if;
  v_letters := v_match[1];
  v_seat := v_match[2]::integer;
  if length(v_letters) = 1 then
    v_row := ascii(v_letters) - 65;
  else
    v_row := (ascii(substr(v_letters, 1, 1)) - 64) * 26 + (ascii(substr(v_letters, 2, 1)) - 65);
  end if;
  return v_seat between 1 and p_per_row and v_row * p_per_row + v_seat <= p_capacity;
end;
$$;

create or replace function public.release_expired_holds(p_sector_id uuid default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.seat_holds
     set status = 'released'
   where status = 'held'
     and expires_at < now()
     and (p_sector_id is null or sector_id = p_sector_id);

  update public.orders
     set status = 'expired', updated_at = now()
   where status = 'pending'
     and expires_at < now();
end;
$$;

-- Public availability (no personal data): units taken per active sector.
create or replace function public.get_sector_availability(p_event_id uuid)
returns table (sector_id uuid, capacity integer, taken integer)
language sql
stable
security definer
set search_path = public
as $$
  select s.id,
         s.capacity,
         coalesce((
           select sum(h.quantity)::integer
             from public.seat_holds h
            where h.sector_id = s.id
              and (h.status = 'sold' or (h.status = 'held' and h.expires_at > now()))
         ), 0)
    from public.event_sectors s
   where s.event_id = p_event_id
     and s.is_active;
$$;

create or replace function public.get_taken_seats(p_sector_id uuid)
returns setof text
language sql
stable
security definer
set search_path = public
as $$
  select h.seat_label
    from public.seat_holds h
   where h.sector_id = p_sector_id
     and h.seat_label is not null
     and (h.status = 'sold' or (h.status = 'held' and h.expires_at > now()));
$$;

-- ---------------------------------------------------------------------------
-- create_order: called by the signed-in buyer.
-- p_items: [{ "sector_id": uuid, "quantity": int, "seats": ["A1", ...] }]
-- Prices always come from the database, never from the client.
-- ---------------------------------------------------------------------------

create or replace function public.create_order(p_event_id uuid, p_items jsonb, p_hold_minutes integer default 17)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_email text;
  v_name text;
  v_event public.events;
  v_order public.orders;
  v_item jsonb;
  v_sector public.event_sectors;
  v_qty integer;
  v_seats text[];
  v_seat text;
  v_taken integer;
  v_total_qty integer := 0;
  v_subtotal integer := 0;
  v_expires timestamptz := now() + make_interval(mins => greatest(5, least(p_hold_minutes, 30)));
begin
  if v_user is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'EMPTY_ORDER';
  end if;

  select * into v_event from public.events where id = p_event_id;
  if not found then
    raise exception 'EVENT_NOT_FOUND';
  end if;
  if v_event.status not in ('en-venta', 'casi-agotado') then
    raise exception 'EVENT_NOT_ON_SALE';
  end if;
  if v_event.event_date < now() then
    raise exception 'EVENT_PAST';
  end if;
  if v_event.sale_start is not null and v_event.sale_start > now() then
    raise exception 'SALE_NOT_STARTED';
  end if;

  -- Basic abuse brake; proper rate limiting lives in front of the API.
  if (select count(*) from public.orders where user_id = v_user and created_at > now() - interval '10 minutes') >= 8 then
    raise exception 'TOO_MANY_ATTEMPTS';
  end if;

  select sum((i ->> 'quantity')::integer) into v_total_qty from jsonb_array_elements(p_items) i;
  if v_total_qty is null or v_total_qty < 1 or v_total_qty > coalesce(v_event.max_tickets_per_order, 6) then
    raise exception 'QTY_LIMIT';
  end if;

  -- A new attempt replaces the buyer's previous unpaid order for this event,
  -- so retries never pile up holds.
  update public.seat_holds h
     set status = 'released'
    from public.orders o
   where h.order_id = o.id
     and o.user_id = v_user
     and o.event_id = p_event_id
     and o.status = 'pending'
     and h.status = 'held';
  update public.orders
     set status = 'cancelled', updated_at = now()
   where user_id = v_user
     and event_id = p_event_id
     and status = 'pending';

  select u.email, coalesce(u.raw_user_meta_data ->> 'full_name', '')
    into v_email, v_name
    from auth.users u
   where u.id = v_user;

  insert into public.orders (user_id, event_id, buyer_email, buyer_name, expires_at)
  values (v_user, p_event_id, v_email, nullif(v_name, ''), v_expires)
  returning * into v_order;

  -- Lock sectors in a stable order to avoid deadlocks between concurrent buyers.
  for v_item in
    select i from jsonb_array_elements(p_items) i order by i ->> 'sector_id'
  loop
    v_qty := (v_item ->> 'quantity')::integer;
    if v_qty is null or v_qty < 1 then
      raise exception 'QTY_LIMIT';
    end if;

    select * into v_sector
      from public.event_sectors
     where id = (v_item ->> 'sector_id')::uuid
       and event_id = p_event_id
       and is_active
       for update;
    if not found then
      raise exception 'SECTOR_NOT_FOUND';
    end if;

    perform public.release_expired_holds(v_sector.id);

    if v_sector.numbered then
      v_seats := array(select jsonb_array_elements_text(coalesce(v_item -> 'seats', '[]'::jsonb)));
      if cardinality(v_seats) <> v_qty
         or (select count(distinct s) from unnest(v_seats) s) <> v_qty then
        raise exception 'SEATS_MISMATCH';
      end if;
      foreach v_seat in array v_seats loop
        if not public.seat_label_valid(v_seat, v_sector.capacity, v_sector.seats_per_row) then
          raise exception 'SEAT_INVALID';
        end if;
        begin
          insert into public.seat_holds (order_id, event_id, sector_id, seat_label, quantity, expires_at)
          values (v_order.id, p_event_id, v_sector.id, v_seat, 1, v_expires);
        exception when unique_violation then
          raise exception 'SEAT_TAKEN';
        end;
      end loop;
    else
      v_seats := '{}';
      select coalesce(sum(quantity), 0) into v_taken
        from public.seat_holds
       where sector_id = v_sector.id
         and (status = 'sold' or (status = 'held' and expires_at > now()));
      if v_taken + v_qty > v_sector.capacity then
        raise exception 'SOLD_OUT';
      end if;
      insert into public.seat_holds (order_id, event_id, sector_id, seat_label, quantity, expires_at)
      values (v_order.id, p_event_id, v_sector.id, null, v_qty, v_expires);
    end if;

    insert into public.order_items (order_id, sector_id, sector_name, unit_price, quantity, seat_labels)
    values (v_order.id, v_sector.id, v_sector.name, v_sector.price::integer, v_qty, v_seats);

    v_subtotal := v_subtotal + v_sector.price::integer * v_qty;
  end loop;

  update public.orders
     set subtotal = v_subtotal,
         service_fee = round(v_subtotal * 0.10)::integer,
         total = v_subtotal + round(v_subtotal * 0.10)::integer,
         updated_at = now()
   where id = v_order.id
  returning * into v_order;

  return v_order;
end;
$$;

-- ---------------------------------------------------------------------------
-- Server-only functions (service_role).
-- ---------------------------------------------------------------------------

create or replace function public.attach_flow_payment(p_order_id uuid, p_token text, p_flow_order bigint)
returns void
language sql
security definer
set search_path = public
as $$
  update public.orders
     set flow_token = p_token, flow_order = p_flow_order, updated_at = now()
   where id = p_order_id;
$$;

-- Idempotent: confirming an already-paid order is a no-op. Returns the final order status.
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

  -- Turn holds into sales. A hold may have expired and been released while the
  -- buyer was paying; try to take it back, and flag a refund if someone else
  -- got there first.
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
        insert into public.tickets (order_id, event_id, sector_id, sector_name, seat_label, holder_user_id)
        values (p_order_id, v_order.event_id, v_item.sector_id, v_item.sector_name, v_seat, v_order.user_id);
      end loop;
    else
      for i in 1..v_item.quantity loop
        insert into public.tickets (order_id, event_id, sector_id, sector_name, holder_user_id)
        values (p_order_id, v_order.event_id, v_item.sector_id, v_item.sector_name, v_order.user_id);
      end loop;
    end if;
    update public.event_sectors set sold = sold + v_item.quantity where id = v_item.sector_id;
    v_qty := v_qty + v_item.quantity;
  end loop;

  update public.events set sold = sold + v_qty, updated_at = now() where id = v_order.event_id;

  return 'paid';
end;
$$;

-- Rejected or cancelled at Flow: release the holds. Never touches a paid order.
create or replace function public.fail_order_payment(p_order_id uuid, p_status text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status text;
begin
  if p_status not in ('rejected', 'cancelled') then
    raise exception 'INVALID_STATUS';
  end if;
  update public.orders
     set status = p_status, updated_at = now()
   where id = p_order_id
     and status in ('pending', 'expired')
  returning status into v_status;
  if v_status is not null then
    update public.seat_holds set status = 'released' where order_id = p_order_id and status = 'held';
    return v_status;
  end if;
  select status into v_status from public.orders where id = p_order_id;
  return v_status;
end;
$$;

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------

revoke all on function public.release_expired_holds(uuid) from public, anon, authenticated;
revoke all on function public.create_order(uuid, jsonb, integer) from public, anon;
revoke all on function public.attach_flow_payment(uuid, text, bigint) from public, anon, authenticated;
revoke all on function public.confirm_order_payment(uuid, bigint, integer) from public, anon, authenticated;
revoke all on function public.fail_order_payment(uuid, text) from public, anon, authenticated;

grant execute on function public.get_sector_availability(uuid) to anon, authenticated;
grant execute on function public.get_taken_seats(uuid) to anon, authenticated;
grant execute on function public.create_order(uuid, jsonb, integer) to authenticated;
grant execute on function public.release_expired_holds(uuid) to service_role;
grant execute on function public.attach_flow_payment(uuid, text, bigint) to service_role;
grant execute on function public.confirm_order_payment(uuid, bigint, integer) to service_role;
grant execute on function public.fail_order_payment(uuid, text) to service_role;
