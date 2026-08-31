import { useMemo, useState } from 'react'
import {
  LuBuilding2,
  LuChartColumn,
  LuCog,
  LuFileDown,
  LuFactory,
  LuFilter,
  LuPackage,
  LuPrinter,
  LuShip,
  LuTriangleAlert,
  LuUsers,
  LuX,
} from 'react-icons/lu'
import Button, { cx } from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import { Select } from '../components/ui/Field'
import { BarrasV } from '../components/ui/Graficos'
import { Kpi } from '../components/ui/Valores'
import { useOc } from '../data/store'
import { COMANDOS, PLANTAS } from '../data/planning'
import {
  ESTADOS_ETA,
  SEMANAS,
  construirImportaciones,
  desgloseSemanal,
  graficosPlanning,
  indicadores,
  panelesLaterales,
  porPlanta,
  situacionSku,
  totalesPorUom,
} from '../lib/planning'
import { fmtFecha, fmtNum } from '../lib/fechas'

const ICONO_SITUACION = {
  'En tránsito': LuShip,
  'En inventario': LuPackage,
  'En producción': LuCog,
}

const TONO_SITUACION = {
  'En tránsito': 'text-navy-700',
  'En inventario': 'text-teal-700',
  'En producción': 'text-ambar-700',
}

// Secciones que ofrece el modal de impresión de indicadores.
const SECCIONES_INFORME = [
  ['kpis', 'Indicadores principales'],
  ['uom', 'Totales por unidad de medida'],
  ['tabla', 'Tabla de ETA'],
  ['graficos', 'Gráficos de indicadores'],
  ['planta', 'Estado por planta y alertas'],
]

/** Tarjeta de un panel lateral: título + filas contadas, opcionalmente clicables. */
function PanelLateral({ titulo, icono: Icono, filas, vacio, onFila, onTitulo, activo }) {
  return (
    <section className="panel">
      <button
        onClick={onTitulo}
        disabled={!onTitulo}
        className={cx(
          'panel-head w-full text-left',
          onTitulo && 'transition-colors duration-100 hover:bg-surface-3',
          !onTitulo && 'cursor-default',
        )}
      >
        <span className="panel-title">
          <Icono size={14} />
          {titulo}
        </span>
        {onTitulo && <span className="ml-auto text-xs text-ink-3">ver todo</span>}
      </button>
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

/** Estado de la ETA: crítico / riesgo / cumplimiento en anillo. */
function Anillo({ criticos, riesgo, ok, centro }) {
  const total = criticos + riesgo + ok || 1
  const a = (criticos / total) * 100
  const b = a + (riesgo / total) * 100
  return (
    <div className="flex flex-wrap items-center justify-center gap-6 py-2">
      <div
        className="relative h-[130px] w-[130px] shrink-0 rounded-full"
        style={{
          background: `conic-gradient(var(--color-rojo-600) 0 ${a}%, var(--color-ambar-500) ${a}% ${b}%, var(--color-teal-600) ${b}% 100%)`,
        }}
      >
        <div className="absolute inset-[30px] rounded-full bg-surface" />
        <div className="absolute inset-0 flex items-center justify-center text-lg font-bold text-navy-800">
          {centro}
        </div>
      </div>
      <div className="flex flex-col gap-1.5 text-sm text-ink-2">
        <span className="flex items-center gap-2">
          <i className="h-2.5 w-2.5 rounded-full bg-rojo-600" /> Crítico
          <b className="num font-bold text-ink">{criticos}</b>
        </span>
        <span className="flex items-center gap-2">
          <i className="h-2.5 w-2.5 rounded-full bg-ambar-500" /> En riesgo
          <b className="num font-bold text-ink">{riesgo}</b>
        </span>
        <span className="flex items-center gap-2">
          <i className="h-2.5 w-2.5 rounded-full bg-teal-600" /> En cumplimiento
          <b className="num font-bold text-ink">{ok}</b>
        </span>
      </div>
    </div>
  )
}

/** Una tarjeta de gráfico del pie de pantalla. */
function TarjetaGrafico({ titulo, children }) {
  return (
    <section className="panel">
      <div className="panel-head">
        <span className="panel-title">{titulo}</span>
      </div>
      <div className="p-4">{children}</div>
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
  // Selección de la barra lateral (causa o comprador): reemplaza la tabla y
  // pone un contexto arriba. Se descarta al tocar cualquier filtro.
  const [contexto, setContexto] = useState(null)
  const [verInforme, setVerInforme] = useState(false)
  const [secciones, setSecciones] = useState(() => SECCIONES_INFORME.map(([id]) => id))

  const todas = useMemo(() => construirImportaciones(), [])
  const skus = useMemo(() => [...new Set(todas.map((r) => r.sku))].sort(), [todas])
  const visuales = useMemo(() => graficosPlanning(todas), [todas])

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

  // Cualquier filtro descarta la selección lateral y viceversa.
  const filtrar = (setter) => (valor) => {
    setContexto(null)
    setter(valor)
  }

  const kpi = indicadores(filas)
  const uoms = totalesPorUom(filas)
  const paneles = panelesLaterales(filas)
  const plantas = porPlanta(filas)
  const situacion = sku ? situacionSku(todas, sku) : null
  const alertas = filas.filter((r) => r.estado === 'critico').sort((a, b) => a.dias - b.dias)

  const tabla = contexto ? contexto.filas : filas

  const verCausa = (clave) =>
    setContexto({
      rotulo: `Causa de críticos: ${clave}`,
      filas: todas.filter((r) => r.estado === 'critico' && r.causa === clave),
    })
  const verComprador = (clave) =>
    setContexto({
      rotulo: `Comprador: ${clave}`,
      filas: todas.filter((r) => r.comprador === clave),
    })
  const verTodasCausas = () =>
    setContexto({
      rotulo: 'Todas las causas de críticos',
      filas: todas.filter((r) => r.estado === 'critico'),
    })

  const tarjetas = [
    {
      rotulo: 'En tránsito',
      Icono: LuShip,
      tono: 'border-navy-100 bg-navy-50',
      valor: situacion ? `${fmtNum(situacion.transito)} ${situacion.uom}` : 'Elegí un SKU',
      detalle: situacion ? situacion.plantas.join(', ') : 'La información aparece al elegir un SKU',
    },
    {
      rotulo: 'En inventario',
      Icono: LuPackage,
      tono: 'border-teal-100 bg-teal-50',
      valor: situacion ? `${fmtNum(situacion.inventario)} ${situacion.uom}` : 'Elegí un SKU',
      detalle: situacion ? `${situacion.proxima.cobertura.toFixed(1)} meses de cobertura` : '—',
    },
    {
      rotulo: 'En producción',
      Icono: LuCog,
      tono: 'border-ambar-100 bg-ambar-50',
      valor: situacion ? `${situacion.produccion} planta(s)` : 'Elegí un SKU',
      detalle: situacion ? `${situacion.sku}` : '—',
    },
  ]

  const toggleSeccion = (id) =>
    setSecciones((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="m-0 text-lg font-bold text-navy-800">Planning de importaciones</h2>
          <p className="m-0 text-sm text-ink-3">
            Control de ETA por SKU y planta · monitoreo de cumplimiento logístico. El estado se mide
            contra la fecha de hoy.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => avisar('Exportación de importaciones a Excel generada (demo).')}>
            <LuFileDown size={14} /> Exportar Excel
          </Button>
          <Button size="sm" variant="primary" onClick={() => setVerInforme(true)}>
            <LuPrinter size={14} /> Imprimir indicadores
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
          onChange={(e) => filtrar(setPlanta)(e.target.value)}
          className="w-[200px]"
        />
        <Select
          placeholder="Todos los estados"
          options={Object.entries(ESTADOS_ETA).map(([value, v]) => ({ value, label: v.rotulo }))}
          value={estado}
          onChange={(e) => filtrar(setEstado)(e.target.value)}
          className="w-[180px]"
        />
        <Select
          placeholder="Todos los SKU"
          options={skus}
          value={sku}
          onChange={(e) => filtrar(setSku)(e.target.value)}
          className="w-[160px]"
        />
        <span className="mx-1 h-6 w-px bg-line" />
        {COMANDOS.map((c) => (
          <button
            key={c.id}
            onClick={() => {
              setContexto(null)
              setComando(c.id)
            }}
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

      {/* Las tres tarjetas de situación: con un SKU elegido traen su detalle */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {tarjetas.map(({ rotulo, Icono, valor, detalle, tono }) => (
          <div key={rotulo} className={cx('rounded-sm border p-3', tono)}>
            <span className="flex items-center gap-1.5 text-sm font-bold text-ink-2">
              <Icono size={14} />
              {rotulo}
            </span>
            <b className="num mt-1 block text-2xl font-bold text-navy-800">{valor}</b>
            <span className="block text-sm text-ink-3">{detalle}</span>
          </div>
        ))}
      </div>

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
            onFila={(g) => verCausa(g.clave)}
            onTitulo={verTodasCausas}
            activo={contexto?.rotulo.startsWith('Causa') ? contexto.rotulo.replace('Causa de críticos: ', '') : null}
          />
          <PanelLateral
            titulo="Compradores"
            icono={LuUsers}
            filas={paneles.compradores}
            vacio="—"
            onFila={(g) => verComprador(g.clave)}
            activo={contexto?.rotulo.startsWith('Comprador') ? contexto.rotulo.replace('Comprador: ', '') : null}
          />
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
              <span className="num ml-auto text-sm text-ink-3">
                {tabla.length} de {todas.length}
              </span>
            </div>

            {contexto && (
              <div className="flex items-center gap-2 border-b border-line bg-navy-50 px-4 py-2 text-sm text-navy-800">
                <LuFilter size={13} className="shrink-0" />
                <span className="min-w-0 flex-1">
                  {contexto.rotulo} · {contexto.filas.length} SKU relacionados
                </span>
                <button
                  onClick={() => setContexto(null)}
                  aria-label="Quitar selección"
                  className="flex h-6 w-6 items-center justify-center rounded-sm text-ink-3 transition-colors hover:bg-surface-3 hover:text-ink"
                >
                  <LuX size={13} />
                </button>
              </div>
            )}

            <div className="tabla-scroll">
              <table className="tbl">
                <thead>
                  <tr>
                    <th className="w-[110px]">SKU</th>
                    <th className="w-[150px]">Planta</th>
                    <th className="w-[120px] text-right!">Inventario</th>
                    {SEMANAS.map((w) => (
                      <th key={w} className="w-[80px] text-right!">
                        {w}
                      </th>
                    ))}
                    <th className="w-[120px] text-right!">En tránsito</th>
                    <th className="w-[130px]">ETA</th>
                    <th className="w-[110px]">Variación</th>
                    <th className="w-[140px]">Estado ETA</th>
                    <th className="w-[150px]">Situación</th>
                  </tr>
                </thead>
                <tbody>
                  {tabla.length === 0 && (
                    <tr>
                      <td colSpan={11} className="h-[140px]! bg-surface text-center text-sm text-ink-3">
                        {contexto ? 'No hay SKU relacionados.' : 'Ninguna importación con estos filtros.'}
                      </td>
                    </tr>
                  )}
                  {tabla.map((r) => {
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
                        {desgloseSemanal(r).map((s) => (
                          <td key={s.label} className="cell-num">
                            <span
                              className={cx(
                                'num',
                                s.alerta
                                  ? 'rounded-xs bg-rojo-50 px-1.5 font-bold text-rojo-700'
                                  : 'font-medium text-ink-2',
                              )}
                            >
                              {fmtNum(s.valor)}
                            </span>
                          </td>
                        ))}
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
                          <span className={cx('flex items-center gap-1.5 font-medium', TONO_SITUACION[r.situacion])}>
                            <IconoSit size={13} className="shrink-0" />
                            {r.situacion}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <div className="border-t border-line px-4 py-2 text-xs text-ink-3">
              En <b className="text-rojo-700">rojo</b>, la cantidad semanal que no se cubre dentro de la
              semana.
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

      {/* --------------------- Indicadores y gráficos --------------------- */}
      <div className="flex items-center gap-2 border-b border-line pb-2 pt-2">
        <LuChartColumn size={15} className="text-navy-700" />
        <h3 className="m-0 text-base font-bold text-navy-800">Indicadores y gráficos</h3>
        <span className="text-sm text-ink-3">· foto del período completo</span>
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-4">
        <TarjetaGrafico titulo="Importaciones por planta">
          <BarrasV datos={visuales.importacionesPlanta} />
        </TarjetaGrafico>
        <TarjetaGrafico titulo="Estado de ETA">
          <Anillo
            criticos={visuales.eta.criticos}
            riesgo={visuales.eta.riesgo}
            ok={visuales.eta.ok}
            centro={`${visuales.eta.cumplimiento}%`}
          />
        </TarjetaGrafico>
        <TarjetaGrafico titulo="Inventario por planta">
          <BarrasV datos={visuales.inventarioPlanta} fmt={(v) => fmtNum(v)} />
        </TarjetaGrafico>
        <TarjetaGrafico titulo="Cobertura promedio por planta">
          <BarrasV datos={visuales.coberturaPlanta} fmt={(v) => `${v.toFixed(1)}m`} />
        </TarjetaGrafico>
      </div>

      <Modal
        open={verInforme}
        onClose={() => setVerInforme(false)}
        size="sm"
        eyebrow="Planning de importaciones"
        title="Imprimir indicadores"
        footer={
          <>
            <span className="min-w-0 flex-1 text-sm text-ink-2">
              {secciones.length} sección{secciones.length === 1 ? '' : 'es'} seleccionada
              {secciones.length === 1 ? '' : 's'}.
            </span>
            <Button variant="quiet" onClick={() => setVerInforme(false)}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              disabled={secciones.length === 0}
              onClick={() => {
                avisar(
                  `Impresión de indicadores enviada con ${secciones.length} sección${
                    secciones.length === 1 ? '' : 'es'
                  } (demo).`,
                )
                setVerInforme(false)
              }}
            >
              <LuPrinter size={14} /> Imprimir
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-1">
          <p className="mt-0 mb-2 text-sm text-ink-3">Seleccioná qué indicadores querés incluir.</p>
          {SECCIONES_INFORME.map(([id, rotulo]) => (
            <label
              key={id}
              className="flex cursor-pointer items-center gap-2.5 rounded-sm px-2 py-2 text-sm hover:bg-surface-2"
            >
              <input
                type="checkbox"
                className="chk"
                checked={secciones.includes(id)}
                onChange={() => toggleSeccion(id)}
              />
              {rotulo}
            </label>
          ))}
        </div>
      </Modal>
    </div>
  )
}
