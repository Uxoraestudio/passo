import { createClient } from "@/lib/supabase/client";

export type SeoPageKey = "home" | "eventos" | "evento_detalle" | "login" | "registro" | "organizadores";

export type SeoPage = {
  pageKey: SeoPageKey;
  label: string;
  description: string;
  metaTitle: string;
  metaDescription: string;
  ogTitle: string;
  ogDescription: string;
  ogImageUrl: string | null;
};

export const seoPageOrder: { pageKey: SeoPageKey; label: string; description: string }[] = [
  { pageKey: "home", label: "Inicio", description: "Portada del sitio (passo.cl)" },
  { pageKey: "eventos", label: "Listado de eventos", description: "Página /eventos" },
  { pageKey: "evento_detalle", label: "Detalle de evento (plantilla)", description: "Valores de respaldo para eventos sin imagen o descripción propia" },
  { pageKey: "login", label: "Iniciar sesión", description: "Página de login de usuarios" },
  { pageKey: "registro", label: "Registro", description: "Página de registro de usuarios" },
  { pageKey: "organizadores", label: "Organizadores", description: "Página para organizadores de eventos" },
];

type SeoRow = {
  page_key: string;
  meta_title: string | null;
  meta_description: string | null;
  og_title: string | null;
  og_description: string | null;
  og_image_url: string | null;
};

export async function listSeoPages(): Promise<SeoPage[]> {
  const supabase = createClient();
  const { data, error } = await supabase.from("seo_settings").select("*");
  if (error) throw error;

  const byKey = new Map((data ?? []).map((row: SeoRow) => [row.page_key, row]));

  return seoPageOrder.map(({ pageKey, label, description }) => {
    const row = byKey.get(pageKey);
    return {
      pageKey,
      label,
      description,
      metaTitle: row?.meta_title ?? "",
      metaDescription: row?.meta_description ?? "",
      ogTitle: row?.og_title ?? "",
      ogDescription: row?.og_description ?? "",
      ogImageUrl: row?.og_image_url ?? null,
    };
  });
}

export async function saveSeoPage(page: SeoPage): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("seo_settings").upsert({
    page_key: page.pageKey,
    meta_title: page.metaTitle || null,
    meta_description: page.metaDescription || null,
    og_title: page.ogTitle || null,
    og_description: page.ogDescription || null,
    og_image_url: page.ogImageUrl,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}

export async function uploadSeoImage(pageKey: SeoPageKey, file: File): Promise<string> {
  const supabase = createClient();
  const ext = file.name.split(".").pop() || "jpg";
  const path = `og-${pageKey}.${ext}`;

  const { error: uploadError } = await supabase.storage.from("branding").upload(path, file, { upsert: true });
  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from("branding").getPublicUrl(path);
  return `${data.publicUrl}?v=${Date.now()}`;
}
