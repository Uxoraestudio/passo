-- Herramientas de eventos: borrar eventos y recintos, cupones de descuento,
-- nominación opcional e imagen del hero para teléfonos.
-- Depends on the base schema (save_order_details, begin_order_payment as in the baseline).

-- ---------------------------------------------------------------------------
-- 1. Event settings: ticket nomination on/off and the hero image for phones.
-- ---------------------------------------------------------------------------

alter table public.events add column if not exists nominate_tickets boolean not null default true;
alter table public.events add column if not exists hero_mobile_image_url text;

-- ---------------------------------------------------------------------------
-- 2. Deleting events. An event with paid orders (sales or courtesies) is only
--    deleted when the caller repeats its exact title, so real sales are never
--    lost to a single click. Everything hanging from the event goes with it.
-- ---------------------------------------------------------------------------

create or replace function public.delete_event(p_event_id uuid, p_confirm_title text default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event public.events;
  v_paid integer;
  v_tickets integer;
begin
  if public.staff_permission('eventos') <> 'edit' then
    raise exception 'FORBIDDEN';
  end if;
  select * into v_event from public.events where id = p_event_id for update;
  if not found then
    raise exception 'EVENT_NOT_FOUND';
  end if;

  select count(*) into v_paid from public.orders where event_id = p_event_id and status in ('paid', 'refund_required');
  if v_paid > 0 and lower(btrim(coalesce(p_confirm_title, ''))) <> lower(btrim(v_event.title)) then
    raise exception 'EVENT_HAS_SALES:%', v_paid;
  end if;

  select count(*) into v_tickets from public.tickets where event_id = p_event_id;
  -- Tickets block their orders; orders take items, holds and attendees with them;
  -- the event takes sectors, seats, zones, presales, coupons and door scans.
  delete from public.tickets where event_id = p_event_id;
  delete from public.seat_holds where event_id = p_event_id;
  delete from public.orders where event_id = p_event_id;
  delete from public.events where id = p_event_id;

  return jsonb_build_object('title', v_event.title, 'paid_orders', v_paid, 'tickets', v_tickets);
end;
$$;

-- Venues can go only when no event uses them (or one of their plan versions).
create or replace function public.delete_venue(p_venue_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_events text;
begin
  if public.staff_permission('eventos') <> 'edit' then
    raise exception 'FORBIDDEN';
  end if;
  if not exists (select 1 from public.venues where id = p_venue_id) then
    raise exception 'VENUE_NOT_FOUND';
  end if;
  select string_agg(e.title, ', ' order by e.event_date) into v_events
    from public.events e
   where e.venue_id = p_venue_id
      or e.venue_map_id in (select m.id from public.venue_maps m where m.venue_id = p_venue_id);
  if v_events is not null then
    raise exception 'VENUE_IN_USE:%', v_events;
  end if;
  update public.venues set published_map_id = null where id = p_venue_id;
  delete from public.venues where id = p_venue_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- 3. Discount coupons per event.
-- ---------------------------------------------------------------------------

create table if not exists public.event_coupons (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  code text not null check (code ~ '^[A-Z0-9_-]{3,30}$'),
  kind text not null check (kind in ('percent', 'amount')),
  value integer not null check (value > 0),
  max_uses integer check (max_uses is null or max_uses > 0),
  starts_at timestamptz,
  ends_at timestamptz,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (event_id, code),
  check (kind <> 'percent' or value <= 100),
  check (ends_at is null or starts_at is null or ends_at > starts_at)
);

alter table public.event_coupons enable row level security;

-- Staff manage coupons; buyers never list them (they only apply a code they know).
drop policy if exists "Staff read coupons" on public.event_coupons;
create policy "Staff read coupons" on public.event_coupons for select
  using (public.staff_permission('eventos') in ('view', 'edit'));
drop policy if exists "Staff manage coupons" on public.event_coupons;
create policy "Staff manage coupons" on public.event_coupons for all
  using (public.staff_permission('eventos') = 'edit')
  with check (public.staff_permission('eventos') = 'edit');

alter table public.orders add column if not exists coupon_id uuid references public.event_coupons (id) on delete set null;
alter table public.orders add column if not exists coupon_code text;
alter table public.orders add column if not exists discount integer not null default 0 check (discount >= 0);

-- Uses of a coupon: paid orders plus orders still being paid (they hold the coupon).
create or replace function public.coupon_uses(p_coupon_id uuid, p_except_order uuid default null)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::integer
    from public.orders o
   where o.coupon_id = p_coupon_id
     and (p_except_order is null or o.id <> p_except_order)
     and (o.status = 'paid' or (o.status = 'pending' and o.expires_at > now()));
$$;

-- Applies (or with an empty code, removes) a coupon on the buyer's pending order
-- and recalculates the totals. The service fee is charged on the discounted
-- subtotal. Flow needs a payable amount, so a coupon can't bring the total
-- below $1.000.
create or replace function public.apply_order_coupon(p_order_id uuid, p_code text)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders;
  v_coupon public.event_coupons;
  v_code text := upper(btrim(coalesce(p_code, '')));
  v_discount integer := 0;
  v_fee integer;
  v_total integer;
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

  if v_code <> '' then
    select * into v_coupon from public.event_coupons
     where event_id = v_order.event_id and code = v_code
       for update;
    if not found then
      raise exception 'COUPON_NOT_FOUND';
    end if;
    if not v_coupon.active
       or (v_coupon.starts_at is not null and v_coupon.starts_at > now())
       or (v_coupon.ends_at is not null and v_coupon.ends_at <= now()) then
      raise exception 'COUPON_INACTIVE';
    end if;
    if v_coupon.max_uses is not null and public.coupon_uses(v_coupon.id, v_order.id) >= v_coupon.max_uses then
      raise exception 'COUPON_USED_UP';
    end if;
    v_discount := case when v_coupon.kind = 'percent'
                       then round(v_order.subtotal * v_coupon.value / 100.0)::integer
                       else least(v_coupon.value, v_order.subtotal) end;
  end if;

  v_fee := round((v_order.subtotal - v_discount) * 0.10)::integer;
  v_total := v_order.subtotal - v_discount + v_fee;
  if v_code <> '' and v_total < 1000 then
    raise exception 'COUPON_TOO_LARGE';
  end if;

  update public.orders
     set coupon_id = v_coupon.id,
         coupon_code = nullif(v_code, ''),
         discount = v_discount,
         service_fee = v_fee,
         total = v_total,
         updated_at = now()
   where id = p_order_id
  returning * into v_order;
  return v_order;
end;
$$;

-- Admin counters: uses and money discounted per coupon (paid orders).
create or replace function public.event_coupon_stats(p_event_id uuid)
returns table (coupon_id uuid, paid_uses integer, pending_uses integer, discount_total integer)
language sql
stable
security definer
set search_path = public
as $$
  select c.id,
         count(*) filter (where o.status = 'paid')::integer,
         count(*) filter (where o.status = 'pending' and o.expires_at > now())::integer,
         coalesce(sum(o.discount) filter (where o.status = 'paid'), 0)::integer
    from public.event_coupons c
    left join public.orders o on o.coupon_id = c.id
   where c.event_id = p_event_id
     and public.staff_permission('eventos') in ('view', 'edit')
   group by c.id;
$$;

-- ---------------------------------------------------------------------------
-- 4. Checkout with optional nomination. When the event doesn't nominate
--    tickets only the buyer's details are required; tickets are issued without
--    a holder (they belong to whoever carries the QR).
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

  -- Event without nomination: the buyer's details are all that's needed.
  if not (select nominate_tickets from public.events where id = v_order.event_id) then
    delete from public.order_attendees where order_id = p_order_id;
    return;
  end if;

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
  if v_order.buyer_document is null
     or ((select nominate_tickets from public.events where id = v_order.event_id)
         and (select count(*) from public.order_attendees where order_id = p_order_id) <> v_total) then
    raise exception 'DETAILS_MISSING';
  end if;

  -- A coupon that ran out or was switched off since it was applied is dropped.
  if v_order.coupon_id is not null and not exists (
       select 1 from public.event_coupons c
        where c.id = v_order.coupon_id and c.active
          and (c.ends_at is null or c.ends_at > now())
          and (c.max_uses is null or public.coupon_uses(c.id, v_order.id) < c.max_uses)) then
    raise exception 'COUPON_INACTIVE';
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
-- Grants. New Supabase projects grant EXECUTE to anon/authenticated by default.
-- ---------------------------------------------------------------------------

revoke all on function public.delete_event(uuid, text) from public, anon;
revoke all on function public.delete_venue(uuid) from public, anon;
revoke all on function public.coupon_uses(uuid, uuid) from public, anon, authenticated;
revoke all on function public.apply_order_coupon(uuid, text) from public, anon;
revoke all on function public.event_coupon_stats(uuid) from public, anon;
revoke all on function public.save_order_details(uuid, jsonb, jsonb) from public, anon;
revoke all on function public.begin_order_payment(uuid, integer) from public, anon, authenticated;

grant execute on function public.delete_event(uuid, text) to authenticated;
grant execute on function public.delete_venue(uuid) to authenticated;
grant execute on function public.apply_order_coupon(uuid, text) to authenticated;
grant execute on function public.event_coupon_stats(uuid) to authenticated;
grant execute on function public.save_order_details(uuid, jsonb, jsonb) to authenticated;
grant execute on function public.begin_order_payment(uuid, integer) to service_role;

revoke execute on function public.delete_event(uuid, text) from anon;
revoke execute on function public.delete_venue(uuid) from anon;
revoke execute on function public.coupon_uses(uuid, uuid) from anon, authenticated;
revoke execute on function public.apply_order_coupon(uuid, text) from anon;
revoke execute on function public.event_coupon_stats(uuid) from anon;
revoke execute on function public.save_order_details(uuid, jsonb, jsonb) from anon;
revoke execute on function public.begin_order_payment(uuid, integer) from anon, authenticated;
