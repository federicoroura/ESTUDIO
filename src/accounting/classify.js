// Clasificación contable simple y fija (sin reglas manuales, a pedido).
// Solo lo que el banco identifica sin ambigüedad; el resto se parte por signo:
// ingreso -> Deudores por Ventas, egreso -> Proveedores.
export const CLEAR_RULES = [
  { re: /IMP\.?\s?DB\/?CR\s*BANCARIOS|LEY NRO 25\.413|IMP\.LEY 25413|IMPUESTO CRED LEY 25413|IMPUESTO IMP DEB TASA GRAL|LEY 25\.413/i, cuenta: 'Impuesto al Cheque' },
  { re: /RETENCION ARBA|IIBB.*RET ARBA/i, cuenta: 'Retención IIBB' },
  { re: /IVA PERCEPCION|IVA ALICUOTA GENERAL|DEBITO FISCAL IVA|IVA\s*\d/i, cuenta: 'IVA Crédito Fiscal' },
  { re: /COMISION|COM\.\s|MANTENIMIENTO|BONIFICACION COMISION/i, cuenta: 'Gastos Bancarios' },
  { re: /INTERES/i, cuenta: 'Intereses' },
];

export function classify(row) {
  const text = row.descripcion || '';
  for (const r of CLEAR_RULES) if (r.re.test(text)) return r.cuenta;
  if (row.credito) return 'Deudores por Ventas';
  if (row.debito) return 'Proveedores';
  return 'Sin clasificar';
}

/** "dd/mm/aaaa" -> "mm/aaaa". Tolera fecha nula (Santander sin fecha diferida). */
export function mesDeFecha(fecha) {
  if (!fecha) return 'sin fecha';
  const [, m, y] = fecha.split('/');
  return `${m}/${y}`;
}
