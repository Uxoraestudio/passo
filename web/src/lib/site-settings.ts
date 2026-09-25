import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export type SiteSettings = {
  colorPrimary: string | null;
  colorSecondary: string | null;
  colorBgLight: string | null;
  colorTextPrimary: string | null;
  logoPrimaryUrl: string | null;
  logoDarkUrl: string | null;
  logoIsotypeUrl: string | null;
  logoFaviconUrl: string | null;
};

const empty: SiteSettings = {
  colorPrimary: null,
  colorSecondary: null,
  colorBgLight: null,
  colorTextPrimary: null,
  logoPrimaryUrl: null,
  logoDarkUrl: null,
  logoIsotypeUrl: null,
  logoFaviconUrl: null,
};

export const getSiteSettings = cache(async (): Promise<SiteSettings> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("site_settings")
    .select(
      "color_primary, color_secondary, color_bg_light, color_text_primary, logo_primary_url, logo_dark_url, logo_isotype_url, logo_favicon_url"
    )
    .eq("id", "default")
    .maybeSingle();

  if (!data) return empty;

  return {
    colorPrimary: data.color_primary,
    colorSecondary: data.color_secondary,
    colorBgLight: data.color_bg_light,
    colorTextPrimary: data.color_text_primary,
    logoPrimaryUrl: data.logo_primary_url,
    logoDarkUrl: data.logo_dark_url,
    logoIsotypeUrl: data.logo_isotype_url,
    logoFaviconUrl: data.logo_favicon_url,
  };
});
