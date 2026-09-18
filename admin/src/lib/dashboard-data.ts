export type KpiDatum = {
  id: string;
  label: string;
  value: string;
  delta: string;
  iconBg: "purple" | "orange";
  icon: "bars" | "ticket" | "calendar" | "pie";
};

export const kpis: KpiDatum[] = [
  { id: "ventas", label: "Ventas totales", value: "$ 48.620.000", delta: "+23%", iconBg: "purple", icon: "bars" },
  { id: "entradas", label: "Entradas vendidas", value: "12.840", delta: "+18%", iconBg: "orange", icon: "ticket" },
  { id: "eventos", label: "Eventos activos", value: "8", delta: "+33%", iconBg: "purple", icon: "calendar" },
  { id: "ocupacion", label: "Tasa de ocupación", value: "78%", delta: "+12%", iconBg: "orange", icon: "pie" },
];

export type SalesPoint = { label: string; sales: number; revenue: number };

export const salesSeries: SalesPoint[] = [
  { label: "1 Oct", sales: 620, revenue: 2.1 },
  { label: "4 Oct", sales: 980, revenue: 3.4 },
  { label: "7 Oct", sales: 740, revenue: 2.8 },
  { label: "10 Oct", sales: 1120, revenue: 4.6 },
  { label: "13 Oct", sales: 1380, revenue: 5.2 },
  { label: "16 Oct", sales: 1050, revenue: 4.1 },
  { label: "19 Oct", sales: 1460, revenue: 5.9 },
  { label: "22 Oct", sales: 1780, revenue: 6.8 },
  { label: "25 Oct", sales: 1620, revenue: 6.3 },
  { label: "28 Oct", sales: 1940, revenue: 7.4 },
  { label: "31 Oct", sales: 2000, revenue: 8.0 },
];

export type CategoryDatum = {
  id: string;
  label: string;
  value: number;
  percent: number;
  color: string;
};

export const ticketCategories: CategoryDatum[] = [
  { id: "musica", label: "Música", value: 5778, percent: 45, color: "#5b32e6" },
  { id: "teatro", label: "Teatro", value: 2568, percent: 20, color: "#f95721" },
  { id: "deporte", label: "Deporte", value: 1926, percent: 15, color: "#a78bfa" },
  { id: "comedia", label: "Comedia", value: 1541, percent: 12, color: "#f59e0b" },
  { id: "festivales", label: "Festivales", value: 1027, percent: 8, color: "#c4b5fd" },
];

export const ticketCategoriesTotal = ticketCategories.reduce((sum, c) => sum + c.value, 0);

export type EventStatus = "a-la-venta" | "agotado" | "proximamente";

export type UpcomingEvent = {
  id: string;
  name: string;
  tour: string;
  category: string;
  gradient: string;
  day: string;
  month: string;
  year: string;
  time: string;
  venue: string;
  city: string;
  sold: string;
  capacity: string;
  status: EventStatus;
};

export const statusLabels: Record<EventStatus, string> = {
  "a-la-venta": "A la venta",
  agotado: "Agotado",
  proximamente: "Próximamente",
};

export const upcomingEvents: UpcomingEvent[] = [
  {
    id: "luna-nova",
    name: "Luna Nova",
    tour: "Prisma Tour",
    category: "Música",
    gradient: "linear-gradient(135deg, #f43f5e 0%, #9a3bc9 50%, #7c3aed 100%)",
    day: "24",
    month: "oct",
    year: "2025",
    time: "21:00",
    venue: "Movistar Arena",
    city: "Santiago",
    sold: "6.482",
    capacity: "8.500",
    status: "a-la-venta",
  },
  {
    id: "dua-lipa",
    name: "Dua Lipa",
    tour: "Radical Optimism Tour",
    category: "Música",
    gradient: "linear-gradient(135deg, #f97316 0%, #ec4899 50%, #a855f7 100%)",
    day: "24",
    month: "oct",
    year: "2025",
    time: "20:00",
    venue: "Movistar Arena",
    city: "Santiago",
    sold: "8.500",
    capacity: "8.500",
    status: "agotado",
  },
  {
    id: "imagine-dragons",
    name: "Imagine Dragons",
    tour: "LOOM World Tour",
    category: "Música",
    gradient: "linear-gradient(135deg, #6534f5 0%, #3b82f6 50%, #06b6d4 100%)",
    day: "14",
    month: "nov",
    year: "2025",
    time: "21:00",
    venue: "Estadio Nacional",
    city: "Santiago",
    sold: "3.200",
    capacity: "9.000",
    status: "a-la-venta",
  },
  {
    id: "clasico-pacifico",
    name: "Clásico del Pacífico",
    tour: "Chile vs Perú",
    category: "Deporte",
    gradient: "linear-gradient(135deg, #059669 0%, #10b981 50%, #34d399 100%)",
    day: "05",
    month: "dic",
    year: "2025",
    time: "18:00",
    venue: "Estadio Nacional",
    city: "Santiago",
    sold: "0",
    capacity: "9.000",
    status: "proximamente",
  },
  {
    id: "rey-leon",
    name: "El Rey León",
    tour: "El musical que emociona",
    category: "Teatro",
    gradient: "linear-gradient(135deg, #f59e0b 0%, #f97316 50%, #ef4444 100%)",
    day: "18",
    month: "ene",
    year: "2026",
    time: "19:30",
    venue: "Teatro Municipal",
    city: "Santiago",
    sold: "1.200",
    capacity: "1.500",
    status: "a-la-venta",
  },
];

export type ActivityKind = "venta" | "evento" | "validacion" | "cliente";

export type ActivityItem = {
  id: string;
  kind: ActivityKind;
  text: string;
  time: string;
};

export const recentActivity: ActivityItem[] = [
  { id: "a1", kind: "venta", text: "Nueva venta: 4 entradas para Luna Nova", time: "Hace 5 min" },
  { id: "a2", kind: "validacion", text: "128 entradas validadas en Movistar Arena", time: "Hace 22 min" },
  { id: "a3", kind: "cliente", text: "Nuevo cliente corporativo: Fénix Producciones", time: "Hace 1 h" },
  { id: "a4", kind: "evento", text: "Evento publicado: Clásico del Pacífico", time: "Hace 3 h" },
  { id: "a5", kind: "venta", text: "Nueva venta: 12 entradas para Dua Lipa", time: "Hace 5 h" },
  { id: "a6", kind: "cliente", text: "Reembolso procesado: Pedro Ruminot", time: "Ayer" },
];
