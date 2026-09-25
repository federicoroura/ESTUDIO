import { parseAmountPlain } from '../core/amounts.js';
import { lineText, fullDocText } from '../core/pdf.js';

// ---------- Banco Hipotecario ----------
// Portado sin cambios de lógica. Importes con punto decimal simple (1234.56),
// por eso usa parseAmountPlain. Un solo importe con signo: negativo = débito.
export function parseHipotecario(lines) {
  const fullTxt = fullDocText(lines);
  let cuenta = 'sin-identificar';
  const cm = fullTxt.match(/CTE \$\s*([^\n]+)/);
  if (cm) cuenta = cm[1].trim();

  const inCol = (x, a, b) => x >= a && x < b;
  const rows = [];
  let pendingPrefix = '';
  let lastRow = null;

  for (const line of lines) {
    const fechaItem = line.find((it) => /^\d{2}\/\d{2}\/\d{4}$/.test(it.str.trim()));
    if (!fechaItem) {
      const descOnly =
        line.length &&
        line.every((it) => inCol(it.x, 40, 230)) &&
        !/^(FECHA|DESCRIPCI|IMPORTE|SALDO|Total:|El presente|correspondiente|Movimientos del|CTE \$)/i.test(lineText(line));
      if (descOnly) {
        const txt = line.map((it) => it.str).join(' ');
        if (lastRow) { lastRow.descripcion = (lastRow.descripcion + ' ' + txt).trim(); lastRow = null; }
        else pendingPrefix = (pendingPrefix ? pendingPrefix + ' ' : '') + txt;
      }
      continue;
    }
    let desc = '';
    const amtItems = [];
    for (const it of line) {
      const s = it.str.trim();
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) continue;
      if (inCol(it.x, 40, 230)) { desc += (desc ? ' ' : '') + s; continue; }
      const v = parseAmountPlain(s);
      if (v !== null) amtItems.push({ x: it.x, v });
    }
    if (amtItems.length === 0) continue;
    amtItems.sort((a, b) => a.x - b.x);
    const saldo = amtItems[amtItems.length - 1].v;
    const importe = amtItems.length > 1 ? amtItems[0].v : null;
    desc = (pendingPrefix ? pendingPrefix + ' ' : '') + desc;
    pendingPrefix = '';
    const row = {
      cuenta,
      fecha: fechaItem.str.trim(),
      descripcion: desc.trim(),
      referencia: '',
      debito: importe !== null && importe < 0 ? Math.abs(importe) : null,
      credito: importe !== null && importe >= 0 ? importe : null,
      saldo,
    };
    rows.push(row);
    lastRow = row;
  }
  return { banco: 'Hipotecario', accounts: { [cuenta]: rows } };
}
