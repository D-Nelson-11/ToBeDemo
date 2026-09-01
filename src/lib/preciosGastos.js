import { IMPORTACIONES } from '../data/preciosGastos'

// Formato del HTML de referencia: montos sin decimales para que quepan en los
// gráficos y las tablas del portal.
export const money = (n) => `$ ${Math.round(n || 0).toLocaleString('en-US')}`
export const pct1 = (n) => `${(n || 0).toFixed(1)}%`

export const suma = (arr, k) => arr.reduce((s, d) => s + (Number(d[k]) || 0), 0)
export const promedio = (arr, k) => (arr.length ? suma(arr, k) / arr.length : 0)

export const distintos = (arr, k) =>
  [...new Set(arr.map((d) => d[k]))].sort((a, b) => String(a).localeCompare(String(b), 'es'))

/** Filtra las importaciones por los cuatro selectores globales (vacío = todos). */
export function filtrar({ origin, supplier, naviera, sku }) {
  return IMPORTACIONES.filter(
    (d) =>
      (!origin || d.origin === origin) &&
      (!supplier || d.supplier === supplier) &&
      (!naviera || d.naviera === naviera) &&
      (!sku || d.sku === sku),
  )
}

/**
 * Agrupa por un campo y calcula un valor por grupo.
 * @returns [{ clave, filas, valor }] ordenado de mayor a menor valor.
 */
export function agrupar(arr, campo, calcular) {
  const m = new Map()
  arr.forEach((d) => {
    if (!m.has(d[campo])) m.set(d[campo], [])
    m.get(d[campo]).push(d)
  })
  return [...m.entries()]
    .map(([clave, filas]) => ({ clave, filas, valor: calcular(filas) }))
    .sort((a, b) => b.valor - a.valor)
}

// Los seis componentes del costo importado, en el orden del desglose del HTML.
export const COMPONENTES = [
  ['Mercancía', 'goods'],
  ['Flete', 'freight'],
  ['Seguro', 'insurance'],
  ['Arancel', 'duty'],
  ['Impuestos', 'tax'],
  ['Gastos aduaneros', 'customsTotal'],
]

/** Desglose de costo de un conjunto de embarques: [{ rotulo, monto, pct }]. */
export function desglose(arr) {
  const total = suma(arr, 'total') || 1
  return COMPONENTES.map(([rotulo, campo]) => {
    const monto = suma(arr, campo)
    return { rotulo, monto, pct: (monto / total) * 100 }
  })
}
