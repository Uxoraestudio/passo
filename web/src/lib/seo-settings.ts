import { cache } from "react";
import { unstable_cache } from "next/cache";
import { CACHE_SECONDS, createPublicClient } from "@/lib/supabase/public";

export type SeoPageKey = "home" | "eventos" | "evento_detalle" | "login" | "registro" | "organizadores";

export type SeoPage = {
  metaTitle: string | null;
  metaDescription: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImageUrl: string | null;
};

const empty: SeoPage = {
  metaTitle: null,
  metaDescription: null,
  ogTitle: null,
  ogDescription: null,
  ogImageUrl: null,
};

// Same for every visitor and rarely changed: cached for CACHE_SECONDS.settings.
const loadSeoPage = unstable_cache(
  async (pageKey: SeoPageKey): Promise<SeoPage> => {
    const { data } = await createPublicClient()
      .from("seo_settings")
      .select("meta_title, meta_description, og_title, og_description, og_image_url")
      .eq("page_key", pageKey)
      .maybeSingle();

    if (!data) return empty;

    return {
      metaTitle: data.meta_title,
      metaDescription: data.meta_description,
      ogTitle: data.og_title,
      ogDescription: data.og_description,
      ogImageUrl: data.og_image_url,
    };
  },
  ["seo-page"],
  { revalidate: CACHE_SECONDS.settings, tags: ["settings"] }
);

export const getSeoPage = cache((pageKey: SeoPageKey) => loadSeoPage(pageKey));
