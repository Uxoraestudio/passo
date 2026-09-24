export type RoleTab = {
  id: string;
  label: string;
  count: number;
};

export const roleTabs: RoleTab[] = [
  { id: "todos", label: "Todos", count: 16 },
  { id: "administradores", label: "Administradores", count: 2 },
  { id: "operaciones", label: "Operaciones / Accesos", count: 8 },
  { id: "finanzas", label: "Finanzas", count: 3 },
  { id: "marketing", label: "Marketing", count: 3 },
];

export const security2fa = { active: 15, total: 16 };

export type RoleCard = {
  id: string;
  icon: string;
  tone: "purple" | "orange" | "teal" | "violet";
  memberCount: number;
  title: string;
  description: string;
  levelLabel: string;
};

export const roleCards: RoleCard[] = [
  {
    id: "superadmin",
    icon: "shield_person",
    tone: "purple",
    memberCount: 2,
    title: "Superadmin de Productora",
    description: "Control total de eventos, recaudaciones, transferencias bancarias, credenciales API y contratos legales.",
    levelLabel: "NIVEL RAÍZ / MASTER",
  },
  {
    id: "operaciones",
    icon: "sensor_door",
    tone: "orange",
    memberCount: 8,
    title: "Jefe de Operaciones / Accesos",
    description: "Gestión de escaneo QR en puertas, validación en vivo, asignación de torniquetes y reporte de aforo en tiempo real.",
    levelLabel: "NIVEL PUERTA / ESCÁNER",
  },
  {
    id: "finanzas",
    icon: "account_balance",
    tone: "teal",
    memberCount: 3,
    title: "Finanzas y Liquidaciones",
    description: "Descarga de balances contables, conciliación de pasarelas de pago (Stripe, Transbank, PxI) y estados de corte.",
    levelLabel: "NIVEL CONTABILIDAD VIP",
  },
  {
    id: "marketing",
    icon: "campaign",
    tone: "violet",
    memberCount: 3,
    title: "Gestor de Marketing",
    description: "Creación de eventos, carga de afiches y banners, asignación de preventas, códigos de descuento y seguimiento de pixeles.",
    levelLabel: "NIVEL CAMPAÑAS / PRENSA",
  },
];

export type TeamMemberStatus = "Active" | "Pendiente";

export type TeamMember = {
  id: string;
  name: string;
  email: string;
  roleLabel: string;
  roleTone: "purple" | "orange" | "teal" | "violet";
  eventsAssigned: string;
  eventsCaption?: string;
  lastConnection: string;
  connectionDetail: string;
  status: TeamMemberStatus;
  active: boolean;
  avatarInitials: string;
  avatarTone: "purple" | "orange" | "teal" | "violet" | "neutral";
};

export const teamMembers: TeamMember[] = [
  {
    id: "matias",
    name: "Matías Valenzuela R.",
    email: "matias@aforiqproducciones.cl",
    roleLabel: "Superadmin",
    roleTone: "purple",
    eventsAssigned: "Todos",
    eventsCaption: "(irrestricto)",
    lastConnection: "Hace 12 min",
    connectionDetail: "IP: 190.161.42.31 (Santiago)",
    status: "Active",
    active: true,
    avatarInitials: "MV",
    avatarTone: "purple",
  },
  {
    id: "florencia",
    name: "Florencia Aránguiz",
    email: "faranguiz@aforiq.cl",
    roleLabel: "Jefe Operaciones",
    roleTone: "orange",
    eventsAssigned: "Luna Nova Fest",
    eventsCaption: "Festival Prisma",
    lastConnection: "Hace 1 hora",
    connectionDetail: "Terminal Handheld Festival TC26",
    status: "Active",
    active: true,
    avatarInitials: "FA",
    avatarTone: "orange",
  },
  {
    id: "carlos",
    name: "Carlos Montesinos V.",
    email: "c.montesinos@aforiq.cl",
    roleLabel: "Finanzas & Liquidaciones",
    roleTone: "teal",
    eventsAssigned: "Todos los eventos",
    lastConnection: "Ayer, 18:40",
    connectionDetail: "Web Safari (macOS)",
    status: "Active",
    active: true,
    avatarInitials: "CM",
    avatarTone: "teal",
  },
  {
    id: "sofia",
    name: "Sofía Palacios (Invitación)",
    email: "sofia.marketing@creactiva.com",
    roleLabel: "Marketing & Prensa",
    roleTone: "violet",
    eventsAssigned: "Festival Prisma 2025",
    lastConnection: "Sin conexión previa",
    connectionDetail: "Enviada hace 3 horas",
    status: "Pendiente",
    active: false,
    avatarInitials: "SP",
    avatarTone: "neutral",
  },
  {
    id: "diego",
    name: "Diego González Tapia",
    email: "dgonzalez@accesscontrol.cl",
    roleLabel: "Operador de Puerta",
    roleTone: "orange",
    eventsAssigned: "Luna Nova Fest",
    eventsCaption: "(Puerta 4)",
    lastConnection: "Hace 4 horas",
    connectionDetail: "AFORIQ App Escáner web (Android)",
    status: "Active",
    active: true,
    avatarInitials: "DG",
    avatarTone: "orange",
  },
];

export type PermissionLevel = "granted" | "restricted";

export type PermissionModule = {
  id: string;
  icon: string;
  tone: "purple" | "orange" | "teal";
  name: string;
  description: string;
  read: PermissionLevel;
  write: PermissionLevel;
  deleteAccess: PermissionLevel;
  exportAccess: PermissionLevel;
};

export const auditedRoleOptions = ["Superadmin de Productora", "Jefe de Operaciones / Accesos", "Finanzas y Liquidaciones", "Gestor de Marketing"];

export const permissionModules: PermissionModule[] = [
  {
    id: "eventos",
    icon: "celebration",
    tone: "purple",
    name: "Eventos & Fechas",
    description: "Creación de venues, aforos y cronogramas",
    read: "granted",
    write: "restricted",
    deleteAccess: "restricted",
    exportAccess: "granted",
  },
  {
    id: "ventas",
    icon: "confirmation_number",
    tone: "orange",
    name: "Ventas de Entradas",
    description: "Emisión manual, cortesías y devoluciones",
    read: "granted",
    write: "granted",
    deleteAccess: "restricted",
    exportAccess: "restricted",
  },
  {
    id: "validacion",
    icon: "qr_code_scanner",
    tone: "orange",
    name: "Validación & Control QR",
    description: "Pistolas ópticas, torniquetes y validación forzada",
    read: "granted",
    write: "granted",
    deleteAccess: "granted",
    exportAccess: "granted",
  },
  {
    id: "finanzas",
    icon: "account_balance",
    tone: "teal",
    name: "Finanzas & Liquidaciones",
    description: "Datos bancarios, transferencias y comisiones de ticketera",
    read: "restricted",
    write: "restricted",
    deleteAccess: "restricted",
    exportAccess: "restricted",
  },
];
