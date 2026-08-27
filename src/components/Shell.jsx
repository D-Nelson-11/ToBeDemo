import { Fragment, Suspense, useEffect, useRef, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  LuBriefcase,
  LuChartColumn,
  LuCheck,
  LuChevronDown,
  LuCircleAlert,
  LuCircleCheck,
  LuLogOut,
  LuPanelLeftClose,
  LuPanelLeftOpen,
  LuTowerControl,
  LuTriangleAlert,
  LuUserCog,
  LuWorkflow,
} from 'react-icons/lu'
import { useOc } from '../data/store'
import { cx } from './ui/Button'

export const PASOS = [
  { paso: 1, to: '/orden-compra', titulo: 'New Purchase order' },
  { paso: 2, to: '/despachos', titulo: 'Purchase Order Managerment' },
  { paso: 3, to: '/seguimiento', titulo: 'Supply Scheduling ' },
  { paso: 4, to: '/gestiones', titulo: 'Shipping Instruction' },
]

// Dos módulos: el flujo paso a paso y la vista de monitoreo.
export const MODULOS = [
  {
    id: 'flujo',
    titulo: 'Supply Hub',
    sub: 'Flujo paso a paso',
    icono: LuWorkflow,
    to: PASOS[0].to,
    rutas: PASOS.map((p) => p.to),
  },
  {
    id: 'torre',
    titulo: 'Control Tower ',
    sub: 'Monitoreo de embarques',
    icono: LuTowerControl,
    to: '/torre',
    rutas: ['/torre'],
  },
  {
    id: 'kpi',
    titulo: 'Performance Compass',
    sub: 'Indicadores de volumen',
    icono: LuChartColumn,
    to: '/kpi',
    rutas: ['/kpi'],
  },
]

// Lo que ve el cliente: sus cuatro pantallas en un solo módulo con pestañas.
export const MODULOS_CLIENTE = [
  {
    id: 'cliente',
    titulo: 'Portal del cliente',
    sub: 'Planning, torre, costos y entrega',
    icono: LuBriefcase,
    to: '/cliente',
    rutas: ['/cliente'],
  },
]

// Cada vista es un portal distinto: cambia el sidebar entero, no solo el permiso.
export const VISTAS = [
  {
    id: 'especialista',
    rotulo: 'Vista especialista',
    usuario: 'User',
    area: 'Abastecimiento',
    icono: LuUserCog,
    modulos: MODULOS,
  },
  {
    id: 'cliente',
    rotulo: 'Vista cliente',
    usuario: 'User',
    area: 'Cliente',
    icono: LuBriefcase,
    modulos: MODULOS_CLIENTE,
  },
]

const AVISO = {
  ok: { icono: LuCircleCheck, color: 'text-teal-100' },
  alerta: { icono: LuTriangleAlert, color: 'text-ambar-100' },
  rojo: { icono: LuCircleAlert, color: 'text-rojo-100' },
}

/** Selector de vista: es el "cambiar usuario" del header. */
function MenuUsuario({ vista, onCambiar }) {
  const [abierto, setAbierto] = useState(false)
  const caja = useRef(null)

  // Sin el clic afuera el menú se queda abierto encima del contenido.
  useEffect(() => {
    if (!abierto) return
    const fuera = (e) => {
      if (!caja.current?.contains(e.target)) setAbierto(false)
    }
    document.addEventListener('mousedown', fuera)
    return () => document.removeEventListener('mousedown', fuera)
  }, [abierto])

  return (
    <div className="relative" ref={caja}>
      <button
        onClick={() => setAbierto((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={abierto}
        title="Cambiar usuario"
        className={cx(
          'flex items-center gap-2 rounded-sm border px-2 py-1 transition-colors duration-100',
          abierto ? 'border-line-strong bg-surface-2' : 'border-transparent hover:bg-surface-2',
        )}
      >
        <span className="hidden flex-col items-end whitespace-nowrap leading-tight sm:flex">
          <span className="text-base font-bold text-ink">{vista.usuario}</span>
          <span className="text-sm text-ink-3">{vista.area}</span>
        </span>
        <LuChevronDown
          size={15}
          className={cx('shrink-0 text-ink-3 transition-transform duration-150', abierto && 'rotate-180')}
        />
      </button>

      {abierto && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-1.5 w-64 overflow-hidden rounded-sm border border-line bg-surface shadow-[0_14px_32px_-12px_rgba(0,28,44,0.45)]"
        >
          <div className="lbl border-b border-line px-3 py-2">Cambiar usuario</div>
          {VISTAS.map((v) => {
            const activa = v.id === vista.id
            const Icono = v.icono
            return (
              <button
                key={v.id}
                role="menuitem"
                onClick={() => {
                  onCambiar(v.id)
                  setAbierto(false)
                }}
                className={cx(
                  'flex w-full items-center gap-2.5 px-3 py-2.5 text-left transition-colors duration-100',
                  activa ? 'bg-navy-50' : 'hover:bg-surface-2',
                )}
              >
                <Icono size={17} strokeWidth={1.9} className="shrink-0 text-navy-700" />
                <span className="min-w-0 flex-1 leading-tight">
                  <span className={cx('block text-sm', activa ? 'font-bold text-navy-800' : 'text-ink')}>
                    {v.rotulo}
                  </span>
                  <span className="block text-xs text-ink-3">{v.usuario} · {v.area}</span>
                </span>
                {activa && <LuCheck size={15} strokeWidth={2.6} className="shrink-0 text-teal-600" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

/** Lo que se ve mientras se baja el archivo de la pantalla. */
function Cargando() {
  return (
    <div className="flex h-full items-center justify-center">
      <span className="flex items-center gap-2.5 text-sm text-ink-3">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-line-strong border-t-navy-600" />
        Cargando pantalla…
      </span>
    </div>
  )
}

/** Lo que se ve mientras una vista no tenga módulos. */
function SinModulos({ vista }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
      <vista.icono size={30} strokeWidth={1.6} className="text-ink-4" />
      <span className="text-lg font-bold text-navy-800">{vista.rotulo}</span>
      <span className="max-w-sm text-sm text-ink-3">
        Todavía no tiene módulos habilitados. Cambiá de usuario desde el menú del encabezado.
      </span>
    </div>
  )
}

export default function Shell() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { avisos, vista, setVista } = useOc()
  const [plegado, setPlegado] = useState(false)

  // Cambiar de vista tiene que mover la ruta: si no, el header dice una cosa y
  // el <Outlet/> sigue mostrando la pantalla del portal anterior.
  const cambiarVista = (id) => {
    setVista(id)
    const destino = VISTAS.find((v) => v.id === id)?.modulos[0]?.to
    if (destino) navigate(destino)
  }

  const vistaActual = VISTAS.find((v) => v.id === vista) ?? VISTAS[0]
  const modulos = vistaActual.modulos
  // Sin módulos no hay módulo activo: el header y el main lo tienen que contemplar.
  const modulo = modulos.find((m) => m.rutas.some((r) => pathname.startsWith(r))) ?? modulos[0] ?? null
  const idxPaso = Math.max(
    0,
    PASOS.findIndex((p) => pathname.startsWith(p.to)),
  )

  return (
    <div className="flex h-full">
      {/* El color de marca vive acá: el resto del cromo es blanco.
          El ancho es lo único que se anima; los rótulos se recortan al cerrarse. */}
      <nav
        className={cx(
          'flex shrink-0 flex-col overflow-hidden bg-navy-800 text-white',
          'transition-[width] duration-200 ease-[var(--ease-out-soft)] motion-reduce:transition-none',
          plegado ? 'w-14' : 'w-[242px]',
        )}
      >
        <div className="flex h-14 items-center gap-2 border-b border-white/15 px-3">
          <span
            className={cx(
              'min-w-0 flex-1 overflow-hidden whitespace-nowrap text-lg font-bold',
              'transition-opacity duration-150 ease-[var(--ease-out-soft)]',
              plegado && 'pointer-events-none opacity-0',
            )}
          >
            Vesta
          </span>
          <button
            onClick={() => setPlegado((v) => !v)}
            title={plegado ? 'Expandir menú' : 'Plegar menú'}
            aria-label={plegado ? 'Expandir menú' : 'Plegar menú'}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm text-white/80 transition-colors duration-100 hover:bg-white/15 hover:text-white"
          >
            {plegado ? <LuPanelLeftOpen size={16} /> : <LuPanelLeftClose size={16} />}
          </button>
        </div>

        <div className="flex flex-col gap-1 p-2">
          {!modulos.length && !plegado && (
            <span className="px-2.5 py-2 text-xs leading-snug text-white/55">
              Esta vista todavía no tiene módulos.
            </span>
          )}
          {modulos.map(({ id, titulo, sub, icono: Icono, to }) => {
            const activo = modulo?.id === id
            return (
              <NavLink
                key={id}
                to={to}
                title={plegado ? titulo + ' · ' + sub : undefined}
                className={cx(
                  'relative flex items-center gap-2.5 rounded-sm px-2.5 py-2.5 no-underline transition-colors duration-100',
                  activo ? 'bg-white/18 text-white' : 'text-white/80 hover:bg-white/10 hover:text-white',
                  activo &&
                    'before:absolute before:-left-2 before:inset-y-1.5 before:w-[3px] before:rounded-r-sm before:bg-rojo-600',
                )}
              >
                <Icono size={17} strokeWidth={1.9} className="shrink-0" />
                <span
                  className={cx(
                    'min-w-0 flex-1 overflow-hidden whitespace-nowrap',
                    'transition-opacity duration-150 ease-[var(--ease-out-soft)]',
                    plegado && 'pointer-events-none opacity-0',
                  )}
                >
                  <span className={cx('block text-base', activo ? 'font-bold' : 'font-medium')}>
                    {titulo}
                  </span>
                  <span className="block text-xs text-white/65">{sub}</span>
                </span>
              </NavLink>
            )
          })}
        </div>

        <div className="flex-1" />
      </nav>

      <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
        {/* Header blanco */}
        <header className="flex h-14 shrink-0 items-center gap-4 border-b border-line bg-surface px-6">
          <div className="min-w-0">
            <h1 className="truncate text-xl font-bold text-navy-800">
              {modulo ? modulo.titulo : vistaActual.rotulo}
            </h1>
            <span className="block text-sm text-ink-3">
              {modulo ? modulo.sub : 'Sin módulos habilitados'}
            </span>
          </div>

          <div className="flex-1" />

          <MenuUsuario vista={vistaActual} onCambiar={cambiarVista} />
          <button
            title="Salir"
            aria-label="Salir"
            className="flex h-8 w-8 items-center justify-center rounded-sm border border-line text-ink-3 transition-colors duration-100 hover:border-rojo-100 hover:bg-rojo-50 hover:text-rojo-700"
          >
            <LuLogOut size={15} />
          </button>
        </header>

        {/* El stepper solo tiene sentido dentro del flujo */}
        {modulo?.id === 'flujo' && (
          <nav className="shrink-0 border-b border-line bg-surface">
            <div className="contenedor flex items-center overflow-x-auto py-2">
              {PASOS.map(({ paso, to, titulo }, i) => {
                const hecho = i < idxPaso
                return (
                  <Fragment key={to}>
                    {/* El tramo se pinta cuando el paso anterior ya se completó */}
                    {i > 0 && (
                      <span
                        className={cx(
                          'mx-1 h-0.5 min-w-[18px] flex-1 rounded-full transition-colors duration-150',
                          i <= idxPaso ? 'bg-teal-600' : 'bg-line',
                        )}
                      />
                    )}
                    <NavLink
                      to={to}
                      className={({ isActive }) =>
                        cx(
                          'flex shrink-0 items-center gap-2.5 rounded-md px-2.5 py-1.5 no-underline transition-colors duration-100',
                          isActive ? 'bg-navy-50' : 'hover:bg-surface-2',
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          {/* El número vive en el círculo: no hace falta repetirlo de rótulo */}
                          <span
                            className={cx(
                              'flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full text-sm font-bold transition-colors duration-100',
                              isActive
                                ? 'bg-navy-800 text-white ring-4 ring-navy-100'
                                : hecho
                                  ? 'bg-teal-600 text-white'
                                  : 'border border-line-strong bg-surface text-ink-3',
                            )}
                          >
                            {hecho ? <LuCheck size={13} strokeWidth={3} /> : paso}
                          </span>
                          <span
                            className={cx(
                              'whitespace-nowrap text-base',
                              isActive
                                ? 'font-bold text-navy-800'
                                : hecho
                                  ? 'font-medium text-ink-2'
                                  : 'text-ink-3',
                            )}
                          >
                            {titulo}
                          </span>
                        </>
                      )}
                    </NavLink>
                  </Fragment>
                )
              })}
            </div>
          </nav>
        )}

        <main className="min-h-0 flex-1 overflow-auto">
          <Suspense fallback={<Cargando />}>
            {modulo ? <Outlet /> : <SinModulos vista={vistaActual} />}
          </Suspense>
        </main>
      </div>

      <div
        role="status"
        aria-live="polite"
        className="fixed bottom-5 right-5 z-[200] flex max-w-[380px] flex-col gap-2"
      >
        {avisos.map((a) => {
          const { icono: Icono, color } = AVISO[a.tono] ?? AVISO.ok
          return (
            <div
              key={a.id}
              className="flex items-start gap-2.5 rounded-sm bg-navy-800 px-3 py-2.5 text-sm leading-snug text-white shadow-[0_10px_28px_-10px_rgba(0,28,44,0.55)] motion-safe:animate-[rise_170ms_var(--ease-out-soft)]"
            >
              <Icono size={15} className={cx('mt-px shrink-0', color)} />
              <span>{a.texto}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
