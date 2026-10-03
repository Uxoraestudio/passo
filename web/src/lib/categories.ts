// Public categories mapped to the values the admin stores in events.category.
export const CATEGORIES = [
  { slug: "musica", label: "Música", adminValues: ["Concierto", "Festival"] },
  { slug: "teatro", label: "Teatro", adminValues: ["Teatro"] },
  { slug: "comedia", label: "Comedia", adminValues: ["Stand-up"] },
  { slug: "festivales", label: "Festivales", adminValues: ["Festival"] },
  { slug: "deportes", label: "Deportes", adminValues: ["Deportes"] },
] as const;

export type Category = (typeof CATEGORIES)[number];

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase();
}

// Accepts the slug or the label in any casing/accents ("musica", "Música", "música").
export function findCategory(value: string | null | undefined): Category | undefined {
  if (!value) return undefined;
  const key = normalize(value);
  return CATEGORIES.find((c) => c.slug === key || normalize(c.label) === key);
}

export function categoryForAdminValue(adminValue: string | null | undefined): Category | undefined {
  if (!adminValue) return undefined;
  return CATEGORIES.find((c) => (c.adminValues as readonly string[]).includes(adminValue));
}

export function matchesCategory(adminValue: string | null | undefined, category: Category) {
  return !!adminValue && (category.adminValues as readonly string[]).includes(adminValue);
}

export function categoryHref(category: Category) {
  return `/eventos/?category=${category.slug}`;
}
