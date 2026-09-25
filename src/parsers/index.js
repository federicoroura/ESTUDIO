import { fullDocText } from '../core/pdf.js';
import { parsePatagonia } from './patagonia.js';
import { parseBBVA } from './bbva.js';
import { parseHipotecario } from './hipotecario.js';
import { parseSantander } from './santander.js';

export const BANKS = [
  { id: 'patagonia', label: 'Banco Patagonia', parse: parsePatagonia,
    detect: (t) => t.includes('Titularidad:') && /Fecha\s+Descripci/.test(t) },
  { id: 'bbva', label: 'BBVA Francés (multi-cuenta)', parse: parseBBVA,
    detect: (t) => t.includes('Banco BBVA Argentina') },
  { id: 'hipotecario', label: 'Banco Hipotecario', parse: parseHipotecario,
    detect: (t) => t.includes('Banco Hipotecario') },
  { id: 'santander', label: 'Banco Santander (multi-cuenta)', parse: parseSantander,
    detect: (t) => t.includes('Banco Santander') },
];

/** Devuelve el banco detectado (objeto de BANKS) o null. El orden importa. */
export function detectBank(lines) {
  const txt = fullDocText(lines);
  return BANKS.find((b) => b.detect(txt)) || null;
}
