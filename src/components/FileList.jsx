const LABEL = { pending: 'en cola', processing: 'procesando…', ok: 'ok', warn: 'con avisos', err: 'error' };

export default function FileList({ items, selectedId, onSelect, onRemove, onDownload }) {
  if (!items.length) return null;
  return (
    <ul className="file-list">
      {items.map((it) => {
        const done = it.status === 'ok' || it.status === 'warn';
        return (
          <li key={it.id} className={'file-row' + (it.id === selectedId ? ' selected' : '')}>
            <button className="name" disabled={!done} onClick={() => onSelect(it.id)} title={done ? 'Ver vista previa' : ''}>
              {it.file.name}
            </button>
            {it.result && <span className="meta">{it.result.banco} · {it.result.totalRows} movs</span>}
            <span className={'status ' + it.status}>{LABEL[it.status]}</span>
            {done && <button className="btn-sec" onClick={() => onDownload(it)}>Excel</button>}
            <button className="btn-x" onClick={() => onRemove(it.id)} aria-label="Quitar">×</button>
            {it.error && <div className="file-msg err">{it.error}</div>}
            {it.result?.warnings.map((w, i) => <div key={i} className="file-msg warn">{w}</div>)}
          </li>
        );
      })}
    </ul>
  );
}
