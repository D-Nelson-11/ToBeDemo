import { useState } from 'react'
import { LuChevronDown } from 'react-icons/lu'
import { cx } from './Button'

/**
 * Panel que se pliega desde su título; plegado queda solo la cabecera.
 * `extra` son datos (contadores) y van dentro del botón; `acciones` son
 * controles (filtros, botones) y van fuera: un input dentro de un <button> no es válido.
 */
export default function PanelPlegable({
  titulo,
  extra,
  acciones,
  abiertoAlInicio = true,
  className,
  children,
}) {
  const [abierto, setAbierto] = useState(abiertoAlInicio)
  return (
    <div className={cx('panel', className)}>
      <div className={cx('panel-head shrink-0 flex-wrap', !abierto && 'border-b-transparent')}>
        <button
          onClick={() => setAbierto((v) => !v)}
          aria-expanded={abierto}
          className="-mx-1.5 -my-1 flex min-w-0 flex-1 items-center gap-2 rounded-sm px-1.5 py-1 text-left transition-colors duration-100 hover:bg-surface-2"
        >
          <LuChevronDown
            size={15}
            className={cx(
              'shrink-0 text-ink-3 transition-transform duration-200 ease-[var(--ease-out-soft)] motion-reduce:transition-none',
              !abierto && '-rotate-90',
            )}
          />
          <span className="panel-title min-w-0">{titulo}</span>
          {extra && <span className="ml-auto flex shrink-0 items-center gap-2">{extra}</span>}
        </button>
        {acciones && <div className="flex flex-wrap items-center gap-2">{acciones}</div>}
      </div>
      <div
        className={cx(
          'grid min-h-0 transition-[grid-template-rows] duration-200 ease-[var(--ease-out-soft)] motion-reduce:transition-none',
          abierto ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
        )}
      >
        {/* React 18 quiere inert como '' (con true avisa) */}
        <div className="min-h-0 overflow-hidden" inert={abierto ? undefined : ''}>
          {children}
        </div>
      </div>
    </div>
  )
}
