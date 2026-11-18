-- Marketing consent per purchase.
--
-- In the last checkout step the buyer can tick «Quiero recibir novedades de
-- <productora>». It's optional and unticked by default. The choice is saved on
-- the order when they press «Pagar» (orders.marketing_opt_in), and Clientes
-- shows each productora which of its buyers accepted: the choice of their
-- latest paid purchase for that productora, so unticking it later withdraws it.

alter table public.orders
  add column if not exists marketing_opt_in boolean not null default false,
  add column if not exists marketing_consent_at timestamptz;

-- The productora behind a buyer's own order, for the consent text. Buyers
-- can't read organizations directly.
create or replace function public.order_organizer_name(p_order_id uuid)
returns text
language sql
stable
security definer
set search_path to 'public'
as $$
  select org.name
    from public.orders o
    join public.events e on e.id = o.event_id
    join public.organizations org on org.id = e.organization_id
   where o.id = p_order_id and o.user_id = auth.uid();
$$;

revoke all on function public.order_organizer_name(uuid) from public, anon;
grant execute on function public.order_organizer_name(uuid) to authenticated, service_role;

-- Clientes: new column marketing_opt_in (for a productora: did the buyer accept
-- its news in their latest paid purchase; null for platform staff, who see
-- buyers of every productora). The return type changes, so it's recreated.
drop function if exists public.admin_clients();

create function public.admin_clients()
returns table(
  id uuid,
  email text,
  full_name text,
  created_at timestamp with time zone,
  orders_paid integer,
  tickets integer,
  total_spent integer,
  last_purchase_at timestamp with time zone,
  marketing_opt_in boolean
)
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
           max(o.paid_at),
           case when v_platform then null else (
             select o3.marketing_opt_in
               from public.orders o3
               join public.events e3 on e3.id = o3.event_id
              where o3.user_id = p.id and o3.status = 'paid' and o3.kind = 'sale' and e3.organization_id = v_org
              order by o3.paid_at desc nulls last
              limit 1
           ) end
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

revoke all on function public.admin_clients() from public, anon;
grant execute on function public.admin_clients() to authenticated, service_role;
