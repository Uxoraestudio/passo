export const EVENT_CATEGORIES = [
  "Conciertos y festivales",
  "Teatro y musicales",
  "Stand-up y comedia",
  "Fiestas y vida nocturna",
  "Deportes",
  "Ferias, exposiciones y conferencias",
  "Experiencias gastronómicas",
  "Eventos familiares e infantiles",
  "Corporativo",
  "Otro",
] as const;

export const TENTATIVE_DATES = [
  "Este mes",
  "Dentro de 1 mes",
  "Entre 2 y 3 meses",
  "Entre 4 y 6 meses",
  "Más de 6 meses",
  "Aún no tengo fecha",
] as const;

export const EXPECTED_ATTENDEES = [
  "Menos de 500",
  "Entre 500 y 1.000",
  "Entre 1.000 y 2.000",
  "Entre 2.000 y 5.000",
  "Entre 5.000 y 10.000",
  "Más de 10.000",
] as const;

export const PRODUCER_MESSAGE_MAX = 2000;

export const includes = (list: readonly string[], value: unknown): value is string =>
  typeof value === "string" && list.includes(value);
