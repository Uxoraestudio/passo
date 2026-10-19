import { cache } from "react";
import { unstable_cache } from "next/cache";
import { CACHE_SECONDS, createPublicClient } from "@/lib/supabase/public";

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

// Same for every visitor and rarely changed: cached for CACHE_SECONDS.settings.
const loadSiteSettings = unstable_cache(
  async (): Promise<SiteSettings> => {
    const { data } = await createPublicClient()
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
  },
  ["site-settings"],
  { revalidate: CACHE_SECONDS.settings, tags: ["settings"] }
);

export const getSiteSettings = cache(() => loadSiteSettings());
