-- Producer sign-up requests from the public site (/organizadores).
-- The site inserts with the service role (/api/productores); platform admins
-- review them in the admin and, once approved, create the productora with the
-- requester's e-mail as owner (they must have an Aforiq account).

create table if not exists public.producer_requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  status text not null default 'nuevo'
    check (status in ('nuevo', 'contactado', 'aprobado', 'descartado')),
  -- Person
  first_name text not null,
  last_name text not null,
  company text not null,
  email text not null,
  phone text not null,
  city text,
  -- Event
  event_name text,
  category text,
  tentative_date text,
  expected_attendees text,
  event_url text,
  message text,
  -- Signed-in requester, when there was one.
  user_id uuid references auth.users (id) on delete set null,
  -- Admin follow-up
  admin_notes text,
  handled_by uuid references auth.users (id) on delete set null
);

create index if not exists producer_requests_status_idx on public.producer_requests (status, created_at desc);
create index if not exists producer_requests_email_idx on public.producer_requests (lower(email));

alter table public.producer_requests enable row level security;

-- Only platform admins read and manage requests; nobody inserts directly
-- (the site uses the service role after validating the form).
drop policy if exists "Admins read producer requests" on public.producer_requests;
create policy "Admins read producer requests" on public.producer_requests
  for select using (public.is_admin());

drop policy if exists "Admins update producer requests" on public.producer_requests;
create policy "Admins update producer requests" on public.producer_requests
  for update using (public.is_admin()) with check (public.is_admin());
