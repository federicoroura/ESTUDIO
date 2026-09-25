// Parsers de importes. Son ESTRICTOS a propósito: solo aceptan strings con forma
// de número. Así un texto que cae por casualidad en una columna numérica (ej. el
// texto vertical del margen de BBVA) nunca pisa un importe bueno.

/** Formato argentino: 1.234.567,89 (con o sin signo). */
export function parseAmount(s) {
  if (s === undefined || s === null) return null;
  s = s.trim();
  if (!/^-?\d{1,3}(\.\d{3})*(,\d{1,2})?$/.test(s)) return null;
  const neg = s.startsWith('-');
  s = s.replace(/^-/, '').replace(/\./g, '').replace(',', '.');
  const n = parseFloat(s);
  if (isNaN(n)) return null;
  return neg ? -n : n;
}

/** Decimal simple con punto: 1234.56 (Banco Hipotecario). */
export function parseAmountPlain(s) {
  if (s === undefined || s === null) return null;
  s = s.trim();
  if (!/^-?\d+(\.\d{1,2})?$/.test(s)) return null;
  const n = parseFloat(s);
  return isNaN(n) ? null : n;
}

export const round2 = (n) => Math.round(n * 100) / 100;
