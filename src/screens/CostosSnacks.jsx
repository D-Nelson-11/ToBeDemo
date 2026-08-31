import { useMemo, useState } from 'react'
import { LuFileDown, LuFileText, LuPrinter, LuSearchX, LuTriangleAlert } from 'react-icons/lu'
import Button, { cx } from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import { Select, Textarea } from '../components/ui/Field'
import { BarrasH, LineasMulti } from '../components/ui/Graficos'
import { Kpi } from '../components/ui/Valores'
import { fmtFecha } from '../lib/fechas'
import { useOc } from '../data/store'
import { PERIODOS_COSTO, PRIORIDADES, SERIES_COSTO, TONO_PRIORIDAD } from '../data/costosSnacks'
import {
  ADUANAS_COSTO,
  CATEGORIAS_COSTO,
  FILTRO_COSTOS,
  MATERIAS_COSTO,
  NAVIERAS_COSTO,
  agruparCosto,
  detalleCosto,
  exposicion,
  filtrarCostos,
  indicadoresCosto,
  mayorAtencion,
  porMateria,
  tendenciaCosto,
} from '../lib/costosSnacks'
// Sin decimales: acá todo son montos enteros de miles de dólares.
const dinero = (n) => `$ ${Math.round(n).toLocaleString('es-HN')}`

function Panel({ titulo, pie, children, acciones }) {
  return (
    <section className="panel">
      <div className="panel-head">
        <span className="panel-title">{titulo}</span>
        {pie && <span className="min-w-0 flex-1 truncate text-sm text-ink-3">{pie}</span>}
        {acciones}
      </div>
      <div className="p-4">{children}</div>
    </section>
  )
}

function Chip({ prioridad }) {
  return (
    <span
      className={cx(
        'inline-block whitespace-nowrap rounded-full px-2.5 py-[3px] text-xs font-semibold',
        TONO_PRIORIDAD[prioridad].chip,
      )}
    >
      {prioridad}
    </span>
  )
}

/**
 * Un gráfico del tablero. En modo informe suma el check para incluirlo y, si se
 * marca, el área de comentario que va a acompañarlo en el documento final.
 */
function GraficoPanel({ g, informe, sel, onToggle, onComentario }) {
  const marcado = g.id in sel
  return (
    <section
      className={cx(
        'panel',
        informe && (marcado ? 'ring-2 ring-navy-600' : 'ring-1 ring-transparent hover:ring-line-strong'),
      )}
    >
      <div className="panel-head">
        {informe && (
          <input
            type="checkbox"
            className="chk shrink-0"
            checked={marcado}
            onChange={() => onToggle(g.id)}
            aria-label={`Incluir ${g.titulo} en el informe`}
          />
        )}
        <span className="panel-title">{g.titulo}</span>
        {g.pie && <span className="min-w-0 flex-1 truncate text-sm text-ink-3">{g.pie}</span>}
      </div>
      <div className="p-4">{g.nodo}</div>
      {informe && marcado && (
        <div className="border-t border-line bg-surface-2 p-3">
          <span className="lbl mb-1.5 block">Comentario para el informe</span>
          <Textarea
            rows={3}
            value={sel[g.id] ?? ''}
            onChange={(e) => onComentario(g.id, e.target.value)}
            placeholder="Observación sobre este gráfico…"
          />
        </div>
      )}
    </section>
  )
}

/** Cost Control Tower: dónde se está yendo el costo logístico y por qué. */
export default function CostosSnacks() {
  const { avisar } = useOc()
  const [f, setF] = useState(FILTRO_COSTOS)

  const filas = useMemo(() => filtrarCostos(f), [f])
  const set = (k, v) => setF((prev) => ({ ...prev, [k]: v }))
  const sucio = Object.entries(f).some(([k, v]) => v !== FILTRO_COSTOS[k])

  const k = indicadoresCosto(filas)
  const tendencia = tendenciaCosto(filas, f.periodo)
  const aduanas = agruparCosto(filas, 'aduana')
  const categorias = agruparCosto(filas, 'categoria')
  const navieras = agruparCosto(filas, 'naviera')
  const semaforo = exposicion(filas)
  const atencion = mayorAtencion(filas)
  const { lider, ranking } = porMateria(filas)
  const detalle = detalleCosto(filas)

  // Modo informe: se marcan gráficos, se les escribe un comentario y se arma el
  // documento. `sel` es id → comentario; que la clave exista = está incluido.
  const [informe, setInforme] = useState(false)
  const [sel, setSel] = useState({})
  const [verInforme, setVerInforme] = useState(false)

  const graficos = [
    {
      id: 'tendencia',
      titulo: 'Comportamiento de costos',
      pie: 'costo total contra la parte extraordinaria',
      nodo: <LineasMulti datos={tendencia} series={SERIES_COSTO} fmt={dinero} />,
    },
    {
      id: 'aduana',
      titulo: 'Costo por aduana / puerto',
      nodo: <BarrasH datos={aduanas} fmt={dinero} />,
    },
    {
      id: 'categoria',
      titulo: 'Categorías de costo',
      pie: 'demora, estadías, chasis, WTD e inland',
      nodo: <BarrasH datos={categorias} fmt={dinero} />,
    },
  ]
  const elegidos = graficos.filter((g) => g.id in sel)

  const toggleInforme = () => {
    setInforme((v) => !v)
    setSel({})
  }
  const toggleGrafico = (id) =>
    setSel((s) => {
      const n = { ...s }
      if (id in n) delete n[id]
      else n[id] = ''
      return n
    })
  const setComentario = (id, v) => setSel((s) => ({ ...s, [id]: v }))
  const rep = { informe, sel, onToggle: toggleGrafico, onComentario: setComentario }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="m-0 text-lg font-bold text-navy-800">Análisis de costos logísticos</h2>
          <p className="m-0 text-sm text-ink-3">
            Materias primas para producción de snacks · marzo a agosto 2026. Todo lo de abajo se
            recalcula con los filtros.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label
            className={cx(
              'flex cursor-pointer items-center gap-2 rounded-sm border px-3 py-1.5 text-sm font-medium transition-colors',
              informe ? 'border-navy-600 bg-navy-50 text-navy-800' : 'border-line bg-surface text-ink-2',
            )}
          >
            <input type="checkbox" className="chk" checked={informe} onChange={toggleInforme} />
            Generar informe
          </label>
          <Button size="sm" onClick={() => avisar('Exportación de costos generada (demo).')}>
            <LuFileDown size={14} /> Exportar
          </Button>
          <Button size="sm" variant="primary" onClick={() => avisar('Informe de costos enviado (demo).')}>
            <LuPrinter size={14} /> Imprimir
          </Button>
        </div>
      </div>

      <div className="panel flex flex-wrap items-center gap-2 p-3">
        <Select options={PERIODOS_COSTO} value={f.periodo} onChange={(e) => set('periodo', e.target.value)} className="w-[170px]" />
        <Select placeholder="Todas las aduanas" options={ADUANAS_COSTO} value={f.aduana} onChange={(e) => set('aduana', e.target.value)} className="w-[160px]" />
        <Select placeholder="Toda materia prima" options={MATERIAS_COSTO} value={f.materia} onChange={(e) => set('materia', e.target.value)} className="w-[180px]" />
        <Select placeholder="Todas las navieras" options={NAVIERAS_COSTO} value={f.naviera} onChange={(e) => set('naviera', e.target.value)} className="w-[180px]" />
        <Select placeholder="Toda categoría" options={CATEGORIAS_COSTO} value={f.categoria} onChange={(e) => set('categoria', e.target.value)} className="w-[160px]" />
        <Select placeholder="Toda prioridad" options={PRIORIDADES} value={f.prioridad} onChange={(e) => set('prioridad', e.target.value)} className="w-[180px]" />
        {sucio && (
          <Button size="sm" onClick={() => setF(FILTRO_COSTOS)}>
            <LuSearchX size={14} /> Restablecer
          </Button>
        )}
        <span className="num ml-auto rounded-full bg-surface-3 px-2.5 py-[3px] text-xs font-bold text-ink-2">
          {k.embarques} embarques
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        <Kpi rotulo="Costo logístico total" valor={dinero(k.total)} tono="border-navy-100 bg-navy-50" />
        <Kpi rotulo={`Costo extraordinario · ${k.pctExtra}%`} valor={dinero(k.extra)} tono="border-rojo-100 bg-rojo-50" />
        <Kpi rotulo="Promedio por embarque" valor={dinero(k.promedio)} />
        <Kpi rotulo={`Demora y estadías · ${k.pctDemora}%`} valor={dinero(k.demora)} tono="border-ambar-100 bg-ambar-50" />
        <Kpi rotulo="Ahorro potencial" valor={dinero(k.ahorro)} tono="border-teal-100 bg-teal-50" />
      </div>

      {/* La tendencia necesita ancho; las dos de barras son cortas y caben en un cuarto */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-4">
        <div className="xl:col-span-2">
          <GraficoPanel g={graficos[0]} {...rep} />
        </div>
        <GraficoPanel g={graficos[1]} {...rep} />
        <GraficoPanel g={graficos[2]} {...rep} />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="panel">
          <div className="panel-head">
            <span className="panel-title">Costo por naviera</span>
          </div>
          <table className="tbl">
            <thead>
              <tr>
                <th className="min-w-[150px]">Naviera</th>
                <th className="w-[100px] text-right!">Embarques</th>
                <th className="w-[110px] text-right!">Costo</th>
                <th className="w-[90px] text-right!">Particip.</th>
              </tr>
            </thead>
            <tbody>
              {navieras.length === 0 && (
                <tr>
                  <td colSpan={4} className="h-[110px]! bg-surface text-center text-sm text-ink-3">
                    Sin datos.
                  </td>
                </tr>
              )}
              {navieras.map((g) => (
                <tr key={g.clave}>
                  <td className="cell-key">{g.clave}</td>
                  <td className="cell-num">{g.embarques}</td>
                  <td className="cell-num">{dinero(g.valor)}</td>
                  <td className="cell-num font-bold text-navy-800">{g.pct}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="panel">
          <div className="panel-head">
            <span className="panel-title">Embarques de mayor atención</span>
          </div>
          <table className="tbl">
            <thead>
              <tr>
                <th className="w-[110px]">Embarque</th>
                <th className="w-[170px]">Estado</th>
                <th className="w-[110px] text-right!">Exposición</th>
                <th className="min-w-[120px]">Causa</th>
              </tr>
            </thead>
            <tbody>
              {atencion.length === 0 && (
                <tr>
                  <td colSpan={4} className="h-[110px]! bg-surface text-center text-sm text-ink-3">
                    Ningún embarque fuera de parámetros.
                  </td>
                </tr>
              )}
              {atencion.map((r) => (
                <tr key={r.id} style={{ '--spine': TONO_PRIORIDAD[r.prioridad].lomo }}>
                  <td className="cell-key">{r.id}</td>
                  <td>
                    <Chip prioridad={r.prioridad} />
                  </td>
                  <td className="cell-num font-bold">{dinero(r.monto)}</td>
                  <td>{r.categoria}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Panel titulo="Semáforo de exposición" pie="clasificación automática">
          <div className="flex flex-col gap-2">
            {semaforo.map((e) => (
              <div
                key={e.prioridad}
                className={cx('rounded-sm border px-3 py-2', TONO_PRIORIDAD[e.prioridad].borde)}
              >
                <div className="flex items-baseline justify-between gap-3">
                  <b className="font-bold">{e.prioridad}</b>
                  <b className="num text-xl font-bold">{e.embarques}</b>
                </div>
                <span className="num block text-sm">{dinero(e.monto)} de exposición</span>
              </div>
            ))}
            <div className="rounded-sm border border-line bg-surface-2 px-3 py-2">
              <div className="flex items-baseline justify-between gap-3">
                <b className="font-bold text-ink">Ahorro potencial</b>
                <b className="num font-bold text-teal-700">{dinero(k.ahorro)}</b>
              </div>
              <span className="block text-sm text-ink-3">
                27% del costo extraordinario, si se corrige la causa.
              </span>
            </div>
          </div>
        </Panel>
      </div>

      <Panel
        titulo="Análisis por materia prima"
        pie="qué material genera más costo logístico"
      >
        {!lider ? (
          <p className="text-sm text-ink-3">Sin datos con estos filtros.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
            <div className="rounded-sm border border-rojo-100 bg-rojo-50 p-4">
              <span className="flex items-center gap-1.5 text-sm font-bold text-rojo-700">
                <LuTriangleAlert size={14} />
                Mayor impacto
              </span>
              <b className="mt-1 block text-xl font-bold text-navy-800">{lider.clave}</b>
              <b className="num block text-3xl font-bold text-rojo-700">{dinero(lider.valor)}</b>
              <span className="mt-1 block text-sm text-ink-2">
                {lider.pct}% del costo filtrado · {lider.embarques} embarques
              </span>
            </div>
            <div className="flex flex-col gap-2">
              {ranking.map((g, i) => (
                <div key={g.clave} className="flex items-center gap-3 rounded-sm border border-line bg-surface-2 px-3 py-2">
                  <span className="num flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-navy-800 text-xs font-bold text-white">
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <b className="block truncate font-semibold text-ink">{g.clave}</b>
                    <span className="num block text-sm text-ink-3">{g.pct}% del total · {g.embarques} embarques</span>
                  </span>
                  <b className="num shrink-0 font-bold text-navy-800">{dinero(g.valor)}</b>
                </div>
              ))}
            </div>
          </div>
        )}
      </Panel>

      <div className="panel">
        <div className="panel-head">
          <span className="panel-title">Detalle operacional de costos</span>
          <span className="num ml-auto text-sm text-ink-3">
            {detalle.length} de {k.embarques} · mayores primero
          </span>
        </div>
        <div className="tabla-scroll">
          <table className="tbl">
            <thead>
              <tr>
                <th className="w-[110px]">Embarque</th>
                <th className="min-w-[180px]">Materia prima</th>
                <th className="w-[160px]">Aduana</th>
                <th className="w-[190px]">Naviera</th>
                <th className="w-[140px]">Categoría</th>
                <th className="w-[120px] text-right!">Monto</th>
                <th className="w-[180px]">Estado</th>
              </tr>
            </thead>
            <tbody>
              {detalle.length === 0 && (
                <tr>
                  <td colSpan={7} className="h-[140px]! bg-surface text-center text-sm text-ink-3">
                    No existen registros para los filtros seleccionados.
                  </td>
                </tr>
              )}
              {detalle.map((r) => (
                <tr key={r.id} style={{ '--spine': TONO_PRIORIDAD[r.prioridad].lomo }}>
                  <td className="cell-key">{r.id}</td>
                  <td className="cell-strong">{r.materia}</td>
                  <td>{r.aduana}</td>
                  <td>{r.naviera}</td>
                  <td>{r.categoria}</td>
                  <td className="cell-num font-bold text-navy-800">{dinero(r.monto)}</td>
                  <td>
                    <Chip prioridad={r.prioridad} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {informe && (
        <div className="sticky bottom-4 z-10 flex flex-wrap items-center gap-3 rounded-sm border border-navy-100 bg-navy-50 px-4 py-3 shadow-[0_10px_28px_-14px_rgba(0,28,44,0.45)]">
          <LuFileText size={16} className="shrink-0 text-navy-700" />
          <span className="min-w-0 flex-1 text-sm text-ink-2">
            {elegidos.length === 0
              ? 'Marcá los gráficos que querés incluir y escribiles un comentario.'
              : `${elegidos.length} gráfico${elegidos.length === 1 ? '' : 's'} seleccionado${
                  elegidos.length === 1 ? '' : 's'
                }.`}
          </span>
          <Button
            size="sm"
            variant="primary"
            disabled={elegidos.length === 0}
            onClick={() => setVerInforme(true)}
          >
            <LuFileText size={14} /> Generar informe
          </Button>
        </div>
      )}

      <Modal
        open={verInforme}
        onClose={() => setVerInforme(false)}
        size="lg"
        eyebrow="Performance Compass · Costos logísticos"
        title="Informe de costos logísticos"
        footer={
          <>
            <span className="min-w-0 flex-1 text-sm text-ink-2">
              {elegidos.length} gráfico{elegidos.length === 1 ? '' : 's'} · {fmtFecha(new Date())}
            </span>
            <Button variant="quiet" onClick={() => setVerInforme(false)}>
              Cerrar
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                avisar(`Informe generado con ${elegidos.length} gráfico${
                  elegidos.length === 1 ? '' : 's'
                } (demo).`)
                setVerInforme(false)
              }}
            >
              <LuFileDown size={14} /> Descargar
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-5">
          <div className="rounded-sm border border-line bg-surface-2 p-3 text-sm text-ink-2">
            <b className="font-bold text-navy-800">Alcance:</b> materias primas para snacks · {f.periodo}
            {' · '}
            {k.embarques} embarques{sucio ? ' · con filtros aplicados' : ''}.
          </div>
          {elegidos.map((g, i) => (
            <section key={g.id} className="border-b border-line pb-5 last:border-0 last:pb-0">
              <div className="mb-1 text-xs font-bold text-ink-3">GRÁFICO {i + 1}</div>
              <h3 className="m-0 mb-3 text-base font-bold text-navy-800">{g.titulo}</h3>
              <div className="rounded-sm border border-line bg-surface p-4">{g.nodo}</div>
              <div className="mt-3">
                <span className="lbl mb-1 block">Comentario</span>
                {sel[g.id]?.trim() ? (
                  <p className="m-0 whitespace-pre-wrap text-sm text-ink-2">{sel[g.id]}</p>
                ) : (
                  <p className="m-0 text-sm text-ink-4">Sin comentario.</p>
                )}
              </div>
            </section>
          ))}
        </div>
      </Modal>
    </div>
  )
}
