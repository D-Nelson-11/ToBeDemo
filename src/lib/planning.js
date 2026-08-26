import { IMPORTACIONES } from '../data/planning'
import { diasEntre, hoy, parseISO } from './fechas'

// Estado de la ETA contra la fecha de control. El mockup traía la fecha fija;
// acá se mide contra hoy, como todo el resto del portal.

export const ESTADOS_ETA = {
  critico: { rotulo: 'Crítico', chip: 'bg-rojo-50 text-rojo-700', lomo: 'var(--color-rojo-600)' },
  riesgo: { rotulo: 'En riesgo', chip: 'bg-ambar-50 text-ambar-700', lomo: 'var(--color-ambar-500)' },
  ok: { rotulo: 'En cumplimiento', chip: 'bg-teal-50 text-teal-700', lomo: 'var(--color-teal-600)' },
}

/** ETA vencida = crítico; dentro de dos días = riesgo. */
export function estadoEta(dias) {
  if (dias < 0) return 'critico'
  return dias <= 2 ? 'riesgo' : 'ok'
}

/** Las importaciones con su ETA ya resuelta contra hoy. */
export function construirImportaciones() {
  return IMPORTACIONES.map((r) => {
    const fecha = parseISO(r.eta)
    const dias = diasEntre(hoy(), fecha)
    return {
      ...r,
      clave: `${r.sku}-${r.planta}`,
      fecha,
      dias,
      estado: estadoEta(dias),
      variacion: dias < 0 ? `${Math.abs(dias)} d de atraso` : dias === 0 ? 'Hoy' : `en ${dias} d`,
    }
  })
}

/** Cuenta por clave y devuelve la lista ordenada de mayor a menor. */
function agrupar(filas, clave, extra = () => ({})) {
  const mapa = new Map()
  filas.forEach((r) => {
    const k = typeof clave === 'function' ? clave(r) : r[clave]
    if (!k) return
    const previo = mapa.get(k) ?? { clave: k, total: 0, criticos: 0, filas: [] }
    previo.total += 1
    if (r.estado === 'critico') previo.criticos += 1
    previo.filas.push(r)
    mapa.set(k, previo)
  })
  return [...mapa.values()]
    .map((g) => ({ ...g, ...extra(g) }))
    .sort((a, b) => b.criticos - a.criticos || b.total - a.total)
}

/**
 * Totales por unidad de medida. KG y unidades no se suman entre sí: es la regla
 * del panel "Total por Unidad de Medida" del mockup.
 */
export function totalesPorUom(filas) {
  const mapa = new Map()
  filas.forEach((r) => {
    const t = mapa.get(r.uom) ?? { uom: r.uom, inventario: 0, transito: 0, skus: 0 }
    t.inventario += r.inventario
    t.transito += r.transito
    t.skus += 1
    mapa.set(r.uom, t)
  })
  return [...mapa.values()].sort((a, b) => a.uom.localeCompare(b.uom))
}

/** Los cuatro indicadores de cabecera. */
export function indicadores(filas) {
  const criticas = filas.filter((r) => r.estado === 'critico').length
  const riesgo = filas.filter((r) => r.estado === 'riesgo').length
  return {
    total: filas.length,
    criticas,
    riesgo,
    // Cumplimiento = lo que no está vencido, sobre el total monitoreado.
    cumplimiento: filas.length ? Math.round(((filas.length - criticas) / filas.length) * 100) : 0,
  }
}

/** Los paneles laterales: causas, compradores, proveedores y embarques. */
export function panelesLaterales(filas) {
  return {
    causas: agrupar(
      filas.filter((r) => r.estado === 'critico' && r.causa),
      'causa',
    ),
    compradores: agrupar(filas, 'comprador'),
    proveedores: agrupar(filas, 'proveedor'),
    enTransito: filas.filter((r) => r.transito > 0).sort((a, b) => a.dias - b.dias),
  }
}

/** Estado por planta: cuántas importaciones y en qué estado va cada una. */
export function porPlanta(filas) {
  return agrupar(filas, 'planta', (g) => ({
    riesgo: g.filas.filter((r) => r.estado === 'riesgo').length,
    ok: g.filas.filter((r) => r.estado === 'ok').length,
  }))
}

/** Situación de un SKU: las tres tarjetas de tránsito / inventario / producción. */
export function situacionSku(filas, sku) {
  const suyas = filas.filter((r) => r.sku === sku)
  if (!suyas.length) return null
  const uom = suyas[0].uom
  return {
    sku,
    uom,
    transito: suyas.reduce((a, r) => a + r.transito, 0),
    inventario: suyas.reduce((a, r) => a + r.inventario, 0),
    produccion: suyas.filter((r) => r.situacion === 'En producción').length,
    plantas: [...new Set(suyas.map((r) => r.planta))],
    proxima: suyas.slice().sort((a, b) => a.dias - b.dias)[0],
  }
}
