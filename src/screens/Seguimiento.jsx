import { useMemo, useState } from 'react'
import { LuCalendarClock, LuClipboardCheck, LuFileDown, LuShip, LuTriangleAlert, LuX } from 'react-icons/lu'
import Button, { cx } from '../components/ui/Button'
import { Select } from '../components/ui/Field'
import ModalActualizarFechas from './ModalActualizarFechas'
import { useOc } from '../data/store'
import { CHECK_ADUANA, CHECK_LOGISTICA, INCOTERMS, RUTAS } from '../data/catalogos'
import { addDays, desdeHoy, diasEntre, fmtFechaCorta, fmtNum, hoy, parseISO } from '../lib/fechas'

const LISTAS = [
  { clave: 'aduana', titulo: 'Checklist aduana', items: CHECK_ADUANA },
  { clave: 'logistica', titulo: 'Checklist logístico', items: CHECK_LOGISTICA },
]

// El umbral que separa "por vencer" de "en tiempo": días antes de la salida.
const DIAS_AVISO = 7

const TONOS = {
  rojo: {
    punto: 'bg-rojo-600',
    texto: 'text-rojo-700',
    chip: 'bg-rojo-50 text-rojo-700',
    barra: 'bg-rojo-600',
    lomo: 'var(--color-rojo-600)',
  },
  ambar: {
    punto: 'bg-ambar-500',
    texto: 'text-ambar-700',
    chip: 'bg-ambar-50 text-ambar-700',
    barra: 'bg-ambar-500',
    lomo: 'var(--color-ambar-500)',
  },
  teal: {
    punto: 'bg-teal-600',
    texto: 'text-teal-700',
    chip: 'bg-teal-50 text-teal-700',
    barra: 'bg-teal-600',
    lomo: 'var(--color-teal-600)',
  },
  gris: {
    punto: 'bg-ink-4',
    texto: 'text-ink-3',
    chip: 'bg-surface-3 text-ink-2',
    barra: 'bg-ink-4',
    lomo: 'transparent',
  },
}

/** Aplana OC + despachos en las filas del seguimiento. */
function construirFilas(ordenes) {
  const filas = []

  ordenes
    .filter((oc) => oc.activa)
    .forEach((oc) => {
      if (!oc.despachos.length) {
        // Una OC abierta sin despachos también es seguimiento: es lo que falta programar.
        if (oc.estado === 'abierta') {
          filas.push({
            clave: `${oc.id}-sin`,
            oc,
            despacho: null,
            material: oc.materiales[0],
            etd: null,
            frontera: null,
            planta: null,
            hechos: 0,
            alerta: { tono: 'gris', texto: 'Sin programar' },
            tarea: 'Programar despachos de la OC',
          })
        }
        return
      }

      oc.despachos.forEach((d) => {
        const ruta = RUTAS[d.ruta] ?? RUTAS.longbeach
        const etd = parseISO(d.salida)
        const frontera = etd ? addDays(etd, ruta.leg1) : null
        const planta = frontera ? addDays(frontera, ruta.leg2) : null

        const aduana = d.aduana ?? []
        const logistica = d.logistica ?? []
        const hechos = aduana.filter(Boolean).length + logistica.filter(Boolean).length
        const completo = hechos === aduana.length + logistica.length
        const diasAEtd = etd ? diasEntre(hoy(), etd) : null

        let alerta
        if (!etd) alerta = { tono: 'gris', texto: 'Sin programar' }
        else if (completo && planta && diasEntre(hoy(), planta) < 0)
          alerta = { tono: 'gris', texto: 'Recibido' }
        else if (!completo && diasAEtd < 0) alerta = { tono: 'rojo', texto: 'Retrasado · ETD' }
        else if (!completo && diasAEtd <= DIAS_AVISO) alerta = { tono: 'ambar', texto: 'Por vencer' }
        else alerta = { tono: 'teal', texto: 'En tiempo' }

        // La próxima tarea es el primer pendiente de cualquiera de las dos listas.
        const iAduana = aduana.findIndex((v) => !v)
        const iLog = logistica.findIndex((v) => !v)
        const tarea =
          iAduana >= 0
            ? CHECK_ADUANA[iAduana]
            : iLog >= 0
              ? CHECK_LOGISTICA[iLog]
              : 'Sin tareas pendientes'

        filas.push({
          clave: `${oc.id}-${d.id}`,
          oc,
          despacho: d,
          ruta,
          material: oc.materiales.find((m) => m.codigo === d.material) ?? oc.materiales[0],
          etd,
          frontera,
          planta,
          hechos,
          alerta,
          tarea,
        })
      })
    })

  return filas
}

function Avance({ marcas = [], tono }) {
  const hechos = marcas.filter(Boolean).length
  const pct = marcas.length ? (hechos / marcas.length) * 100 : 0
  return (
    <span className="flex items-center gap-1.5">
      <span className="h-[5px] w-14 shrink-0 overflow-hidden rounded-full bg-surface-3">
        <span className={cx('block h-full', TONOS[tono].barra)} style={{ width: `${pct}%` }} />
      </span>
      <span className="num text-xs text-ink-3">
        {hechos}/{marcas.length}
      </span>
    </span>
  )
}

export default function Seguimiento() {
  const { ordenes, marcarCheck, avisar } = useOc()
  const [fIncoterm, setFIncoterm] = useState('')
  const [fAlerta, setFAlerta] = useState('')
  const [seleccion, setSeleccion] = useState(null)
  const [marcados, setMarcados] = useState(() => new Set())
  const [reprogramando, setReprogramando] = useState(false)

  const todas = useMemo(() => construirFilas(ordenes), [ordenes])

  const filas = useMemo(
    () =>
      todas.filter(
        (f) =>
          (!fIncoterm || f.oc.incoterm === fIncoterm) &&
          (!fAlerta || f.alerta.texto.startsWith(fAlerta)),
      ),
    [todas, fIncoterm, fAlerta],
  )

  // La fila seleccionada se resuelve por clave contra la lista viva, así el
  // detalle refleja los cambios de checklist sin guardar una copia congelada.
  const actual = filas.find((f) => f.clave === seleccion) ?? filas[0] ?? null

  // Solo se puede reprogramar lo que ya tiene despacho: las filas 'sin programar' no.
  const marcables = filas.filter((f) => f.despacho)
  const filasMarcadas = marcables.filter((f) => marcados.has(f.clave))
  const todosMarcados = marcables.length > 0 && filasMarcadas.length === marcables.length

  const alternar = (clave) =>
    setMarcados((prev) => {
      const s = new Set(prev)
      s.has(clave) ? s.delete(clave) : s.add(clave)
      return s
    })

  const alternarTodos = (v) =>
    setMarcados(v ? new Set(marcables.map((f) => f.clave)) : new Set())

  const conteo = useMemo(() => {
    const c = { rojo: 0, ambar: 0, teal: 0, gris: 0 }
    todas.forEach((f) => {
      if (f.alerta.texto !== 'Recibido') c[f.alerta.tono] += 1
    })
    return c
  }, [todas])

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* barra de filtros */}
      <div className="shrink-0 border-b border-line bg-surface">
        <div className="contenedor flex flex-wrap items-center gap-3 py-2.5">
          <span className="flex items-center gap-2 text-base font-bold text-navy-800">
            <LuClipboardCheck size={15} />
            Programación y seguimiento
          </span>

          <span className="h-5 w-px bg-line" />

          {/* la leyenda dice qué significa cada color y cuántos hay de cada uno */}
          <div className="flex flex-wrap items-center gap-4 text-xs text-ink-3">
            {[
              ['rojo', 'Retrasado'],
              ['ambar', 'Por vencer'],
              ['teal', 'En tiempo'],
              ['gris', 'Sin programar'],
            ].map(([tono, rotulo]) => (
              <span key={tono} className="flex items-center gap-1.5">
                <span className={cx('h-2 w-2 rounded-full', TONOS[tono].punto)} />
                {rotulo}
                <b className={cx('num font-bold', TONOS[tono].texto)}>{conteo[tono]}</b>
              </span>
            ))}
          </div>

          <div className="ml-auto flex items-center gap-2">
            <Select
              placeholder="Todos los incoterms"
              options={INCOTERMS}
              value={fIncoterm}
              onChange={(e) => setFIncoterm(e.target.value)}
              className="w-[170px]"
            />
            <Select
              placeholder="Todas las alertas"
              options={['Retrasado', 'Por vencer', 'En tiempo', 'Sin programar', 'Recibido']}
              value={fAlerta}
              onChange={(e) => setFAlerta(e.target.value)}
              className="w-[170px]"
            />
            <Button onClick={() => avisar('Reporte de seguimiento descargado.', 'ok')}>
              <LuFileDown size={14} />
              Exportar
            </Button>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="contenedor flex flex-col gap-4 py-5">
          {/* Aparece solo cuando hay algo marcado: la acción sigue a la selección */}
          {filasMarcadas.length > 0 && (
            <div className="flex flex-wrap items-center gap-3 rounded-sm border border-navy-200 bg-navy-50 px-4 py-2.5">
              <span className="text-base text-ink-2">
                <b className="num font-bold text-navy-800">{filasMarcadas.length}</b> despacho
                {filasMarcadas.length === 1 ? '' : 's'} seleccionado
                {filasMarcadas.length === 1 ? '' : 's'}
              </span>
              <Button variant="link" onClick={() => alternarTodos(false)}>
                Quitar selección
              </Button>
              <div className="ml-auto">
                <Button variant="primary" onClick={() => setReprogramando(true)}>
                  <LuCalendarClock size={14} />
                  Actualizar fecha despacho
                </Button>
              </div>
            </div>
          )}

          {/* --- tabla de programación --- */}
          <div className="panel tabla-scroll">
            <table className="tbl">
              <thead>
                <tr>
                  <th className="w-9">
                    <input
                      type="checkbox"
                      className="chk"
                      aria-label="Seleccionar todos"
                      checked={todosMarcados}
                      ref={(el) => {
                        if (el)
                          el.indeterminate =
                            filasMarcadas.length > 0 && filasMarcadas.length < marcables.length
                      }}
                      onChange={(e) => alternarTodos(e.target.checked)}
                    />
                  </th>
                  <th className="w-[104px]">OC</th>
                  <th className="w-[92px]">Despacho</th>
                  <th className="min-w-[190px]">Cat / SKU</th>
                  <th className="w-[86px]">Incoterm</th>
                  <th className="w-[104px]">ETD salida</th>
                  <th className="w-[110px]">ETA frontera</th>
                  <th className="w-[104px]">ETA planta</th>
                  <th className="w-[124px]">Checklist aduana</th>
                  <th className="w-[132px]">Checklist logístico</th>
                  <th className="min-w-[210px]">Próxima tarea</th>
                  <th className="w-[132px]">Alerta</th>
                </tr>
              </thead>
              <tbody>
                {filas.length === 0 && (
                  <tr>
                    <td colSpan={12} className="h-[148px]! bg-surface text-center">
                      <span className="inline-flex flex-col items-center gap-[7px]">
                        <LuShip size={26} strokeWidth={1.5} className="text-navy-200" />
                        <span className="text-base font-semibold text-ink-2">
                          Nada que seguir con estos filtros
                        </span>
                        <span className="text-sm text-ink-3">
                          Programá despachos en el paso 2 o limpiá los filtros.
                        </span>
                      </span>
                    </td>
                  </tr>
                )}

                {filas.map((f) => {
                  const sel = actual?.clave === f.clave
                  const tono = TONOS[f.alerta.tono]
                  const vencido = f.alerta.tono === 'rojo'
                  return (
                    <tr
                      key={f.clave}
                      onClick={() => setSeleccion(f.clave)}
                      style={{ '--spine': tono.lomo }}
                      className={cx('cursor-pointer', sel && '[&>td]:bg-navy-50!')}
                    >
                      <td onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          className="chk"
                          aria-label={`Seleccionar ${f.oc.id} ${f.despacho?.id ?? ''}`}
                          disabled={!f.despacho}
                          checked={marcados.has(f.clave)}
                          onChange={() => alternar(f.clave)}
                        />
                      </td>
                      <td className="cell-key">{f.oc.id}</td>
                      <td className="cell-strong">{f.despacho?.id ?? '—'}</td>
                      <td className="cell-cut" title={f.material?.nombre}>
                        <span className="text-ink-3">{f.material?.codigo}</span> · {f.material?.nombre}
                      </td>
                      <td>{f.oc.incoterm}</td>
                      <td className={cx('num', vencido && 'font-bold text-rojo-700')}>
                        {f.etd ? fmtFechaCorta(f.etd) : '—'}
                      </td>
                      <td className="num">{f.frontera ? fmtFechaCorta(f.frontera) : '—'}</td>
                      <td className="num">{f.planta ? fmtFechaCorta(f.planta) : '—'}</td>
                      <td>
                        {f.despacho ? (
                          <Avance marcas={f.despacho.aduana} tono={f.alerta.tono} />
                        ) : (
                          <span className="text-ink-4">—</span>
                        )}
                      </td>
                      <td>
                        {f.despacho ? (
                          <Avance marcas={f.despacho.logistica} tono={f.alerta.tono} />
                        ) : (
                          <span className="text-ink-4">—</span>
                        )}
                      </td>
                      <td className={cx('cell-cut', !f.despacho && 'text-ink-3')} title={f.tarea}>
                        {f.tarea}
                        {f.etd && (
                          <span className="ml-1.5 text-xs text-ink-4">· {desdeHoy(f.etd)}</span>
                        )}
                      </td>
                      <td>
                        <span
                          className={cx(
                            'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-[3px] text-xs font-semibold',
                            tono.chip,
                          )}
                        >
                          {vencido && <LuTriangleAlert size={11} />}
                          {f.alerta.texto}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* --- detalle del despacho seleccionado --- */}
          {actual && (
            <div>
              <div className="mb-2 flex flex-wrap items-baseline gap-2 text-sm text-ink-3">
                <span>
                  Detalle{' '}
                  <b className="font-bold text-ink">
                    {actual.oc.id}
                    {actual.despacho ? ` · ${actual.despacho.id}` : ''}
                  </b>{' '}
                  · seleccionado
                </span>
                <span className="text-ink-4">{actual.oc.proveedor}</span>
                {actual.despacho && (
                  <span className="text-ink-4">
                    · {fmtNum(actual.despacho.cantidad)} {actual.material?.unidad} ·{' '}
                    {actual.ruta?.origen} → {actual.ruta?.frontera}
                  </span>
                )}
              </div>

              {actual.despacho ? (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {LISTAS.map(({ clave, titulo, items }) => {
                    const marcas = actual.despacho[clave] ?? []
                    const hechos = marcas.filter(Boolean).length
                    return (
                      <div key={clave} className="panel">
                        <div className="panel-head justify-between">
                          <span className="panel-title">{titulo}</span>
                          <span className="num text-xs text-ink-3">
                            {hechos} de {items.length}
                          </span>
                        </div>
                        <div className="p-1.5">
                          {items.map((item, i) => (
                            <label
                              key={item}
                              className={cx(
                                'flex cursor-pointer items-start gap-2.5 rounded-xs px-2 py-2 text-base transition-colors duration-100 hover:bg-surface-2',
                                i > 0 && 'border-t border-line-soft',
                              )}
                            >
                              <input
                                type="checkbox"
                                className="chk mt-px"
                                checked={!!marcas[i]}
                                onChange={() =>
                                  marcarCheck(actual.oc.id, actual.despacho.id, clave, i)
                                }
                              />
                              <span className={cx(marcas[i] ? 'text-ink-3 line-through' : 'text-ink')}>
                                {item}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="panel flex items-center gap-2.5 p-4 text-sm text-ink-2">
                  <LuX size={15} className="shrink-0 text-ink-4" />
                  Esta OC todavía no tiene despachos programados, así que no hay checklists que
                  seguir. Programala en el paso 2.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <ModalActualizarFechas
        abierto={reprogramando}
        filas={filasMarcadas}
        onClose={() => setReprogramando(false)}
        onListo={() => setMarcados(new Set())}
      />
    </div>
  )
}
