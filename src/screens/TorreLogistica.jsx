import { useMemo, useState } from 'react'
import {
  LuCircleCheck,
  LuCircleDashed,
  LuClock,
  LuFileDown,
  LuLayoutDashboard,
  LuPackage,
  LuSearch,
  LuSearchX,
  LuShip,
  LuStamp,
  LuTriangleAlert,
  LuTruck,
  LuWarehouse,
} from 'react-icons/lu'
import Button, { cx } from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import { Select } from '../components/ui/Field'
import { BarrasH, BarrasV } from '../components/ui/Graficos'
import { Kpi } from '../components/ui/Valores'
import { useOc } from '../data/store'
import {
  BITACORA_ADUANA,
  BITACORA_PLANTA,
  EMBARQUES,
  ESTATUS,
  SITIOS,
  TRANSPORTES,
  TRAZABILIDAD,
} from '../data/embarquesLogistica'
import { fmtFecha, fmtNum } from '../lib/fechas'

const dinero = (n) => `$ ${fmtNum(n)}`

const TABS = [
  { id: 'dashboard', rotulo: 'Dashboard', icono: LuLayoutDashboard },
  { id: 'origen', rotulo: 'Embarques en origen', icono: LuPackage, estatus: 'En origen' },
  { id: 'internacional', rotulo: 'En tránsito internacional', icono: LuShip, estatus: 'En tránsito internacional' },
  { id: 'aduana', rotulo: 'En aduana', icono: LuStamp, estatus: 'En aduana' },
  { id: 'aPlanta', rotulo: 'En tránsito a planta', icono: LuTruck, estatus: 'En tránsito a planta' },
  { id: 'planta', rotulo: 'En planta', icono: LuWarehouse, estatus: 'En planta' },
  { id: 'alertados', rotulo: 'Embarques alertados', icono: LuTriangleAlert },
]

const TONO_ESTADO = {
  Completado: { chip: 'bg-teal-50 text-teal-700', icono: LuCircleCheck, color: 'text-teal-600' },
  'En proceso': { chip: 'bg-ambar-50 text-ambar-700', icono: LuClock, color: 'text-ambar-600' },
  'En curso': { chip: 'bg-ambar-50 text-ambar-700', icono: LuClock, color: 'text-ambar-600' },
  Pendiente: { chip: 'bg-navy-50 text-navy-700', icono: LuCircleDashed, color: 'text-ink-4' },
}

const TONO_HITO = { pasado: 'bg-teal-600', presente: 'bg-navy-600', futuro: 'bg-ink-4' }

function Pill({ tono, children }) {
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

function Progreso({ pct }) {
  return (
    <span className="flex items-center gap-2">
      <span className="h-1.5 w-[70px] shrink-0 overflow-hidden rounded-full bg-surface-3">
        <span className="block h-full rounded-full bg-teal-600" style={{ width: `${pct}%` }} />
      </span>
      <span className="num text-xs text-ink-3">{pct}%</span>
    </span>
  )
}

/** Tabla estándar de la pantalla: cabeceras + cuerpo con estado vacío. */
function Tabla({ columnas, filas, vacio, children }) {
  return (
    <div className="panel tabla-scroll">
      <table className="tbl">
        <thead>
          <tr>
            {columnas.map(([rotulo, ancho]) => (
              <th key={rotulo} className={ancho}>
                {rotulo}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filas.length === 0 && (
            <tr>
              <td colSpan={columnas.length} className="h-[140px]! bg-surface text-center text-sm text-ink-3">
                {vacio}
              </td>
            </tr>
          )}
          {filas.map(children)}
        </tbody>
      </table>
    </div>
  )
}

/** Contenido del modal: trazabilidad internacional o una de las dos bitácoras. */
function DetalleModal({ tipo, embarque: e }) {
  if (tipo === 'trazabilidad') {
    return (
      <div className="ml-2 border-l-2 border-navy-200 pl-4">
        {TRAZABILIDAD.map(([hito, titulo, nota]) => (
          <div key={titulo} className="relative pb-4 last:pb-0">
            <span
              className={cx(
                'absolute top-1 -left-[21px] h-[9px] w-[9px] rounded-full ring-3 ring-surface',
                TONO_HITO[hito],
              )}
            />
            <span className="block text-xs font-bold text-ink-3 capitalize">{hito}</span>
            <span className="block text-sm font-semibold text-ink">{titulo}</span>
            {nota && <span className="block text-xs text-ink-3">{nota}</span>}
          </div>
        ))}
      </div>
    )
  }

  const aduana = tipo === 'aduana'
  const filas = aduana ? BITACORA_ADUANA : BITACORA_PLANTA
  return (
    <div className="flex flex-col gap-3">
      <p className="m-0 text-sm text-ink-2">
        <b className="text-ink">Contenedor:</b> {e.contenedor} · <b className="text-ink">Proveedor:</b>{' '}
        {e.proveedor} · <b className="text-ink">SKU:</b> {e.sku}
      </p>
      <div className="tabla-scroll">
        <table className="tbl">
          <thead>
            <tr>
              <th className="w-8" />
              <th>{aduana ? 'Trámite aduanal' : 'Etapa / evento'}</th>
              <th>Fecha / hora</th>
              <th>{aduana ? 'Tiempo transcurrido' : 'Responsable'}</th>
              <th>Estado</th>
              {!aduana && <th>Comentarios</th>}
            </tr>
          </thead>
          <tbody>
            {filas.map((r) => {
              const estado = r[r.length - 1]
              const t = TONO_ESTADO[estado] ?? TONO_ESTADO.Pendiente
              const Icono = t.icono
              return (
                <tr key={r[0]}>
                  <td>
                    <Icono size={15} className={t.color} />
                  </td>
                  <td className="cell-strong">{r[0]}</td>
                  <td className="num text-sm">{aduana ? `${r[1]} · ${r[2]}` : r[1]}</td>
                  <td className="text-sm text-ink-2">{aduana ? r[3] : r[2]}</td>
                  <td>
                    <Pill tono={t.chip}>{estado}</Pill>
                  </td>
                  {!aduana && <td className="text-sm text-ink-3">{r[4]}</td>}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <p className="m-0 text-xs text-ink-4">
        {aduana
          ? 'Bitácora del trámite en la aduana de destino.'
          : 'Trazabilidad del segmento de la aduana a la planta.'}
      </p>
    </div>
  )
}

/** Torre de control logística end-to-end (vista del cliente). */
export default function TorreLogistica() {
  const { avisar } = useOc()
  const [tab, setTab] = useState('dashboard')
  const [sitio, setSitio] = useState('')
  const [transporte, setTransporte] = useState('')
  const [estatus, setEstatus] = useState('')
  const [q, setQ] = useState('')
  const [modal, setModal] = useState(null)

  const sucio = sitio || transporte || estatus || q

  const filtrados = useMemo(() => {
    const t = q.toLowerCase().trim()
    return EMBARQUES.filter(
      (e) =>
        (!sitio || e.destino === sitio) &&
        (!transporte || e.transporte === transporte) &&
        (!estatus || e.estatus === estatus) &&
        (!t || Object.values(e).some((v) => String(v).toLowerCase().includes(t))),
    )
  }, [sitio, transporte, estatus, q])

  const de = (nombre) => filtrados.filter((e) => e.estatus === nombre)

  const kpis = {
    total: filtrados.length,
    planta: de('En planta').length,
    transito: filtrados.filter((e) => e.estatus.includes('tránsito')).length,
    alertados: filtrados.filter((e) => e.alertaCosto).length,
  }

  const rutas = useMemo(() => {
    const m = new Map()
    filtrados.forEach((e) => m.set(e.ruta, (m.get(e.ruta) ?? 0) + 1))
    return [...m.entries()].sort((a, b) => b[1] - a[1])
  }, [filtrados])

  const porNaviera = useMemo(() => {
    const m = new Map()
    filtrados.forEach((e) => m.set(e.naviera, (m.get(e.naviera) ?? 0) + 1))
    return [...m.entries()].map(([clave, valor]) => ({ clave, valor })).sort((a, b) => b.valor - a.valor)
  }, [filtrados])

  const porModo = useMemo(
    () => TRANSPORTES.map((tp) => ({ clave: tp, valor: filtrados.filter((e) => e.transporte === tp).length })),
    [filtrados],
  )

  const limpiar = () => {
    setSitio('')
    setTransporte('')
    setEstatus('')
    setQ('')
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="m-0 text-lg font-bold text-navy-800">Torre de control logística</h2>
          <p className="m-0 text-sm text-ink-3">
            Visibilidad end-to-end de los {EMBARQUES.length} embarques: origen, tránsito, aduana,
            última milla y costos.
          </p>
        </div>
        <span className="rounded-full bg-teal-50 px-2.5 py-1 text-xs font-bold text-teal-700">
          Sistema en vivo
        </span>
      </div>

      {/* Nav como barra de tabs scrolleable en X */}
      <div className="tabbar">
        {TABS.map(({ id, rotulo, icono: Icono }) => {
          const activo = tab === id
          return (
            <button key={id} onClick={() => setTab(id)} className={cx('tab', activo && 'tab-on')}>
              <Icono size={14} className={activo ? 'text-navy-700' : 'text-ink-4'} />
              {rotulo}
            </button>
          )
        })}
      </div>

      {/* Filtros: siempre arriba, aplican a todas las vistas */}
      <div className="panel flex flex-wrap items-center gap-2 p-3">
        <Select
          placeholder="Todos los sitios"
          options={SITIOS}
          value={sitio}
          onChange={(e) => setSitio(e.target.value)}
          className="w-[170px]"
        />
        <Select
          placeholder="Todos los transportes"
          options={TRANSPORTES}
          value={transporte}
          onChange={(e) => setTransporte(e.target.value)}
          className="w-[180px]"
        />
        <Select
          placeholder="Todos los estatus"
          options={ESTATUS}
          value={estatus}
          onChange={(e) => setEstatus(e.target.value)}
          className="w-[200px]"
        />
        <div className="relative flex items-center">
          <LuSearch size={13} className="pointer-events-none absolute left-2.5 text-ink-4" />
          <input
            className="inp w-[230px] pl-7"
            placeholder="Buscar REF, OC, SKU, contenedor…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        {sucio && (
          <Button size="sm" onClick={limpiar}>
            <LuSearchX size={14} /> Limpiar
          </Button>
        )}
        <span className="num ml-auto rounded-full bg-surface-3 px-2.5 py-[3px] text-xs font-bold text-ink-2">
          {filtrados.length} embarques
        </span>
      </div>

      {/* ------------------------------ DASHBOARD ------------------------------ */}
      {tab === 'dashboard' && (
        <>
          <div className="flex flex-wrap gap-2">
            <Kpi rotulo="Total embarques" valor={kpis.total} />
            <Kpi rotulo="En planta" valor={kpis.planta} tono="border-teal-100 bg-teal-50" />
            <Kpi rotulo="En tránsito" valor={kpis.transito} tono="border-ambar-100 bg-ambar-50" />
            <Kpi rotulo="Alertados" valor={kpis.alertados} tono="border-rojo-100 bg-rojo-50" />
          </div>

          <div className="panel">
            <div className="panel-head">
              <span className="panel-title">Resumen de rutas activas</span>
              <span className="ml-auto text-sm text-ink-3">distribución por trayecto</span>
            </div>
            <div className="flex flex-col gap-2.5 p-4">
              {rutas.length === 0 && <span className="text-sm text-ink-3">Sin embarques con estos filtros.</span>}
              {rutas.map(([ruta, n]) => (
                <div key={ruta}>
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="font-medium text-ink">{ruta}</span>
                    <b className="num shrink-0 font-bold text-navy-800">{n} embarques</b>
                  </div>
                  <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-surface-3">
                    <span
                      className="block h-full rounded-full bg-navy-600"
                      style={{ width: `${(n / filtrados.length) * 100}%` }}
                    />
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="panel">
              <div className="panel-head">
                <span className="panel-title">Visibilidad por naviera / operador</span>
              </div>
              <div className="p-4">
                <BarrasH datos={porNaviera} />
              </div>
            </div>
            <div className="panel">
              <div className="panel-head">
                <span className="panel-title">Estatus por modo de transporte</span>
              </div>
              <div className="p-4">
                <BarrasV datos={porModo} />
              </div>
            </div>
          </div>

          <Tabla
            columnas={[
              ['REF', 'w-[100px]'],
              ['OC', 'w-[110px]'],
              ['SKU', 'w-[110px]'],
              ['Contenedor / unidad', 'w-[150px]'],
              ['Proveedor', 'w-[150px]'],
              ['Transporte', 'w-[110px]'],
              ['Planta destino', 'w-[140px]'],
              ['Estatus', 'w-[190px]'],
              ['Alerta', 'w-[90px]'],
            ]}
            filas={filtrados}
            vacio="Sin embarques con estos filtros."
          >
            {(e) => (
              <tr key={e.id}>
                <td className="cell-key">{e.id}</td>
                <td className="num">{e.oc}</td>
                <td className="num">{e.sku}</td>
                <td className="num">{e.contenedor}</td>
                <td>{e.proveedor}</td>
                <td>{e.transporte}</td>
                <td>{e.destino}</td>
                <td className="cell-strong">{e.estatus}</td>
                <td>
                  <Pill tono={e.alertaCosto ? 'bg-rojo-50 text-rojo-700' : 'bg-teal-50 text-teal-700'}>
                    {e.alertaCosto ? 'Alerta' : 'OK'}
                  </Pill>
                </td>
              </tr>
            )}
          </Tabla>
        </>
      )}

      {/* ------------------------------- ORIGEN ------------------------------- */}
      {tab === 'origen' && (
        <Tabla
          columnas={[
            ['REF', 'w-[100px]'],
            ['OC', 'w-[110px]'],
            ['SKU', 'w-[110px]'],
            ['Contenedor', 'w-[150px]'],
            ['Proveedor', 'w-[150px]'],
            ['Segmento ETD', 'w-[120px]'],
            ['Estatus técnico logístico', 'min-w-[260px]'],
          ]}
          filas={de('En origen')}
          vacio="Ningún embarque en origen."
        >
          {(e) => (
            <tr key={e.id}>
              <td className="cell-key">{e.id}</td>
              <td className="num">{e.oc}</td>
              <td className="num">{e.sku}</td>
              <td className="num">{e.contenedor}</td>
              <td>{e.proveedor}</td>
              <td className="num">{fmtFecha(e.etd)}</td>
              <td>
                <Pill tono="bg-ambar-50 text-ambar-700">{e.estadoOrigen}</Pill>
              </td>
            </tr>
          )}
        </Tabla>
      )}

      {/* -------------------------- INTERNACIONAL --------------------------- */}
      {tab === 'internacional' && (
        <Tabla
          columnas={[
            ['REF', 'w-[100px]'],
            ['SKU', 'w-[110px]'],
            ['Contenedor', 'w-[150px]'],
            ['ETD', 'w-[110px]'],
            ['ETA aduana', 'w-[110px]'],
            ['ETA planta', 'w-[110px]'],
            ['Ubicación actual', 'min-w-[210px]'],
            ['', 'w-[130px]'],
          ]}
          filas={de('En tránsito internacional')}
          vacio="Ningún embarque en tránsito internacional."
        >
          {(e) => (
            <tr key={e.id}>
              <td className="cell-key">{e.id}</td>
              <td className="num">{e.sku}</td>
              <td className="num">{e.contenedor}</td>
              <td className="num">{fmtFecha(e.etd)}</td>
              <td className="num">{fmtFecha(e.etaAduana)}</td>
              <td className="num">{fmtFecha(e.etaPlanta)}</td>
              <td>{e.geo}</td>
              <td>
                <Button size="sm" onClick={() => setModal({ tipo: 'trazabilidad', embarque: e })}>
                  Trazabilidad
                </Button>
              </td>
            </tr>
          )}
        </Tabla>
      )}

      {/* ------------------------------- ADUANA ----------------------------- */}
      {tab === 'aduana' && (
        <Tabla
          columnas={[
            ['REF', 'w-[100px]'],
            ['Proveedor', 'w-[140px]'],
            ['SKU', 'w-[110px]'],
            ['Contenedor', 'w-[150px]'],
            ['Estatus aduana', 'min-w-[200px]'],
            ['Avance importación', 'w-[150px]'],
            ['Proyección despacho', 'w-[140px]'],
            ['Alerta costos', 'w-[120px]'],
            ['', 'w-[120px]'],
          ]}
          filas={de('En aduana')}
          vacio="Ningún embarque en aduana."
        >
          {(e) => (
            <tr key={e.id}>
              <td className="cell-key">{e.id}</td>
              <td>{e.proveedor}</td>
              <td className="num">{e.sku}</td>
              <td className="num">{e.contenedor}</td>
              <td>{e.estatusAduana}</td>
              <td>
                <Progreso pct={e.avanceAduana} />
              </td>
              <td className="num">{fmtFecha(e.proyeccionDespacho)}</td>
              <td>
                <Pill tono={e.alertaCosto ? 'bg-rojo-50 text-rojo-700' : 'bg-teal-50 text-teal-700'}>
                  {e.alertaCosto ? 'Alerta costos' : 'Sin extra'}
                </Pill>
              </td>
              <td>
                <Button size="sm" onClick={() => setModal({ tipo: 'aduana', embarque: e })}>
                  Ver bitácora
                </Button>
              </td>
            </tr>
          )}
        </Tabla>
      )}

      {/* ---------------------------- A PLANTA ------------------------------ */}
      {tab === 'aPlanta' && (
        <Tabla
          columnas={[
            ['REF', 'w-[100px]'],
            ['SKU', 'w-[110px]'],
            ['Contenedor', 'w-[150px]'],
            ['Transportista', 'w-[170px]'],
            ['Asignación', 'w-[160px]'],
            ['Estado tránsito', 'w-[140px]'],
            ['', 'w-[120px]'],
          ]}
          filas={de('En tránsito a planta')}
          vacio="Ningún embarque en tránsito a planta."
        >
          {(e) => (
            <tr key={e.id}>
              <td className="cell-key">{e.id}</td>
              <td className="num">{e.sku}</td>
              <td className="num">{e.contenedor}</td>
              <td>Transportes Hondureños</td>
              <td>Asignado · Unidad #402</td>
              <td className="cell-strong">En ruta final</td>
              <td>
                <Button size="sm" onClick={() => setModal({ tipo: 'aPlanta', embarque: e })}>
                  Ver bitácora
                </Button>
              </td>
            </tr>
          )}
        </Tabla>
      )}

      {/* ------------------------------- PLANTA ----------------------------- */}
      {tab === 'planta' && (
        <Tabla
          columnas={[
            ['REF', 'w-[100px]'],
            ['SKU', 'w-[110px]'],
            ['Contenedor', 'w-[150px]'],
            ['Proveedor', 'w-[150px]'],
            ['Planta', 'w-[140px]'],
            ['Hora llegada', 'w-[110px]'],
            ['Estatus recepción', 'w-[150px]'],
            ['Salida proyectada', 'w-[140px]'],
          ]}
          filas={de('En planta')}
          vacio="Ningún embarque en planta."
        >
          {(e) => (
            <tr key={e.id}>
              <td className="cell-key">{e.id}</td>
              <td className="num">{e.sku}</td>
              <td className="num">{e.contenedor}</td>
              <td>{e.proveedor}</td>
              <td>{e.destino}</td>
              <td className="num">{e.llegadaPlanta}</td>
              <td>
                <Pill tono="bg-teal-50 text-teal-700">Descargando</Pill>
              </td>
              <td className="num">{e.salidaProyectada}</td>
            </tr>
          )}
        </Tabla>
      )}

      {/* ----------------------------- ALERTADOS ---------------------------- */}
      {tab === 'alertados' && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="m-0 text-sm text-ink-3">
              Matriz de costos, proyección e instrucción operativa por embarque alertado.
            </p>
            <Button size="sm" onClick={() => avisar('Matriz de costos exportada (demo).')}>
              <LuFileDown size={14} /> Exportar
            </Button>
          </div>
          <Tabla
            columnas={[
              ['REF', 'w-[100px]'],
              ['Proveedor', 'w-[140px]'],
              ['Tipo de costo extra', 'w-[210px]'],
              ['Monto proyectado', 'w-[140px] text-right!'],
              ['Causa raíz', 'w-[180px]'],
              ['Instrucción a la operación', 'min-w-[280px]'],
            ]}
            filas={filtrados.filter((e) => e.alertaCosto)}
            vacio="Ningún embarque alertado con estos filtros."
          >
            {(e) => (
              <tr key={e.id}>
                <td className="cell-key">{e.id}</td>
                <td>{e.proveedor}</td>
                <td>{e.tipoCosto}</td>
                <td className="cell-num font-bold text-rojo-700">{dinero(e.montoProyectado)}</td>
                <td>{e.causaRaiz}</td>
                <td className="text-sm text-ink-2">{e.instruccion}</td>
              </tr>
            )}
          </Tabla>
        </>
      )}

      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        size="lg"
        eyebrow={modal ? `${modal.embarque.proveedor} · ${modal.embarque.contenedor}` : ''}
        title={
          modal
            ? modal.tipo === 'trazabilidad'
              ? `Trazabilidad internacional · ${modal.embarque.id}`
              : modal.tipo === 'aduana'
                ? `Bitácora de aduana · ${modal.embarque.id}`
                : `Bitácora tránsito a planta · ${modal.embarque.id}`
            : ''
        }
        footer={
          <Button variant="quiet" onClick={() => setModal(null)}>
            Cerrar
          </Button>
        }
      >
        {modal && <DetalleModal tipo={modal.tipo} embarque={modal.embarque} />}
      </Modal>
    </div>
  )
}
