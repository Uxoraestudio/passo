import { getSiteSettings } from "@/lib/site-settings";
import { getAllEvents } from "@/lib/events-data";
import { createClient } from "@/lib/supabase/server";
import { accountDisplayName, initialsOf } from "@/lib/account-user";
import HeaderInner from "./HeaderInner";

export default async function Header() {
  const supabase = await createClient();
  const [settings, events, { data }] = await Promise.all([getSiteSettings(), getAllEvents(), supabase.auth.getUser()]);
  const name = data.user ? accountDisplayName(data.user) : null;

  return (
    <HeaderInner
      logoUrl={settings.logoPrimaryUrl ?? null}
      events={events}
      account={name ? { firstName: name.split(/\s+/)[0], initials: initialsOf(name) } : null}
    />
  );
}
