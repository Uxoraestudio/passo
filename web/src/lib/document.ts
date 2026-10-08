// Chilean RUT ("12.345.678-5") or a passport number.

export function cleanDocument(value: string) {
  return value.replace(/[.\s]/g, "").toUpperCase();
}

function rutCheckDigit(body: string) {
  let sum = 0;
  let factor = 2;
  for (let i = body.length - 1; i >= 0; i--) {
    sum += Number(body[i]) * factor;
    factor = factor === 7 ? 2 : factor + 1;
  }
  const rest = 11 - (sum % 11);
  return rest === 11 ? "0" : rest === 10 ? "K" : String(rest);
}

/** Returns an error message, or null when the document looks valid. */
export function documentError(value: string): string | null {
  const doc = cleanDocument(value);
  if (!doc) return "Ingresa un RUT o pasaporte.";
  const rut = /^(\d{7,8})-?([\dK])$/.exec(doc);
  if (rut) {
    return rutCheckDigit(rut[1]) === rut[2] ? null : "El RUT no es válido. Revisa el dígito verificador.";
  }
  if (/^\d+-?[\dK]?$/.test(doc)) return "El RUT no es válido.";
  return /^[A-Z0-9-]{6,20}$/.test(doc) ? null : "Ingresa un RUT (12.345.678-5) o un pasaporte válido.";
}

/** "123456785" -> "12.345.678-5"; passports are returned as typed (uppercased). */
export function formatDocument(value: string) {
  const doc = cleanDocument(value);
  const rut = /^(\d{7,8})-?([\dK])$/.exec(doc);
  if (!rut) return doc;
  return `${rut[1].replace(/\B(?=(\d{3})+(?!\d))/g, ".")}-${rut[2]}`;
}
