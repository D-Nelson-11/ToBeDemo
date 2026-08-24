import { fmtFechaHora } from '../lib/fechas'
import { tramiteAduana } from '../lib/torre'
import { cx } from './ui/Button'

// Semáforo del SLA: verde en tiempo, amarillo por vencer, rojo vencido.
const TONO = {
  ok: { punto: 'bg-teal-600 border-teal-600', linea: 'bg-teal-600/70', texto: 'text-teal-700', anillo: 'ring-teal-100' },
  riesgo: { punto: 'bg-ambar-500 border-ambar-500', linea: 'bg-ambar-500/70', texto: 'text-ambar-700', anillo: 'ring-ambar-100' },
  vencido: { punto: 'bg-rojo-600 border-rojo-600', linea: 'bg-rojo-600/70', texto: 'text-rojo-700', anillo: 'ring-rojo-100' },
  pendiente: { punto: 'bg-surface border-line-strong', linea: 'bg-line-strong', texto: 'text-ink-4', anillo: 'ring-navy-100' },
}

/**
 * Riel del trámite en aduana de destino: los seis hitos, el SLA de cada tramo y
 * cuánto le sobra o le falta a cada uno.
 *
 * @param embarque  el embarque de la torre
 * @param leyenda   agrega la fila que explica los colores
 */
export default function RielAduana({ embarque, leyenda = false }) {
  const hitos = tramiteAduana(embarque)

  return (
    <div className="flex flex-col gap-2">
      <div className="overflow-x-auto">
        <div className="grid min-w-[720px] grid-cols-6">
          {hitos.map((h, i) => {
            const t = TONO[h.estado]
            return (
              <div key={h.rotulo} className="relative flex min-w-0 flex-col items-center gap-px px-1 pt-6 text-center">
                {/* el tramo se pinta del color del hito al que entra: es su SLA */}
                {i > 0 && <span className={cx('absolute top-2.5 right-1/2 h-0.5 w-full', t.linea)} />}
                {i > 0 && (
                  <span className="num absolute top-2.5 left-0 z-10 -translate-x-1/2 -translate-y-1/2 rounded-full border border-line bg-surface px-[6px] py-px text-2xs font-medium text-ink-2">
                    {h.sla} h
                  </span>
                )}
                <span
                  className={cx(
                    'absolute top-2.5 left-1/2 z-10 h-[11px] w-[11px] -translate-x-1/2 -translate-y-1/2 rounded-full border-2',
                    t.punto,
                    h.curso && cx('ring-3', t.anillo),
                  )}
                />

                <span className={cx('text-xs leading-tight font-bold', h.curso ? 'text-navy-800' : 'text-ink-3')}>
                  {h.corto}
                </span>
                <span className="num text-2xs whitespace-nowrap text-ink-2">
                  {h.ts ? fmtFechaHora(h.ts) : h.curso ? 'en curso' : '—'}
                </span>
                {h.nota && (
                  <span className={cx('num text-2xs font-semibold whitespace-nowrap', t.texto)}>{h.nota}</span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {leyenda && (
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-2xs text-ink-3">
          {[
            ['ok', 'dentro del SLA'],
            ['riesgo', 'por vencer'],
            ['vencido', 'SLA vencido'],
            ['pendiente', 'sin iniciar'],
          ].map(([k, txt]) => (
            <span key={k} className="flex items-center gap-1.5">
              <span className={cx('h-2 w-2 rounded-full border-2', TONO[k].punto)} />
              {txt}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
