import { useMemo, useState } from 'react'
import {
  LuCircleCheck,
  LuCreditCard,
  LuFilePlus,
  LuInfo,
  LuLeaf,
  LuMapPin,
  LuNotebookText,
  LuPackage,
  LuSearch,
} from 'react-icons/lu'
import Modal from '../components/ui/Modal'
import Button, { cx } from '../components/ui/Button'
import { Select } from '../components/ui/Field'
import PanelPlegable from '../components/ui/PanelPlegable'
import { useOc } from '../data/store'
import { ESTADO_LISTA, TIPOS_FYDUCA } from '../data/fyducas'
import { ESTADOS_FYDUCA, construirFyducas } from '../lib/fyduca'
import { fmtFechaHora, fmtNum } from '../lib/fechas'

const TONO = {
  ok: 'bg-teal-50 text-teal-700',
  alerta: 'bg-ambar-50 text-ambar-700',
  curso: 'bg-navy-50 text-navy-700',
  gris: 'bg-surface-3 text-ink-3',
}

const TONO_VALOR = {
  Pagado: 'ok',
  Cargada: 'ok',
  Enviado: 'curso',
  Pendiente: 'alerta',
  'No aplica': 'gris',
  '—': 'gris',
}

const TONO_ESTADO = {
  'Pendiente MSF': 'alerta',
  'MSF enviado a pago': 'curso',
  'Esperando FYDUCA': 'curso',
  'Pago impuestos': 'alerta',
  'Impuestos en pago': 'curso',
  [ESTADO_LISTA]: 'ok',
}

const FLUJO_SALIDA = [
  ['Solicitud', 'Creada'],
  ['Pagos / FYDUCA', 'Gestión'],
  ['Pagado', 'Completo'],
  ['Esperando salida', 'Listo'],
  ['Salida', 'Continúa flujo'],
]

// Las dos rutas del flujo; las acciones rápidas actúan sobre la primera operación que las espera.
const FLUJOS = [
  {
    tipo: 'cuarentenario',
    icono: LuLeaf,
    chip: 'MSF + FYDUCA',
    pasos: [
      ['Solicitud MSF', 'Enviar a pago'],
      ['Estado MSF', 'Pagado / pendiente'],
      ['FYDUCA', 'Agregar FYDUCA'],
      ['Impuestos', 'Enviar a pago'],
    ],
    acciones: [
      ['Enviar MSF a pago', LuCreditCard, 'secondary'],
      ['Agregar FYDUCA', LuFilePlus, 'primary'],
    ],
  },
  {
    tipo: 'general',
    icono: LuPackage,
    chip: 'FYDUCA + impuestos',
    pasos: [
      ['FYDUCA', 'Cargar documento'],
      ['Estado pago', 'Enviado / pagado'],
      ['Despacho', 'Esperando salida'],
      ['Salida', 'Continúa a tránsito'],
    ],
    acciones: [
      ['Agregar FYDUCA', LuFilePlus, 'primary'],
      ['Enviar impuestos a pago', LuCreditCard, 'secondary'],
    ],
  },
]

function Chip({ tono, children }) {
  return (
    <span
      className={cx(
        'inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-[3px] text-xs font-semibold',
        TONO[tono],
      )}
    >
      {children}
    </span>
  )
}

function Kpi({ rotulo, valor, tono }) {
  return (
    <div className="tarjeta min-w-[150px] flex-1 px-3 py-2.5">
      <div className="text-sm text-ink-3">{rotulo}</div>
      <div
        className={cx(
          'num text-2xl font-bold',
          tono === 'alerta' && 'text-ambar-700',
          tono === 'curso' && 'text-navy-700',
          tono === 'ok' && 'text-teal-700',
        )}
      >
        {valor}
      </div>
    </div>
  )
}

function Dato({ rotulo, children }) {
  return (
    <div className="rounded-sm border border-line bg-surface-2 px-3 py-2">
      <span className="block text-xs text-ink-3">{rotulo}</span>
      <b className="block text-sm font-bold text-ink">{children}</b>
    </div>
  )
}

/** Control FYDUCA: seguimiento único de cada operación desde la instrucción hasta la salida. */
export default function ControlFyduca() {
  const { avancesFyduca, avanzarFyduca, avisar } = useOc()
  const [estado, setEstado] = useState('')
  const [tipo, setTipo] = useState('')
  const [q, setQ] = useState('')
  const [abierta, setAbierta] = useState(null)

  const operaciones = useMemo(() => construirFyducas(avancesFyduca), [avancesFyduca])
  // La modal lee la operación viva: si se avanza desde ahí, la bitácora se actualiza sola.
  const detalle = operaciones.find((o) => o.id === abierta)

  const filtradas = useMemo(() => {
    const t = q.toLowerCase().trim()
    return operaciones.filter(
      (o) =>
        (!estado || o.estado === estado) &&
        (!tipo || o.tipo === tipo) &&
        (!t || `${o.id} ${o.oc} ${o.proveedor} ${o.producto} ${o.lugar}`.toLowerCase().includes(t)),
    )
  }, [operaciones, estado, tipo, q])

  const cuenta = (...estados) => operaciones.filter((o) => estados.includes(o.estado)).length

  const avanzar = (o) => {
    avanzarFyduca(o.id)
    avisar(`${o.id}: ${o.pendiente.rotulo.toLowerCase()}.`, 'ok')
  }

  const accionRapida = (tipoFlujo, accion) => {
    const o = operaciones.find((x) => x.tipo === tipoFlujo && x.pendiente?.accion === accion)
    if (o) avanzar(o)
    else avisar(`Ninguna operación de ${TIPOS_FYDUCA[tipoFlujo].toLowerCase()} espera "${accion}".`, 'alerta')
  }

  return (
    <div className="flex flex-col gap-4">
      <PanelPlegable
        titulo="Control FYDUCA"
        extra={<span className="text-sm text-ink-3">Seguimiento previo a la salida</span>}
        acciones={
          <div className="flex flex-wrap items-center gap-2">
            <Select
              placeholder="Todos los estados"
              options={ESTADOS_FYDUCA}
              value={estado}
              onChange={(e) => setEstado(e.target.value)}
              className="w-[190px]"
            />
            <Select
              placeholder="Todos los productos"
              options={Object.entries(TIPOS_FYDUCA).map(([value, label]) => ({ value, label }))}
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              className="w-[180px]"
            />
            <div className="relative flex items-center">
              <LuSearch size={13} className="pointer-events-none absolute left-2.5 text-ink-4" />
              <input
                className="inp w-[230px] pl-7"
                placeholder="Buscar FYDUCA, OC, proveedor…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
          </div>
        }
      >
        <div className="flex flex-col gap-4 p-4">
          <div className="flex items-start gap-2.5 rounded-sm border border-line bg-surface-2 px-3 py-2.5 text-sm text-ink-2">
            <LuInfo size={15} className="mt-px shrink-0 text-navy-600" />
            <span>
              <b className="text-ink">Control exclusivo FYDUCA:</b> al procesar la instrucción, esta pantalla
              es el punto único de seguimiento. Acá se hacen los pagos pendientes, se carga el documento y
              se consulta la bitácora de cada operación.
            </span>
          </div>

          <div className="flex flex-wrap gap-3">
            <Kpi rotulo="FYDUCAs activas" valor={operaciones.length} />
            <Kpi rotulo="Pendientes MSF" valor={cuenta('Pendiente MSF', 'MSF enviado a pago')} tono="alerta" />
            <Kpi rotulo="Pendientes de FYDUCA" valor={cuenta('Esperando FYDUCA')} tono="curso" />
            <Kpi rotulo="Pendientes impuestos" valor={cuenta('Pago impuestos', 'Impuestos en pago')} tono="alerta" />
            <Kpi rotulo="Listas para salida" valor={cuenta(ESTADO_LISTA)} tono="ok" />
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-sm border border-line px-4 py-3">
            <span>
              <b className="block text-sm font-bold text-navy-800">Flujo previo a salida</b>
              <span className="text-xs text-ink-3">Paso 1 · Control FYDUCA</span>
            </span>
            <ol className="m-0 flex flex-1 list-none items-start overflow-x-auto p-0">
              {FLUJO_SALIDA.map(([rotulo, nota], i) => (
                <li key={rotulo} className="flex min-w-[104px] flex-1 flex-col items-center gap-1 text-center">
                  <span className="flex w-full items-center">
                    <span className={cx('h-px flex-1', i === 0 ? 'bg-transparent' : i <= 1 ? 'bg-teal-600' : 'bg-line')} />
                    <span
                      className={cx(
                        'num flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                        i < 1 ? 'bg-teal-50 text-teal-700' : i === 1 ? 'bg-navy-700 text-white' : 'bg-surface-3 text-ink-3',
                      )}
                    >
                      {i < 1 ? <LuCircleCheck size={13} /> : i + 1}
                    </span>
                    <span className={cx('h-px flex-1', i === FLUJO_SALIDA.length - 1 ? 'bg-transparent' : i < 1 ? 'bg-teal-600' : 'bg-line')} />
                  </span>
                  <b className={cx('text-xs', i === 1 ? 'text-navy-800' : 'text-ink-2')}>{rotulo}</b>
                  <span className="text-3xs text-ink-3">{nota}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </PanelPlegable>

      <PanelPlegable
        titulo="Dos flujos de operación"
        extra={<span className="text-sm text-ink-3">Acciones diferentes según tipo de mercancía</span>}
      >
        <div className="grid grid-cols-1 gap-4 p-4 lg:grid-cols-2">
          {FLUJOS.map((f) => (
            <div key={f.tipo} className="rounded-sm border border-line">
              <div className="flex items-center gap-2 border-b border-line bg-surface-2 px-3 py-2.5">
                <f.icono size={15} className="text-navy-600" />
                <b className="text-sm font-bold text-navy-800">{TIPOS_FYDUCA[f.tipo]}</b>
                <span className="ml-auto">
                  <Chip tono={f.tipo === 'general' ? 'curso' : 'ok'}>{f.chip}</Chip>
                </span>
              </div>
              <ul className="m-0 list-none p-0">
                {f.pasos.map(([rotulo, valor], i) => (
                  <li key={rotulo} className="flex items-center gap-2 border-b border-line-soft px-3 py-2 text-sm">
                    <span className="text-ink-3">
                      {i + 1}. {rotulo}
                    </span>
                    <b className="ml-auto font-bold text-ink">{valor}</b>
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap gap-2 p-3">
                {f.acciones.map(([accion, Icono, variante]) => (
                  <Button key={accion} size="sm" variant={variante} onClick={() => accionRapida(f.tipo, accion)}>
                    <Icono size={13} /> {accion}
                  </Button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </PanelPlegable>

      <PanelPlegable
        titulo="Transacciones FYDUCA"
        extra={<span className="num text-xs text-ink-3">{filtradas.length}</span>}
      >
        <div className="tabla-scroll">
          <table className="tbl">
            <thead>
              <tr>
                <th className="min-w-[210px]">FYDUCA / OC</th>
                <th className="w-[160px]">Tipo</th>
                <th className="min-w-[170px]">Proveedor</th>
                <th className="w-[100px]">MSF</th>
                <th className="w-[100px]">FYDUCA</th>
                <th className="w-[120px]">Pago impuestos</th>
                <th className="w-[160px]">Estado actual</th>
                <th className="min-w-[200px]">Ubicación</th>
                <th className="w-[130px]" />
              </tr>
            </thead>
            <tbody>
              {filtradas.length === 0 && (
                <tr>
                  <td colSpan={9} className="h-[120px]! bg-surface text-center text-sm text-ink-3">
                    No hay operaciones con estos filtros.
                  </td>
                </tr>
              )}
              {filtradas.map((o) => (
                <tr key={o.id}>
                  <td>
                    <button className="cell-key text-left hover:underline" onClick={() => setAbierta(o.id)}>
                      {o.id}
                    </button>
                    <span className="block text-xs text-ink-3">
                      {o.oc} · {o.producto} · {fmtNum(o.unidades)} u.
                    </span>
                  </td>
                  <td>{o.tipoRotulo}</td>
                  <td className="cell-cut" title={o.proveedor}>
                    {o.proveedor}
                  </td>
                  <td>
                    <Chip tono={TONO_VALOR[o.msf]}>{o.msf}</Chip>
                  </td>
                  <td>
                    <Chip tono={TONO_VALOR[o.fyduca]}>{o.fyduca}</Chip>
                  </td>
                  <td>
                    <Chip tono={TONO_VALOR[o.impuestos]}>{o.impuestos}</Chip>
                  </td>
                  <td>
                    <Chip tono={TONO_ESTADO[o.estado]}>{o.estado}</Chip>
                  </td>
                  <td>
                    <span className="flex items-start gap-1.5">
                      <LuMapPin size={12} className="mt-1 shrink-0 text-ink-4" />
                      <span className="min-w-0">
                        <span className="block text-sm text-ink">{o.lugar}</span>
                        <span className="num block text-xs text-ink-3">{o.gps}</span>
                      </span>
                    </span>
                  </td>
                  <td>
                    <div className="flex justify-end">
                      <Button size="sm" onClick={() => setAbierta(o.id)}>
                        <LuNotebookText size={12} /> Ver bitácora
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </PanelPlegable>

      <Modal
        open={!!detalle}
        onClose={() => setAbierta(null)}
        size="md"
        eyebrow={detalle ? `${detalle.oc} · ${detalle.proveedor} · ${detalle.producto}` : ''}
        title={detalle ? `Bitácora · ${detalle.id}` : ''}
        footer={
          <>
            <span className="min-w-0 flex-1">
              {detalle && <Chip tono={TONO_ESTADO[detalle.estado]}>{detalle.estado}</Chip>}
            </span>
            <Button variant="quiet" onClick={() => avisar(`GPS de ${detalle.id}: ${detalle.gps}.`, 'ok')}>
              <LuMapPin size={14} /> Ver GPS
            </Button>
            {detalle?.pendiente && (
              <Button variant="primary" onClick={() => avanzar(detalle)}>
                {detalle.pendiente.accion}
              </Button>
            )}
          </>
        }
      >
        {detalle && (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
              <Dato rotulo="Tipo">{detalle.tipoRotulo}</Dato>
              <Dato rotulo="Unidades">{fmtNum(detalle.unidades)}</Dato>
              <Dato rotulo="Estado actual">{detalle.estado}</Dato>
              <Dato rotulo="Ubicación">{detalle.lugar}</Dato>
              <Dato rotulo="MSF">{detalle.msf}</Dato>
              <Dato rotulo="FYDUCA">{detalle.fyduca}</Dato>
              <Dato rotulo="Pago impuestos">{detalle.impuestos}</Dato>
              <Dato rotulo="GPS">{detalle.gps}</Dato>
            </div>
            {detalle.msfSolicitud && (
              <p className="m-0 text-sm text-ink-3">
                Solicitud MSF: <b className="num font-bold text-ink">{detalle.msfSolicitud}</b>
              </p>
            )}

            <div className="panel p-4">
              <div className="lbl mb-3">Bitácora</div>
              <ol className="m-0 ml-2 list-none border-l-2 border-line p-0 pl-4">
                {[...detalle.hitos, { rotulo: ESTADO_LISTA, nota: 'Continúa al flujo de salida.' }].map((h, i) => {
                  const hecho = i < detalle.hechos
                  const curso = i === detalle.hechos
                  return (
                    <li key={h.rotulo} className="relative pb-4 last:pb-0">
                      <span
                        className={cx(
                          'absolute top-1 -left-4 h-[9px] w-[9px] -translate-x-[5px] rounded-full ring-3 ring-surface',
                          hecho ? 'bg-teal-600' : curso ? 'bg-navy-600' : 'bg-surface-3',
                        )}
                      />
                      <span className={cx('block text-sm font-bold', hecho || curso ? 'text-ink' : 'text-ink-3')}>
                        {h.rotulo}
                      </span>
                      <span className="block text-xs text-ink-3">
                        {hecho
                          ? `${fmtFechaHora(detalle.fechas[i])} · ${h.nota}`
                          : curso
                            ? i === detalle.hitos.length
                              ? `Actual · ${h.nota}`
                              : 'Acción requerida'
                            : 'Pendiente'}
                      </span>
                    </li>
                  )
                })}
              </ol>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
