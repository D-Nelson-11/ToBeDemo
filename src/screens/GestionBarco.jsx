import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  LuAnchor,
  LuArrowLeft,
  LuChevronRight,
  LuCirclePlus,
  LuContainer,
  LuFactory,
  LuGauge,
  LuPackage,
  LuRoute,
  LuShieldCheck,
  LuShip,
  LuTruck,
  LuWarehouse,
} from 'react-icons/lu'
import Button, { cx } from '../components/ui/Button'
import { Field, Input, Select } from '../components/ui/Field'
import { useOc } from '../data/store'
import { FLOTA, TM_POR_VIAJE } from '../data/barcos'
import {
  ACCION_VIAJE,
  ahoraLocal,
  avanzarViaje,
  crearViaje,
  estadoInicial,
  etapaUnidad,
  fmtMomento,
  metricas,
  repartir,
} from '../lib/barco'
import { fmtNum } from '../lib/fechas'

const MODULOS = [
  { id: 'operacion', titulo: 'Operación de barco', sub: 'Atraque · riesgo · costo', icono: LuAnchor },
  { id: 'plan', titulo: 'Plan de carga', sub: 'Costado · silo', icono: LuGauge },
  { id: 'flota', titulo: 'Flota', sub: 'Disponibilidad · asignación', icono: LuTruck },
  { id: 'asignaciones', titulo: 'Asignaciones de transporte', sub: 'Flujo por sitio y etapa', icono: LuRoute },
  { id: 'operatividad', titulo: 'Operatividad', sub: 'Viajes activos y cerrados', icono: LuContainer },
  { id: 'silos', titulo: 'Silos', sub: 'Stock y movimientos', icono: LuWarehouse },
]

const TONO_VIAJE = {
  PENDIENTE: 'bg-surface-3 text-ink-2',
  'EN TRÁNSITO': 'bg-ambar-50 text-ambar-700',
  'LLEGÓ A PLANTA': 'bg-ambar-50 text-ambar-700',
  DESCARGANDO: 'bg-ambar-50 text-ambar-700',
  CERRADO: 'bg-teal-50 text-teal-700',
}

const ETAPAS_ADUANA = ['Documentos', 'Declaración', 'Selectivo', 'Impuestos', 'Liberación']

const fmtUsd = (n) => '$' + fmtNum(Math.round(n))

function Chip({ className, children }) {
  return (
    <span className={cx('inline-flex whitespace-nowrap rounded-full px-2.5 py-[3px] text-xs font-semibold', className)}>
      {children}
    </span>
  )
}

function Kpi({ rotulo, valor, tono }) {
  return (
    <div className="tarjeta min-w-[150px] flex-1 px-3 py-2.5">
      <div
        className={cx(
          'num text-xl font-bold',
          tono === 'rojo' && 'text-rojo-700',
          tono === 'ambar' && 'text-ambar-700',
          tono === 'teal' && 'text-teal-700',
        )}
      >
        {valor}
      </div>
      <div className="text-sm text-ink-3">{rotulo}</div>
    </div>
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

function Nota({ children }) {
  return <p className="m-0 rounded-sm border border-line bg-surface-2 px-3 py-2.5 text-sm text-ink-2">{children}</p>
}

function Panel({ eyebrow, titulo, chips, children }) {
  return (
    <div className="panel">
      <div className="panel-head flex-wrap">
        <span>
          <span className="block text-xs font-semibold uppercase tracking-wide text-ink-3">{eyebrow}</span>
          <span className="panel-title">{titulo}</span>
        </span>
        <span className="ml-auto flex flex-wrap gap-1.5">{chips}</span>
      </div>
      <div className="flex flex-col gap-4 p-4">{children}</div>
    </div>
  )
}

/** Tabla de viajes: la misma para costado, silo e histórico; `accion` agrega la hora y el botón del paso. */
function TablaViajes({ viajes, unidades, vacio, conOrigen, accion }) {
  return (
    <div className="tabla-scroll rounded-sm border border-line">
      <table className="tbl">
        <thead>
          <tr>
            <th className="w-[70px]">Viaje</th>
            {conOrigen && <th className="w-[110px]">Origen</th>}
            <th className="min-w-[150px]">Motorista</th>
            <th className="w-[80px]">Unidad</th>
            <th className="w-[90px]">Cabezal</th>
            <th className="w-[90px]">Traileta</th>
            <th className="w-[60px] text-right!">TM</th>
            <th className="w-[110px]">Asignado</th>
            <th className="w-[110px]">Salida</th>
            <th className="w-[110px]">ETA</th>
            <th className="w-[110px]">Llegada</th>
            <th className="w-[110px]">Descarga</th>
            <th className="w-[110px]">Almacén</th>
            <th className="w-[80px]">Tiempo</th>
            <th className="w-[130px]">Estado</th>
            {accion && <th className="min-w-[340px]">Acción</th>}
          </tr>
        </thead>
        <tbody>
          {viajes.length === 0 && (
            <tr>
              <td colSpan={16} className="h-[80px]! bg-surface text-center text-sm text-ink-3">
                {vacio}
              </td>
            </tr>
          )}
          {viajes.map((v) => {
            const u = unidades.find((x) => x.unidad === v.unidad) ?? {}
            return (
              <tr key={v.id}>
                <td className="cell-key">{v.id}</td>
                {conOrigen && <td>{v.tipo === 'directo' ? 'Costado barco' : 'Silo'}</td>}
                <td className="cell-cut">{u.nombre}</td>
                <td className="cell-strong">{v.unidad}</td>
                <td className="num">{u.cabezal}</td>
                <td className="num">{u.traileta}</td>
                <td className="cell-num">{v.tm}</td>
                {['asignado', 'salida', 'eta', 'llegada', 'descarga', 'almacen'].map((k) => (
                  <td key={k} className="num text-xs">
                    {fmtMomento(v[k])}
                  </td>
                ))}
                <td className="num">{v.duracion ?? '—'}</td>
                <td>
                  <Chip className={TONO_VIAJE[v.estado]}>{v.estado}</Chip>
                </td>
                {accion && <td>{accion(v)}</td>}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

/** Gestión de un barco a granel: descarga por costado y silo con la flota de cabezales. */
export default function GestionBarco() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { avisar } = useOc()
  const barco = FLOTA.find((b) => b.id === id) ?? FLOTA[0]

  const [s, setS] = useState(() => estadoInicial(barco))
  const [modulo, setModulo] = useState(null)
  // Pila propia: "Volver" regresa a la etapa anterior, no a la página anterior del navegador.
  const [pila, setPila] = useState([])
  const [info, setInfo] = useState(null)
  // Hora elegida en cada fila (asignación o paso del viaje); sin tocar, es "ahora".
  const [horas, setHoras] = useState({})
  const [nueva, setNueva] = useState({ nombre: '', unidad: '', cabezal: '', traileta: '', tipo: 'directo' })
  const [siloForm, setSiloForm] = useState({ unidad: '', movUnidades: 10 })
  // El tiempo libre y el costo de silo corren con el reloj: se repinta cada minuto.
  const [, setTic] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setTic((n) => n + 1), 60000)
    return () => clearInterval(t)
  }, [])

  // Las acciones trabajan sobre una copia: así StrictMode puede repetirlas sin duplicar viajes.
  const cambiar = (fn) =>
    setS((prev) => {
      const n = structuredClone(prev)
      fn(n)
      return n
    })

  const hora = (clave) => horas[clave] ?? ahoraLocal()
  // Función y no componente: un componente definido acá se remontaría en cada tecla y perdería el foco.
  const inputHora = (clave) => (
    <input
      type="datetime-local"
      className="inp inp-date h-7! w-[170px] text-xs"
      value={hora(clave)}
      onChange={(e) => setHoras((h) => ({ ...h, [clave]: e.target.value }))}
    />
  )

  const m = metricas(s)
  const pendiente = s.total - m.recibido

  const abrir = (id) => {
    if (id === modulo) return
    setPila((p) => [...p, modulo])
    setModulo(id)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  const volver = () => {
    setModulo(pila.at(-1) ?? null)
    setPila((p) => p.slice(0, -1))
  }

  const accionViaje = (v) =>
    v.estado === 'CERRADO' ? (
      <Chip className={TONO_VIAJE.CERRADO}>Cerrado</Chip>
    ) : (
      <div className="flex items-center gap-1.5">
        {inputHora(v.id)}
        <Button
          size="sm"
          variant={v.estado === 'DESCARGANDO' ? 'primary' : 'secondary'}
          onClick={() => cambiar((n) => avanzarViaje(n, v.id, hora(v.id)))}
        >
          {ACCION_VIAJE[v.estado]}
        </Button>
      </div>
    )

  // Tiempo libre del barco desde el atraque; el costo corre por hora excedida.
  const transcurrido = Math.max(0, (Date.now() - new Date(s.atraque)) / 3600000)
  const restante = s.horasLibres - transcurrido
  const excedido = Math.max(0, -restante)
  const riesgoLibre = excedido > 0 ? 'SOBREPASADO' : restante <= s.horasLibres * 0.25 ? 'RIESGO' : 'EN CONTROL'
  const diasSilo = Math.max(0, (Date.now() - new Date(s.ingresoSilo)) / 86400000)

  const viajesSilo = s.viajes.filter((v) => v.tipo === 'silo' && v.estado !== 'CERRADO')
  const disponibles = s.unidades.filter((u) => u.disponible)
  const enEtapa = (e) => s.unidades.filter((u) => etapaUnidad(s, u).etapa === e).length

  return (
    <>
      {/* ------------------------------- encabezado ------------------------------ */}
      <div className="panel flex flex-wrap items-start gap-4 p-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-navy-800 text-white">
          <LuShip size={22} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="m-0 text-lg font-bold text-navy-800">{s.buque}</h2>
          <p className="m-0 text-sm text-ink-3">
            {s.id} · {s.producto} · {fmtNum(s.total)} TM · {s.puerto} → {s.planta}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Chip className="bg-navy-50 text-navy-700">GRANEL</Chip>
            <Chip className="bg-surface-3 text-ink-2">{s.oc}</Chip>
            <Chip className="bg-surface-3 text-ink-2">{s.origen}</Chip>
            <Chip className="bg-ambar-50 text-ambar-700">{fmtNum(pendiente)} TM pendientes</Chip>
          </div>
        </div>
        <Button onClick={() => navigate('/torre')}>
          <LuArrowLeft size={14} /> Volver a Control Tower
        </Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <Kpi rotulo="Carga total" valor={`${fmtNum(s.total)} TM`} />
        <Kpi rotulo="Recibido en planta" valor={`${fmtNum(m.recibido)} TM`} tono="teal" />
        <Kpi rotulo="En tránsito" valor={`${fmtNum(m.enTransito)} TM`} />
        <Kpi rotulo="Producto en silo" valor={`${fmtNum(m.stockSilo)} TM`} tono="ambar" />
        <Kpi rotulo="Unidades disponibles" valor={m.disponibles} />
      </div>

      <div className="flex min-w-0 flex-col gap-4">
        {/* Estado del proceso: barra horizontal, como en la referencia. Al entrar a una etapa se oculta. */}
        {!modulo && (
          <nav className="panel overflow-hidden">
            <div className="border-b border-line px-4 py-2 text-xs font-semibold uppercase tracking-wide text-ink-3">
              Estado del proceso · Seleccioná una etapa para gestionar
            </div>
            <ul className="m-0 flex list-none overflow-x-auto p-0">
              {MODULOS.map((x) => {
                const sub =
                  x.id === 'operatividad'
                    ? `${m.activos.length} activos · ${m.cerrados.length} cerrados`
                    : x.id === 'silos'
                      ? `${fmtNum(m.stockSilo)} TM en silo`
                      : x.sub
                const hecho = x.id === 'operatividad' && m.cerrados.length > 0
                return (
                  <li key={x.id} className="min-w-[180px] flex-1 border-r border-line last:border-r-0">
                    <button
                      onClick={() => abrir(x.id)}
                      className="group flex h-full w-full items-center gap-2.5 border-b-[3px] border-transparent px-3 py-3 text-left transition-colors duration-100 hover:border-navy-600 hover:bg-surface-2"
                    >
                      <span className={cx('h-2 w-2 shrink-0 rounded-full', hecho ? 'bg-teal-600' : 'bg-line-strong')} />
                      <span className="min-w-0 flex-1">
                        <b className="flex items-center gap-1.5 text-sm font-bold text-ink">
                          <x.icono size={14} className="shrink-0 text-navy-600" />
                          {x.titulo}
                        </b>
                        <span className="block truncate text-xs text-ink-3">{sub}</span>
                      </span>
                      <span className="flex shrink-0 items-center gap-0.5 rounded-xs bg-navy-800 px-1.5 py-0.5 text-3xs font-bold text-white opacity-90 group-hover:opacity-100">
                        Ingresar <LuChevronRight size={10} />
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </nav>
        )}

        {modulo ? (
          <div className="flex flex-wrap items-center gap-3">
            <div className="min-w-0 flex-1">
              <h3 className="m-0 text-lg font-bold text-navy-800">{MODULOS.find((x) => x.id === modulo).titulo}</h3>
              <span className="text-sm text-ink-3">
                Pantalla operativa · {s.buque} · {s.id}
              </span>
            </div>
            <Button onClick={volver}>
              <LuArrowLeft size={14} /> Volver
            </Button>
          </div>
        ) : (
          <Nota>
            <b className="text-ink">Seleccioná una etapa para ingresar a la operación.</b> Cada opción abre una
            pantalla operativa; las acciones y registros se mantienen dentro de la etapa.
          </Nota>
        )}

        {/* Información rápida: solo en el menú; al entrar a una etapa la pantalla es de ella */}
        {!modulo && (
          <div className="panel">
            <div className="panel-head flex-wrap">
              <span className="panel-title">Información rápida del barco</span>
              <div className="ml-auto flex flex-wrap gap-1.5">
                {[
                  ['producto', 'Producto y destino', LuPackage],
                  ['ciclo', 'Ciclo del barco', LuAnchor],
                  ['aduana', 'Proceso aduanal', LuShieldCheck],
                ].map(([k, rotulo, Icono]) => (
                  <Button
                    key={k}
                    size="sm"
                    variant={info === k ? 'primary' : 'secondary'}
                    onClick={() => setInfo(info === k ? null : k)}
                  >
                    <Icono size={13} /> {rotulo}
                  </Button>
                ))}
              </div>
            </div>
            {info === 'producto' && (
              <div className="grid grid-cols-2 gap-2 p-4 md:grid-cols-3">
                <Dato rotulo="Producto">{s.producto}</Dato>
                <Dato rotulo="Cantidad arribada">{fmtNum(s.total)} TM</Dato>
                <Dato rotulo="Origen">{s.origen}</Dato>
                <Dato rotulo="Puerto destino">{s.puerto}</Dato>
                <Dato rotulo="Planta">{s.planta}</Dato>
                <Dato rotulo="Unidad estándar">{TM_POR_VIAJE} TM</Dato>
              </div>
            )}
            {info === 'ciclo' && (
              <div className="flex flex-col gap-3 p-4">
                <div className="flex flex-wrap gap-1.5">
                  {['OC', 'Nominación', 'ATD', 'ATA Puerto', 'Descarga', 'Última unidad', 'Almacén'].map((x, i) => (
                    <Chip
                      key={x}
                      className={i < 3 ? 'bg-teal-50 text-teal-700' : i === 3 ? 'bg-navy-700 text-white' : 'bg-surface-3 text-ink-3'}
                    >
                      {x}
                    </Chip>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                  <Dato rotulo="Tiempo de operación">{((Date.now() - s.inicio) / 3600000).toFixed(1)} h</Dato>
                  <Dato rotulo="Viajes totales requeridos">{Math.ceil(s.total / TM_POR_VIAJE)}</Dato>
                  <Dato rotulo="Viajes cerrados">{m.cerrados.length}</Dato>
                </div>
              </div>
            )}
            {info === 'aduana' && (
              <div className="flex flex-wrap items-center gap-2 p-4">
                {ETAPAS_ADUANA.map((x, i) => (
                  <Chip key={x} className={i < s.aduana ? 'bg-teal-50 text-teal-700' : 'bg-ambar-50 text-ambar-700'}>
                    {x} · {i < s.aduana ? 'listo' : 'pendiente'}
                  </Chip>
                ))}
                <Button
                  size="sm"
                  className="ml-auto"
                  disabled={s.aduana >= ETAPAS_ADUANA.length}
                  onClick={() => cambiar((n) => (n.aduana += 1))}
                >
                  Finalizar siguiente estatus
                </Button>
              </div>
            )}
          </div>
        )}

        {/* ----------------------------- operación de barco ----------------------------- */}
        {modulo === 'operacion' && (
          <Panel
            eyebrow="Control portuario"
            titulo="Tiempo libre de barco"
            chips={<Chip className="bg-ambar-50 text-ambar-700">Control de riesgo</Chip>}
          >
            <Nota>
              Control desde el atraque hasta ahora. Configurá las horas libres contractuales y el costo por hora para
              ver el riesgo y el costo acumulado.
            </Nota>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <Field label="Fecha y hora de atraque">
                <Input date type="datetime-local" value={s.atraque} onChange={(e) => cambiar((n) => (n.atraque = e.target.value))} />
              </Field>
              <Field label="Horas libres permitidas">
                <Input
                  type="number"
                  min={1}
                  value={s.horasLibres}
                  onChange={(e) => cambiar((n) => (n.horasLibres = Math.max(1, Number(e.target.value) || 48)))}
                />
              </Field>
              <Field label="Costo por hora excedida ($)">
                <Input
                  type="number"
                  min={0}
                  step={100}
                  value={s.costoHora}
                  onChange={(e) => cambiar((n) => (n.costoHora = Math.max(0, Number(e.target.value) || 0)))}
                />
              </Field>
            </div>
            <div className="flex flex-wrap gap-3">
              <Kpi rotulo="Tiempo transcurrido" valor={`${transcurrido.toFixed(1)} h`} />
              <Kpi rotulo="Tiempo libre restante" valor={`${Math.max(0, restante).toFixed(1)} h`} />
              <Kpi
                rotulo="Alerta de riesgo"
                valor={riesgoLibre}
                tono={excedido > 0 ? 'rojo' : riesgoLibre === 'RIESGO' ? 'ambar' : 'teal'}
              />
              <Kpi rotulo="Costo acumulado" valor={fmtUsd(excedido * s.costoHora)} tono={excedido > 0 ? 'rojo' : undefined} />
            </div>
            <span className="h-2 overflow-hidden rounded-full bg-surface-3">
              <span
                className={cx('block h-full', excedido > 0 ? 'bg-rojo-600' : riesgoLibre === 'RIESGO' ? 'bg-ambar-500' : 'bg-navy-600')}
                style={{ width: `${Math.min(100, (transcurrido / s.horasLibres) * 100)}%` }}
              />
            </span>
          </Panel>
        )}

        {/* -------------------------------- plan de carga -------------------------------- */}
        {modulo === 'plan' && (
          <Panel
            eyebrow="Planificación"
            titulo="Plan de descarga"
            chips={
              <>
                <Chip className="bg-navy-50 text-navy-700">Costado {fmtNum(s.directo)} TM</Chip>
                <Chip className="bg-surface-3 text-ink-2">Silo {fmtNum(s.silo)} TM</Chip>
              </>
            }
          >
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              <div className="flex flex-col gap-3 rounded-sm border border-line p-3">
                <b className="flex items-center gap-2 text-sm font-bold text-navy-800">
                  <LuAnchor size={14} /> Costado del barco · Prioridad 1
                </b>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="TM asignadas">
                    <Input
                      type="number"
                      step={TM_POR_VIAJE}
                      defaultValue={s.directo}
                      key={'d' + s.directo}
                      onBlur={(e) => cambiar((n) => repartir(n, 'directo', e.target.value))}
                    />
                  </Field>
                  <Field label="Viajes / unidad / día">
                    <Input
                      type="number"
                      min={1}
                      value={s.ciclos}
                      onChange={(e) => cambiar((n) => (n.ciclos = Math.max(1, Number(e.target.value) || 1)))}
                    />
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                  <Dato rotulo="Viajes requeridos">{m.viajesDirectos}</Dato>
                  <Dato rotulo="Unidades asignadas">{m.directas}</Dato>
                  <Dato rotulo="Viajes / día">{m.directas * s.ciclos}</Dato>
                  <Dato rotulo="Tiempo estimado">{m.diasDirecto ? `${m.diasDirecto} días` : 'Pendiente'}</Dato>
                </div>
              </div>
              <div className="flex flex-col gap-3 rounded-sm border border-line p-3">
                <b className="flex items-center gap-2 text-sm font-bold text-navy-800">
                  <LuWarehouse size={14} /> Silo de puerto · Prioridad 2
                </b>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="TM asignadas">
                    <Input
                      type="number"
                      step={TM_POR_VIAJE}
                      defaultValue={s.silo}
                      key={'s' + s.silo}
                      onBlur={(e) => cambiar((n) => repartir(n, 'silo', e.target.value))}
                    />
                  </Field>
                  <Field label="TM disponibles en silo">
                    <Input value={`${fmtNum(m.stockSilo)} TM`} disabled readOnly />
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                  <Dato rotulo="Viajes restantes">{m.viajesSilo}</Dato>
                  <Dato rotulo="Unidades asignadas">{m.deSilo}</Dato>
                  <Dato rotulo="Viajes / día">{m.deSilo}</Dato>
                  <Dato rotulo="Tiempo estimado">{m.diasSilo ? `${m.diasSilo} días` : 'Pendiente'}</Dato>
                </div>
              </div>
            </div>
            <Nota>
              La suma es automática: si asignás <b>{fmtNum(s.directo)} TM</b> al costado, quedan{' '}
              <b>{fmtNum(s.silo)} TM</b> en silo, siempre en múltiplos de {TM_POR_VIAJE} TM y sumando las{' '}
              {fmtNum(s.total)} TM del barco.
            </Nota>
          </Panel>
        )}

        {/* ------------------------------------ flota ------------------------------------ */}
        {modulo === 'flota' && (
          <Panel
            eyebrow="Recursos terrestres"
            titulo="Unidades disponibles y asignación a la descarga"
            chips={
              <>
                <Chip className="bg-teal-50 text-teal-700">{m.disponibles} disponibles</Chip>
                <Chip className="bg-navy-50 text-navy-700">{m.directas} asignadas</Chip>
              </>
            }
          >
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3 xl:grid-cols-6">
              {[
                ['nombre', 'Nombre motorista', 'Nombre completo'],
                ['unidad', 'Unidad', 'TR-109'],
                ['cabezal', 'Placa cabezal', 'HND-109'],
                ['traileta', 'Placa traileta', 'TRL-509'],
              ].map(([k, rotulo, ph]) => (
                <Field key={k} label={rotulo}>
                  <Input placeholder={ph} value={nueva[k]} onChange={(e) => setNueva((f) => ({ ...f, [k]: e.target.value }))} />
                </Field>
              ))}
              <Field label="Asignación">
                <Select
                  options={[
                    { value: 'directo', label: 'Costado del barco' },
                    { value: 'silo', label: 'Silo de puerto' },
                  ]}
                  value={nueva.tipo}
                  onChange={(e) => setNueva((f) => ({ ...f, tipo: e.target.value }))}
                />
              </Field>
              <Field label="Fecha y hora de asignación">
                {inputHora('nueva')}
              </Field>
            </div>
            <div className="flex justify-end">
              <Button
                variant="primary"
                onClick={() => {
                  const { nombre, unidad, cabezal, traileta, tipo } = nueva
                  if (!nombre.trim() || !unidad.trim() || !cabezal.trim() || !traileta.trim())
                    return avisar('Completá motorista, unidad, placa de cabezal y placa de traileta.', 'alerta')
                  if (s.unidades.some((u) => u.unidad === unidad.trim()))
                    return avisar('La unidad ya está registrada.', 'alerta')
                  cambiar((n) => {
                    n.unidades.push({
                      nombre: nombre.trim(),
                      transporte: 'Cabezal + Traileta',
                      unidad: unidad.trim(),
                      cabezal: cabezal.trim(),
                      traileta: traileta.trim(),
                      disponible: true,
                      viajesBarco: 0,
                      viajesSilo: 0,
                    })
                    crearViaje(n, tipo, unidad.trim(), hora('nueva'))
                  })
                  setNueva({ nombre: '', unidad: '', cabezal: '', traileta: '', tipo })
                  avisar(`Unidad ${unidad.trim()} agregada y asignada.`, 'ok')
                }}
              >
                <LuCirclePlus size={14} /> Agregar unidad y asignar
              </Button>
            </div>

            <div className="tabla-scroll rounded-sm border border-line">
              <table className="tbl">
                <thead>
                  <tr>
                    <th className="min-w-[150px]">Motorista</th>
                    <th className="w-[140px]">Transporte</th>
                    <th className="w-[80px]">Unidad</th>
                    <th className="w-[90px]">Cabezal</th>
                    <th className="w-[90px]">Traileta</th>
                    <th className="w-[90px] text-right!">Viajes barco</th>
                    <th className="w-[80px] text-right!">Viajes silo</th>
                    <th className="w-[120px]">Estado</th>
                    <th className="min-w-[320px]">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {s.unidades.map((u) => (
                    <tr key={u.unidad}>
                      <td className="cell-cut">{u.nombre}</td>
                      <td>{u.transporte}</td>
                      <td className="cell-strong">{u.unidad}</td>
                      <td className="num">{u.cabezal}</td>
                      <td className="num">{u.traileta}</td>
                      <td className="cell-num">{u.viajesBarco}</td>
                      <td className="cell-num">{u.viajesSilo}</td>
                      <td>
                        <Chip className={u.disponible ? 'bg-teal-50 text-teal-700' : 'bg-ambar-50 text-ambar-700'}>
                          {u.disponible ? 'DISPONIBLE' : 'EN OPERACIÓN'}
                        </Chip>
                      </td>
                      <td>
                        {u.disponible ? (
                          <div className="flex items-center gap-1.5">
                            {inputHora('asig-' + u.unidad)}
                            <Button
                              size="sm"
                              onClick={() => {
                                cambiar((n) => crearViaje(n, 'directo', u.unidad, hora('asig-' + u.unidad)))
                                avisar(`${u.unidad} asignada al costado del barco.`, 'ok')
                              }}
                            >
                              Asignar al barco
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-ink-3">En un viaje activo</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Nota>
              Con {m.directas} unidad{m.directas === 1 ? '' : 'es'} en el costado y {s.ciclos} viaje(s) por unidad al
              día, la capacidad es de <b>{m.directas * s.ciclos} viajes/día</b>. Más unidades bajan el tiempo de las{' '}
              {m.viajesDirectos} cargas.
            </Nota>
          </Panel>
        )}

        {/* ------------------------- asignaciones de transporte ------------------------- */}
        {modulo === 'asignaciones' && (
          <Panel
            eyebrow="Visibilidad operativa"
            titulo="Asignaciones por sitio y etapa"
            chips={<Chip className="bg-surface-3 text-ink-2">{TM_POR_VIAJE} TM / viaje</Chip>}
          >
            <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
              {[
                [s.puerto, 'Puerto', LuAnchor],
                ['En tránsito', 'Puerto → Planta', LuTruck],
                [s.planta, 'Planta', LuFactory],
                ['Retorno', 'Planta → Puerto', LuRoute],
              ].map(([t, sub, Icono]) => (
                <div key={sub} className="flex items-center gap-2.5 rounded-sm border border-line px-3 py-2">
                  <Icono size={16} className="text-navy-600" />
                  <span>
                    <b className="block text-sm font-bold text-ink">{t}</b>
                    <span className="text-xs text-ink-3">{sub}</span>
                  </span>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-3">
              <Kpi rotulo="Trailetas disponibles" valor={enEtapa('Disponible')} tono="teal" />
              <Kpi rotulo="En puerto" valor={enEtapa('En puerto')} />
              <Kpi rotulo="En tránsito a planta" valor={enEtapa('En tránsito a planta')} tono="ambar" />
              <Kpi rotulo="En planta" valor={enEtapa('En planta')} />
              <Kpi rotulo="En retorno" valor={0} />
            </div>
            <div className="tabla-scroll rounded-sm border border-line">
              <table className="tbl">
                <thead>
                  <tr>
                    <th className="w-[90px]">Unidad</th>
                    <th className="w-[110px]">Traileta</th>
                    <th className="min-w-[160px]">Sitio actual</th>
                    <th className="w-[170px]">Estatus</th>
                    <th className="w-[150px]">Último movimiento</th>
                  </tr>
                </thead>
                <tbody>
                  {s.unidades.map((u) => {
                    const { etapa, ultimo } = etapaUnidad(s, u)
                    return (
                      <tr key={u.unidad}>
                        <td className="cell-strong">{u.unidad}</td>
                        <td className="num">{u.traileta}</td>
                        <td>{etapa === 'En planta' ? s.planta : s.puerto}</td>
                        <td>
                          <Chip
                            className={
                              etapa === 'En planta'
                                ? 'bg-teal-50 text-teal-700'
                                : etapa === 'En tránsito a planta'
                                  ? 'bg-ambar-50 text-ambar-700'
                                  : 'bg-surface-3 text-ink-2'
                            }
                          >
                            {etapa}
                          </Chip>
                        </td>
                        <td className="num text-xs">
                          {ultimo ? fmtMomento(ultimo.llegada || ultimo.salida || ultimo.asignado) : '—'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Panel>
        )}

        {/* --------------------------------- operatividad --------------------------------- */}
        {modulo === 'operatividad' && (
          <Panel
            eyebrow="Ejecución"
            titulo="Seguimiento operativo de viajes"
            chips={
              <>
                <Chip className="bg-ambar-50 text-ambar-700">{m.activos.length} activos</Chip>
                <Chip className="bg-teal-50 text-teal-700">{m.cerrados.length} cerrados</Chip>
              </>
            }
          >
            <TablaViajes
              viajes={m.activos}
              unidades={s.unidades}
              conOrigen
              vacio="No hay viajes activos. Asigná unidades desde Flota o Silos."
              accion={accionViaje}
            />
            <div className="lbl">Histórico · viajes cerrados</div>
            <TablaViajes
              viajes={[...m.cerrados].reverse()}
              unidades={s.unidades}
              conOrigen
              vacio="Todavía no hay viajes cerrados."
            />
          </Panel>
        )}

        {/* ------------------------------------ silos ------------------------------------ */}
        {modulo === 'silos' && (
          <Panel
            eyebrow="Almacenamiento externo"
            titulo="Producto en silos · Prioridad 2"
            chips={
              <>
                <Chip className="bg-ambar-50 text-ambar-700">{fmtNum(m.stockSilo)} TM en silo</Chip>
                <Chip className="bg-navy-50 text-navy-700">{fmtUsd(s.costoSiloTmDia)} / TM · día</Chip>
              </>
            }
          >
            <Nota>
              El costado del barco tiene prioridad. El silo funciona como almacén externo y usa las unidades que no
              están comprometidas con el flujo principal.
            </Nota>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
              <Field label="Fecha y hora de ingreso al silo">
                <Input date type="datetime-local" value={s.ingresoSilo} onChange={(e) => cambiar((n) => (n.ingresoSilo = e.target.value))} />
              </Field>
              <Field label="Costo por TM / día ($)">
                <Input
                  type="number"
                  min={0}
                  value={s.costoSiloTmDia}
                  onChange={(e) => cambiar((n) => (n.costoSiloTmDia = Math.max(0, Number(e.target.value) || 0)))}
                />
              </Field>
              <Field label="Unidad disponible">
                <Select
                  placeholder={disponibles.length ? 'Seleccionar…' : 'Sin unidades disponibles'}
                  options={disponibles.map((u) => ({ value: u.unidad, label: `${u.unidad} · ${u.nombre}` }))}
                  value={siloForm.unidad}
                  onChange={(e) => setSiloForm((f) => ({ ...f, unidad: e.target.value }))}
                />
              </Field>
              <Field label="Fecha y hora de asignación">
                {inputHora('silo')}
              </Field>
            </div>
            <div className="flex justify-end">
              <Button
                variant="primary"
                onClick={() => {
                  if (!siloForm.unidad) return avisar('Elegí una unidad disponible.', 'alerta')
                  if (m.stockSilo < TM_POR_VIAJE) return avisar('No hay suficiente producto en silo.', 'alerta')
                  cambiar((n) => crearViaje(n, 'silo', siloForm.unidad, hora('silo')))
                  avisar(`${siloForm.unidad} asignada a la operación de silo.`, 'ok')
                  setSiloForm((f) => ({ ...f, unidad: '' }))
                }}
              >
                <LuTruck size={14} /> Asignar unidad a operación de silo
              </Button>
            </div>

            <TablaViajes
              viajes={viajesSilo}
              unidades={s.unidades}
              vacio="No hay movimientos activos desde silo."
              accion={accionViaje}
            />

            <div className="lbl">Programación y stock de silo</div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
              <Field label="Fecha y hora de movimiento">
                {inputHora('movSilo')}
              </Field>
              <Field label="Unidades">
                <Input
                  type="number"
                  min={1}
                  value={siloForm.movUnidades}
                  onChange={(e) => setSiloForm((f) => ({ ...f, movUnidades: Math.max(1, Number(e.target.value) || 1) }))}
                />
              </Field>
              <Field label="TM">
                <Input value={`${fmtNum(siloForm.movUnidades * TM_POR_VIAJE)} TM`} disabled readOnly />
              </Field>
              <Field label="Stock resultante">
                <Input
                  value={`${fmtNum(Math.max(0, m.stockSilo - siloForm.movUnidades * TM_POR_VIAJE))} TM`}
                  disabled
                  readOnly
                />
              </Field>
            </div>
            <div className="flex flex-wrap gap-3">
              <Kpi rotulo="Tiempo acumulado en silo" valor={`${diasSilo.toFixed(1)} días`} />
              <Kpi rotulo="Stock actual en silo" valor={`${fmtNum(m.stockSilo)} TM`} tono="ambar" />
              <Kpi rotulo="Costo acumulado de almacenamiento" valor={fmtUsd(diasSilo * m.stockSilo * s.costoSiloTmDia)} />
              <Kpi rotulo="Costo por TM / día" valor={fmtUsd(s.costoSiloTmDia)} />
            </div>
            <div className="flex justify-end">
              <Button
                onClick={() => {
                  const tm = siloForm.movUnidades * TM_POR_VIAJE
                  if (tm > m.stockSilo) return avisar('El movimiento supera el stock disponible en silo.', 'alerta')
                  cambiar((n) =>
                    n.movimientosSilo.push({ fecha: hora('movSilo'), unidades: siloForm.movUnidades, tm, estado: 'PROGRAMADO' }),
                  )
                  avisar(`Movimiento de ${fmtNum(tm)} TM programado.`, 'ok')
                }}
              >
                Programar movimiento de silo
              </Button>
            </div>
            <div className="tabla-scroll rounded-sm border border-line">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th className="text-right!">Unidades</th>
                    <th className="text-right!">TM</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {s.movimientosSilo.length === 0 && (
                    <tr>
                      <td colSpan={4} className="h-[64px]! bg-surface text-center text-sm text-ink-3">
                        No hay movimientos programados.
                      </td>
                    </tr>
                  )}
                  {s.movimientosSilo.map((mv, i) => (
                    <tr key={i}>
                      <td className="num">{fmtMomento(mv.fecha)}</td>
                      <td className="cell-num">{mv.unidades}</td>
                      <td className="cell-num">{fmtNum(mv.tm)}</td>
                      <td>
                        <Chip className="bg-navy-50 text-navy-700">{mv.estado}</Chip>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        )}

      </div>
    </>
  )
}
