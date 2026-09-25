import { parseAmount } from '../core/amounts.js';
import { lineText } from '../core/pdf.js';

// ---------- Banco Santander (multi-cuenta) ----------
// Portado sin cambios de lógica. Particularidad verificada contra coordenadas
// reales: cuando varios movimientos caen el mismo día, Santander NO repite la
// fecha en el renglón — la imprime suelta y desplazada verticalmente. Por eso la
// fila se arma apenas aparecen los importes y la fecha se le asigna cuando
// aparece (inline o en una línea posterior), nunca al revés.
// Débito x≤384 / Crédito x≥429 (medido sobre ~300 movimientos) → corte en 405.
export function parseSantander(lines) {
  const inCol = (x, a, b) => x >= a && x < b;
  const accounts = {};
  let currentAccount = null;
  let currentRow = null;

  const normalizeYear = (f) => {
    const [d, m, y] = f.split('/');
    return `${d}/${m}/20${y}`;
  };

  for (const line of lines) {
    const txt = lineText(line);

    // Desde "Detalle impositivo" son tablas de retenciones, no movimientos.
    if (/Detalle impositivo/.test(txt)) break;

    const accHeader = txt.match(/Cuenta Corriente N[ºo]\s*([\d\-/]+)\s*CBU/i);
    if (accHeader) {
      currentAccount = accHeader[1];
      if (!accounts[currentAccount]) accounts[currentAccount] = [];
      currentRow = null; // el header se repite en cada página
      continue;
    }
    if (!currentAccount) continue;
    // "Total" viene en la MISMA línea que su importe
    if (/^Total\b/.test(txt.trim())) { currentRow = null; continue; }
    if (/^Saldo total\b/.test(txt.trim())) { currentRow = null; continue; }

    const dateItem = line.find((it) => it.x < 60 && /^\d{2}\/\d{2}\/\d{2}$/.test(it.str.trim()));

    // Línea con SOLO la fecha: es el "eco" diferido de la fila actual
    if (dateItem && line.length === 1) {
      if (currentRow) currentRow.fecha = normalizeYear(dateItem.str.trim());
      continue;
    }

    let comprobante = '', desc = '';
    const amtItems = [];
    for (const it of line) {
      const s = it.str.trim();
      if (!s || it === dateItem) continue;
      if (inCol(it.x, 60, 110)) { comprobante += (comprobante ? ' ' : '') + s; continue; }
      if (inCol(it.x, 110, 340)) { desc += (desc ? ' ' : '') + s; continue; }
      const v = parseAmount(s.replace(/^\$\s*/, ''));
      if (v !== null) amtItems.push({ x: it.x, v });
    }

    if (amtItems.length === 0) {
      if (currentRow) currentRow.descripcion = (currentRow.descripcion + ' ' + desc).trim();
      continue;
    }

    amtItems.sort((a, b) => a.x - b.x);
    const saldo = amtItems[amtItems.length - 1].v;
    let debito = null, credito = null;
    if (amtItems.length > 1) {
      const mid = amtItems[0];
      if (mid.x < 405) debito = mid.v; else credito = mid.v;
    }

    const row = {
      cuenta: currentAccount,
      fecha: dateItem ? normalizeYear(dateItem.str.trim()) : null,
      descripcion: desc.trim(),
      referencia: comprobante,
      debito,
      credito,
      saldo,
    };
    accounts[currentAccount].push(row);
    currentRow = row;
  }

  return { banco: 'Santander', accounts };
}
