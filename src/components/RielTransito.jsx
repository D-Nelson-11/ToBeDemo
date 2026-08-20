import { fmtFecha } from '../lib/fechas'
import { cx } from './ui/Button'

const POS = ['0%', '50%', '100%']

/**
 * Riel de tránsito — Salida ─leg1─ Frontera ─leg2─ Planta.
 * Es la firma visual del producto: la OC no es una fila, es un recorrido.
 *
 * @param nodos  [{ rotulo, fecha, lugar, ancla }] — exactamente 3
 * @param tramos [dias, dias]
 * @param estado 'activo' | 'tarde' | 'inerte'
 */
export default function RielTransito({ nodos, tramos = [], estado = 'activo', mini = false }) {
  const linea =
    estado === 'tarde'
      ? 'bg-linear-90 from-rojo-600 to-ambar-500 opacity-90'
      : estado === 'activo'
        ? 'bg-linear-90 from-navy-600 to-teal-600 opacity-85'
        : 'bg-[repeating-linear-gradient(90deg,rgba(0,48,73,0.2)_0_4px,transparent_4px_8px)]'

  const anclaColor = estado === 'tarde' ? 'bg-rojo-600 border-rojo-600' : 'bg-ambar-500 border-ambar-500'
  const marcaBorde = estado === 'inerte' ? 'border-navy-400' : 'border-navy-700'

  return (
    <div className={cx('flex min-w-0 flex-col', mini ? 'w-24' : 'gap-[7px]')}>
      <div className={cx('relative', mini ? 'h-3.5' : 'h-[22px]')}>
        <span className={cx('absolute inset-x-1 top-1/2 -mt-px h-0.5 rounded-sm', linea)} />

        {nodos.map((n, i) => (
          <span
            key={i}
            title={n.rotulo}
            style={{ left: POS[i] }}
            className={cx(
              // todos los nodos son círculos; el ancla se distingue por relleno, no por forma
              'absolute top-1/2 h-[9px] w-[9px] -translate-x-1/2 -translate-y-1/2 rounded-full border-2',
              n.ancla ? anclaColor : cx('bg-surface', marcaBorde),
              'shadow-[0_0_0_3px_var(--color-surface)]',
            )}
          />
        ))}

        {!mini &&
          tramos.map((d, i) => (
            <span
              key={i}
              style={{ left: i === 0 ? '25%' : '75%' }}
              className="num absolute top-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full border border-line bg-surface px-[7px] py-px text-2xs font-medium text-ink-2"
            >
              {d} d
            </span>
          ))}
      </div>

      {!mini && (
        <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-2">
          {nodos.map((n, i) => (
            <div
              key={i}
              className={cx(
                'flex min-w-0 flex-col gap-px',
                i === 1 && 'items-center text-center',
                i === 2 && 'items-end text-right',
              )}
            >
              <span className="whitespace-nowrap text-xs font-bold text-ink-3">
                {n.rotulo}
              </span>
              <span className="num whitespace-nowrap text-sm font-medium text-ink">
                {n.fecha ? fmtFecha(n.fecha) : '—'}
              </span>
              {n.lugar && (
                <span className="max-w-full truncate text-3xs text-ink-4">{n.lugar}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
