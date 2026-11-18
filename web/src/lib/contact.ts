export const CONTACT_REASONS = [
  { id: "evento", label: "Necesito información sobre un evento" },
  { id: "no-recibi-entradas", label: "No recibí mis entradas" },
  { id: "no-puedo-comprar", label: "No puedo comprar" },
  { id: "compra-erronea", label: "Hice una compra errónea" },
  { id: "devolucion", label: "Devoluciones" },
  { id: "cobro", label: "Recibí un cobro duplicado o incorrecto" },
  { id: "cuenta", label: "Problemas con mi cuenta" },
  { id: "otro", label: "Tengo otra consulta" },
] as const;

export type ContactReasonId = (typeof CONTACT_REASONS)[number]["id"];

/** Reasons tied to a specific purchase: the order code helps us find it. */
export const ORDER_REASONS: ContactReasonId[] = ["no-recibi-entradas", "compra-erronea", "devolucion", "cobro"];

export const MESSAGE_MIN = 20;
export const MESSAGE_MAX = 3000;

export function isReason(value: unknown): value is ContactReasonId {
  return typeof value === "string" && CONTACT_REASONS.some((r) => r.id === value);
}

export function reasonLabel(id: ContactReasonId) {
  return CONTACT_REASONS.find((r) => r.id === id)?.label ?? id;
}
