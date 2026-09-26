/** Cifra de cabecera: tarjeta blanca y cifra en azul, igual en todo el portal. */
export function Kpi({ rotulo, valor, pie }) {
  return (
    <div className="min-w-[130px] flex-1 rounded-lg border border-line-soft bg-surface px-4 py-3 shadow-tarjeta">
      <div className="text-sm text-ink-3">{rotulo}</div>
      <div className="num mt-0.5 text-2xl font-bold text-navy-800">{valor}</div>
      {pie && <div className="num text-xs text-ink-3">{pie}</div>}
    </div>
  )
}

/** Par etiqueta / valor dentro de un modal. */
export function Dato({ rotulo, children }) {
  return (
    <div className="rounded-sm border border-line bg-surface-2 px-3 py-2">
      <span className="block text-xs text-ink-3">{rotulo}</span>
      <b className="block font-semibold text-ink">{children}</b>
    </div>
  )
}
