import { useMemo, useState } from 'react'
import {
  LuCircleCheck,
  LuMapPin,
  LuPackageCheck,
  LuRoute,
  LuSearch,
  LuSparkles,
  LuTriangleAlert,
} from 'react-icons/lu'
import Modal from '../components/ui/Modal'
import Button, { cx } from '../components/ui/Button'
import { Field, Input, Select } from '../components/ui/Field'
import PanelPlegable from '../components/ui/PanelPlegable'
import Gestiones from './Gestiones'
import { useOc } from '../data/store'
import { ESTADOS_WH, esDisponible, estadoWh, itemGestion, transitoWh } from '../lib/warehouse'
import { fmtFechaCorta, fmtFechaHora } from '../lib/fechas'

const TONO_ESTADO = {
  'Enviado por proveedor': 'bg-navy-50 text-navy-700',
  'En tránsito': 'bg-navy-50 text-navy-700',
  'Llegada Warehouse': 'bg-ambar-50 text-ambar-700',
  Recibido: 'bg-teal-50 text-teal-700',
}

const PASOS_TRANSITO = [
  ['Proveedor listo', 'Confirmación'],
  ['Salida origen', 'ETD'],
  ['En tránsito', 'GPS / ETA'],
  ['Llegada Warehouse', 'Recepción'],
  ['Disponible', 'Consolidación'],
]

const REGLAS = [
  'Mismo destino / aduana',
  'Ventana de entrega compatible',
  'Modalidad compatible',
  'Fecha disponible para salida',
  'Capacidad de consolidación',
]

// En qué paso de PASOS_TRANSITO va el envío, según sus hitos con fecha.
function pasoDe(x) {
  if (x.recepcion) return 4
  if (x.llegada) return 3
  if (x.salida) return 2
  return 1
}

function Kpi({ rotulo, valor, nota }) {
  return (
    <div className="tarjeta min-w-[150px] flex-1 px-3 py-2.5">
      <div className="text-sm text-ink-3">{rotulo}</div>
      <div className="num text-2xl font-bold">{valor}</div>
      <div className="text-xs text-ink-4">{nota}</div>
    </div>
  )
}

function Chip({ estado }) {
  return (
    <span
      className={cx(
        'inline-flex whitespace-nowrap rounded-full px-2.5 py-[3px] text-xs font-semibold',
        TONO_ESTADO[estado],
      )}
    >
      {estado}
    </span>
  )
}

function Dato({ rotulo, children }) {
  return (
    <div className="min-w-0 rounded-sm border border-line bg-surface-2 px-3 py-2">
      <span className="block text-xs text-ink-3">{rotulo}</span>
      <b className="block truncate text-sm font-bold text-ink">{children}</b>
    </div>
  )
}

function Linea({ actual, retraso, notas = [] }) {
  return (
    <ol className="m-0 flex list-none items-start overflow-x-auto p-0">
      {PASOS_TRANSITO.map(([rotulo, nota], i) => {
        const tarde = retraso && i === actual
        return (
          <li key={rotulo} className="flex min-w-[100px] flex-1 flex-col items-center gap-1 text-center">
            <span className="flex w-full items-center">
              <span className={cx('h-px flex-1', i === 0 ? 'bg-transparent' : i <= actual ? 'bg-teal-600' : 'bg-line')} />
              <span
                className={cx(
                  'num flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                  i < actual
                    ? 'bg-teal-50 text-teal-700'
                    : tarde
                      ? 'bg-rojo-600 text-white'
                      : i === actual
                        ? 'bg-navy-700 text-white'
                        : 'bg-surface-3 text-ink-3',
                )}
              >
                {i < actual ? <LuCircleCheck size={13} /> : tarde ? '!' : i + 1}
              </span>
              <span
                className={cx('h-px flex-1', i === PASOS_TRANSITO.length - 1 ? 'bg-transparent' : i < actual ? 'bg-teal-600' : 'bg-line')}
              />
            </span>
            <b className={cx('text-xs', i === actual ? 'text-navy-800' : 'text-ink-2')}>{rotulo}</b>
            <span className="text-3xs text-ink-3">{notas[i] ?? nota}</span>
          </li>
        )
      })}
    </ol>
  )
}

/** Warehouse Virtual: lo que se mandó a consolidar, su tránsito y lo que ya se puede consolidar. */
export default function WarehouseVirtual() {
  const { warehouse, ordenes, actualizarWarehouse, crearSalidaWh, avisar } = useOc()
  const [q, setQ] = useState('')
  const [estado, setEstado] = useState('')
  const [marcados, setMarcados] = useState(() => new Set())
  const [propuesta, setPropuesta] = useState(null)
  // { ref, modo: 'estado' | 'transito' }; el envío se lee vivo del store.
  const [modal, setModal] = useState(null)
  const [fechas, setFechas] = useState({ salida: '', llegada: '', recepcion: '' })
  // REF. WH que se están preparando en el paso 4; se congelan al abrir la modal.
  const [preparando, setPreparando] = useState(null)

  const filas = useMemo(() => {
    const t = q.toLowerCase().trim()
    return warehouse.filter(
      (x) =>
        (!estado || estadoWh(x) === estado) &&
        (!t || `${x.ref} ${x.oc} ${x.sku} ${x.factura} ${x.proveedor}`.toLowerCase().includes(t)),
    )
  }, [warehouse, q, estado])

  const cuenta = (fn) => warehouse.filter(fn).length
  const abierto = warehouse.find((x) => x.ref === modal?.ref)
  // Si un envío deja de estar disponible, su check no puede seguir contando.
  const seleccionados = warehouse.filter((x) => marcados.has(x.ref) && esDisponible(x))

  const alternar = (ref) =>
    setMarcados((prev) => {
      const s = new Set(prev)
      s.has(ref) ? s.delete(ref) : s.add(ref)
      return s
    })

  const abrirEstado = (x) => {
    setFechas({ salida: x.salida, llegada: x.llegada, recepcion: x.recepcion })
    setModal({ ref: x.ref, modo: 'estado' })
  }

  const guardarEstado = () => {
    const { salida, llegada, recepcion } = fechas
    if (llegada && salida && llegada < salida) return avisar('La llegada no puede ser anterior a la salida.', 'alerta')
    if (recepcion && llegada && recepcion < llegada)
      return avisar('La recepción no puede ser anterior a la llegada.', 'alerta')
    const nuevo = estadoWh({ ...abierto, ...fechas })
    actualizarWarehouse(abierto.ref, fechas, { evento: `Estado: ${nuevo}`, detalle: 'Fechas reales actualizadas' })
    avisar(`${abierto.ref} actualizado: ${nuevo}.`, 'ok')
    setModal(null)
  }

  const confirmarLlegada = () => {
    const pendiente = warehouse.find((x) => !x.recepcion)
    if (!pendiente) return avisar('No hay una recepción pendiente.', 'alerta')
    abrirEstado(pendiente)
  }

  const analizar = () => {
    const disponibles = warehouse.filter(esDisponible).slice(0, 3)
    setPropuesta(disponibles)
  }

  return (
    <>
      <div className="flex flex-wrap gap-3">
        <Kpi rotulo="Enviado por proveedor" valor={cuenta((x) => estadoWh(x) === 'Enviado por proveedor')} nota="Pendiente de salida" />
        <Kpi rotulo="En tránsito" valor={cuenta((x) => estadoWh(x) === 'En tránsito')} nota="Hacia el Warehouse" />
        <Kpi rotulo="Pendiente recibir" valor={cuenta((x) => estadoWh(x) === 'Llegada Warehouse')} nota="Llegó, falta recepción" />
        <Kpi rotulo="Disponible" valor={cuenta(esDisponible)} nota="Lista para consolidar" />
        <Kpi rotulo="Seleccionado" valor={seleccionados.length} nota="Para crear salida" />
      </div>

      <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
        <PanelPlegable
          titulo="Envíos al centro de consolidación"
          extra={<span className="num text-xs text-ink-3">{filas.length}</span>}
          acciones={
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex items-center">
                <LuSearch size={13} className="pointer-events-none absolute left-2.5 text-ink-4" />
                <input
                  className="inp w-[220px] pl-7"
                  placeholder="OC, SKU, factura o proveedor…"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
              </div>
              <Select
                placeholder="Todos los estados"
                options={ESTADOS_WH}
                value={estado}
                onChange={(e) => setEstado(e.target.value)}
                className="w-[180px]"
              />
              <Button onClick={confirmarLlegada}>Confirmar llegada</Button>
              <Button
                variant="primary"
                disabled={!seleccionados.length}
                onClick={() => setPreparando(seleccionados.map((x) => itemGestion(x, ordenes)))}
              >
                <LuPackageCheck size={14} /> Preparar salida
              </Button>
            </div>
          }
        >
          <div className="flex flex-col gap-4 p-4">
            <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
              <Dato rotulo="En tránsito a Warehouse">{cuenta((x) => estadoWh(x) === 'En tránsito')} envíos activos</Dato>
              <Dato rotulo="En tiempo">{cuenta((x) => estadoWh(x) === 'En tránsito' && !x.retraso)} monitoreados</Dato>
              <Dato rotulo="Retrasados">{cuenta((x) => !x.recepcion && x.retraso)} requieren seguimiento</Dato>
              <Dato rotulo="Arribados">{cuenta((x) => x.llegada)} en Warehouse</Dato>
            </div>

            <div className="rounded-sm border border-line px-4 py-3">
              <div className="mb-3 flex flex-wrap items-baseline gap-2">
                <b className="text-sm font-bold text-navy-800">Línea de tiempo · Tránsito hacia Warehouse</b>
                <span className="text-xs text-ink-3">Salida → tránsito → llegada</span>
              </div>
              <Linea actual={2} />
            </div>

            <div className="flex flex-wrap items-center gap-2 rounded-sm border border-navy-100 bg-navy-50 px-3 py-2 text-sm">
              <span>
                <b className="num font-bold text-navy-800">{seleccionados.length}</b> mercancía
                {seleccionados.length === 1 ? '' : 's'} seleccionada{seleccionados.length === 1 ? '' : 's'}
              </span>
              <span className="ml-auto text-xs text-ink-3">Solo lo “Recibido” se puede seleccionar</span>
            </div>
          </div>

          <div className="tabla-scroll">
            <table className="tbl">
              <thead>
                <tr>
                  <th className="w-9" />
                  <th className="w-[80px]">Ref. WH</th>
                  <th className="w-[140px]">OC</th>
                  <th className="min-w-[150px]">Proveedor</th>
                  <th className="w-[140px]">Factura</th>
                  <th className="min-w-[190px]">SKU</th>
                  <th className="min-w-[180px]">ETA Warehouse</th>
                  <th className="min-w-[190px]">Tránsito</th>
                  <th className="w-[80px]">Incoterm</th>
                  <th className="w-[160px]">Estado</th>
                  <th className="w-[230px]" />
                </tr>
              </thead>
              <tbody>
                {filas.length === 0 && (
                  <tr>
                    <td colSpan={11} className="h-[120px]! bg-surface text-center text-sm text-ink-3">
                      No hay envíos con este filtro.
                    </td>
                  </tr>
                )}
                {filas.map((x) => {
                  const est = estadoWh(x)
                  const disponible = esDisponible(x)
                  return (
                    <tr key={x.ref} className={cx(marcados.has(x.ref) && disponible && '[&>td]:bg-navy-50!')}>
                      <td>
                        {disponible ? (
                          <input
                            type="checkbox"
                            className="chk"
                            aria-label={`Seleccionar ${x.ref}`}
                            checked={marcados.has(x.ref)}
                            onChange={() => alternar(x.ref)}
                          />
                        ) : (
                          <span className="text-ink-4">—</span>
                        )}
                      </td>
                      <td className="cell-key">{x.ref}</td>
                      <td className="cell-strong">
                        {x.oc}
                        {x.despacho && <span className="block text-xs font-normal text-ink-3">{x.despacho}</span>}
                      </td>
                      <td className="cell-cut" title={x.proveedor}>
                        {x.proveedor}
                      </td>
                      <td className="num">{x.factura}</td>
                      <td className="cell-cut" title={x.sku}>
                        {x.sku}
                      </td>
                      <td>
                        <span className="num">{fmtFechaCorta(x.eta)}</span>
                        <span className="num block text-3xs text-ink-3">
                          Salida {x.salida ? fmtFechaCorta(x.salida) : '—'} · Llegada{' '}
                          {x.llegada ? fmtFechaCorta(x.llegada) : '—'} · Recibido{' '}
                          {x.recepcion ? fmtFechaCorta(x.recepcion) : '—'}
                        </span>
                      </td>
                      <td>
                        <span className={cx('text-sm', x.retraso && !x.recepcion ? 'font-bold text-rojo-700' : 'text-ink')}>
                          {transitoWh(x)}
                        </span>
                        <span className="block text-xs text-ink-3">{x.origen} → Warehouse</span>
                      </td>
                      <td>{x.incoterm}</td>
                      <td>
                        <Chip estado={est} />
                        {disponible && (
                          <span className="mt-1 block text-3xs font-semibold text-teal-700">Disponible para consolidar</span>
                        )}
                      </td>
                      <td>
                        <div className="flex justify-end gap-1.5">
                          <Button size="sm" onClick={() => abrirEstado(x)}>
                            Actualizar estado
                          </Button>
                          <Button size="sm" onClick={() => setModal({ ref: x.ref, modo: 'transito' })}>
                            <LuRoute size={12} /> Ver tránsito
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </PanelPlegable>

        {/* ------------------------- motor de consolidación ------------------------ */}
        <div className="panel">
          <div className="panel-head">
            <span className="panel-title">
              <LuSparkles size={14} /> Motor de consolidación
            </span>
          </div>
          <div className="flex flex-col gap-3 p-4">
            <p className="m-0 rounded-sm border border-line bg-surface-2 px-3 py-2.5 text-sm text-ink-2">
              <b className="text-ink">Propuesta automática:</b> el sistema busca mercancías disponibles que compartan
              condiciones compatibles.
            </p>
            <div>
              <div className="lbl mb-1.5">Reglas activas</div>
              <ul className="m-0 flex list-none flex-col gap-1 p-0 text-sm text-ink-2">
                {REGLAS.map((r) => (
                  <li key={r} className="flex items-center gap-2">
                    <LuCircleCheck size={13} className="shrink-0 text-teal-600" /> {r}
                  </li>
                ))}
              </ul>
            </div>
            <Button variant="primary" block onClick={analizar}>
              <LuSparkles size={14} /> Analizar oportunidades
            </Button>

            {propuesta && propuesta.length === 0 && (
              <p className="m-0 text-sm text-ink-3">No hay suficiente mercancía disponible para una propuesta.</p>
            )}
            {propuesta && propuesta.length > 0 && (
              <div className="flex flex-col gap-2 rounded-sm border border-teal-100 bg-teal-50 p-3 text-sm">
                <b className="text-teal-700">Propuesta automática encontrada</b>
                <ul className="m-0 flex list-none flex-col gap-0.5 p-0 text-ink-2">
                  {propuesta.map((x) => (
                    <li key={x.ref}>
                      <b className="num text-ink">{x.oc}</b> · {x.sku.split(' · ')[0]}
                    </li>
                  ))}
                </ul>
                <span className="text-xs text-ink-3">Criterio: disponibilidad + ventana logística compatible</span>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => {
                    setMarcados(new Set(propuesta.map((x) => x.ref)))
                    setPropuesta(null)
                    avisar('Propuesta aceptada. Mercancía seleccionada.', 'ok')
                  }}
                >
                  Aceptar propuesta
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ------------------- preparar salida: el paso 4 con las REF. WH ------------------- */}
      <Modal
        open={!!preparando}
        onClose={() => setPreparando(null)}
        size="xl"
        flush
        eyebrow={preparando ? `Salida consolidada · ${preparando.length} REF. WH` : ''}
        title="Preparar salida · Shipping Instruction"
      >
        {preparando && (
          <Gestiones
            items={preparando}
            onProcesado={(refs) => {
              refs.forEach((r) =>
                actualizarWarehouse(r.despacho.id, {}, {
                  evento: 'Instrucción de salida creada',
                  detalle: `${refs.length} REF. WH consolidadas`,
                }),
              )
              crearSalidaWh(refs)
              setMarcados(new Set())
              setPreparando(null)
            }}
          />
        )}
      </Modal>

      {/* ---------------------- actualizar estado / ver tránsito ---------------------- */}
      <Modal
        open={!!abierto}
        onClose={() => setModal(null)}
        size="md"
        eyebrow={abierto ? `${abierto.oc} · ${abierto.sku}` : ''}
        title={abierto ? `${modal.modo === 'estado' ? 'Actualizar estado' : 'Monitoreo de tránsito'} · ${abierto.ref}` : ''}
        footer={
          modal?.modo === 'estado' ? (
            <>
              <span className="min-w-0 flex-1" />
              <Button variant="quiet" onClick={() => setModal(null)}>
                Cancelar
              </Button>
              <Button variant="primary" onClick={guardarEstado}>
                Guardar estado y fechas
              </Button>
            </>
          ) : (
            <>
              <span className="min-w-0 flex-1 text-sm text-ink-2">
                <LuMapPin size={13} className="mr-1 inline" /> GPS {abierto?.gps}
              </span>
              <Button variant="quiet" onClick={() => setModal(null)}>
                Cerrar
              </Button>
            </>
          )
        }
      >
        {abierto && modal.modo === 'estado' && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2 text-sm text-ink-2">
              Estado actual: <Chip estado={estadoWh(abierto)} />
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {[
                ['salida', 'Salida origen / inicio tránsito'],
                ['llegada', 'Llegada a Warehouse'],
                ['recepcion', 'Fecha de recepción'],
              ].map(([k, rotulo]) => (
                <Field key={k} label={rotulo}>
                  <Input
                    date
                    type="date"
                    value={fechas[k]}
                    onChange={(e) => setFechas((f) => ({ ...f, [k]: e.target.value }))}
                  />
                </Field>
              ))}
            </div>
            <p className="m-0 rounded-sm border border-line bg-surface-2 px-3 py-2.5 text-sm text-ink-2">
              El estado sale del último hito con fecha: <b className="text-ink">En tránsito → Llegada Warehouse → Recibido</b>.
              Al registrar la recepción, el envío queda disponible para consolidar.
            </p>
          </div>
        )}

        {abierto && modal.modo === 'transito' && (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
              <Dato rotulo="Referencia">{abierto.ref}</Dato>
              <Dato rotulo="OC">{abierto.oc}</Dato>
              <Dato rotulo="Proveedor">{abierto.proveedor}</Dato>
              <Dato rotulo="SKU">{abierto.sku}</Dato>
              <Dato rotulo="Origen">{abierto.origen}</Dato>
              <Dato rotulo="Salida">{abierto.salida ? fmtFechaCorta(abierto.salida) : '—'}</Dato>
              <Dato rotulo="ETA Warehouse">{fmtFechaCorta(abierto.eta)}</Dato>
              <Dato rotulo="GPS">{abierto.gps}</Dato>
            </div>

            <div
              className={cx(
                'flex items-start gap-2.5 rounded-sm border px-3 py-2.5 text-sm',
                abierto.retraso && !abierto.recepcion
                  ? 'border-rojo-100 bg-rojo-50 text-rojo-700'
                  : 'border-teal-100 bg-teal-50 text-teal-700',
              )}
            >
              {abierto.retraso && !abierto.recepcion ? (
                <>
                  <LuTriangleAlert size={15} className="mt-px shrink-0" />
                  <span>
                    <b>Envío retrasado.</b> El ETA presenta una desviación y requiere seguimiento.
                  </span>
                </>
              ) : (
                <>
                  <LuCircleCheck size={15} className="mt-px shrink-0" />
                  <span>
                    <b>Envío en tiempo.</b> La proyección se mantiene dentro de la ventana planificada.
                  </span>
                </>
              )}
            </div>

            <div className="panel p-4">
              <Linea
                actual={pasoDe(abierto)}
                retraso={abierto.retraso && !abierto.recepcion}
                notas={[
                  'Confirmado',
                  abierto.salida ? fmtFechaCorta(abierto.salida) : 'Pendiente',
                  transitoWh(abierto),
                  fmtFechaCorta(abierto.llegada || abierto.eta),
                  esDisponible(abierto) ? 'Listo' : 'Pendiente',
                ]}
              />
            </div>

            {abierto.traza.length > 0 && (
              <div>
                <div className="lbl mb-2">Bitácora</div>
                <ul className="m-0 flex list-none flex-col gap-1.5 p-0 text-sm">
                  {abierto.traza.map((t, i) => (
                    <li key={i} className="flex flex-wrap gap-2">
                      <span className="num text-ink-3">{fmtFechaHora(t.fecha)}</span>
                      <b className="text-ink">{t.evento}</b>
                      <span className="text-ink-3">· {t.detalle}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </Modal>
    </>
  )
}
