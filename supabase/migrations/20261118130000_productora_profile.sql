-- Productora profile: country and its representative (legal representative or
-- person in charge) with e-mail and phone. Filled in «Nueva productora»; the
-- representative is the owner invited to the panel.

alter table public.organizations
  add column if not exists country text not null default 'CL',
  add column if not exists contact_first_name text,
  add column if not exists contact_last_name text,
  add column if not exists contact_email text,
  add column if not exists contact_phone text;

alter table public.organizations drop constraint if exists organizations_country_check;
alter table public.organizations add constraint organizations_country_check check (country ~ '^[A-Z]{2}$');
alter table public.organizations drop constraint if exists organizations_contact_check;
alter table public.organizations add constraint organizations_contact_check check (
      (contact_first_name is null or length(btrim(contact_first_name)) between 1 and 60)
  and (contact_last_name is null or length(btrim(contact_last_name)) between 1 and 60)
  and (contact_email is null or contact_email ~ '^[^\s@]+@[^\s@]+\.[^\s@]{2,}$')
  -- International format: +56912345678
  and (contact_phone is null or contact_phone ~ '^\+[1-9][0-9]{7,14}$')
);

-- The productoras list shows the profile on each card.
create or replace function public.organizations_overview()
returns jsonb
language plpgsql
stable
security definer
set search_path to 'public'
as $$
begin
  if not public.is_admin() then
    raise exception 'FORBIDDEN';
  end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object(
             'id', o.id,
             'name', o.name,
             'is_default', o.is_default,
             'created_at', o.created_at,
             'country', o.country,
             'contact', case when o.contact_email is null then null else jsonb_build_object(
                          'first_name', o.contact_first_name,
                          'last_name', o.contact_last_name,
                          'email', o.contact_email,
                          'phone', o.contact_phone
                        ) end,
             'events', (select count(*) from public.events e where e.organization_id = o.id),
             'events_on_sale', (select count(*) from public.events e where e.organization_id = o.id and e.status::text in ('en-venta', 'casi-agotado')),
             'team', coalesce((
               select jsonb_agg(jsonb_build_object(
                        'name', coalesce(nullif(btrim(p.full_name), ''), split_part(p.email, '@', 1)),
                        'email', p.email,
                        'role', coalesce(r.name, 'Acceso completo'),
                        'pending', u.last_sign_in_at is null
                      ) order by r.name = 'Productor' desc, p.created_at)
                 from public.profiles p
                 left join public.staff_roles r on r.id = p.staff_role_id
                 left join auth.users u on u.id = p.id
                where p.organization_id = o.id and p.role::text = 'staff'
             ), '[]'::jsonb)
           ) order by o.is_default desc, o.name)
      from public.organizations o
  ), '[]'::jsonb);
end;
$$;
