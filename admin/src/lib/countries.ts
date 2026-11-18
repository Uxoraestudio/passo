/** Countries a productora can be from. Chile first: it's where Aforiq sells today. */
export type Country = { code: string; name: string; dial: string; phoneDigits: [min: number, max: number]; phoneExample: string };

export const COUNTRIES: Country[] = [
  { code: "CL", name: "Chile", dial: "56", phoneDigits: [9, 9], phoneExample: "9 1234 5678" },
  { code: "AR", name: "Argentina", dial: "54", phoneDigits: [10, 11], phoneExample: "11 2345 6789" },
  { code: "BO", name: "Bolivia", dial: "591", phoneDigits: [8, 8], phoneExample: "7123 4567" },
  { code: "CO", name: "Colombia", dial: "57", phoneDigits: [10, 10], phoneExample: "321 123 4567" },
  { code: "EC", name: "Ecuador", dial: "593", phoneDigits: [9, 9], phoneExample: "99 123 4567" },
  { code: "ES", name: "España", dial: "34", phoneDigits: [9, 9], phoneExample: "612 34 56 78" },
  { code: "US", name: "Estados Unidos", dial: "1", phoneDigits: [10, 10], phoneExample: "201 555 0123" },
  { code: "MX", name: "México", dial: "52", phoneDigits: [10, 10], phoneExample: "55 1234 5678" },
  { code: "PY", name: "Paraguay", dial: "595", phoneDigits: [9, 9], phoneExample: "981 123 456" },
  { code: "PE", name: "Perú", dial: "51", phoneDigits: [9, 9], phoneExample: "912 345 678" },
  { code: "UY", name: "Uruguay", dial: "598", phoneDigits: [8, 8], phoneExample: "94 123 456" },
];

export const DEFAULT_COUNTRY = "CL";

export const countryByCode = (code: string | null | undefined) => COUNTRIES.find((c) => c.code === code);

/** National number (digits only) → "+56912345678", or null if it doesn't fit the country. */
export function toE164(code: string, national: string): string | null {
  const country = countryByCode(code);
  if (!country) return null;
  let digits = national.replace(/\D/g, "");
  // Typed with the country code in front.
  if (digits.startsWith(country.dial) && digits.length > country.phoneDigits[1]) digits = digits.slice(country.dial.length);
  const [min, max] = country.phoneDigits;
  return digits.length >= min && digits.length <= max ? `+${country.dial}${digits}` : null;
}

/** "+56912345678" → "+56 9 1234 5678" (Chile) or "+54 1123456789" elsewhere. */
export function formatPhone(e164: string | null | undefined, code?: string | null) {
  if (!e164) return "";
  const country = countryByCode(code);
  if (!country || !e164.startsWith(`+${country.dial}`)) return e164;
  const national = e164.slice(country.dial.length + 1);
  if (country.code === "CL" && national.length === 9) return `+56 ${national[0]} ${national.slice(1, 5)} ${national.slice(5)}`;
  return `+${country.dial} ${national}`;
}
