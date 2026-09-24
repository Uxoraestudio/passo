export type ClientsKpi = {
  id: string;
  label: string;
  icon: string;
  value: string;
  valueSuffix?: string;
  deltaIcon?: string;
  deltaLabel?: string;
  captionText: string;
  tone?: "orange";
};

export const clientsKpis: ClientsKpi[] = [
  {
    id: "total",
    label: "Total Clientes Registrados",
    icon: "group",
    value: "38.450",
    deltaIcon: "trending_up",
    deltaLabel: "+12.4%",
    captionText: "vs. mes anterior",
  },
  {
    id: "recurring",
    label: "Compradores Recurrentes",
    icon: "sync",
    value: "42.6%",
    deltaIcon: "arrow_upward",
    deltaLabel: "+3.1%",
    captionText: ">2 eventos asistidos",
  },
  {
    id: "avg-ticket",
    label: "Ticket Promedio por Cliente",
    icon: "receipt_long",
    value: "$62.300",
    valueSuffix: "CLP",
    deltaIcon: "add",
    deltaLabel: "$4.800",
    captionText: "incremento VIP",
  },
  {
    id: "vip",
    label: "Clientes VIP / Alta Fidelidad",
    icon: "stars",
    value: "1.890",
    captionText: "Representan el 34% de la facturación",
    tone: "orange",
  },
];

export const segmentOptions = [
  { value: "all", label: "Todos los clientes" },
  { value: "vip", label: "Compradores VIP" },
  { value: "frecuente", label: "Asistentes Recurrentes" },
  { value: "primera", label: "Primera Compra" },
];

export const eventOptions = [
  { value: "all", label: "Todos los eventos" },
  { value: "luna", label: "Luna Nova • Prisma Tour" },
  { value: "clasico", label: "Clásico del Pacífico" },
  { value: "prisma", label: "Festival Prisma 2025" },
];

export type ClientBadge = "VIP Fan" | "Frecuente" | "Preventista" | "Nuevo";
export type ClientStatus = "Activo" | "Verificado";

export type ClientEvent = {
  name: string;
  detail: string;
  price: string;
  color: string;
};

export type Client = {
  id: string;
  name: string;
  avatar?: string;
  initials: string;
  rut: string;
  location: string;
  email: string;
  segment: "vip" | "frecuente" | "primera";
  eventKey: "luna" | "clasico" | "prisma";
  badge: ClientBadge;
  verified: boolean;
  orders: string;
  tickets: string;
  totalSpent: string;
  lastEvent: string;
  lastEventDetail: string;
  lastEventEmphasis?: boolean;
  status: ClientStatus;
  score: number;
  notes: string;
  events: ClientEvent[];
};

export const clients: Client[] = [
  {
    id: "camila",
    name: "Camila Andrea Valenzuela",
    avatar: "/images/client-camila.jpg",
    initials: "CV",
    rut: "17.842.119-4",
    location: "Santiago, RM",
    email: "c.valenzuela@novamedia.cl",
    segment: "vip",
    eventKey: "luna",
    badge: "VIP Fan",
    verified: true,
    orders: "4 órdenes",
    tickets: "8 entradas",
    totalSpent: "$384.000",
    lastEvent: "Luna Nova • Prisma Tour",
    lastEventDetail: "Platea Preferencial (Fila 03)",
    lastEventEmphasis: true,
    status: "Activo",
    score: 98,
    notes: "Asistente VIP recurrente. Priorizar invitaciones de Meet & Greet para próximos lanzamientos de música indie o pop rock latinoamericano.",
    events: [
      { name: "Luna Nova • Prisma Tour", detail: "Platea Preferencial • 2 Entradas", price: "$120.000", color: "var(--color-orange)" },
      { name: "Clásico del Pacífico 2024", detail: "Tribuna VIP • 2 Entradas", price: "$160.000", color: "var(--color-purple)" },
      { name: "Festival Prisma 2024", detail: "Pase General Weekend • 4 Entradas", price: "$104.000", color: "var(--color-icon-muted)" },
    ],
  },
  {
    id: "christyan",
    name: "Christyan Montiel",
    avatar: "/images/client-christyan.jpg",
    initials: "CM",
    rut: "16.512.903-8",
    location: "Viña del Mar, Valparaíso",
    email: "ch.montiel@gmail.com",
    segment: "frecuente",
    eventKey: "clasico",
    badge: "Frecuente",
    verified: true,
    orders: "3 órdenes",
    tickets: "6 entradas",
    totalSpent: "$210.000",
    lastEvent: "Clásico del Pacífico",
    lastEventDetail: "Tribuna Andes Central",
    status: "Activo",
    score: 84,
    notes: "Compra frecuentemente en tribuna Andes o Lateral. Suele asistir en grupo de 2 a 3 personas.",
    events: [
      { name: "Clásico del Pacífico", detail: "Tribuna Andes Central • 2 Entradas", price: "$110.000", color: "var(--color-orange)" },
      { name: "Luna Nova • Primera Fase", detail: "Cancha Vip • 2 Entradas", price: "$100.000", color: "var(--color-purple)" },
    ],
  },
  {
    id: "matias",
    name: "Matías Ignacio Lagos",
    initials: "ML",
    rut: "19.204.881-2",
    location: "Concepción, Biobío",
    email: "mlagos@outlook.com",
    segment: "frecuente",
    eventKey: "prisma",
    badge: "Preventista",
    verified: true,
    orders: "2 órdenes",
    tickets: "4 entradas",
    totalSpent: "$128.000",
    lastEvent: "Festival Prisma 2025",
    lastEventDetail: "Cancha General • Early Bird 2",
    status: "Activo",
    score: 76,
    notes: "Comprador de etapa Early Bird. Altamente sensible a ofertas preventa Banco de Chile / Santander.",
    events: [
      { name: "Festival Prisma 2025", detail: "Cancha General • Early Bird 2 • 2 Entradas", price: "$64.000", color: "var(--color-icon-muted)" },
      { name: "Festival Prisma 2024", detail: "General • 2 Entradas", price: "$64.000", color: "var(--color-icon-muted)" },
    ],
  },
  {
    id: "florencia",
    name: "Florencia Paz Silva",
    avatar: "/images/client-florencia.jpg",
    initials: "FS",
    rut: "18.992.340-K",
    location: "Providencia, RM",
    email: "flopaz.silva@gmail.com",
    segment: "primera",
    eventKey: "luna",
    badge: "Nuevo",
    verified: false,
    orders: "1 orden",
    tickets: "2 entradas",
    totalSpent: "$76.000",
    lastEvent: "Luna Nova • Prisma Tour",
    lastEventDetail: "Galería Lateral Norte",
    status: "Verificado",
    score: 61,
    notes: "Primera transacción exitosa. Llegó por anuncio en Instagram Stories de Luna Nova.",
    events: [{ name: "Luna Nova • Prisma Tour", detail: "Galería Lateral Norte • 2 Entradas", price: "$76.000", color: "var(--color-orange)" }],
  },
  {
    id: "esteban",
    name: "Esteban Andrés Carrasco",
    initials: "EC",
    rut: "15.774.209-1",
    location: "Las Condes, RM",
    email: "ecarrasco@inversioneschile.cl",
    segment: "vip",
    eventKey: "clasico",
    badge: "VIP Fan",
    verified: true,
    orders: "6 órdenes",
    tickets: "14 entradas",
    totalSpent: "$592.000",
    lastEvent: "Clásico del Pacífico",
    lastEventDetail: "Palco VIP • Hospitalidad",
    lastEventEmphasis: true,
    status: "Activo",
    score: 95,
    notes: "Comprador corporativo / hospitalidad. Requiere factura con anticipación para deducción empresarial.",
    events: [
      { name: "Clásico del Pacífico", detail: "Palco VIP • 6 Entradas", price: "$320.000", color: "var(--color-orange)" },
      { name: "Festival Prisma 2024", detail: "Zona Lounge • 8 Entradas", price: "$272.000", color: "var(--color-purple)" },
    ],
  },
  {
    id: "daniela",
    name: "Daniela Riquelme",
    initials: "DR",
    rut: "20.108.632-5",
    location: "La Serena, Coquimbo",
    email: "d.riquelme@live.cl",
    segment: "frecuente",
    eventKey: "prisma",
    badge: "Frecuente",
    verified: false,
    orders: "2 órdenes",
    tickets: "3 entradas",
    totalSpent: "$115.000",
    lastEvent: "Festival Prisma 2025",
    lastEventDetail: "Acceso 2 Días • General",
    status: "Activo",
    score: 70,
    notes: "Viaja desde regiones para festivales grandes. Revisa correos informativos sobre accesos y estacionamientos.",
    events: [
      { name: "Festival Prisma 2025", detail: "Acceso 2 Días • General • 1 Entrada", price: "$65.000", color: "var(--color-icon-muted)" },
      { name: "Luna Nova • Tour Apertura", detail: "Cancha General • 2 Entradas", price: "$50.000", color: "var(--color-orange)" },
    ],
  },
];
