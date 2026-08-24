import { LuCircleCheck, LuCircleDashed, LuClock, LuTriangleAlert } from 'react-icons/lu'
import { bitacoraAduana } from '../lib/bitacora'
import { fmtFechaCorta } from '../lib/fechas'
import { cx } from './ui/Button'

const ESTADO = {
  Completado: { chip: 'bg-teal-50 text-teal-700', icono: LuCircleCheck, color: 'text-teal-600' },
  'En proceso': { chip: 'bg-ambar-50 text-ambar-700', icono: LuClock, color: 'text-ambar-600' },
  Incidencia: { chip: 'bg-rojo-50 text-rojo-700', icono: LuTriangleAlert, color: 'text-rojo-600' },
  Pendiente: { chip: 'bg-navy-50 text-navy-700', icono: LuCircleDashed, color: 'text-ink-4' },
}

const TONO_SLA = { ok: 'text-teal-700', riesgo: 'text-ambar-700', vencido: 'text-rojo-700' }

function Metrica({ rotulo, valor, tono }) {
  return (
    <div className="min-w-0 flex-1 rounded-sm border border-line bg-surface-2 px-3 py-2 text-center">
      <b className={cx('num block text-lg leading-tight font-bold', tono ?? 'text-navy-800')}>{valor}</b>
      <span className="block text-xs text-ink-3">{rotulo}</span>
    </div>
  )
}

/** Bitácora del proceso aduanero: avance, SLA y las actividades del trámite. */
export default function BitacoraAduana({ embarque }) {
  const b = bitacoraAduana(embarque)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        <Metrica rotulo="Avance" valor={`${b.avance}%`} tono="text-teal-700" />
        <Metrica rotulo="Pendiente" valor={`${b.pendiente}%`} />
        <Metrica rotulo="Tiempo restante SLA" valor={b.sla} tono={TONO_SLA[b.slaEstado]} />
        <Metrica rotulo="Proyección de liberación" valor={b.liberacion} />
      </div>

      <div className="h-2 w-full overflow-hidden rounded-full bg-surface-3">
        <span
          className="block h-full rounded-full bg-teal-600 transition-[width] duration-300 ease-[var(--ease-out-soft)]"
          style={{ width: `${b.avance}%` }}
        />
      </div>

      <div className="tabla-scroll">
        <table className="tbl">
          <thead>
            <tr>
              <th className="w-8" />
              <th>Actividad</th>
              <th>Fecha</th>
              <th>Hora</th>
              <th>Tiempo</th>
              <th>Estado</th>
              <th>Detalle</th>
            </tr>
          </thead>
          <tbody>
            {b.filas.map((f) => {
              const e = ESTADO[f.estado]
              const Icono = e.icono
              const pendiente = f.estado === 'Pendiente'
              return (
                <tr key={f.rotulo}>
                  <td>
                    <Icono size={15} className={e.color} />
                  </td>
                  <td className={cx(pendiente ? 'text-ink-3' : 'cell-strong')}>{f.rotulo}</td>
                  <td className="num text-sm">{fmtFechaCorta(f.fecha)}</td>
                  <td className="num text-sm">
                    {String(f.fecha.getHours()).padStart(2, '0')}:
                    {String(f.fecha.getMinutes()).padStart(2, '0')}
                  </td>
                  <td className="num text-sm">{f.duracion}</td>
                  <td>
                    <span
                      className={cx(
                        'inline-block whitespace-nowrap rounded-full px-2.5 py-[3px] text-xs font-semibold',
                        e.chip,
                      )}
                    >
                      {f.estado}
                    </span>
                  </td>
                  <td className="text-sm text-ink-3">{f.detalle || '—'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
