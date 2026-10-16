-- Esquema completo de la base de datos de Passo / Aforiq (2026-10-16).
--
-- Copia exacta de la estructura con la que se creó el proyecto de Supabase del
-- cliente (São Paulo): tablas, funciones, políticas RLS, el trigger que crea el
-- perfil al registrarse, los buckets de imágenes con sus políticas y los
-- permisos de cada función. No incluye datos.
--
-- Sirve para crear un proyecto nuevo desde cero (en el SQL Editor o con psql).
-- Las tablas base se crearon originalmente a mano y no están en
-- supabase/migrations; las migraciones de esa carpeta ya están incluidas aquí.
-- No está en supabase/migrations a propósito: la integración de GitHub de
-- Supabase la intentaría aplicar sobre una base que ya la tiene.

--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

-- (public already exists)


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

-- (comment skipped)


--
-- Name: event_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.event_status AS ENUM (
    'borrador',
    'en-venta',
    'casi-agotado',
    'proximamente',
    'finalizado'
);


--
-- Name: user_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.user_role AS ENUM (
    'cliente',
    'admin',
    'staff'
);


--
-- Name: admin_clients(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.admin_clients() RETURNS TABLE(id uuid, email text, full_name text, created_at timestamp with time zone, orders_paid integer, tickets integer, total_spent integer, last_purchase_at timestamp with time zone)
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
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


--
-- Name: admin_metrics(timestamp with time zone, timestamp with time zone, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.admin_metrics(p_from timestamp with time zone, p_to timestamp with time zone, p_event_id uuid DEFAULT NULL::uuid) RETURNS jsonb
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
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
          select coalesce(nullif(e.category, ''), 'Sin categor√≠a') as category, sum(i.quantity)::integer as tickets
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


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    email text NOT NULL,
    full_name text,
    role public.user_role DEFAULT 'cliente'::public.user_role NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    staff_role_id uuid
);


--
-- Name: admin_set_member(text, text, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.admin_set_member(p_email text, p_role text, p_staff_role_id uuid DEFAULT NULL::uuid) RETURNS public.profiles
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
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


--
-- Name: attach_flow_payment(uuid, text, bigint); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.attach_flow_payment(p_order_id uuid, p_token text, p_flow_order bigint) RETURNS void
    LANGUAGE sql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  update public.orders
     set flow_token = p_token, flow_order = p_flow_order, updated_at = now()
   where id = p_order_id;
$$;


--
-- Name: orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.orders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    code text DEFAULT ('PS-'::text || upper(substr(replace((gen_random_uuid())::text, '-'::text, ''::text), 1, 10))) NOT NULL,
    user_id uuid NOT NULL,
    event_id uuid NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    subtotal integer DEFAULT 0 NOT NULL,
    service_fee integer DEFAULT 0 NOT NULL,
    total integer DEFAULT 0 NOT NULL,
    currency text DEFAULT 'CLP'::text NOT NULL,
    buyer_email text NOT NULL,
    buyer_name text,
    flow_token text,
    flow_order bigint,
    expires_at timestamp with time zone NOT NULL,
    paid_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    kind text DEFAULT 'sale'::text NOT NULL,
    issued_by uuid,
    note text,
    buyer_first_name text,
    buyer_last_name text,
    buyer_document text,
    buyer_phone text,
    payment_started_at timestamp with time zone,
    CONSTRAINT orders_kind_check CHECK ((kind = ANY (ARRAY['sale'::text, 'cortesia'::text, 'prensa'::text]))),
    CONSTRAINT orders_service_fee_check CHECK ((service_fee >= 0)),
    CONSTRAINT orders_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'paid'::text, 'rejected'::text, 'cancelled'::text, 'expired'::text, 'refund_required'::text]))),
    CONSTRAINT orders_subtotal_check CHECK ((subtotal >= 0)),
    CONSTRAINT orders_total_check CHECK ((total >= 0))
);


--
-- Name: begin_order_payment(uuid, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.begin_order_payment(p_order_id uuid, p_minutes integer DEFAULT 17) RETURNS public.orders
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
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


--
-- Name: confirm_order_payment(uuid, bigint, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.confirm_order_payment(p_order_id uuid, p_flow_order bigint, p_amount integer) RETURNS text
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
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


--
-- Name: copy_venue_map_content(uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.copy_venue_map_content(p_from uuid, p_to uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
declare
  v_section public.venue_sections;
  v_new uuid;
begin
  for v_section in select * from public.venue_sections where map_id = p_from order by sort_order loop
    v_new := gen_random_uuid();
    insert into public.venue_sections (id, map_id, name, short_label, kind, polygon, capacity, color, label_x, label_y, seat_prefix, generator, sort_order)
    values (v_new, p_to, v_section.name, v_section.short_label, v_section.kind, v_section.polygon, v_section.capacity, v_section.color,
            v_section.label_x, v_section.label_y, v_section.seat_prefix, v_section.generator, v_section.sort_order);
    insert into public.venue_rows (section_id, label, sort_order)
    select v_new, label, sort_order from public.venue_rows where section_id = v_section.id;
    insert into public.venue_seats (section_id, row_id, label, number, x, y, kind, base_status, is_manual, sort_order)
    select v_new, nr.id, s.label, s.number, s.x, s.y, s.kind, s.base_status, s.is_manual, s.sort_order
      from public.venue_seats s
      left join public.venue_rows r on r.id = s.row_id
      left join public.venue_rows nr on nr.section_id = v_new and nr.label = r.label
     where s.section_id = v_section.id;
  end loop;
  insert into public.venue_map_elements (map_id, kind, shape, geometry, rotation, label, color, sort_order)
  select p_to, kind, shape, geometry, rotation, label, color, sort_order from public.venue_map_elements where map_id = p_from;
end;
$$;


--
-- Name: create_order(uuid, jsonb, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.create_order(p_event_id uuid, p_items jsonb, p_hold_minutes integer DEFAULT 17) RETURNS public.orders
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
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


--
-- Name: venue_maps; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.venue_maps (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    venue_id uuid NOT NULL,
    version integer NOT NULL,
    status text DEFAULT 'draft'::text NOT NULL,
    image_path text,
    image_width integer DEFAULT 1600 NOT NULL,
    image_height integer DEFAULT 1000 NOT NULL,
    scale_m_per_px numeric,
    calibration jsonb,
    notes text,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    published_at timestamp with time zone,
    CONSTRAINT venue_maps_image_height_check CHECK (((image_height >= 1) AND (image_height <= 20000))),
    CONSTRAINT venue_maps_image_width_check CHECK (((image_width >= 1) AND (image_width <= 20000))),
    CONSTRAINT venue_maps_scale_m_per_px_check CHECK ((scale_m_per_px > (0)::numeric)),
    CONSTRAINT venue_maps_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'published'::text]))),
    CONSTRAINT venue_maps_version_check CHECK ((version >= 1))
);


--
-- Name: create_venue_map_draft(uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.create_venue_map_draft(p_venue_id uuid, p_from_map_id uuid DEFAULT NULL::uuid) RETURNS public.venue_maps
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
declare
  v_map public.venue_maps;
  v_from public.venue_maps;
begin
  perform public.require_event_editor();

  perform 1 from public.venues where id = p_venue_id for update;
  if not found then
    raise exception 'VENUE_NOT_FOUND';
  end if;

  select * into v_map from public.venue_maps where venue_id = p_venue_id and status = 'draft';
  if found then
    return v_map;
  end if;

  if p_from_map_id is not null then
    select * into v_from from public.venue_maps where id = p_from_map_id and venue_id = p_venue_id;
    if not found then
      raise exception 'MAP_NOT_FOUND';
    end if;
  end if;

  insert into public.venue_maps (venue_id, version, image_path, image_width, image_height, scale_m_per_px, calibration, notes, created_by)
  values (
    p_venue_id,
    coalesce((select max(version) from public.venue_maps where venue_id = p_venue_id), 0) + 1,
    v_from.image_path,
    coalesce(v_from.image_width, 1600),
    coalesce(v_from.image_height, 1000),
    v_from.scale_m_per_px,
    v_from.calibration,
    v_from.notes,
    auth.uid()
  )
  returning * into v_map;

  if p_from_map_id is not null then
    perform public.copy_venue_map_content(p_from_map_id, v_map.id);
  end if;

  return v_map;
end;
$$;


--
-- Name: event_price_zones_sync(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.event_price_zones_sync() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
begin
  perform public.sync_event_price_base(coalesce(new.event_id, old.event_id));
  return null;
end;
$$;


--
-- Name: fail_order_payment(uuid, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fail_order_payment(p_order_id uuid, p_status text) RETURNS text
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
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


--
-- Name: get_event_seat_admin(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_event_seat_admin(p_event_id uuid) RETURNS jsonb
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
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


--
-- Name: get_event_seat_map(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_event_seat_map(p_event_id uuid) RETURNS jsonb
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
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
                 'capacity', es.capacity, 'price', es.price, 'color', es.color, 'polygon', es.polygon,
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


--
-- Name: get_sector_availability(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_sector_availability(p_event_id uuid) RETURNS TABLE(sector_id uuid, capacity integer, taken integer)
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
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


--
-- Name: get_sector_prices(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_sector_prices(p_event_id uuid) RETURNS TABLE(sector_id uuid, min_price integer, max_price integer)
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
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


--
-- Name: get_taken_seats(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_taken_seats(p_sector_id uuid) RETURNS SETOF text
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  select h.seat_label
    from public.seat_holds h
   where h.sector_id = p_sector_id
     and h.seat_label is not null
     and (h.status = 'sold' or (h.status = 'held' and h.expires_at > now()));
$$;


--
-- Name: get_venue_map(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_venue_map(p_map_id uuid) RETURNS jsonb
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
declare
  v_map public.venue_maps;
begin
  select * into v_map from public.venue_maps where id = p_map_id;
  if not found then
    raise exception 'MAP_NOT_FOUND';
  end if;
  if v_map.status <> 'published' and not public.is_admin_or_staff() then
    raise exception 'FORBIDDEN';
  end if;

  return jsonb_build_object(
    'id', v_map.id,
    'venue_id', v_map.venue_id,
    'version', v_map.version,
    'status', v_map.status,
    'image_path', v_map.image_path,
    'image_width', v_map.image_width,
    'image_height', v_map.image_height,
    'scale_m_per_px', v_map.scale_m_per_px,
    'calibration', v_map.calibration,
    'notes', v_map.notes,
    'updated_at', v_map.updated_at,
    'published_at', v_map.published_at,
    'sections', coalesce((
      select jsonb_agg(
               jsonb_build_object(
                 'id', s.id, 'name', s.name, 'short_label', s.short_label, 'kind', s.kind, 'polygon', s.polygon,
                 'capacity', s.capacity, 'color', s.color, 'label_x', s.label_x, 'label_y', s.label_y,
                 'seat_prefix', s.seat_prefix, 'generator', s.generator, 'sort_order', s.sort_order,
                 'rows', coalesce((select jsonb_agg(jsonb_build_object('label', r.label, 'sort_order', r.sort_order) order by r.sort_order)
                                     from public.venue_rows r where r.section_id = s.id), '[]'::jsonb),
                 'seats', coalesce((select jsonb_agg(jsonb_build_array(r.label, st.label, st.number, st.x, st.y, st.kind, st.base_status, st.is_manual) order by st.sort_order)
                                      from public.venue_seats st left join public.venue_rows r on r.id = st.row_id
                                     where st.section_id = s.id), '[]'::jsonb)
               ) order by s.sort_order)
        from public.venue_sections s where s.map_id = p_map_id
    ), '[]'::jsonb),
    'elements', coalesce((
      select jsonb_agg(jsonb_build_object('kind', e.kind, 'shape', e.shape, 'geometry', e.geometry, 'rotation', e.rotation,
                                          'label', e.label, 'color', e.color, 'sort_order', e.sort_order) order by e.sort_order)
        from public.venue_map_elements e where e.map_id = p_map_id
    ), '[]'::jsonb)
  );
end;
$$;


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
          begin
            insert into public.profiles (id, email, full_name)
              values (new.id, new.email, new.raw_user_meta_data->>'full_name');
                return new;
                end;
                $$;


--
-- Name: is_admin(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_admin() RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  select exists (select 1 from public.profiles where id = auth.uid() and role::text = 'admin');
$$;


--
-- Name: is_admin_or_staff(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_admin_or_staff() RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  select exists (
      select 1 from public.profiles
          where id = auth.uid() and role in ('admin','staff')
            );
            $$;


--
-- Name: is_normalized_point(jsonb); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_normalized_point(p jsonb) RETURNS boolean
    LANGUAGE sql IMMUTABLE
    AS $$
  -- CASE guarantees the casts only run on numbers.
  select case
           when jsonb_typeof(p) <> 'array' or jsonb_array_length(p) <> 2 then false
           when jsonb_typeof(p -> 0) <> 'number' or jsonb_typeof(p -> 1) <> 'number' then false
           else (p ->> 0)::numeric between 0 and 1 and (p ->> 1)::numeric between 0 and 1
         end;
$$;


--
-- Name: is_normalized_polygon(jsonb); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_normalized_polygon(p jsonb) RETURNS boolean
    LANGUAGE sql IMMUTABLE
    AS $$
  select case
           when jsonb_typeof(p) is distinct from 'array' then false
           when jsonb_array_length(p) not between 3 and 500 then false
           else not exists (select 1 from jsonb_array_elements(p) pt where not public.is_normalized_point(pt))
         end;
$$;


--
-- Name: issue_courtesy(uuid, uuid, integer, text, text, text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.issue_courtesy(p_event_id uuid, p_sector_id uuid, p_quantity integer, p_kind text, p_name text, p_email text, p_note text DEFAULT NULL::text) RETURNS public.orders
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $_$
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
$_$;


--
-- Name: my_access(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.my_access() RETURNS jsonb
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
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


--
-- Name: publish_venue_map(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.publish_venue_map(p_map_id uuid) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
declare
  v_map public.venue_maps;
  v_bad text;
  v_capacity integer;
begin
  perform public.require_event_editor();

  select * into v_map from public.venue_maps where id = p_map_id for update;
  if not found then
    raise exception 'MAP_NOT_FOUND';
  end if;
  if v_map.status <> 'draft' then
    raise exception 'MAP_PUBLISHED';
  end if;
  if not exists (select 1 from public.venue_sections where map_id = p_map_id) then
    raise exception 'MAP_EMPTY';
  end if;

  select s.name into v_bad
    from public.venue_sections s
   where s.map_id = p_map_id
     and ((s.kind = 'SEATED' and not exists (select 1 from public.venue_seats st where st.section_id = s.id))
       or (s.kind = 'GENERAL_ADMISSION' and coalesce(s.capacity, 0) <= 0))
   limit 1;
  if v_bad is not null then
    raise exception 'SECTION_WITHOUT_CAPACITY' using detail = v_bad;
  end if;

  update public.venue_maps set status = 'published', published_at = now(), updated_at = now() where id = p_map_id;
  update public.venues set published_map_id = p_map_id where id = v_map.venue_id;

  select coalesce(sum(case when s.kind = 'GENERAL_ADMISSION' then s.capacity
                           else (select count(*) from public.venue_seats st where st.section_id = s.id) end), 0)
    into v_capacity
    from public.venue_sections s
   where s.map_id = p_map_id;

  return jsonb_build_object('map_id', p_map_id, 'version', v_map.version, 'capacity', v_capacity);
end;
$$;


--
-- Name: refresh_event_price_base(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.refresh_event_price_base(p_event_id uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
begin
  if public.staff_permission('eventos') <> 'edit' then
    raise exception 'FORBIDDEN';
  end if;
  perform public.sync_event_price_base(p_event_id);
end;
$$;


--
-- Name: release_expired_holds(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.release_expired_holds(p_sector_id uuid DEFAULT NULL::uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
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


--
-- Name: require_event_editor(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.require_event_editor() RETURNS void
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
begin
  if public.staff_permission('eventos') <> 'edit' then
    raise exception 'FORBIDDEN';
  end if;
end;
$$;


--
-- Name: save_order_details(uuid, jsonb, jsonb); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.save_order_details(p_order_id uuid, p_buyer jsonb, p_attendees jsonb) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
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


--
-- Name: save_venue_map(uuid, jsonb); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.save_venue_map(p_map_id uuid, p_payload jsonb) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
declare
  v_map public.venue_maps;
  v_section jsonb;
  v_section_id uuid;
  v_kind text;
  v_seat_count integer;
  v_total_seats integer := 0;
  v_capacity integer := 0;
  v_sections integer := 0;
  v_bad text;
begin
  perform public.require_event_editor();

  select * into v_map from public.venue_maps where id = p_map_id for update;
  if not found then
    raise exception 'MAP_NOT_FOUND';
  end if;
  if v_map.status <> 'draft' then
    raise exception 'MAP_PUBLISHED';
  end if;

  if jsonb_typeof(p_payload -> 'sections') is distinct from 'array' then
    raise exception 'INVALID_PAYLOAD';
  end if;
  if jsonb_array_length(p_payload -> 'sections') > 500 or jsonb_array_length(coalesce(p_payload -> 'elements', '[]')) > 500 then
    raise exception 'TOO_MANY_ITEMS';
  end if;
  if (select coalesce(sum(jsonb_array_length(coalesce(s -> 'seats', '[]'))), 0) from jsonb_array_elements(p_payload -> 'sections') s) > 30000 then
    raise exception 'TOO_MANY_SEATS';
  end if;

  update public.venue_maps
     set image_path = nullif(p_payload ->> 'image_path', ''),
         image_width = coalesce((p_payload ->> 'image_width')::integer, image_width),
         image_height = coalesce((p_payload ->> 'image_height')::integer, image_height),
         scale_m_per_px = (p_payload ->> 'scale_m_per_px')::numeric,
         calibration = case when jsonb_typeof(p_payload -> 'calibration') = 'object' then p_payload -> 'calibration' end,
         notes = p_payload ->> 'notes',
         updated_at = now()
   where id = p_map_id;

  delete from public.venue_sections where map_id = p_map_id;
  delete from public.venue_map_elements where map_id = p_map_id;

  for v_section in select * from jsonb_array_elements(p_payload -> 'sections') loop
    v_kind := v_section ->> 'kind';
    if not public.is_normalized_polygon(v_section -> 'polygon') then
      raise exception 'INVALID_POLYGON' using detail = coalesce(v_section ->> 'name', '');
    end if;
    if v_kind = 'GENERAL_ADMISSION' and jsonb_array_length(coalesce(v_section -> 'seats', '[]')) > 0 then
      raise exception 'GA_WITH_SEATS' using detail = coalesce(v_section ->> 'name', '');
    end if;

    -- Duplicate labels, reported with the first offender so the editor can point at it.
    select s ->> 1 into v_bad
      from jsonb_array_elements(coalesce(v_section -> 'seats', '[]')) s
     group by s ->> 1
    having count(*) > 1
     limit 1;
    if v_bad is not null then
      raise exception 'DUPLICATE_SEAT_LABEL' using detail = (v_section ->> 'name') || ': ' || v_bad;
    end if;

    select r ->> 'label' into v_bad
      from jsonb_array_elements(coalesce(v_section -> 'rows', '[]')) r
     group by r ->> 'label'
    having count(*) > 1
     limit 1;
    if v_bad is not null then
      raise exception 'DUPLICATE_ROW_LABEL' using detail = (v_section ->> 'name') || ': ' || v_bad;
    end if;

    v_section_id := coalesce((v_section ->> 'id')::uuid, gen_random_uuid());
    -- An id that belongs to another version (copied by the client) gets a fresh one.
    if exists (select 1 from public.venue_sections where id = v_section_id and map_id <> p_map_id) then
      v_section_id := gen_random_uuid();
    end if;

    begin
      insert into public.venue_sections (id, map_id, name, short_label, kind, polygon, capacity, color, label_x, label_y, seat_prefix, generator, sort_order)
      values (
        v_section_id,
        p_map_id,
        trim(v_section ->> 'name'),
        nullif(trim(v_section ->> 'short_label'), ''),
        v_kind,
        v_section -> 'polygon',
        case when v_kind = 'GENERAL_ADMISSION' then (v_section ->> 'capacity')::integer end,
        coalesce(v_section ->> 'color', '#6534f5'),
        (v_section ->> 'label_x')::numeric,
        (v_section ->> 'label_y')::numeric,
        coalesce(v_section ->> 'seat_prefix', ''),
        case when jsonb_typeof(v_section -> 'generator') = 'object' then v_section -> 'generator' end,
        coalesce((v_section ->> 'sort_order')::integer, v_sections)
      );

      insert into public.venue_rows (section_id, label, sort_order)
      select v_section_id, r ->> 'label', coalesce((r ->> 'sort_order')::integer, (ord - 1)::integer)
        from jsonb_array_elements(coalesce(v_section -> 'rows', '[]')) with ordinality as t(r, ord);

      select s ->> 0 into v_bad
        from jsonb_array_elements(coalesce(v_section -> 'seats', '[]')) s
       where jsonb_typeof(s -> 0) = 'string'
         and not exists (select 1 from public.venue_rows r where r.section_id = v_section_id and r.label = s ->> 0)
       limit 1;
      if v_bad is not null then
        raise exception 'ROW_NOT_FOUND' using detail = (v_section ->> 'name') || ': ' || v_bad;
      end if;

      insert into public.venue_seats (section_id, row_id, label, number, x, y, kind, base_status, is_manual, sort_order)
      select v_section_id,
             r.id,
             s ->> 1,
             (s ->> 2)::integer,
             (s ->> 3)::numeric,
             (s ->> 4)::numeric,
             coalesce(s ->> 5, 'NORMAL'),
             coalesce(s ->> 6, 'AVAILABLE'),
             coalesce((s ->> 7)::boolean, false),
             (ord - 1)::integer
        from jsonb_array_elements(coalesce(v_section -> 'seats', '[]')) with ordinality as t(s, ord)
        left join public.venue_rows r on r.section_id = v_section_id and r.label = s ->> 0;
      get diagnostics v_seat_count = row_count;
    exception
      when unique_violation then
        raise exception 'DUPLICATE_NAME' using detail = coalesce(v_section ->> 'name', '');
      when check_violation or not_null_violation or invalid_text_representation or numeric_value_out_of_range then
        raise exception 'INVALID_SECTION' using detail = coalesce(v_section ->> 'name', '');
    end;

    v_sections := v_sections + 1;
    v_total_seats := v_total_seats + v_seat_count;
    v_capacity := v_capacity + case when v_kind = 'GENERAL_ADMISSION' then coalesce((v_section ->> 'capacity')::integer, 0) else v_seat_count end;
  end loop;

  begin
    insert into public.venue_map_elements (map_id, kind, shape, geometry, rotation, label, color, sort_order)
    select p_map_id,
           e ->> 'kind',
           e ->> 'shape',
           e -> 'geometry',
           coalesce((e ->> 'rotation')::numeric, 0),
           nullif(e ->> 'label', ''),
           nullif(e ->> 'color', ''),
           coalesce((e ->> 'sort_order')::integer, (ord - 1)::integer)
      from jsonb_array_elements(coalesce(p_payload -> 'elements', '[]')) with ordinality as t(e, ord);
  exception
    when check_violation or not_null_violation or invalid_text_representation then
      raise exception 'INVALID_ELEMENT';
  end;

  return jsonb_build_object('sections', v_sections, 'seats', v_total_seats, 'capacity', v_capacity);
end;
$$;


--
-- Name: event_sectors; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.event_sectors (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    event_id uuid NOT NULL,
    name text NOT NULL,
    short_label text NOT NULL,
    capacity integer DEFAULT 0 NOT NULL,
    price numeric DEFAULT 0 NOT NULL,
    color text NOT NULL,
    shape_rect numeric[],
    shape_path text,
    label_x numeric,
    label_y numeric,
    is_active boolean DEFAULT true NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    numbered boolean DEFAULT false NOT NULL,
    seats_per_row integer DEFAULT 20 NOT NULL,
    sold integer DEFAULT 0 NOT NULL,
    polygon jsonb,
    label_point jsonb,
    seat_prefix text DEFAULT ''::text NOT NULL,
    source_section_id uuid,
    price_zone_id uuid,
    CONSTRAINT event_sectors_seats_per_row_check CHECK (((seats_per_row >= 1) AND (seats_per_row <= 100)))
);


--
-- Name: seat_is_sellable(public.event_sectors, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.seat_is_sellable(p_sector public.event_sectors, p_label text) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  select case
           when exists (select 1 from public.event_seats where sector_id = p_sector.id) then
             exists (select 1 from public.event_seats where sector_id = p_sector.id and label = p_label and base_status = 'AVAILABLE')
           else public.seat_label_valid(p_label, p_sector.capacity, p_sector.seats_per_row)
         end;
$$;


--
-- Name: seat_label_valid(text, integer, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.seat_label_valid(p_label text, p_capacity integer, p_per_row integer) RETURNS boolean
    LANGUAGE plpgsql IMMUTABLE
    AS $_$
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
$_$;


--
-- Name: seat_price(public.event_sectors, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.seat_price(p_sector public.event_sectors, p_label text) RETURNS integer
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  select coalesce(
    (select z.price
       from public.event_seats s
       join public.event_price_zones z on z.id = s.price_zone_id
      where s.sector_id = p_sector.id and s.label = p_label),
    p_sector.price::integer
  );
$$;


--
-- Name: snapshot_venue_map_to_event(uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.snapshot_venue_map_to_event(p_event_id uuid, p_map_id uuid) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
declare
  v_map public.venue_maps;
  v_venue public.venues;
  v_section public.venue_sections;
  v_sector_id uuid;
  v_capacity integer;
  v_total integer := 0;
  v_seats integer := 0;
  v_sectors integer := 0;
begin
  perform public.require_event_editor();

  perform 1 from public.events where id = p_event_id for update;
  if not found then
    raise exception 'EVENT_NOT_FOUND';
  end if;

  select * into v_map from public.venue_maps where id = p_map_id;
  if not found then
    raise exception 'MAP_NOT_FOUND';
  end if;
  if v_map.status <> 'published' then
    raise exception 'MAP_NOT_PUBLISHED';
  end if;
  select * into v_venue from public.venues where id = v_map.venue_id;

  if exists (
       select 1 from public.seat_holds
        where event_id = p_event_id and (status = 'sold' or (status = 'held' and expires_at > now()))
     )
     or exists (select 1 from public.tickets where event_id = p_event_id and status <> 'void') then
    raise exception 'EVENT_HAS_SALES';
  end if;

  -- Old sectors: delete the ones nothing points at, deactivate the rest.
  update public.event_sectors es
     set is_active = false
   where es.event_id = p_event_id
     and (exists (select 1 from public.order_items i where i.sector_id = es.id)
       or exists (select 1 from public.seat_holds h where h.sector_id = es.id)
       or exists (select 1 from public.tickets t where t.sector_id = es.id));
  delete from public.event_sectors es
   where es.event_id = p_event_id
     and not exists (select 1 from public.order_items i where i.sector_id = es.id)
     and not exists (select 1 from public.seat_holds h where h.sector_id = es.id)
     and not exists (select 1 from public.tickets t where t.sector_id = es.id);

  for v_section in select * from public.venue_sections where map_id = p_map_id order by sort_order loop
    v_capacity := case when v_section.kind = 'GENERAL_ADMISSION' then v_section.capacity
                       else (select count(*) from public.venue_seats where section_id = v_section.id) end;

    -- Price starts at 0: zones and prices are set per event (Fase 5) before selling.
    insert into public.event_sectors (event_id, name, short_label, capacity, price, color, is_active, numbered, polygon,
                                      label_point, seat_prefix, source_section_id, sort_order)
    values (p_event_id, v_section.name, coalesce(v_section.short_label, v_section.name), v_capacity, 0, v_section.color, true,
            v_section.kind = 'SEATED', v_section.polygon,
            case when v_section.label_x is not null and v_section.label_y is not null
                 then jsonb_build_array(v_section.label_x, v_section.label_y) end,
            v_section.seat_prefix, v_section.id, v_sectors)
    returning id into v_sector_id;

    insert into public.event_seats (event_id, sector_id, row_label, label, number, x, y, kind, base_status, block_reason, sort_order)
    select p_event_id, v_sector_id, r.label, s.label, s.number, s.x, s.y, s.kind, s.base_status,
           case when s.base_status = 'BLOCKED' then 'plano' end, s.sort_order
      from public.venue_seats s
      left join public.venue_rows r on r.id = s.row_id
     where s.section_id = v_section.id;

    v_seats := v_seats + (select count(*) from public.event_seats where sector_id = v_sector_id);
    v_total := v_total + coalesce(v_capacity, 0);
    v_sectors := v_sectors + 1;
  end loop;

  update public.events
     set venue_id = v_venue.id,
         venue = v_venue.name,
         city = v_venue.city,
         venue_map_id = p_map_id,
         seat_map_snapshot_at = now(),
         capacity = v_total,
         updated_at = now()
   where id = p_event_id;

  return jsonb_build_object('sectors', v_sectors, 'seats', v_seats, 'capacity', v_total);
end;
$$;


--
-- Name: staff_permission(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.staff_permission(p_module text) RETURNS text
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
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


--
-- Name: sync_event_price_base(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.sync_event_price_base(p_event_id uuid) RETURNS void
    LANGUAGE sql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  update public.events
     set price_base = coalesce((select min(p.min_price) from public.get_sector_prices(p_event_id) p where p.min_price > 0), 0)
   where id = p_event_id;
$$;


--
-- Name: update_event_seats(uuid, uuid[], jsonb); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_event_seats(p_event_id uuid, p_seat_ids uuid[], p_changes jsonb) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
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


--
-- Name: void_courtesy(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.void_courtesy(p_order_id uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
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


--
-- Name: event_price_zones; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.event_price_zones (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    event_id uuid NOT NULL,
    name text NOT NULL,
    color text DEFAULT '#6534f5'::text NOT NULL,
    price integer NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT event_price_zones_name_check CHECK (((length(TRIM(BOTH FROM name)) >= 1) AND (length(TRIM(BOTH FROM name)) <= 40))),
    CONSTRAINT event_price_zones_price_check CHECK ((price >= 0)),
    CONSTRAINT event_price_zones_price_positive CHECK ((price > 0))
);


--
-- Name: event_seats; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.event_seats (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    event_id uuid NOT NULL,
    sector_id uuid NOT NULL,
    row_label text,
    label text NOT NULL,
    number integer,
    x numeric NOT NULL,
    y numeric NOT NULL,
    kind text DEFAULT 'NORMAL'::text NOT NULL,
    base_status text DEFAULT 'AVAILABLE'::text NOT NULL,
    block_reason text,
    price_zone_id uuid,
    sort_order integer DEFAULT 0 NOT NULL,
    CONSTRAINT event_seats_base_status_check CHECK ((base_status = ANY (ARRAY['AVAILABLE'::text, 'BLOCKED'::text]))),
    CONSTRAINT event_seats_kind_check CHECK ((kind = ANY (ARRAY['NORMAL'::text, 'ACCESSIBLE'::text, 'OBSTRUCTED'::text]))),
    CONSTRAINT event_seats_x_check CHECK (((x >= (0)::numeric) AND (x <= (1)::numeric))),
    CONSTRAINT event_seats_y_check CHECK (((y >= (0)::numeric) AND (y <= (1)::numeric)))
);


--
-- Name: events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    slug text NOT NULL,
    title text NOT NULL,
    subtitle text,
    description text,
    venue text NOT NULL,
    city text DEFAULT 'Santiago'::text NOT NULL,
    event_date timestamp with time zone NOT NULL,
    image_url text,
    price_base numeric DEFAULT 0 NOT NULL,
    capacity integer DEFAULT 0 NOT NULL,
    sold integer DEFAULT 0 NOT NULL,
    status public.event_status DEFAULT 'borrador'::public.event_status NOT NULL,
    producer_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    show_in_hero boolean DEFAULT false NOT NULL,
    hero_image_url text,
    banner_image_url text,
    venue_id uuid,
    sale_start timestamp with time zone,
    max_tickets_per_order integer DEFAULT 6 NOT NULL,
    qr_validation boolean DEFAULT true NOT NULL,
    age_restriction boolean DEFAULT false NOT NULL,
    category text,
    artist text,
    address text,
    doors_open time without time zone,
    venue_map_id uuid,
    seat_map_snapshot_at timestamp with time zone
);


--
-- Name: order_attendees; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.order_attendees (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    order_id uuid NOT NULL,
    "position" integer NOT NULL,
    sector_id uuid NOT NULL,
    seat_label text,
    first_name text NOT NULL,
    last_name text NOT NULL,
    document text NOT NULL,
    birth_date date NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT order_attendees_position_check CHECK (("position" >= 1))
);


--
-- Name: order_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.order_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    order_id uuid NOT NULL,
    sector_id uuid NOT NULL,
    sector_name text NOT NULL,
    unit_price integer NOT NULL,
    quantity integer NOT NULL,
    seat_labels text[] DEFAULT '{}'::text[] NOT NULL,
    CONSTRAINT order_items_quantity_check CHECK (((quantity >= 1) AND (quantity <= 20))),
    CONSTRAINT order_items_unit_price_check CHECK ((unit_price >= 0))
);


--
-- Name: payment_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payment_events (
    id bigint NOT NULL,
    order_id uuid,
    provider text DEFAULT 'flow'::text NOT NULL,
    source text NOT NULL,
    flow_token text,
    flow_status integer,
    amount numeric,
    payload jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: payment_events_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.payment_events_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: payment_events_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.payment_events_id_seq OWNED BY public.payment_events.id;


--
-- Name: seat_holds; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.seat_holds (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    order_id uuid NOT NULL,
    event_id uuid NOT NULL,
    sector_id uuid NOT NULL,
    seat_label text,
    quantity integer DEFAULT 1 NOT NULL,
    status text DEFAULT 'held'::text NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT seat_holds_quantity_check CHECK ((quantity > 0)),
    CONSTRAINT seat_holds_status_check CHECK ((status = ANY (ARRAY['held'::text, 'sold'::text, 'released'::text])))
);


--
-- Name: seo_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.seo_settings (
    page_key text NOT NULL,
    meta_title text,
    meta_description text,
    og_title text,
    og_description text,
    og_image_url text,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: site_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.site_settings (
    id text DEFAULT 'default'::text NOT NULL,
    color_primary text,
    color_secondary text,
    color_bg_light text,
    color_bg_dark text,
    color_text_primary text,
    color_text_secondary text,
    color_success text,
    color_warning text,
    color_error text,
    logo_primary_url text,
    logo_dark_url text,
    logo_isotype_url text,
    logo_favicon_url text,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: staff_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.staff_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    color text DEFAULT '#6534f5'::text NOT NULL,
    permissions jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: tickets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tickets (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    order_id uuid NOT NULL,
    event_id uuid NOT NULL,
    sector_id uuid NOT NULL,
    sector_name text NOT NULL,
    seat_label text,
    holder_user_id uuid,
    code text DEFAULT (replace((gen_random_uuid())::text, '-'::text, ''::text) || replace((gen_random_uuid())::text, '-'::text, ''::text)) NOT NULL,
    status text DEFAULT 'valid'::text NOT NULL,
    used_at timestamp with time zone,
    used_gate text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    holder_email text,
    holder_name text,
    holder_document text,
    CONSTRAINT tickets_status_check CHECK ((status = ANY (ARRAY['valid'::text, 'used'::text, 'void'::text])))
);


--
-- Name: venue_map_elements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.venue_map_elements (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    map_id uuid NOT NULL,
    kind text NOT NULL,
    shape text NOT NULL,
    geometry jsonb NOT NULL,
    rotation numeric DEFAULT 0 NOT NULL,
    label text,
    color text,
    sort_order integer DEFAULT 0 NOT NULL,
    CONSTRAINT venue_map_elements_kind_check CHECK ((kind = ANY (ARRAY['STAGE'::text, 'ENTRANCE'::text, 'EXIT'::text, 'BAR'::text, 'BATHROOM'::text, 'TEXT'::text]))),
    CONSTRAINT venue_map_elements_shape_check CHECK ((shape = ANY (ARRAY['rect'::text, 'ellipse'::text, 'polygon'::text, 'point'::text])))
);


--
-- Name: venue_rows; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.venue_rows (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    section_id uuid NOT NULL,
    label text NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    CONSTRAINT venue_rows_label_check CHECK (((length(label) >= 1) AND (length(label) <= 12)))
);


--
-- Name: venue_seats; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.venue_seats (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    section_id uuid NOT NULL,
    row_id uuid,
    label text NOT NULL,
    number integer,
    x numeric NOT NULL,
    y numeric NOT NULL,
    kind text DEFAULT 'NORMAL'::text NOT NULL,
    base_status text DEFAULT 'AVAILABLE'::text NOT NULL,
    is_manual boolean DEFAULT false NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    CONSTRAINT venue_seats_base_status_check CHECK ((base_status = ANY (ARRAY['AVAILABLE'::text, 'BLOCKED'::text]))),
    CONSTRAINT venue_seats_kind_check CHECK ((kind = ANY (ARRAY['NORMAL'::text, 'ACCESSIBLE'::text, 'OBSTRUCTED'::text]))),
    CONSTRAINT venue_seats_label_check CHECK ((label ~ '^[A-Za-z0-9][A-Za-z0-9._-]{0,23}$'::text)),
    CONSTRAINT venue_seats_x_check CHECK (((x >= (0)::numeric) AND (x <= (1)::numeric))),
    CONSTRAINT venue_seats_y_check CHECK (((y >= (0)::numeric) AND (y <= (1)::numeric)))
);


--
-- Name: venue_sections; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.venue_sections (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    map_id uuid NOT NULL,
    name text NOT NULL,
    short_label text,
    kind text NOT NULL,
    polygon jsonb NOT NULL,
    capacity integer,
    color text DEFAULT '#6534f5'::text NOT NULL,
    label_x numeric,
    label_y numeric,
    seat_prefix text DEFAULT ''::text NOT NULL,
    generator jsonb,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT venue_sections_capacity_check CHECK ((capacity > 0)),
    CONSTRAINT venue_sections_kind_check CHECK ((kind = ANY (ARRAY['SEATED'::text, 'GENERAL_ADMISSION'::text]))),
    CONSTRAINT venue_sections_label_x_check CHECK (((label_x >= (0)::numeric) AND (label_x <= (1)::numeric))),
    CONSTRAINT venue_sections_label_y_check CHECK (((label_y >= (0)::numeric) AND (label_y <= (1)::numeric))),
    CONSTRAINT venue_sections_name_check CHECK (((length(TRIM(BOTH FROM name)) >= 1) AND (length(TRIM(BOTH FROM name)) <= 60)))
);


--
-- Name: venues; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.venues (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    city text NOT NULL,
    type text NOT NULL,
    layout_key text NOT NULL,
    scale numeric DEFAULT 1 NOT NULL,
    gradient text,
    is_custom boolean DEFAULT false NOT NULL,
    base_shapes jsonb DEFAULT '[]'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    address text,
    published_map_id uuid
);


--
-- Name: payment_events id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_events ALTER COLUMN id SET DEFAULT nextval('public.payment_events_id_seq'::regclass);


--
-- Name: event_price_zones event_price_zones_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_price_zones
    ADD CONSTRAINT event_price_zones_pkey PRIMARY KEY (id);


--
-- Name: event_seats event_seats_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_seats
    ADD CONSTRAINT event_seats_pkey PRIMARY KEY (id);


--
-- Name: event_seats event_seats_sector_id_label_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_seats
    ADD CONSTRAINT event_seats_sector_id_label_key UNIQUE (sector_id, label);


--
-- Name: event_sectors event_sectors_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_sectors
    ADD CONSTRAINT event_sectors_pkey PRIMARY KEY (id);


--
-- Name: events events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_pkey PRIMARY KEY (id);


--
-- Name: events events_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_slug_key UNIQUE (slug);


--
-- Name: order_attendees order_attendees_order_id_position_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_attendees
    ADD CONSTRAINT order_attendees_order_id_position_key UNIQUE (order_id, "position");


--
-- Name: order_attendees order_attendees_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_attendees
    ADD CONSTRAINT order_attendees_pkey PRIMARY KEY (id);


--
-- Name: order_items order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_pkey PRIMARY KEY (id);


--
-- Name: orders orders_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_code_key UNIQUE (code);


--
-- Name: orders orders_flow_token_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_flow_token_key UNIQUE (flow_token);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: payment_events payment_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_events
    ADD CONSTRAINT payment_events_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: seat_holds seat_holds_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.seat_holds
    ADD CONSTRAINT seat_holds_pkey PRIMARY KEY (id);


--
-- Name: seo_settings seo_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.seo_settings
    ADD CONSTRAINT seo_settings_pkey PRIMARY KEY (page_key);


--
-- Name: site_settings site_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.site_settings
    ADD CONSTRAINT site_settings_pkey PRIMARY KEY (id);


--
-- Name: staff_roles staff_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.staff_roles
    ADD CONSTRAINT staff_roles_pkey PRIMARY KEY (id);


--
-- Name: tickets tickets_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT tickets_code_key UNIQUE (code);


--
-- Name: tickets tickets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT tickets_pkey PRIMARY KEY (id);


--
-- Name: venue_map_elements venue_map_elements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.venue_map_elements
    ADD CONSTRAINT venue_map_elements_pkey PRIMARY KEY (id);


--
-- Name: venue_maps venue_maps_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.venue_maps
    ADD CONSTRAINT venue_maps_pkey PRIMARY KEY (id);


--
-- Name: venue_maps venue_maps_venue_id_version_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.venue_maps
    ADD CONSTRAINT venue_maps_venue_id_version_key UNIQUE (venue_id, version);


--
-- Name: venue_rows venue_rows_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.venue_rows
    ADD CONSTRAINT venue_rows_pkey PRIMARY KEY (id);


--
-- Name: venue_rows venue_rows_section_id_label_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.venue_rows
    ADD CONSTRAINT venue_rows_section_id_label_key UNIQUE (section_id, label);


--
-- Name: venue_seats venue_seats_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.venue_seats
    ADD CONSTRAINT venue_seats_pkey PRIMARY KEY (id);


--
-- Name: venue_seats venue_seats_section_id_label_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.venue_seats
    ADD CONSTRAINT venue_seats_section_id_label_key UNIQUE (section_id, label);


--
-- Name: venue_sections venue_sections_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.venue_sections
    ADD CONSTRAINT venue_sections_pkey PRIMARY KEY (id);


--
-- Name: venues venues_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.venues
    ADD CONSTRAINT venues_pkey PRIMARY KEY (id);


--
-- Name: event_price_zones_name_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX event_price_zones_name_key ON public.event_price_zones USING btree (event_id, lower(name));


--
-- Name: event_seats_event_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX event_seats_event_idx ON public.event_seats USING btree (event_id);


--
-- Name: event_seats_zone_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX event_seats_zone_idx ON public.event_seats USING btree (price_zone_id) WHERE (price_zone_id IS NOT NULL);


--
-- Name: order_attendees_order_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX order_attendees_order_idx ON public.order_attendees USING btree (order_id);


--
-- Name: order_items_order_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX order_items_order_idx ON public.order_items USING btree (order_id);


--
-- Name: orders_event_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX orders_event_status_idx ON public.orders USING btree (event_id, status);


--
-- Name: orders_kind_event_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX orders_kind_event_idx ON public.orders USING btree (event_id, kind);


--
-- Name: orders_user_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX orders_user_idx ON public.orders USING btree (user_id, created_at DESC);


--
-- Name: payment_events_order_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX payment_events_order_idx ON public.payment_events USING btree (order_id);


--
-- Name: seat_holds_one_per_seat; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX seat_holds_one_per_seat ON public.seat_holds USING btree (sector_id, seat_label) WHERE ((seat_label IS NOT NULL) AND (status = ANY (ARRAY['held'::text, 'sold'::text])));


--
-- Name: seat_holds_order_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX seat_holds_order_idx ON public.seat_holds USING btree (order_id);


--
-- Name: seat_holds_sector_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX seat_holds_sector_status_idx ON public.seat_holds USING btree (sector_id, status);


--
-- Name: staff_roles_name_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX staff_roles_name_key ON public.staff_roles USING btree (lower(name));


--
-- Name: tickets_event_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tickets_event_idx ON public.tickets USING btree (event_id);


--
-- Name: tickets_holder_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tickets_holder_idx ON public.tickets USING btree (holder_user_id);


--
-- Name: venue_map_elements_map_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX venue_map_elements_map_idx ON public.venue_map_elements USING btree (map_id);


--
-- Name: venue_maps_one_draft; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX venue_maps_one_draft ON public.venue_maps USING btree (venue_id) WHERE (status = 'draft'::text);


--
-- Name: venue_seats_row_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX venue_seats_row_idx ON public.venue_seats USING btree (row_id);


--
-- Name: venue_sections_map_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX venue_sections_map_idx ON public.venue_sections USING btree (map_id);


--
-- Name: venue_sections_name_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX venue_sections_name_key ON public.venue_sections USING btree (map_id, lower(name));


--
-- Name: event_price_zones event_price_zones_sync; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER event_price_zones_sync AFTER INSERT OR DELETE OR UPDATE ON public.event_price_zones FOR EACH ROW EXECUTE FUNCTION public.event_price_zones_sync();


--
-- Name: event_price_zones event_price_zones_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_price_zones
    ADD CONSTRAINT event_price_zones_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;


--
-- Name: event_seats event_seats_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_seats
    ADD CONSTRAINT event_seats_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;


--
-- Name: event_seats event_seats_price_zone_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_seats
    ADD CONSTRAINT event_seats_price_zone_id_fkey FOREIGN KEY (price_zone_id) REFERENCES public.event_price_zones(id) ON DELETE SET NULL;


--
-- Name: event_seats event_seats_sector_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_seats
    ADD CONSTRAINT event_seats_sector_id_fkey FOREIGN KEY (sector_id) REFERENCES public.event_sectors(id) ON DELETE CASCADE;


--
-- Name: event_sectors event_sectors_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_sectors
    ADD CONSTRAINT event_sectors_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;


--
-- Name: event_sectors event_sectors_price_zone_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_sectors
    ADD CONSTRAINT event_sectors_price_zone_id_fkey FOREIGN KEY (price_zone_id) REFERENCES public.event_price_zones(id) ON DELETE SET NULL;


--
-- Name: event_sectors event_sectors_source_section_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_sectors
    ADD CONSTRAINT event_sectors_source_section_id_fkey FOREIGN KEY (source_section_id) REFERENCES public.venue_sections(id) ON DELETE SET NULL;


--
-- Name: events events_producer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_producer_id_fkey FOREIGN KEY (producer_id) REFERENCES public.profiles(id);


--
-- Name: events events_venue_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_venue_id_fkey FOREIGN KEY (venue_id) REFERENCES public.venues(id);


--
-- Name: events events_venue_map_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_venue_map_id_fkey FOREIGN KEY (venue_map_id) REFERENCES public.venue_maps(id) ON DELETE RESTRICT;


--
-- Name: order_attendees order_attendees_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_attendees
    ADD CONSTRAINT order_attendees_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- Name: order_attendees order_attendees_sector_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_attendees
    ADD CONSTRAINT order_attendees_sector_id_fkey FOREIGN KEY (sector_id) REFERENCES public.event_sectors(id) ON DELETE RESTRICT;


--
-- Name: order_items order_items_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- Name: order_items order_items_sector_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_sector_id_fkey FOREIGN KEY (sector_id) REFERENCES public.event_sectors(id) ON DELETE RESTRICT;


--
-- Name: orders orders_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE RESTRICT;


--
-- Name: orders orders_issued_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_issued_by_fkey FOREIGN KEY (issued_by) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: orders orders_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE RESTRICT;


--
-- Name: payment_events payment_events_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_events
    ADD CONSTRAINT payment_events_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE SET NULL;


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_staff_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_staff_role_id_fkey FOREIGN KEY (staff_role_id) REFERENCES public.staff_roles(id) ON DELETE RESTRICT;


--
-- Name: seat_holds seat_holds_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.seat_holds
    ADD CONSTRAINT seat_holds_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE RESTRICT;


--
-- Name: seat_holds seat_holds_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.seat_holds
    ADD CONSTRAINT seat_holds_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- Name: seat_holds seat_holds_sector_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.seat_holds
    ADD CONSTRAINT seat_holds_sector_id_fkey FOREIGN KEY (sector_id) REFERENCES public.event_sectors(id) ON DELETE RESTRICT;


--
-- Name: tickets tickets_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT tickets_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE RESTRICT;


--
-- Name: tickets tickets_holder_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT tickets_holder_user_id_fkey FOREIGN KEY (holder_user_id) REFERENCES auth.users(id) ON DELETE RESTRICT;


--
-- Name: tickets tickets_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT tickets_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE RESTRICT;


--
-- Name: tickets tickets_sector_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT tickets_sector_id_fkey FOREIGN KEY (sector_id) REFERENCES public.event_sectors(id) ON DELETE RESTRICT;


--
-- Name: venue_map_elements venue_map_elements_map_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.venue_map_elements
    ADD CONSTRAINT venue_map_elements_map_id_fkey FOREIGN KEY (map_id) REFERENCES public.venue_maps(id) ON DELETE CASCADE;


--
-- Name: venue_maps venue_maps_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.venue_maps
    ADD CONSTRAINT venue_maps_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: venue_maps venue_maps_venue_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.venue_maps
    ADD CONSTRAINT venue_maps_venue_id_fkey FOREIGN KEY (venue_id) REFERENCES public.venues(id) ON DELETE CASCADE;


--
-- Name: venue_rows venue_rows_section_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.venue_rows
    ADD CONSTRAINT venue_rows_section_id_fkey FOREIGN KEY (section_id) REFERENCES public.venue_sections(id) ON DELETE CASCADE;


--
-- Name: venue_seats venue_seats_row_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.venue_seats
    ADD CONSTRAINT venue_seats_row_id_fkey FOREIGN KEY (row_id) REFERENCES public.venue_rows(id) ON DELETE CASCADE;


--
-- Name: venue_seats venue_seats_section_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.venue_seats
    ADD CONSTRAINT venue_seats_section_id_fkey FOREIGN KEY (section_id) REFERENCES public.venue_sections(id) ON DELETE CASCADE;


--
-- Name: venue_sections venue_sections_map_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.venue_sections
    ADD CONSTRAINT venue_sections_map_id_fkey FOREIGN KEY (map_id) REFERENCES public.venue_maps(id) ON DELETE CASCADE;


--
-- Name: venues venues_published_map_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.venues
    ADD CONSTRAINT venues_published_map_id_fkey FOREIGN KEY (published_map_id) REFERENCES public.venue_maps(id) ON DELETE SET NULL;


--
-- Name: event_sectors Admins manage event sectors; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins manage event sectors" ON public.event_sectors USING (public.is_admin_or_staff());


--
-- Name: events Admins manage events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins manage events" ON public.events USING (public.is_admin_or_staff());


--
-- Name: seo_settings Admins manage seo settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins manage seo settings" ON public.seo_settings USING (public.is_admin_or_staff());


--
-- Name: site_settings Admins manage site settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins manage site settings" ON public.site_settings USING (public.is_admin_or_staff());


--
-- Name: venues Admins manage venues; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins manage venues" ON public.venues USING (public.is_admin_or_staff());


--
-- Name: events Admins read all events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins read all events" ON public.events FOR SELECT USING (public.is_admin_or_staff());


--
-- Name: profiles Admins read all profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins read all profiles" ON public.profiles FOR SELECT USING (public.is_admin_or_staff());


--
-- Name: venue_maps Event editors delete drafts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Event editors delete drafts" ON public.venue_maps FOR DELETE USING (((status = 'draft'::text) AND (public.staff_permission('eventos'::text) = 'edit'::text)));


--
-- Name: event_price_zones Event editors manage price zones; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Event editors manage price zones" ON public.event_price_zones USING ((public.staff_permission('eventos'::text) = 'edit'::text)) WITH CHECK ((public.staff_permission('eventos'::text) = 'edit'::text));


--
-- Name: event_seats Event editors update event seats; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Event editors update event seats" ON public.event_seats FOR UPDATE USING ((public.staff_permission('eventos'::text) = 'edit'::text)) WITH CHECK ((public.staff_permission('eventos'::text) = 'edit'::text));


--
-- Name: tickets Holders and staff read tickets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Holders and staff read tickets" ON public.tickets FOR SELECT USING (((holder_user_id = auth.uid()) OR (lower(holder_email) = lower((auth.jwt() ->> 'email'::text))) OR public.is_admin_or_staff()));


--
-- Name: order_attendees Owners and staff read attendees; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Owners and staff read attendees" ON public.order_attendees FOR SELECT USING (((EXISTS ( SELECT 1
   FROM public.orders o
  WHERE ((o.id = order_attendees.order_id) AND (o.user_id = auth.uid())))) OR public.is_admin_or_staff()));


--
-- Name: order_items Owners and staff read order items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Owners and staff read order items" ON public.order_items FOR SELECT USING (((EXISTS ( SELECT 1
   FROM public.orders o
  WHERE ((o.id = order_items.order_id) AND (o.user_id = auth.uid())))) OR public.is_admin_or_staff()));


--
-- Name: orders Owners and staff read orders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Owners and staff read orders" ON public.orders FOR SELECT USING (((user_id = auth.uid()) OR (lower(buyer_email) = lower((auth.jwt() ->> 'email'::text))) OR public.is_admin_or_staff()));


--
-- Name: event_seats Public reads event seats; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public reads event seats" ON public.event_seats FOR SELECT USING (true);


--
-- Name: event_sectors Public reads event sectors; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public reads event sectors" ON public.event_sectors FOR SELECT USING (true);


--
-- Name: event_price_zones Public reads price zones; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public reads price zones" ON public.event_price_zones FOR SELECT USING (true);


--
-- Name: events Public reads published events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public reads published events" ON public.events FOR SELECT USING ((status <> 'borrador'::public.event_status));


--
-- Name: seo_settings Public reads seo settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public reads seo settings" ON public.seo_settings FOR SELECT USING (true);


--
-- Name: site_settings Public reads site settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public reads site settings" ON public.site_settings FOR SELECT USING (true);


--
-- Name: venues Public reads venues; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public reads venues" ON public.venues FOR SELECT USING (true);


--
-- Name: venue_map_elements Read elements of visible maps; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Read elements of visible maps" ON public.venue_map_elements FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.venue_maps m
  WHERE ((m.id = venue_map_elements.map_id) AND ((m.status = 'published'::text) OR public.is_admin_or_staff())))));


--
-- Name: venue_maps Read published maps, staff read drafts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Read published maps, staff read drafts" ON public.venue_maps FOR SELECT USING (((status = 'published'::text) OR public.is_admin_or_staff()));


--
-- Name: venue_rows Read rows of visible maps; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Read rows of visible maps" ON public.venue_rows FOR SELECT USING ((EXISTS ( SELECT 1
   FROM (public.venue_sections s
     JOIN public.venue_maps m ON ((m.id = s.map_id)))
  WHERE ((s.id = venue_rows.section_id) AND ((m.status = 'published'::text) OR public.is_admin_or_staff())))));


--
-- Name: venue_seats Read seats of visible maps; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Read seats of visible maps" ON public.venue_seats FOR SELECT USING ((EXISTS ( SELECT 1
   FROM (public.venue_sections s
     JOIN public.venue_maps m ON ((m.id = s.map_id)))
  WHERE ((s.id = venue_seats.section_id) AND ((m.status = 'published'::text) OR public.is_admin_or_staff())))));


--
-- Name: venue_sections Read sections of visible maps; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Read sections of visible maps" ON public.venue_sections FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.venue_maps m
  WHERE ((m.id = venue_sections.map_id) AND ((m.status = 'published'::text) OR public.is_admin_or_staff())))));


--
-- Name: staff_roles Role managers write staff roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Role managers write staff roles" ON public.staff_roles USING ((public.staff_permission('roles'::text) = 'edit'::text)) WITH CHECK ((public.staff_permission('roles'::text) = 'edit'::text));


--
-- Name: profiles Staff read all profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Staff read all profiles" ON public.profiles FOR SELECT USING (public.is_admin_or_staff());


--
-- Name: payment_events Staff read payment events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Staff read payment events" ON public.payment_events FOR SELECT USING (public.is_admin_or_staff());


--
-- Name: seat_holds Staff read seat holds; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Staff read seat holds" ON public.seat_holds FOR SELECT USING (public.is_admin_or_staff());


--
-- Name: staff_roles Staff read staff roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Staff read staff roles" ON public.staff_roles FOR SELECT USING (public.is_admin_or_staff());


--
-- Name: profiles Users read own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users read own profile" ON public.profiles FOR SELECT USING ((auth.uid() = id));


--
-- Name: profiles Users update own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING ((auth.uid() = id));


--
-- Name: event_price_zones; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.event_price_zones ENABLE ROW LEVEL SECURITY;

--
-- Name: event_seats; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.event_seats ENABLE ROW LEVEL SECURITY;

--
-- Name: event_sectors; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.event_sectors ENABLE ROW LEVEL SECURITY;

--
-- Name: events; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

--
-- Name: order_attendees; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.order_attendees ENABLE ROW LEVEL SECURITY;

--
-- Name: order_items; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

--
-- Name: orders; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

--
-- Name: payment_events; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.payment_events ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: seat_holds; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.seat_holds ENABLE ROW LEVEL SECURITY;

--
-- Name: seo_settings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.seo_settings ENABLE ROW LEVEL SECURITY;

--
-- Name: site_settings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

--
-- Name: staff_roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.staff_roles ENABLE ROW LEVEL SECURITY;

--
-- Name: tickets; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

--
-- Name: venue_map_elements; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.venue_map_elements ENABLE ROW LEVEL SECURITY;

--
-- Name: venue_maps; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.venue_maps ENABLE ROW LEVEL SECURITY;

--
-- Name: venue_rows; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.venue_rows ENABLE ROW LEVEL SECURITY;

--
-- Name: venue_seats; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.venue_seats ENABLE ROW LEVEL SECURITY;

--
-- Name: venue_sections; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.venue_sections ENABLE ROW LEVEL SECURITY;

--
-- Name: venues; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;

--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: -
--

GRANT USAGE ON SCHEMA public TO postgres;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;


--
-- Name: FUNCTION admin_clients(); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.admin_clients() FROM PUBLIC;
GRANT ALL ON FUNCTION public.admin_clients() TO authenticated;
GRANT ALL ON FUNCTION public.admin_clients() TO service_role;


--
-- Name: FUNCTION admin_metrics(p_from timestamp with time zone, p_to timestamp with time zone, p_event_id uuid); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.admin_metrics(p_from timestamp with time zone, p_to timestamp with time zone, p_event_id uuid) FROM PUBLIC;
GRANT ALL ON FUNCTION public.admin_metrics(p_from timestamp with time zone, p_to timestamp with time zone, p_event_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.admin_metrics(p_from timestamp with time zone, p_to timestamp with time zone, p_event_id uuid) TO service_role;


--
-- Name: TABLE profiles; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.profiles TO anon;
GRANT ALL ON TABLE public.profiles TO authenticated;
GRANT ALL ON TABLE public.profiles TO service_role;


--
-- Name: FUNCTION admin_set_member(p_email text, p_role text, p_staff_role_id uuid); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.admin_set_member(p_email text, p_role text, p_staff_role_id uuid) FROM PUBLIC;
GRANT ALL ON FUNCTION public.admin_set_member(p_email text, p_role text, p_staff_role_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.admin_set_member(p_email text, p_role text, p_staff_role_id uuid) TO service_role;


--
-- Name: FUNCTION attach_flow_payment(p_order_id uuid, p_token text, p_flow_order bigint); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.attach_flow_payment(p_order_id uuid, p_token text, p_flow_order bigint) FROM PUBLIC;
GRANT ALL ON FUNCTION public.attach_flow_payment(p_order_id uuid, p_token text, p_flow_order bigint) TO service_role;


--
-- Name: TABLE orders; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.orders TO anon;
GRANT ALL ON TABLE public.orders TO authenticated;
GRANT ALL ON TABLE public.orders TO service_role;


--
-- Name: FUNCTION begin_order_payment(p_order_id uuid, p_minutes integer); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.begin_order_payment(p_order_id uuid, p_minutes integer) FROM PUBLIC;
GRANT ALL ON FUNCTION public.begin_order_payment(p_order_id uuid, p_minutes integer) TO service_role;


--
-- Name: FUNCTION confirm_order_payment(p_order_id uuid, p_flow_order bigint, p_amount integer); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.confirm_order_payment(p_order_id uuid, p_flow_order bigint, p_amount integer) FROM PUBLIC;
GRANT ALL ON FUNCTION public.confirm_order_payment(p_order_id uuid, p_flow_order bigint, p_amount integer) TO service_role;


--
-- Name: FUNCTION copy_venue_map_content(p_from uuid, p_to uuid); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.copy_venue_map_content(p_from uuid, p_to uuid) FROM PUBLIC;
GRANT ALL ON FUNCTION public.copy_venue_map_content(p_from uuid, p_to uuid) TO service_role;


--
-- Name: FUNCTION create_order(p_event_id uuid, p_items jsonb, p_hold_minutes integer); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.create_order(p_event_id uuid, p_items jsonb, p_hold_minutes integer) FROM PUBLIC;
GRANT ALL ON FUNCTION public.create_order(p_event_id uuid, p_items jsonb, p_hold_minutes integer) TO authenticated;
GRANT ALL ON FUNCTION public.create_order(p_event_id uuid, p_items jsonb, p_hold_minutes integer) TO service_role;


--
-- Name: TABLE venue_maps; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.venue_maps TO anon;
GRANT ALL ON TABLE public.venue_maps TO authenticated;
GRANT ALL ON TABLE public.venue_maps TO service_role;


--
-- Name: FUNCTION create_venue_map_draft(p_venue_id uuid, p_from_map_id uuid); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.create_venue_map_draft(p_venue_id uuid, p_from_map_id uuid) FROM PUBLIC;
GRANT ALL ON FUNCTION public.create_venue_map_draft(p_venue_id uuid, p_from_map_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.create_venue_map_draft(p_venue_id uuid, p_from_map_id uuid) TO service_role;


--
-- Name: FUNCTION event_price_zones_sync(); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.event_price_zones_sync() FROM PUBLIC;
GRANT ALL ON FUNCTION public.event_price_zones_sync() TO service_role;


--
-- Name: FUNCTION fail_order_payment(p_order_id uuid, p_status text); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.fail_order_payment(p_order_id uuid, p_status text) FROM PUBLIC;
GRANT ALL ON FUNCTION public.fail_order_payment(p_order_id uuid, p_status text) TO service_role;


--
-- Name: FUNCTION get_event_seat_admin(p_event_id uuid); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.get_event_seat_admin(p_event_id uuid) FROM PUBLIC;
GRANT ALL ON FUNCTION public.get_event_seat_admin(p_event_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.get_event_seat_admin(p_event_id uuid) TO service_role;


--
-- Name: FUNCTION get_event_seat_map(p_event_id uuid); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.get_event_seat_map(p_event_id uuid) TO anon;
GRANT ALL ON FUNCTION public.get_event_seat_map(p_event_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.get_event_seat_map(p_event_id uuid) TO service_role;


--
-- Name: FUNCTION get_sector_availability(p_event_id uuid); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.get_sector_availability(p_event_id uuid) TO anon;
GRANT ALL ON FUNCTION public.get_sector_availability(p_event_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.get_sector_availability(p_event_id uuid) TO service_role;


--
-- Name: FUNCTION get_sector_prices(p_event_id uuid); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.get_sector_prices(p_event_id uuid) TO anon;
GRANT ALL ON FUNCTION public.get_sector_prices(p_event_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.get_sector_prices(p_event_id uuid) TO service_role;


--
-- Name: FUNCTION get_taken_seats(p_sector_id uuid); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.get_taken_seats(p_sector_id uuid) TO anon;
GRANT ALL ON FUNCTION public.get_taken_seats(p_sector_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.get_taken_seats(p_sector_id uuid) TO service_role;


--
-- Name: FUNCTION get_venue_map(p_map_id uuid); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.get_venue_map(p_map_id uuid) TO anon;
GRANT ALL ON FUNCTION public.get_venue_map(p_map_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.get_venue_map(p_map_id uuid) TO service_role;


--
-- Name: FUNCTION handle_new_user(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.handle_new_user() TO anon;
GRANT ALL ON FUNCTION public.handle_new_user() TO authenticated;
GRANT ALL ON FUNCTION public.handle_new_user() TO service_role;


--
-- Name: FUNCTION is_admin(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.is_admin() TO anon;
GRANT ALL ON FUNCTION public.is_admin() TO authenticated;
GRANT ALL ON FUNCTION public.is_admin() TO service_role;


--
-- Name: FUNCTION is_admin_or_staff(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.is_admin_or_staff() TO anon;
GRANT ALL ON FUNCTION public.is_admin_or_staff() TO authenticated;
GRANT ALL ON FUNCTION public.is_admin_or_staff() TO service_role;


--
-- Name: FUNCTION is_normalized_point(p jsonb); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.is_normalized_point(p jsonb) TO anon;
GRANT ALL ON FUNCTION public.is_normalized_point(p jsonb) TO authenticated;
GRANT ALL ON FUNCTION public.is_normalized_point(p jsonb) TO service_role;


--
-- Name: FUNCTION is_normalized_polygon(p jsonb); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.is_normalized_polygon(p jsonb) TO anon;
GRANT ALL ON FUNCTION public.is_normalized_polygon(p jsonb) TO authenticated;
GRANT ALL ON FUNCTION public.is_normalized_polygon(p jsonb) TO service_role;


--
-- Name: FUNCTION issue_courtesy(p_event_id uuid, p_sector_id uuid, p_quantity integer, p_kind text, p_name text, p_email text, p_note text); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.issue_courtesy(p_event_id uuid, p_sector_id uuid, p_quantity integer, p_kind text, p_name text, p_email text, p_note text) FROM PUBLIC;
GRANT ALL ON FUNCTION public.issue_courtesy(p_event_id uuid, p_sector_id uuid, p_quantity integer, p_kind text, p_name text, p_email text, p_note text) TO authenticated;
GRANT ALL ON FUNCTION public.issue_courtesy(p_event_id uuid, p_sector_id uuid, p_quantity integer, p_kind text, p_name text, p_email text, p_note text) TO service_role;


--
-- Name: FUNCTION my_access(); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.my_access() FROM PUBLIC;
GRANT ALL ON FUNCTION public.my_access() TO authenticated;
GRANT ALL ON FUNCTION public.my_access() TO service_role;


--
-- Name: FUNCTION publish_venue_map(p_map_id uuid); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.publish_venue_map(p_map_id uuid) FROM PUBLIC;
GRANT ALL ON FUNCTION public.publish_venue_map(p_map_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.publish_venue_map(p_map_id uuid) TO service_role;


--
-- Name: FUNCTION refresh_event_price_base(p_event_id uuid); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.refresh_event_price_base(p_event_id uuid) FROM PUBLIC;
GRANT ALL ON FUNCTION public.refresh_event_price_base(p_event_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.refresh_event_price_base(p_event_id uuid) TO service_role;


--
-- Name: FUNCTION release_expired_holds(p_sector_id uuid); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.release_expired_holds(p_sector_id uuid) FROM PUBLIC;
GRANT ALL ON FUNCTION public.release_expired_holds(p_sector_id uuid) TO service_role;


--
-- Name: FUNCTION require_event_editor(); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.require_event_editor() FROM PUBLIC;
GRANT ALL ON FUNCTION public.require_event_editor() TO authenticated;
GRANT ALL ON FUNCTION public.require_event_editor() TO service_role;


--
-- Name: FUNCTION save_order_details(p_order_id uuid, p_buyer jsonb, p_attendees jsonb); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.save_order_details(p_order_id uuid, p_buyer jsonb, p_attendees jsonb) FROM PUBLIC;
GRANT ALL ON FUNCTION public.save_order_details(p_order_id uuid, p_buyer jsonb, p_attendees jsonb) TO authenticated;
GRANT ALL ON FUNCTION public.save_order_details(p_order_id uuid, p_buyer jsonb, p_attendees jsonb) TO service_role;


--
-- Name: FUNCTION save_venue_map(p_map_id uuid, p_payload jsonb); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.save_venue_map(p_map_id uuid, p_payload jsonb) FROM PUBLIC;
GRANT ALL ON FUNCTION public.save_venue_map(p_map_id uuid, p_payload jsonb) TO authenticated;
GRANT ALL ON FUNCTION public.save_venue_map(p_map_id uuid, p_payload jsonb) TO service_role;


--
-- Name: TABLE event_sectors; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.event_sectors TO anon;
GRANT ALL ON TABLE public.event_sectors TO authenticated;
GRANT ALL ON TABLE public.event_sectors TO service_role;


--
-- Name: FUNCTION seat_is_sellable(p_sector public.event_sectors, p_label text); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.seat_is_sellable(p_sector public.event_sectors, p_label text) FROM PUBLIC;
GRANT ALL ON FUNCTION public.seat_is_sellable(p_sector public.event_sectors, p_label text) TO service_role;


--
-- Name: FUNCTION seat_label_valid(p_label text, p_capacity integer, p_per_row integer); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.seat_label_valid(p_label text, p_capacity integer, p_per_row integer) TO anon;
GRANT ALL ON FUNCTION public.seat_label_valid(p_label text, p_capacity integer, p_per_row integer) TO authenticated;
GRANT ALL ON FUNCTION public.seat_label_valid(p_label text, p_capacity integer, p_per_row integer) TO service_role;


--
-- Name: FUNCTION seat_price(p_sector public.event_sectors, p_label text); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.seat_price(p_sector public.event_sectors, p_label text) FROM PUBLIC;
GRANT ALL ON FUNCTION public.seat_price(p_sector public.event_sectors, p_label text) TO service_role;


--
-- Name: FUNCTION snapshot_venue_map_to_event(p_event_id uuid, p_map_id uuid); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.snapshot_venue_map_to_event(p_event_id uuid, p_map_id uuid) FROM PUBLIC;
GRANT ALL ON FUNCTION public.snapshot_venue_map_to_event(p_event_id uuid, p_map_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.snapshot_venue_map_to_event(p_event_id uuid, p_map_id uuid) TO service_role;


--
-- Name: FUNCTION staff_permission(p_module text); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.staff_permission(p_module text) TO anon;
GRANT ALL ON FUNCTION public.staff_permission(p_module text) TO authenticated;
GRANT ALL ON FUNCTION public.staff_permission(p_module text) TO service_role;


--
-- Name: FUNCTION sync_event_price_base(p_event_id uuid); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.sync_event_price_base(p_event_id uuid) FROM PUBLIC;
GRANT ALL ON FUNCTION public.sync_event_price_base(p_event_id uuid) TO service_role;


--
-- Name: FUNCTION update_event_seats(p_event_id uuid, p_seat_ids uuid[], p_changes jsonb); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.update_event_seats(p_event_id uuid, p_seat_ids uuid[], p_changes jsonb) FROM PUBLIC;
GRANT ALL ON FUNCTION public.update_event_seats(p_event_id uuid, p_seat_ids uuid[], p_changes jsonb) TO authenticated;
GRANT ALL ON FUNCTION public.update_event_seats(p_event_id uuid, p_seat_ids uuid[], p_changes jsonb) TO service_role;


--
-- Name: FUNCTION void_courtesy(p_order_id uuid); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.void_courtesy(p_order_id uuid) FROM PUBLIC;
GRANT ALL ON FUNCTION public.void_courtesy(p_order_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.void_courtesy(p_order_id uuid) TO service_role;


--
-- Name: TABLE event_price_zones; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.event_price_zones TO anon;
GRANT ALL ON TABLE public.event_price_zones TO authenticated;
GRANT ALL ON TABLE public.event_price_zones TO service_role;


--
-- Name: TABLE event_seats; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.event_seats TO anon;
GRANT ALL ON TABLE public.event_seats TO authenticated;
GRANT ALL ON TABLE public.event_seats TO service_role;


--
-- Name: TABLE events; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.events TO anon;
GRANT ALL ON TABLE public.events TO authenticated;
GRANT ALL ON TABLE public.events TO service_role;


--
-- Name: TABLE order_attendees; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.order_attendees TO anon;
GRANT ALL ON TABLE public.order_attendees TO authenticated;
GRANT ALL ON TABLE public.order_attendees TO service_role;


--
-- Name: TABLE order_items; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.order_items TO anon;
GRANT ALL ON TABLE public.order_items TO authenticated;
GRANT ALL ON TABLE public.order_items TO service_role;


--
-- Name: TABLE payment_events; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.payment_events TO anon;
GRANT ALL ON TABLE public.payment_events TO authenticated;
GRANT ALL ON TABLE public.payment_events TO service_role;


--
-- Name: SEQUENCE payment_events_id_seq; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON SEQUENCE public.payment_events_id_seq TO anon;
GRANT ALL ON SEQUENCE public.payment_events_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.payment_events_id_seq TO service_role;


--
-- Name: TABLE seat_holds; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.seat_holds TO anon;
GRANT ALL ON TABLE public.seat_holds TO authenticated;
GRANT ALL ON TABLE public.seat_holds TO service_role;


--
-- Name: TABLE seo_settings; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.seo_settings TO anon;
GRANT ALL ON TABLE public.seo_settings TO authenticated;
GRANT ALL ON TABLE public.seo_settings TO service_role;


--
-- Name: TABLE site_settings; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.site_settings TO anon;
GRANT ALL ON TABLE public.site_settings TO authenticated;
GRANT ALL ON TABLE public.site_settings TO service_role;


--
-- Name: TABLE staff_roles; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.staff_roles TO anon;
GRANT ALL ON TABLE public.staff_roles TO authenticated;
GRANT ALL ON TABLE public.staff_roles TO service_role;


--
-- Name: TABLE tickets; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.tickets TO anon;
GRANT ALL ON TABLE public.tickets TO authenticated;
GRANT ALL ON TABLE public.tickets TO service_role;


--
-- Name: TABLE venue_map_elements; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.venue_map_elements TO anon;
GRANT ALL ON TABLE public.venue_map_elements TO authenticated;
GRANT ALL ON TABLE public.venue_map_elements TO service_role;


--
-- Name: TABLE venue_rows; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.venue_rows TO anon;
GRANT ALL ON TABLE public.venue_rows TO authenticated;
GRANT ALL ON TABLE public.venue_rows TO service_role;


--
-- Name: TABLE venue_seats; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.venue_seats TO anon;
GRANT ALL ON TABLE public.venue_seats TO authenticated;
GRANT ALL ON TABLE public.venue_seats TO service_role;


--
-- Name: TABLE venue_sections; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.venue_sections TO anon;
GRANT ALL ON TABLE public.venue_sections TO authenticated;
GRANT ALL ON TABLE public.venue_sections TO service_role;


--
-- Name: TABLE venues; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.venues TO anon;
GRANT ALL ON TABLE public.venues TO authenticated;
GRANT ALL ON TABLE public.venues TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: -
--

-- (Supabase default, already present) ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;
-- (Supabase default, already present) ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO anon;
-- (Supabase default, already present) ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;
-- (Supabase default, already present) ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: -
--

-- (Supabase default, already present) ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;
-- (Supabase default, already present) ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO anon;
-- (Supabase default, already present) ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;
-- (Supabase default, already present) ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: -
--

-- (Supabase default, already present) ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres;
-- (Supabase default, already present) ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon;
-- (Supabase default, already present) ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO authenticated;
-- (Supabase default, already present) ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: -
--

-- (Supabase default, already present) ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres;
-- (Supabase default, already present) ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon;
-- (Supabase default, already present) ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO authenticated;
-- (Supabase default, already present) ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: -
--

-- (Supabase default, already present) ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO postgres;
-- (Supabase default, already present) ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO anon;
-- (Supabase default, already present) ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
-- (Supabase default, already present) ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: -
--

-- (Supabase default, already present) ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO postgres;
-- (Supabase default, already present) ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO anon;
-- (Supabase default, already present) ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
-- (Supabase default, already present) ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO service_role;


--
-- PostgreSQL database dump complete
--



-- ---------------------------------------------------------------------------
-- Fuera del esquema public: trigger de auth, buckets y políticas de storage
-- ---------------------------------------------------------------------------

set search_path = public, extensions;
-- Trigger: profile for each new user
drop trigger if exists on_auth_user_created on auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();
-- Storage buckets
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values ('branding', 'branding', true, null, null) on conflict (id) do nothing;
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values ('events', 'events', true, null, null) on conflict (id) do nothing;
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values ('venue-maps', 'venue-maps', true, 10485760, '{image/png,image/jpeg,image/webp}'::text[]) on conflict (id) do nothing;
-- Storage policies
drop policy if exists "Admins delete branding" on storage.objects;
drop policy if exists "Admins delete events" on storage.objects;
drop policy if exists "Admins update branding" on storage.objects;
drop policy if exists "Admins update events" on storage.objects;
drop policy if exists "Admins upload branding" on storage.objects;
drop policy if exists "Admins upload events" on storage.objects;
drop policy if exists "Event editors delete venue map images" on storage.objects;
drop policy if exists "Event editors replace venue map images" on storage.objects;
drop policy if exists "Event editors upload venue map images" on storage.objects;
drop policy if exists "Public read branding" on storage.objects;
drop policy if exists "Public read events" on storage.objects;
drop policy if exists "Venue map images are public" on storage.objects;
create policy "Admins delete branding" on storage.objects as PERMISSIVE for DELETE to public using (((bucket_id = 'branding'::text) AND is_admin_or_staff()));
create policy "Admins delete events" on storage.objects as PERMISSIVE for DELETE to public using (((bucket_id = 'events'::text) AND is_admin_or_staff()));
create policy "Admins update branding" on storage.objects as PERMISSIVE for UPDATE to public using (((bucket_id = 'branding'::text) AND is_admin_or_staff()));
create policy "Admins update events" on storage.objects as PERMISSIVE for UPDATE to public using (((bucket_id = 'events'::text) AND is_admin_or_staff()));
create policy "Admins upload branding" on storage.objects as PERMISSIVE for INSERT to public with check (((bucket_id = 'branding'::text) AND is_admin_or_staff()));
create policy "Admins upload events" on storage.objects as PERMISSIVE for INSERT to public with check (((bucket_id = 'events'::text) AND is_admin_or_staff()));
create policy "Event editors delete venue map images" on storage.objects as PERMISSIVE for DELETE to authenticated using (((bucket_id = 'venue-maps'::text) AND (staff_permission('eventos'::text) = 'edit'::text)));
create policy "Event editors replace venue map images" on storage.objects as PERMISSIVE for UPDATE to authenticated using (((bucket_id = 'venue-maps'::text) AND (staff_permission('eventos'::text) = 'edit'::text)));
create policy "Event editors upload venue map images" on storage.objects as PERMISSIVE for INSERT to authenticated with check (((bucket_id = 'venue-maps'::text) AND (staff_permission('eventos'::text) = 'edit'::text)));
create policy "Public read branding" on storage.objects as PERMISSIVE for SELECT to public using ((bucket_id = 'branding'::text));
create policy "Public read events" on storage.objects as PERMISSIVE for SELECT to public using ((bucket_id = 'events'::text));
create policy "Venue map images are public" on storage.objects as PERMISSIVE for SELECT to public using ((bucket_id = 'venue-maps'::text));

-- ---------------------------------------------------------------------------
-- Permisos de ejecución de cada función (los proyectos nuevos dan acceso a todos por defecto)
-- ---------------------------------------------------------------------------

set search_path = public;
revoke execute on function public.admin_clients() from public;
revoke execute on function public.admin_clients() from anon;
grant execute on function public.admin_clients() to authenticated;
grant execute on function public.admin_clients() to service_role;
revoke execute on function public.admin_metrics(timestamp with time zone,timestamp with time zone,uuid) from public;
grant execute on function public.admin_metrics(timestamp with time zone,timestamp with time zone,uuid) to authenticated;
revoke execute on function public.admin_metrics(timestamp with time zone,timestamp with time zone,uuid) from anon;
grant execute on function public.admin_metrics(timestamp with time zone,timestamp with time zone,uuid) to service_role;
revoke execute on function public.admin_set_member(text,text,uuid) from public;
revoke execute on function public.admin_set_member(text,text,uuid) from anon;
grant execute on function public.admin_set_member(text,text,uuid) to service_role;
grant execute on function public.admin_set_member(text,text,uuid) to authenticated;
revoke execute on function public.attach_flow_payment(uuid,text,bigint) from public;
grant execute on function public.attach_flow_payment(uuid,text,bigint) to service_role;
revoke execute on function public.attach_flow_payment(uuid,text,bigint) from authenticated;
revoke execute on function public.attach_flow_payment(uuid,text,bigint) from anon;
revoke execute on function public.begin_order_payment(uuid,integer) from public;
grant execute on function public.begin_order_payment(uuid,integer) to service_role;
revoke execute on function public.begin_order_payment(uuid,integer) from authenticated;
revoke execute on function public.begin_order_payment(uuid,integer) from anon;
revoke execute on function public.confirm_order_payment(uuid,bigint,integer) from public;
revoke execute on function public.confirm_order_payment(uuid,bigint,integer) from anon;
grant execute on function public.confirm_order_payment(uuid,bigint,integer) to service_role;
revoke execute on function public.confirm_order_payment(uuid,bigint,integer) from authenticated;
revoke execute on function public.copy_venue_map_content(uuid,uuid) from public;
grant execute on function public.copy_venue_map_content(uuid,uuid) to service_role;
revoke execute on function public.copy_venue_map_content(uuid,uuid) from anon;
revoke execute on function public.copy_venue_map_content(uuid,uuid) from authenticated;
revoke execute on function public.create_order(uuid,jsonb,integer) from public;
revoke execute on function public.create_order(uuid,jsonb,integer) from anon;
grant execute on function public.create_order(uuid,jsonb,integer) to authenticated;
grant execute on function public.create_order(uuid,jsonb,integer) to service_role;
revoke execute on function public.create_venue_map_draft(uuid,uuid) from public;
grant execute on function public.create_venue_map_draft(uuid,uuid) to authenticated;
revoke execute on function public.create_venue_map_draft(uuid,uuid) from anon;
grant execute on function public.create_venue_map_draft(uuid,uuid) to service_role;
revoke execute on function public.event_price_zones_sync() from public;
revoke execute on function public.event_price_zones_sync() from authenticated;
revoke execute on function public.event_price_zones_sync() from anon;
grant execute on function public.event_price_zones_sync() to service_role;
revoke execute on function public.fail_order_payment(uuid,text) from public;
grant execute on function public.fail_order_payment(uuid,text) to service_role;
revoke execute on function public.fail_order_payment(uuid,text) from anon;
revoke execute on function public.fail_order_payment(uuid,text) from authenticated;
revoke execute on function public.get_event_seat_admin(uuid) from public;
revoke execute on function public.get_event_seat_admin(uuid) from anon;
grant execute on function public.get_event_seat_admin(uuid) to service_role;
grant execute on function public.get_event_seat_admin(uuid) to authenticated;
revoke execute on function public.get_event_seat_map(uuid) from public;
grant execute on function public.get_event_seat_map(uuid) to anon;
grant execute on function public.get_event_seat_map(uuid) to service_role;
grant execute on function public.get_event_seat_map(uuid) to authenticated;
revoke execute on function public.get_sector_availability(uuid) from public;
grant execute on function public.get_sector_availability(uuid) to service_role;
grant execute on function public.get_sector_availability(uuid) to authenticated;
grant execute on function public.get_sector_availability(uuid) to anon;
revoke execute on function public.get_sector_prices(uuid) from public;
grant execute on function public.get_sector_prices(uuid) to service_role;
grant execute on function public.get_sector_prices(uuid) to authenticated;
grant execute on function public.get_sector_prices(uuid) to anon;
revoke execute on function public.get_taken_seats(uuid) from public;
grant execute on function public.get_taken_seats(uuid) to authenticated;
grant execute on function public.get_taken_seats(uuid) to anon;
grant execute on function public.get_taken_seats(uuid) to service_role;
revoke execute on function public.get_venue_map(uuid) from public;
grant execute on function public.get_venue_map(uuid) to service_role;
grant execute on function public.get_venue_map(uuid) to authenticated;
grant execute on function public.get_venue_map(uuid) to anon;
revoke execute on function public.handle_new_user() from public;
grant execute on function public.handle_new_user() to service_role;
grant execute on function public.handle_new_user() to authenticated;
grant execute on function public.handle_new_user() to anon;
revoke execute on function public.is_admin_or_staff() from public;
grant execute on function public.is_admin_or_staff() to authenticated;
grant execute on function public.is_admin_or_staff() to anon;
grant execute on function public.is_admin_or_staff() to service_role;
revoke execute on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_admin() to service_role;
grant execute on function public.is_admin() to anon;
revoke execute on function public.is_normalized_point(jsonb) from public;
grant execute on function public.is_normalized_point(jsonb) to anon;
grant execute on function public.is_normalized_point(jsonb) to authenticated;
grant execute on function public.is_normalized_point(jsonb) to service_role;
revoke execute on function public.is_normalized_polygon(jsonb) from public;
grant execute on function public.is_normalized_polygon(jsonb) to anon;
grant execute on function public.is_normalized_polygon(jsonb) to authenticated;
grant execute on function public.is_normalized_polygon(jsonb) to service_role;
revoke execute on function public.issue_courtesy(uuid,uuid,integer,text,text,text,text) from public;
grant execute on function public.issue_courtesy(uuid,uuid,integer,text,text,text,text) to authenticated;
revoke execute on function public.issue_courtesy(uuid,uuid,integer,text,text,text,text) from anon;
grant execute on function public.issue_courtesy(uuid,uuid,integer,text,text,text,text) to service_role;
revoke execute on function public.my_access() from public;
revoke execute on function public.my_access() from anon;
grant execute on function public.my_access() to service_role;
grant execute on function public.my_access() to authenticated;
revoke execute on function public.publish_venue_map(uuid) from public;
revoke execute on function public.publish_venue_map(uuid) from anon;
grant execute on function public.publish_venue_map(uuid) to authenticated;
grant execute on function public.publish_venue_map(uuid) to service_role;
revoke execute on function public.refresh_event_price_base(uuid) from public;
grant execute on function public.refresh_event_price_base(uuid) to authenticated;
revoke execute on function public.refresh_event_price_base(uuid) from anon;
grant execute on function public.refresh_event_price_base(uuid) to service_role;
revoke execute on function public.release_expired_holds(uuid) from public;
grant execute on function public.release_expired_holds(uuid) to service_role;
revoke execute on function public.release_expired_holds(uuid) from anon;
revoke execute on function public.release_expired_holds(uuid) from authenticated;
revoke execute on function public.require_event_editor() from public;
grant execute on function public.require_event_editor() to service_role;
revoke execute on function public.require_event_editor() from anon;
grant execute on function public.require_event_editor() to authenticated;
revoke execute on function public.save_order_details(uuid,jsonb,jsonb) from public;
grant execute on function public.save_order_details(uuid,jsonb,jsonb) to authenticated;
revoke execute on function public.save_order_details(uuid,jsonb,jsonb) from anon;
grant execute on function public.save_order_details(uuid,jsonb,jsonb) to service_role;
revoke execute on function public.save_venue_map(uuid,jsonb) from public;
grant execute on function public.save_venue_map(uuid,jsonb) to authenticated;
grant execute on function public.save_venue_map(uuid,jsonb) to service_role;
revoke execute on function public.save_venue_map(uuid,jsonb) from anon;
revoke execute on function public.seat_is_sellable(event_sectors,text) from public;
revoke execute on function public.seat_is_sellable(event_sectors,text) from anon;
revoke execute on function public.seat_is_sellable(event_sectors,text) from authenticated;
grant execute on function public.seat_is_sellable(event_sectors,text) to service_role;
revoke execute on function public.seat_label_valid(text,integer,integer) from public;
grant execute on function public.seat_label_valid(text,integer,integer) to authenticated;
grant execute on function public.seat_label_valid(text,integer,integer) to anon;
grant execute on function public.seat_label_valid(text,integer,integer) to service_role;
revoke execute on function public.seat_price(event_sectors,text) from public;
revoke execute on function public.seat_price(event_sectors,text) from anon;
revoke execute on function public.seat_price(event_sectors,text) from authenticated;
grant execute on function public.seat_price(event_sectors,text) to service_role;
revoke execute on function public.snapshot_venue_map_to_event(uuid,uuid) from public;
revoke execute on function public.snapshot_venue_map_to_event(uuid,uuid) from anon;
grant execute on function public.snapshot_venue_map_to_event(uuid,uuid) to authenticated;
grant execute on function public.snapshot_venue_map_to_event(uuid,uuid) to service_role;
revoke execute on function public.staff_permission(text) from public;
grant execute on function public.staff_permission(text) to anon;
grant execute on function public.staff_permission(text) to service_role;
grant execute on function public.staff_permission(text) to authenticated;
revoke execute on function public.sync_event_price_base(uuid) from public;
grant execute on function public.sync_event_price_base(uuid) to service_role;
revoke execute on function public.sync_event_price_base(uuid) from authenticated;
revoke execute on function public.sync_event_price_base(uuid) from anon;
revoke execute on function public.update_event_seats(uuid,uuid[],jsonb) from public;
revoke execute on function public.update_event_seats(uuid,uuid[],jsonb) from anon;
grant execute on function public.update_event_seats(uuid,uuid[],jsonb) to authenticated;
grant execute on function public.update_event_seats(uuid,uuid[],jsonb) to service_role;
revoke execute on function public.void_courtesy(uuid) from public;
grant execute on function public.void_courtesy(uuid) to authenticated;
grant execute on function public.void_courtesy(uuid) to service_role;
revoke execute on function public.void_courtesy(uuid) from anon;
