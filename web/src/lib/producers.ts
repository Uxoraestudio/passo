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

/** Countries a productora can be from (same list as the admin). Chile first and by default. */
export const PRODUCER_COUNTRIES = [
  { code: "CL", name: "Chile", dial: "56", phoneExample: "9 1234 5678" },
  { code: "AR", name: "Argentina", dial: "54", phoneExample: "11 2345 6789" },
  { code: "BO", name: "Bolivia", dial: "591", phoneExample: "7123 4567" },
  { code: "CO", name: "Colombia", dial: "57", phoneExample: "321 123 4567" },
  { code: "EC", name: "Ecuador", dial: "593", phoneExample: "99 123 4567" },
  { code: "ES", name: "España", dial: "34", phoneExample: "612 34 56 78" },
  { code: "US", name: "Estados Unidos", dial: "1", phoneExample: "201 555 0123" },
  { code: "MX", name: "México", dial: "52", phoneExample: "55 1234 5678" },
  { code: "PY", name: "Paraguay", dial: "595", phoneExample: "981 123 456" },
  { code: "PE", name: "Perú", dial: "51", phoneExample: "912 345 678" },
  { code: "UY", name: "Uruguay", dial: "598", phoneExample: "94 123 456" },
] as const;

export const DEFAULT_PRODUCER_COUNTRY = "CL";

export const producerCountry = (code: unknown) => PRODUCER_COUNTRIES.find((c) => c.code === code);
