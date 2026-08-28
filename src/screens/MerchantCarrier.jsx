import { useMemo, useState } from 'react'
import {
  LuCalendarClock,
  LuCircleCheck,
  LuFileDown,
  LuHandCoins,
  LuInbox,
  LuPackageCheck,
  LuPrinter,
  LuSearch,
  LuSearchX,
  LuSend,
  LuTriangleAlert,
  LuTruck,
} from 'react-icons/lu'
import Button, { cx } from '../components/ui/Button'
import { Input, Select } from '../components/ui/Field'
import Modal from '../components/ui/Modal'
import { Dato, Kpi } from '../components/ui/Valores'
import { useOc } from '../data/store'
import { ESTADOS_FINIQUITO, PASO_FINIQUITO, VENTANAS } from '../data/merchant'
import { bitacoraTransporte, construirMerchant } from '../lib/merchant'
import { construirEmbarques } from '../lib/torre'
import { fmtFecha, fmtFechaCorta, fmtFechaHora, fmtMoneda, toISO } from '../lib/fechas'

const SUBS = [
  { id: 'pre', rotulo: 'Pre-coordinación', icono: LuCalendarClock },
  { id: 'liberados', rotulo: 'Embarques liberados', icono: LuPackageCheck },
  { id: 'recibidas', rotulo: 'Coordinaciones recibidas', icono: LuInbox },
  { id: 'coordinados', rotulo: 'Embarques coordinados', icono: LuTruck },
  { id: 'entregados', rotulo: 'Embarques entregados', icono: LuHandCoins },
]

const TONO_RIESGO = { Alto: 'text-rojo-700', Medio: 'text-ambar-700', Bajo: 'text-teal-700' }

const TONO_COORDINACION = {
  'Por revisar': 'bg-ambar-50 text-ambar-700',
  'Enviada a Aduana': 'bg-navy-50 text-navy-700',
  Confirmado: 'bg-teal-50 text-teal-700',
}

const TONO_TRANSPORTE = {
  'Por asignar': 'bg-ambar-50 text-ambar-700',
  Asignado: 'bg-navy-50 text-navy-700',
  'En tránsito': 'bg-teal-50 text-teal-700',
  'Llegada a planta': 'bg-teal-50 text-teal-700',
  Descargado: 'bg-surface-3 text-ink-2',
  'Vacío entregado': 'bg-surface-3 text-ink-2',
}

const TONO_FINIQUITO = {
  'En validación de costos': 'bg-surface-3 text-ink-2',
  'Pendiente de aprobación': 'bg-ambar-50 text-ambar-700',
  'Pendiente de pago': 'bg-navy-50 text-navy-700',
  Pagado: 'bg-teal-50 text-teal-700',
  Finalizado: 'bg-teal-50 text-teal-700',
}

const TONO_ETAPA = {
  Completado: 'bg-teal-600 text-white',
  'En curso': 'bg-navy-800 text-white ring-4 ring-navy-100',
  Pendiente: 'bg-surface-3 text-ink-3',
}

function Chip({ tono, children }) {
  return (
    <span
      className={cx(
        'inline-block whitespace-nowrap rounded-full px-2.5 py-[3px] text-xs font-semibold',
        tono ?? 'bg-surface-3 text-ink-2',
      )}
    >
      {children}
    </span>
  )
}

/** Barra de avance del trámite: es el "% liberado" de la pre-coordinación. */
function Barra({ pct }) {
  const tono = pct >= 80 ? 'bg-teal-600' : pct >= 50 ? 'bg-ambar-500' : 'bg-rojo-600'
  return (
    <span className="flex items-center gap-2">
      <span className="h-[5px] w-[70px] overflow-hidden rounded-full bg-surface-3">
        <span className={cx('block h-full', tono)} style={{ width: `${pct}%` }} />
      </span>
      <span className="num text-xs text-ink-3">{pct}%</span>
    </span>
  )
}

function Vacio({ children, cols }) {
  return (
    <tr>
      <td colSpan={cols} className="h-[130px]! bg-surface text-center text-sm text-ink-3">
        {children}
      </td>
    </tr>
  )
}

/** La bitácora de transporte: riel de ocho etapas + el detalle en tabla. */
function Bitacora({ etapas }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex overflow-x-auto pb-1">
        {etapas.map((h, i) => (
          <div key={h.rotulo} className="relative min-w-[128px] shrink-0 text-center">
            {i < etapas.length - 1 && (
              <span
                className={cx(
                  'absolute left-[calc(50%+16px)] top-[13px] h-0.5 w-[calc(100%-32px)]',
                  h.estado === 'Completado' ? 'bg-teal-600' : 'bg-line',
                )}
              />
            )}
            <span
              className={cx(
                'relative z-[1] mx-auto mb-2 grid h-7 w-7 place-items-center rounded-full text-xs font-bold',
                TONO_ETAPA[h.estado],
              )}
            >
              {h.estado === 'Completado' ? '✓' : i + 1}
            </span>
            <div className="px-1.5 text-xs leading-tight font-semibold text-navy-800">{h.rotulo}</div>
            <div className="num text-xs text-ink-3">{h.fecha ? fmtFechaHora(h.fecha) : '—'}</div>
          </div>
        ))}
      </div>

      <div className="panel tabla-scroll">
        <table className="tbl">
          <thead>
            <tr>
              <th className="w-[220px]">Etapa</th>
              <th className="w-[120px]">Fecha / hora</th>
              <th className="w-[170px]">Responsable</th>
              <th className="w-[110px]">Estado</th>
              <th className="min-w-[220px]">Observación</th>
            </tr>
          </thead>
          <tbody>
            {etapas.map((h) => (
              <tr key={h.rotulo}>
                <td className="cell-strong">{h.rotulo}</td>
                <td className="num">{h.fecha ? fmtFechaHora(h.fecha) : '—'}</td>
                <td>{h.responsable}</td>
                <td>
                  <Chip
                    tono={
                      h.estado === 'Completado'
                        ? 'bg-teal-50 text-teal-700'
                        : h.estado === 'En curso'
                          ? 'bg-ambar-50 text-ambar-700'
                          : 'bg-surface-3 text-ink-2'
                    }
                  >
                    {h.estado}
                  </Chip>
                </td>
                <td>{h.observacion}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/**
 * Merchant / Carrier: coordinar la entrega antes de que la aduana libere, y
 * seguirla hasta el finiquito de los costos excedidos.
 */
export default function MerchantCarrier({ embarques: embarquesProp }) {
  const { ordenes, coordinaciones, coordinarEntrega, finiquitos, avanzarFiniquito, avisar } = useOc()
  const [sub, setSub] = useState('pre')
  const [q, setQ] = useState('')
  const [filtro, setFiltro] = useState('')
  const [coordinando, setCoordinando] = useState(null)
  const [fecha, setFecha] = useState('')
  const [ventana, setVentana] = useState(VENTANAS[1])
  const [transporte, setTransporte] = useState(null)
  const [finiquito, setFiniquito] = useState(null)

  // La torre ya los tiene armados y los pasa; en su ruta propia se arman acá.
  const embarques = useMemo(
    () => embarquesProp ?? construirEmbarques(ordenes),
    [embarquesProp, ordenes],
  )
  const vistas = useMemo(
    () => construirMerchant(embarques, coordinaciones, finiquitos),
    [embarques, coordinaciones, finiquitos],
  )

  const filas = vistas[sub === 'pre' ? 'precoordinacion' : sub]

  const filtradas = useMemo(() => {
    const t = q.toLowerCase().trim()
    return filas.filter((f) => {
      if (filtro && sub === 'entregados' && f.estatus !== filtro) return false
      if (filtro && sub !== 'entregados' && f.riesgo !== filtro) return false
      if (!t) return true
      return `${f.embarque.id} ${f.cuenta} ${f.sku} ${f.destino} ${f.aduana}`.toLowerCase().includes(t)
    })
  }, [filas, q, filtro, sub])

  const cambiarSub = (id) => {
    setSub(id)
    setQ('')
    setFiltro('')
  }

  // Pre-coordinar y coordinar la entrega son la misma acción: poner fecha y
  // ventana. Cambia solo desde dónde se abre y qué texto acompaña.
  const abrirCoordinacion = (f, modo) => {
    setCoordinando({ ...f, modo })
    setFecha(toISO(f.coordinacion?.fecha ?? f.embarque.planta))
    setVentana(f.coordinacion?.ventana ?? VENTANAS[1])
  }

  const registrar = () => {
    if (!fecha) {
      avisar('Elija la fecha de recepción antes de registrar.', 'rojo')
      return
    }
    coordinarEntrega(coordinando.clave, {
      fecha,
      ventana,
      estado: 'Por revisar',
      origen: coordinando.modo === 'pre' ? 'Pre-coordinación' : 'Embarque liberado',
    })
    avisar(`Coordinación registrada para ${coordinando.embarque.id}; queda por revisar.`)
    setCoordinando(null)
  }

  const dirigirAduana = (f) => {
    coordinarEntrega(f.clave, { ...f.coordinacion, fecha: toISO(f.coordinacion.fecha), estado: 'Enviada a Aduana' })
    avisar(`Solicitud de ${f.embarque.id} dirigida a Aduana para reservar la salida.`)
  }

  const paso = finiquito && PASO_FINIQUITO[finiquito.estatus]

  const avanzar = () => {
    avanzarFiniquito(finiquito.clave, paso.siguiente)
    avisar(`${paso.aviso} · ${finiquito.embarque.id}.`)
    setFiniquito(null)
  }

  const kpis = {
    pre: [
      ['En pre-coordinación', vistas.precoordinacion.length],
      ['Trámite sobre 60%', vistas.precoordinacion.filter((f) => f.pct >= 60).length, 'border-teal-100 bg-teal-50'],
      ['Con costos abiertos', vistas.precoordinacion.filter((f) => f.embarque.delay > 0).length, 'border-rojo-100 bg-rojo-50'],
      ['Riesgo alto', vistas.precoordinacion.filter((f) => f.riesgo === 'Alto').length, 'border-ambar-100 bg-ambar-50'],
    ],
    liberados: [
      ['Liberados sin coordinar', vistas.liberados.length, 'border-ambar-100 bg-ambar-50'],
      ['Ya coordinados', vistas.coordinados.length, 'border-teal-100 bg-teal-50'],
      ['Con costos abiertos', vistas.liberados.filter((f) => f.embarque.delay > 0).length, 'border-rojo-100 bg-rojo-50'],
      ['Riesgo alto', vistas.liberados.filter((f) => f.riesgo === 'Alto').length],
    ],
    recibidas: [
      ['Por revisar', vistas.recibidas.length, 'border-ambar-100 bg-ambar-50'],
      ['Enviadas a Aduana', vistas.coordinados.filter((f) => f.coordinacion.estado === 'Enviada a Aduana').length],
      ['Confirmadas', vistas.coordinados.filter((f) => f.coordinacion.estado === 'Confirmado').length, 'border-teal-100 bg-teal-50'],
      ['Riesgo alto', vistas.recibidas.filter((f) => f.riesgo === 'Alto').length, 'border-rojo-100 bg-rojo-50'],
    ],
    coordinados: [
      ['Embarques coordinados', vistas.coordinados.length, 'border-teal-100 bg-teal-50'],
      ['Transporte asignado', vistas.coordinados.filter((f) => f.estadoTransporte !== 'Por asignar').length],
      ['Por asignar', vistas.coordinados.filter((f) => f.estadoTransporte === 'Por asignar').length, 'border-ambar-100 bg-ambar-50'],
      ['En tránsito', vistas.coordinados.filter((f) => f.estadoTransporte === 'En tránsito').length],
      ['Con riesgo', vistas.coordinados.filter((f) => f.riesgo !== 'Bajo').length, 'border-rojo-100 bg-rojo-50'],
    ],
    entregados: [
      ['Embarques entregados', vistas.entregados.length],
      ['Por finiquitar', vistas.entregados.filter((f) => f.estatus !== 'Finalizado').length, 'border-ambar-100 bg-ambar-50'],
      ['Con costos excedidos', vistas.entregados.filter((f) => f.costos.length > 0).length, 'border-rojo-100 bg-rojo-50'],
      ['Total en seguimiento', fmtMoneda(vistas.entregados.filter((f) => f.estatus !== 'Finalizado').reduce((a, f) => a + f.total, 0))],
      ['Finalizados', vistas.entregados.filter((f) => f.estatus === 'Finalizado').length, 'border-teal-100 bg-teal-50'],
    ],
  }[sub]

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="m-0 text-lg font-bold text-navy-800">Merchant / Carrier · coordinación de entrega</h2>
          <p className="m-0 text-sm text-ink-3">
            El Merchant pide la fecha de recepción antes de que la aduana libere; el Carrier asigna la
            unidad y ejecuta. El embarque no se cierra hasta finiquitar sus costos excedidos.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => avisar('Exportación de coordinación generada (demo).')}>
            <LuFileDown size={14} /> Exportar
          </Button>
          <Button size="sm" variant="primary" onClick={() => avisar('Informe de coordinación enviado (demo).')}>
            <LuPrinter size={14} /> Informe
          </Button>
        </div>
      </div>

      {/* Las cinco etapas del proceso, en orden: son el eje de la pantalla. */}
      <div className="flex flex-wrap gap-1.5 border-b border-line pb-3">
        {SUBS.map(({ id, rotulo, icono: Icono }) => {
          const activo = sub === id
          const n = vistas[id === 'pre' ? 'precoordinacion' : id].length
          return (
            <button
              key={id}
              onClick={() => cambiarSub(id)}
              className={cx(
                'inline-flex items-center gap-2 rounded-sm border px-3 py-2 text-sm transition-colors duration-100',
                activo
                  ? 'border-navy-800 bg-navy-800 font-semibold text-white'
                  : 'border-line bg-surface text-ink-2 hover:border-navy-400 hover:text-ink',
              )}
            >
              <Icono size={13} className={activo ? 'text-white/75' : 'text-ink-4'} />
              {rotulo}
              <span
                className={cx(
                  'num rounded-full px-1.5 text-xs font-bold',
                  activo ? 'bg-white/20 text-white' : 'bg-surface-3 text-ink-3',
                )}
              >
                {n}
              </span>
            </button>
          )
        })}
      </div>

      <div className="flex flex-wrap gap-2">
        {kpis.map(([rotulo, valor, tono]) => (
          <Kpi key={rotulo} rotulo={rotulo} valor={valor} tono={tono} />
        ))}
      </div>

      <div className="panel">
        <div className="panel-head flex-wrap">
          <span className="panel-title">{SUBS.find((x) => x.id === sub).rotulo}</span>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <Select
              placeholder={sub === 'entregados' ? 'Todos los estatus' : 'Todos los riesgos'}
              options={sub === 'entregados' ? ESTADOS_FINIQUITO : ['Alto', 'Medio', 'Bajo']}
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              className={sub === 'entregados' ? 'w-[230px]' : 'w-[160px]'}
            />
            <div className="relative flex items-center">
              <LuSearch size={13} className="pointer-events-none absolute left-2.5 text-ink-4" />
              <input
                className="inp w-[250px] pl-7"
                placeholder="Buscar embarque, SKU, cuenta, destino…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
            {(q || filtro) && (
              <Button
                size="sm"
                onClick={() => {
                  setQ('')
                  setFiltro('')
                }}
              >
                <LuSearchX size={14} /> Limpiar
              </Button>
            )}
          </div>
        </div>

        <div className="tabla-scroll">
          {/* ---------------------------- PRE-COORDINACIÓN ---------------------------- */}
          {sub === 'pre' && (
            <table className="tbl">
              <thead>
                <tr>
                  <th className="w-[150px]">Embarque</th>
                  <th className="w-[170px]">Cuenta</th>
                  <th className="min-w-[190px]">SKU</th>
                  <th className="w-[120px]">Cantidad</th>
                  <th className="w-[170px]">Aduana</th>
                  <th className="w-[170px]">Entrega</th>
                  <th className="w-[130px]">Liberación aprox.</th>
                  <th className="w-[130px]">% liberado</th>
                  <th className="w-[110px]">Costos</th>
                  <th className="w-[90px]">Riesgo</th>
                  <th className="w-[140px]">Acción</th>
                </tr>
              </thead>
              <tbody>
                {filtradas.length === 0 && (
                  <Vacio cols={11}>Ningún embarque pendiente de pre-coordinar con estos filtros.</Vacio>
                )}
                {filtradas.map((f) => (
                  <tr key={f.clave}>
                    <td className="cell-key">{f.embarque.id}</td>
                    <td className="cell-cut" title={f.cuenta}>
                      {f.cuenta}
                    </td>
                    <td className="cell-cut" title={f.sku}>
                      {f.sku}
                    </td>
                    <td className="num">{f.cantidad}</td>
                    <td className="cell-cut" title={f.aduana}>
                      {f.aduana}
                    </td>
                    <td className="cell-cut" title={f.destino}>
                      {f.destino}
                    </td>
                    <td className="num">{fmtFechaCorta(f.liberacion)}</td>
                    <td>
                      <Barra pct={f.pct} />
                    </td>
                    <td className="num">{f.embarque.delay > 0 ? 'Abiertos' : '—'}</td>
                    <td className={cx('font-bold', TONO_RIESGO[f.riesgo])}>{f.riesgo}</td>
                    <td>
                      <Button size="sm" variant="primary" onClick={() => abrirCoordinacion(f, 'pre')}>
                        Pre-coordinar
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* ----------------------------- YA LIBERADOS ------------------------------ */}
          {sub === 'liberados' && (
            <table className="tbl">
              <thead>
                <tr>
                  <th className="w-[150px]">Embarque</th>
                  <th className="w-[170px]">Cuenta</th>
                  <th className="min-w-[190px]">SKU</th>
                  <th className="w-[170px]">Destino</th>
                  <th className="w-[130px]">Liberación</th>
                  <th className="w-[110px]">Costos</th>
                  <th className="w-[130px]">Estado</th>
                  <th className="w-[160px]">Acción</th>
                </tr>
              </thead>
              <tbody>
                {filtradas.length === 0 && (
                  <Vacio cols={8}>Ningún embarque liberado pendiente de coordinar.</Vacio>
                )}
                {filtradas.map((f) => (
                  <tr key={f.clave}>
                    <td className="cell-key">{f.embarque.id}</td>
                    <td className="cell-cut" title={f.cuenta}>
                      {f.cuenta}
                    </td>
                    <td className="cell-cut" title={f.sku}>
                      {f.sku}
                    </td>
                    <td className="cell-cut" title={f.destino}>
                      {f.destino}
                    </td>
                    <td className="num">{fmtFechaCorta(f.liberacion)}</td>
                    <td className="num">{f.embarque.delay > 0 ? 'Abiertos' : '—'}</td>
                    <td>
                      <Chip tono="bg-ambar-50 text-ambar-700">Sin coordinar</Chip>
                    </td>
                    <td>
                      <Button size="sm" variant="primary" onClick={() => abrirCoordinacion(f, 'entrega')}>
                        Coordinar entrega
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* -------------------------- SOLICITUDES RECIBIDAS ------------------------- */}
          {sub === 'recibidas' && (
            <table className="tbl">
              <thead>
                <tr>
                  <th className="w-[150px]">Embarque</th>
                  <th className="w-[170px]">Cliente</th>
                  <th className="w-[130px]">Fecha requerida</th>
                  <th className="w-[120px]">Ventana</th>
                  <th className="w-[170px]">Destino</th>
                  <th className="w-[150px]">Origen</th>
                  <th className="w-[90px]">Riesgo</th>
                  <th className="w-[190px]">Acción</th>
                </tr>
              </thead>
              <tbody>
                {filtradas.length === 0 && (
                  <Vacio cols={8}>
                    Acá caen las solicitudes que se registran en Pre-coordinación y en Embarques
                    liberados.
                  </Vacio>
                )}
                {filtradas.map((f) => (
                  <tr key={f.clave}>
                    <td className="cell-key">{f.embarque.id}</td>
                    <td className="cell-cut" title={f.cuenta}>
                      {f.cuenta}
                    </td>
                    <td className="num">{fmtFechaCorta(f.coordinacion.fecha)}</td>
                    <td className="num">{f.coordinacion.ventana}</td>
                    <td className="cell-cut" title={f.destino}>
                      {f.destino}
                    </td>
                    <td className="text-ink-3">{f.coordinacion.origen}</td>
                    <td className={cx('font-bold', TONO_RIESGO[f.riesgo])}>{f.riesgo}</td>
                    <td>
                      <Button size="sm" variant="primary" onClick={() => dirigirAduana(f)}>
                        <LuSend size={13} /> Dirigir a Aduana
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* --------------------------- YA COORDINADOS ------------------------------ */}
          {sub === 'coordinados' && (
            <table className="tbl">
              <thead>
                <tr>
                  <th className="w-[150px]">Embarque</th>
                  <th className="w-[170px]">Cuenta</th>
                  <th className="min-w-[170px]">SKU / carga</th>
                  <th className="w-[170px]">Destino</th>
                  <th className="w-[120px]">Fecha entrega</th>
                  <th className="w-[110px]">Ventana</th>
                  <th className="w-[140px]">Coordinación</th>
                  <th className="w-[130px]">Transporte</th>
                  <th className="w-[90px]">Riesgo</th>
                  <th className="w-[120px]">Acción</th>
                </tr>
              </thead>
              <tbody>
                {filtradas.length === 0 && <Vacio cols={10}>Ninguna entrega programada con estos filtros.</Vacio>}
                {filtradas.map((f) => (
                  <tr key={f.clave}>
                    <td className="cell-key">{f.embarque.id}</td>
                    <td className="cell-cut" title={f.cuenta}>
                      {f.cuenta}
                    </td>
                    <td className="cell-cut" title={f.sku}>
                      {f.sku}
                    </td>
                    <td className="cell-cut" title={f.destino}>
                      {f.destino}
                    </td>
                    <td className="num cell-strong">{fmtFechaCorta(f.coordinacion.fecha)}</td>
                    <td className="num">{f.coordinacion.ventana}</td>
                    <td>
                      <Chip tono={TONO_COORDINACION[f.coordinacion.estado]}>{f.coordinacion.estado}</Chip>
                    </td>
                    <td>
                      <Chip tono={TONO_TRANSPORTE[f.estadoTransporte]}>{f.estadoTransporte}</Chip>
                    </td>
                    <td className={cx('font-bold', TONO_RIESGO[f.riesgo])}>{f.riesgo}</td>
                    <td>
                      <Button size="sm" onClick={() => setTransporte(f)}>
                        <LuTruck size={13} /> Bitácora
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* ----------------------------- ENTREGADOS -------------------------------- */}
          {sub === 'entregados' && (
            <table className="tbl">
              <thead>
                <tr>
                  <th className="w-[150px]">Embarque</th>
                  <th className="w-[170px]">Cuenta</th>
                  <th className="w-[170px]">Destino</th>
                  <th className="w-[120px]">Fecha entrega</th>
                  <th className="min-w-[190px]">Costos excedidos</th>
                  <th className="w-[110px] text-right!">Total</th>
                  <th className="w-[190px]">Estatus finiquito</th>
                  <th className="w-[140px]">Retorno vacío</th>
                  <th className="w-[130px]">Acción</th>
                </tr>
              </thead>
              <tbody>
                {filtradas.length === 0 && <Vacio cols={9}>Ningún embarque entregado con estos filtros.</Vacio>}
                {filtradas.map((f) => (
                  <tr key={f.clave}>
                    <td className="cell-key">{f.embarque.id}</td>
                    <td className="cell-cut" title={f.cuenta}>
                      {f.cuenta}
                    </td>
                    <td className="cell-cut" title={f.destino}>
                      {f.destino}
                    </td>
                    <td className="num">{fmtFechaCorta(f.embarque.planta)}</td>
                    <td>
                      {f.costos.length === 0 ? (
                        <span className="text-ink-3">—</span>
                      ) : (
                        <span className="flex flex-wrap gap-1">
                          {f.costos.map((c) => (
                            <Chip key={c.tipo} tono="bg-rojo-50 text-rojo-700">
                              {c.tipo}
                            </Chip>
                          ))}
                        </span>
                      )}
                    </td>
                    <td className="cell-num font-bold text-navy-800">{fmtMoneda(f.total)}</td>
                    <td>
                      <Chip tono={TONO_FINIQUITO[f.estatus]}>{f.estatus}</Chip>
                    </td>
                    <td className="text-ink-3">{f.retorno}</td>
                    <td>
                      <Button size="sm" onClick={() => setFiniquito(f)}>
                        Ver costos
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* --------------------------- MODAL COORDINAR ----------------------------- */}
      <Modal
        open={!!coordinando}
        onClose={() => setCoordinando(null)}
        title={coordinando?.modo === 'pre' ? 'Pre-coordinar entrega' : 'Coordinar entrega'}
        eyebrow={coordinando ? `${coordinando.embarque.id} · ${coordinando.destino}` : ''}
        footer={
          <>
            <span className="min-w-0 flex-1 text-sm text-ink-2">
              La solicitud pasa a Coordinaciones recibidas para revisión.
            </span>
            <Button variant="quiet" onClick={() => setCoordinando(null)}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={registrar}>
              <LuCircleCheck size={14} /> Registrar coordinación
            </Button>
          </>
        }
      >
        {coordinando && (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <Dato rotulo="Embarque">{coordinando.embarque.id}</Dato>
              <Dato rotulo="Cuenta">{coordinando.cuenta}</Dato>
              <Dato rotulo="SKU">{coordinando.sku}</Dato>
              <Dato rotulo="Cantidad">{coordinando.cantidad}</Dato>
              <Dato rotulo="Aduana">{coordinando.aduana}</Dato>
              <Dato rotulo="Destino">{coordinando.destino}</Dato>
              <Dato rotulo="Liberación aproximada">{fmtFecha(coordinando.liberacion)}</Dato>
              <Dato rotulo="Riesgo">
                <span className={TONO_RIESGO[coordinando.riesgo]}>{coordinando.riesgo}</span>
              </Dato>
            </div>

            {coordinando.modo === 'pre' && (
              <div className="rounded-sm border border-navy-100 bg-navy-50 px-3 py-2 text-sm text-navy-700">
                El trámite en aduana va al <b className="num">{coordinando.pct}%</b>. Pre-coordinar
                ahora reserva la ventana antes de que el embarque quede liberado.
              </div>
            )}

            {coordinando.embarque.delay > 0 && (
              <div className="flex items-start gap-2 rounded-sm border border-rojo-100 bg-rojo-50 px-3 py-2 text-sm text-rojo-700">
                <LuTriangleAlert size={15} className="mt-px shrink-0" />
                <span>
                  El embarque acumula <b className="num">+{coordinando.embarque.delay} días</b> y tiene
                  costos abiertos. Considerarlos antes de comprometer la fecha.
                </span>
              </div>
            )}

            <div className="panel p-4">
              <div className="lbl mb-3">Fecha y ventana de recepción</div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="flex flex-col gap-1.5">
                  <span className="lbl">Fecha requerida</span>
                  <Input date type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="lbl">Ventana (4–5 horas)</span>
                  <Select options={VENTANAS} value={ventana} onChange={(e) => setVentana(e.target.value)} />
                </label>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {VENTANAS.map((v) => (
                  <button
                    key={v}
                    onClick={() => setVentana(v)}
                    className={cx(
                      'num rounded-sm border px-2.5 py-1 text-sm transition-colors duration-100',
                      v === ventana
                        ? 'border-navy-800 bg-navy-800 font-semibold text-white'
                        : 'border-line bg-surface text-ink-2 hover:border-navy-400',
                    )}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* --------------------------- MODAL TRANSPORTE ---------------------------- */}
      <Modal
        open={!!transporte}
        onClose={() => setTransporte(null)}
        size="xl"
        title="Asignación de transporte y bitácora"
        eyebrow={
          transporte
            ? `${transporte.embarque.id} · ${transporte.destino} · ${transporte.estadoTransporte}`
            : ''
        }
        footer={
          <>
            <span className="min-w-0 flex-1 text-sm text-ink-2">
              El avance sale del segmento del viaje: no se marca a mano.
            </span>
            <Button variant="quiet" onClick={() => setTransporte(null)}>
              Cerrar
            </Button>
          </>
        }
      >
        {transporte && (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
              <Dato rotulo="Transporte asignado">{transporte.transporte.tipo}</Dato>
              <Dato rotulo="Motorista">{transporte.transporte.motorista}</Dato>
              <Dato rotulo="Cabezal">{transporte.transporte.cabezal}</Dato>
              <Dato rotulo="ID de transporte">{transporte.transporte.id}</Dato>
              <Dato rotulo="Fecha de recepción">{fmtFecha(transporte.coordinacion.fecha)}</Dato>
              <Dato rotulo="Ventana">{transporte.coordinacion.ventana}</Dato>
              <Dato rotulo="Estado actual">{transporte.estadoTransporte}</Dato>
              <Dato rotulo="Riesgo">
                <span className={TONO_RIESGO[transporte.riesgo]}>{transporte.riesgo}</span>
              </Dato>
            </div>
            <Bitacora etapas={bitacoraTransporte(transporte.embarque, transporte.coordinacion)} />
          </div>
        )}
      </Modal>

      {/* ---------------------------- MODAL FINIQUITO ---------------------------- */}
      <Modal
        open={!!finiquito}
        onClose={() => setFiniquito(null)}
        size="lg"
        title="Finiquito del embarque"
        eyebrow={
          finiquito
            ? `${finiquito.embarque.id} · ${finiquito.destino} · entregado ${fmtFechaCorta(finiquito.embarque.planta)}`
            : ''
        }
        footer={
          <>
            <span className="min-w-0 flex-1 text-sm text-ink-2">
              El embarque sigue visible mientras tenga costos por validar, aprobar o pagar.
            </span>
            <Button variant="quiet" onClick={() => setFiniquito(null)}>
              Cerrar
            </Button>
            {paso && (
              <Button variant="primary" onClick={avanzar}>
                <LuCircleCheck size={14} /> {paso.rotulo}
              </Button>
            )}
          </>
        }
      >
        {finiquito && (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <Dato rotulo="Embarque">{finiquito.embarque.id}</Dato>
              <Dato rotulo="Cuenta">{finiquito.cuenta}</Dato>
              <Dato rotulo="Destino">{finiquito.destino}</Dato>
              <Dato rotulo="Fecha de entrega">{fmtFecha(finiquito.embarque.planta)}</Dato>
              <Dato rotulo="Retorno de vacío">{finiquito.retorno}</Dato>
              <Dato rotulo="Total de costos">{fmtMoneda(finiquito.total)}</Dato>
            </div>

            {finiquito.costos.length === 0 ? (
              <div className="rounded-sm border border-teal-100 bg-teal-50 px-3 py-2 text-sm text-teal-700">
                No hay costos excedidos asociados a este embarque; el finiquito ya está cerrado.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {finiquito.costos.map((c) => (
                  <div key={c.tipo} className="panel p-3">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="font-bold text-navy-800">{c.tipo}</span>
                      <b className="num font-bold text-rojo-700">{fmtMoneda(c.monto)}</b>
                    </div>
                    <div className="num mt-1 text-sm text-ink-3">
                      {c.dias} día(s) · {fmtMoneda(c.tarifa)} por día
                    </div>
                    <p className="mt-1 text-sm text-ink-2">{c.causa}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="rounded-sm border border-line bg-surface-2 px-3 py-2 text-sm text-ink-2">
              <b className="font-bold text-ink">Regla de permanencia:</b> validación de costos →
              aprobación del cliente → pago → finiquito. Al completar el pago el embarque pasa a
              Finalizado y deja de seguirse.
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
