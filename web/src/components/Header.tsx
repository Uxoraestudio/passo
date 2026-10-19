import { getSiteSettings } from "@/lib/site-settings";
import { getAllEvents } from "@/lib/events-data";
import { createClient } from "@/lib/supabase/server";
import { accountDisplayName, initialsOf } from "@/lib/account-user";
import HeaderInner from "./HeaderInner";

export default async function Header() {
  const supabase = await createClient();
  // Only for the greeting: the session is verified locally, without a call to Supabase Auth.
  const [settings, events, { data }] = await Promise.all([getSiteSettings(), getAllEvents(), supabase.auth.getClaims()]);
  const claims = data?.claims;
  const name = claims?.sub ? accountDisplayName({ email: claims.email as string | undefined, user_metadata: claims.user_metadata ?? {} }) : null;

  return (
    <HeaderInner
      logoUrl={settings.logoPrimaryUrl ?? null}
      events={events}
      account={name ? { firstName: name.split(/\s+/)[0], initials: initialsOf(name) } : null}
    />
  );
}
