-- Productora accounts.
--
-- A platform admin creates a productora and types its owner's e-mail; the
-- admin panel (server route, service role) creates the account with an
-- invitation e-mail and calls attach_productora_owner(). These accounts are
-- their own type (profiles.account_type = 'productora'): they only enter the
-- admin panel, never show up in Clientes and can't buy on the public site.
-- An e-mail that already belongs to a customer is rejected.

-- 1. Account type ----------------------------------------------------------

alter table public.profiles add column if not exists account_type text not null default 'cliente';
alter table public.profiles drop constraint if exists profiles_account_type_check;
alter table public.profiles add constraint profiles_account_type_check check (account_type in ('cliente', 'productora'));

-- Nobody changes their own account type through the API.
create or replace function public.profiles_protect_columns()
returns trigger
language plpgsql
set search_path to 'public'
as $$
begin
  if current_user in ('anon', 'authenticated') and (
       new.role is distinct from old.role
    or new.staff_role_id is distinct from old.staff_role_id
    or new.email is distinct from old.email
    or new.id is distinct from old.id
    or new.organization_id is distinct from old.organization_id
    or new.account_type is distinct from old.account_type
  ) then
    raise exception 'FORBIDDEN' using errcode = '42501',
      hint = 'Role, panel access, productora, account type and e-mail are changed from the admin panel.';
  end if;
  return new;
end;
$$;

-- 2. Owner of a productora -------------------------------------------------

-- The productora's «Productor» role (everything except Apariencia and SEO), created the first time.
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
      'Dueño de la productora: todo excepto Apariencia y SEO.',
      '#f95721',
      '{"resumen":"edit","eventos":"edit","ventas":"edit","validacion":"edit","clientes":"edit","roles":"edit","configuracion":"edit","apariencia":"none","seo":"none"}'::jsonb,
      p_org_id
    )
    returning id into v_role;
  end if;
  return v_role;
end;
$$;

-- Turns a just-invited account into the productora's owner. Only the admin
-- panel's server calls it (service role), right after sending the invitation.
create or replace function public.attach_productora_owner(p_org_id uuid, p_user_id uuid)
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

  select * into v_target from public.profiles where id = p_user_id for update;
  if not found then
    raise exception 'USER_NOT_FOUND';
  end if;

  if v_target.account_type = 'productora' then
    if v_target.organization_id is distinct from p_org_id then
      raise exception 'OTHER_TEAM';
    end if;
  else
    -- Only a fresh invitation (never signed in), not someone who already uses Aforiq.
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
         staff_role_id = public.productora_owner_role(p_org_id),
         organization_id = p_org_id
   where id = p_user_id;
end;
$$;

revoke all on function public.productora_owner_role(uuid) from public, anon, authenticated;
revoke all on function public.attach_productora_owner(uuid, uuid) from public, anon, authenticated;
grant execute on function public.productora_owner_role(uuid) to service_role;
grant execute on function public.attach_productora_owner(uuid, uuid) to service_role;

-- Owners are now invited from the panel; customers can't be turned into owners.
revoke all on function public.set_organization_owner(uuid, text) from public, anon, authenticated;

-- 3. Productoras list: who still hasn't accepted the invitation ------------

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

-- 4. Clientes never lists productora accounts ------------------------------

create or replace function public.admin_clients()
returns table(id uuid, email text, full_name text, created_at timestamp with time zone, orders_paid integer, tickets integer, total_spent integer, last_purchase_at timestamp with time zone)
language plpgsql
stable
security definer
set search_path to 'public'
as $$
declare
  v_platform boolean := public.is_platform_staff();
  v_org uuid := public.my_org_id();
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
      left join public.orders o
        on o.user_id = p.id and o.status = 'paid' and o.kind = 'sale'
       and (v_platform or o.event_id in (select e.id from public.events e where e.organization_id = v_org))
     where p.role::text = 'cliente'
       and p.account_type = 'cliente'
       and (
         v_platform
         or exists (
           select 1 from public.orders o2 join public.events e2 on e2.id = o2.event_id
            where o2.user_id = p.id and o2.status = 'paid' and e2.organization_id = v_org
         )
       )
     group by p.id
     order by p.created_at desc;
end;
$$;

-- 5. Roles screen: a productora account stays a member of its productora ---

create or replace function public.admin_set_member(p_email text, p_role text, p_staff_role_id uuid default null::uuid)
returns profiles
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

  -- A productora only manages its own team, and new people who aren't in another team.
  if not v_platform then
    if not (
      v_target.organization_id = v_caller_org
      or (v_target.organization_id is null and v_target.role::text = 'cliente')
    ) then
      raise exception 'OTHER_TEAM';
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

-- 6. Productora accounts don't buy on the public site ----------------------

create or replace function public.orders_block_productora_accounts()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if new.kind = 'sale' and new.user_id is not null
     and exists (select 1 from public.profiles where id = new.user_id and account_type = 'productora') then
    raise exception 'PRODUCTORA_ACCOUNT' using errcode = '42501';
  end if;
  return new;
end;
$$;

revoke all on function public.orders_block_productora_accounts() from public, anon, authenticated;

drop trigger if exists orders_block_productora_accounts on public.orders;
create trigger orders_block_productora_accounts
  before insert on public.orders
  for each row execute function public.orders_block_productora_accounts();
