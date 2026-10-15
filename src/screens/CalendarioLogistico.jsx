import { useMemo, useState } from 'react'
import {
  LuAnchor,
  LuChevronLeft,
  LuChevronRight,
  LuFactory,
  LuFilter,
  LuList,
  LuMapPin,
  LuNavigation,
  LuPackage,
  LuPrinter,
  LuX,
} from 'react-icons/lu'
import Modal from '../components/ui/Modal'
import Button, { cx } from '../components/ui/Button'
import { Input, Select } from '../components/ui/Field'
import { useOc } from '../data/store'
import { barcosTorre } from '../data/barcos'
import { DIAS_ADUANA, construirEmbarques } from '../lib/torre'
import { addDays, diasEntre, fmtFecha, fmtNum, hoy, parseISO, toISO } from '../lib/fechas'

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
const DIAS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

// Cada categoría pone el evento en una fecha distinta del mismo embarque, y solo
// muestra los que todavía no pasaron ese hito.
const CATEGORIAS = {
  origen: {
    rotulo: 'Cargas en origen',
    evento: 'Carga en origen',
    icono: LuPackage,
    fecha: (e) => e.etd,
    aplica: (e) => ['Origin', 'Port of Loading'].includes(e.segmento),
    chip: 'bg-[#fff0e5] text-[#a94c18]',
    punto: 'bg-[#d77835]',
  },
  aduana: {
    rotulo: 'Próximos arribos a aduana',
    evento: 'Arribo a aduana',
    icono: LuAnchor,
    fecha: (e) => e.frontera,
    aplica: (e) => !['Last Mile', 'At Plant'].includes(e.segmento),
    chip: 'bg-navy-50 text-navy-700',
    punto: 'bg-navy-600',
  },
  planta: {
    rotulo: 'Próximas llegadas a planta',
    evento: 'Llegada a planta',
    icono: LuFactory,
    fecha: (e) => e.planta,
    aplica: (e) => e.segmento !== 'At Plant',
    chip: 'bg-teal-50 text-teal-700',
    punto: 'bg-teal-600',
  },
}

const ESTADO = {
  'Dentro de tiempo': { borde: '', caja: 'bg-teal-50 text-teal-700' },
  'En riesgo': { borde: 'shadow-[inset_2px_0_0_var(--color-ambar-500)]', caja: 'bg-ambar-50 text-ambar-700' },
  'Fuera de tiempo': { borde: 'shadow-[inset_2px_0_0_var(--color-rojo-600)]', caja: 'bg-rojo-50 text-rojo-700' },
}

const modoDe = (e) => (/terrestre|FTL/i.test(e.transporte) ? 'Terrestre' : 'Marítimo')

// Avance = qué parte del viaje (salida → planta) ya transcurrió.
const avanceDe = (e) => {
  const total = diasEntre(e.etd, e.planta) || 1
  return Math.round(Math.min(1, Math.max(0, diasEntre(e.etd, hoy()) / total)) * 100)
}

const mismoMes = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth()
const inicioSemana = (d) => addDays(d, -d.getDay())

function rango(modo, cursor) {
  if (modo === 'dia') return [cursor]
  const desde = modo === 'semana' ? inicioSemana(cursor) : inicioSemana(new Date(cursor.getFullYear(), cursor.getMonth(), 1))
  return Array.from({ length: modo === 'semana' ? 7 : 42 }, (_, i) => addDays(desde, i))
}

function rotuloPeriodo(modo, dias, cursor) {
  if (modo === 'mes') return `${MESES[cursor.getMonth()]} ${cursor.getFullYear()}`
  if (modo === 'semana') return `${fmtFecha(dias[0])} – ${fmtFecha(dias[6])}`
  return `${DIAS[cursor.getDay()]} ${fmtFecha(cursor)}`
}

// Las semanas del mes visible, en el orden de la grilla: es el selector "Semana 1…6".
function semanasDelMes(cursor) {
  const desde = inicioSemana(new Date(cursor.getFullYear(), cursor.getMonth(), 1))
  return Array.from({ length: 6 }, (_, i) => {
    const ini = addDays(desde, i * 7)
    const fin = addDays(ini, 6)
    const dd = (d) => `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
    return { value: toISO(ini), label: `Semana ${i + 1} · ${dd(ini)} – ${dd(fin)}` }
  })
}

function Dato({ rotulo, children }) {
  return (
    <div className="min-w-0 rounded-sm border border-line bg-surface-2 px-3 py-2">
      <span className="block text-xs text-ink-3">{rotulo}</span>
      <b className="block text-sm font-bold text-ink [overflow-wrap:anywhere]">{children || '—'}</b>
    </div>
  )
}

function Punto({ icono: Icono, rotulo, titulo, sub }) {
  return (
    <div className="flex items-start gap-2.5 py-1.5">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-sm bg-navy-50 text-navy-600">
        <Icono size={13} />
      </span>
      <span className="min-w-0">
        <span className="block text-xs text-ink-3">{rotulo}</span>
        <b className="block text-sm font-bold text-ink">{titulo}</b>
        {sub && <span className="block text-xs text-ink-3">{sub}</span>}
      </span>
    </div>
  )
}

function Detalle({ e }) {
  // La trazabilidad sale de los hitos del viaje: los que ya pasaron se marcan hechos.
  const hitos = [
    ['Carga en origen', e.etd],
    ['Arribo a aduana', e.frontera],
    ['Liberación proyectada', addDays(e.frontera, DIAS_ADUANA)],
    ['Llegada a planta', e.planta],
  ]
  return (
    <div className="flex flex-col gap-4">
      <div>
        <div className="lbl mb-2">Información de la carga</div>
        <div className="grid grid-cols-2 gap-2">
          <Dato rotulo="Embarque">{e.id}</Dato>
          <Dato rotulo="OC">{e.oc.id}</Dato>
          <Dato rotulo="SKU">{e.material?.codigo}</Dato>
          <Dato rotulo="Producto">{e.material?.nombre}</Dato>
          <Dato rotulo="Cantidad">{`${fmtNum(e.despacho.cantidad)} ${e.material?.unidad ?? ''}`}</Dato>
          <Dato rotulo="Proveedor">{e.oc.proveedor}</Dato>
          <Dato rotulo="Incoterm">{e.oc.incoterm}</Dato>
          <Dato rotulo="Transporte">{`${e.transporte} · ${e.buque}`}</Dato>
        </div>
      </div>
      <div>
        <div className="lbl mb-2">Ruta y planificación</div>
        <div className="grid grid-cols-2 gap-2">
          <Dato rotulo="Origen">{e.ruta.origen}</Dato>
          <Dato rotulo="Ubicación actual">{e.ubicacion}</Dato>
          <Dato rotulo="Aduana">{e.ruta.frontera}</Dato>
          <Dato rotulo="Planta">{e.sitio}</Dato>
          <Dato rotulo="Carga programada">{fmtFecha(e.etd)}</Dato>
          <Dato rotulo="ETA aduana">{fmtFecha(e.frontera)}</Dato>
          <Dato rotulo="ETA planta">{fmtFecha(e.planta)}</Dato>
          <Dato rotulo="Cumplimiento">{e.delay ? `${e.riesgo} · +${e.delay} d` : e.riesgo}</Dato>
        </div>
      </div>
      <div>
        <div className="lbl mb-2">Trazabilidad</div>
        <ol className="m-0 ml-2 list-none border-l-2 border-line p-0 pl-4">
          {hitos.map(([rotulo, fecha]) => {
            const hecho = fecha <= hoy()
            return (
              <li key={rotulo} className="relative pb-3">
                <span
                  className={cx(
                    'absolute -left-[23px] top-0.5 h-2.5 w-2.5 rounded-full border-2 border-surface',
                    hecho ? 'bg-teal-600' : 'bg-ink-4',
                  )}
                />
                <b className={cx('block text-sm', hecho ? 'text-ink' : 'text-ink-3')}>{rotulo}</b>
                <span className="block text-xs text-ink-3">
                  {fmtFecha(fecha)} · {hecho ? 'Cumplido' : 'Estimado'}
                </span>
              </li>
            )
          })}
        </ol>
      </div>
    </div>
  )
}

/** Calendario operativo de la torre: cargas, arribos a aduana y llegadas a planta, por día. */
export default function CalendarioLogistico() {
  const { ordenes, salidasWh } = useOc()
  const barcos = useMemo(() => barcosTorre(), [])
  const embarques = useMemo(() => construirEmbarques([...ordenes, ...salidasWh, ...barcos]), [ordenes, salidasWh, barcos])

  const [categoria, setCategoria] = useState('origen')
  const [modo, setModo] = useState('mes')
  const [cursor, setCursor] = useState(hoy)
  const [diaSel, setDiaSel] = useState(() => toISO(hoy()))
  const [eventoSel, setEventoSel] = useState(null)
  const [verFiltros, setVerFiltros] = useState(false)
  const [q, setQ] = useState('')
  const [filtros, setFiltros] = useState({ riesgo: '', proveedor: '', aduana: '', modo: '', categoria: '', origen: '' })
  // { tipo: 'detalle' } o { tipo: 'lista', titulo, eventos }
  const [modal, setModal] = useState(null)

  const opciones = (fn) => [...new Set(embarques.map(fn).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es'))
  const listasFiltro = [
    ['riesgo', 'Todos los estados', ['Dentro de tiempo', 'En riesgo', 'Fuera de tiempo']],
    ['proveedor', 'Todos los proveedores', opciones((e) => e.oc.proveedor)],
    ['aduana', 'Todas las aduanas', opciones((e) => e.ruta.frontera)],
    ['modo', 'Todas las modalidades', ['Marítimo', 'Terrestre']],
    ['categoria', 'Todas las categorías', opciones((e) => e.material?.categoria)],
    ['origen', 'Todos los orígenes', opciones((e) => e.ruta.origen)],
  ]

  const deCategoria = (c) => {
    const t = q.trim().toLowerCase()
    return embarques.filter((e) => {
      if (!CATEGORIAS[c].aplica(e)) return false
      const texto = [e.id, e.oc.id, e.material?.codigo, e.material?.nombre, e.oc.proveedor, e.sitio, e.ruta.frontera].join(' ')
      return (
        (!t || texto.toLowerCase().includes(t)) &&
        (!filtros.riesgo || e.riesgo === filtros.riesgo) &&
        (!filtros.proveedor || e.oc.proveedor === filtros.proveedor) &&
        (!filtros.aduana || e.ruta.frontera === filtros.aduana) &&
        (!filtros.modo || modoDe(e) === filtros.modo) &&
        (!filtros.categoria || e.material?.categoria === filtros.categoria) &&
        (!filtros.origen || e.ruta.origen === filtros.origen)
      )
    })
  }

  const cat = CATEGORIAS[categoria]
  const eventos = deCategoria(categoria)
  const dias = rango(modo, cursor)
  const delDia = (iso) => eventos.filter((e) => toISO(cat.fecha(e)) === iso)
  const sel = eventos.find((e) => e.clave === eventoSel) ?? null

  const mover = (n) =>
    setCursor((c) =>
      modo === 'mes' ? new Date(c.getFullYear(), c.getMonth() + n, 1) : addDays(c, n * (modo === 'semana' ? 7 : 1)),
    )
  const irHoy = () => {
    setCursor(hoy())
    setDiaSel(toISO(hoy()))
  }
  const elegirEvento = (e) => {
    setEventoSel(e.clave)
    setDiaSel(toISO(cat.fecha(e)))
  }
  const abrirLista = (titulo, lista) => setModal({ tipo: 'lista', titulo, eventos: lista })

  const meses = Array.from({ length: 16 }, (_, i) => new Date(hoy().getFullYear(), hoy().getMonth() - 3 + i, 1))
  const hayFiltros = q || Object.values(filtros).some(Boolean)

  return (
    <>
      {/* categorías + acciones */}
      <div className="flex flex-wrap items-center gap-2">
        {Object.entries(CATEGORIAS).map(([id, c]) => {
          const Icono = c.icono
          const activa = id === categoria
          return (
            <button
              key={id}
              type="button"
              onClick={() => {
                setCategoria(id)
                setEventoSel(null)
              }}
              className={cx(
                'flex items-center gap-2 rounded-sm border px-3 py-2 text-sm font-bold transition-colors duration-100',
                activa ? 'border-navy-800 bg-navy-800 text-white' : 'border-line bg-surface text-ink-2 hover:bg-surface-2',
              )}
            >
              <Icono size={14} />
              {c.rotulo}
              <span className={cx('num rounded-xs px-1.5 py-px text-xs', activa ? 'bg-white/15' : 'bg-surface-3 text-ink-2')}>
                {deCategoria(id).length}
              </span>
            </button>
          )
        })}

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <Input placeholder="Buscar OC, SKU o producto…" value={q} onChange={(e) => setQ(e.target.value)} className="w-[210px]" />
          <Button variant={verFiltros ? 'primary' : 'secondary'} onClick={() => setVerFiltros((v) => !v)}>
            <LuFilter size={14} /> Filtros
          </Button>
          <Button
            onClick={() =>
              abrirLista(
                `${cat.rotulo} · ${eventos.length}`,
                [...eventos].sort((a, b) => cat.fecha(a) - cat.fecha(b)),
              )
            }
          >
            <LuList size={14} /> Próximos eventos
          </Button>
          <Button onClick={() => window.print()}>
            <LuPrinter size={14} /> Imprimir
          </Button>
        </div>
      </div>

      {verFiltros && (
        <div className="panel flex flex-wrap items-center gap-2 p-3">
          {listasFiltro.map(([k, ph, ops]) => (
            <Select
              key={k}
              placeholder={ph}
              options={ops}
              value={filtros[k]}
              onChange={(e) => setFiltros((f) => ({ ...f, [k]: e.target.value }))}
              className="w-[180px]"
            />
          ))}
          {hayFiltros && (
            <Button
              variant="link"
              onClick={() => {
                setQ('')
                setFiltros({ riesgo: '', proveedor: '', aduana: '', modo: '', categoria: '', origen: '' })
              }}
            >
              Limpiar filtros
            </Button>
          )}
        </div>
      )}

      {/* navegación del periodo */}
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" aria-label="Periodo anterior" onClick={() => mover(-1)}>
          <LuChevronLeft size={14} />
        </Button>
        <span className="min-w-[190px] text-center text-base font-bold text-navy-800">{rotuloPeriodo(modo, dias, cursor)}</span>
        <Button size="sm" aria-label="Periodo siguiente" onClick={() => mover(1)}>
          <LuChevronRight size={14} />
        </Button>
        <Button size="sm" onClick={irHoy}>
          Hoy
        </Button>

        <Select
          aria-label="Mes"
          options={meses.map((d) => ({ value: toISO(d), label: `${MESES[d.getMonth()]} ${d.getFullYear()}` }))}
          value={toISO(new Date(cursor.getFullYear(), cursor.getMonth(), 1))}
          onChange={(e) => {
            setCursor(parseISO(e.target.value))
            setModo('mes')
          }}
          className="w-[160px]"
        />
        <Select
          aria-label="Semana"
          placeholder="Seleccionar semana…"
          options={semanasDelMes(cursor)}
          value={modo === 'semana' ? toISO(inicioSemana(cursor)) : ''}
          onChange={(e) => {
            if (!e.target.value) return
            setCursor(parseISO(e.target.value))
            setModo('semana')
          }}
          className="w-[210px]"
        />

        <div className="flex gap-0.5 rounded-sm bg-surface-3 p-0.5">
          {[
            ['mes', 'Mes'],
            ['semana', 'Semana'],
            ['dia', 'Día'],
          ].map(([id, r]) => (
            <button
              key={id}
              type="button"
              onClick={() => setModo(id)}
              className={cx(
                'rounded-xs px-2.5 py-1 text-sm',
                modo === id ? 'bg-surface font-bold text-navy-800 shadow-[0_1px_3px_rgba(0,28,44,0.12)]' : 'text-ink-3',
              )}
            >
              {r}
            </button>
          ))}
        </div>

        <span className="ml-auto flex flex-wrap items-center gap-3 text-xs text-ink-3">
          <span className="flex items-center gap-1.5">
            <span className={cx('h-2 w-2 rounded-full', cat.punto)} /> {cat.evento}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-ambar-500" /> En riesgo
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-rojo-600" /> Fuera de tiempo
          </span>
          <span className="num">· {eventos.length} eventos</span>
        </span>
      </div>

      <div className="grid grid-cols-1 items-start gap-3 lg:grid-cols-[minmax(0,1fr)_290px]">
        {/* grilla */}
        <div className="panel overflow-x-auto">
          <div className={cx('min-w-[640px]', modo === 'dia' && 'min-w-0')}>
            {modo !== 'dia' && (
              <div className="grid grid-cols-7 border-b border-line bg-surface-2">
                {DIAS.map((d) => (
                  <div key={d} className="lbl border-r border-line-soft px-2 py-2 last:border-r-0">
                    {d}
                  </div>
                ))}
              </div>
            )}
            <div className={cx('grid', modo === 'dia' ? 'grid-cols-1' : 'grid-cols-7')}>
              {dias.map((d) => {
                const iso = toISO(d)
                const lista = delDia(iso)
                const fuera = modo === 'mes' && !mismoMes(d, cursor)
                const esHoy = iso === toISO(hoy())
                const tope = modo === 'mes' ? 3 : 8
                return (
                  <div
                    key={iso}
                    onClick={() => setDiaSel(iso)}
                    className={cx(
                      'min-w-0 cursor-pointer border-b border-r border-line-soft p-1.5 [&:nth-child(7n)]:border-r-0',
                      modo === 'mes' ? 'min-h-[100px]' : 'min-h-[220px]',
                      fuera ? 'bg-surface-2 text-ink-4' : 'bg-surface',
                      diaSel === iso && 'shadow-[inset_0_0_0_2px_var(--color-navy-200)]',
                    )}
                  >
                    <div className="mb-1 flex items-center justify-between px-0.5">
                      <span
                        className={cx(
                          'num flex h-[22px] w-[22px] items-center justify-center rounded-full text-xs',
                          esHoy ? 'bg-navy-800 font-bold text-white' : 'text-ink-3',
                        )}
                      >
                        {d.getDate()}
                      </span>
                      {lista.length > 0 && (
                        <span className="num rounded-xs bg-surface-3 px-1.5 py-px text-3xs text-ink-2">{lista.length}</span>
                      )}
                    </div>
                    {lista.slice(0, tope).map((e) => (
                      <button
                        key={e.clave}
                        type="button"
                        title={`${e.id} · ${e.material?.nombre}`}
                        onClick={(ev) => {
                          ev.stopPropagation()
                          elegirEvento(e)
                        }}
                        className={cx(
                          'my-0.5 block w-full truncate rounded-xs px-1.5 py-1 text-left text-3xs font-bold',
                          cat.chip,
                          ESTADO[e.riesgo]?.borde,
                          eventoSel === e.clave && 'outline outline-1 outline-navy-600',
                        )}
                      >
                        {e.id} · {e.sitio}
                      </button>
                    ))}
                    {lista.length > tope && (
                      <button
                        type="button"
                        onClick={(ev) => {
                          ev.stopPropagation()
                          abrirLista(`${fmtFecha(d)} · ${lista.length} eventos`, lista)
                        }}
                        className="px-1.5 text-3xs text-ink-3 hover:text-navy-700"
                      >
                        +{lista.length - tope} más
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* vista rápida */}
        <div className="panel lg:sticky lg:top-4">
          <div className="panel-head">
            <span className="min-w-0 flex-1">
              <span className="panel-title">Vista rápida</span>
              <span className="block text-xs text-ink-3">{sel ? cat.evento : 'Sin evento seleccionado'}</span>
            </span>
            {sel && (
              <button
                type="button"
                aria-label="Limpiar selección"
                onClick={() => setEventoSel(null)}
                className="text-ink-3 hover:text-ink"
              >
                <LuX size={15} />
              </button>
            )}
          </div>
          {sel ? (
            <div className="flex flex-col gap-3 p-3">
              <div>
                <span className={cx('rounded-xs px-1.5 py-px text-xs font-bold', cat.chip)}>{cat.evento}</span>
                <b className="mt-1.5 block text-base font-bold text-ink">{sel.id}</b>
                <span className="block text-xs text-ink-3">
                  {sel.material?.nombre} · SKU {sel.material?.codigo}
                </span>
              </div>
              <div className="rounded-sm border border-line px-2.5 py-1">
                <Punto icono={LuMapPin} rotulo="Origen" titulo={sel.ruta.origen} sub={sel.oc.proveedor} />
                <Punto icono={LuNavigation} rotulo="Ubicación actual" titulo={sel.ubicacion} sub={`${modoDe(sel)} · ${sel.buque}`} />
                <Punto icono={LuFactory} rotulo="Destino" titulo={sel.sitio} sub={`Aduana ${sel.ruta.frontera}`} />
              </div>
              <div className={cx('rounded-sm px-2.5 py-2 text-sm font-bold', ESTADO[sel.riesgo]?.caja)}>
                {sel.riesgo} · {avanceDe(sel)}% del viaje
              </div>
              <div className="h-[5px] overflow-hidden rounded-full bg-surface-3">
                <span className="block h-full bg-navy-600" style={{ width: `${avanceDe(sel)}%` }} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Dato rotulo={cat.evento}>{fmtFecha(cat.fecha(sel))}</Dato>
                <Dato rotulo="ETA planta">{fmtFecha(sel.planta)}</Dato>
                <Dato rotulo="Modalidad">{modoDe(sel)}</Dato>
                <Dato rotulo="Cantidad">{`${fmtNum(sel.despacho.cantidad)} ${sel.material?.unidad ?? ''}`}</Dato>
              </div>
              <Button variant="primary" block onClick={() => setModal({ tipo: 'detalle' })}>
                Ver todos los detalles
              </Button>
            </div>
          ) : (
            <p className="m-0 px-4 py-6 text-center text-sm text-ink-3">
              Haz clic en un embarque del calendario para ver su resumen, ubicación y fechas.
            </p>
          )}
        </div>
      </div>

      {modal?.tipo === 'detalle' && sel && (
        <Modal open onClose={() => setModal(null)} eyebrow={`${sel.material?.nombre} · ${sel.ubicacion}`} title={`${sel.id} · OC ${sel.oc.id}`}>
          <Detalle e={sel} />
        </Modal>
      )}

      {modal?.tipo === 'lista' && (
        <Modal open onClose={() => setModal(null)} eyebrow="Calendario logístico" title={modal.titulo}>
          {modal.eventos.length === 0 ? (
            <p className="m-0 text-center text-sm text-ink-3">No hay eventos con los filtros actuales.</p>
          ) : (
            <div className="flex flex-col">
              {modal.eventos.map((e) => (
                <button
                  key={e.clave}
                  type="button"
                  onClick={() => {
                    elegirEvento(e)
                    setModal({ tipo: 'detalle' })
                  }}
                  className="flex items-start gap-3 border-b border-line-soft px-1 py-2.5 text-left last:border-b-0 hover:bg-surface-2"
                >
                  <span className={cx('mt-1 h-2 w-2 shrink-0 rounded-full', cat.punto)} />
                  <span className="min-w-0">
                    <b className="block text-sm font-bold text-ink">
                      {fmtFecha(cat.fecha(e))} · {e.id} · {e.material?.nombre}
                    </b>
                    <span className="block text-xs text-ink-3">
                      {e.oc.proveedor} · {fmtNum(e.despacho.cantidad)} {e.material?.unidad} · {e.riesgo}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </Modal>
      )}
    </>
  )
}
