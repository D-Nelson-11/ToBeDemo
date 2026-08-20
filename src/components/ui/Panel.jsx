import { cx } from './Button'

export default function Panel({ titulo, icono: Icono, sub, acciones, flush, children, className }) {
  return (
    <section className={cx('panel', className)}>
      {(titulo || acciones) && (
        <header className="panel-head">
          {titulo && (
            <h2 className="panel-title">
              {Icono && <Icono size={14} strokeWidth={2} />}
              {titulo}
            </h2>
          )}
          {sub && (
            <span className="min-w-0 flex-1 truncate text-sm text-ink-3">{sub}</span>
          )}
          {acciones && <div className="ml-auto flex items-center gap-2">{acciones}</div>}
        </header>
      )}
      <div className={flush ? '' : 'p-4'}>{children}</div>
    </section>
  )
}

/** Encabezado de sección dentro de un modal: título, regla y pista. */
export function Seccion({ titulo, icono: Icono, pista, children }) {
  return (
    <div>
      <div className="mb-3 flex items-center gap-3">
        <h3 className="panel-title">
          {Icono && <Icono size={14} strokeWidth={2} />}
          {titulo}
        </h3>
        <span className="h-px flex-1 bg-line" />
        {pista && <span className="whitespace-nowrap text-sm text-ink-3">{pista}</span>}
      </div>
      {children}
    </div>
  )
}
