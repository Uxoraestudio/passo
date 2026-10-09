-- Fase 7: compra de asientos del plano.
-- Depends on 20261005120000, 20261006120000, 20261008120000 and 20261009120000.
--
-- Events that use a venue plan have their seats in event_seats. Until now,
-- create_order and issue_courtesy validated numbered seats against the old
-- grid (rows of seats_per_row up to capacity), so plan seats such as "PB-A12"
-- were rejected. Both now use the event's plan seats when the sector has them
-- (the seat must exist and not be blocked) and keep the grid otherwise.
-- Bodies are unchanged except for that check.

-- True when a numbered seat may be sold in this sector.
create or replace function public.seat_is_sellable(p_sector public.event_sectors, p_label text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select case
           when exists (select 1 from public.event_seats where sector_id = p_sector.id) then
             exists (select 1 from public.event_seats where sector_id = p_sector.id and label = p_label and base_status = 'AVAILABLE')
           else public.seat_label_valid(p_label, p_sector.capacity, p_sector.seats_per_row)
         end;
$$;

revoke all on function public.seat_is_sellable(public.event_sectors, text) from public, anon, authenticated;

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

  if v_sector.numbered and exists (select 1 from public.event_seats where sector_id = v_sector.id) then
    -- Seats from the venue plan: the first free, unblocked seats in plan order.
    select coalesce(array_agg(label order by sort_order), '{}') into v_seats
      from (
        select es.label, es.sort_order
          from public.event_seats es
         where es.sector_id = v_sector.id
           and es.base_status = 'AVAILABLE'
           and not exists (
             select 1 from public.seat_holds h
              where h.sector_id = es.sector_id and h.seat_label = es.label
                and (h.status = 'sold' or (h.status = 'held' and h.expires_at > now()))
           )
         order by es.sort_order
         limit p_quantity
      ) free;
    if cardinality(v_seats) < p_quantity then
      raise exception 'SOLD_OUT';
    end if;
    foreach v_seat in array v_seats loop
      insert into public.seat_holds (order_id, event_id, sector_id, seat_label, quantity, status, expires_at)
      values (v_order.id, p_event_id, v_sector.id, v_seat, 1, 'sold', now());
    end loop;
  elsif v_sector.numbered then
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

-- Availability now also counts plan seats that are blocked (production, press,
-- courtesies…): they can't be sold, so they are not available either.
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
         + coalesce((
           select count(*)::integer
             from public.event_seats es
            where es.sector_id = s.id and es.base_status = 'BLOCKED'
         ), 0)
    from public.event_sectors s
   where s.event_id = p_event_id
     and s.is_active;
$$;
