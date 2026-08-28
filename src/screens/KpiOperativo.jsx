import { useMemo, useState } from 'react'
import {
  LuBoxes,
  LuBuilding2,
  LuFileDown,
  LuGitCompareArrows,
  LuLayoutDashboard,
  LuMapPinned,
  LuPrinter,
  LuSearchX,
  LuShip,
  LuStamp,
  LuTrafficCone,
} from 'react-icons/lu'
import Button, { cx } from '../components/ui/Button'
import { Select } from '../components/ui/Field'
import { LineasMulti, Reparto } from '../components/ui/Graficos'
import { Kpi } from '../components/ui/Valores'
import { useOc } from '../data/store'
import {
  ADUANAS_OP,
  COLOR_SELECTIVO,
  NAVIERAS_OP,
  ORIGENES_OP,
  PRODUCTOS_OP,
  PROVEEDORES_OP,
  SELECTIVOS,
  SLA_ADUANA,
  TOLERANCIA_DIAS,
} from '../data/kpiOperativo'
import {
  FILTRO_VACIO_OP,
  SEGMENTOS_OP,
  aduanasDelPais,
  comparar,
  filtrarOp,
  porAduanaOp,
  porModalidadOp,
  porNavieraOp,
  porOrigenOp,
  porProductoOp,
  porProveedorOp,
  porSelectivo,
  referenciasDe,
  resumenOp,
  score,
} from '../lib/kpiOperativo'
import { fmtNum } from '../lib/fechas'

// Las ocho entradas del sidebar del mockup, acá como pestañas.
const VISTAS = [
  { id: 'resumen', rotulo: 'Resumen ejecutivo', icono: LuLayoutDashboard },
  { id: 'proveedores', rotulo: 'Cumplimiento proveedores', icono: LuBuilding2 },
  { id: 'transito', rotulo: 'Tiempos en tránsito', icono: LuShip },
  { id: 'aduana', rotulo: 'Cumplimiento aduana', icono: LuStamp },
  { id: 'selectivos', rotulo: 'Selectivos y liberación', icono: LuTrafficCone },
  { id: 'productos', rotulo: 'Tiempos por producto', icono: LuBoxes },
  { id: 'pais', rotulo: 'Aduanas del país', icono: LuMapPinned },
  { id: 'comparador', rotulo: 'Comparador de desviaciones', icono: LuGitCompareArrows },
]

const d1 = (v) => fmtNum(v, 1)

// El semáforo de cumplimiento es el del mockup: 95 y 90 son los dos cortes.
const tonoPct = (v) => (v >= 95 ? 'bg-teal-600' : v >= 90 ? 'bg-ambar-500' : 'bg-rojo-600')
const TONO_SCORE = {
  5: 'bg-teal-50 text-teal-700',
  4: 'bg-teal-50 text-teal-700',
  3: 'bg-ambar-50 text-ambar-700',
  2: 'bg-rojo-50 text-rojo-700',
  1: 'bg-rojo-50 text-rojo-700',
}

function Panel({ titulo, etiqueta, nota, children }) {
  return (
    <section className="panel">
      <div className="panel-head">
        <span className="panel-title">{titulo}</span>
        {etiqueta && (
          <span className="ml-auto rounded-full bg-navy-50 px-2.5 py-[3px] text-xs font-bold text-navy-700">
            {etiqueta}
          </span>
        )}
      </div>
      <div className="flex flex-col gap-4 p-4">
        {nota && (
          <p className="m-0 rounded-sm border-l-[3px] border-navy-600 bg-surface-2 px-3 py-2 text-sm text-ink-2">
            {nota}
          </p>
        )}
        {children}
      </div>
    </section>
  )
}

function Vacio() {
  return <span className="block py-6 text-center text-sm text-ink-3">Sin datos con estos filtros.</span>
}

/** Barra de cumplimiento: el color es el semáforo, el número siempre se lee. */
function BarraPct({ rotulo, detalle, valor }) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <span className="min-w-0 truncate text-sm text-ink-2" title={rotulo}>
          {rotulo}
          {detalle && <span className="text-ink-3"> · {detalle}</span>}
        </span>
        <b className="num shrink-0 font-bold text-ink">{valor}%</b>
      </div>
      <span className="mt-1 block h-2 w-full overflow-hidden rounded-full bg-surface-3">
        <span
          className={cx('block h-full rounded-full', tonoPct(valor))}
          style={{ width: `${Math.min(100, valor)}%` }}
        />
      </span>
    </div>
  )
}

/** Barra de días. El tope fija la escala para que las vistas se comparen entre sí. */
function BarraDias({ rotulo, detalle, valor, tope = 8, color }) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <span className="min-w-0 truncate text-sm text-ink-2" title={rotulo}>
          {rotulo}
          {detalle && <span className="text-ink-3"> · {detalle}</span>}
        </span>
        <b className="num shrink-0 font-bold text-ink">{valor ? `${d1(valor)} d` : '—'}</b>
      </div>
      <span className="mt-1 block h-2 w-full overflow-hidden rounded-full bg-surface-3">
        <span
          className="block h-full rounded-full"
          style={{ width: `${Math.min(100, (valor / tope) * 100)}%`, background: color ?? '#17587a' }}
        />
      </span>
    </div>
  )
}

function Lista({ children }) {
  return <div className="flex flex-col gap-2.5">{children}</div>
}

/** Control Tower: cómo cumplen proveedores, transporte y aduana. */
export default function KpiOperativo() {
  const { avisar } = useOc()
  const [vista, setVista] = useState('resumen')
  const [f, setF] = useState(FILTRO_VACIO_OP)
  const [segmento, setSegmento] = useState('proveedor')
  const [referencia, setReferencia] = useState('')

  const filas = useMemo(() => filtrarOp(f), [f])
  const r = resumenOp(filas)
  const set = (k, v) => setF((prev) => ({ ...prev, [k]: v }))
  const hayFiltro = Object.values(f).some(Boolean)

  const proveedores = useMemo(() => porProveedorOp(filas), [filas])
  const navieras = useMemo(() => porNavieraOp(filas), [filas])
  const origenes = useMemo(() => porOrigenOp(filas), [filas])
  const aduanas = useMemo(() => porAduanaOp(filas), [filas])
  const modalidades = useMemo(() => porModalidadOp(filas), [filas])
  const selectivos = useMemo(() => porSelectivo(filas), [filas])
  const productos = useMemo(() => porProductoOp(filas), [filas])
  const pais = useMemo(() => aduanasDelPais(filas), [filas])

  // La referencia depende del segmento y de los filtros: si deja de existir,
  // cae en la primera disponible en vez de quedar en blanco.
  const referencias = useMemo(() => referenciasDe(filas, segmento), [filas, segmento])
  const refActiva = referencias.includes(referencia) ? referencia : (referencias[0] ?? '')
  const cmp = refActiva ? comparar(filas, segmento, refActiva) : null

  const conDatos = pais.filter((a) => a.n)
  const masLenta = conDatos.length ? conDatos[conDatos.length - 1] : null

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="m-0 text-lg font-bold text-navy-800">
            Control Tower · desempeño operativo
          </h2>
          <p className="m-0 text-sm text-ink-3">
            {r.embarques} embarques simulados: proveedores (ETD vs ATD), transporte internacional
            (ETA vs ATA) y aduana (SLA de nacionalización). Los filtros se conservan al cambiar de
            pestaña.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => avisar('Exportación de desempeño generada (demo).')}>
            <LuFileDown size={14} /> Exportar
          </Button>
          <Button size="sm" variant="primary" onClick={() => avisar('Informe enviado (demo).')}>
            <LuPrinter size={14} /> Imprimir
          </Button>
        </div>
      </div>

      {/* Filtros: una sola fila arriba de todo, compartida por las ocho pestañas */}
      <div className="panel flex flex-wrap items-center gap-2 p-3">
        <Select placeholder="Todos los proveedores" options={PROVEEDORES_OP} value={f.proveedor} onChange={(e) => set('proveedor', e.target.value)} className="w-[180px]" />
        <Select placeholder="Todas las navieras" options={NAVIERAS_OP} value={f.naviera} onChange={(e) => set('naviera', e.target.value)} className="w-[175px]" />
        <Select placeholder="Todos los orígenes" options={ORIGENES_OP} value={f.origen} onChange={(e) => set('origen', e.target.value)} className="w-[165px]" />
        <Select placeholder="Todas las aduanas" options={ADUANAS_OP} value={f.aduana} onChange={(e) => set('aduana', e.target.value)} className="w-[165px]" />
        <Select placeholder="Todos los productos" options={PRODUCTOS_OP} value={f.producto} onChange={(e) => set('producto', e.target.value)} className="w-[165px]" />
        <Select placeholder="Todos los selectivos" options={SELECTIVOS} value={f.selectivo} onChange={(e) => set('selectivo', e.target.value)} className="w-[165px]" />

        {hayFiltro && (
          <Button size="sm" onClick={() => setF(FILTRO_VACIO_OP)}>
            <LuSearchX size={14} /> Limpiar
          </Button>
        )}
        <span className="num ml-auto rounded-full bg-surface-3 px-2.5 py-[3px] text-xs font-bold text-ink-2">
          {r.embarques} embarques
        </span>
      </div>

      <div className="tabbar">
        {VISTAS.map(({ id, rotulo, icono: Icono }) => {
          const activo = vista === id
          return (
            <button key={id} onClick={() => setVista(id)} className={cx('tab', activo && 'tab-on')}>
              <Icono size={14} className={activo ? 'text-navy-700' : 'text-ink-4'} />
              {rotulo}
            </button>
          )
        })}
      </div>

      {/* --------------------------- RESUMEN EJECUTIVO --------------------------- */}
      {vista === 'resumen' && (
        <>
          <div className="flex flex-wrap gap-2">
            <Kpi rotulo="Cumplimiento proveedor" valor={`${r.proveedor}%`} tono="border-navy-100 bg-navy-50" />
            <Kpi rotulo="Fiabilidad tránsito" valor={`${r.transito}%`} />
            <Kpi rotulo="Cumplimiento aduana" valor={`${r.aduana}%`} />
            <Kpi rotulo="Desviación tránsito" valor={`${d1(r.desviacion)} d`} />
            <Kpi rotulo="Embarques" valor={r.embarques} tono="border-teal-100 bg-teal-50" />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Panel
              titulo="Salud operativa"
              etiqueta="Score"
              nota="Promedio de las tres dimensiones: proveedor, transporte y aduana. Se recalcula con los filtros activos."
            >
              <div className="flex items-baseline gap-2">
                <span className="num text-4xl font-bold text-navy-800">{r.salud}%</span>
                <span className="text-sm text-ink-3">salud general</span>
              </div>
              <Lista>
                <BarraPct rotulo="Proveedores" valor={r.proveedor} />
                <BarraPct rotulo="Tránsito" valor={r.transito} />
                <BarraPct rotulo="Aduana" valor={r.aduana} />
              </Lista>
            </Panel>

            <Panel titulo="Principales riesgos" etiqueta="Incumplimiento">
              <Lista>
                {[
                  { clave: 'Proveedores', valor: 100 - r.proveedor },
                  { clave: 'Tránsito', valor: 100 - r.transito },
                  { clave: 'Aduana', valor: 100 - r.aduana },
                ]
                  .sort((a, b) => b.valor - a.valor)
                  .map((x) => (
                    <div key={x.clave}>
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="text-sm text-ink-2">{x.clave}</span>
                        <b className="num font-bold text-ink">{x.valor}%</b>
                      </div>
                      <span className="mt-1 block h-2 w-full overflow-hidden rounded-full bg-surface-3">
                        <span
                          className={cx('block h-full rounded-full', x.valor > 10 ? 'bg-rojo-600' : 'bg-ambar-500')}
                          style={{ width: `${x.valor}%` }}
                        />
                      </span>
                    </div>
                  ))}
              </Lista>
            </Panel>

            <Panel titulo="Distribución por producto" etiqueta="Embarques">
              {filas.length ? (
                <Lista>
                  {productos
                    .filter((p) => p.n)
                    .map((p) => (
                      <BarraPct key={p.clave} rotulo={p.clave} detalle={`${p.n} embarques`} valor={p.participacion} />
                    ))}
                </Lista>
              ) : (
                <Vacio />
              )}
            </Panel>
          </div>
        </>
      )}

      {/* ------------------------ CUMPLIMIENTO PROVEEDORES ----------------------- */}
      {vista === 'proveedores' && (
        <>
          <div className="flex flex-wrap gap-2">
            <Kpi rotulo="Cumplimiento total" valor={`${r.proveedor}%`} tono="border-navy-100 bg-navy-50" />
            <Kpi
              rotulo="Score promedio"
              valor={proveedores.length ? `${d1(proveedores.reduce((a, p) => a + score(p.cumplimiento), 0) / proveedores.length)}/5` : '—'}
            />
            <Kpi rotulo="Mejor proveedor" valor={proveedores[0]?.clave ?? '—'} />
            <Kpi
              rotulo="Bajo objetivo"
              valor={proveedores.filter((p) => p.cumplimiento < 90).length}
              tono="border-rojo-100 bg-rojo-50"
            />
            <Kpi rotulo="Embarques" valor={r.embarques} />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Panel
              titulo="Cumplimiento por proveedor"
              etiqueta="% on time"
              nota={`Se compara el ETD comprometido contra el ATD real de planta. El embarque cumple si sale dentro de la tolerancia de +${TOLERANCIA_DIAS} día.`}
            >
              {proveedores.length ? (
                <Lista>
                  {proveedores.map((p) => (
                    <BarraPct key={p.clave} rotulo={p.clave} detalle={`${p.n} embarques`} valor={p.cumplimiento} />
                  ))}
                </Lista>
              ) : (
                <Vacio />
              )}
            </Panel>

            <Panel titulo="Score operativo 1–5" etiqueta="Ponderación">
              {proveedores.length ? (
                <div className="flex flex-col">
                  {proveedores.map((p) => {
                    const s = score(p.cumplimiento)
                    return (
                      <div
                        key={p.clave}
                        className="flex items-center justify-between gap-3 border-b border-line-soft py-2 last:border-b-0"
                      >
                        <span className="min-w-0 truncate text-sm">
                          <b className="font-semibold text-ink">{p.clave}</b>
                          <span className="text-ink-3"> · {p.n} embarques</span>
                        </span>
                        <span className={cx('num shrink-0 rounded-full px-2.5 py-[3px] text-xs font-bold', TONO_SCORE[s])}>
                          {s}
                        </span>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <Vacio />
              )}
            </Panel>
          </div>
        </>
      )}

      {/* -------------------------- TIEMPOS EN TRÁNSITO -------------------------- */}
      {vista === 'transito' && (
        <>
          <div className="flex flex-wrap gap-2">
            <Kpi rotulo="Fiabilidad total" valor={`${r.transito}%`} tono="border-navy-100 bg-navy-50" />
            <Kpi rotulo="Desviación media" valor={`${d1(r.desviacion)} d`} />
            <Kpi
              rotulo="Rutas críticas"
              valor={origenes.filter((o) => o.riesgo > 10).length}
              tono="border-rojo-100 bg-rojo-50"
            />
            <Kpi rotulo="Naviera líder" valor={navieras[0]?.clave ?? '—'} />
            <Kpi rotulo="Embarques" valor={r.embarques} />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Panel
              titulo="Fiabilidad por naviera"
              etiqueta="ETA vs ATA"
              nota="Compara el ETA contra el ATA a la aduana de destino, con todos los embarques de cada naviera."
            >
              {navieras.length ? (
                <Lista>
                  {navieras.map((c) => (
                    <BarraPct
                      key={c.clave}
                      rotulo={c.clave}
                      detalle={`${c.n} embarques · ${d1(c.desviacion)} d de desviación`}
                      valor={c.cumplimiento}
                    />
                  ))}
                </Lista>
              ) : (
                <Vacio />
              )}
            </Panel>

            <Panel titulo="Orígenes y rutas de riesgo" etiqueta="Origen → aduana">
              {origenes.length ? (
                <div className="flex flex-col">
                  {origenes.map((o) => (
                    <div
                      key={o.clave}
                      className="flex items-start justify-between gap-3 border-b border-line-soft py-2 last:border-b-0"
                    >
                      <span className="min-w-0 flex-1">
                        <b className="block truncate font-semibold text-ink">{o.clave}</b>
                        <span className="block truncate text-xs text-ink-3">
                          {o.rutas.slice(0, 2).join(' · ')}
                        </span>
                      </span>
                      <span className="num shrink-0 text-sm text-ink-3">{o.n} embarques</span>
                      <b
                        className={cx(
                          'num shrink-0 rounded-full px-2.5 py-[3px] text-xs font-bold',
                          o.riesgo > 10 ? 'bg-rojo-50 text-rojo-700' : 'bg-teal-50 text-teal-700',
                        )}
                      >
                        {o.riesgo}% riesgo
                      </b>
                    </div>
                  ))}
                </div>
              ) : (
                <Vacio />
              )}
            </Panel>
          </div>
        </>
      )}

      {/* -------------------------- CUMPLIMIENTO ADUANA -------------------------- */}
      {vista === 'aduana' && (
        <>
          <div className="flex flex-wrap gap-2">
            <Kpi rotulo="Cumplimiento SLA" valor={`${r.aduana}%`} tono="border-navy-100 bg-navy-50" />
            <Kpi rotulo="Tiempo promedio" valor={`${d1(r.diasAduana)} d`} />
            <Kpi rotulo="Casos fuera de SLA" valor={r.fueraDeSla} tono="border-rojo-100 bg-rojo-50" />
            <Kpi rotulo="Aduana crítica" valor={aduanas[0]?.clave ?? '—'} />
            <Kpi rotulo="Operaciones" valor={r.embarques} />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Panel
              titulo="Nacionalización por aduana"
              etiqueta="Días promedio"
              nota="Días desde el arribo hasta el despacho, contrastados contra el SLA del selectivo que le tocó a cada embarque."
            >
              {aduanas.length ? (
                <Lista>
                  {aduanas.map((a) => (
                    <BarraDias key={a.clave} rotulo={a.clave} detalle={`${a.n} embarques`} valor={a.dias} />
                  ))}
                </Lista>
              ) : (
                <Vacio />
              )}

              <div>
                <span className="lbl mb-2 block border-l-[3px] border-navy-600 pl-2">
                  Segmentación por modalidad
                </span>
                {modalidades.length ? (
                  <div className="flex flex-col">
                    {modalidades.map((m) => (
                      <div
                        key={m.clave}
                        className="flex items-center justify-between gap-3 border-b border-line-soft py-2 last:border-b-0"
                      >
                        <span className="text-sm font-semibold text-ink">{m.clave}</span>
                        <span className="num text-sm text-ink-3">{m.n} embarques</span>
                        <b className="num font-bold text-ink">{d1(m.dias)} d</b>
                      </div>
                    ))}
                  </div>
                ) : (
                  <Vacio />
                )}
              </div>
            </Panel>

            <Panel titulo="Desempeño contra SLA" etiqueta="% dentro de SLA">
              {aduanas.length ? (
                <Lista>
                  {aduanas.map((a) => (
                    <BarraPct key={a.clave} rotulo={a.clave} detalle={`${a.n} embarques`} valor={a.cumplimiento} />
                  ))}
                </Lista>
              ) : (
                <Vacio />
              )}
            </Panel>
          </div>
        </>
      )}

      {/* ------------------------ SELECTIVOS Y LIBERACIÓN ------------------------ */}
      {vista === 'selectivos' && (
        <>
          <div className="flex flex-wrap gap-2">
            {selectivos.map((s) => (
              <Kpi key={s.clave} rotulo={`Selectivo ${s.clave.toLowerCase()}`} valor={`${s.participacion}%`} />
            ))}
            <Kpi rotulo="Liberación promedio" valor={`${d1(r.diasAduana)} d`} tono="border-navy-100 bg-navy-50" />
            <Kpi rotulo="Fuera de SLA" valor={r.fueraDeSla} tono="border-rojo-100 bg-rojo-50" />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Panel titulo="Distribución de selectivos" etiqueta="Volumen">
              <Reparto
                datos={selectivos.filter((s) => s.n).map((s) => ({ clave: s.clave, valor: s.n }))}
                color={COLOR_SELECTIVO}
                sufijo=" emb."
              />

              <div>
                <span className="lbl mb-2 block border-l-[3px] border-navy-600 pl-2">
                  Promedio por aduana
                </span>
                {aduanas.length ? (
                  <Lista>
                    {aduanas.map((a) => (
                      <BarraDias key={a.clave} rotulo={a.clave} detalle={`${a.n}`} valor={a.dias} />
                    ))}
                  </Lista>
                ) : (
                  <Vacio />
                )}
              </div>

              <div>
                <span className="lbl mb-2 block border-l-[3px] border-navy-600 pl-2">
                  Promedio por categoría de producto
                </span>
                {productos.some((p) => p.n) ? (
                  <Lista>
                    {productos
                      .filter((p) => p.n)
                      .map((p) => (
                        <BarraDias key={p.clave} rotulo={p.clave} detalle={`${p.n}`} valor={p.dias} />
                      ))}
                  </Lista>
                ) : (
                  <Vacio />
                )}
              </div>
            </Panel>

            <Panel
              titulo="Liberación vs SLA"
              etiqueta="Días"
              nota="Cada selectivo tiene su propio SLA: verde 2 días, amarillo 4 y rojo 6. La barra es el promedio real."
            >
              {selectivos.some((s) => s.n) ? (
                <Lista>
                  {selectivos
                    .filter((s) => s.n)
                    .map((s) => (
                      <BarraDias
                        key={s.clave}
                        rotulo={s.clave}
                        detalle={`${s.n} embarques · SLA ${s.sla} d`}
                        valor={s.dias}
                        color={COLOR_SELECTIVO[s.clave]}
                      />
                    ))}
                </Lista>
              ) : (
                <Vacio />
              )}
            </Panel>
          </div>
        </>
      )}

      {/* -------------------------- TIEMPOS POR PRODUCTO ------------------------- */}
      {vista === 'productos' && (
        <>
          <div className="flex flex-wrap gap-2">
            {productos.map((p) => (
              <Kpi key={p.clave} rotulo={p.clave} valor={p.n ? `${d1(p.dias)} d` : '—'} />
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Panel titulo="Nacionalización por producto" etiqueta="Días promedio">
              {productos.some((p) => p.n) ? (
                <Lista>
                  {productos
                    .filter((p) => p.n)
                    .map((p) => (
                      <BarraDias key={p.clave} rotulo={p.clave} detalle={`${p.n} embarques`} valor={p.dias} />
                    ))}
                </Lista>
              ) : (
                <Vacio />
              )}
            </Panel>

            <Panel titulo="Participación de embarques" etiqueta="%">
              {productos.some((p) => p.n) ? (
                <Lista>
                  {productos
                    .filter((p) => p.n)
                    .map((p) => (
                      <BarraPct key={p.clave} rotulo={p.clave} detalle={`${p.n} embarques`} valor={p.participacion} />
                    ))}
                </Lista>
              ) : (
                <Vacio />
              )}
            </Panel>
          </div>
        </>
      )}

      {/* --------------------------- ADUANAS DEL PAÍS ---------------------------- */}
      {vista === 'pais' && (
        <>
          <div className="flex flex-wrap gap-2">
            <Kpi rotulo="Mejor aduana" valor={conDatos[0]?.clave ?? '—'} tono="border-teal-100 bg-teal-50" />
            <Kpi rotulo="Mayor tiempo" valor={masLenta ? `${d1(masLenta.dias)} d` : '—'} />
            <Kpi
              rotulo={`Cumplimiento SLA ${SLA_ADUANA} d`}
              valor={`${filas.length ? Math.round((filas.filter((e) => e.dias <= SLA_ADUANA).length / filas.length) * 100) : 0}%`}
            />
            <Kpi rotulo="Aduanas activas" valor={`${conDatos.length} / ${ADUANAS_OP.length}`} />
            <Kpi rotulo="Operaciones" valor={r.embarques} />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Panel
              titulo="Comparación de aduanas"
              etiqueta="Tiempo promedio"
              nota="Las catorce aduanas del país, de la más rápida a la más lenta. Las que quedan sin embarques con estos filtros se muestran vacías."
            >
              <Lista>
                {pais.map((a) => (
                  <BarraDias key={a.clave} rotulo={a.clave} detalle={a.n ? `${a.n} embarques` : 'sin embarques'} valor={a.dias} />
                ))}
              </Lista>
            </Panel>

            <Panel titulo="Cumplimiento por aduana" etiqueta={`SLA ${SLA_ADUANA} días`}>
              <Lista>
                {pais.map((a) => (
                  <BarraPct key={a.clave} rotulo={a.clave} detalle={a.n ? `${a.n} embarques` : 'sin embarques'} valor={a.cumplimiento} />
                ))}
              </Lista>
            </Panel>
          </div>
        </>
      )}

      {/* ----------------------- COMPARADOR DE DESVIACIONES ---------------------- */}
      {vista === 'comparador' && (
        <>
          <div className="panel flex flex-wrap items-center gap-2 p-3">
            <Select
              options={SEGMENTOS_OP.map((s) => ({ value: s.id, label: s.rotulo }))}
              value={segmento}
              onChange={(e) => setSegmento(e.target.value)}
              className="w-[230px]"
            />
            <Select
              options={referencias}
              value={refActiva}
              onChange={(e) => setReferencia(e.target.value)}
              className="w-[200px]"
            />
            <span className="mx-1 h-6 w-px bg-line" />
            <Kpi rotulo="Plan" valor={cmp ? (cmp.porCasos ? `${cmp.plan} casos` : `${d1(cmp.plan)} d`) : '—'} />
            <Kpi rotulo="Real" valor={cmp ? (cmp.porCasos ? `${cmp.real} OK` : `${d1(cmp.real)} d`) : '—'} />
            <Kpi
              rotulo="Gap"
              valor={cmp ? (cmp.porCasos ? `${Math.round(cmp.gap)} pp` : `${cmp.gap >= 0 ? '+' : ''}${d1(cmp.gap)} d`) : '—'}
              tono={cmp?.desviado ? 'border-rojo-100 bg-rojo-50' : 'border-teal-100 bg-teal-50'}
            />
          </div>

          {!cmp ? (
            <Panel titulo="Comparador operativo" etiqueta="Plan vs real">
              <Vacio />
            </Panel>
          ) : (
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.6fr_1fr]">
              <div className="flex flex-col gap-4">
                <Panel titulo={`Comparación visual · ${refActiva}`} etiqueta="Plan vs real">
                  <Lista>
                    <BarraDias
                      rotulo="Plan"
                      valor={cmp.porCasos ? 100 : cmp.plan}
                      tope={cmp.porCasos ? 100 : Math.max(cmp.plan, cmp.real, 1)}
                      detalle={cmp.porCasos ? `${cmp.plan} casos` : cmp.rotuloPlan}
                    />
                    <BarraDias
                      rotulo="Real"
                      valor={cmp.porCasos ? cmp.ratio : cmp.real}
                      tope={cmp.porCasos ? 100 : Math.max(cmp.plan, cmp.real, 1)}
                      detalle={cmp.porCasos ? `${cmp.real} cumplidos` : cmp.rotuloReal}
                      color={cmp.desviado ? '#c0453f' : '#2b8f5e'}
                    />
                  </Lista>

                  <p
                    className={cx(
                      'm-0 rounded-sm px-3 py-2 text-sm',
                      cmp.desviado ? 'bg-rojo-50 text-rojo-700' : 'bg-teal-50 text-teal-700',
                    )}
                  >
                    {cmp.desviado
                      ? `Se detectó una desviación: ${cmp.afectados.length} embarques requieren seguimiento operativo.`
                      : 'Sin desviación relevante bajo el criterio seleccionado.'}
                  </p>
                </Panel>

                <Panel titulo="Plan vs real por embarque" etiqueta={`${cmp.serie.length} embarques`}>
                  <LineasMulti
                    datos={cmp.serie}
                    series={[
                      { id: 'plan', rotulo: cmp.rotuloPlan, color: '#17587a' },
                      { id: 'real', rotulo: cmp.rotuloReal, color: '#c0453f' },
                    ]}
                    fmt={d1}
                  />
                </Panel>

                <Panel titulo="Embarques afectados" etiqueta={`${cmp.afectados.length} casos`}>
                  {cmp.afectados.length ? (
                    <div className="tabla-scroll">
                      <table className="tbl">
                        <thead>
                          <tr>
                            <th className="w-[120px]">Embarque</th>
                            <th>Proveedor</th>
                            <th>Naviera</th>
                            <th>Aduana</th>
                            <th className="w-[110px]">Selectivo</th>
                            <th className="w-[110px] text-right!">Días</th>
                          </tr>
                        </thead>
                        <tbody>
                          {cmp.afectados.map((e) => (
                            <tr key={e.id}>
                              <td className="cell-key">{e.id}</td>
                              <td>{e.proveedor}</td>
                              <td>{e.naviera}</td>
                              <td>{e.aduana}</td>
                              <td>
                                <span
                                  className="inline-block rounded-full px-2.5 py-[3px] text-xs font-semibold text-white"
                                  style={{ background: COLOR_SELECTIVO[e.selectivo] }}
                                >
                                  {e.selectivo}
                                </span>
                              </td>
                              <td className="cell-num">{e.dias} d</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <span className="block py-6 text-center text-sm text-ink-3">
                      No hay embarques afectados con este criterio.
                    </span>
                  )}
                </Panel>
              </div>

              <Panel titulo="Gestión operativa" etiqueta="Acción">
                <b className="text-lg font-bold text-navy-800">
                  {cmp.desviado ? 'Gestionar desviación' : 'Mantener control'}
                </b>
                <p className="m-0 text-sm text-ink-2">
                  {cmp.desviado
                    ? 'Priorizar los casos afectados, identificar causa raíz, asignar responsable y fijar fecha de recuperación.'
                    : 'El indicador está dentro del criterio. Mantener el monitoreo preventivo.'}
                </p>
                <div className="flex flex-col">
                  {[
                    ['Prioridad', cmp.prioridad],
                    ['Gap', cmp.porCasos ? `${Math.round(cmp.gap)} pp` : `${cmp.gap >= 0 ? '+' : ''}${d1(cmp.gap)} d`],
                    ['Casos afectados', cmp.afectados.length],
                  ].map(([rotulo, valor]) => (
                    <div
                      key={rotulo}
                      className="flex items-center justify-between gap-3 border-b border-line-soft py-2 last:border-b-0"
                    >
                      <span className="text-sm text-ink-3">{rotulo}</span>
                      <b className="num font-bold text-ink">{valor}</b>
                    </div>
                  ))}
                </div>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => avisar(`Plan de acción abierto para ${refActiva} (demo).`, 'alerta')}
                >
                  Abrir plan de acción
                </Button>
              </Panel>
            </div>
          )}
        </>
      )}
    </div>
  )
}
