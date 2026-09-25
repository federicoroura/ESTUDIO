import { parseAmount } from '../core/amounts.js';
import { lineText, fullDocText } from '../core/pdf.js';

const MESES = { ENERO: 1, FEBRERO: 2, MARZO: 3, ABRIL: 4, MAYO: 5, JUNIO: 6, JULIO: 7, AGOSTO: 8, SEPTIEMBRE: 9, SETIEMBRE: 9, OCTUBRE: 10, NOVIEMBRE: 11, DICIEMBRE: 12 };

// ---------- BBVA Francés (multi-cuenta) ----------
// Portado desde conversor_extractos.html. Único cambio: año correcto para las filas
// del mes anterior que trae el extracto (ver rowYear).
// - Fechas sin año (DD/MM): el año sale de "movimientos del mes: MES AÑO".
// - Débito viene con signo negativo en el texto; crédito positivo.
export function parseBBVA(lines) {
  const fullTxt = fullDocText(lines);
  let year = new Date().getFullYear();
  let mesExtracto = null;
  const ym = fullTxt.match(/movimientos del mes:\s*([A-ZÑ]+)\s*(\d{4})/i);
  if (ym) {
    year = parseInt(ym[2], 10);
    mesExtracto = MESES[ym[1].toUpperCase()] ?? null;
  }

  const inCol = (x, a, b) => x >= a && x < b;
  const accounts = {};
  let currentAccount = null;

  for (const line of lines) {
    const txt = lineText(line);

    const accHeader = txt.match(/CC \$ (\S+)\s*\(Cta\.Cte\.Bancaria\)/);
    if (accHeader) {
      currentAccount = accHeader[1];
      if (!accounts[currentAccount]) accounts[currentAccount] = [];
      continue;
    }
    if (/^Transferencias/.test(txt) || /^Legales y avisos/.test(txt)) {
      currentAccount = null; // fin de la sección de movimientos
      continue;
    }
    if (!currentAccount) continue;
    if (/SALDO ANTERIOR/.test(txt)) continue;

    const fechaItem = line.find((it) => /^\d{2}\/\d{2}$/.test(it.str.trim()));
    if (!fechaItem) continue;

    let origen = '', concepto = '';
    const amtItems = [];
    for (const it of line) {
      const s = it.str.trim();
      if (/^\d{2}\/\d{2}$/.test(s)) continue;
      if (inCol(it.x, 90, 120)) { origen += (origen ? ' ' : '') + s; continue; }
      if (inCol(it.x, 120, 370)) { concepto += (concepto ? ' ' : '') + s; continue; }
      const v = parseAmount(s);
      if (v !== null) amtItems.push({ x: it.x, v });
    }
    if (amtItems.length === 0) continue;
    amtItems.sort((a, b) => a.x - b.x);
    const saldo = amtItems[amtItems.length - 1].v;
    let debito = null, credito = null;
    for (const o of amtItems.slice(0, -1)) {
      if (o.x < 440) debito = o.v; else credito = o.v;
    }
    const [dd, mm] = fechaItem.str.trim().split('/');
    // El extracto trae movimientos del último día del mes anterior (ej. 30/04 en
    // el de mayo). En el extracto de ENERO esos serían 31/12 del año ANTERIOR.
    const rowYear = mesExtracto && Number(mm) > mesExtracto ? year - 1 : year;
    accounts[currentAccount].push({
      cuenta: currentAccount,
      fecha: `${dd}/${mm}/${rowYear}`,
      descripcion: (origen ? origen + ' ' : '') + concepto.trim(),
      referencia: '',
      debito: debito !== null ? Math.abs(debito) : null,
      credito: credito !== null ? Math.abs(credito) : null,
      saldo,
    });
  }
  return { banco: 'BBVA', accounts, yearInferred: !ym };
}
