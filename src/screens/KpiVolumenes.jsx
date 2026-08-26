import { useMemo, useState } from 'react'
import {
  LuAnchor,
  LuArrowLeftRight,
  LuBoxes,
  LuBuilding2,
  LuContainer,
  LuFactory,
  LuFileDown,
  LuFileText,
  LuLayoutDashboard,
  LuPrinter,
  LuSearchX,
} from 'react-icons/lu'
import Button, { cx } from '../components/ui/Button'
import { Select } from '../components/ui/Field'
import { BarrasH, BarrasV, Lineas, Reparto } from '../components/ui/Graficos'
import { Kpi } from '../components/ui/Valores'
import { useOc } from '../data/store'
import {
  ADUANAS_KPI,
  ANIO,
  MEDIDAS,
  MESES_KPI,
  MODALIDADES,
  MODALIDAD_COLOR,
  PLANTAS_KPI,
  SKUS_KPI,
} from '../data/kpiVolumenes'
import {
  FILTRO_VACIO,
  aSerie,
  campoDe,
  contenedoresPlantaModalidad,
  cruzar,
  filtrarKpi,
  medidasDisponibles,
  porAduanaKpi,
  porMes,
  porModalidadKpi,
  porNaviera,
  porOrigen,
  porPlantaKpi,
  porProveedor,
  porSku,
  resumenKpi,
  resumenPorPeriodo,
} from '../lib/kpiVolumenes'
import { fmtNum } from '../lib/fechas'

// Las ocho entradas del sidebar del mockup, acá como pestañas.
const VISTAS = [
  { id: 'general', rotulo: 'Volumen general', icono: LuLayoutDashboard },
  { id: 'sku', rotulo: 'Detalle histórico por SKU', icono: LuBoxes },
  { id: 'planta', rotulo: 'Volumen por planta', icono: LuFactory },
  { id: 'proveedor', rotulo: 'Proveedor y origen', icono: LuBuilding2 },
  { id: 'naviera', rotulo: 'Volumen por naviera', icono: LuAnchor },
  { id: 'modalidad', rotulo: 'Modalidad de transporte', icono: LuArrowLeftRight },
  { id: 'contenedores', rotulo: 'Contenedores', icono: LuContainer },
  { id: 'informe', rotulo: 'Generar informe', icono: LuFileText },
]

const n0 = (v) => fmtNum(v)
const n1 = (v) => fmtNum(v, 1)

function Panel({ titulo, pie, children }) {
  return (
    <section className="panel">
      <div className="panel-head">
        <span className="panel-title">{titulo}</span>
        {pie && <span className="ml-auto text-sm text-ink-3">{pie}</span>}
      </div>
      <div className="p-4">{children}</div>
    </section>
  )
}

function Tabla({ titulo, columnas, filas, children }) {
  return (
    <div className="panel">
      <div className="panel-head">
        <span className="panel-title">{titulo}</span>
        <span className="num ml-auto text-sm text-ink-3">{filas.length} filas</span>
      </div>
      <div className="tabla-scroll">
        <table className="tbl">
          <thead>
            <tr>
              {columnas.map(([rotulo, ancho]) => (
                <th key={rotulo} className={ancho}>
                  {rotulo}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filas.length === 0 && (
              <tr>
                <td colSpan={columnas.length} className="h-[130px]! bg-surface text-center text-sm text-ink-3">
                  Ningún embarque con estos filtros.
                </td>
              </tr>
            )}
            {filas.map(children)}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/** Merchant BI: indicadores de los embarques ya entregados. */
export default function KpiVolumenes() {
  const { avisar } = useOc()
  const [vista, setVista] = useState('general')
  const [f, setF] = useState(FILTRO_VACIO)
  const [medida, setMedida] = useState('unidades')
  const [mesInforme, setMesInforme] = useState('')

  const filas = useMemo(() => filtrarKpi(f), [f])
  const disponibles = medidasDisponibles(filas)
  // Si el filtro deja solo SKU de la otra clase, la medida activa deja de aplicar.
  const medidaActiva = disponibles[medida] ? medida : disponibles.unidades ? 'unidades' : 'kg'
  const campo = campoDe(medidaActiva)
  const rotuloMedida = MEDIDAS.find((m) => m.id === medidaActiva).rotulo

  const r = resumenKpi(filas)
  const set = (k, v) => setF((prev) => ({ ...prev, [k]: v }))
  const hayFiltro = Object.values(f).some(Boolean)

  const filasInforme = useMemo(
    () => (mesInforme ? filas.filter((e) => e.mes === mesInforme) : filas),
    [filas, mesInforme],
  )
  const ri = resumenKpi(filasInforme)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="m-0 text-lg font-bold text-navy-800">Merchant BI · indicadores de volumen</h2>
          <p className="m-0 text-sm text-ink-3">
            {r.embarques} embarques entregados de {ANIO} · materiales para producción de snacks. Una
            sola base alimenta las ocho pestañas y los filtros se conservan al navegar.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => avisar('Exportación de indicadores generada (demo).')}>
            <LuFileDown size={14} /> Exportar
          </Button>
          <Button size="sm" variant="primary" onClick={() => avisar('Informe enviado (demo).')}>
            <LuPrinter size={14} /> Imprimir
          </Button>
        </div>
      </div>

      {/* Filtros: una sola fila arriba de todo, compartida por las ocho pestañas */}
      <div className="panel flex flex-wrap items-center gap-2 p-3">
        <Select placeholder="Todos los meses" options={MESES_KPI} value={f.mes} onChange={(e) => set('mes', e.target.value)} className="w-[150px]" />
        <Select
          placeholder="Todas las semanas"
          options={Array.from({ length: 52 }, (_, i) => ({ value: String(i + 1), label: `Semana ${i + 1}` }))}
          value={f.semana}
          onChange={(e) => set('semana', e.target.value)}
          className="w-[150px]"
        />
        <Select placeholder="Todas las plantas" options={PLANTAS_KPI} value={f.planta} onChange={(e) => set('planta', e.target.value)} className="w-[160px]" />
        <Select placeholder="Todas las modalidades" options={MODALIDADES} value={f.modalidad} onChange={(e) => set('modalidad', e.target.value)} className="w-[170px]" />
        <Select placeholder="Todos los SKU" options={SKUS_KPI} value={f.sku} onChange={(e) => set('sku', e.target.value)} className="w-[200px]" />

        <span className="mx-1 h-6 w-px bg-line" />
        <div className="segbar">
          {MEDIDAS.map((m) => (
            <button
              key={m.id}
              onClick={() => setMedida(m.id)}
              disabled={!disponibles[m.id]}
              title={disponibles[m.id] ? undefined : 'Ningún SKU filtrado se mide así'}
              className={cx('seg disabled:cursor-not-allowed disabled:opacity-40', medidaActiva === m.id && 'seg-on')}
            >
              {m.rotulo}
            </button>
          ))}
        </div>

        {hayFiltro && (
          <Button size="sm" onClick={() => setF(FILTRO_VACIO)}>
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

      {/* ---------------------------- VOLUMEN GENERAL ---------------------------- */}
      {vista === 'general' && (
        <>
          <div className="flex flex-wrap gap-2">
            <Kpi rotulo="Embarques entregados" valor={n0(r.embarques)} tono="border-navy-100 bg-navy-50" />
            <Kpi rotulo={rotuloMedida} valor={medidaActiva === 'kg' ? n1(r.kg) : n0(r.unidades)} />
            <Kpi rotulo="Contenedores" valor={n0(r.contenedores)} />
            <Kpi rotulo="Plantas atendidas" valor={`${r.plantas} / ${PLANTAS_KPI.length}`} />
            <Kpi rotulo="SKU con movimiento" valor={`${r.skus} / ${SKUS_KPI.length}`} tono="border-teal-100 bg-teal-50" />
          </div>

          <Panel titulo="Embarques entregados por mes" pie="pasá el cursor por los puntos">
            <Lineas datos={porMes(filas, 'embarques')} unidad="embarques" />
          </Panel>

          <Tabla
            titulo="Resumen histórico"
            columnas={[['Mes', 'w-[140px]'], ['Semana', 'w-[110px]'], ['Embarques', 'w-[120px] text-right!'], ['Unidades', 'w-[140px] text-right!'], ['Kg', 'w-[140px] text-right!'], ['Contenedores', 'w-[130px] text-right!']]}
            filas={resumenPorPeriodo(filas)}
          >
            {(g) => (
              <tr key={g.clave}>
                <td className="cell-strong">{g.mes}</td>
                <td className="num">Semana {g.semana}</td>
                <td className="cell-num">{n0(g.embarques)}</td>
                <td className="cell-num">{n0(g.unidades)}</td>
                <td className="cell-num">{n1(g.kg)}</td>
                <td className="cell-num">{n0(g.contenedores)}</td>
              </tr>
            )}
          </Tabla>
        </>
      )}

      {/* ------------------------------- POR SKU --------------------------------- */}
      {vista === 'sku' && (
        <>
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <Panel titulo={`Volumen por SKU (${rotuloMedida.toLowerCase()})`} pie="ordenado de mayor a menor">
              <BarrasH datos={aSerie(porSku(filas), campo)} fmt={medidaActiva === 'kg' ? n1 : n0} />
            </Panel>
            <Panel titulo="Participación por tipo de producto" pie={rotuloMedida.toLowerCase()}>
              <BarrasH datos={aSerie(cruzar(filas, 'tipo', 'medida'), campo).map((d) => ({ ...d, clave: d.clave.split('||')[0] }))} fmt={medidaActiva === 'kg' ? n1 : n0} />
            </Panel>
          </div>

          <Tabla
            titulo="Detalle SKU · planta"
            columnas={[['SKU', 'min-w-[200px]'], ['Planta', 'w-[160px]'], ['Embarques', 'w-[110px] text-right!'], ['Unidades', 'w-[130px] text-right!'], ['Kg', 'w-[130px] text-right!'], ['Contenedores', 'w-[120px] text-right!']]}
            filas={cruzar(filas, 'sku', 'planta')}
          >
            {(g) => (
              <tr key={g.clave}>
                <td className="cell-key">{g.sku}</td>
                <td>{g.planta}</td>
                <td className="cell-num">{n0(g.embarques)}</td>
                <td className="cell-num">{n0(g.unidades)}</td>
                <td className="cell-num">{n1(g.kg)}</td>
                <td className="cell-num">{n0(g.contenedores)}</td>
              </tr>
            )}
          </Tabla>
        </>
      )}

      {/* ------------------------------ POR PLANTA ------------------------------- */}
      {vista === 'planta' && (
        <>
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <Panel titulo={`Volumen recibido por planta (${rotuloMedida.toLowerCase()})`}>
              <BarrasH datos={aSerie(porPlantaKpi(filas), campo)} fmt={medidaActiva === 'kg' ? n1 : n0} />
            </Panel>
            <Panel titulo="Contenedores entregados por planta">
              <BarrasV datos={aSerie(porPlantaKpi(filas), 'contenedores')} unidad="contenedores" />
            </Panel>
          </div>

          <Tabla
            titulo="SKU entregados por planta"
            columnas={[['Planta', 'w-[160px]'], ['SKU', 'min-w-[200px]'], ['Embarques', 'w-[110px] text-right!'], ['Unidades', 'w-[130px] text-right!'], ['Kg', 'w-[130px] text-right!'], ['Contenedores', 'w-[120px] text-right!']]}
            filas={cruzar(filas, 'planta', 'sku')}
          >
            {(g) => (
              <tr key={g.clave}>
                <td className="cell-key">{g.planta}</td>
                <td>{g.sku}</td>
                <td className="cell-num">{n0(g.embarques)}</td>
                <td className="cell-num">{n0(g.unidades)}</td>
                <td className="cell-num">{n1(g.kg)}</td>
                <td className="cell-num">{n0(g.contenedores)}</td>
              </tr>
            )}
          </Tabla>
        </>
      )}

      {/* --------------------------- PROVEEDOR Y ORIGEN -------------------------- */}
      {vista === 'proveedor' && (
        <>
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <Panel titulo={`Importaciones por proveedor (${rotuloMedida.toLowerCase()})`}>
              <BarrasH datos={aSerie(porProveedor(filas), campo)} fmt={medidaActiva === 'kg' ? n1 : n0} />
            </Panel>
            <Panel titulo={`Importaciones por origen (${rotuloMedida.toLowerCase()})`}>
              <BarrasH datos={aSerie(porOrigen(filas), campo)} fmt={medidaActiva === 'kg' ? n1 : n0} />
            </Panel>
          </div>

          <Tabla
            titulo="Proveedor y origen"
            columnas={[['Proveedor', 'w-[200px]'], ['Origen', 'w-[160px]'], ['Importaciones', 'w-[120px] text-right!'], ['Unidades', 'w-[130px] text-right!'], ['Kg', 'w-[130px] text-right!'], ['Contenedores', 'w-[120px] text-right!']]}
            filas={cruzar(filas, 'proveedor', 'origen')}
          >
            {(g) => (
              <tr key={g.clave}>
                <td className="cell-key">{g.proveedor}</td>
                <td>{g.origen}</td>
                <td className="cell-num">{n0(g.embarques)}</td>
                <td className="cell-num">{n0(g.unidades)}</td>
                <td className="cell-num">{n1(g.kg)}</td>
                <td className="cell-num">{n0(g.contenedores)}</td>
              </tr>
            )}
          </Tabla>
        </>
      )}

      {/* ------------------------------ POR NAVIERA ------------------------------ */}
      {vista === 'naviera' && (
        <>
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <Panel titulo={`Volumen por naviera (${rotuloMedida.toLowerCase()})`}>
              <BarrasH datos={aSerie(porNaviera(filas), campo)} fmt={medidaActiva === 'kg' ? n1 : n0} />
            </Panel>
            <Panel titulo="Contenedores por naviera">
              <BarrasV datos={aSerie(porNaviera(filas), 'contenedores')} unidad="contenedores" />
            </Panel>
          </div>

          <Tabla
            titulo="Detalle por naviera"
            columnas={[['Naviera', 'w-[190px]'], ['Importaciones', 'w-[120px] text-right!'], ['Contenedores', 'w-[120px] text-right!'], ['Unidades', 'w-[130px] text-right!'], ['Kg', 'w-[130px] text-right!'], ['Participación', 'w-[130px] text-right!']]}
            filas={porNaviera(filas)}
          >
            {(g) => (
              <tr key={g.clave}>
                <td className="cell-key">{g.clave}</td>
                <td className="cell-num">{n0(g.embarques)}</td>
                <td className="cell-num">{n0(g.contenedores)}</td>
                <td className="cell-num">{n0(g.unidades)}</td>
                <td className="cell-num">{n1(g.kg)}</td>
                <td className="cell-num font-bold text-navy-800">
                  {r.embarques ? Math.round((g.embarques / r.embarques) * 100) : 0}%
                </td>
              </tr>
            )}
          </Tabla>
        </>
      )}

      {/* ----------------------------- POR MODALIDAD ----------------------------- */}
      {vista === 'modalidad' && (
        <>
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <Panel titulo={`Reparto por modalidad (${rotuloMedida.toLowerCase()})`}>
              <Reparto
                datos={aSerie(porModalidadKpi(filas), campo)}
                color={MODALIDAD_COLOR}
                fmt={medidaActiva === 'kg' ? n1 : n0}
              />
            </Panel>
            <Panel titulo={`Volumen por aduana (${rotuloMedida.toLowerCase()})`}>
              <BarrasH datos={aSerie(porAduanaKpi(filas), campo)} fmt={medidaActiva === 'kg' ? n1 : n0} />
            </Panel>
          </div>

          <Tabla
            titulo="Detalle modalidad · planta · aduana"
            columnas={[['Modalidad', 'w-[140px]'], ['Planta', 'w-[160px]'], ['Aduana', 'w-[160px]'], ['Embarques', 'w-[110px] text-right!'], ['Unidades', 'w-[130px] text-right!'], ['Contenedores', 'w-[120px] text-right!']]}
            filas={agrupaTriple(filas)}
          >
            {(g) => (
              <tr key={g.clave}>
                <td>
                  <span className="inline-flex items-center gap-1.5 whitespace-nowrap font-medium text-ink">
                    <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: MODALIDAD_COLOR[g.modalidad] }} />
                    {g.modalidad}
                  </span>
                </td>
                <td>{g.planta}</td>
                <td>{g.aduana}</td>
                <td className="cell-num">{n0(g.embarques)}</td>
                <td className="cell-num">{n0(g.unidades)}</td>
                <td className="cell-num">{n0(g.contenedores)}</td>
              </tr>
            )}
          </Tabla>
        </>
      )}

      {/* ---------------------------- CONTENEDORES ------------------------------- */}
      {vista === 'contenedores' && (
        <>
          <Panel titulo="Volumen histórico de contenedores" pie="por mes">
            <BarrasV datos={porMes(filas, 'contenedores')} unidad="contenedores" />
          </Panel>

          <Tabla
            titulo="Contenedores por planta y modalidad"
            columnas={[['Planta', 'w-[180px]'], ...MODALIDADES.map((m) => [m, 'w-[110px] text-right!']), ['Total', 'w-[110px] text-right!']]}
            filas={contenedoresPlantaModalidad(filas)}
          >
            {(g) => (
              <tr key={g.planta}>
                <td className="cell-key">{g.planta}</td>
                {MODALIDADES.map((m) => (
                  <td key={m} className="cell-num">
                    {g[m] > 0 ? n0(g[m]) : <span className="text-ink-4">—</span>}
                  </td>
                ))}
                <td className="cell-num font-bold text-navy-800">{n0(g.total)}</td>
              </tr>
            )}
          </Tabla>
        </>
      )}

      {/* ------------------------------- INFORME --------------------------------- */}
      {vista === 'informe' && (
        <>
          <div className="panel flex flex-wrap items-center gap-3 p-3">
            <span className="lbl">Mes del informe</span>
            <Select
              placeholder="Todo el año"
              options={MESES_KPI}
              value={mesInforme}
              onChange={(e) => setMesInforme(e.target.value)}
              className="w-[170px]"
            />
            <span className="text-sm text-ink-3">
              {ANIO} · {mesInforme || 'todos los meses'}
            </span>
            <Button
              size="sm"
              variant="primary"
              className="ml-auto"
              onClick={() => avisar('Informe ejecutivo generado (demo).')}
            >
              <LuFileText size={14} /> Generar informe
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            <Kpi rotulo="Embarques" valor={n0(ri.embarques)} tono="border-navy-100 bg-navy-50" />
            <Kpi rotulo="Unidades" valor={n0(ri.unidades)} />
            <Kpi rotulo="Kg" valor={n1(ri.kg)} />
            <Kpi rotulo="Contenedores" valor={n0(ri.contenedores)} />
            <Kpi rotulo="Plantas" valor={ri.plantas} />
            <Kpi rotulo="Proveedores" valor={ri.proveedores} tono="border-teal-100 bg-teal-50" />
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <Panel titulo="Comportamiento mensual de embarques">
              <Lineas datos={porMes(filasInforme, 'embarques')} unidad="embarques" />
            </Panel>
            <Panel titulo={`Volumen por planta (${rotuloMedida.toLowerCase()})`}>
              <BarrasH datos={aSerie(porPlantaKpi(filasInforme), campo)} fmt={medidaActiva === 'kg' ? n1 : n0} />
            </Panel>
            <Panel titulo={`Reparto por modalidad (${rotuloMedida.toLowerCase()})`}>
              <Reparto
                datos={aSerie(porModalidadKpi(filasInforme), campo)}
                color={MODALIDAD_COLOR}
                fmt={medidaActiva === 'kg' ? n1 : n0}
              />
            </Panel>
            <Panel titulo={`Top proveedores (${rotuloMedida.toLowerCase()})`}>
              <BarrasH datos={aSerie(porProveedor(filasInforme), campo)} tope={5} fmt={medidaActiva === 'kg' ? n1 : n0} />
            </Panel>
          </div>

          <div className="panel p-4">
            <div className="lbl mb-2">Resumen ejecutivo</div>
            <p className="text-base text-ink-2">
              En <b className="font-semibold text-ink">{mesInforme || `todo ${ANIO}`}</b> se entregaron{' '}
              <b className="num font-bold text-navy-800">{n0(ri.embarques)}</b> embarques hacia{' '}
              <b className="num font-bold text-navy-800">{ri.plantas}</b> planta(s), por{' '}
              <b className="num font-bold text-navy-800">{n0(ri.unidades)}</b> unidades y{' '}
              <b className="num font-bold text-navy-800">{n1(ri.kg)}</b> kg, movilizados en{' '}
              <b className="num font-bold text-navy-800">{n0(ri.contenedores)}</b> contenedores de{' '}
              <b className="num font-bold text-navy-800">{ri.navieras}</b> naviera(s) y{' '}
              <b className="num font-bold text-navy-800">{ri.proveedores}</b> proveedor(es), ingresando
              por <b className="num font-bold text-navy-800">{ri.aduanas}</b> de las{' '}
              {ADUANAS_KPI.length} aduanas habilitadas.
            </p>
          </div>
        </>
      )}
    </div>
  )
}

/** Modalidad × planta × aduana: el detalle de la pestaña de modalidad. */
function agrupaTriple(filas) {
  const mapa = new Map()
  filas.forEach((e) => {
    const clave = `${e.modalidad}||${e.planta}||${e.aduana}`
    const t = mapa.get(clave) ?? {
      clave,
      modalidad: e.modalidad,
      planta: e.planta,
      aduana: e.aduana,
      embarques: 0,
      unidades: 0,
      contenedores: 0,
    }
    t.embarques += 1
    t.unidades += e.unidades
    t.contenedores += e.contenedores
    mapa.set(clave, t)
  })
  return [...mapa.values()].sort((a, b) => b.unidades - a.unidades)
}
