import type { EventRecord, EventStatus } from "./events-data";

const clpFormatter = new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });
const dateFormatter = new Intl.DateTimeFormat("es-CL", { day: "2-digit", month: "short", year: "numeric" });
const timeFormatter = new Intl.DateTimeFormat("es-CL", { hour: "2-digit", minute: "2-digit", hour12: false });

export function formatCLP(value: number) {
  return clpFormatter.format(value);
}

export function formatEventDate(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Fecha por confirmar";
  return `${dateFormatter.format(date)} • ${timeFormatter.format(date)} hrs`;
}

type StatusPresentation = {
  badge: string;
  badgeTone: "dark" | "secondary" | "tertiary" | "outline";
  statusTone: "success" | "secondary" | "info" | "neutral";
  leftBarColor: string;
  gradient: string;
  primaryActionLabel: string;
  primaryActionIcon: string;
  secondaryActionLabel: string;
  secondaryActionIcon: string;
  secondaryActionTone: "primary" | "secondary" | "info";
  trailingIcon: string;
  trailingTitle: string;
  trailingDanger?: boolean;
};

const statusPresentation: Record<EventStatus, StatusPresentation> = {
  "en-venta": {
    badge: "En venta",
    badgeTone: "dark",
    statusTone: "success",
    leftBarColor: "var(--color-success)",
    gradient: "linear-gradient(90deg, var(--color-purple) 0%, #8b6ef7 100%)",
    primaryActionLabel: "Editar",
    primaryActionIcon: "edit",
    secondaryActionLabel: "Ver ventas",
    secondaryActionIcon: "insights",
    secondaryActionTone: "primary",
    trailingIcon: "delete",
    trailingTitle: "Eliminar evento",
    trailingDanger: true,
  },
  "casi-agotado": {
    badge: "Casi agotado",
    badgeTone: "secondary",
    statusTone: "secondary",
    leftBarColor: "var(--color-orange)",
    gradient: "linear-gradient(90deg, var(--color-orange) 0%, #c2410c 100%)",
    primaryActionLabel: "Editar",
    primaryActionIcon: "edit",
    secondaryActionLabel: "Gestionar",
    secondaryActionIcon: "settings_suggest",
    secondaryActionTone: "secondary",
    trailingIcon: "delete",
    trailingTitle: "Eliminar evento",
    trailingDanger: true,
  },
  proximamente: {
    badge: "Próximamente",
    badgeTone: "tertiary",
    statusTone: "info",
    leftBarColor: "var(--color-info)",
    gradient: "linear-gradient(90deg, #93c5fd 0%, var(--color-info) 100%)",
    primaryActionLabel: "Editar",
    primaryActionIcon: "edit",
    secondaryActionLabel: "Lanzar venta",
    secondaryActionIcon: "rocket_launch",
    secondaryActionTone: "info",
    trailingIcon: "delete",
    trailingTitle: "Eliminar evento",
    trailingDanger: true,
  },
  borrador: {
    badge: "Borrador",
    badgeTone: "outline",
    statusTone: "neutral",
    leftBarColor: "var(--color-icon-muted)",
    gradient: "var(--color-border)",
    primaryActionLabel: "Completar setup",
    primaryActionIcon: "build",
    secondaryActionLabel: "Publicar",
    secondaryActionIcon: "publish",
    secondaryActionTone: "primary",
    trailingIcon: "delete",
    trailingTitle: "Eliminar borrador",
    trailingDanger: true,
  },
  finalizado: {
    badge: "Finalizado",
    badgeTone: "outline",
    statusTone: "neutral",
    leftBarColor: "var(--color-purple)",
    gradient: "linear-gradient(90deg, var(--color-purple) 0%, #8b6ef7 100%)",
    primaryActionLabel: "Editar",
    primaryActionIcon: "edit",
    secondaryActionLabel: "Ver resumen",
    secondaryActionIcon: "summarize",
    secondaryActionTone: "primary",
    trailingIcon: "delete",
    trailingTitle: "Eliminar evento",
    trailingDanger: true,
  },
};

const statusLabels: Record<EventStatus, (percent: number) => string> = {
  "en-venta": () => "● En venta",
  "casi-agotado": (percent) => `⚡ Casi agotado (${percent}%)`,
  proximamente: () => "⏳ Próximamente",
  borrador: () => "◌ Borrador",
  finalizado: () => "✓ Finalizado",
};

export function derivePresentation(event: EventRecord) {
  const percent = event.capacity > 0 ? Math.min(100, Math.round((event.sold / event.capacity) * 100)) : 0;
  const remaining = Math.max(0, event.capacity - event.sold);
  const revenue = event.price_base * event.sold;
  const preset = statusPresentation[event.status];

  return {
    ...preset,
    percent,
    statusLabel: statusLabels[event.status](percent),
    progressValueLabel: `${event.sold.toLocaleString("es-CL")} / ${event.capacity.toLocaleString("es-CL")}`,
    footLeft: event.status === "finalizado" ? `Ocupación ${percent}%` : `Remanente: ${remaining.toLocaleString("es-CL")}`,
    metricLabel: event.status === "finalizado" ? "Recaudación final" : "Recaudación actual",
    metricValue: formatCLP(revenue),
    metricCaption: `Precio base: ${formatCLP(event.price_base)}`,
    dateLabel: formatEventDate(event.event_date),
  };
}
