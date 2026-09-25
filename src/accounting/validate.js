// Validación por archivo: saldo_anterior + crédito − débito = saldo.
// Cada fila queda con r.check = true (OK) | false (REVISAR) | null (primera fila, sin anterior).
//
// Cambio respecto del HTML: el HTML decidía si el extracto viene ascendente o
// descendente comparando la fecha de la primera y la última fila. Si todo el
// extracto es de un mismo día (o falta una fecha) eso falla o revienta. Acá se
// prueban las dos direcciones y se queda con la que cierra más filas.

function checkDirection(rows, ascending) {
  const checks = rows.map((r, i) => {
    const prev = rows[ascending ? i - 1 : i + 1];
    if (!prev) return null;
    const esperado = prev.saldo + (r.credito || 0) - (r.debito || 0);
    return Math.abs(esperado - r.saldo) < 0.02;
  });
  return { checks, bad: checks.filter((c) => c === false).length };
}

/** Marca r.check en cada fila y devuelve la cantidad de filas que no cierran. */
export function validateAccount(rows) {
  if (rows.length < 2) {
    rows.forEach((r) => (r.check = null));
    return 0;
  }
  const asc = checkDirection(rows, true);
  const desc = checkDirection(rows, false);
  const best = asc.bad <= desc.bad ? asc : desc;
  rows.forEach((r, i) => (r.check = best.checks[i]));
  return best.bad;
}
