export type ReportsKpi = {
  id: string;
  label: string;
  icon: string;
  value: string;
  valueSuffix: string;
  tone: "purple" | "orange" | "teal";
  footerKind: "pill" | "progress";
  pillLabel?: string;
  pillIcon?: string;
  captionText: string;
  progressPercent?: number;
  progressLabel?: string;
};

export const reportsKpis: ReportsKpi[] = [
  {
    id: "net-revenue",
    label: "Recaudación Neta Proyectada",
    icon: "account_balance_wallet",
    value: "$184.920.000",
    valueSuffix: "CLP",
    tone: "purple",
    footerKind: "pill",
    pillLabel: "+24.2% YoY",
    pillIcon: "trending_up",
    captionText: "vs $148.8M anterior",
  },
  {
    id: "occupancy",
    label: "Tasa de Ocupación Recintos",
    icon: "chair",
    value: "84.6%",
    valueSuffix: "promedio",
    tone: "purple",
    footerKind: "progress",
    progressPercent: 84.6,
    progressLabel: "35.955 / 42.500 cap",
    captionText: "",
  },
  {
    id: "velocity",
    label: "Velocidad Venta (Velocity)",
    icon: "bolt",
    value: "340",
    valueSuffix: "tickets / hora",
    tone: "orange",
    footerKind: "pill",
    pillLabel: "Primeras 48h pico",
    captionText: "Drop Preventa VIP",
  },
  {
    id: "margin",
    label: "Retorno / Margen Operativo",
    icon: "query_stats",
    value: "31.8%",
    valueSuffix: "ebitda prod.",
    tone: "teal",
    footerKind: "pill",
    pillLabel: "+4.5 pts",
    pillIcon: "arrow_upward",
    captionText: "Eficiencia de pauta",
  },
];

export const periodTabs = ["Temporada 2025-2026", "Último Trimestre", "Personalizado"];

export const reportEventOptions = [
  { value: "all", label: "Vista Consolidada (Todos los Eventos)" },
  { value: "e1", label: "Festival Aurora Sur 2026 - Movistar Arena" },
  { value: "e2", label: "Sinfonía Electrónica - Parque Padre Hurtado" },
  { value: "e3", label: "K-Pop Supreme Tour - Estadio Bicentenario" },
  { value: "e4", label: "Noche de Gala Urbana - Espacio Riesco" },
];

export const sCurveChart = {
  benchmarkPath: "M0,190 C 150,170 300,90 600,15",
  areaPath: "M0,195 C 70,190 110,135 180,125 C 260,118 360,110 440,80 C 510,50 560,28 600,12 L 600,200 L 0,200 Z",
  linePath: "M0,195 C 70,190 110,135 180,125 C 260,118 360,110 440,80 C 510,50 560,28 600,12",
  xLabels: ["Día 0 (Early Bird)", "Semana 2 (Preventa General)", "Semana 5 (Fase Cartel)", "Semana 8 (Semana del Show)"],
  breakevenNote: "Punto de equilibrio (Breakeven): Superado en Día 14 de venta",
};

export type LocalitySegment = {
  id: string;
  label: string;
  color: string;
  percent: number;
  amount: string;
};

export const localitySegments: LocalitySegment[] = [
  { id: "cancha-general", label: "Cancha General", color: "var(--color-purple)", percent: 44, amount: "$81.36M (44%)" },
  { id: "plateas-bajas", label: "Plateas Bajas", color: "var(--color-purple-light)", percent: 28, amount: "$51.77M (28%)" },
  { id: "experiencias-vip", label: "Experiencias VIP", color: "var(--color-orange)", percent: 18, amount: "$33.28M (18%)" },
  { id: "palcos-lounge", label: "Palcos Lounge", color: "#005438", percent: 10, amount: "$18.49M (10%)" },
];

export type GeoSegment = {
  id: string;
  label: string;
  percent: number;
  color: string;
  emphasis?: boolean;
};

export const geoSegments: GeoSegment[] = [
  { id: "rm", label: "Región Metropolitana (Santiago)", percent: 78, color: "var(--color-purple)", emphasis: true },
  { id: "valpo", label: "Región de Valparaíso (Viña / Costa)", percent: 11, color: "var(--color-purple-light)" },
  { id: "biobio", label: "Región del Biobío (Concepción)", percent: 6, color: "var(--color-orange)" },
  { id: "otras", label: "Otras Regiones / Extranjero", percent: 5, color: "var(--color-icon-muted)" },
];

export type ActionAlert = {
  id: string;
  icon: string;
  tone: "orange" | "purple" | "teal";
  title: string;
  description: string;
  ctaLabel: string;
};

export const actionAlerts: ActionAlert[] = [
  {
    id: "dynamic-pricing",
    icon: "dynamic_form",
    tone: "orange",
    title: "Optimización de Precio Dinámico",
    description:
      "Plateas Altas tienen 92% de tráfico pero 41% de abandono. Reducir cargo por servicio sugerido en 1.5% dispararía 320 ventas directas.",
    ctaLabel: "Aplicar Regla Tarifaria",
  },
  {
    id: "vip-release",
    icon: "confirmation_number",
    tone: "purple",
    title: "Liberación de Remanente VIP",
    description: "Quedan 215 accesos Hospitality bloqueados por patrocinadores con plazo vencido (+48 hrs). Apto para reasignar a venta pública.",
    ctaLabel: "Liberar a Preventa Abierta",
  },
  {
    id: "tax-retention",
    icon: "account_balance",
    tone: "teal",
    title: "Retención Impositiva Verificada",
    description: "El certificado DTE N° 4810 ya reconcilió el 19% IVA con el SII. Saldo listo para instrucción de pago a cuenta productora.",
    ctaLabel: "Ver Certificado SII",
  },
];

export type SettlementStatus = "Pagado" | "En Tránsito (48h)" | "Venta Activa" | "Preventa 1";

export type SettlementRow = {
  id: string;
  name: string;
  image?: string;
  fallbackIcon?: string;
  venue: string;
  date: string;
  gross: string;
  fee: string;
  vat: string;
  gateway: string;
  netSettlement: string;
  netTone: "teal" | "neutral" | "orange";
  status: SettlementStatus;
};

export const settlementRows: SettlementRow[] = [
  {
    id: "aurora-sur",
    name: "Festival Aurora Sur 2026",
    image: "/images/report-aurora-sur.jpg",
    venue: "Movistar Arena",
    date: "14 Mar 2026",
    gross: "$98.500.000",
    fee: "-$7.880.000",
    vat: "-$15.726.890",
    gateway: "-$1.467.650",
    netSettlement: "$73.425.460",
    netTone: "teal",
    status: "Pagado",
  },
  {
    id: "sinfonia",
    name: "Sinfonía Electrónica",
    image: "/images/report-sinfonia.jpg",
    venue: "Parque Padre Hurtado",
    date: "28 Feb 2026",
    gross: "$52.320.000",
    fee: "-$4.185.600",
    vat: "-$8.353.949",
    gateway: "-$779.568",
    netSettlement: "$39.000.883",
    netTone: "neutral",
    status: "En Tránsito (48h)",
  },
  {
    id: "kpop",
    name: "K-Pop Supreme Tour",
    image: "/images/report-kpop.jpg",
    venue: "Estadio Bicentenario",
    date: "22 Abr 2026",
    gross: "$24.100.000",
    fee: "-$1.928.000",
    vat: "-$3.848.235",
    gateway: "-$359.090",
    netSettlement: "$17.964.675",
    netTone: "orange",
    status: "Venta Activa",
  },
  {
    id: "gala-urbana",
    name: "Noche de Gala Urbana",
    fallbackIcon: "nightlife",
    venue: "Espacio Riesco",
    date: "05 Mayo 2026",
    gross: "$10.000.000",
    fee: "-$800.000",
    vat: "-$1.596.638",
    gateway: "-$149.000",
    netSettlement: "$7.454.362",
    netTone: "orange",
    status: "Preventa 1",
  },
];

export const settlementTotals = {
  gross: "$184.920.000",
  fee: "-$14.793.600",
  vat: "-$29.525.712",
  gateway: "-$2.755.308",
  net: "$137.845.380 CLP",
};
