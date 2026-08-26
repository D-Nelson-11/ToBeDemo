import { cx } from './Button'

/** Cifra de cabecera. `tono` son las clases de borde y fondo del semáforo. */
export function Kpi({ rotulo, valor, tono }) {
  return (
    <div
      className={cx('min-w-[130px] flex-1 rounded-sm border px-3 py-2.5', tono ?? 'border-line bg-surface')}
    >
      <div className="text-sm text-ink-3">{rotulo}</div>
      <div className="num text-2xl font-bold text-navy-800">{valor}</div>
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
