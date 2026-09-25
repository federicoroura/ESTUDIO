// Corre los parsers contra PDFs reales, sin navegador.
// Uso:  npm run test:pdfs -- ruta/a/*.pdf  [--xlsx carpeta-salida]
// Usa la MISMA versión de pdf.js que la app, así el resultado es idéntico.
import fs from 'node:fs';
import path from 'node:path';
import pdfjsMod from 'pdfjs-dist/legacy/build/pdf.js';
import * as XLSX from 'xlsx';
import { extractLines } from '../src/core/pdf.js';
import { processLines } from '../src/process.js';
import { buildWorkbook, excelName } from '../src/excel/export.js';

const pdfjsLib = pdfjsMod.default || pdfjsMod;
const args = process.argv.slice(2);
const xi = args.indexOf('--xlsx');
const outDir = xi >= 0 ? args.splice(xi, 2)[1] : null;
const files = args;
if (!files.length) {
  console.error('Uso: npm run test:pdfs -- archivo1.pdf archivo2.pdf [--xlsx salida/]');
  process.exit(1);
}

let fallas = 0;
for (const f of files) {
  const name = path.basename(f);
  try {
    const doc = await pdfjsLib.getDocument({ data: new Uint8Array(fs.readFileSync(f)), verbosity: 0 }).promise;
    const res = processLines(await extractLines(doc));
    for (const c of res.cuentas) {
      const sinDesc = c.rows.filter((r) => !r.descripcion).length;
      const ok = c.bad === 0 && c.sinFecha === 0 && sinDesc === 0;
      if (!ok) fallas++;
      console.log(
        `${ok ? '✓' : '✗'} ${name} | ${res.banco} ${c.cuenta} | ${c.rows.length} movs | ` +
          `no cierran: ${c.bad} | sin fecha: ${c.sinFecha} | sin descripción: ${sinDesc} | sin clasificar: ${c.sinClasificar}`
      );
    }
    res.warnings.forEach((w) => console.log('  ⚠ ' + w));
    if (outDir) {
      fs.mkdirSync(outDir, { recursive: true });
      XLSX.writeFile(buildWorkbook(res), path.join(outDir, excelName(name)));
    }
  } catch (e) {
    fallas++;
    console.log(`✗ ${name}: ${e.message}`);
  }
}
process.exit(fallas ? 1 : 0);
