import { createClient } from "@/lib/supabase/client";
import type { ColorFieldId } from "@/lib/appearance-data";
import type { LogoSlotId } from "@/lib/appearance-data";

export type SiteSettings = {
  colors: Partial<Record<ColorFieldId, string>>;
  logos: Partial<Record<LogoSlotId, string>>;
};

const colorColumns: Record<ColorFieldId, string> = {
  primary: "color_primary",
  secondary: "color_secondary",
  bgLight: "color_bg_light",
  bgDark: "color_bg_dark",
  textPrimary: "color_text_primary",
  textSecondary: "color_text_secondary",
  success: "color_success",
  warning: "color_warning",
  error: "color_error",
};

const logoColumns: Record<LogoSlotId, string> = {
  primary: "logo_primary_url",
  dark: "logo_dark_url",
  isotype: "logo_isotype_url",
  favicon: "logo_favicon_url",
};

type SiteSettingsRow = Record<string, string | null>;

export async function getSiteSettings(): Promise<SiteSettings> {
  const supabase = createClient();
  const { data, error } = await supabase.from("site_settings").select("*").eq("id", "default").maybeSingle();
  if (error) throw error;

  const row = (data ?? {}) as SiteSettingsRow;

  const colors = {} as Partial<Record<ColorFieldId, string>>;
  for (const [id, column] of Object.entries(colorColumns) as [ColorFieldId, string][]) {
    if (row[column]) colors[id] = row[column]!;
  }

  const logos = {} as Partial<Record<LogoSlotId, string>>;
  for (const [id, column] of Object.entries(logoColumns) as [LogoSlotId, string][]) {
    if (row[column]) logos[id] = row[column]!;
  }

  return { colors, logos };
}

export async function uploadLogo(slotId: LogoSlotId, file: File): Promise<string> {
  const supabase = createClient();
  const ext = file.name.split(".").pop() || "png";
  const path = `logo-${slotId}.${ext}`;

  const { error: uploadError } = await supabase.storage.from("branding").upload(path, file, { upsert: true });
  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from("branding").getPublicUrl(path);
  return `${data.publicUrl}?v=${Date.now()}`;
}

export async function saveSiteSettings(colors: Record<ColorFieldId, string>, logos: Partial<Record<LogoSlotId, string>>): Promise<void> {
  const supabase = createClient();

  const payload: Record<string, string | null> = { id: "default", updated_at: new Date().toISOString() };
  for (const [id, column] of Object.entries(colorColumns) as [ColorFieldId, string][]) {
    payload[column] = colors[id] ?? null;
  }
  for (const [id, column] of Object.entries(logoColumns) as [LogoSlotId, string][]) {
    payload[column] = logos[id] ?? null;
  }

  const { error } = await supabase.from("site_settings").upsert(payload);
  if (error) throw error;
}
