-- Venue seat maps (Fase 1: modelo de datos y API).
-- Depends on 20261005120000_orders_payments.sql and 20261006120000_admin_metrics_roles_courtesies.sql.
--
-- Two layers:
--
--   Venue layer (reusable): venue_maps is a versioned plan of a venue drawn over
--   an uploaded image. A version is edited while it is a 'draft' and becomes
--   immutable once 'published'. It holds sections (seated or general admission,
--   as polygons), rows, seats and decorative elements (stage, entrances...).
--
--   Event layer (per event): associating a published map with an event copies
--   its sections into event_sectors and its seats into event_seats. That copy is
--   the event's own snapshot: later edits to the venue create a new version and
--   never touch events that already use an older one.
--
-- All coordinates are normalised to the image: x and y go from 0 to 1, so the
-- plan scales to any screen. Real-world size comes from image_width/height and
-- the calibration (meters per image pixel).
--
-- Per-event seat state is AVAILABLE | BLOCKED | HELD | SOLD. Only BLOCKED is
-- stored (event_seats.base_status); HELD and SOLD are derived from seat_holds,
-- which already prevents double selling, so there is a single source of truth.
--
-- Writes go through SECURITY DEFINER functions that check the caller's
-- permission on the "eventos" module. The bulk save replaces a draft's content
-- in one transaction.

-- ---------------------------------------------------------------------------
-- Venues
-- ---------------------------------------------------------------------------

alter table public.venues add column if not exists address text;

-- ---------------------------------------------------------------------------
-- Venue layer
-- ---------------------------------------------------------------------------

create table if not exists public.venue_maps (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.venues (id) on delete cascade,
  version integer not null check (version >= 1),
  status text not null default 'draft' check (status in ('draft', 'published')),
  -- Path inside the "venue-maps" storage bucket; null while no plan image was uploaded.
  image_path text,
  image_width integer not null default 1600 check (image_width between 1 and 20000),
  image_height integer not null default 1000 check (image_height between 1 and 20000),
  -- Meters per image pixel, from the two-point calibration. Null until calibrated.
  scale_m_per_px numeric check (scale_m_per_px > 0),
  -- { "a": [x, y], "b": [x, y], "meters": n } with normalised points.
  calibration jsonb,
  notes text,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz,
  unique (venue_id, version)
);

-- One draft at a time per venue.
create unique index if not exists venue_maps_one_draft on public.venue_maps (venue_id) where status = 'draft';

alter table public.venues add column if not exists published_map_id uuid references public.venue_maps (id) on delete set null;

create table if not exists public.venue_sections (
  -- Client-generated ids are kept across saves so the editor keeps its selection.
  id uuid primary key default gen_random_uuid(),
  map_id uuid not null references public.venue_maps (id) on delete cascade,
  name text not null check (length(trim(name)) between 1 and 60),
  short_label text,
  kind text not null check (kind in ('SEATED', 'GENERAL_ADMISSION')),
  -- [[x, y], ...] normalised, at least 3 points.
  polygon jsonb not null,
  -- Only for GENERAL_ADMISSION; seated capacity is the number of seats.
  capacity integer check (capacity > 0),
  color text not null default '#6534f5',
  label_x numeric check (label_x between 0 and 1),
  label_y numeric check (label_y between 0 and 1),
  seat_prefix text not null default '',
  -- Parameters of the seat generator (Fase 3), kept to regenerate later.
  generator jsonb,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists venue_sections_map_idx on public.venue_sections (map_id);
create unique index if not exists venue_sections_name_key on public.venue_sections (map_id, lower(name));

create table if not exists public.venue_rows (
  id uuid primary key default gen_random_uuid(),
  section_id uuid not null references public.venue_sections (id) on delete cascade,
  label text not null check (length(label) between 1 and 12),
  sort_order integer not null default 0,
  unique (section_id, label)
);

create table if not exists public.venue_seats (
  id uuid primary key default gen_random_uuid(),
  section_id uuid not null references public.venue_sections (id) on delete cascade,
  row_id uuid references public.venue_rows (id) on delete cascade,
  -- Full label as it is sold and printed, e.g. "A12" or "PB-A12".
  label text not null check (label ~ '^[A-Za-z0-9][A-Za-z0-9._-]{0,23}$'),
  number integer,
  x numeric not null check (x between 0 and 1),
  y numeric not null check (y between 0 and 1),
  kind text not null default 'NORMAL' check (kind in ('NORMAL', 'ACCESSIBLE', 'OBSTRUCTED')),
  base_status text not null default 'AVAILABLE' check (base_status in ('AVAILABLE', 'BLOCKED')),
  -- Edited by hand: the generator (Fase 3) must not overwrite it when regenerating.
  is_manual boolean not null default false,
  sort_order integer not null default 0,
  unique (section_id, label)
);

create index if not exists venue_seats_row_idx on public.venue_seats (row_id);

create table if not exists public.venue_map_elements (
  id uuid primary key default gen_random_uuid(),
  map_id uuid not null references public.venue_maps (id) on delete cascade,
  kind text not null check (kind in ('STAGE', 'ENTRANCE', 'EXIT', 'BAR', 'BATHROOM', 'TEXT')),
  shape text not null check (shape in ('rect', 'ellipse', 'polygon', 'point')),
  -- rect/ellipse: { x, y, w, h }; polygon: { points: [[x, y], ...] }; point: { x, y }. All normalised.
  geometry jsonb not null,
  rotation numeric not null default 0,
  label text,
  color text,
  sort_order integer not null default 0
);

create index if not exists venue_map_elements_map_idx on public.venue_map_elements (map_id);

-- ---------------------------------------------------------------------------
-- Event layer
-- ---------------------------------------------------------------------------

-- Prices belong to the event: the same venue sells at different prices per event.
create table if not exists public.event_price_zones (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  name text not null check (length(trim(name)) between 1 and 40),
  color text not null default '#6534f5',
  price integer not null check (price >= 0),
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create unique index if not exists event_price_zones_name_key on public.event_price_zones (event_id, lower(name));

alter table public.events add column if not exists venue_map_id uuid references public.venue_maps (id) on delete restrict;
alter table public.events add column if not exists seat_map_snapshot_at timestamptz;

alter table public.event_sectors add column if not exists polygon jsonb;
alter table public.event_sectors add column if not exists label_point jsonb;
alter table public.event_sectors add column if not exists seat_prefix text not null default '';
alter table public.event_sectors add column if not exists source_section_id uuid references public.venue_sections (id) on delete set null;
alter table public.event_sectors add column if not exists price_zone_id uuid references public.event_price_zones (id) on delete set null;

create table if not exists public.event_seats (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  sector_id uuid not null references public.event_sectors (id) on delete cascade,
  row_label text,
  label text not null,
  number integer,
  x numeric not null check (x between 0 and 1),
  y numeric not null check (y between 0 and 1),
  kind text not null default 'NORMAL' check (kind in ('NORMAL', 'ACCESSIBLE', 'OBSTRUCTED')),
  base_status text not null default 'AVAILABLE' check (base_status in ('AVAILABLE', 'BLOCKED')),
  -- Why a seat is blocked: produccion, prensa, cortesia, plano...
  block_reason text,
  price_zone_id uuid references public.event_price_zones (id) on delete set null,
  sort_order integer not null default 0,
  unique (sector_id, label)
);

create index if not exists event_seats_event_idx on public.event_seats (event_id);

-- ---------------------------------------------------------------------------
-- Storage: plan images
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('venue-maps', 'venue-maps', true, 10485760, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do nothing;

drop policy if exists "Venue map images are public" on storage.objects;
create policy "Venue map images are public" on storage.objects
  for select using (bucket_id = 'venue-maps');

drop policy if exists "Event editors upload venue map images" on storage.objects;
create policy "Event editors upload venue map images" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'venue-maps' and public.staff_permission('eventos') = 'edit');

drop policy if exists "Event editors replace venue map images" on storage.objects;
create policy "Event editors replace venue map images" on storage.objects
  for update to authenticated
  using (bucket_id = 'venue-maps' and public.staff_permission('eventos') = 'edit');

drop policy if exists "Event editors delete venue map images" on storage.objects;
create policy "Event editors delete venue map images" on storage.objects
  for delete to authenticated
  using (bucket_id = 'venue-maps' and public.staff_permission('eventos') = 'edit');

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------
-- Published plans are public (the buyer's map needs them); drafts are staff-only.
-- Content is written only through the functions below.

alter table public.venue_maps enable row level security;
alter table public.venue_sections enable row level security;
alter table public.venue_rows enable row level security;
alter table public.venue_seats enable row level security;
alter table public.venue_map_elements enable row level security;
alter table public.event_price_zones enable row level security;
alter table public.event_seats enable row level security;

drop policy if exists "Read published maps, staff read drafts" on public.venue_maps;
create policy "Read published maps, staff read drafts" on public.venue_maps
  for select using (status = 'published' or public.is_admin_or_staff());

drop policy if exists "Event editors delete drafts" on public.venue_maps;
create policy "Event editors delete drafts" on public.venue_maps
  for delete using (status = 'draft' and public.staff_permission('eventos') = 'edit');

drop policy if exists "Read sections of visible maps" on public.venue_sections;
create policy "Read sections of visible maps" on public.venue_sections
  for select using (
    exists (select 1 from public.venue_maps m where m.id = map_id and (m.status = 'published' or public.is_admin_or_staff()))
  );

drop policy if exists "Read rows of visible maps" on public.venue_rows;
create policy "Read rows of visible maps" on public.venue_rows
  for select using (
    exists (
      select 1 from public.venue_sections s join public.venue_maps m on m.id = s.map_id
       where s.id = section_id and (m.status = 'published' or public.is_admin_or_staff())
    )
  );

drop policy if exists "Read seats of visible maps" on public.venue_seats;
create policy "Read seats of visible maps" on public.venue_seats
  for select using (
    exists (
      select 1 from public.venue_sections s join public.venue_maps m on m.id = s.map_id
       where s.id = section_id and (m.status = 'published' or public.is_admin_or_staff())
    )
  );

drop policy if exists "Read elements of visible maps" on public.venue_map_elements;
create policy "Read elements of visible maps" on public.venue_map_elements
  for select using (
    exists (select 1 from public.venue_maps m where m.id = map_id and (m.status = 'published' or public.is_admin_or_staff()))
  );

drop policy if exists "Public reads price zones" on public.event_price_zones;
create policy "Public reads price zones" on public.event_price_zones
  for select using (true);

drop policy if exists "Event editors manage price zones" on public.event_price_zones;
create policy "Event editors manage price zones" on public.event_price_zones
  for all using (public.staff_permission('eventos') = 'edit')
  with check (public.staff_permission('eventos') = 'edit');

-- Seat positions and labels carry no personal data.
drop policy if exists "Public reads event seats" on public.event_seats;
create policy "Public reads event seats" on public.event_seats
  for select using (true);

-- Editors may block seats or set their price zone (Fase 5); inserts and deletes
-- only happen through snapshot_venue_map_to_event.
drop policy if exists "Event editors update event seats" on public.event_seats;
create policy "Event editors update event seats" on public.event_seats
  for update using (public.staff_permission('eventos') = 'edit')
  with check (public.staff_permission('eventos') = 'edit');

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.is_normalized_point(p jsonb)
returns boolean
language sql
immutable
as $$
  -- CASE guarantees the casts only run on numbers.
  select case
           when jsonb_typeof(p) <> 'array' or jsonb_array_length(p) <> 2 then false
           when jsonb_typeof(p -> 0) <> 'number' or jsonb_typeof(p -> 1) <> 'number' then false
           else (p ->> 0)::numeric between 0 and 1 and (p ->> 1)::numeric between 0 and 1
         end;
$$;

create or replace function public.is_normalized_polygon(p jsonb)
returns boolean
language sql
immutable
as $$
  select case
           when jsonb_typeof(p) is distinct from 'array' then false
           when jsonb_array_length(p) not between 3 and 500 then false
           else not exists (select 1 from jsonb_array_elements(p) pt where not public.is_normalized_point(pt))
         end;
$$;

create or replace function public.require_event_editor()
returns void
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if public.staff_permission('eventos') <> 'edit' then
    raise exception 'FORBIDDEN';
  end if;
end;
$$;

-- Copies one map's content into another (used to start a new draft from a version).
create or replace function public.copy_venue_map_content(p_from uuid, p_to uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
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

-- ---------------------------------------------------------------------------
-- Venue map API
-- ---------------------------------------------------------------------------

-- Returns the venue's open draft, or creates the next version. With p_from_map_id
-- the new draft starts as a copy of that version (it must belong to the same venue).
create or replace function public.create_venue_map_draft(p_venue_id uuid, p_from_map_id uuid default null)
returns public.venue_maps
language plpgsql
security definer
set search_path = public
as $$
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

-- Bulk save: replaces the whole content of a draft in one transaction.
-- p_payload:
-- {
--   "image_path": text | null, "image_width": int, "image_height": int,
--   "scale_m_per_px": number | null, "calibration": object | null, "notes": text | null,
--   "sections": [{
--     "id": uuid, "name": text, "short_label": text | null,
--     "kind": "SEATED" | "GENERAL_ADMISSION", "polygon": [[x, y], ...],
--     "capacity": int | null, "color": text, "label_x": n | null, "label_y": n | null,
--     "seat_prefix": text, "generator": object | null, "sort_order": int,
--     "rows": [{ "label": text, "sort_order": int }],
--     "seats": [[row_label | null, label, number | null, x, y, kind, base_status, is_manual], ...]
--   }],
--   "elements": [{ "kind", "shape", "geometry", "rotation", "label", "color", "sort_order" }]
-- }
-- Seats travel as compact arrays so a 20.000-seat plan stays a small request.
create or replace function public.save_venue_map(p_map_id uuid, p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
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

-- Freezes a draft. Published versions can't be edited; start a new draft to change them.
create or replace function public.publish_venue_map(p_map_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
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

-- Whole map in the same shape save_venue_map takes (single response, no row limits).
create or replace function public.get_venue_map(p_map_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
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

-- ---------------------------------------------------------------------------
-- Event API
-- ---------------------------------------------------------------------------

-- Copies a published map into the event. Allowed only while the event has no
-- live holds or issued tickets; sectors that old orders still point at are
-- deactivated instead of deleted.
create or replace function public.snapshot_venue_map_to_event(p_event_id uuid, p_map_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
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

-- Everything the buyer's map and the event editor need, with the live state of
-- every seat: AVAILABLE | BLOCKED | HELD | SOLD. Public for published events.
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

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------

revoke all on function public.require_event_editor() from public, anon;
revoke all on function public.copy_venue_map_content(uuid, uuid) from public, anon, authenticated;
revoke all on function public.create_venue_map_draft(uuid, uuid) from public, anon;
revoke all on function public.save_venue_map(uuid, jsonb) from public, anon;
revoke all on function public.publish_venue_map(uuid) from public, anon;
revoke all on function public.snapshot_venue_map_to_event(uuid, uuid) from public, anon;

grant execute on function public.is_normalized_point(jsonb) to anon, authenticated;
grant execute on function public.is_normalized_polygon(jsonb) to anon, authenticated;
grant execute on function public.create_venue_map_draft(uuid, uuid) to authenticated;
grant execute on function public.save_venue_map(uuid, jsonb) to authenticated;
grant execute on function public.publish_venue_map(uuid) to authenticated;
grant execute on function public.snapshot_venue_map_to_event(uuid, uuid) to authenticated;
grant execute on function public.get_venue_map(uuid) to anon, authenticated;
grant execute on function public.get_event_seat_map(uuid) to anon, authenticated;
