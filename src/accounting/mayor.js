import { round2 } from '../core/amounts.js';

// Mayor Mensual por archivo: agrupa por mes y cuenta contable.
// Impuesto al Cheque se parte 33% crédito computable a cuenta de Ganancias /
// 67% gasto (Ley 25.413).
export const CUENTA_CRED_CHEQUE = 'Crédito Impuesto Ley 25413 (33%)';
export const CUENTA_GASTO_CHEQUE = 'Gasto Impuesto Ley 25413 (67%)';

export function buildMayor(allRows) {
  const acc = new Map();
  const add = (mes, cuenta, debito, credito) => {
    const k = mes + '|' + cuenta;
    if (!acc.has(k)) acc.set(k, { mes, cuenta, movs: 0, debito: 0, credito: 0 });
    const m = acc.get(k);
    m.debito += debito;
    m.credito += credito;
    m.movs += 1;
  };

  for (const r of allRows) {
    const d = r.debito || 0, c = r.credito || 0;
    if (r.cuentaContable === 'Impuesto al Cheque') {
      add(r.mes, CUENTA_CRED_CHEQUE, d * 0.33, c * 0.33);
      add(r.mes, CUENTA_GASTO_CHEQUE, d * 0.67, c * 0.67);
    } else {
      add(r.mes, r.cuentaContable, d, c);
    }
  }

  // orden cronológico real (mm/aaaa no ordena bien como string entre años)
  const key = (mes) => {
    const [m, y] = mes.split('/');
    return y ? Number(y) * 100 + Number(m) : 999999;
  };
  return [...acc.values()]
    .sort((a, b) => key(a.mes) - key(b.mes) || a.cuenta.localeCompare(b.cuenta))
    .map((m) => ({ ...m, debito: round2(m.debito), credito: round2(m.credito), neto: round2(m.credito - m.debito) }));
}
