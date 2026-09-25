import { useState } from 'react';
import DropZone from './components/DropZone.jsx';
import FileList from './components/FileList.jsx';
import Preview from './components/Preview.jsx';
import { BANKS } from './parsers/index.js';
import { extractLinesFromFile } from './core/pdfBrowser.js';
import { processLines } from './process.js';
import { downloadWorkbook } from './excel/export.js';

let nextId = 1;

export default function App() {
  const [items, setItems] = useState([]); // {id, file, status, result?, error?}
  const [selectedId, setSelectedId] = useState(null);
  const [busy, setBusy] = useState(false);

  const patch = (id, changes) => setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...changes } : it)));

  const addFiles = (files) =>
    setItems((prev) => [...prev, ...files.map((file) => ({ id: nextId++, file, status: 'pending' }))]);

  const remove = (id) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const processAll = async () => {
    setBusy(true);
    // Se procesa en serie: con 10+ PDFs grandes en paralelo el navegador sufre.
    for (const it of items.filter((x) => x.status === 'pending')) {
      patch(it.id, { status: 'processing' });
      try {
        const result = processLines(await extractLinesFromFile(it.file));
        patch(it.id, { status: result.warnings.length ? 'warn' : 'ok', result });
        setSelectedId((cur) => cur ?? it.id);
      } catch (e) {
        console.error(e);
        patch(it.id, { status: 'err', error: e.message });
      }
    }
    setBusy(false);
  };

  const done = items.filter((it) => it.result);
  const pending = items.filter((it) => it.status === 'pending').length;
  const selected = items.find((it) => it.id === selectedId && it.result);

  const downloadAll = async () => {
    for (const it of done) {
      downloadWorkbook(it.result, it.file.name);
      await new Promise((r) => setTimeout(r, 300)); // algunos navegadores bloquean descargas simultáneas
    }
  };

  return (
    <div className="wrap">
      <header>
        <p className="eyebrow">Herramienta interna</p>
        <h1>Extractos bancarios → Excel</h1>
        <p>
          Todo se procesa en tu navegador: nada se sube a ningún servidor. Cada PDF genera su propio Excel, con una hoja
          por cuenta y la hoja “Mayor Mensual”.
        </p>
        <div className="banks">
          {BANKS.map((b) => <span key={b.id} className="bank-chip">{b.label}</span>)}
        </div>
      </header>

      <section className="panel">
        <h2>1. Cargar extractos</h2>
        <DropZone onFiles={addFiles} />
        <FileList
          items={items}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onRemove={remove}
          onDownload={(it) => downloadWorkbook(it.result, it.file.name)}
        />
        <div className="actions">
          <button className="btn" disabled={busy || pending === 0} onClick={processAll}>
            {busy ? 'Procesando…' : `Procesar${pending ? ` (${pending})` : ''}`}
          </button>
          <button className="btn btn-outline" disabled={busy || done.length === 0} onClick={downloadAll}>
            Descargar todos los Excel ({done.length})
          </button>
        </div>
      </section>

      {selected && (
        <section className="panel">
          <h2>2. Vista previa</h2>
          <Preview key={selected.id} item={selected} />
        </section>
      )}

      <footer>
        Revisá siempre las filas marcadas “REVISAR” contra el PDF original. El resto quedó validado automáticamente
        (saldo anterior + crédito − débito = saldo).
      </footer>
    </div>
  );
}
