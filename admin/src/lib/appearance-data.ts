export type ColorFieldId =
  | "primary"
  | "secondary"
  | "bgLight"
  | "bgDark"
  | "textPrimary"
  | "textSecondary"
  | "success"
  | "warning"
  | "error";

export type ColorField = {
  id: ColorFieldId;
  label: string;
  default: string;
};

export const colorFields: ColorField[] = [
  { id: "primary", label: "Color primario", default: "#6534F5" },
  { id: "secondary", label: "Color secundario", default: "#FF782D" },
  { id: "bgLight", label: "Fondo principal", default: "#FFFFFF" },
  { id: "bgDark", label: "Fondo oscuro", default: "#211333" },
  { id: "textPrimary", label: "Texto principal", default: "#211333" },
  { id: "textSecondary", label: "Texto secundario", default: "#6E6980" },
  { id: "success", label: "Éxito", default: "#22B573" },
  { id: "warning", label: "Advertencia", default: "#F5A623" },
  { id: "error", label: "Error", default: "#E93D55" },
];

export const defaultColors: Record<ColorFieldId, string> = colorFields.reduce(
  (acc, field) => ({ ...acc, [field.id]: field.default }),
  {} as Record<ColorFieldId, string>
);

export type LogoSlotId = "primary" | "dark" | "isotype" | "favicon";

export type LogoSlot = {
  id: LogoSlotId;
  title: string;
  description: string;
  recommendation: string;
  previewDark: boolean;
};

export const logoSlots: LogoSlot[] = [
  {
    id: "primary",
    title: "Logo principal",
    description: "Para fondos claros",
    recommendation: "Recomendado: 400 × 120 px · SVG o PNG",
    previewDark: false,
  },
  {
    id: "dark",
    title: "Logo para fondo oscuro",
    description: "Para fondos oscuros",
    recommendation: "Recomendado: 400 × 120 px · SVG o PNG",
    previewDark: true,
  },
  {
    id: "isotype",
    title: "Isotipo",
    description: "Versión simplificada",
    recommendation: "Recomendado: 200 × 200 px · SVG o PNG",
    previewDark: false,
  },
  {
    id: "favicon",
    title: "Favicon",
    description: "Para la pestaña del navegador",
    recommendation: "Recomendado: 32 × 32 px · PNG",
    previewDark: false,
  },
];
