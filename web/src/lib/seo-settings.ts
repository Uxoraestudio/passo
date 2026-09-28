import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

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

export const getSeoPage = cache(async (pageKey: SeoPageKey): Promise<SeoPage> => {
  const supabase = await createClient();
  const { data } = await supabase
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
});
