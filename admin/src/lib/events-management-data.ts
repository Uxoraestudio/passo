export type EventStatus = "en-venta" | "casi-agotado" | "proximamente" | "borrador" | "finalizado";

export type EventAction = {
  label: string;
  icon: string;
  tone: "neutral" | "primary" | "secondary" | "info";
};

export type ManagedEvent = {
  id: string;
  badge: string;
  badgeTone: "dark" | "secondary" | "tertiary" | "outline";
  image?: string;
  iconFallback?: string;
  status: EventStatus;
  statusLabel: string;
  statusTone: "success" | "secondary" | "info" | "neutral";
  meta: string;
  title: string;
  date: string;
  venue: string;
  venueIcon: string;
  leftBarColor: string;
  progress: {
    label: string;
    valueLabel: string;
    percent: number;
    gradient: string;
    footLeft: string;
    footRight: string;
    footRightColor: string;
  };
  metric: {
    label: string;
    value: string;
    caption: string;
  };
  actions: EventAction[];
  trailingAction: { icon: string; title: string; danger?: boolean };
};

export const managedEvents: ManagedEvent[] = [
  {
    id: "luna-nova",
    badge: "VIP",
    badgeTone: "dark",
    image: "/images/event-luna-nova.jpg",
    status: "en-venta",
    statusLabel: "● En venta",
    statusTone: "success",
    meta: "ID: AFQ-8492",
    title: "Luna Nova • Prisma Tour",
    date: "24 Oct 2026 • 21:00 hrs",
    venue: "Movistar Arena, Santiago",
    venueIcon: "stadium",
    leftBarColor: "var(--color-success)",
    progress: {
      label: "Ocupación (81%)",
      valueLabel: "6.480 / 8.000",
      percent: 81,
      gradient: "linear-gradient(90deg, var(--color-purple) 0%, #8b6ef7 100%)",
      footLeft: "Remanente: 1.520",
      footRight: "Alta velocidad",
      footRightColor: "var(--color-success)",
    },
    metric: { label: "Recaudación actual", value: "$54.400.000", caption: "Ticket Prom: $42.000" },
    actions: [
      { label: "Editar", icon: "edit", tone: "neutral" },
      { label: "Ver ventas", icon: "insights", tone: "primary" },
    ],
    trailingAction: { icon: "pause_circle", title: "Pausar venta", danger: true },
  },
  {
    id: "clasico-pacifico",
    badge: "Top ventas",
    badgeTone: "secondary",
    image: "/images/event-clasico-pacifico.jpg",
    status: "casi-agotado",
    statusLabel: "⚡ Casi agotado (94%)",
    statusTone: "secondary",
    meta: "ID: AFQ-1049",
    title: "Clásico del Pacífico • Chile vs Perú",
    date: "05 Dic 2025 • 20:30 hrs",
    venue: "Estadio Nacional, Ñuñoa",
    venueIcon: "stadium",
    leftBarColor: "var(--color-orange)",
    progress: {
      label: "Ocupación (94%)",
      valueLabel: "9.400 / 10.000",
      percent: 94,
      gradient: "linear-gradient(90deg, var(--color-orange) 0%, #c2410c 100%)",
      footLeft: "Últimas 600 entradas",
      footRight: "Puerta 4 saturada",
      footRightColor: "var(--color-orange-dark)",
    },
    metric: { label: "Recaudación actual", value: "$120.000.000", caption: "Recaudación récord" },
    actions: [
      { label: "Ver aforo", icon: "tune", tone: "neutral" },
      { label: "Gestionar", icon: "settings_suggest", tone: "secondary" },
    ],
    trailingAction: { icon: "more_vert", title: "Opciones avanzadas" },
  },
  {
    id: "festival-prisma",
    badge: "Festival",
    badgeTone: "tertiary",
    image: "/images/event-festival-prisma.jpg",
    status: "en-venta",
    statusLabel: "● En venta",
    statusTone: "success",
    meta: "ID: AFQ-3318",
    title: "Festival Prisma 2026",
    date: "22 Nov 2025 • 14:00 hrs",
    venue: "Parque O'Higgins, Santiago",
    venueIcon: "park",
    leftBarColor: "var(--color-success)",
    progress: {
      label: "Ocupación (28%)",
      valueLabel: "4.200 / 15.000",
      percent: 28,
      gradient: "linear-gradient(90deg, var(--color-purple-light) 0%, var(--color-purple) 100%)",
      footLeft: "Early Bird agotado",
      footRight: "Fase 2 activa",
      footRightColor: "var(--color-purple)",
    },
    metric: { label: "Recaudación actual", value: "$38.200.000", caption: "Meta: $135.000.000" },
    actions: [
      { label: "Editar", icon: "edit", tone: "neutral" },
      { label: "Ver ventas", icon: "insights", tone: "primary" },
    ],
    trailingAction: { icon: "pause_circle", title: "Pausar venta", danger: true },
  },
  {
    id: "ballet-nacional",
    badge: "Gala",
    badgeTone: "dark",
    iconFallback: "theater_comedy",
    status: "proximamente",
    statusLabel: "⏳ Próximamente",
    statusTone: "info",
    meta: "Preventa Banco de Chile",
    title: "Ballet Nacional • El Lago de los Cisnes",
    date: "13 Dic 2025 • 19:30 hrs",
    venue: "Teatro Municipal de Santiago",
    venueIcon: "theater_comedy",
    leftBarColor: "var(--color-info)",
    progress: {
      label: "Preventa (45%)",
      valueLabel: "900 / 2.000",
      percent: 45,
      gradient: "linear-gradient(90deg, #93c5fd 0%, var(--color-info) 100%)",
      footLeft: "Apertura general en 48h",
      footRight: "Filas 1-8 llenas",
      footRightColor: "var(--color-info-dark)",
    },
    metric: { label: "Preventa actual", value: "$21.500.000", caption: "Tickets Premium" },
    actions: [
      { label: "Precios", icon: "sell", tone: "neutral" },
      { label: "Lanzar venta", icon: "rocket_launch", tone: "info" },
    ],
    trailingAction: { icon: "more_vert", title: "Opciones avanzadas" },
  },
  {
    id: "pedro-ruminot",
    badge: "Setup",
    badgeTone: "outline",
    iconFallback: "mic_external_on",
    status: "borrador",
    statusLabel: "◌ Borrador",
    statusTone: "neutral",
    meta: "Falta configurar plano de asientos",
    title: "Stand-up Pedro Ruminot",
    date: "09 Nov 2025 • 21:00 hrs",
    venue: "Teatro Caupolicán, Santiago",
    venueIcon: "theater_comedy",
    leftBarColor: "var(--color-icon-muted)",
    progress: {
      label: "Aforo objetivo",
      valueLabel: "3.500 pax",
      percent: 10,
      gradient: "var(--color-border)",
      footLeft: "Ticketeras pendientes",
      footRight: "Configurando",
      footRightColor: "var(--color-icon-muted)",
    },
    metric: { label: "Precio base", value: "$18.000", caption: "Por confirmar ticketera" },
    actions: [
      { label: "Completar setup", icon: "build", tone: "neutral" },
      { label: "Publicar", icon: "publish", tone: "primary" },
    ],
    trailingAction: { icon: "delete", title: "Descartar borrador", danger: true },
  },
  {
    id: "dua-lipa",
    badge: "Pop",
    badgeTone: "dark",
    iconFallback: "star",
    status: "en-venta",
    statusLabel: "● En venta",
    statusTone: "success",
    meta: "ID: AFQ-2201",
    title: "Dua Lipa • Radical Optimism Tour",
    date: "24 Oct 2026 • 20:00 hrs",
    venue: "Movistar Arena, Santiago",
    venueIcon: "stadium",
    leftBarColor: "var(--color-success)",
    progress: {
      label: "Ocupación (67%)",
      valueLabel: "5.695 / 8.500",
      percent: 67,
      gradient: "linear-gradient(90deg, var(--color-purple) 0%, #8b6ef7 100%)",
      footLeft: "Remanente: 2.805",
      footRight: "Ritmo estable",
      footRightColor: "var(--color-success)",
    },
    metric: { label: "Recaudación actual", value: "$91.200.000", caption: "Ticket Prom: $48.000" },
    actions: [
      { label: "Editar", icon: "edit", tone: "neutral" },
      { label: "Ver ventas", icon: "insights", tone: "primary" },
    ],
    trailingAction: { icon: "pause_circle", title: "Pausar venta", danger: true },
  },
  {
    id: "imagine-dragons",
    badge: "Rock",
    badgeTone: "secondary",
    iconFallback: "bolt",
    status: "casi-agotado",
    statusLabel: "⚡ Casi agotado (89%)",
    statusTone: "secondary",
    meta: "ID: AFQ-5567",
    title: "Imagine Dragons • LOOM World Tour",
    date: "14 Nov 2025 • 21:00 hrs",
    venue: "Estadio Nacional, Santiago",
    venueIcon: "stadium",
    leftBarColor: "var(--color-orange)",
    progress: {
      label: "Ocupación (89%)",
      valueLabel: "8.010 / 9.000",
      percent: 89,
      gradient: "linear-gradient(90deg, var(--color-orange) 0%, #c2410c 100%)",
      footLeft: "Últimas 990 entradas",
      footRight: "Alta demanda",
      footRightColor: "var(--color-orange-dark)",
    },
    metric: { label: "Recaudación actual", value: "$156.800.000", caption: "Ticket Prom: $54.000" },
    actions: [
      { label: "Ver aforo", icon: "tune", tone: "neutral" },
      { label: "Gestionar", icon: "settings_suggest", tone: "secondary" },
    ],
    trailingAction: { icon: "more_vert", title: "Opciones avanzadas" },
  },
  {
    id: "clasico-universitario",
    badge: "Setup",
    badgeTone: "outline",
    iconFallback: "sports_soccer",
    status: "borrador",
    statusLabel: "◌ Borrador",
    statusTone: "neutral",
    meta: "Falta confirmar recinto",
    title: "Clásico Universitario",
    date: "28 Mar 2026 • 18:00 hrs",
    venue: "Por confirmar",
    venueIcon: "stadium",
    leftBarColor: "var(--color-icon-muted)",
    progress: {
      label: "Aforo objetivo",
      valueLabel: "9.000 pax",
      percent: 5,
      gradient: "var(--color-border)",
      footLeft: "Recinto pendiente",
      footRight: "Configurando",
      footRightColor: "var(--color-icon-muted)",
    },
    metric: { label: "Precio base", value: "$25.000", caption: "Por confirmar ticketera" },
    actions: [
      { label: "Completar setup", icon: "build", tone: "neutral" },
      { label: "Publicar", icon: "publish", tone: "primary" },
    ],
    trailingAction: { icon: "delete", title: "Descartar borrador", danger: true },
  },
  {
    id: "concierto-sinfonico",
    badge: "Setup",
    badgeTone: "outline",
    iconFallback: "music_note",
    status: "borrador",
    statusLabel: "◌ Borrador",
    statusTone: "neutral",
    meta: "Falta definir precios",
    title: "Concierto Sinfónico de Año Nuevo",
    date: "01 Ene 2026 • 19:00 hrs",
    venue: "Teatro Municipal de Santiago",
    venueIcon: "theater_comedy",
    leftBarColor: "var(--color-icon-muted)",
    progress: {
      label: "Aforo objetivo",
      valueLabel: "1.200 pax",
      percent: 0,
      gradient: "var(--color-border)",
      footLeft: "Precios pendientes",
      footRight: "Configurando",
      footRightColor: "var(--color-icon-muted)",
    },
    metric: { label: "Precio base", value: "Sin definir", caption: "Falta configurar ticketera" },
    actions: [
      { label: "Completar setup", icon: "build", tone: "neutral" },
      { label: "Publicar", icon: "publish", tone: "primary" },
    ],
    trailingAction: { icon: "delete", title: "Descartar borrador", danger: true },
  },
  {
    id: "los-bunkers",
    badge: "Finalizado",
    badgeTone: "outline",
    iconFallback: "check_circle",
    status: "finalizado",
    statusLabel: "✓ Finalizado",
    statusTone: "neutral",
    meta: "ID: AFQ-0087",
    title: "Los Bunkers • Gira Ven Aquí",
    date: "28 Oct 2025 • 21:00 hrs",
    venue: "Movistar Arena, Santiago",
    venueIcon: "stadium",
    leftBarColor: "var(--color-purple)",
    progress: {
      label: "Asistencia final",
      valueLabel: "7.980 / 8.000",
      percent: 100,
      gradient: "linear-gradient(90deg, var(--color-purple) 0%, #8b6ef7 100%)",
      footLeft: "Ocupación 99.8%",
      footRight: "Evento cerrado",
      footRightColor: "var(--color-icon-muted)",
    },
    metric: { label: "Recaudación final", value: "$268.400.000", caption: "Liquidado" },
    actions: [
      { label: "Ver resumen", icon: "summarize", tone: "neutral" },
      { label: "Duplicar", icon: "content_copy", tone: "primary" },
    ],
    trailingAction: { icon: "more_vert", title: "Opciones avanzadas" },
  },
  {
    id: "lollapalooza",
    badge: "Finalizado",
    badgeTone: "outline",
    iconFallback: "check_circle",
    status: "finalizado",
    statusLabel: "✓ Finalizado",
    statusTone: "neutral",
    meta: "ID: AFQ-0042",
    title: "Lollapalooza Chile 2025",
    date: "16 Mar 2025 • 12:00 hrs",
    venue: "Parque O'Higgins, Santiago",
    venueIcon: "park",
    leftBarColor: "var(--color-purple)",
    progress: {
      label: "Asistencia final",
      valueLabel: "68.000 / 70.000",
      percent: 97,
      gradient: "linear-gradient(90deg, var(--color-purple) 0%, #8b6ef7 100%)",
      footLeft: "Ocupación 97.1%",
      footRight: "Evento cerrado",
      footRightColor: "var(--color-icon-muted)",
    },
    metric: { label: "Recaudación final", value: "$1.180.000.000", caption: "Liquidado" },
    actions: [
      { label: "Ver resumen", icon: "summarize", tone: "neutral" },
      { label: "Duplicar", icon: "content_copy", tone: "primary" },
    ],
    trailingAction: { icon: "more_vert", title: "Opciones avanzadas" },
  },
  {
    id: "rey-leon",
    badge: "Finalizado",
    badgeTone: "outline",
    iconFallback: "check_circle",
    status: "finalizado",
    statusLabel: "✓ Finalizado",
    statusTone: "neutral",
    meta: "ID: AFQ-0019",
    title: "El Rey León • El musical",
    date: "18 Ene 2025 • 19:30 hrs",
    venue: "Teatro Municipal, Santiago",
    venueIcon: "theater_comedy",
    leftBarColor: "var(--color-purple)",
    progress: {
      label: "Asistencia final",
      valueLabel: "1.480 / 1.500",
      percent: 99,
      gradient: "linear-gradient(90deg, var(--color-purple) 0%, #8b6ef7 100%)",
      footLeft: "Ocupación 98.7%",
      footRight: "Evento cerrado",
      footRightColor: "var(--color-icon-muted)",
    },
    metric: { label: "Recaudación final", value: "$47.360.000", caption: "Liquidado" },
    actions: [
      { label: "Ver resumen", icon: "summarize", tone: "neutral" },
      { label: "Duplicar", icon: "content_copy", tone: "primary" },
    ],
    trailingAction: { icon: "more_vert", title: "Opciones avanzadas" },
  },
];

export const eventVenues = Array.from(new Set(managedEvents.map((e) => e.venue))).sort();
