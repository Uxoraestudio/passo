-- The «Productor» role's description reached the database with a broken "n
-- with tilde" (the SQL was pasted with the wrong encoding). Written with
-- escapes so it can't happen again, and the existing roles are fixed.

create or replace function public.productora_owner_role(p_org_id uuid)
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_role uuid;
begin
  select id into v_role from public.staff_roles where organization_id = p_org_id and name = 'Productor';
  if v_role is null then
    insert into public.staff_roles (name, description, color, permissions, organization_id)
    values (
      'Productor',
      U&'Due\00F1o de la productora: todo excepto Apariencia y SEO.',
      '#f95721',
      '{"resumen":"edit","eventos":"edit","ventas":"edit","validacion":"edit","clientes":"edit","roles":"edit","configuracion":"edit","apariencia":"none","seo":"none"}'::jsonb,
      p_org_id
    )
    returning id into v_role;
  end if;
  return v_role;
end;
$$;

revoke all on function public.productora_owner_role(uuid) from public, anon, authenticated;
grant execute on function public.productora_owner_role(uuid) to service_role;

update public.staff_roles
   set description = U&'Due\00F1o de la productora: todo excepto Apariencia y SEO.'
 where name = 'Productor' and organization_id is not null;
