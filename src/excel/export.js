import * as XLSX from 'xlsx';

// Un Excel por PDF. Hoja "Mayor Mensual" primero, después una hoja por cuenta
// en el MISMO orden que imprime el banco (para comparar 1 a 1 contra el PDF).

export function buildWorkbook(processed) {
  const wb = XLSX.utils.book_new();

  const aoaMayor = [['Mes', 'Cuenta contable', 'Movimientos', 'Total Débito', 'Total Crédito', 'Neto (Créd-Déb)']];
  for (const m of processed.mayor) aoaMayor.push([m.mes, m.cuenta, m.movs, m.debito, m.credito, m.neto]);
  const wsMayor = XLSX.utils.aoa_to_sheet(aoaMayor);
  wsMayor['!cols'] = [{ wch: 9 }, { wch: 38 }, { wch: 12 }, { wch: 16 }, { wch: 16 }, { wch: 16 }];
  XLSX.utils.book_append_sheet(wb, wsMayor, 'Mayor Mensual');

  for (const { cuenta, rows } of processed.cuentas) {
    const aoa = [['Fecha', 'Descripción', 'Referencia', 'Débito', 'Crédito', 'Saldo', 'Verificado', 'Cuenta contable']];
    for (const r of rows) {
      aoa.push([
        r.fecha || '',
        r.descripcion,
        r.referencia || '',
        r.debito ?? '',
        r.credito ?? '',
        r.saldo,
        r.check === null ? '' : r.check ? 'OK' : 'REVISAR',
        r.cuentaContable,
      ]);
    }
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    ws['!cols'] = [{ wch: 11 }, { wch: 42 }, { wch: 24 }, { wch: 14 }, { wch: 14 }, { wch: 16 }, { wch: 10 }, { wch: 28 }];
    XLSX.utils.book_append_sheet(wb, ws, uniqueSheetName(wb, `${processed.banco} ${cuenta}`));
  }
  return wb;
}

function uniqueSheetName(wb, raw) {
  const base = raw.replace(/[\\/?*[\]:]/g, '').slice(0, 31);
  let name = base, n = 1;
  while (wb.SheetNames.includes(name)) name = (base.slice(0, 28) + ' ' + ++n).slice(0, 31);
  return name;
}

export const excelName = (pdfName) => pdfName.replace(/\.pdf$/i, '') + '.xlsx';

/** Solo navegador: dispara la descarga. */
export function downloadWorkbook(processed, pdfName) {
  XLSX.writeFile(buildWorkbook(processed), excelName(pdfName));
}
