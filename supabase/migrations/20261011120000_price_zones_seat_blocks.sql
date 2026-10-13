-- Fase 5: zonas de precio y bloqueo de asientos.
-- Depends on 20261005120000, 20261006120000, 20261009120000 and 20261010120000.
--
-- A plan seat costs its price zone's price when it has one, and its sector's
-- price otherwise. Zones belong to the event (event_price_zones); seats point
-- to them through event_seats.price_zone_id.
--
--   * create_order charges each plan seat its own price. Seats of one sector
--     with different prices become separate order_items (one per price), so
--     everything downstream (nomination, payment, tickets) keeps working.
--   * update_event_seats lets event editors block/unblock seats (with a
--     reason), assign or clear a price zone and mark seats accessible. Seats
--     that are reserved or sold can't be blocked.
--   * get_event_seat_admin returns the event's plan for the admin editor, with
--     seat ids, live state and block reasons.
--   * get_sector_prices gives the cheapest and most expensive available seat of
--     each sector, so the buyer sees "desde $X".
--   * events.price_base ("desde" on the event cards) follows the zones too.

-- A zone must cost something: a free seat would create an order Flow can't charge.
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'event_price_zones_price_positive') then
    alter table public.event_price_zones add constraint event_price_zones_price_positive check (price > 0);
  end if;
end;
$$;

create index if not exists event_seats_zone_idx on public.event_seats (price_zone_id) where price_zone_id is not null;

-- Price of one seat: its zone's price, or the sector's price.
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
    p_sector.price::integer
  );
$$;

revoke all on function public.seat_price(public.event_sectors, text) from public, anon, authenticated;

-- Cheapest and most expensive seat still free in each active sector. Sectors
-- without plan seats (general admission, old grid) have a single price.
create or replace function public.get_sector_prices(p_event_id uuid)
returns table (sector_id uuid, min_price integer, max_price integer)
language sql
stable
security definer
set search_path = public
as $$
  select es.id,
         coalesce(min(coalesce(z.price, es.price::integer)) filter (where s.id is not null), es.price::integer),
         coalesce(max(coalesce(z.price, es.price::integer)) filter (where s.id is not null), es.price::integer)
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
   group by es.id, es.price;
$$;

-- events.price_base is the "desde" price on the cards: the cheapest seat on sale.
create or replace function public.sync_event_price_base(p_event_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.events
     set price_base = coalesce((select min(p.min_price) from public.get_sector_prices(p_event_id) p where p.min_price > 0), 0)
   where id = p_event_id;
$$;

revoke all on function public.sync_event_price_base(uuid) from public, anon, authenticated;

-- Called by the admin after saving sector prices.
create or replace function public.refresh_event_price_base(p_event_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.staff_permission('eventos') <> 'edit' then
    raise exception 'FORBIDDEN';
  end if;
  perform public.sync_event_price_base(p_event_id);
end;
$$;

create or replace function public.event_price_zones_sync()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.sync_event_price_base(coalesce(new.event_id, old.event_id));
  return null;
end;
$$;

drop trigger if exists event_price_zones_sync on public.event_price_zones;
create trigger event_price_zones_sync
  after insert or update or delete on public.event_price_zones
  for each row execute function public.event_price_zones_sync();

-- Block/unblock seats, set their price zone or their kind. p_changes holds only
-- the keys to change:
--   status: 'AVAILABLE' | 'BLOCKED'      reason: text (when blocking)
--   price_zone_id: uuid | null           kind: 'NORMAL' | 'ACCESSIBLE' | 'OBSTRUCTED'
-- Returns {updated, skipped}: seats reserved or sold are skipped when blocking.
create or replace function public.update_event_seats(p_event_id uuid, p_seat_ids uuid[], p_changes jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status text := p_changes ->> 'status';
  v_kind text := p_changes ->> 'kind';
  v_zone uuid;
  v_reason text := nullif(btrim(coalesce(p_changes ->> 'reason', '')), '');
  v_requested integer;
  v_updated integer;
begin
  if public.staff_permission('eventos') <> 'edit' then
    raise exception 'FORBIDDEN';
  end if;
  if jsonb_typeof(p_changes) <> 'object' or not (p_changes ?| array['status', 'price_zone_id', 'kind']) then
    raise exception 'INVALID_CHANGE';
  end if;
  if p_changes ? 'status' and v_status is distinct from 'AVAILABLE' and v_status is distinct from 'BLOCKED' then
    raise exception 'INVALID_CHANGE';
  end if;
  if p_changes ? 'kind' and (v_kind is null or v_kind not in ('NORMAL', 'ACCESSIBLE', 'OBSTRUCTED')) then
    raise exception 'INVALID_CHANGE';
  end if;
  if v_reason is not null and length(v_reason) > 40 then
    raise exception 'INVALID_CHANGE';
  end if;
  if p_changes ? 'price_zone_id' and jsonb_typeof(p_changes -> 'price_zone_id') <> 'null' then
    begin
      v_zone := (p_changes ->> 'price_zone_id')::uuid;
    exception when others then
      raise exception 'ZONE_NOT_FOUND';
    end;
    if not exists (select 1 from public.event_price_zones where id = v_zone and event_id = p_event_id) then
      raise exception 'ZONE_NOT_FOUND';
    end if;
  end if;

  select count(distinct id) into v_requested from unnest(coalesce(p_seat_ids, '{}')) id;

  update public.event_seats s
     set base_status = case when p_changes ? 'status' then v_status else s.base_status end,
         block_reason = case when not (p_changes ? 'status') then s.block_reason
                             when v_status = 'BLOCKED' then coalesce(v_reason, 'otro')
                             else null end,
         price_zone_id = case when p_changes ? 'price_zone_id' then v_zone else s.price_zone_id end,
         kind = case when p_changes ? 'kind' then v_kind else s.kind end
   where s.event_id = p_event_id
     and s.id = any(p_seat_ids)
     -- A seat someone is paying for or already bought can't be taken off sale.
     and not (v_status = 'BLOCKED' and s.base_status = 'AVAILABLE' and exists (
           select 1 from public.seat_holds h
            where h.sector_id = s.sector_id and h.seat_label = s.label
              and (h.status = 'sold' or (h.status = 'held' and h.expires_at > now()))
         ));
  get diagnostics v_updated = row_count;

  perform public.sync_event_price_base(p_event_id);

  return jsonb_build_object('updated', v_updated, 'skipped', v_requested - v_updated);
end;
$$;

-- The event's plan for the admin seat editor: every sector with a polygon (also
-- those not on sale), seat ids, live state and block reasons.
create or replace function public.get_event_seat_admin(p_event_id uuid)
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
  if not public.is_admin_or_staff() then
    raise exception 'FORBIDDEN';
  end if;
  select * into v_event from public.events where id = p_event_id;
  if not found then
    raise exception 'EVENT_NOT_FOUND';
  end if;
  if v_event.venue_map_id is null then
    return null;
  end if;
  select * into v_map from public.venue_maps where id = v_event.venue_map_id;

  return jsonb_build_object(
    'event_id', p_event_id,
    'title', v_event.title,
    'map_id', v_map.id,
    'venue_id', v_map.venue_id,
    'version', v_map.version,
    'image_path', v_map.image_path,
    'image_width', v_map.image_width,
    'image_height', v_map.image_height,
    'scale_m_per_px', v_map.scale_m_per_px,
    'elements', coalesce((
      select jsonb_agg(jsonb_build_object('kind', e.kind, 'shape', e.shape, 'geometry', e.geometry, 'rotation', e.rotation,
                                          'label', e.label, 'color', e.color) order by e.sort_order)
        from public.venue_map_elements e where e.map_id = v_map.id
    ), '[]'::jsonb),
    'price_zones', coalesce((
      select jsonb_agg(jsonb_build_object('id', z.id, 'name', z.name, 'color', z.color, 'price', z.price) order by z.sort_order, z.created_at)
        from public.event_price_zones z where z.event_id = p_event_id
    ), '[]'::jsonb),
    'sectors', coalesce((
      select jsonb_agg(
               jsonb_build_object(
                 'id', es.id, 'name', es.name, 'numbered', es.numbered, 'is_active', es.is_active,
                 'capacity', es.capacity, 'price', es.price, 'color', es.color, 'polygon', es.polygon,
                 'label_point', es.label_point,
                 -- [id, row_label, label, number, x, y, kind, state, price_zone_id, block_reason]
                 'seats', coalesce((
                   select jsonb_agg(jsonb_build_array(
                            s.id, s.row_label, s.label, s.number, s.x, s.y, s.kind,
                            case when s.base_status = 'BLOCKED' then 'BLOCKED'
                                 when h.sold then 'SOLD'
                                 when h.sold is not null then 'HELD'
                                 else 'AVAILABLE' end,
                            s.price_zone_id, s.block_reason) order by s.sort_order)
                     from public.event_seats s
                     left join (
                       select hh.sector_id, hh.seat_label, bool_or(hh.status = 'sold') as sold
                         from public.seat_holds hh
                        where hh.event_id = p_event_id and hh.seat_label is not null
                          and (hh.status = 'sold' or (hh.status = 'held' and hh.expires_at > now()))
                        group by hh.sector_id, hh.seat_label
                     ) h on h.sector_id = s.sector_id and h.seat_label = s.label
                    where s.sector_id = es.id
                 ), '[]'::jsonb)
               ) order by es.sort_order)
        from public.event_sectors es
       where es.event_id = p_event_id and es.polygon is not null
    ), '[]'::jsonb)
  );
end;
$$;

-- create_order: as in 20261010120000, except that plan seats are charged their
-- own price and grouped into one order item per price.
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
  v_group record;
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

      insert into public.order_items (order_id, sector_id, sector_name, unit_price, quantity, seat_labels)
      values (v_order.id, v_sector.id, v_sector.name, v_sector.price::integer, v_qty, '{}');
      v_subtotal := v_subtotal + v_sector.price::integer * v_qty;
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

revoke all on function public.update_event_seats(uuid, uuid[], jsonb) from public, anon;
revoke all on function public.get_event_seat_admin(uuid) from public, anon;
revoke all on function public.refresh_event_price_base(uuid) from public, anon;
revoke all on function public.event_price_zones_sync() from public, anon, authenticated;

grant execute on function public.update_event_seats(uuid, uuid[], jsonb) to authenticated;
grant execute on function public.get_event_seat_admin(uuid) to authenticated;
grant execute on function public.refresh_event_price_base(uuid) to authenticated;
grant execute on function public.get_sector_prices(uuid) to anon, authenticated;
