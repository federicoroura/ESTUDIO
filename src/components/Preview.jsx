import { useMemo, useState } from 'react';

const fmt = (n) =>
  n === null || n === undefined || n === ''
    ? ''
    : n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function Preview({ item }) {
  const { result } = item;
  const tabs = ['Mayor Mensual', ...result.cuentas.map((c) => c.cuenta)];
  const [tab, setTab] = useState(tabs[1] ?? tabs[0]);
  const [soloRevisar, setSoloRevisar] = useState(false);

  const cuenta = result.cuentas.find((c) => c.cuenta === tab);
  const rows = useMemo(() => {
    if (!cuenta) return [];
    // idx = posición real en el PDF, se conserva aun filtrando
    const all = cuenta.rows.map((r, i) => ({ r, idx: i + 1 }));
    return soloRevisar ? all.filter(({ r }) => r.check === false) : all;
  }, [cuenta, soloRevisar]);

  return (
    <div className="preview">
      <div className="preview-head">
        <h3>{item.file.name}</h3>
        <div className="tabs">
          {tabs.map((t) => {
            const c = result.cuentas.find((x) => x.cuenta === t);
            return (
              <button key={t} className={'tab' + (t === tab ? ' active' : '')} onClick={() => setTab(t)}>
                {c ? `${result.banco} ${t}` : t}
                {c && c.bad > 0 && <span className="badge">{c.bad}</span>}
              </button>
            );
          })}
        </div>
      </div>

      {cuenta ? (
        <>
          <div className="preview-bar">
            <span>
              {cuenta.rows.length} movimientos · <b className={cuenta.bad ? 'bad' : 'good'}>{cuenta.bad} a revisar</b>
              {cuenta.sinClasificar > 0 && <> · {cuenta.sinClasificar} sin clasificar</>}
            </span>
            <label className="toggle">
              <input type="checkbox" checked={soloRevisar} onChange={(e) => setSoloRevisar(e.target.checked)} />
              Solo filas REVISAR
            </label>
          </div>
          <div className="table-wrap">
            <table className="grid">
              <thead>
                <tr>
                  <th>#</th><th>Fecha</th><th>Descripción</th><th>Referencia</th>
                  <th className="num">Débito</th><th className="num">Crédito</th><th className="num">Saldo</th>
                  <th>Verif.</th><th>Cuenta contable</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ r, idx }) => {
                  return (
                    <tr key={idx} className={r.check === false ? 'row-bad' : ''}>
                      <td className="muted">{idx}</td>
                      <td>{r.fecha || <span className="bad">sin fecha</span>}</td>
                      <td>{r.descripcion}</td>
                      <td className="muted">{r.referencia}</td>
                      <td className="num">{fmt(r.debito)}</td>
                      <td className="num">{fmt(r.credito)}</td>
                      <td className="num">{fmt(r.saldo)}</td>
                      <td>{r.check === null ? '' : r.check ? <span className="good">OK</span> : <span className="bad">REVISAR</span>}</td>
                      <td>{r.cuentaContable}</td>
                    </tr>
                  );
                })}
                {rows.length === 0 && (
                  <tr><td colSpan={9} className="empty">No hay filas para revisar en esta cuenta.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="table-wrap">
          <table className="grid">
            <thead>
              <tr><th>Mes</th><th>Cuenta contable</th><th className="num">Movs</th><th className="num">Débito</th><th className="num">Crédito</th><th className="num">Neto</th></tr>
            </thead>
            <tbody>
              {result.mayor.map((m) => (
                <tr key={m.mes + m.cuenta}>
                  <td>{m.mes}</td><td>{m.cuenta}</td><td className="num">{m.movs}</td>
                  <td className="num">{fmt(m.debito)}</td><td className="num">{fmt(m.credito)}</td><td className="num">{fmt(m.neto)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
