import { useMemo, useState } from 'react'
import { LuSearchX } from 'react-icons/lu'
import Button, { cx } from '../components/ui/Button'
import { Select } from '../components/ui/Field'
import { BarrasH, BarrasV, Lineas, Reparto } from '../components/ui/Graficos'
import { Kpi } from '../components/ui/Valores'
import { MESES, REGIMENES } from '../data/preciosGastos'
import { agrupar, desglose, distintos, filtrar, money, pct1, promedio, suma } from '../lib/preciosGastos'

const PALETA = ['#0b4668', '#078a78', '#2f6f9f', '#d58b20', '#7b61a8', '#4d8b9b', '#8a6f4d', '#5d7c6f', '#9b5c74']
const colorDe = (claves) => Object.fromEntries(claves.map((c, i) => [c, PALETA[i % PALETA.length]]))

const PAGINAS = [
  ['dashboard', 'Dashboard'],
  ['precios', 'Precios de productos'],
  ['tendencia', 'Comportamiento de costos'],
  ['incoCosto', 'Costo por Incoterm'],
  ['incoPrecio', 'Precio según Incoterm'],
  ['fletes', 'Fletes por origen'],
  ['seguros', 'Seguros'],
  ['impuestos', 'Impuestos y aranceles'],
  ['regimenes', 'TLC / Regímenes'],
  ['aduaneros', 'Gastos aduaneros'],
  ['control', 'Puntos de control'],
]

const TAG_REGIMEN = {
  TLC: 'bg-teal-50 text-teal-700',
  RIT: 'bg-navy-50 text-navy-700',
  ZOLI: 'bg-navy-50 text-navy-700',
  Temporal: 'bg-ambar-50 text-ambar-700',
  Definitivo: 'bg-surface-3 text-ink-2',
}

function Grafico({ titulo, sub, children }) {
  return (
    <section className="panel">
      <div className="panel-head">
        <span className="panel-title">{titulo}</span>
        {sub && <span className="min-w-0 flex-1 truncate text-sm text-ink-3">{sub}</span>}
      </div>
      <div className="p-4">{children}</div>
    </section>
  )
}

function Tabla({ columnas, filas, children }) {
  return (
    <div className="panel tabla-scroll">
      <table className="tbl">
        <thead>
          <tr>
            {columnas.map(([r, a]) => (
              <th key={r} className={a}>
                {r}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filas.length === 0 && (
            <tr>
              <td colSpan={columnas.length} className="h-[120px]! bg-surface text-center text-sm text-ink-3">
                Sin datos con estos filtros.
              </td>
            </tr>
          )}
          {filas.map(children)}
        </tbody>
      </table>
    </div>
  )
}

/** Lista etiqueta/valor con barra, para los desgloses de costo. */
function Metricas({ filas, total }) {
  const t = total || filas.reduce((s, f) => s + f.monto, 0) || 1
  return (
    <div className="flex flex-col">
      {filas.map((f) => (
        <div key={f.rotulo} className="flex items-baseline justify-between gap-3 border-b border-line-soft py-2 text-sm last:border-b-0">
          <span className="text-ink-2">{f.rotulo}</span>
          <span className="num shrink-0 font-bold text-navy-800">
            {money(f.monto)} · {pct1(f.pct ?? (f.monto / t) * 100)}
          </span>
        </div>
      ))}
    </div>
  )
}

function Insight({ tono = 'teal', children }) {
  return (
    <div
      className={cx(
        'mt-3 rounded-sm border-l-4 px-3 py-2 text-sm',
        tono === 'ambar' ? 'border-ambar-500 bg-ambar-50 text-ambar-800' : 'border-teal-600 bg-teal-50 text-teal-800',
      )}
    >
      {children}
    </div>
  )
}

// --- Páginas -------------------------------------------------------------

function Dashboard({ datos: a }) {
  const total = suma(a, 'total')
  const kpis = [
    ['Embarques', a.length],
    ['Mercancía', money(suma(a, 'goods'))],
    ['Flete', money(suma(a, 'freight'))],
    ['Impuestos', money(suma(a, 'tax')), 'border-ambar-100 bg-ambar-50'],
    ['Arancel', money(suma(a, 'duty'))],
    ['Costo importado', money(total), 'border-teal-100 bg-teal-50'],
  ]
  const mix = desglose(a).map((d) => ({ clave: d.rotulo, valor: d.monto }))
  const porMes = MESES.map((m) => ({ clave: m, valor: promedio(a.filter((d) => d.month === m), 'total') })).filter(
    (x) => x.valor,
  )
  const fletes = agrupar(a, 'origin', (f) => promedio(f, 'freight')).map((g) => ({ clave: g.clave, valor: g.valor }))
  const incoterm = agrupar(a, 'incoterm', (f) => promedio(f, 'landedUnit')).map((g) => ({ clave: g.clave, valor: g.valor }))
  const regimen = REGIMENES.map((r) => ({ clave: r, valor: a.filter((d) => d.regime === r).length })).filter((x) => x.valor)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        {kpis.map(([rot, val, tono]) => (
          <Kpi key={rot} rotulo={rot} valor={val} tono={tono} />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Grafico titulo="Composición del costo importado" sub={money(total)}>
          <Reparto datos={mix} color={colorDe(mix.map((m) => m.clave))} fmt={money} />
        </Grafico>
        <Grafico titulo="Costo promedio por mes">
          <Lineas datos={porMes} fmt={money} />
        </Grafico>
      </div>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Grafico titulo="Flete promedio por origen">
          <BarrasH datos={fletes} fmt={money} />
        </Grafico>
        <Grafico titulo="Costo importado por unidad · Incoterm">
          <BarrasH datos={incoterm} fmt={money} />
        </Grafico>
        <Grafico titulo="Embarques por régimen">
          <BarrasH datos={regimen} />
        </Grafico>
      </div>
    </div>
  )
}

function Precios({ datos: a }) {
  const porMes = MESES.map((m) => ({ clave: m, valor: promedio(a.filter((d) => d.month === m), 'unit') })).filter(
    (x) => x.valor,
  )
  const porProveedor = agrupar(a, 'supplier', (f) => promedio(f, 'unit')).map((g) => ({ clave: g.clave, valor: g.valor }))
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Grafico titulo="Precio unitario promedio por mes">
          <BarrasV datos={porMes} fmt={money} />
        </Grafico>
        <Grafico titulo="Precio unitario promedio por proveedor">
          <BarrasH datos={porProveedor} fmt={money} />
        </Grafico>
      </div>
      <Tabla
        columnas={[
          ['Mes', 'w-[90px]'],
          ['SKU', 'w-[90px]'],
          ['Producto', 'min-w-[200px]'],
          ['Proveedor', 'w-[150px]'],
          ['Origen', 'w-[120px]'],
          ['Precio unit.', 'w-[120px] text-right!'],
          ['Var. vs promedio SKU', 'w-[160px] text-right!'],
        ]}
        filas={a}
      >
        {(d) => {
          const base = promedio(a.filter((x) => x.sku === d.sku), 'unit')
          const v = base ? (d.unit / base - 1) * 100 : 0
          return (
            <tr key={d.ref}>
              <td className="num">{d.month}</td>
              <td className="cell-key">{d.sku}</td>
              <td className="cell-cut" title={d.product}>
                {d.product}
              </td>
              <td>{d.supplier}</td>
              <td>{d.origin}</td>
              <td className="cell-num">{money(d.unit)}</td>
              <td className={cx('cell-num font-bold', v > 0 ? 'text-rojo-700' : v < 0 ? 'text-teal-700' : 'text-ink-3')}>
                {v > 0 ? '+' : ''}
                {v.toFixed(1)}%
              </td>
            </tr>
          )
        }}
      </Tabla>
    </div>
  )
}

function Tendencia({ datos: a }) {
  const porMes = MESES.map((m) => ({
    clave: m,
    valor: promedio(a.filter((d) => d.month === m), 'total'),
    n: a.filter((d) => d.month === m).length,
  })).filter((x) => x.n)
  const mayor = porMes.reduce((p, c) => (!p || c.valor > p.valor ? c : p), null)
  const ultimo = porMes.at(-1)?.valor
  const previo = porMes.length > 1 ? porMes[porMes.length - 2].valor : null
  const variacion = previo ? (ultimo / previo - 1) * 100 : null
  return (
    <div className="flex flex-col gap-4">
      <Grafico titulo="Costo promedio por embarque · evolución mensual">
        <Lineas datos={porMes} fmt={money} />
      </Grafico>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Kpi rotulo="Costo promedio / embarque" valor={money(promedio(a, 'total'))} />
        <Kpi rotulo="Mes de mayor costo" valor={mayor ? `${mayor.clave} · ${money(mayor.valor)}` : '—'} tono="border-ambar-100 bg-ambar-50" />
        <Kpi
          rotulo="Variación último mes"
          valor={variacion == null ? '—' : `${variacion > 0 ? '+' : ''}${variacion.toFixed(1)}%`}
          tono={variacion > 0 ? 'border-rojo-100 bg-rojo-50' : 'border-teal-100 bg-teal-50'}
        />
      </div>
    </div>
  )
}

function IncoCosto({ datos: a }) {
  const grupos = agrupar(a, 'incoterm', (f) => promedio(f, 'landedUnit'))
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Grafico titulo="Costo importado por unidad · Incoterm">
        <BarrasH datos={grupos.map((g) => ({ clave: g.clave, valor: g.valor }))} fmt={money} />
      </Grafico>
      <section className="panel">
        <div className="panel-head">
          <span className="panel-title">Desglose por Incoterm</span>
        </div>
        <div className="flex flex-col gap-4 p-4">
          {grupos.map((g) => (
            <div key={g.clave}>
              <div className="mb-1 flex items-baseline justify-between text-sm">
                <b className="font-bold text-navy-800">{g.clave}</b>
                <span className="text-ink-3">
                  {g.filas.length} embarques · {money(g.valor)} / unidad
                </span>
              </div>
              <Metricas filas={desglose(g.filas)} />
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

function IncoPrecio({ datos: a }) {
  const grupos = agrupar(a, 'incoterm', (f) => promedio(f, 'unit'))
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Grafico titulo="Precio de mercancía por unidad · Incoterm">
          <BarrasH datos={grupos.map((g) => ({ clave: g.clave, valor: g.valor }))} fmt={money} />
        </Grafico>
        <section className="panel">
          <div className="panel-head">
            <span className="panel-title">Desglose del costo promedio</span>
          </div>
          <div className="p-4">
            <Metricas filas={desglose(a)} />
          </div>
        </section>
      </div>
      <Tabla
        columnas={[
          ['Incoterm', 'w-[90px]'],
          ['SKU', 'w-[90px]'],
          ['Proveedor', 'w-[150px]'],
          ['Mercancía / u', 'w-[120px] text-right!'],
          ['Flete / u', 'w-[110px] text-right!'],
          ['Seguro / u', 'w-[110px] text-right!'],
          ['Costo total / u', 'w-[130px] text-right!'],
        ]}
        filas={a}
      >
        {(d) => (
          <tr key={d.ref}>
            <td className="cell-key">{d.incoterm}</td>
            <td className="num">{d.sku}</td>
            <td>{d.supplier}</td>
            <td className="cell-num">{money(d.unit)}</td>
            <td className="cell-num">{money(d.freight / d.qty)}</td>
            <td className="cell-num">{money(d.insurance / d.qty)}</td>
            <td className="cell-num font-bold text-navy-800">{money(d.landedUnit)}</td>
          </tr>
        )}
      </Tabla>
    </div>
  )
}

function Fletes({ datos: a }) {
  const porOrigen = agrupar(a, 'origin', (f) => promedio(f, 'freight'))
  const porNaviera = agrupar(a, 'naviera', (f) => promedio(f, 'freight'))
  const filas = porOrigen.flatMap((o) =>
    distintos(o.filas, 'naviera').map((c) => {
      const z = o.filas.filter((d) => d.naviera === c)
      return { origen: o.clave, naviera: c, sku: z[0]?.sku ?? '—', n: z.length, flete: promedio(z, 'freight'), pctM: promedio(z, 'freightPct') }
    }),
  )
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Grafico titulo="Flete promedio por origen">
          <BarrasH datos={porOrigen.map((g) => ({ clave: g.clave, valor: g.valor }))} fmt={money} />
        </Grafico>
        <Grafico titulo="Flete promedio por naviera">
          <BarrasH datos={porNaviera.map((g) => ({ clave: g.clave, valor: g.valor }))} fmt={money} />
        </Grafico>
      </div>
      <Tabla
        columnas={[
          ['Origen', 'w-[120px]'],
          ['Naviera', 'w-[140px]'],
          ['SKU', 'w-[90px]'],
          ['Embarques', 'w-[100px] text-right!'],
          ['Flete prom.', 'w-[120px] text-right!'],
          ['% sobre mercancía', 'w-[140px] text-right!'],
        ]}
        filas={filas}
      >
        {(r) => (
          <tr key={r.origen + r.naviera}>
            <td className="cell-strong">{r.origen}</td>
            <td>{r.naviera}</td>
            <td className="num">{r.sku}</td>
            <td className="cell-num">{r.n}</td>
            <td className="cell-num">{money(r.flete)}</td>
            <td className="cell-num font-bold text-navy-800">{pct1(r.pctM)}</td>
          </tr>
        )}
      </Tabla>
    </div>
  )
}

function Seguros({ datos: a }) {
  const porOrigen = agrupar(a, 'origin', (f) => suma(f, 'insurance')).map((g) => ({ clave: g.clave, valor: g.valor }))
  const porProveedor = agrupar(a, 'supplier', (f) => suma(f, 'insurance')).map((g) => ({ clave: g.clave, valor: g.valor }))
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Kpi rotulo="Seguro total" valor={money(suma(a, 'insurance'))} />
        <Kpi rotulo="Promedio / embarque" valor={money(promedio(a, 'insurance'))} />
        <Kpi rotulo="Tasa promedio" valor={pct1(promedio(a, 'insuranceRate'))} tono="border-navy-100 bg-navy-50" />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Grafico titulo="Seguro por origen">
          <BarrasH datos={porOrigen} fmt={money} />
        </Grafico>
        <Grafico titulo="Seguro por proveedor">
          <BarrasH datos={porProveedor} fmt={money} />
        </Grafico>
      </div>
    </div>
  )
}

function Impuestos({ datos: a }) {
  const porCategoria = agrupar(a, 'category', (f) => suma(f, 'tax')).map((g) => ({ clave: g.clave, valor: g.valor }))
  const porRegimen = REGIMENES.map((r) => ({ clave: r, valor: suma(a.filter((d) => d.regime === r), 'duty') })).filter(
    (x) => x.valor,
  )
  const cargaFiscal = (suma(a, 'tax') / (suma(a, 'goods') || 1)) * 100
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Grafico titulo="Impuestos por categoría de producto">
          <BarrasH datos={porCategoria} fmt={money} />
        </Grafico>
        <Grafico titulo="Arancel por régimen">
          <BarrasH datos={porRegimen} fmt={money} />
        </Grafico>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi rotulo="Impuestos pagados" valor={money(suma(a, 'tax'))} />
        <Kpi rotulo="Aranceles pagados" valor={money(suma(a, 'duty'))} />
        <Kpi rotulo="Arancel cero" valor={`${a.filter((d) => d.duty === 0).length} embarques`} tono="border-teal-100 bg-teal-50" />
        <Kpi rotulo="Carga fiscal / mercancía" valor={pct1(cargaFiscal)} tono="border-ambar-100 bg-ambar-50" />
      </div>
    </div>
  )
}

function Regimenes({ datos: a }) {
  const rs = REGIMENES.map((r) => ({ clave: r, filas: a.filter((d) => d.regime === r) })).filter((x) => x.filas.length)
  const distribucion = rs.map((r) => ({ clave: r.clave, valor: r.filas.length }))
  const ahorro = rs.map((r) => ({
    clave: r.clave,
    valor: r.filas.reduce((s, d) => s + d.goods * 0.05, 0) - suma(r.filas, 'duty'),
  }))
  const filas = rs.flatMap((r) =>
    distintos(r.filas, 'sku').map((s) => {
      const z = r.filas.filter((d) => d.sku === s)
      return {
        regimen: r.clave,
        sku: s,
        proveedor: z[0]?.supplier ?? '—',
        origen: z[0]?.origin ?? '—',
        n: z.length,
        arancel: suma(z, 'duty'),
        beneficio: ['TLC', 'RIT', 'ZOLI'].includes(r.clave) ? 'Beneficio observado' : 'Sin beneficio especial',
      }
    }),
  )
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Grafico titulo="Distribución por régimen">
          <Reparto datos={distribucion} color={colorDe(distribucion.map((d) => d.clave))} />
        </Grafico>
        <Grafico titulo="Ahorro arancelario estimado" sub="mercancía × 5% menos arancel pagado">
          <BarrasH datos={ahorro} fmt={money} />
        </Grafico>
      </div>
      <Tabla
        columnas={[
          ['Régimen', 'w-[110px]'],
          ['SKU', 'w-[90px]'],
          ['Proveedor', 'w-[150px]'],
          ['Origen', 'w-[120px]'],
          ['Embarques', 'w-[100px] text-right!'],
          ['Arancel pagado', 'w-[130px] text-right!'],
          ['Beneficio', 'w-[170px]'],
        ]}
        filas={filas}
      >
        {(r) => (
          <tr key={r.regimen + r.sku}>
            <td>
              <span className={cx('inline-block rounded-full px-2.5 py-[3px] text-xs font-semibold', TAG_REGIMEN[r.regimen])}>
                {r.regimen}
              </span>
            </td>
            <td className="cell-key">{r.sku}</td>
            <td>{r.proveedor}</td>
            <td>{r.origen}</td>
            <td className="cell-num">{r.n}</td>
            <td className="cell-num">{money(r.arancel)}</td>
            <td className="text-sm text-ink-2">{r.beneficio}</td>
          </tr>
        )}
      </Tabla>
    </div>
  )
}

function Aduaneros({ datos: a }) {
  const porAduana = agrupar(a, 'customs', (f) => suma(f, 'customsTotal'))
  const mix = [
    ['Servicios aduaneros', 'customsServices'],
    ['Almacenaje', 'storage'],
    ['Cuadrilla', 'crew'],
    ['Otros', 'other'],
  ].map(([rotulo, campo]) => ({ clave: rotulo, valor: suma(a, campo) }))
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Grafico titulo="Gasto aduanero total por aduana">
          <BarrasH datos={porAduana.map((g) => ({ clave: g.clave, valor: g.valor }))} fmt={money} />
        </Grafico>
        <Grafico titulo="Composición de gastos" sub={money(suma(a, 'customsTotal'))}>
          <Reparto datos={mix} color={colorDe(mix.map((m) => m.clave))} fmt={money} />
        </Grafico>
      </div>
      <Tabla
        columnas={[
          ['Aduana', 'w-[140px]'],
          ['Embarques', 'w-[100px] text-right!'],
          ['Servicios', 'w-[110px] text-right!'],
          ['Almacenaje', 'w-[110px] text-right!'],
          ['Cuadrilla', 'w-[100px] text-right!'],
          ['Otros', 'w-[90px] text-right!'],
          ['Total', 'w-[110px] text-right!'],
        ]}
        filas={porAduana}
      >
        {(g) => (
          <tr key={g.clave}>
            <td className="cell-strong">{g.clave}</td>
            <td className="cell-num">{g.filas.length}</td>
            <td className="cell-num">{money(suma(g.filas, 'customsServices'))}</td>
            <td className="cell-num">{money(suma(g.filas, 'storage'))}</td>
            <td className="cell-num">{money(suma(g.filas, 'crew'))}</td>
            <td className="cell-num">{money(suma(g.filas, 'other'))}</td>
            <td className="cell-num font-bold text-navy-800">{money(g.valor)}</td>
          </tr>
        )}
      </Tabla>
    </div>
  )
}

function Control({ datos: a }) {
  const promUnit = promedio(a, 'unit')
  const caros = a.filter((d) => d.unit > promUnit * 1.1)
  const fleteAlto = a.filter((d) => d.freightPct > 8)
  const conArancel = a.filter((d) => d.duty > 0)
  const revisar = [...new Set([...caros, ...fleteAlto])].slice(0, 30)
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <section className="panel p-4">
          <div className="lbl">Variación de precio</div>
          <b className="num my-1 block text-2xl font-bold text-navy-800">{caros.length}</b>
          <span className="text-sm text-ink-3">embarques &gt; 10% sobre el promedio de su SKU</span>
          <Insight>Revisar proveedor, SKU e Incoterm en los de mayor desviación.</Insight>
        </section>
        <section className="panel p-4">
          <div className="lbl">Flete</div>
          <b className="num my-1 block text-2xl font-bold text-navy-800">{fleteAlto.length}</b>
          <span className="text-sm text-ink-3">embarques con flete &gt; 8% de la mercancía</span>
          <Insight tono="ambar">Comparar origen y naviera para ubicar rutas con más peso logístico.</Insight>
        </section>
        <section className="panel p-4">
          <div className="lbl">Carga arancelaria</div>
          <b className="num my-1 block text-2xl font-bold text-navy-800">{conArancel.length}</b>
          <span className="text-sm text-ink-3">embarques con arancel pagado</span>
          <Insight>Contrastar contra TLC, RIT y ZOLI para detectar oportunidades.</Insight>
        </section>
      </div>
      <Tabla
        columnas={[
          ['Ref', 'w-[110px]'],
          ['SKU', 'w-[90px]'],
          ['Proveedor', 'w-[150px]'],
          ['Origen', 'w-[120px]'],
          ['Naviera', 'w-[140px]'],
          ['Incoterm', 'w-[90px]'],
          ['Régimen', 'w-[110px]'],
          ['Total', 'w-[120px] text-right!'],
        ]}
        filas={revisar}
      >
        {(d) => (
          <tr key={d.ref}>
            <td className="cell-key">{d.ref}</td>
            <td className="num">{d.sku}</td>
            <td>{d.supplier}</td>
            <td>{d.origin}</td>
            <td>{d.naviera}</td>
            <td>{d.incoterm}</td>
            <td>{d.regime}</td>
            <td className="cell-num font-bold text-navy-800">{money(d.total)}</td>
          </tr>
        )}
      </Tabla>
    </div>
  )
}

const VISTAS = {
  dashboard: Dashboard,
  precios: Precios,
  tendencia: Tendencia,
  incoCosto: IncoCosto,
  incoPrecio: IncoPrecio,
  fletes: Fletes,
  seguros: Seguros,
  impuestos: Impuestos,
  regimenes: Regimenes,
  aduaneros: Aduaneros,
  control: Control,
}

/** Precios y gastos de importación: el sidebar del HTML como barra de tabs. */
export default function PreciosGastos() {
  const [pagina, setPagina] = useState('dashboard')
  const [f, setF] = useState({ origin: '', supplier: '', naviera: '', sku: '' })

  const set = (k) => (e) => setF((prev) => ({ ...prev, [k]: e.target.value }))
  const sucio = Object.values(f).some(Boolean)
  const datos = useMemo(() => filtrar(f), [f])

  const opciones = useMemo(
    () => ({
      origin: distintos(filtrar({ ...f, origin: '' }), 'origin'),
      supplier: distintos(filtrar({ ...f, supplier: '' }), 'supplier'),
      naviera: distintos(filtrar({ ...f, naviera: '' }), 'naviera'),
      sku: distintos(filtrar({ ...f, sku: '' }), 'sku'),
    }),
    [f],
  )

  const Vista = VISTAS[pagina]

  return (
    <div className="flex flex-col gap-4">
      <div className="min-w-0">
        <h2 className="m-0 text-lg font-bold text-navy-800">Precios y gastos de importación</h2>
        <p className="m-0 text-sm text-ink-3">
          Visibilidad del costo importado — mercancía, flete, seguro, impuestos y aduana. Datos
          ficticios de demostración.
        </p>
      </div>

      {/* Sidebar del HTML como barra de tabs scrolleable en X */}
      <div className="tabbar">
        {PAGINAS.map(([id, rotulo]) => (
          <button key={id} onClick={() => setPagina(id)} className={cx('tab', pagina === id && 'tab-on')}>
            {rotulo}
          </button>
        ))}
      </div>

      <div className="panel flex flex-wrap items-center gap-2 p-3">
        <Select placeholder="Origen · todos" options={opciones.origin} value={f.origin} onChange={set('origin')} className="w-[160px]" />
        <Select placeholder="Proveedor · todos" options={opciones.supplier} value={f.supplier} onChange={set('supplier')} className="w-[180px]" />
        <Select placeholder="Naviera · todas" options={opciones.naviera} value={f.naviera} onChange={set('naviera')} className="w-[160px]" />
        <Select placeholder="SKU · todos" options={opciones.sku} value={f.sku} onChange={set('sku')} className="w-[140px]" />
        {sucio && (
          <Button size="sm" onClick={() => setF({ origin: '', supplier: '', naviera: '', sku: '' })}>
            <LuSearchX size={14} /> Limpiar
          </Button>
        )}
        <span className="num ml-auto rounded-full bg-surface-3 px-2.5 py-[3px] text-xs font-bold text-ink-2">
          {datos.length} embarques
        </span>
      </div>

      <Vista datos={datos} />
    </div>
  )
}
