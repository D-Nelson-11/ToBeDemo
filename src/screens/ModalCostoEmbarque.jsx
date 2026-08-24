import { LuBadgeCheck, LuBellRing, LuWallet } from 'react-icons/lu'
import Modal from '../components/ui/Modal'
import Button, { cx } from '../components/ui/Button'
import { useOc } from '../data/store'
import { camposDeFila } from '../data/costos'

const EVENTOS = [
  ['Fin de tiempo libre', 'Fin tiempo libre', 'teal'],
  ['Inicio del costo', 'Inicio', 'ambar'],
  ['Causa', 'Causa', 'navy'],
  ['Costo actual', 'Costo actual', 'rojo'],
]

const PUNTO = {
  teal: 'bg-teal-600',
  ambar: 'bg-ambar-500',
  rojo: 'bg-rojo-600',
  navy: 'bg-navy-600',
}

function Bloque({ titulo, campos }) {
  if (!campos.length) return null
  return (
    <div className="panel p-4">
      <div className="lbl mb-2">{titulo}</div>
      <div className="flex flex-col">
        {campos.map(([et, val]) => (
          <div
            key={et}
            className="flex items-baseline justify-between gap-3 border-b border-line-soft py-1.5 text-sm last:border-b-0"
          >
            <span className="text-ink-3">{et}</span>
            <b className="num text-right font-semibold text-ink">{val || '—'}</b>
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Detalle general del embarque desde una fila de costos. Los campos salen de las
 * columnas de la vista, así sirve para cualquiera de las tablas del módulo.
 */
export default function ModalCostoEmbarque({ detalle, onClose }) {
  const { avisar } = useOc()
  const campos = detalle ? camposDeFila(detalle.vista, detalle.fila) : []
  const id = detalle?.fila[0]?.texto ?? ''
  const buscar = (re) => campos.find(([et]) => re.test(et))?.[1] ?? '—'

  // Se reparten por tema, como los cuatro paneles del HTML; lo que no cae en
  // ninguno queda en Información general para no perder columnas.
  const deUbicacion = /sitio|ubicaci|destino|estado/i
  const deCausa = /causa|tiempo libre|inicio|d[ií]as|costo \/ d|costo por d/i
  const deProyeccion = /costo actual|proyecci|riesgo|alerta|monto/i

  const ubicacion = campos.filter(([et]) => deUbicacion.test(et))
  const causa = campos.filter(([et]) => deCausa.test(et))
  const proyeccion = campos.filter(([et]) => deProyeccion.test(et))
  const general = campos.filter(
    ([et]) => !deUbicacion.test(et) && !deCausa.test(et) && !deProyeccion.test(et),
  )

  const accion = (que) =>
    avisar(`${que} · ${id} — registrar evidencia en la bitácora (demo).`, 'alerta')

  return (
    <Modal
      open={!!detalle}
      onClose={onClose}
      size="lg"
      eyebrow={detalle ? `${detalle.vista.titulo} · información operativa y de costos` : ''}
      title={`Detalle general · ${id}`}
      footer={
        <>
          <span className="min-w-0 flex-1 text-sm text-ink-2">
            Si la condición continúa, el sistema recalcula días acumulados y costo proyectado.
          </span>
          <Button variant="quiet" onClick={onClose}>
            Cerrar
          </Button>
        </>
      }
    >
      {detalle && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <Bloque titulo="Información general" campos={general} />
            <Bloque titulo="Ubicación y trazabilidad" campos={ubicacion} />
            <Bloque titulo="Causa y generación del costo" campos={causa} />
            <Bloque titulo="Proyección y acciones" campos={proyeccion} />
          </div>

          <div className="panel p-4">
            <div className="lbl mb-3">Bitácora del embarque</div>
            <div className="ml-2 border-l-2 border-line pl-4">
              {EVENTOS.map(([rotulo, clave, tono]) => (
                <div key={rotulo} className="relative pb-3 pl-5 last:pb-0">
                  <span
                    className={cx(
                      'absolute top-1 left-0 h-[9px] w-[9px] -translate-x-1/2 rounded-full ring-3 ring-surface',
                      PUNTO[tono],
                    )}
                  />
                  <span className="block text-sm font-bold text-ink">{rotulo}</span>
                  <span className="block text-xs text-ink-3">
                    {buscar(new RegExp(clave, 'i'))}
                  </span>
                </div>
              ))}
              <div className="relative pl-5">
                <span className="absolute top-1 left-0 h-[9px] w-[9px] -translate-x-1/2 rounded-full bg-navy-400 ring-3 ring-surface" />
                <span className="block text-sm font-bold text-ink">Siguiente acción</span>
                <span className="block text-xs text-ink-3">
                  Validar causa y actualizar la proyección.
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => accion('Validar costo')}>
              <LuBadgeCheck size={14} /> Validar costo
            </Button>
            <Button size="sm" onClick={() => accion('Solicitar aprobación de pago')}>
              <LuWallet size={14} /> Solicitar aprobación
            </Button>
            <Button size="sm" onClick={() => accion('Generar alerta')}>
              <LuBellRing size={14} /> Generar alerta
            </Button>
          </div>
        </div>
      )}
    </Modal>
  )
}
