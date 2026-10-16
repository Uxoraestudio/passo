-- Lista de asistentes de un evento (admin).
-- Depends on 20261016130000_ticket_validation.sql (ticket_seat_text, tickets.used_by).
--
-- One row per ticket issued for the event, sold or courtesy, with who holds it,
-- where they sit, the purchase it came from and whether it was validated at
-- the door. For staff who can see events or validation.

create or replace function public.event_attendees(p_event_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if public.staff_permission('eventos') not in ('view', 'edit') and not public.can_validate_tickets() then
    raise exception 'FORBIDDEN';
  end if;

  return coalesce((
    select jsonb_agg(row_to_json(a) order by a.sector, a.seat_sort nulls last, a.holder)
      from (
        select
          t.id,
          coalesce(nullif(btrim(t.holder_name), ''), nullif(btrim(o.buyer_name), '')) as holder,
          t.holder_document as document,
          coalesce(t.holder_email, o.buyer_email) as email,
          t.sector_name as sector,
          public.ticket_seat_text(t.sector_id, t.seat_label) as seat,
          t.seat_label as seat_sort,
          t.status,
          t.used_at,
          t.used_gate,
          (select coalesce(p.full_name, p.email) from public.profiles p where p.id = t.used_by) as validated_by,
          o.kind,
          o.code as order_code,
          o.status as order_status,
          coalesce(nullif(btrim(o.buyer_name), ''), o.buyer_email) as buyer,
          o.buyer_email,
          o.buyer_document,
          o.buyer_phone,
          coalesce(o.paid_at, o.created_at) as purchased_at,
          o.total as order_total,
          -- What this ticket cost: the price of its line in the order.
          (select i.unit_price
             from public.order_items i
            where i.order_id = o.id and i.sector_id = t.sector_id
              and (t.seat_label is null and cardinality(i.seat_labels) = 0 or t.seat_label = any (i.seat_labels))
            limit 1) as price,
          o.note,
          (select coalesce(p.full_name, p.email) from public.profiles p where p.id = o.issued_by) as issued_by
        from public.tickets t
        join public.orders o on o.id = t.order_id
        where t.event_id = p_event_id
      ) a
  ), '[]'::jsonb);
end;
$$;

revoke all on function public.event_attendees(uuid) from public, anon;
grant execute on function public.event_attendees(uuid) to authenticated;
-- New Supabase projects grant EXECUTE to anon by default.
revoke execute on function public.event_attendees(uuid) from anon;
