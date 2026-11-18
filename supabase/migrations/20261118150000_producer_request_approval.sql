-- Producer requests (/organizadores) reviewed in the admin's «Solicitudes».
-- «Aprobar» creates the productora with the request's data and invites the
-- requester (no Aforiq account needed); the request remembers which
-- productora it became. The form now also asks for the country (Chile by
-- default), which fills the productora's country when approving.

alter table public.producer_requests
  add column if not exists organization_id uuid references public.organizations (id) on delete set null,
  add column if not exists country text not null default 'CL';

alter table public.producer_requests drop constraint if exists producer_requests_country_check;
alter table public.producer_requests add constraint producer_requests_country_check check (country ~ '^[A-Z]{2}$');

create index if not exists producer_requests_organization_idx
  on public.producer_requests (organization_id) where organization_id is not null;

comment on table public.producer_requests is
  'Producer sign-up requests from /organizadores. Platform admins review them in Solicitudes; approving creates the productora and invites the requester.';
