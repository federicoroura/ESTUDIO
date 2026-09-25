# Conversor de extractos bancarios → Excel (React)

Versión React (Vite) de `conversor_extractos.html`. Todo corre en el navegador:
los PDF **nunca** salen de tu máquina (pdf.js y su worker se sirven desde el
propio build, no desde un CDN).

Bancos: Patagonia · BBVA Francés (multi-cuenta) · Hipotecario · Santander (multi-cuenta).

## Uso

Requisito: Node.js 18 o superior.

```bash
npm install
npm run dev          # abre http://localhost:5173
```

Build de producción (carpeta `dist/`, estática):

```bash
npm run build
npm run preview      # sirve dist/ en http://localhost:4173
```

> `dist/index.html` no funciona con doble clic (file://): los navegadores
> bloquean los módulos JS. Hay que servirlo (con `npm run preview` o cualquier
> servidor estático).

## Probar los parsers contra PDFs reales (sin navegador)

```bash
npm run test:pdfs -- "C:/extractos/*.pdf"
npm run test:pdfs -- extracto1.pdf extracto2.pdf --xlsx salida/   # además genera los Excel
```

Por cada cuenta informa movimientos, filas que no cierran, filas sin fecha y sin
descripción. Usa la misma versión de pdf.js que la app (3.11.174), así que el
resultado es idéntico al del navegador. **Correlo cada vez que toques un parser.**

## Estructura

```
src/
  core/
    amounts.js       parseAmount (1.234,56) / parseAmountPlain (1234.56)
    pdf.js           PDF → líneas de texto con coordenadas (JS puro)
    pdfBrowser.js    único archivo atado al navegador (worker de pdf.js)
  parsers/           un archivo por banco + index.js (detección) — JS puro, sin React
  accounting/
    classify.js      reglas fijas + Deudores por Ventas / Proveedores
    validate.js      saldo anterior + crédito − débito = saldo
    mayor.js         Mayor Mensual con Impuesto al Cheque 33% / 67%
  excel/export.js    armado del .xlsx (SheetJS)
  process.js         pipeline: líneas → resultado (usado por la UI y por el script)
  components/        DropZone, FileList, Preview (React)
  App.jsx
scripts/test-pdfs.mjs
```

La regla: **nada de `src/parsers`, `src/accounting` ni `src/excel` importa React.**
Por eso se pueden testear con Node y migrar a otro framework sin tocarlos.

## Diferencias con el HTML

- **Patagonia reescrito** para el formato de abril 2026 en adelante: agrupa
  cada renglón partido por cercanía en Y a su fecha (umbral 15pt, por página).
  El HTML dejaba 242 de 690 filas sin descripción en mayo 2026, y esas filas de
  Impuesto al Cheque terminaban clasificadas como Proveedores.
- **BBVA**: las filas del mes anterior que trae el extracto (ej. 30/04 en el de
  mayo) en el extracto de enero toman el año anterior. Antes quedaban 31/12 del
  año siguiente.
- **Validación**: prueba ambas direcciones (ascendente/descendente) y elige la
  que cierra; antes se decidía por fechas y fallaba si todo era del mismo día.
- **Santander**: una fila sin fecha ya no rompe el archivo entero; queda
  marcada REVISAR.
- Vista previa por archivo, filtro "Solo filas REVISAR", descarga por archivo o
  todas juntas (antes descargaba automáticamente al procesar).
- Se quitó la columna "Origen regla" del Excel (siempre decía "auto": era un
  resto del panel de reglas manuales).
