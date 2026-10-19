-- Correo de compra confirmada: cuándo se envió, para enviarlo una sola vez.
--
-- Flow confirms a payment twice (server notice and the buyer's return), and
-- both paths run the same sync. The web claims the send with
--   update orders set confirmation_email_at = now() where id = … and confirmation_email_at is null
-- so only one of them sends; a failed send clears it again to retry later.
-- Only the service role writes it (orders have no update policy for buyers).

alter table public.orders add column if not exists confirmation_email_at timestamptz;
