import { useState } from 'react'
import { cx } from './Button'

// Gráficos del portal. Todos comen la misma forma: `datos` = [{ clave, valor }].
// Son HTML y CSS a propósito — no hay librería de charts en el proyecto y estas
// cuatro formas cubren lo que se grafica acá.

// Un solo tono para magnitudes: cuando la categoría ya está en la etiqueta,
// pintar cada barra de un color distinto no agrega información.
export const TONO_MAGNITUD = '#17587a'

/** Globo de valor. Vive dentro de un contenedor `relative`. */
function Globo({ children, x, y }) {
  return (
    <span
      className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-sm bg-navy-800 px-2 py-1 text-xs font-semibold text-white shadow-[0_6px_16px_-6px_rgba(0,28,44,0.6)]"
      style={{ left: x, top: y }}
    >
      {children}
    </span>
  )
}

function Vacio({ children = 'Sin datos con estos filtros.' }) {
  return <span className="block py-6 text-center text-sm text-ink-3">{children}</span>
}

/** Barras verticales de una sola serie. */
export function BarrasV({ datos, unidad = '', fmt = (n) => n, alto = 190 }) {
  const [sobre, setSobre] = useState(null)
  if (!datos.length) return <Vacio />
  const max = Math.max(...datos.map((d) => d.valor), 1)

  return (
    <div className="relative flex items-end gap-[2px] px-1 pt-6" style={{ height: alto }}>
      {sobre !== null && (
        <Globo x={`${((sobre + 0.5) / datos.length) * 100}%`} y={18}>
          {datos[sobre].clave}: {fmt(datos[sobre].valor)} {unidad}
        </Globo>
      )}
      {datos.map((d, i) => (
        <div
          key={d.clave}
          onMouseEnter={() => setSobre(i)}
          onMouseLeave={() => setSobre(null)}
          className="flex min-w-0 flex-1 cursor-default flex-col items-center justify-end gap-1.5 self-stretch"
        >
          <span
            className="w-full rounded-t-[4px] transition-opacity duration-100"
            style={{
              height: `${Math.max(2, (d.valor / max) * 100)}%`,
              background: TONO_MAGNITUD,
              opacity: sobre === null || sobre === i ? 1 : 0.45,
            }}
          />
          <span className="num w-full truncate text-center text-xs text-ink-3">{d.clave}</span>
        </div>
      ))}
    </div>
  )
}

/** Barras horizontales de una sola serie, con el valor rotulado al final. */
export function BarrasH({ datos, fmt = (n) => n, tope, sufijo = '' }) {
  if (!datos.length) return <Vacio />
  const max = Math.max(...datos.map((d) => d.valor), 1)
  return (
    <div className="flex flex-col gap-2.5">
      {datos.slice(0, tope).map((d) => (
        <div key={d.clave}>
          <div className="flex items-baseline justify-between gap-3">
            <span className="min-w-0 truncate text-sm text-ink-2" title={d.clave}>
              {d.clave}
            </span>
            <b className="num shrink-0 font-bold text-ink">
              {fmt(d.valor)}
              {sufijo}
            </b>
          </div>
          <span className="mt-1 block h-2 w-full overflow-hidden rounded-full bg-surface-3">
            <span
              className="block h-full rounded-full"
              style={{ width: `${(d.valor / max) * 100}%`, background: TONO_MAGNITUD }}
            />
          </span>
        </div>
      ))}
    </div>
  )
}

/**
 * Reparto de un total entre categorías: una barra al 100% con leyenda rotulada.
 * `color` es un mapa clave → hex; la identidad nunca queda solo en el color,
 * por eso la leyenda lleva siempre el valor.
 */
export function Reparto({ datos, color, fmt = (n) => n, sufijo = '' }) {
  const [sobre, setSobre] = useState(null)
  if (!datos.length) return <Vacio />
  const total = datos.reduce((a, d) => a + d.valor, 0) || 1

  return (
    <div className="flex flex-col gap-3">
      <div className="flex h-7 w-full gap-[2px] overflow-hidden rounded-sm">
        {datos.map((d, i) => (
          <span
            key={d.clave}
            title={`${d.clave}: ${fmt(d.valor)}${sufijo}`}
            onMouseEnter={() => setSobre(i)}
            onMouseLeave={() => setSobre(null)}
            className="min-w-[3px] cursor-default transition-opacity duration-100"
            style={{
              width: `${(d.valor / total) * 100}%`,
              background: color[d.clave],
              opacity: sobre === null || sobre === i ? 1 : 0.45,
            }}
          />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-x-4 gap-y-1.5 sm:grid-cols-2">
        {datos.map((d, i) => (
          <span
            key={d.clave}
            onMouseEnter={() => setSobre(i)}
            onMouseLeave={() => setSobre(null)}
            className="flex items-baseline gap-2 text-sm"
          >
            <span
              className="h-2.5 w-2.5 shrink-0 translate-y-px rounded-xs"
              style={{ background: color[d.clave] }}
            />
            <span className="min-w-0 flex-1 truncate text-ink-2">{d.clave}</span>
            <b className="num shrink-0 font-bold text-ink">
              {fmt(d.valor)}
              {sufijo}
            </b>
            <span className="num shrink-0 text-ink-3">{Math.round((d.valor / total) * 100)}%</span>
          </span>
        ))}
      </div>
    </div>
  )
}

/** Tendencia de una serie en el tiempo. SVG porque la línea sí necesita trazo. */
export function Lineas({ datos, unidad = '', fmt = (n) => n, alto = 190 }) {
  const [sobre, setSobre] = useState(null)
  if (!datos.length) return <Vacio />

  const max = Math.max(...datos.map((d) => d.valor), 1)
  const n = datos.length
  const px = (i) => (n === 1 ? 50 : (i / (n - 1)) * 100)
  const py = (v) => 100 - (v / max) * 100
  const puntos = datos.map((d, i) => `${px(i)},${py(d.valor)}`).join(' ')

  return (
    <div className="relative" style={{ height: alto }}>
      {sobre !== null && (
        <Globo x={`${px(sobre)}%`} y={py(datos[sobre].valor) * ((alto - 34) / 100) + 8}>
          {datos[sobre].clave}: {fmt(datos[sobre].valor)} {unidad}
        </Globo>
      )}
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="block w-full"
        style={{ height: alto - 26 }}
        aria-hidden="true"
      >
        <polygon points={`0,100 ${puntos} 100,100`} fill={TONO_MAGNITUD} opacity="0.1" />
        <polyline
          points={puntos}
          fill="none"
          stroke={TONO_MAGNITUD}
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
          strokeLinejoin="round"
        />
      </svg>

      {/* Los puntos y las zonas de hover van en HTML: en el SVG estirado se deforman */}
      <div className="absolute inset-x-0 top-0 flex" style={{ height: alto - 26 }}>
        {datos.map((d, i) => (
          <span
            key={d.clave}
            onMouseEnter={() => setSobre(i)}
            onMouseLeave={() => setSobre(null)}
            className="relative min-w-0 flex-1 cursor-default"
          >
            <span
              className={cx(
                'absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white transition-transform duration-100',
                sobre === i && 'scale-125',
              )}
              style={{ left: '50%', top: `${py(d.valor)}%`, background: TONO_MAGNITUD }}
            />
          </span>
        ))}
      </div>

      <div className="absolute inset-x-0 bottom-0 flex">
        {datos.map((d) => (
          <span key={d.clave} className="num min-w-0 flex-1 truncate text-center text-xs text-ink-3">
            {d.clave}
          </span>
        ))}
      </div>
    </div>
  )
}
