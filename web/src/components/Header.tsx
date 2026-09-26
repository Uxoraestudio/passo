import { getSiteSettings } from "@/lib/site-settings";
import HeaderInner from "./HeaderInner";

export default async function Header() {
  const settings = await getSiteSettings();

  return <HeaderInner logoUrl={settings.logoPrimaryUrl ?? null} />;
}
