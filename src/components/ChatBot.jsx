import { useEffect, useRef, useState } from 'react'
import { LuBot, LuChevronUp, LuMessageCircle, LuMinus, LuSendHorizontal, LuX } from 'react-icons/lu'
import { useOc } from '../data/store'
import { BIENVENIDA, SUGERENCIAS, datosTorre, responder } from '../lib/chatbot'
import { cx } from './ui/Button'

const CLAVE = 'tobe.chatbot'
const NOMBRE = 'Asistente Supply Hub'
const SOMBRA = 'shadow-[0_18px_44px_-14px_rgba(0,28,44,0.5)]'

const PUNTO = { teal: 'bg-teal-600', ambar: 'bg-ambar-500', rojo: 'bg-rojo-600' }

// El storage puede tirar en modo privado o con datos bloqueados: sin él arranca cerrado.
function leerModo() {
  try {
    const v = localStorage.getItem(CLAVE)
    return v === 'abierto' || v === 'minimizado' ? v : 'cerrado'
  } catch {
    return 'cerrado'
  }
}

function guardarModo(modo) {
  try {
    localStorage.setItem(CLAVE, modo)
  } catch {
    /* sin storage solo se pierde recordar el estado */
  }
}

let ultimoId = 0
const mensaje = (de, contenido) => ({ id: ++ultimoId, de, ...contenido })

function Burbuja({ msg }) {
  if (msg.de === 'yo') {
    return (
      <div className="flex justify-end">
        <p className="max-w-[80%] rounded-md rounded-br-xs bg-navy-800 px-3 py-2 text-base leading-snug text-white">
          {msg.texto}
        </p>
      </div>
    )
  }
  return (
    <div className="flex items-end gap-2">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-navy-50 text-navy-700">
        <LuBot size={14} />
      </span>
      <div className="max-w-[85%] rounded-md rounded-bl-xs border border-line-soft bg-surface-2 px-3 py-2 text-base leading-snug text-ink">
        <p>{msg.texto}</p>
        {msg.items?.length > 0 && (
          <ul className="mt-2 flex flex-col divide-y divide-line-soft overflow-hidden rounded-sm border border-line-soft bg-surface">
            {msg.items.map((it) => (
              <li key={it.titulo} className="flex items-center gap-2 px-2.5 py-1.5">
                <span className={cx('h-2 w-2 shrink-0 rounded-full', PUNTO[it.tono] ?? 'bg-navy-400')} />
                <span className="num shrink-0 whitespace-nowrap font-semibold text-navy-800">{it.titulo}</span>
                <span className="min-w-0 flex-1 truncate text-right text-xs text-ink-3">{it.detalle}</span>
              </li>
            ))}
          </ul>
        )}
        {msg.pie && <p className="mt-2 text-xs text-ink-3">{msg.pie}</p>}
      </div>
    </div>
  )
}

function Escribiendo() {
  return (
    <div className="flex items-end gap-2" aria-label="El asistente está escribiendo">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-navy-50 text-navy-700">
        <LuBot size={14} />
      </span>
      <span className="flex items-center gap-1 rounded-md rounded-bl-xs border border-line-soft bg-surface-2 px-3 py-2.5">
        {[0, 150, 300].map((d) => (
          <span
            key={d}
            style={{ animationDelay: `${d}ms` }}
            className="h-1.5 w-1.5 rounded-full bg-navy-400 motion-safe:animate-bounce"
          />
        ))}
      </span>
    </div>
  )
}

export default function ChatBot() {
  const { ordenes, recolectas } = useOc()
  const [modo, setModo] = useState(leerModo)
  const [mensajes, setMensajes] = useState(() => [mensaje('bot', BIENVENIDA)])
  const [texto, setTexto] = useState('')
  const [escribiendo, setEscribiendo] = useState(false)
  const lista = useRef(null)
  const campo = useRef(null)
  const timer = useRef(null)

  useEffect(() => guardarModo(modo), [modo])
  useEffect(() => () => clearTimeout(timer.current), [])

  useEffect(() => {
    if (modo === 'abierto') lista.current?.scrollTo({ top: lista.current.scrollHeight, behavior: 'smooth' })
  }, [mensajes, escribiendo, modo])

  useEffect(() => {
    if (modo === 'abierto') campo.current?.focus()
  }, [modo])

  const enviar = (pregunta) => {
    const t = pregunta.trim()
    if (!t || escribiendo) return
    setMensajes((m) => [...m, mensaje('yo', { texto: t })])
    setTexto('')
    setEscribiendo(true)
    // Los datos se toman ahora y no al responder: la pregunta es sobre este momento.
    const datos = datosTorre(ordenes, recolectas)
    timer.current = setTimeout(() => {
      setMensajes((m) => [...m, mensaje('bot', responder(t, datos))])
      setEscribiendo(false)
    }, 650 + Math.random() * 500)
  }

  // Cerrar sí descarta la conversación; minimizar la conserva.
  const cerrar = () => {
    clearTimeout(timer.current)
    setEscribiendo(false)
    setMensajes([mensaje('bot', BIENVENIDA)])
    setModo('cerrado')
  }

  if (modo === 'cerrado') {
    return (
      <button
        onClick={() => setModo('abierto')}
        title={NOMBRE}
        aria-label={'Abrir ' + NOMBRE}
        className={cx(
          'fixed bottom-5 right-5 z-[190] flex h-13 w-13 items-center justify-center rounded-full bg-navy-800 text-white',
          'transition-[background-color,transform] duration-100 ease-[var(--ease-out-soft)] hover:bg-navy-700 active:scale-95',
          'motion-safe:animate-[rise_170ms_var(--ease-out-soft)]',
          SOMBRA,
        )}
      >
        <LuMessageCircle size={22} />
      </button>
    )
  }

  if (modo === 'minimizado') {
    return (
      <button
        onClick={() => setModo('abierto')}
        aria-label={'Restaurar ' + NOMBRE}
        className={cx(
          'fixed bottom-5 right-5 z-[190] flex h-11 w-[min(calc(100vw-2.5rem),260px)] items-center gap-2.5 rounded-lg bg-navy-800 px-3.5 text-left text-white',
          'transition-colors duration-100 hover:bg-navy-700 motion-safe:animate-[rise_170ms_var(--ease-out-soft)]',
          SOMBRA,
        )}
      >
        <LuBot size={17} className="shrink-0" />
        <span className="min-w-0 flex-1 truncate text-base font-semibold">{NOMBRE}</span>
        {escribiendo && <span className="text-xs text-white/70">escribiendo…</span>}
        <LuChevronUp size={16} className="shrink-0 text-white/70" />
      </button>
    )
  }

  return (
    <section
      aria-label={NOMBRE}
      className={cx(
        'panel fixed bottom-4 right-4 z-[190] flex flex-col',
        'h-[min(520px,calc(100dvh-2rem))] w-[calc(100vw-2rem)] sm:bottom-5 sm:right-5 sm:w-[360px]',
        'motion-safe:animate-[rise_170ms_var(--ease-out-soft)]',
        SOMBRA,
      )}
    >
      <header className="flex shrink-0 items-center gap-2.5 bg-navy-800 px-3.5 py-2.5 text-white">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/15">
          <LuBot size={17} />
        </span>
        <span className="min-w-0 flex-1 leading-tight">
          <span className="block truncate text-base font-bold">{NOMBRE}</span>
          <span className="flex items-center gap-1.5 text-xs text-white/70">
            <span className="h-1.5 w-1.5 rounded-full bg-teal-100" />
            {escribiendo ? 'Escribiendo…' : 'En línea · demo'}
          </span>
        </span>
        <button
          onClick={() => setModo('minimizado')}
          title="Minimizar"
          aria-label="Minimizar"
          className="flex h-7 w-7 items-center justify-center rounded-sm text-white/70 transition-colors duration-100 hover:bg-white/15 hover:text-white"
        >
          <LuMinus size={16} />
        </button>
        <button
          onClick={cerrar}
          title="Cerrar y descartar conversación"
          aria-label="Cerrar"
          className="flex h-7 w-7 items-center justify-center rounded-sm text-white/70 transition-colors duration-100 hover:bg-white/15 hover:text-white"
        >
          <LuX size={16} />
        </button>
      </header>

      <div ref={lista} role="log" aria-live="polite" className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto bg-surface px-3.5 py-3.5">
        {mensajes.map((m) => (
          <Burbuja key={m.id} msg={m} />
        ))}
        {escribiendo && <Escribiendo />}
      </div>

      <div className="shrink-0 border-t border-line-soft bg-surface px-3.5 pb-3.5 pt-2.5">
        <div className="-mx-3.5 mb-2.5 flex gap-1.5 overflow-x-auto px-3.5 [scrollbar-width:none]">
          {SUGERENCIAS.map((s) => (
            <button
              key={s}
              onClick={() => enviar(s)}
              disabled={escribiendo}
              className="shrink-0 whitespace-nowrap rounded-full border border-line-strong bg-surface px-2.5 py-1 text-xs font-medium text-navy-700 transition-colors duration-100 hover:not-disabled:border-navy-200 hover:not-disabled:bg-navy-50 disabled:opacity-45"
            >
              {s}
            </button>
          ))}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            enviar(texto)
          }}
          className="flex items-center gap-2"
        >
          <input
            ref={campo}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Escribí tu consulta…"
            aria-label="Consulta para el asistente"
            className="inp"
          />
          <button
            type="submit"
            disabled={!texto.trim() || escribiendo}
            aria-label="Enviar"
            title="Enviar"
            className="btn btn-primary w-8 shrink-0 px-0"
          >
            <LuSendHorizontal size={15} />
          </button>
        </form>
      </div>
    </section>
  )
}
