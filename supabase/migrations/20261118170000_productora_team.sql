-- Productora teams in «Roles y equipo».
--
-- 1. The «Productor» role (the owner's) is managed by the platform: a
--    productora can see it but can't edit, delete, assign or take it away,
--    so nobody locks the productora out of its own panel by mistake.
-- 2. A productora adds people to its team by invitation, like its owner: the
--    panel's server creates a productora account (attach_productora_member).
--    It can no longer turn an existing customer account into team staff.
-- 3. team_overview(): the team shown in Roles, with pending invitations.
--    Platform staff see only the platform team; each productora's team is
--    seen from Productoras.

-- 1. Owner role ---------------------------------------------------------------

create or replace function public.staff_roles_protect_owner()
returns trigger
language plpgsql
set search_path to 'public'
as $$
begin
  -- Only people signed in to a productora; the platform and the panel's server can.
  if current_user = 'authenticated' and not public.is_platform_staff() then
    if tg_op <> 'INSERT' and old.organization_id is not null and old.name = 'Productor' then
      raise exception 'OWNER_ROLE' using errcode = '42501';
    end if;
    if tg_op <> 'DELETE' and lower(btrim(new.name)) = 'productor' then
      raise exception 'OWNER_ROLE' using errcode = '42501';
    end if;
  end if;
  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

drop trigger if exists staff_roles_protect_owner on public.staff_roles;
create trigger staff_roles_protect_owner
  before insert or update or delete on public.staff_roles
  for each row execute function public.staff_roles_protect_owner();

-- 2. Members ------------------------------------------------------------------

create or replace function public.admin_set_member(p_email text, p_role text, p_staff_role_id uuid default null)
returns public.profiles
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_target public.profiles;
  v_admins integer;
  v_caller_org uuid := public.my_org_id();
  v_platform boolean := public.is_platform_staff();
  v_role_org uuid;
  v_new_org uuid;
  v_owner_role uuid;
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

  if not v_platform then
    -- A productora only manages people already on its team; new people are invited.
    if v_target.organization_id is distinct from v_caller_org then
      if v_target.organization_id is null and v_target.role::text = 'cliente' then
        raise exception 'USE_INVITE';
      end if;
      raise exception 'OTHER_TEAM';
    end if;
    -- The owner role stays as the platform set it.
    select id into v_owner_role from public.staff_roles where organization_id = v_caller_org and name = 'Productor';
    if v_owner_role is not null and (v_target.staff_role_id = v_owner_role or p_staff_role_id = v_owner_role) then
      raise exception 'OWNER_ROLE';
    end if;
  end if;

  if v_target.role::text = 'admin' and p_role <> 'admin' then
    select count(*) into v_admins from public.profiles where role::text = 'admin';
    if v_admins <= 1 then
      raise exception 'LAST_ADMIN';
    end if;
  end if;

  if p_staff_role_id is not null then
    select organization_id into v_role_org from public.staff_roles where id = p_staff_role_id;
    if not found then
      raise exception 'ROLE_NOT_FOUND';
    end if;
    if not v_platform and v_role_org is distinct from v_caller_org then
      raise exception 'ROLE_NOT_FOUND';
    end if;
  end if;

  v_new_org := case
    when p_role <> 'staff' then null
    when not v_platform then v_caller_org
    when p_staff_role_id is not null then v_role_org
    else v_target.organization_id
  end;

  -- A productora account only exists to run its productora: it can't become a customer or move to another team.
  if v_target.account_type = 'productora' and (p_role <> 'staff' or v_new_org is distinct from v_target.organization_id) then
    raise exception 'PRODUCTORA_ACCOUNT';
  end if;

  update public.profiles
     set role = p_role::public.user_role,
         staff_role_id = case when p_role = 'staff' then p_staff_role_id else null end,
         organization_id = v_new_org
   where id = v_target.id
  returning * into v_target;
  return v_target;
end;
$$;

-- Turns a just-invited account into a member of the productora's team, with
-- the given role (null = full access). Only the panel's server calls it.
create or replace function public.attach_productora_member(p_org_id uuid, p_user_id uuid, p_staff_role_id uuid)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_target public.profiles;
  v_invited boolean;
begin
  if not exists (select 1 from public.organizations where id = p_org_id) then
    raise exception 'ORG_NOT_FOUND';
  end if;
  if p_staff_role_id is not null and not exists (
    select 1 from public.staff_roles where id = p_staff_role_id and organization_id = p_org_id and name <> 'Productor'
  ) then
    raise exception 'ROLE_NOT_FOUND';
  end if;

  select * into v_target from public.profiles where id = p_user_id for update;
  if not found then
    raise exception 'USER_NOT_FOUND';
  end if;

  if v_target.account_type = 'productora' then
    if v_target.organization_id is distinct from p_org_id then
      raise exception 'OTHER_TEAM';
    end if;
  else
    select u.invited_at is not null and u.last_sign_in_at is null into v_invited
      from auth.users u where u.id = p_user_id;
    if v_target.role::text <> 'cliente' then
      raise exception 'OTHER_TEAM';
    end if;
    if not coalesce(v_invited, false) or exists (select 1 from public.orders o where o.user_id = p_user_id) then
      raise exception 'IS_CUSTOMER';
    end if;
  end if;

  update public.profiles
     set account_type = 'productora',
         role = 'staff',
         staff_role_id = p_staff_role_id,
         organization_id = p_org_id
   where id = p_user_id;
end;
$$;

revoke all on function public.attach_productora_member(uuid, uuid, uuid) from public, anon, authenticated;
grant execute on function public.attach_productora_member(uuid, uuid, uuid) to service_role;

-- 3. Team list ----------------------------------------------------------------

create or replace function public.team_overview()
returns jsonb
language plpgsql
stable
security definer
set search_path to 'public'
as $$
declare
  v_platform boolean := public.is_platform_staff();
  v_org uuid := public.my_org_id();
begin
  if not public.is_admin_or_staff() then
    raise exception 'FORBIDDEN';
  end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object(
             'id', p.id,
             'email', p.email,
             'full_name', p.full_name,
             'role', p.role,
             'staff_role_id', p.staff_role_id,
             'created_at', p.created_at,
             'account_type', p.account_type,
             'pending', u.invited_at is not null and u.last_sign_in_at is null
           ) order by p.created_at)
      from public.profiles p
      left join auth.users u on u.id = p.id
     where p.role::text in ('admin', 'staff')
       and (case when v_platform then p.organization_id is null else p.organization_id = v_org end)
  ), '[]'::jsonb);
end;
$$;

revoke all on function public.team_overview() from public, anon;
grant execute on function public.team_overview() to authenticated, service_role;
