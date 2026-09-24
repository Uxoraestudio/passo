export type SettingsTab = {
  id: string;
  label: string;
  icon: string;
};

export const settingsTabs: SettingsTab[] = [
  { id: "perfil", label: "Perfil de la Organización", icon: "badge" },
  { id: "bancarias", label: "Cuentas Bancarias y Liquidaciones", icon: "account_balance" },
  { id: "pasarelas", label: "Pasarelas de Pago e Integraciones", icon: "credit_card" },
  { id: "notificaciones", label: "Notificaciones y Alertas", icon: "notifications_active" },
  { id: "branding", label: "Plantillas de E-Tickets & Branding", icon: "style" },
  { id: "legal", label: "Políticas y Legal", icon: "policy" },
];

export type ProfileField = {
  id: string;
  label: string;
  icon: string;
  value: string;
  type: "text" | "email";
  mono?: boolean;
};

export const profileFields: ProfileField[] = [
  { id: "razon-social", label: "Razón Social", icon: "domain", value: "AFORIQ Producciones y Espectáculos SpA", type: "text" },
  { id: "rut", label: "RUT Empresa", icon: "fingerprint", value: "76.849.201-K", type: "text", mono: true },
  { id: "email", label: "Correo de Contacto Oficial", icon: "mail", value: "contacto@aforiq.cl", type: "email" },
  { id: "telefono", label: "Teléfono Soporte a Compradores", icon: "support_agent", value: "+56 2 2840 9200", type: "text" },
  { id: "direccion", label: "Dirección Comercial", icon: "location_on", value: "Av. Presidente Riesco 5711, Of. 1402, Las Condes, Santiago", type: "text" },
  { id: "sitio-web", label: "Sitio Web Oficial", icon: "public", value: "https://aforiq.cl", type: "text" },
];

export type PaymentGateway = {
  id: string;
  icon: string;
  iconColor: string;
  name: string;
  statusLabel: string;
  description: string;
  actionLabel: string;
  secondaryIcon: string;
};

export const paymentGateways: PaymentGateway[] = [
  {
    id: "webpay",
    icon: "account_balance_wallet",
    iconColor: "#e60000",
    name: "Transbank Webpay Plus",
    statusLabel: "Conectado / Producción",
    description: "Código de Comercio: 597048392011 • Tarjetas Débito / Crédito / Prepago Redcompra",
    actionLabel: "Configurar Llaves",
    secondaryIcon: "refresh",
  },
  {
    id: "mercadopago",
    icon: "payments",
    iconColor: "#009ee3",
    name: "Mercado Pago Checkout Pro",
    statusLabel: "Conectado",
    description: "Integración OAuth Productiva • Saldo en billetera digital, cuotas sin interés y MACH",
    actionLabel: "Gestionar Webhooks",
    secondaryIcon: "more_vert",
  },
];

export type SecurityToggle = {
  id: string;
  title: string;
  badge: string;
  badgeTone: "purple" | "neutral" | "danger";
  description: string;
  defaultChecked: boolean;
  activeColor: "purple" | "orange";
};

export const securityToggles: SecurityToggle[] = [
  {
    id: "nomination",
    title: "Activar nominación estricta por defecto en nuevos eventos",
    badge: "Antirreventa",
    badgeTone: "purple",
    description: "Obliga a ingresar nombre completo, RUT/Pasaporte y correo electrónico por cada ticket antes de descargar el QR.",
    defaultChecked: true,
    activeColor: "purple",
  },
  {
    id: "2fa-transfers",
    title: "Exigir 2FA para transferencias de fondos",
    badge: "Seguridad Financiera",
    badgeTone: "neutral",
    description: "Solicita token OTP por app autenticadora antes de autorizar cualquier cambio de cuenta o retiro de recaudaciones anticipadas.",
    defaultChecked: true,
    activeColor: "purple",
  },
  {
    id: "gateway-alerts",
    title: "Notificaciones automáticas por caída de pasarela",
    badge: "Monitoreo Crítico",
    badgeTone: "danger",
    description: "Envía una alerta SMS y correo de emergencia al equipo de operaciones si la tasa de rechazo supera el 12% durante venta activa.",
    defaultChecked: true,
    activeColor: "orange",
  },
];

export const bankAccount = {
  bankName: "Banco de Chile",
  status: "Validado",
  accountType: "Cuenta Corriente",
  accountMasked: "•••• •••• •••• 8492",
  holder: "AFORIQ Producciones SpA",
  rut: "76.849.201-K",
};

export type SettlementItem = {
  id: string;
  icon: string;
  title: string;
  description: string;
};

export const settlementItems: SettlementItem[] = [
  {
    id: "weekly",
    icon: "event_repeat",
    title: "Cierre Semanal de Recaudación",
    description: "Transferencia automática de fondos retenidos cada día martes hasta las 14:00 hrs.",
  },
  {
    id: "final",
    icon: "history_edu",
    title: "Liquidación Final 48h Post-Evento",
    description: "Cierre del 100% de la boletería, deducción del service fee e informe final de accesos auditados.",
  },
];

export const accountHealthStats = [
  { id: "fees", label: "Comisiones Pactadas", value: "5.8% + IVA", tone: "neutral" as const },
  { id: "capacity", label: "Capacidad Concurrente", value: "45.000 users/fila", tone: "neutral" as const },
  { id: "devices", label: "Dispositivos PDA Gate", value: "Ilimitados", tone: "teal" as const },
];
