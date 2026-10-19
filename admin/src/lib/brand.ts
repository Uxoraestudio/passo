import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export type Brand = {
  /** Logo for light backgrounds. */
  logo: string | null;
  /** Logo for dark backgrounds (sidebar, login header). */
  logoDark: string | null;
  isotype: string | null;
  favicon: string | null;
};

/** The logos uploaded in Apariencia, read on the server for the layout and the icons. */
export const getBrand = cache(async (): Promise<Brand> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("site_settings")
    .select("logo_primary_url, logo_dark_url, logo_isotype_url, logo_favicon_url")
    .eq("id", "default")
    .maybeSingle();
  return {
    logo: data?.logo_primary_url ?? null,
    logoDark: data?.logo_dark_url ?? data?.logo_primary_url ?? null,
    isotype: data?.logo_isotype_url ?? null,
    favicon: data?.logo_favicon_url ?? null,
  };
});
