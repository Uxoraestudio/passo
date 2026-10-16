-- Preventas: cupo por sector, y cupo contado por entrada vendida a precio de preventa.
-- Depends on 20261017130000_sale_phases.sql.
--
-- Each presale chooses how its quota works:
--   * general: one quota for the whole presale (event_sale_phases.quota).
--   * sector:  a quota per sector (event_phase_prices.quota). When a sector's
--              presale tickets run out, that sector goes back to its normal
--              price while the others keep the presale price.
-- Quotas count only tickets actually bought at the presale price: each hold
-- remembers it (seat_holds.sale_phase_id). Seats with a price zone keep the
-- zone's price and don't use presale quota.
--
-- create_order fixes each sector's price before placing this order's holds,
-- so the order that takes the last presale tickets still pays the presale price.

alter table public.event_sale_phases add column if not exists quota_mode text not null default 'general';
alter table public.event_sale_phases drop constraint if exists event_sale_phases_quota_mode_check;
alter table public.event_sale_phases add constraint event_sale_phases_quota_mode_check check (quota_mode in ('general', 'sector'));

alter table public.event_phase_prices add column if not exists quota integer;
alter table public.event_phase_prices drop constraint if exists event_phase_prices_quota_check;
alter table public.event_phase_prices add constraint event_phase_prices_quota_check check (quota is null or quota > 0);

alter table public.seat_holds add column if not exists sale_phase_id uuid references public.event_sale_phases (id) on delete set null;
create index if not exists seat_holds_sale_phase_idx on public.seat_holds (sale_phase_id, sector_id) where sale_phase_id is not null;

-- Holds of orders bought before this migration: those in a phase sector were presale tickets.
update public.seat_holds h
   set sale_phase_id = o.sale_phase_id
  from public.orders o
 where o.id = h.order_id and o.sale_phase_id is not null and h.sale_phase_id is null
   and exists (select 1 from public.event_phase_prices pp where pp.phase_id = o.sale_phase_id and pp.sector_id = h.sector_id);

-- Presale tickets taken in a phase: sold, or held by an order still within its time.
create or replace function public.sale_phase_taken(p_phase_id uuid)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(sum(h.quantity), 0)::integer
    from public.seat_holds h
   where h.sale_phase_id = p_phase_id
     and (h.status = 'sold' or (h.status = 'held' and h.expires_at > now()));
$$;

create or replace function public.sale_phase_sector_taken(p_phase_id uuid, p_sector_id uuid)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(sum(h.quantity), 0)::integer
    from public.seat_holds h
   where h.sale_phase_id = p_phase_id and h.sector_id = p_sector_id
     and (h.status = 'sold' or (h.status = 'held' and h.expires_at > now()));
$$;

-- On sale now: within its dates, general quota not used up, and at least one
-- sector still has presale tickets.
create or replace function public.active_sale_phase(p_event_id uuid)
returns public.event_sale_phases
language sql
stable
security definer
set search_path = public
as $$
  select p.*
    from public.event_sale_phases p
   where p.event_id = p_event_id
     and p.starts_at <= now() and now() < p.ends_at
     and (p.quota is null or public.sale_phase_taken(p.id) < p.quota)
     and exists (
           select 1 from public.event_phase_prices pp
            where pp.phase_id = p.id
              and (pp.quota is null or public.sale_phase_sector_taken(p.id, pp.sector_id) < pp.quota)
         )
   order by p.starts_at, p.sort_order
   limit 1;
$$;

-- What a sector costs right now: the active phase's price while its sector quota lasts.
create or replace function public.sector_list_price(p_sector public.event_sectors)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select pp.price
       from public.event_phase_prices pp
      where pp.sector_id = p_sector.id
        and pp.phase_id = (public.active_sale_phase(p_sector.event_id)).id
        and (pp.quota is null or public.sale_phase_sector_taken(pp.phase_id, pp.sector_id) < pp.quota)),
    p_sector.price::integer
  );
$$;

-- Same result as before, but each sector's price is worked out once, not per seat.
create or replace function public.get_sector_prices(p_event_id uuid)
returns table (sector_id uuid, min_price integer, max_price integer, normal_min_price integer)
language sql
stable
security definer
set search_path = public
as $$
  with sec as (
    select es.id, es.price::integer as normal, public.sector_list_price(es) as list
      from public.event_sectors es
     where es.event_id = p_event_id and es.is_active
  )
  select sec.id,
         coalesce(min(coalesce(z.price, sec.list)) filter (where s.id is not null), sec.list),
         coalesce(max(coalesce(z.price, sec.list)) filter (where s.id is not null), sec.list),
         coalesce(min(coalesce(z.price, sec.normal)) filter (where s.id is not null), sec.normal)
    from sec
    left join public.event_seats s
      on s.sector_id = sec.id
     and s.base_status = 'AVAILABLE'
     and not exists (
           select 1 from public.seat_holds h
            where h.sector_id = s.sector_id and h.seat_label = s.label
              and (h.status = 'sold' or (h.status = 'held' and h.expires_at > now()))
         )
    left join public.event_price_zones z on z.id = s.price_zone_id
   group by sec.id, sec.list, sec.normal;
$$;

-- Current and next phase, with what's left per sector when quotas are per sector.
create or replace function public.get_sale_phase(p_event_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'current', (
      select jsonb_build_object(
               'id', p.id, 'name', p.name, 'ends_at', p.ends_at, 'quota', p.quota, 'quota_mode', p.quota_mode,
               'remaining', case when p.quota is null then null else greatest(0, p.quota - public.sale_phase_taken(p.id)) end,
               'sectors', coalesce((
                 select jsonb_agg(jsonb_build_object(
                          'sector_id', pp.sector_id, 'quota', pp.quota,
                          'remaining', case when pp.quota is null then null
                                            else greatest(0, pp.quota - public.sale_phase_sector_taken(p.id, pp.sector_id)) end))
                   from public.event_phase_prices pp where pp.phase_id = p.id
               ), '[]'::jsonb))
        from public.active_sale_phase(p_event_id) p
       where p.id is not null
    ),
    'next', (
      select jsonb_build_object('name', p.name, 'starts_at', p.starts_at)
        from public.event_sale_phases p
       where p.event_id = p_event_id and p.starts_at > now()
       order by p.starts_at
       limit 1
    )
  );
$$;

-- Presale tickets per phase and sector, for the admin's counters.
create or replace function public.sale_phase_usage(p_event_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if public.staff_permission('eventos') not in ('view', 'edit') then
    raise exception 'FORBIDDEN';
  end if;
  return coalesce((
    select jsonb_object_agg(p.id, jsonb_build_object(
             'sold', (select coalesce(sum(h.quantity), 0) from public.seat_holds h where h.sale_phase_id = p.id and h.status = 'sold'),
             'taken', public.sale_phase_taken(p.id),
             'sectors', coalesce((
               select jsonb_object_agg(pp.sector_id, public.sale_phase_sector_taken(p.id, pp.sector_id))
                 from public.event_phase_prices pp where pp.phase_id = p.id
             ), '{}'::jsonb)))
      from public.event_sale_phases p
     where p.event_id = p_event_id
  ), '{}'::jsonb);
end;
$$;

-- Replaces an event's phases. p_phases:
--   [{ id?, name, starts_at, ends_at, quota_mode: 'general'|'sector', quota?,
--      prices: { "<sector_id>": price | { price, quota? } } }]
-- In 'general' mode sector quotas are ignored; in 'sector' mode the phase quota is.
create or replace function public.save_sale_phases(p_event_id uuid, p_phases jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_phase jsonb;
  v_id uuid;
  v_ids uuid[] := '{}';
  v_start timestamptz;
  v_end timestamptz;
  v_prev_end timestamptz;
  v_name text;
  v_mode text;
  v_quota integer;
  v_price record;
  v_amount integer;
  v_sector_quota integer;
  v_order integer := 0;
begin
  if public.staff_permission('eventos') <> 'edit' then
    raise exception 'FORBIDDEN';
  end if;
  if not exists (select 1 from public.events where id = p_event_id) then
    raise exception 'EVENT_NOT_FOUND';
  end if;
  if jsonb_typeof(p_phases) <> 'array' or jsonb_array_length(p_phases) > 10 then
    raise exception 'PHASES_INVALID';
  end if;

  for v_phase in select x from jsonb_array_elements(p_phases) x order by (x ->> 'starts_at')::timestamptz loop
    v_start := (v_phase ->> 'starts_at')::timestamptz;
    v_end := (v_phase ->> 'ends_at')::timestamptz;
    if v_start is null or v_end is null or v_end <= v_start then
      raise exception 'PHASE_DATES';
    end if;
    if v_prev_end is not null and v_start < v_prev_end then
      raise exception 'PHASES_OVERLAP';
    end if;
    v_prev_end := v_end;
  end loop;

  for v_phase in select x from jsonb_array_elements(p_phases) x order by (x ->> 'starts_at')::timestamptz loop
    v_name := btrim(coalesce(v_phase ->> 'name', ''));
    if length(v_name) not between 1 and 40 then
      raise exception 'PHASE_NAME';
    end if;
    v_mode := coalesce(nullif(v_phase ->> 'quota_mode', ''), 'general');
    if v_mode not in ('general', 'sector') then
      raise exception 'PHASES_INVALID';
    end if;
    v_quota := case when v_mode = 'general' then nullif(v_phase ->> 'quota', '')::integer end;
    if v_quota is not null and v_quota < 1 then
      raise exception 'PHASE_QUOTA';
    end if;
    v_id := nullif(v_phase ->> 'id', '')::uuid;
    v_order := v_order + 1;

    if v_id is not null and exists (select 1 from public.event_sale_phases where id = v_id and event_id = p_event_id) then
      update public.event_sale_phases
         set name = v_name, starts_at = (v_phase ->> 'starts_at')::timestamptz, ends_at = (v_phase ->> 'ends_at')::timestamptz,
             quota = v_quota, quota_mode = v_mode, sort_order = v_order
       where id = v_id;
    else
      insert into public.event_sale_phases (event_id, name, starts_at, ends_at, quota, quota_mode, sort_order)
      values (p_event_id, v_name, (v_phase ->> 'starts_at')::timestamptz, (v_phase ->> 'ends_at')::timestamptz, v_quota, v_mode, v_order)
      returning id into v_id;
    end if;
    v_ids := v_ids || v_id;

    delete from public.event_phase_prices where phase_id = v_id;
    for v_price in select key, value from jsonb_each(coalesce(v_phase -> 'prices', '{}'::jsonb)) loop
      if jsonb_typeof(v_price.value) = 'object' then
        v_amount := nullif(v_price.value ->> 'price', '')::integer;
        v_sector_quota := case when v_mode = 'sector' then nullif(v_price.value ->> 'quota', '')::integer end;
      elsif jsonb_typeof(v_price.value) = 'null' or v_price.value::text = '""' then
        continue;
      else
        v_amount := (v_price.value #>> '{}')::integer;
        v_sector_quota := null;
      end if;
      if v_amount is null then
        continue;
      end if;
      if not exists (select 1 from public.event_sectors where id = v_price.key::uuid and event_id = p_event_id) then
        raise exception 'SECTOR_NOT_FOUND';
      end if;
      if v_amount < 1 then
        raise exception 'PHASE_PRICE';
      end if;
      if v_sector_quota is not null and v_sector_quota < 1 then
        raise exception 'PHASE_QUOTA';
      end if;
      insert into public.event_phase_prices (phase_id, sector_id, price, quota)
      values (v_id, v_price.key::uuid, v_amount, v_sector_quota);
    end loop;
  end loop;

  delete from public.event_sale_phases where event_id = p_event_id and not (id = any (v_ids));
  perform public.sync_event_price_base(p_event_id);

  return coalesce((
    select jsonb_agg(jsonb_build_object('id', p.id, 'name', p.name) order by p.starts_at)
      from public.event_sale_phases p where p.event_id = p_event_id
  ), '[]'::jsonb);
end;
$$;

-- create_order: as in 20261017130000, with per-sector quotas and prices fixed
-- before the order's own holds are placed.
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
  v_phase public.event_sale_phases;
  v_group record;
  v_qty integer;
  v_seats text[];
  v_seat text;
  v_taken integer;
  v_price integer;
  v_list integer;
  v_phase_price public.event_phase_prices;
  v_presale integer;
  v_left integer;
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

  -- The active phase, locked: concurrent buyers wait here, so its quota holds.
  v_phase := public.active_sale_phase(p_event_id);
  if v_phase.id is not null then
    perform 1 from public.event_sale_phases where id = v_phase.id for update;
    v_phase := public.active_sale_phase(p_event_id);
  end if;

  if v_phase.id is null and v_event.sale_start is not null and v_event.sale_start > now() then
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

  insert into public.orders (user_id, event_id, buyer_email, buyer_name, expires_at, sale_phase_id)
  values (v_user, p_event_id, v_email, nullif(v_name, ''), v_expires, v_phase.id)
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

    -- Today's price for the sector, fixed before any hold of this order counts
    -- toward a quota: the presale price while its quotas last, else the normal one.
    v_phase_price := null;
    if v_phase.id is not null then
      select * into v_phase_price from public.event_phase_prices
       where phase_id = v_phase.id and sector_id = v_sector.id
         and (quota is null or public.sale_phase_sector_taken(v_phase.id, v_sector.id) < quota);
    end if;
    v_list := coalesce(v_phase_price.price, v_sector.price::integer);

    if v_sector.numbered then
      v_seats := array(select jsonb_array_elements_text(coalesce(v_item -> 'seats', '[]'::jsonb)));
    end if;
    -- Tickets bought at the presale price (seats with a price zone keep the zone price).
    v_presale := case
      when v_phase_price.phase_id is null then 0
      when v_sector.numbered then (
        select count(*) from unnest(v_seats) as u (seat_label)
         where not exists (select 1 from public.event_seats s where s.sector_id = v_sector.id and s.label = u.seat_label and s.price_zone_id is not null))
      else v_qty end;

    if v_presale > 0 and v_phase_price.quota is not null then
      v_left := v_phase_price.quota - public.sale_phase_sector_taken(v_phase.id, v_sector.id);
      if v_presale > v_left then
        raise exception 'PHASE_SECTOR_QUOTA:%:%', v_sector.name, greatest(0, v_left);
      end if;
    end if;
    if v_presale > 0 and v_phase.quota is not null then
      v_left := v_phase.quota - public.sale_phase_taken(v_phase.id);
      if v_presale > v_left then
        raise exception 'PHASE_QUOTA:%', greatest(0, v_left);
      end if;
    end if;

    if v_sector.numbered then
      if cardinality(v_seats) <> v_qty
         or (select count(distinct s) from unnest(v_seats) s) <> v_qty then
        raise exception 'SEATS_MISMATCH';
      end if;
      foreach v_seat in array v_seats loop
        if not public.seat_is_sellable(v_sector, v_seat) then
          raise exception 'SEAT_INVALID';
        end if;
        begin
          insert into public.seat_holds (order_id, event_id, sector_id, seat_label, quantity, expires_at, sale_phase_id)
          values (v_order.id, p_event_id, v_sector.id, v_seat, 1, v_expires,
                  case when v_phase_price.phase_id is not null
                        and not exists (select 1 from public.event_seats s where s.sector_id = v_sector.id and s.label = v_seat and s.price_zone_id is not null)
                       then v_phase.id end);
        exception when unique_violation then
          raise exception 'SEAT_TAKEN';
        end;
      end loop;

      -- One order item per price inside the sector.
      for v_group in
        select coalesce(
                 (select z.price from public.event_seats es join public.event_price_zones z on z.id = es.price_zone_id
                   where es.sector_id = v_sector.id and es.label = s),
                 v_list) as price,
               array_agg(s order by s) as seats
          from unnest(v_seats) s
         group by 1
         order by 1
      loop
        insert into public.order_items (order_id, sector_id, sector_name, unit_price, quantity, seat_labels)
        values (v_order.id, v_sector.id, v_sector.name, v_group.price, cardinality(v_group.seats), v_group.seats);
        v_subtotal := v_subtotal + v_group.price * cardinality(v_group.seats);
      end loop;
    else
      select coalesce(sum(quantity), 0) into v_taken
        from public.seat_holds
       where sector_id = v_sector.id
         and (status = 'sold' or (status = 'held' and expires_at > now()));
      if v_taken + v_qty > v_sector.capacity then
        raise exception 'SOLD_OUT';
      end if;
      insert into public.seat_holds (order_id, event_id, sector_id, seat_label, quantity, expires_at, sale_phase_id)
      values (v_order.id, p_event_id, v_sector.id, null, v_qty, v_expires, case when v_phase_price.phase_id is not null then v_phase.id end);

      v_price := v_list;
      insert into public.order_items (order_id, sector_id, sector_name, unit_price, quantity, seat_labels)
      values (v_order.id, v_sector.id, v_sector.name, v_price, v_qty, '{}');
      v_subtotal := v_subtotal + v_price * v_qty;
    end if;
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

revoke all on function public.sale_phase_sector_taken(uuid, uuid) from public, anon, authenticated;
revoke all on function public.sale_phase_usage(uuid) from public, anon;
grant execute on function public.sale_phase_usage(uuid) to authenticated;
grant execute on function public.get_sector_prices(uuid) to anon, authenticated;
grant execute on function public.get_sale_phase(uuid) to anon, authenticated;

-- New Supabase projects grant EXECUTE to anon and authenticated by default.
revoke execute on function public.sale_phase_sector_taken(uuid, uuid) from anon, authenticated;
revoke execute on function public.sale_phase_taken(uuid) from anon, authenticated;
revoke execute on function public.active_sale_phase(uuid) from anon, authenticated;
revoke execute on function public.sector_list_price(public.event_sectors) from anon, authenticated;
revoke execute on function public.sale_phase_usage(uuid) from anon;
revoke execute on function public.save_sale_phases(uuid, jsonb) from anon;
