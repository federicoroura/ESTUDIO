import { useRef, useState } from 'react';

export default function DropZone({ onFiles }) {
  const inputRef = useRef(null);
  const [drag, setDrag] = useState(false);

  const pick = (list) => {
    const pdfs = [...list].filter((f) => f.type === 'application/pdf' || /\.pdf$/i.test(f.name));
    if (pdfs.length) onFiles(pdfs);
  };

  return (
    <div
      className={'drop' + (drag ? ' drag' : '')}
      onClick={() => inputRef.current.click()}
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => { e.preventDefault(); setDrag(false); pick(e.dataTransfer.files); }}
    >
      <p><strong>Hacé clic para elegir archivos</strong> o arrastralos acá</p>
      <p className="hint">Solo PDF con texto (no escaneados/fotos). Podés mezclar bancos y meses.</p>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        multiple
        hidden
        onChange={(e) => { pick(e.target.files); e.target.value = ''; }}
      />
    </div>
  );
}
