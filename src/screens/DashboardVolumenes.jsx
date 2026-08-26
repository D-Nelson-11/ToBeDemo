import { useMemo, useState } from 'react'
import { LuContainer, LuFileDown, LuPrinter } from 'react-icons/lu'
import Button, { cx } from '../components/ui/Button'
import { Select } from '../components/ui/Field'
import { Kpi } from '../components/ui/Valores'
import { useOc } from '../data/store'
import { BarrasH, BarrasV, Reparto } from '../components/ui/Graficos'
import { ADUANAS, MODO_COLOR, PLANTA_ROTULO, SKUS } from '../data/volumenes'
import {
  GRANULARIDADES,
  filtrar,
  periodosDe,
  porAduana,
  porModalidad,
  porPlanta,
  resumen,
  rotuloPeriodo,
  serieContenedores,
  tablaSku,
} from '../lib/volumenes'
import { fmtNum } from '../lib/fechas'

const tm = (n) => `${fmtNum(n, 1)} TM`

/** Los gráficos comen { clave, valor }; acá la magnitud son toneladas. */
const aSerie = (grupos) => grupos.map((g) => ({ clave: g.clave, valor: g.tm }))

function Tarjeta({ titulo, pie, children }) {
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

/** Manifiesto de volúmenes: cuánto entró, por dónde y hacia qué planta. */
export default function DashboardVolumenes() {
  const { avisar } = useOc()
  const [gran, setGran] = useState('mes')
  const [periodo, setPeriodo] = useState('7')

  const periodos = useMemo(() => periodosDe(gran), [gran])
  const filas = useMemo(() => filtrar(gran, periodo), [gran, periodo])

  const cambiarGran = (id) => {
    setGran(id)
    // Cada granularidad tiene su propia lista: el periodo anterior no aplica.
    setPeriodo(periodosDe(id)[0].value)
  }

  const r = resumen(filas)
  const modalidad = porModalidad(filas)
  const aduanas = porAduana(filas)
  const plantas = porPlanta(filas)
  const serie = serieContenedores(filas, gran)
  const tabla = tablaSku(filas)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="m-0 text-lg font-bold text-navy-800">Manifiesto de volúmenes</h2>
          <p className="m-0 text-sm text-ink-3">
            Materia prima de snacks · Honduras. Periodo visualizado:{' '}
            <b className="font-semibold text-ink-2">{rotuloPeriodo(gran, periodo)}</b>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => avisar('Exportación de volúmenes generada (demo).')}>
            <LuFileDown size={14} /> Exportar
          </Button>
          <Button size="sm" variant="primary" onClick={() => avisar('Manifiesto enviado (demo).')}>
            <LuPrinter size={14} /> Manifiesto
          </Button>
        </div>
      </div>

      {/* Los filtros van en una fila, arriba de todos los gráficos */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="segbar">
          {GRANULARIDADES.map((g) => (
            <button
              key={g.id}
              onClick={() => cambiarGran(g.id)}
              className={cx('seg', gran === g.id && 'seg-on')}
            >
              {g.rotulo}
            </button>
          ))}
        </div>
        <Select
          options={periodos}
          value={periodo}
          onChange={(e) => setPeriodo(e.target.value)}
          className="w-[190px]"
        />
        <span className="text-sm text-ink-3">
          {SKUS.length} SKU monitoreados · {ADUANAS.length} aduanas · 3 plantas
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        <Kpi rotulo="Volumen ingresado" valor={tm(r.tm)} tono="border-navy-100 bg-navy-50" />
        <Kpi rotulo="Contenedores" valor={fmtNum(r.contenedores)} />
        <Kpi rotulo="Embarques" valor={fmtNum(r.embarques)} />
        <Kpi rotulo="SKU con movimiento" valor={`${r.skus} / ${SKUS.length}`} />
        <Kpi rotulo="Aduanas con tránsito" valor={`${r.aduanas} / ${ADUANAS.length}`} />
        <Kpi
          rotulo="Planta líder"
          valor={r.lider ? PLANTA_ROTULO[r.lider] : '—'}
          tono="border-teal-100 bg-teal-50"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Tarjeta
          titulo="Contenedores movilizados"
          pie={gran === 'semana' ? 'por planta' : gran === 'mes' ? 'por semana' : 'por mes'}
        >
          <BarrasV datos={serie} unidad="contenedores" fmt={fmtNum} />
        </Tarjeta>

        <Tarjeta titulo="Volumen por modalidad" pie="TM ingresadas">
          <Reparto datos={aSerie(modalidad)} color={MODO_COLOR} fmt={(n) => fmtNum(n, 1)} sufijo=" TM" />
        </Tarjeta>

        <Tarjeta titulo="Volumen por aduana" pie="TM ingresadas">
          <BarrasH datos={aSerie(aduanas)} fmt={(n) => fmtNum(n, 1)} sufijo=" TM" />
        </Tarjeta>

        <Tarjeta titulo="Volumen por planta" pie="TM ingresadas">
          <BarrasH datos={aSerie(plantas).map((p) => ({ ...p, clave: PLANTA_ROTULO[p.clave] }))} fmt={(n) => fmtNum(n, 1)} sufijo=" TM" />
        </Tarjeta>
      </div>

      <div className="panel">
        <div className="panel-head">
          <span className="panel-title">Embarques por SKU · cantidad ingresada por planta</span>
          <span className="num ml-auto text-sm text-ink-3">
            {tabla.length} SKU · {tm(r.tm)} · {fmtNum(r.contenedores)} contenedores
          </span>
        </div>
        <div className="tabla-scroll">
          <table className="tbl">
            <thead>
              <tr>
                <th className="w-[110px]">SKU</th>
                <th className="min-w-[230px]">Descripción</th>
                <th className="w-[200px]">Modalidad</th>
                <th className="w-[120px] text-right!">SPS</th>
                <th className="w-[120px] text-right!">Choloma</th>
                <th className="w-[120px] text-right!">Tegucigalpa</th>
                <th className="w-[120px] text-right!">Total</th>
                <th className="w-[110px] text-right!">Contenedores</th>
              </tr>
            </thead>
            <tbody>
              {tabla.length === 0 && (
                <tr>
                  <td colSpan={8} className="h-[140px]! bg-surface text-center text-sm text-ink-3">
                    Ningún SKU con movimiento en este periodo.
                  </td>
                </tr>
              )}
              {tabla.map((f) => (
                <tr key={f.sku}>
                  <td className="cell-key">{f.sku}</td>
                  <td className="cell-cut" title={f.desc}>
                    {f.desc}
                  </td>
                  <td>
                    <span className="flex flex-wrap gap-1">
                      {f.modos.map((m) => (
                        <span
                          key={m}
                          className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-surface-3 px-2 py-[2px] text-xs font-semibold text-ink-2"
                        >
                          <span
                            className="h-2 w-2 shrink-0 rounded-full"
                            style={{ background: MODO_COLOR[m] }}
                          />
                          {m}
                        </span>
                      ))}
                    </span>
                  </td>
                  {['SPS', 'Choloma', 'Tegucigalpa'].map((p) => (
                    <td key={p} className="cell-num">
                      {f.plantas[p] > 0 ? fmtNum(f.plantas[p], 1) : <span className="text-ink-4">—</span>}
                    </td>
                  ))}
                  <td className="cell-num font-bold text-navy-800">{fmtNum(f.total, 1)}</td>
                  <td className="cell-num">
                    <span className="inline-flex items-center gap-1.5">
                      <LuContainer size={12} className="shrink-0 text-ink-4" />
                      {f.contenedores}
                    </span>
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
