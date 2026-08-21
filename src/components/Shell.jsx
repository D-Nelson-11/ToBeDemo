import { useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  LuCheck,
  LuCircleAlert,
  LuCircleCheck,
  LuLogOut,
  LuPanelLeftClose,
  LuPanelLeftOpen,
  LuTowerControl,
  LuTriangleAlert,
  LuWorkflow,
} from 'react-icons/lu'
import { useOc } from '../data/store'
import { cx } from './ui/Button'

export const PASOS = [
  { paso: 1, to: '/orden-compra', titulo: 'Crear Orden de Compra' },
  { paso: 2, to: '/despachos', titulo: 'Crear Despacho' },
  { paso: 3, to: '/seguimiento', titulo: 'Seguimiento de Despacho' },
  { paso: 4, to: '/gestiones', titulo: 'Crear Gestiones' },
]

// Dos módulos: el flujo paso a paso y la vista de monitoreo.
export const MODULOS = [
  {
    id: 'flujo',
    titulo: 'Despachos',
    sub: 'Flujo paso a paso',
    icono: LuWorkflow,
    to: PASOS[0].to,
    rutas: PASOS.map((p) => p.to),
  },
  {
    id: 'torre',
    titulo: 'Torre de control',
    sub: 'Monitoreo de embarques',
    icono: LuTowerControl,
    to: '/torre',
    rutas: ['/torre'],
  },
]

const AVISO = {
  ok: { icono: LuCircleCheck, color: 'text-teal-100' },
  alerta: { icono: LuTriangleAlert, color: 'text-ambar-100' },
  rojo: { icono: LuCircleAlert, color: 'text-rojo-100' },
}

export default function Shell() {
  const { pathname } = useLocation()
  const { avisos } = useOc()
  const [plegado, setPlegado] = useState(false)

  const modulo = MODULOS.find((m) => m.rutas.some((r) => pathname.startsWith(r))) ?? MODULOS[0]
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
          'flex shrink-0 flex-col overflow-hidden bg-head text-white',
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
          {MODULOS.map(({ id, titulo, sub, icono: Icono, to }) => {
            const activo = modulo.id === id
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
            <h1 className="truncate text-xl font-bold text-navy-800">{modulo.titulo}</h1>
            <span className="block text-sm text-ink-3">{modulo.sub}</span>
          </div>

          <div className="flex-1" />

          <div className="hidden flex-col items-end whitespace-nowrap leading-tight sm:flex">
            <span className="text-base font-bold text-ink">User</span>
            <span className="text-sm text-ink-3">Abastecimiento</span>
          </div>
          <button
            title="Salir"
            aria-label="Salir"
            className="flex h-8 w-8 items-center justify-center rounded-sm border border-line text-ink-3 transition-colors duration-100 hover:border-rojo-100 hover:bg-rojo-50 hover:text-rojo-700"
          >
            <LuLogOut size={15} />
          </button>
        </header>

        {/* El stepper solo tiene sentido dentro del flujo */}
        {modulo.id === 'flujo' && (
          <nav className="shrink-0 border-b border-line bg-surface-2">
            <div className="contenedor flex items-stretch overflow-x-auto">
              {PASOS.map(({ paso, to, titulo }, i) => {
                const hecho = i < idxPaso
                return (
                  <NavLink
                    key={to}
                    to={to}
                    className={({ isActive }) =>
                      cx(
                        'relative flex shrink-0 items-center gap-2.5 py-2.5 pl-4 pr-6 no-underline transition-colors duration-100 first:pl-0',
                        isActive ? 'text-navy-800' : 'text-ink-2 hover:text-navy-700',
                        isActive &&
                          'after:absolute after:inset-x-0 after:bottom-0 after:h-[3px] after:bg-rojo-600',
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {i > 0 && (
                          <span className="absolute left-0 top-1/2 h-px w-4 -translate-y-1/2 bg-line-strong" />
                        )}
                        <span
                          className={cx(
                            'flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border text-xs font-bold transition-colors duration-100',
                            isActive
                              ? 'border-navy-800 bg-navy-800 text-white'
                              : hecho
                                ? 'border-teal-600 bg-teal-600 text-white'
                                : 'border-line-strong text-ink-3',
                          )}
                        >
                          {hecho ? <LuCheck size={12} strokeWidth={3} /> : paso}
                        </span>
                        <span className="flex flex-col leading-tight">
                          <span className="text-3xs text-ink-4">Paso {paso}</span>
                          <span className={cx('text-sm', isActive ? 'font-bold' : 'font-medium')}>
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
        )}

        <main className="min-h-0 flex-1 overflow-auto">
          <Outlet />
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
