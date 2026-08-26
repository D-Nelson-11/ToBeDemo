import { useMemo, useState } from 'react'
import {
  LuBuilding2,
  LuCog,
  LuFactory,
  LuFileDown,
  LuPackage,
  LuPrinter,
  LuShip,
  LuTriangleAlert,
  LuUsers,
} from 'react-icons/lu'
import Button, { cx } from '../components/ui/Button'
import { Select } from '../components/ui/Field'
import { Kpi } from '../components/ui/Valores'
import { useOc } from '../data/store'
import { COMANDOS, PLANTAS } from '../data/planning'
import {
  ESTADOS_ETA,
  construirImportaciones,
  indicadores,
  panelesLaterales,
  porPlanta,
  situacionSku,
  totalesPorUom,
} from '../lib/planning'
import { fmtFecha, fmtNum } from '../lib/fechas'

const TONO_COBERTURA = (c) => (c < 1 ? 'text-rojo-700' : c < 1.5 ? 'text-ambar-700' : 'text-teal-700')

const ICONO_SITUACION = {
  'En tránsito': LuShip,
  'En inventario': LuPackage,
  'En producción': LuCog,
}

/** Tarjeta de un panel lateral: título + filas contadas. */
function PanelLateral({ titulo, icono: Icono, filas, vacio, onFila, activo }) {
  return (
    <section className="panel">
      <div className="panel-head">
        <span className="panel-title">
          <Icono size={14} />
          {titulo}
        </span>
      </div>
      <div className="flex flex-col">
        {filas.length === 0 && <span className="px-3 py-3 text-sm text-ink-3">{vacio}</span>}
        {filas.map((g) => (
          <button
            key={g.clave}
            onClick={() => onFila?.(g)}
            disabled={!onFila}
            className={cx(
              'flex items-center gap-2 border-b border-line-soft px-3 py-2 text-left last:border-b-0',
              onFila && 'transition-colors duration-100 hover:bg-surface-2',
              !onFila && 'cursor-default',
              activo === g.clave && 'bg-navy-50',
            )}
          >
            <span className="min-w-0 flex-1 truncate text-sm text-ink-2" title={g.clave}>
              {g.clave}
            </span>
            {g.criticos > 0 && (
              <span className="num rounded-full bg-rojo-50 px-1.5 text-xs font-bold text-rojo-700">
                {g.criticos}
              </span>
            )}
            <span className="num rounded-full bg-surface-3 px-1.5 text-xs font-bold text-ink-3">
              {g.total}
            </span>
          </button>
        ))}
      </div>
    </section>
  )
}

/** Planning de importaciones: control de ETA por SKU y planta. */
export default function PlanningImportaciones() {
  const { avisar } = useOc()
  const [planta, setPlanta] = useState('')
  const [estado, setEstado] = useState('')
  const [sku, setSku] = useState('')
  const [comando, setComando] = useState('todos')

  const todas = useMemo(() => construirImportaciones(), [])
  const skus = useMemo(() => [...new Set(todas.map((r) => r.sku))].sort(), [todas])

  const filas = useMemo(() => {
    const prueba = COMANDOS.find((c) => c.id === comando).prueba
    return todas.filter(
      (r) =>
        (!planta || r.planta === planta) &&
        (!estado || r.estado === estado) &&
        (!sku || r.sku === sku) &&
        prueba(r),
    )
  }, [todas, planta, estado, sku, comando])

  const kpi = indicadores(filas)
  const uoms = totalesPorUom(filas)
  const paneles = panelesLaterales(filas)
  const plantas = porPlanta(filas)
  const situacion = sku ? situacionSku(todas, sku) : null
  const alertas = filas.filter((r) => r.estado === 'critico').sort((a, b) => a.dias - b.dias)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="m-0 text-lg font-bold text-navy-800">Planning de importaciones</h2>
          <p className="m-0 text-sm text-ink-3">
            Control de ETA por SKU y planta. El estado se mide contra la fecha de hoy, no contra una
            fecha de corte fija.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => avisar('Exportación de importaciones generada (demo).')}>
            <LuFileDown size={14} /> Exportar
          </Button>
          <Button size="sm" variant="primary" onClick={() => avisar('Indicadores enviados (demo).')}>
            <LuPrinter size={14} /> Indicadores
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Kpi rotulo="Importaciones monitoreadas" valor={kpi.total} />
        <Kpi rotulo="ETA críticas" valor={kpi.criticas} tono="border-rojo-100 bg-rojo-50" />
        <Kpi rotulo="En riesgo" valor={kpi.riesgo} tono="border-ambar-100 bg-ambar-50" />
        <Kpi rotulo="Cumplimiento ETA" valor={`${kpi.cumplimiento}%`} tono="border-teal-100 bg-teal-50" />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Select
          placeholder="Todas las plantas"
          options={PLANTAS}
          value={planta}
          onChange={(e) => setPlanta(e.target.value)}
          className="w-[200px]"
        />
        <Select
          placeholder="Todos los estados"
          options={Object.entries(ESTADOS_ETA).map(([value, v]) => ({ value, label: v.rotulo }))}
          value={estado}
          onChange={(e) => setEstado(e.target.value)}
          className="w-[180px]"
        />
        <Select
          placeholder="Todos los SKU"
          options={skus}
          value={sku}
          onChange={(e) => setSku(e.target.value)}
          className="w-[160px]"
        />
        <span className="mx-1 h-6 w-px bg-line" />
        {COMANDOS.map((c) => (
          <button
            key={c.id}
            onClick={() => setComando(c.id)}
            className={cx(
              'rounded-sm border px-2.5 py-1 text-sm transition-colors duration-100',
              comando === c.id
                ? 'border-navy-800 bg-navy-800 font-semibold text-white'
                : 'border-line bg-surface text-ink-2 hover:border-navy-400 hover:text-ink',
            )}
          >
            {c.rotulo}
          </button>
        ))}
      </div>

      {/* Las tres tarjetas de situación solo tienen sentido con un SKU elegido */}
      {situacion && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            ['En tránsito', LuShip, `${fmtNum(situacion.transito)} ${situacion.uom}`, 'border-navy-100 bg-navy-50'],
            ['En inventario', LuPackage, `${fmtNum(situacion.inventario)} ${situacion.uom}`, 'border-teal-100 bg-teal-50'],
            ['En producción', LuCog, `${situacion.produccion} planta(s)`, 'border-ambar-100 bg-ambar-50'],
          ].map(([rotulo, Icono, valor, tono]) => (
            <div key={rotulo} className={cx('rounded-sm border p-3', tono)}>
              <span className="flex items-center gap-1.5 text-sm font-bold text-ink-2">
                <Icono size={14} />
                {rotulo}
              </span>
              <b className="num mt-1 block text-2xl font-bold text-navy-800">{valor}</b>
              <span className="block text-sm text-ink-3">
                {situacion.sku} · {situacion.plantas.join(', ')}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="panel">
        <div className="panel-head">
          <span className="panel-title">Total por unidad de medida</span>
          <span className="text-sm text-ink-3">KG y unidades se totalizan por separado</span>
        </div>
        <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2">
          {uoms.length === 0 && <span className="text-sm text-ink-3">Sin filas con estos filtros.</span>}
          {uoms.map((t) => (
            <div key={t.uom} className="rounded-sm border border-line bg-surface-2 p-3">
              <div className="lbl mb-2">
                {t.uom}
                <span className="font-medium text-ink-3">· {t.skus} SKU</span>
              </div>
              <div className="flex flex-wrap gap-x-6 gap-y-1">
                <span className="text-sm text-ink-2">
                  Inventario <b className="num font-bold text-navy-800">{fmtNum(t.inventario)}</b>
                </span>
                <span className="text-sm text-ink-2">
                  En tránsito <b className="num font-bold text-navy-800">{fmtNum(t.transito)}</b>
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[260px_minmax(0,1fr)]">
        <div className="flex flex-col gap-3">
          <PanelLateral
            titulo="Causas de críticos"
            icono={LuTriangleAlert}
            filas={paneles.causas}
            vacio="Ninguna ETA vencida con estos filtros."
          />
          <PanelLateral titulo="Compradores" icono={LuUsers} filas={paneles.compradores} vacio="—" />
          <PanelLateral titulo="Proveedores" icono={LuBuilding2} filas={paneles.proveedores} vacio="—" />
          <section className="panel">
            <div className="panel-head">
              <span className="panel-title">
                <LuShip size={14} />
                Embarques en tránsito
              </span>
            </div>
            <div className="flex flex-col">
              {paneles.enTransito.length === 0 && (
                <span className="px-3 py-3 text-sm text-ink-3">Nada en tránsito con estos filtros.</span>
              )}
              {paneles.enTransito.map((r) => (
                <div key={r.clave} className="border-b border-line-soft px-3 py-2 last:border-b-0">
                  <div className="flex items-baseline gap-2">
                    <b className="num font-semibold text-ink">{r.sku}</b>
                    <span className="num ml-auto text-sm text-ink-3">{r.variacion}</span>
                  </div>
                  <span className="block text-sm text-ink-3">
                    {fmtNum(r.transito)} {r.uom} · {r.planta}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="flex flex-col gap-4">
          <div className="panel">
            <div className="panel-head">
              <span className="panel-title">ETA por SKU y planta</span>
              <span className="num ml-auto text-sm text-ink-3">{filas.length} de {todas.length}</span>
            </div>
            <div className="tabla-scroll">
              <table className="tbl">
                <thead>
                  <tr>
                    <th className="w-[110px]">SKU</th>
                    <th className="w-[160px]">Planta</th>
                    <th className="w-[130px] text-right!">Inventario</th>
                    <th className="w-[110px]">Cobertura</th>
                    <th className="w-[130px] text-right!">En tránsito</th>
                    <th className="w-[130px]">ETA</th>
                    <th className="w-[120px]">Variación</th>
                    <th className="w-[150px]">Estado ETA</th>
                    <th className="w-[150px]">Situación</th>
                  </tr>
                </thead>
                <tbody>
                  {filas.length === 0 && (
                    <tr>
                      <td colSpan={9} className="h-[140px]! bg-surface text-center text-sm text-ink-3">
                        Ninguna importación con estos filtros.
                      </td>
                    </tr>
                  )}
                  {filas.map((r) => {
                    const tono = ESTADOS_ETA[r.estado]
                    const IconoSit = ICONO_SITUACION[r.situacion]
                    return (
                      <tr key={r.clave} style={{ '--spine': tono.lomo }}>
                        <td className="cell-key">{r.sku}</td>
                        <td className="cell-cut" title={r.planta}>
                          {r.planta}
                        </td>
                        <td className="cell-num">
                          <b className="font-semibold text-ink">{fmtNum(r.inventario)}</b> {r.uom}
                        </td>
                        <td className={cx('num font-bold', TONO_COBERTURA(r.cobertura))}>
                          {r.cobertura.toFixed(1)} meses
                        </td>
                        <td className="cell-num">
                          {r.transito > 0 ? (
                            <>
                              <b className="font-semibold text-ink">{fmtNum(r.transito)}</b> {r.uom}
                            </>
                          ) : (
                            <span className="text-ink-4">—</span>
                          )}
                        </td>
                        <td className="num cell-strong">{fmtFecha(r.fecha)}</td>
                        <td className="num">{r.variacion}</td>
                        <td>
                          <span
                            className={cx(
                              'inline-block whitespace-nowrap rounded-full px-2.5 py-[3px] text-xs font-semibold',
                              tono.chip,
                            )}
                          >
                            {tono.rotulo}
                          </span>
                        </td>
                        <td>
                          <span className="flex items-center gap-1.5">
                            <IconoSit size={13} className="shrink-0 text-ink-4" />
                            {r.situacion}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="panel">
              <div className="panel-head">
                <span className="panel-title">
                  <LuFactory size={14} />
                  Estado por planta
                </span>
              </div>
              <div className="flex flex-col gap-3 p-4">
                {plantas.length === 0 && <span className="text-sm text-ink-3">Sin plantas con estos filtros.</span>}
                {plantas.map((p) => {
                  const pct = (n) => (p.total ? (n / p.total) * 100 : 0)
                  return (
                    <div key={p.clave}>
                      <div className="flex items-baseline justify-between gap-3 text-sm">
                        <span className="min-w-0 truncate font-medium text-ink">{p.clave}</span>
                        <span className="num shrink-0 text-ink-3">
                          {p.criticos > 0 && <b className="font-bold text-rojo-700">{p.criticos} crít.</b>}
                          {p.criticos > 0 && ' · '}
                          {p.total} SKU
                        </span>
                      </div>
                      <span className="mt-1 flex h-1.5 overflow-hidden rounded-full bg-surface-3">
                        <span className="block bg-rojo-600" style={{ width: `${pct(p.criticos)}%` }} />
                        <span className="block bg-ambar-500" style={{ width: `${pct(p.riesgo)}%` }} />
                        <span className="block bg-teal-600" style={{ width: `${pct(p.ok)}%` }} />
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="panel">
              <div className="panel-head">
                <span className="panel-title">
                  <LuTriangleAlert size={14} />
                  Alertas prioritarias
                </span>
              </div>
              <div className="flex flex-col gap-2 p-4">
                {alertas.length === 0 && (
                  <p className="text-sm text-ink-3">Ninguna ETA vencida con estos filtros.</p>
                )}
                {alertas.map((r) => (
                  <div
                    key={r.clave}
                    className="rounded-sm border border-rojo-100 bg-rojo-50 px-3 py-2 text-sm text-rojo-700"
                  >
                    <b className="font-bold">
                      {r.sku} · {r.planta}
                    </b>
                    <span className="block">
                      ETA {fmtFecha(r.fecha)} — {r.variacion}
                      {r.causa && `. ${r.causa}`}. Cobertura {r.cobertura.toFixed(1)} meses.
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
