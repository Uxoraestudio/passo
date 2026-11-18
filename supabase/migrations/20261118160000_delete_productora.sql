-- Deleting a productora (Productoras → «Eliminar productora»).
--
-- Only the admin panel's server calls it (service role), after checking the
-- caller is a platform admin and that they typed the productora's name.
-- Refused for the platform's own productora and for one that has events:
-- its events (and their orders and tickets) must be deleted first, so no sale
-- is ever lost by deleting a productora.
--
-- Its team loses panel access: accounts created only for this productora
-- (account_type 'productora') are deleted; any other account (a customer who
-- was on its team) goes back to being a plain customer. Its roles are
-- deleted; producer requests approved into it stay, unlinked.

create or replace function public.admin_delete_productora(p_org_id uuid, p_name text)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_org public.organizations;
  v_accounts uuid[];
  v_detached integer;
begin
  select * into v_org from public.organizations where id = p_org_id for update;
  if not found then
    raise exception 'ORG_NOT_FOUND';
  end if;
  if v_org.is_default then
    raise exception 'IS_DEFAULT';
  end if;
  if btrim(coalesce(p_name, '')) is distinct from v_org.name then
    raise exception 'NAME_MISMATCH';
  end if;
  if exists (select 1 from public.events e where e.organization_id = p_org_id) then
    raise exception 'HAS_EVENTS';
  end if;

  -- Accounts that exist only for this productora.
  select coalesce(array_agg(p.id), '{}') into v_accounts
    from public.profiles p
   where p.organization_id = p_org_id and p.account_type = 'productora';

  -- Anyone else on its team goes back to being a customer.
  update public.profiles
     set role = 'cliente', staff_role_id = null, organization_id = null
   where organization_id = p_org_id and account_type <> 'productora';
  get diagnostics v_detached = row_count;

  -- The profiles go with their auth users.
  delete from auth.users where id = any(v_accounts);
  delete from public.profiles where id = any(v_accounts);

  update public.producer_requests set organization_id = null where organization_id = p_org_id;
  delete from public.staff_roles where organization_id = p_org_id;
  delete from public.organizations where id = p_org_id;

  return jsonb_build_object('accounts_deleted', coalesce(array_length(v_accounts, 1), 0), 'members_detached', v_detached);
exception
  when foreign_key_violation then
    raise exception 'HAS_DATA' using detail = sqlerrm;
end;
$$;

revoke all on function public.admin_delete_productora(uuid, text) from public, anon, authenticated;
grant execute on function public.admin_delete_productora(uuid, text) to service_role;
