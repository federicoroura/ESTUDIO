// Pipeline puro (sin React ni DOM): líneas del PDF -> resultado listo para UI y Excel.
import { detectBank } from './parsers/index.js';
import { classify, mesDeFecha } from './accounting/classify.js';
import { validateAccount } from './accounting/validate.js';
import { buildMayor } from './accounting/mayor.js';

/**
 * @param {Array} lines  salida de extractLines(doc)
 * @returns {{banco, bankId, cuentas: Array<{cuenta, rows, bad, sinFecha, sinClasificar}>, mayor, warnings: string[], totalRows}}
 */
export function processLines(lines) {
  const bank = detectBank(lines);
  if (!bank) {
    throw new Error('No reconozco el formato (no es Patagonia/BBVA/Hipotecario/Santander, o es un PDF escaneado sin texto).');
  }
  const result = bank.parse(lines);
  const warnings = [];
  if (result.yearInferred) {
    warnings.push(`No encontré el año del período en el PDF; asumí ${new Date().getFullYear()}. Revisá las fechas.`);
  }

  const cuentas = [];
  const allRows = [];
  for (const [cuenta, rows] of Object.entries(result.accounts)) {
    if (rows.length === 0) continue;
    const bad = validateAccount(rows);
    for (const r of rows) {
      r.cuentaContable = classify(r);
      r.mes = mesDeFecha(r.fecha);
      if (!r.fecha) r.check = false; // sin fecha = revisar sí o sí
    }
    const sinFecha = rows.filter((r) => !r.fecha).length;
    const sinClasificar = rows.filter((r) => r.cuentaContable === 'Sin clasificar').length;
    if (bad > 0) warnings.push(`${result.banco} ${cuenta}: ${bad} de ${rows.length} filas no cierran el saldo (marcadas REVISAR).`);
    if (sinFecha > 0) warnings.push(`${result.banco} ${cuenta}: ${sinFecha} filas quedaron sin fecha (marcadas REVISAR).`);
    cuentas.push({ cuenta, rows, bad: rows.filter((r) => r.check === false).length, sinFecha, sinClasificar });
    allRows.push(...rows);
  }

  return {
    banco: result.banco,
    bankId: bank.id,
    cuentas,
    mayor: buildMayor(allRows),
    warnings,
    totalRows: allRows.length,
  };
}
