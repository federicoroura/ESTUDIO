// PDF -> "líneas" de texto posicionado.
// No importa pdf.js directamente: recibe el documento ya abierto, así el mismo
// código corre en el navegador (Vite) y en Node (scripts/test-pdfs.mjs).

/**
 * @param {import('pdfjs-dist').PDFDocumentProxy} doc
 * @returns {Promise<Array<Array<{str:string,x:number,y:number,page:number}>>>}
 *   Array de líneas; cada línea es un array de ítems ordenados por X.
 */
export async function extractLines(doc) {
  const allLines = [];
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const content = await page.getTextContent();
    const items = content.items
      .map((it) => ({ str: it.str, x: it.transform[4], y: it.transform[5], page: p }))
      .filter((it) => it.str.trim().length > 0);
    items.sort((a, b) => b.y - a.y || a.x - b.x);

    let lastY = null;
    let cur = [];
    for (const it of items) {
      if (lastY === null || Math.abs(it.y - lastY) < 3) cur.push(it);
      else {
        allLines.push(cur);
        cur = [it];
      }
      lastY = it.y;
    }
    if (cur.length) allLines.push(cur);
  }
  return allLines;
}

export const lineText = (line) => line.map((it) => it.str).join(' ');
export const fullDocText = (lines) => lines.map(lineText).join('\n');
