import { useMemo, useState } from 'react'
import {
  LuArchive,
  LuArrowLeft,
  LuForward,
  LuInbox,
  LuMaximize2,
  LuMinus,
  LuPaperclip,
  LuPencil,
  LuReply,
  LuSearch,
  LuSend,
  LuStar,
  LuTag,
  LuTrash2,
  LuX,
} from 'react-icons/lu'
import Button, { cx } from '../components/ui/Button'
import { useOc } from '../data/store'
import { BANDEJA, ETIQUETAS, MI_CORREO } from '../data/bandeja'

const CARPETAS = [
  { id: 'recibidos', rotulo: 'Recibidos', icono: LuInbox },
  { id: 'destacados', rotulo: 'Destacados', icono: LuStar },
  { id: 'enviados', rotulo: 'Enviados', icono: LuSend },
  { id: 'archivados', rotulo: 'Archivados', icono: LuArchive },
]

const TONOS_AVATAR = ['bg-navy-600', 'bg-teal-600', 'bg-ambar-600', 'bg-navy-400', 'bg-rojo-600']

const REDACTAR_VACIO = { abierto: false, minimizado: false, para: '', asunto: '', cuerpo: '' }

function iniciales(nombre) {
  return nombre
    .replace(/[^\p{L}\s]/gu, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('')
}

function Avatar({ nombre, grande }) {
  const tono = TONOS_AVATAR[[...nombre].reduce((a, c) => a + c.charCodeAt(0), 0) % TONOS_AVATAR.length]
  return (
    <span
      className={cx(
        'flex shrink-0 items-center justify-center rounded-full font-bold text-white',
        grande ? 'h-10 w-10 text-sm' : 'h-7 w-7 text-2xs',
        tono,
      )}
    >
      {iniciales(nombre) || '?'}
    </span>
  )
}

// Hoy se ve la hora; lo anterior, el día. Igual que cualquier bandeja.
function cuando(fecha) {
  const hoy = new Date()
  if (fecha.toDateString() === hoy.toDateString())
    return fecha.toLocaleTimeString('es-HN', { hour: '2-digit', minute: '2-digit' })
  return fecha.toLocaleDateString('es-HN', { day: '2-digit', month: 'short' })
}

/** Los hilos por OC del store (proveedor ↔ comprador) entran a la bandeja como un correo más. */
function correosDeHilos(hilos, ordenes) {
  return Object.entries(hilos).flatMap(([ocId, hilo]) => {
    const oc = ordenes.find((o) => o.id === ocId)
    return hilo.map((c) => ({
      id: c.id,
      de: c.direccion === 'enviado' ? 'Yo' : (oc?.proveedor ?? c.de),
      correo: c.direccion === 'enviado' ? MI_CORREO : c.de,
      para: c.para,
      asunto: c.asunto,
      cuerpo: c.cuerpo,
      etiqueta: 'Proveedores',
      fecha: new Date(c.fecha),
      enviado: c.direccion === 'enviado',
      leido: c.direccion === 'enviado',
    }))
  })
}

/** Correo simulado del especialista: la bandeja donde llegan MSF, BL, aduana y proveedores. */
export default function Correo() {
  const { hilos, ordenes, avisar } = useOc()
  const [carpeta, setCarpeta] = useState('recibidos')
  const [etiqueta, setEtiqueta] = useState('')
  const [q, setQ] = useState('')
  const [abierto, setAbierto] = useState(null)
  // Lo que el usuario cambia encima del mock: leído, destacado, archivado, borrado.
  const [marcas, setMarcas] = useState({})
  const [propios, setPropios] = useState([])
  const [redactar, setRedactar] = useState(REDACTAR_VACIO)
  // `ahora` fijo al montar: si no, cada render movería las horas del mock.
  const [ahora] = useState(() => Date.now())

  const correos = useMemo(() => {
    const base = BANDEJA.map((m) => ({ ...m, fecha: new Date(ahora - m.hace * 60000) }))
    return [...base, ...correosDeHilos(hilos, ordenes), ...propios]
      .map((m) => ({ ...m, ...marcas[m.id] }))
      .filter((m) => !m.borrado)
      .sort((a, b) => b.fecha - a.fecha)
  }, [ahora, hilos, ordenes, propios, marcas])

  const marcar = (id, patch) => setMarcas((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }))

  const enCarpeta = (m, c) =>
    c === 'recibidos'
      ? !m.enviado && !m.archivado
      : c === 'destacados'
        ? m.destacado
        : c === 'enviados'
          ? m.enviado
          : m.archivado

  const lista = useMemo(() => {
    const t = q.toLowerCase().trim()
    return correos.filter(
      (m) =>
        enCarpeta(m, carpeta) &&
        (!etiqueta || m.etiqueta === etiqueta) &&
        (!t || `${m.de} ${m.asunto} ${m.cuerpo}`.toLowerCase().includes(t)),
    )
  }, [correos, carpeta, etiqueta, q])

  const sinLeer = correos.filter((m) => enCarpeta(m, 'recibidos') && !m.leido).length
  const actual = correos.find((m) => m.id === abierto)

  const abrir = (m) => {
    setAbierto(m.id)
    if (!m.leido) marcar(m.id, { leido: true })
  }

  const responder = (m, reenviar = false) =>
    setRedactar({
      abierto: true,
      minimizado: false,
      para: reenviar ? '' : m.correo,
      asunto: `${reenviar ? 'RV' : 'RE'}: ${m.asunto}`,
      cuerpo: `\n\n----- ${m.de} escribió -----\n${m.cuerpo}`,
    })

  const enviar = () => {
    if (!redactar.para.trim()) return avisar('Agregá al menos un destinatario.', 'alerta')
    setPropios((p) => [
      ...p,
      {
        id: 'p' + Date.now(),
        de: 'Yo',
        correo: MI_CORREO,
        para: redactar.para,
        asunto: redactar.asunto || '(sin asunto)',
        cuerpo: redactar.cuerpo,
        etiqueta: '',
        fecha: new Date(),
        enviado: true,
        leido: true,
      },
    ])
    setRedactar(REDACTAR_VACIO)
    avisar('Mensaje enviado.', 'ok')
  }

  return (
    <div className="contenedor py-4">
      <div className="flex h-[calc(100dvh-6rem)] min-h-[520px] gap-4">
        {/* ------------------------------ carpetas ------------------------------ */}
        <aside className="hidden w-[210px] shrink-0 flex-col gap-4 md:flex">
          <Button
            variant="primary"
            className="h-11! justify-start rounded-lg! px-4!"
            onClick={() => setRedactar({ ...REDACTAR_VACIO, abierto: true })}
          >
            <LuPencil size={15} /> Redactar
          </Button>

          <ul className="m-0 flex list-none flex-col gap-0.5 p-0">
            {CARPETAS.map((c) => (
              <li key={c.id}>
                <button
                  onClick={() => {
                    setCarpeta(c.id)
                    setAbierto(null)
                  }}
                  className={cx(
                    'flex w-full items-center gap-3 rounded-r-full px-3 py-1.5 text-left text-base transition-colors duration-100',
                    carpeta === c.id ? 'bg-navy-100 font-bold text-navy-800' : 'text-ink-2 hover:bg-surface-3',
                  )}
                >
                  <c.icono size={15} />
                  {c.rotulo}
                  {c.id === 'recibidos' && sinLeer > 0 && (
                    <span className="num ml-auto text-xs font-bold">{sinLeer}</span>
                  )}
                </button>
              </li>
            ))}
          </ul>

          <div>
            <div className="lbl mb-1.5 px-3">Etiquetas</div>
            <ul className="m-0 flex list-none flex-col gap-0.5 p-0">
              {Object.entries(ETIQUETAS).map(([nombre, color]) => (
                <li key={nombre}>
                  <button
                    onClick={() => {
                      setEtiqueta(etiqueta === nombre ? '' : nombre)
                      setAbierto(null)
                    }}
                    className={cx(
                      'flex w-full items-center gap-3 rounded-r-full px-3 py-1.5 text-left text-sm transition-colors duration-100',
                      etiqueta === nombre ? 'bg-navy-50 font-bold text-navy-800' : 'text-ink-2 hover:bg-surface-3',
                    )}
                  >
                    <span className={cx('h-2.5 w-2.5 rounded-full', color)} />
                    {nombre}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* ------------------------------- bandeja ------------------------------- */}
        <section className="panel flex min-w-0 flex-1 flex-col overflow-hidden">
          <div className="flex items-center gap-2 border-b border-line px-3 py-2">
            <div className="relative flex flex-1 items-center">
              <LuSearch size={14} className="pointer-events-none absolute left-3 text-ink-4" />
              <input
                className="inp rounded-full! border-transparent! bg-surface-3! pl-9"
                placeholder="Buscar correo"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
            {etiqueta && (
              <button
                onClick={() => setEtiqueta('')}
                className="flex items-center gap-1 rounded-full bg-navy-50 px-2.5 py-1 text-xs font-semibold text-navy-700"
              >
                <LuTag size={11} /> {etiqueta} <LuX size={11} />
              </button>
            )}
          </div>

          {!actual && (
            <ul className="m-0 min-h-0 flex-1 list-none overflow-y-auto p-0">
              {lista.length === 0 && (
                <li className="p-10 text-center text-sm text-ink-3">No tienes correos en esta carpeta.</li>
              )}
              {lista.map((m) => (
                <li
                  key={m.id}
                  onClick={() => abrir(m)}
                  className={cx(
                    'group flex cursor-pointer items-center gap-3 border-b border-line-soft px-3 py-2 text-sm transition-colors duration-100 hover:bg-surface-2',
                    !m.leido && 'bg-surface font-bold',
                    m.leido && 'bg-surface-2/40',
                  )}
                >
                  <button
                    title={m.destacado ? 'Quitar destacado' : 'Destacar'}
                    onClick={(e) => {
                      e.stopPropagation()
                      marcar(m.id, { destacado: !m.destacado })
                    }}
                    className="shrink-0"
                  >
                    <LuStar
                      size={15}
                      className={m.destacado ? 'fill-ambar-500 text-ambar-500' : 'text-ink-4 hover:text-ink-2'}
                    />
                  </button>
                  <span className={cx('w-[170px] shrink-0 truncate', m.leido ? 'text-ink-2' : 'text-ink')}>
                    {m.enviado ? `Para: ${m.para}` : m.de}
                  </span>
                  <span className="flex min-w-0 flex-1 items-center gap-2">
                    {m.etiqueta && (
                      <span className="flex shrink-0 items-center gap-1 rounded-xs bg-surface-3 px-1.5 py-px text-3xs font-semibold text-ink-2">
                        <span className={cx('h-1.5 w-1.5 rounded-full', ETIQUETAS[m.etiqueta])} />
                        {m.etiqueta}
                      </span>
                    )}
                    <span className="truncate">
                      <span className={m.leido ? 'text-ink-2' : 'text-ink'}>{m.asunto}</span>
                      <span className="font-normal text-ink-3"> — {m.cuerpo.replace(/\s+/g, ' ').slice(0, 90)}</span>
                    </span>
                  </span>
                  {m.adjuntos?.length > 0 && <LuPaperclip size={13} className="shrink-0 text-ink-4" />}
                  <span className={cx('num w-[52px] shrink-0 text-right text-xs', m.leido ? 'text-ink-3' : 'text-ink')}>
                    {cuando(m.fecha)}
                  </span>
                </li>
              ))}
            </ul>
          )}

          {actual && (
            <div className="min-h-0 flex-1 overflow-y-auto">
              <div className="flex items-center gap-1 border-b border-line px-2 py-1.5">
                <button className="ico" title="Volver" onClick={() => setAbierto(null)}>
                  <LuArrowLeft size={16} />
                </button>
                <button
                  className="ico"
                  title="Archivar"
                  onClick={() => {
                    marcar(actual.id, { archivado: true })
                    setAbierto(null)
                    avisar('Conversación archivada.', 'ok')
                  }}
                >
                  <LuArchive size={15} />
                </button>
                <button
                  className="ico ico-rojo"
                  title="Eliminar"
                  onClick={() => {
                    marcar(actual.id, { borrado: true })
                    setAbierto(null)
                    avisar('Conversación eliminada.', 'ok')
                  }}
                >
                  <LuTrash2 size={15} />
                </button>
              </div>

              <div className="flex flex-col gap-4 px-6 py-5">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="m-0 text-xl font-bold text-ink">{actual.asunto}</h2>
                  {actual.etiqueta && (
                    <span className="flex items-center gap-1 rounded-xs bg-surface-3 px-1.5 py-px text-xs font-semibold text-ink-2">
                      <span className={cx('h-1.5 w-1.5 rounded-full', ETIQUETAS[actual.etiqueta])} />
                      {actual.etiqueta}
                    </span>
                  )}
                </div>

                <div className="flex items-start gap-3">
                  <Avatar nombre={actual.de} grande />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm">
                      <b className="font-bold text-ink">{actual.de}</b>{' '}
                      <span className="text-ink-3">&lt;{actual.correo}&gt;</span>
                    </div>
                    <div className="text-xs text-ink-3">para {actual.enviado ? actual.para : 'mí'}</div>
                  </div>
                  <span className="num text-xs text-ink-3">
                    {actual.fecha.toLocaleString('es-HN', { dateStyle: 'medium', timeStyle: 'short' })}
                  </span>
                  <button
                    className="ico"
                    title="Destacar"
                    onClick={() => marcar(actual.id, { destacado: !actual.destacado })}
                  >
                    <LuStar size={15} className={actual.destacado ? 'fill-ambar-500 text-ambar-500' : ''} />
                  </button>
                </div>

                <div className="whitespace-pre-line pl-[52px] text-base leading-relaxed text-ink-2">
                  {actual.cuerpo}
                </div>

                {actual.adjuntos?.length > 0 && (
                  <div className="flex flex-wrap gap-2 pl-[52px]">
                    {actual.adjuntos.map((a) => (
                      <button
                        key={a}
                        onClick={() => avisar(`${a} (demo).`, 'ok')}
                        className="flex items-center gap-2 rounded-sm border border-line bg-surface-2 px-3 py-2 text-sm text-ink-2 hover:border-line-strong"
                      >
                        <LuPaperclip size={13} className="text-rojo-600" /> {a}
                      </button>
                    ))}
                  </div>
                )}

                <div className="flex gap-2 pl-[52px]">
                  <Button className="rounded-full!" onClick={() => responder(actual)}>
                    <LuReply size={14} /> Responder
                  </Button>
                  <Button className="rounded-full!" onClick={() => responder(actual, true)}>
                    <LuForward size={14} /> Reenviar
                  </Button>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Ventana de redacción abajo a la derecha, corrida para no tapar la burbuja del chat */}
      {redactar.abierto && (
        <div
          className={cx(
            'panel fixed right-24 bottom-0 z-[180] flex w-[min(520px,calc(100vw-7rem))] flex-col overflow-hidden rounded-b-none! shadow-xl',
            !redactar.minimizado && 'h-[min(460px,calc(100dvh-6rem))]',
          )}
        >
          <div className="flex items-center gap-2 bg-navy-800 px-3 py-2 text-sm font-semibold text-white">
            <span className="flex-1 truncate">{redactar.asunto || 'Mensaje nuevo'}</span>
            <button
              title={redactar.minimizado ? 'Restaurar' : 'Minimizar'}
              onClick={() => setRedactar((r) => ({ ...r, minimizado: !r.minimizado }))}
              className="rounded-xs p-1 hover:bg-white/10"
            >
              {redactar.minimizado ? <LuMaximize2 size={13} /> : <LuMinus size={13} />}
            </button>
            <button title="Descartar" onClick={() => setRedactar(REDACTAR_VACIO)} className="rounded-xs p-1 hover:bg-white/10">
              <LuX size={14} />
            </button>
          </div>
          {!redactar.minimizado && (
            <>
              <input
                className="border-b border-line bg-surface px-3 py-2 text-sm outline-none"
                placeholder="Para"
                value={redactar.para}
                onChange={(e) => setRedactar((r) => ({ ...r, para: e.target.value }))}
              />
              <input
                className="border-b border-line bg-surface px-3 py-2 text-sm outline-none"
                placeholder="Asunto"
                value={redactar.asunto}
                onChange={(e) => setRedactar((r) => ({ ...r, asunto: e.target.value }))}
              />
              <textarea
                className="min-h-0 flex-1 resize-none bg-surface px-3 py-2 text-sm leading-relaxed outline-none"
                value={redactar.cuerpo}
                onChange={(e) => setRedactar((r) => ({ ...r, cuerpo: e.target.value }))}
              />
              <div className="flex items-center gap-2 border-t border-line px-3 py-2">
                <Button variant="primary" className="rounded-full!" onClick={enviar}>
                  <LuSend size={14} /> Enviar
                </Button>
                <button className="ico" title="Adjuntar" onClick={() => avisar('Adjuntar (demo).', 'ok')}>
                  <LuPaperclip size={15} />
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
