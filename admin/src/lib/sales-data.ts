export type SalesKpi = {
  id: string;
  label: string;
  icon: string;
  tone: "purple" | "orange" | "teal";
  value: string;
  valueSuffix?: string;
  deltaIcon: string;
  deltaLabel: string;
  deltaTone: "positive" | "neutral";
  captionText: string;
};

export const salesKpis: SalesKpi[] = [
  {
    id: "gross-sales",
    label: "Ventas Brutas Totales",
    icon: "payments",
    tone: "purple",
    value: "$184.920.000",
    valueSuffix: "CLP",
    deltaIcon: "trending_up",
    deltaLabel: "+18.4%",
    deltaTone: "positive",
    captionText: "vs mes anterior",
  },
  {
    id: "orders",
    label: "Órdenes Procesadas",
    icon: "receipt_long",
    tone: "orange",
    value: "3.842",
    valueSuffix: "transacciones",
    deltaIcon: "trending_up",
    deltaLabel: "+9.2%",
    deltaTone: "positive",
    captionText: "ritmo en alza",
  },
  {
    id: "avg-ticket",
    label: "Ticket Promedio",
    icon: "shopping_bag",
    tone: "purple",
    value: "$48.130",
    valueSuffix: "CLP",
    deltaIcon: "arrow_upward",
    deltaLabel: "+$3.200",
    deltaTone: "positive",
    captionText: "por orden",
  },
  {
    id: "checkout-rate",
    label: "Tasa Conversión Checkout",
    icon: "bolt",
    tone: "teal",
    value: "88.7%",
    valueSuffix: "éxito pasarela",
    deltaIcon: "check_circle",
    deltaLabel: "Óptima",
    deltaTone: "neutral",
    captionText: "0.4% tasa abandono",
  },
];

export const periodOptions = [
  "Últimos 30 días",
  "Últimos 7 días",
  "Hoy (Tiempo Real)",
  "Este mes (Mayo 2025)",
  "Personalizado...",
];

export const eventFilterOptions = [
  "Todos los eventos activos (4)",
  "Sónica Open Air 2025 • Espacio Riesco",
  "Festival Nómada • Movistar Arena",
  "Techno Sessions Club Room",
  "Indie Sunset Festival Viña",
];

export const paymentMethodOptions = [
  "Todos los métodos",
  "WebPay Plus (Transbank)",
  "Tarjeta Débito / Crédito",
  "Mach Pay",
  "MercadoPago Wallet",
];

export const statusFilterOptions = [
  "Cualquier estado",
  "Completada / Aprobada",
  "Pendiente / Procesando",
  "Reembolsada",
  "Fallida / Rechazada",
];

export const evolutionChart = {
  xLabels: ["01 May", "06 May", "12 May", "18 May (Apertura Fase 2)", "24 May", "Hoy (Peak 320 tks)"],
  amountArea: "M 0 180 Q 70 160 120 120 T 240 135 T 360 85 T 480 60 T 600 45 T 700 30 L 700 210 L 0 210 Z",
  amountLine: "M 0 180 Q 70 160 120 120 T 240 135 T 360 85 T 480 60 T 600 45 T 700 30",
  ticketsArea: "M 0 195 Q 70 185 120 165 T 240 170 T 360 130 T 480 110 T 600 95 T 700 80 L 700 210 L 0 210 Z",
  ticketsLine: "M 0 195 Q 70 185 120 165 T 240 170 T 360 130 T 480 110 T 600 95 T 700 80",
  amountMarkers: [
    { cx: 360, cy: 85 },
    { cx: 480, cy: 60 },
    { cx: 600, cy: 45 },
    { cx: 700, cy: 30, emphasis: true },
  ],
  ticketMarkers: [
    { cx: 600, cy: 95 },
    { cx: 700, cy: 80 },
  ],
  peakNote: "Sábado 17 de Mayo (1.140 tickets vendidos en 4 horas)",
};

export type PaymentSegment = {
  id: string;
  label: string;
  color: string;
  percent: number;
  amount: string;
};

export const paymentSegments: PaymentSegment[] = [
  { id: "webpay", label: "WebPay Plus", color: "var(--color-purple)", percent: 65, amount: "$120.198.000" },
  { id: "visa", label: "Visa Débito/Crédito", color: "var(--color-orange)", percent: 20, amount: "$36.984.000" },
  { id: "mastercard", label: "Mastercard Direct", color: "var(--color-purple-light)", percent: 10, amount: "$18.492.000" },
  { id: "otros", label: "Otros (Mach / MP)", color: "var(--color-icon-muted)", percent: 5, amount: "$9.246.000" },
];

export type TransactionStatus = "Aprobada" | "Procesando" | "Fallida" | "Reembolsada";

export type TransactionRow = {
  id: string;
  orderId: string;
  dateLabel: string;
  relativeLabel: string;
  customerInitials: string;
  customerName: string;
  customerContact: string;
  eventName: string;
  eventVenue: string;
  itemsLabel: string;
  itemsCaption: string;
  total: string;
  totalTone: "normal" | "danger";
  paymentIcon: string;
  paymentLabel: string;
  status: TransactionStatus;
};

export const transactionRows: TransactionRow[] = [
  {
    id: "afq-9481",
    orderId: "#AFQ-9481",
    dateLabel: "Hoy, 15:42",
    relativeLabel: "Hace 6 mins",
    customerInitials: "MR",
    customerName: "Matías Rodríguez",
    customerContact: "17.842.109-2 • matias.r@gmail.com",
    eventName: "Sónica Open Air 2025",
    eventVenue: "Espacio Riesco",
    itemsLabel: "2x Early Bird VIP",
    itemsCaption: "Fila 0 • Acceso Front",
    total: "$130.000",
    totalTone: "normal",
    paymentIcon: "credit_card",
    paymentLabel: "WebPay Plus",
    status: "Aprobada",
  },
  {
    id: "afq-9480",
    orderId: "#AFQ-9480",
    dateLabel: "Hoy, 15:39",
    relativeLabel: "Hace 9 mins",
    customerInitials: "CV",
    customerName: "Camila Valenzuela",
    customerContact: "19.340.512-K • cami.val@outlook.com",
    eventName: "Festival Nómada",
    eventVenue: "Movistar Arena",
    itemsLabel: "1x Platea Alta",
    itemsCaption: "Sector C",
    total: "$34.500",
    totalTone: "normal",
    paymentIcon: "smartphone",
    paymentLabel: "Mach Pay",
    status: "Procesando",
  },
  {
    id: "afq-9479",
    orderId: "#AFQ-9479",
    dateLabel: "Hoy, 15:28",
    relativeLabel: "Hace 20 mins",
    customerInitials: "DS",
    customerName: "Diego Santander",
    customerContact: "16.112.983-3 • diego.st@live.cl",
    eventName: "Techno Sessions Club",
    eventVenue: "Sala Omnium",
    itemsLabel: "4x General Preventa",
    itemsCaption: "Cancha General",
    total: "$80.000",
    totalTone: "normal",
    paymentIcon: "credit_card",
    paymentLabel: "Visa Crédito",
    status: "Aprobada",
  },
  {
    id: "afq-9478",
    orderId: "#AFQ-9478",
    dateLabel: "Hoy, 15:15",
    relativeLabel: "Hace 33 mins",
    customerInitials: "AP",
    customerName: "Andrea Paredes",
    customerContact: "18.520.441-1 • andrea.p@yahoo.es",
    eventName: "Sónica Open Air 2025",
    eventVenue: "Espacio Riesco",
    itemsLabel: "1x Lounge Backstage",
    itemsCaption: "Zona Hospitality",
    total: "$180.000",
    totalTone: "normal",
    paymentIcon: "credit_card",
    paymentLabel: "Mastercard Débito",
    status: "Fallida",
  },
  {
    id: "afq-9477",
    orderId: "#AFQ-9477",
    dateLabel: "Hoy, 14:50",
    relativeLabel: "Hace 58 mins",
    customerInitials: "JL",
    customerName: "Javier Lagos F.",
    customerContact: "15.932.774-8 • jlagos@corporativo.cl",
    eventName: "Indie Sunset Viña",
    eventVenue: "Quinta Vergara",
    itemsLabel: "2x Palco Preferencial",
    itemsCaption: "Acceso Poniente",
    total: "-$95.000",
    totalTone: "danger",
    paymentIcon: "account_balance",
    paymentLabel: "MercadoPago",
    status: "Reembolsada",
  },
];
