import { NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  LuCheck,
  LuCircleAlert,
  LuCircleCheck,
  LuLogOut,
  LuTriangleAlert,
} from 'react-icons/lu'
import { useOc } from '../data/store'
import { cx } from './ui/Button'

export const PASOS = [
  { paso: 1, to: '/orden-compra', titulo: 'Crear Orden de Compra' },
  { paso: 2, to: '/despachos', titulo: 'Crear Despacho' },
  { paso: 3, to: '/seguimiento', titulo: 'Seguimiento de Despacho' },
  { paso: 4, to: '/gestiones', titulo: 'Crear Gestiones' },
]

const AVISO = {
  ok: { icono: LuCircleCheck, color: 'text-teal-100' },
  alerta: { icono: LuTriangleAlert, color: 'text-ambar-100' },
  rojo: { icono: LuCircleAlert, color: 'text-rojo-100' },
}

export default function Shell() {
  const { pathname } = useLocation()
  const { avisos } = useOc()
  const actualIdx = Math.max(
    0,
    PASOS.findIndex((p) => pathname.startsWith(p.to)),
  )

  return (
    <div className="flex h-full flex-col">
      {/* Banda superior del portal: marca a la izquierda, usuario a la derecha */}
      <header className="shrink-0 bg-head text-white">
        <div className="contenedor flex h-11 items-center gap-3">
        <h1 className="text-lg font-normal">Portal</h1>

        <div className="flex-1" />

        <span className="hidden text-white/25 sm:inline">|</span>
        <span className="hidden text-sm sm:inline">
          Bienvenido <strong className="font-semibold">User</strong>
        </span>
        <button
          title="Salir"
          className="flex h-7 items-center gap-1.5 rounded-xs border border-white/25 bg-white/8 px-2.5 text-xs text-white transition-colors duration-100 hover:bg-rojo-600 hover:border-rojo-600"
        >
          <LuLogOut size={13} />
          Salir
          </button>
        </div>
      </header>

      {/* Stepper: el recorrido del flujo, en el lugar donde el portal tiene su barra de nav */}
      <nav className="shrink-0 bg-nav">
        <div className="contenedor flex items-stretch overflow-x-auto">
        {PASOS.map(({ paso, to, titulo }, i) => {
          const hecho = i < actualIdx
          return (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cx(
                  'group relative flex shrink-0 items-center gap-2.5 py-2 pl-4 pr-6 no-underline transition-colors duration-100 first:pl-0',
                  isActive ? 'bg-nav-hover text-white' : 'text-white/80 hover:bg-nav-hover/60 hover:text-white',
                  // subrayado rojo de marca en el paso donde está parado el usuario
                  isActive &&
                    'after:absolute after:inset-x-0 after:bottom-0 after:h-[3px] after:bg-rojo-600',
                )
              }
            >
              {({ isActive }) => (
                <>
                  {/* conector entre pasos */}
                  {i > 0 && <span className="absolute left-0 top-1/2 h-px w-4 -translate-y-1/2 bg-white/30" />}

                  <span
                    className={cx(
                      'flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition-colors duration-100',
                      isActive
                        ? 'border-white bg-white text-nav-hover'
                        : hecho
                          ? 'border-white/55 bg-white/25 text-white'
                          : 'border-white/45 text-white/80',
                    )}
                  >
                    {hecho ? <LuCheck size={12} strokeWidth={3} /> : paso}
                  </span>

                  <span className="flex flex-col leading-tight">
                    <span className="text-3xs text-white/70">
                      Paso {paso}
                    </span>
                    <span className={cx('text-sm', isActive ? 'font-semibold' : 'font-medium')}>
                      {titulo}
                    </span>
                  </span>
                </>
              )}
            </NavLink>
          )
          })}
        </div>
      </nav>

      <main className="min-h-0 flex-1 overflow-auto">
        <Outlet />
      </main>

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
              className="flex items-start gap-2.5 rounded-sm bg-head px-3 py-2.5 text-sm leading-snug text-white shadow-[0_10px_28px_-10px_rgba(0,28,44,0.55)] motion-safe:animate-[rise_170ms_var(--ease-out-soft)]"
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
