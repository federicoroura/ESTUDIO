// Única pieza atada al navegador: abrir el PDF con pdf.js + worker local.
// El worker se sirve desde el propio build (no CDN): nada sale de la máquina.
import * as pdfjsLib from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.js?url';
import { extractLines } from './pdf.js';

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

export async function extractLinesFromFile(file) {
  const data = new Uint8Array(await file.arrayBuffer());
  const doc = await pdfjsLib.getDocument({ data }).promise;
  try {
    return await extractLines(doc);
  } finally {
    doc.destroy();
  }
}
