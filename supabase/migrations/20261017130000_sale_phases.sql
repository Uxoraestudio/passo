-- Preventas: fases de venta con precio por sector, fechas y cupo.
-- Depends on the base schema and 20261017120000_event_attendees.sql.
--
-- An event can have several sale phases (Preventa 1, Preventa 2…). The active
-- phase is the first one whose dates include now and whose quota is not used
-- up; after the last one the normal (general sale) prices apply.
--
--   * A phase sets a price per sector. A sector without a price in the phase
--     keeps its normal price; seats with a price zone keep the zone price.
--   * Quota counts tickets sold in the phase plus tickets held by orders still
--     being paid. create_order locks the phase row, so two buyers can never
--     go over the quota together.
--   * Presales may open before the general sale (events.sale_start): while a
--     phase is active the event sells even if sale_start is in the future.
--   * Every order remembers the phase it was bought in (orders.sale_phase_id).

create table if not exists public.event_sale_phases (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  name text not null check (length(btrim(name)) between 1 and 40),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  quota integer check (quota is null or quota > 0),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

create index if not exists event_sale_phases_event_idx on public.event_sale_phases (event_id, starts_at);

create table if not exists public.event_phase_prices (
  phase_id uuid not null references public.event_sale_phases (id) on delete cascade,
  sector_id uuid not null references public.event_sectors (id) on delete cascade,
  price integer not null check (price > 0),
  primary key (phase_id, sector_id)
);

alter table public.orders add column if not exists sale_phase_id uuid references public.event_sale_phases (id) on delete set null;

alter table public.event_sale_phases enable row level security;
alter table public.event_phase_prices enable row level security;

-- Phases and their prices are public (the site shows them); only the functions below write.
drop policy if exists "Public reads sale phases" on public.event_sale_phases;
create policy "Public reads sale phases" on public.event_sale_phases for select using (true);
drop policy if exists "Public reads phase prices" on public.event_phase_prices;
create policy "Public reads phase prices" on public.event_phase_prices for select using (true);

-- Tickets taken in a phase: sold, or held by an order still within its time.
create or replace function public.sale_phase_taken(p_phase_id uuid)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(sum(h.quantity), 0)::integer
    from public.seat_holds h
    join public.orders o on o.id = h.order_id
   where o.sale_phase_id = p_phase_id
     and (h.status = 'sold' or (h.status = 'held' and h.expires_at > now()));
$$;

-- The phase on sale right now for an event, or null (general sale prices).
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
   order by p.starts_at, p.sort_order
   limit 1;
$$;

-- What a sector costs right now: the active phase's price, or its normal price.
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
        and pp.phase_id = (public.active_sale_phase(p_sector.event_id)).id),
    p_sector.price::integer
  );
$$;

-- A seat costs its zone's price, or its sector's current price.
create or replace function public.seat_price(p_sector public.event_sectors, p_label text)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select z.price
       from public.event_seats s
       join public.event_price_zones z on z.id = s.price_zone_id
      where s.sector_id = p_sector.id and s.label = p_label),
    public.sector_list_price(p_sector)
  );
$$;

-- Prices per sector for the site: cheapest and dearest free seat at today's
-- prices, and the normal (no presale) cheapest price to show it struck through.
drop function if exists public.get_sector_prices(uuid);
create function public.get_sector_prices(p_event_id uuid)
returns table (sector_id uuid, min_price integer, max_price integer, normal_min_price integer)
language sql
stable
security definer
set search_path = public
as $$
  select es.id,
         coalesce(min(coalesce(z.price, public.sector_list_price(es))) filter (where s.id is not null), public.sector_list_price(es)),
         coalesce(max(coalesce(z.price, public.sector_list_price(es))) filter (where s.id is not null), public.sector_list_price(es)),
         coalesce(min(coalesce(z.price, es.price::integer)) filter (where s.id is not null), es.price::integer)
    from public.event_sectors es
    left join public.event_seats s
      on s.sector_id = es.id
     and s.base_status = 'AVAILABLE'
     and not exists (
           select 1 from public.seat_holds h
            where h.sector_id = s.sector_id and h.seat_label = s.label
              and (h.status = 'sold' or (h.status = 'held' and h.expires_at > now()))
         )
    left join public.event_price_zones z on z.id = s.price_zone_id
   where es.event_id = p_event_id
     and es.is_active
   group by es.id;
$$;

-- The current and next phase of an event, for the site's notices.
create or replace function public.get_sale_phase(p_event_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'current', (
      select jsonb_build_object('id', p.id, 'name', p.name, 'ends_at', p.ends_at, 'quota', p.quota,
                                'remaining', case when p.quota is null then null else greatest(0, p.quota - public.sale_phase_taken(p.id)) end)
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

-- Cheapest price on sale now for several events (the cards), with the phase name.
create or replace function public.get_event_prices(p_event_ids uuid[])
returns table (event_id uuid, min_price integer, normal_min_price integer, phase_name text)
language sql
stable
security definer
set search_path = public
as $$
  select e.id,
         (select min(p.min_price) from public.get_sector_prices(e.id) p where p.min_price > 0),
         (select min(p.normal_min_price) from public.get_sector_prices(e.id) p where p.normal_min_price > 0),
         (public.active_sale_phase(e.id)).name
    from public.events e
   where e.id = any (p_event_ids) and e.status <> 'borrador';
$$;

-- Replaces an event's phases and their prices in one go. p_phases:
--   [{ id?, name, starts_at, ends_at, quota?, prices: { "<sector_id>": price } }]
-- Phases left out are deleted (orders keep their history, without the link).
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
  v_quota integer;
  v_price record;
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

  -- Phases must not overlap: checked in start order.
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
    v_quota := nullif(v_phase ->> 'quota', '')::integer;
    if v_quota is not null and v_quota < 1 then
      raise exception 'PHASE_QUOTA';
    end if;
    v_id := nullif(v_phase ->> 'id', '')::uuid;
    v_order := v_order + 1;

    if v_id is not null and exists (select 1 from public.event_sale_phases where id = v_id and event_id = p_event_id) then
      update public.event_sale_phases
         set name = v_name, starts_at = (v_phase ->> 'starts_at')::timestamptz, ends_at = (v_phase ->> 'ends_at')::timestamptz,
             quota = v_quota, sort_order = v_order
       where id = v_id;
    else
      insert into public.event_sale_phases (event_id, name, starts_at, ends_at, quota, sort_order)
      values (p_event_id, v_name, (v_phase ->> 'starts_at')::timestamptz, (v_phase ->> 'ends_at')::timestamptz, v_quota, v_order)
      returning id into v_id;
    end if;
    v_ids := v_ids || v_id;

    delete from public.event_phase_prices where phase_id = v_id;
    for v_price in select key, value from jsonb_each(coalesce(v_phase -> 'prices', '{}'::jsonb)) loop
      if jsonb_typeof(v_price.value) = 'null' or v_price.value::text = '""' then
        continue;
      end if;
      if not exists (select 1 from public.event_sectors where id = v_price.key::uuid and event_id = p_event_id) then
        raise exception 'SECTOR_NOT_FOUND';
      end if;
      if (v_price.value #>> '{}')::integer < 1 then
        raise exception 'PHASE_PRICE';
      end if;
      insert into public.event_phase_prices (phase_id, sector_id, price)
      values (v_id, v_price.key::uuid, (v_price.value #>> '{}')::integer);
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

-- create_order: as in 20261011120000, plus sale phases. While a phase is
-- active the order is bought in it (its prices, its quota) and may happen
-- before the general sale opens.
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

  if v_phase.id is not null and v_phase.quota is not null
     and public.sale_phase_taken(v_phase.id) + v_total_qty > v_phase.quota then
    raise exception 'PHASE_QUOTA:%', greatest(0, v_phase.quota - public.sale_phase_taken(v_phase.id));
  end if;

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

    if v_sector.numbered then
      v_seats := array(select jsonb_array_elements_text(coalesce(v_item -> 'seats', '[]'::jsonb)));
      if cardinality(v_seats) <> v_qty
         or (select count(distinct s) from unnest(v_seats) s) <> v_qty then
        raise exception 'SEATS_MISMATCH';
      end if;
      foreach v_seat in array v_seats loop
        if not public.seat_is_sellable(v_sector, v_seat) then
          raise exception 'SEAT_INVALID';
        end if;
        begin
          insert into public.seat_holds (order_id, event_id, sector_id, seat_label, quantity, expires_at)
          values (v_order.id, p_event_id, v_sector.id, v_seat, 1, v_expires);
        exception when unique_violation then
          raise exception 'SEAT_TAKEN';
        end;
      end loop;

      -- One order item per price inside the sector.
      for v_group in
        select public.seat_price(v_sector, s) as price, array_agg(s order by s) as seats
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
      insert into public.seat_holds (order_id, event_id, sector_id, seat_label, quantity, expires_at)
      values (v_order.id, p_event_id, v_sector.id, null, v_qty, v_expires);

      v_price := public.sector_list_price(v_sector);
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

-- The seat map shows each sector at today's price (presale or normal).
create or replace function public.get_event_seat_map(p_event_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_event public.events;
  v_map public.venue_maps;
begin
  select * into v_event from public.events where id = p_event_id;
  if not found then
    raise exception 'EVENT_NOT_FOUND';
  end if;
  if v_event.status = 'borrador' and not public.is_admin_or_staff() then
    raise exception 'FORBIDDEN';
  end if;
  if v_event.venue_map_id is null then
    return null;
  end if;
  select * into v_map from public.venue_maps where id = v_event.venue_map_id;

  return jsonb_build_object(
    'event_id', p_event_id,
    'map_id', v_map.id,
    'version', v_map.version,
    'image_path', v_map.image_path,
    'image_width', v_map.image_width,
    'image_height', v_map.image_height,
    'elements', coalesce((
      select jsonb_agg(jsonb_build_object('kind', e.kind, 'shape', e.shape, 'geometry', e.geometry, 'rotation', e.rotation,
                                          'label', e.label, 'color', e.color) order by e.sort_order)
        from public.venue_map_elements e where e.map_id = v_map.id
    ), '[]'::jsonb),
    'price_zones', coalesce((
      select jsonb_agg(jsonb_build_object('id', z.id, 'name', z.name, 'color', z.color, 'price', z.price) order by z.sort_order)
        from public.event_price_zones z where z.event_id = p_event_id
    ), '[]'::jsonb),
    'sectors', coalesce((
      select jsonb_agg(
               jsonb_build_object(
                 'id', es.id, 'name', es.name, 'short_label', es.short_label, 'numbered', es.numbered,
                 'capacity', es.capacity, 'price', public.sector_list_price(es), 'normal_price', es.price, 'color', es.color, 'polygon', es.polygon,
                 'label_point', es.label_point, 'price_zone_id', es.price_zone_id,
                 -- [row_label, label, number, x, y, kind, state, price_zone_id]
                 'seats', coalesce((
                   select jsonb_agg(jsonb_build_array(
                            s.row_label, s.label, s.number, s.x, s.y, s.kind,
                            case when s.base_status = 'BLOCKED' then 'BLOCKED'
                                 when h.sold then 'SOLD'
                                 when h.sold is not null then 'HELD'
                                 else 'AVAILABLE' end,
                            s.price_zone_id) order by s.sort_order)
                     from public.event_seats s
                     left join (
                       select sector_id, seat_label, bool_or(status = 'sold') as sold
                         from public.seat_holds
                        where event_id = p_event_id and seat_label is not null
                          and (status = 'sold' or (status = 'held' and expires_at > now()))
                        group by sector_id, seat_label
                     ) h on h.sector_id = s.sector_id and h.seat_label = s.label
                    where s.sector_id = es.id
                 ), '[]'::jsonb)
               ) order by es.sort_order)
        from public.event_sectors es
       where es.event_id = p_event_id and es.is_active and es.polygon is not null
    ), '[]'::jsonb)
  );
end;
$$;

revoke all on function public.sale_phase_taken(uuid) from public, anon, authenticated;
revoke all on function public.active_sale_phase(uuid) from public, anon, authenticated;
revoke all on function public.sector_list_price(public.event_sectors) from public, anon, authenticated;
revoke all on function public.seat_price(public.event_sectors, text) from public, anon, authenticated;
revoke all on function public.save_sale_phases(uuid, jsonb) from public, anon;

grant execute on function public.get_sector_prices(uuid) to anon, authenticated;
grant execute on function public.get_sale_phase(uuid) to anon, authenticated;
grant execute on function public.get_event_prices(uuid[]) to anon, authenticated;
grant execute on function public.save_sale_phases(uuid, jsonb) to authenticated;

-- New Supabase projects grant EXECUTE to anon and authenticated by default.
revoke execute on function public.sale_phase_taken(uuid) from anon, authenticated;
revoke execute on function public.active_sale_phase(uuid) from anon, authenticated;
revoke execute on function public.sector_list_price(public.event_sectors) from anon, authenticated;
revoke execute on function public.seat_price(public.event_sectors, text) from anon, authenticated;
revoke execute on function public.save_sale_phases(uuid, jsonb) from anon;
