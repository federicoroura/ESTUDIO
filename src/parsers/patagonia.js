import { parseAmount } from '../core/amounts.js';
import { fullDocText } from '../core/pdf.js';

// ---------- Banco Patagonia ----------
// Desde abril 2026 Patagonia parte Descripción y Referencia en 2-3 renglones de
// forma variable, y la fecha + importes quedan en el renglón "del medio":
//
//   y=642            IMP.DB/CR BANCARIOS
//   y=638  29/05/2026                                 12.618,00   -10.655.589,82
//   y=634            P/CREDITOS
//
// Por eso NO se arma la fila por línea. Cada fecha es un "ancla" y cada ítem de
// texto/importe se asigna al ancla más cercana en Y DE SU MISMA PÁGINA (la Y se
// reinicia en cada página). Como las anclas están ordenadas, la más cercana es
// siempre la anterior o la siguiente en el orden de impresión.
// Todo lo que queda a más de MAX_DY de cualquier ancla es encabezado/pie y se
// descarta. Este enfoque también cubre el formato viejo (1 renglón + wraps).

const MAX_DY = 15;
const DATE_RE = /^\d{2}\/\d{2}\/\d{4}$/;
const DATE_MAX_X = 100; // la fecha vive en la primera columna (x≈52)
// Headers de columna: igualdad EXACTA, nunca prefijo — hay descripciones reales
// como "CREDITO POR TRANSFERENCIA" o "CREDITO INTERPYME".
const HEADER_WORDS = new Set(['Fecha', 'Descripción', 'Descripcion', 'Referencia', 'Débito', 'Debito', 'Crédito', 'Credito', 'Saldo']);
const isNoise = (s) => HEADER_WORDS.has(s) || /^P[áa]?gina\s+\d+$/i.test(s);

export function parsePatagonia(lines) {
  let cuenta = 'sin-identificar';
  const cm = fullDocText(lines).match(/Cuenta:\s*([^\n]+?)(?:\s{2,}|\n|Titularidad)/);
  if (cm) cuenta = cm[1].trim();

  // Límites de columna tomados del header ("Fecha Descripción Referencia Débito…")
  // con fallback a los valores medidos en los PDFs reales.
  let refX = 240; // inicio columna Referencia (header en x≈243)
  let amtX = 360; // desde acá solo importes (el débito más ancho arranca en x≈381)
  for (const line of lines) {
    const ref = line.find((it) => it.str.trim() === 'Referencia');
    const deb = line.find((it) => /^D[ée]bito$/.test(it.str.trim()));
    if (ref && deb) {
      refX = ref.x - 3;
      amtX = Math.min(amtX, deb.x - 45);
      break;
    }
  }

  // Agrupar ítems por página
  const pages = new Map();
  for (const line of lines) {
    for (const it of line) {
      if (!pages.has(it.page)) pages.set(it.page, []);
      pages.get(it.page).push(it);
    }
  }

  const rows = [];
  let descartados = 0;

  for (const items of pages.values()) {
    const anchors = items
      .filter((it) => it.x < DATE_MAX_X && DATE_RE.test(it.str.trim()))
      .sort((a, b) => b.y - a.y) // orden de impresión: de arriba hacia abajo
      .map((it) => ({ fecha: it.str.trim(), y: it.y, parts: [] }));
    if (anchors.length === 0) continue;

    for (const it of items) {
      const s = it.str.trim();
      if (it.x < DATE_MAX_X) continue; // columna fecha (anclas) o rótulos "Cuenta:", "Fecha"
      if (isNoise(s)) continue;
      // búsqueda binaria del ancla más cercana (anclas en Y descendente)
      let lo = 0, hi = anchors.length - 1;
      while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (anchors[mid].y > it.y) lo = mid + 1; else hi = mid;
      }
      let best = null;
      for (const k of [lo - 1, lo]) {
        const a = anchors[k];
        if (a && (best === null || Math.abs(a.y - it.y) < Math.abs(best.y - it.y))) best = a;
      }
      if (!best || Math.abs(best.y - it.y) > MAX_DY) { descartados++; continue; }
      best.parts.push(it);
    }

    for (const a of anchors) {
      const parts = a.parts.sort((p, q) => q.y - p.y || p.x - q.x);
      const desc = [], ref = [], amts = [];
      for (const it of parts) {
        const s = it.str.trim();
        if (it.x < refX) desc.push(s);
        else if (it.x < amtX) ref.push(s); // ojo: una referencia "724" parsearía como importe; decide la X
        else {
          const v = parseAmount(s);
          if (v !== null) amts.push({ x: it.x, v });
        }
      }
      if (amts.length === 0) continue; // sin saldo: no es un movimiento
      amts.sort((p, q) => p.x - q.x);
      const saldo = amts[amts.length - 1].v; // el más a la derecha es siempre el Saldo
      let debito = null, credito = null;
      for (const o of amts.slice(0, -1)) {
        if (o.x < 420) debito = o.v; else credito = o.v;
      }
      rows.push({
        cuenta,
        fecha: a.fecha,
        descripcion: desc.join(' '),
        referencia: ref.join(' '),
        debito: debito !== null ? Math.abs(debito) : null,
        credito: credito !== null ? Math.abs(credito) : null,
        saldo,
      });
    }
  }

  return { banco: 'Patagonia', accounts: { [cuenta]: rows }, descartados };
}
