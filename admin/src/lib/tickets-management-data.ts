export type SalesPhase = {
  id: string;
  status: "concluida" | "en-vivo";
  lote: string;
  title: string;
  description: string;
  progressLabel: string;
  valueLabel: string;
  percent: number;
  footLeft: string;
  footRight: string;
};

export const salesPhases: SalesPhase[] = [
  {
    id: "fans",
    status: "concluida",
    lote: "Lote #01",
    title: "Preventa Fans Exclusiva",
    description: "Acceso con código FAN-PASS para miembros del club oficial registrado.",
    progressLabel: "Asignación 100% completada",
    valueLabel: "1.200 / 1.200",
    percent: 100,
    footLeft: "Agotado en 14m 22s",
    footRight: "SOLD OUT",
  },
  {
    id: "banco-chile",
    status: "concluida",
    lote: "Lote #02",
    title: "Preventa Banco Chile",
    description: "Beneficio 20% descuento con tarjetas de crédito corporativas y personales.",
    progressLabel: "Asignación 100% completada",
    valueLabel: "2.500 / 2.500",
    percent: 100,
    footLeft: "Vigencia hasta 18 Nov",
    footRight: "SOLD OUT",
  },
  {
    id: "general",
    status: "en-vivo",
    lote: "Lote Definitivo #03",
    title: "Venta General Abierta",
    description: "Disponibilidad total en todos los canales digitales y puntos físicos.",
    progressLabel: "68% del tramo colocado",
    valueLabel: "2.782 / 4.100",
    percent: 67.85,
    footLeft: "Cierre programado: 24 Nov 19:00",
    footRight: "1.318 cupos libres",
  },
];

export type SectorRow = {
  id: string;
  dotColor: string;
  name: string;
  location: string;
  locationTone?: "accent";
  capacity: string;
  sold: string;
  soldPercent: string;
  soldTone: "critical" | "warning" | "normal";
  priceBase: string;
  serviceFee: string;
  status: "Disponible";
};

export const sectorRows: SectorRow[] = [
  {
    id: "cancha-frontal",
    dotColor: "var(--color-orange)",
    name: "Cancha Frontal",
    location: "Acceso Puerta 1 • Zona VIP",
    capacity: "1.200",
    sold: "1.150",
    soldPercent: "95.8% (Crítico)",
    soldTone: "critical",
    priceBase: "$68.000 CLP",
    serviceFee: "10% ($6.800)",
    status: "Disponible",
  },
  {
    id: "cancha-general",
    dotColor: "var(--color-purple)",
    name: "Cancha General",
    location: "Acceso Puerta 3 y 4",
    capacity: "2.800",
    sold: "2.200",
    soldPercent: "78.5%",
    soldTone: "normal",
    priceBase: "$48.000 CLP",
    serviceFee: "10% ($4.800)",
    status: "Disponible",
  },
  {
    id: "platea-preferencial",
    dotColor: "var(--color-purple-light)",
    name: "Platea Preferencial",
    location: "Numerada • Asientos 101-1600",
    locationTone: "accent",
    capacity: "1.500",
    sold: "1.410",
    soldPercent: "94.0%",
    soldTone: "warning",
    priceBase: "$42.000 CLP",
    serviceFee: "10% ($4.200)",
    status: "Disponible",
  },
  {
    id: "platea-general",
    dotColor: "var(--color-icon-muted)",
    name: "Platea General",
    location: "Nivel 2 • Por orden de llegada",
    capacity: "1.500",
    sold: "1.120",
    soldPercent: "74.6%",
    soldTone: "normal",
    priceBase: "$32.000 CLP",
    serviceFee: "10% ($3.200)",
    status: "Disponible",
  },
  {
    id: "tribuna",
    dotColor: "var(--color-border)",
    name: "Tribuna",
    location: "Nivel 3 • Alta visibilidad panorámica",
    capacity: "1.000",
    sold: "602",
    soldPercent: "60.2%",
    soldTone: "normal",
    priceBase: "$24.000 CLP",
    serviceFee: "10% ($2.400)",
    status: "Disponible",
  },
];

export const venueLedger = [
  { label: "Cancha Frontal", color: "var(--color-orange)", value: "50 libres" },
  { label: "Cancha General", color: "var(--color-purple)", value: "600 libres" },
  { label: "Plateas Combinadas", color: "var(--color-purple-light)", value: "470 libres" },
  { label: "Tribuna Superior", color: "var(--color-icon-muted)", value: "398 libres" },
];

export const courtesyTiers = [
  { value: "cf", label: "Cancha Frontal (VIP Invitados)" },
  { value: "pp", label: "Platea Preferencial (Prensa Fila 1)" },
  { value: "cg", label: "Cancha General" },
  { value: "backstage", label: "Pase Doble VIP + Acceso Backstage" },
];

export type SecurityToggleData = {
  id: string;
  label: string;
  description: string;
  dotColor: string;
  defaultChecked: boolean;
};

export const securityToggles: SecurityToggleData[] = [
  {
    id: "nomination",
    label: "Nominación Obligatoria 100%",
    description: "Cada entrada debe registrar RUT, nombre y correo verificado antes de descargar el QR.",
    dotColor: "var(--color-success)",
    defaultChecked: true,
  },
  {
    id: "transfer-lock",
    label: "Bloqueo de Transferencias (24h)",
    description: "Impide reasignar titulares dentro de las últimas 24 horas previas al acceso en puertas.",
    dotColor: "var(--color-orange)",
    defaultChecked: true,
  },
  {
    id: "dynamic-qr",
    label: "QR Dinámico Anti-Captura",
    description: "El código en la App del asistente rota su hash criptográfico cada 15 segundos vía TOTP.",
    dotColor: "var(--color-purple)",
    defaultChecked: true,
  },
];
