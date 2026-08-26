import { useMemo, useState } from 'react'
import { LuFileDown, LuPrinter, LuSearchX, LuTriangleAlert } from 'react-icons/lu'
import Button, { cx } from '../components/ui/Button'
import { Select } from '../components/ui/Field'
import { BarrasH, LineasMulti } from '../components/ui/Graficos'
import { Kpi } from '../components/ui/Valores'
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
        <div className="flex flex-wrap gap-2">
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
          <Panel titulo="Comportamiento de costos" pie="costo total contra la parte extraordinaria">
            <LineasMulti datos={tendencia} series={SERIES_COSTO} fmt={dinero} />
          </Panel>
        </div>
        <Panel titulo="Costo por aduana / puerto">
          <BarrasH datos={aduanas} fmt={dinero} />
        </Panel>
        <Panel titulo="Categorías de costo" pie="demora, estadías, chasis, WTD e inland">
          <BarrasH datos={categorias} fmt={dinero} />
        </Panel>
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
    </div>
  )
}
