import { getSiteSettings } from "@/lib/site-settings";
import { getAllEvents } from "@/lib/events-data";
import HeaderInner from "./HeaderInner";

export default async function Header() {
  const [settings, events] = await Promise.all([getSiteSettings(), getAllEvents()]);

  return <HeaderInner logoUrl={settings.logoPrimaryUrl ?? null} events={events} />;
}
