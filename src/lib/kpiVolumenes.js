import {
  EMBARQUES_KPI,
  MEDIDAS,
  MESES_KPI,
  MODALIDADES,
  PLANTAS_KPI,
} from '../data/kpiVolumenes'

// Agregaciones del Merchant BI. Una sola base filtrada alimenta las ocho
// pestañas: cada vista es un `agrupar` distinto sobre las mismas filas.

export const FILTRO_VACIO = { mes: '', semana: '', planta: '', modalidad: '', sku: '' }

export function filtrarKpi(f) {
  return EMBARQUES_KPI.filter(
    (e) =>
      (!f.mes || e.mes === f.mes) &&
      (!f.semana || String(e.semana) === String(f.semana)) &&
      (!f.planta || e.planta === f.planta) &&
      (!f.modalidad || e.modalidad === f.modalidad) &&
      (!f.sku || e.sku === f.sku),
  )
}

export const campoDe = (medida) => MEDIDAS.find((m) => m.id === medida).campo

/**
 * Qué medidas tienen sentido con lo que quedó filtrado. Un SKU se mide en kg o
 * en unidades; si todo lo filtrado es de una sola clase, la otra no aplica.
 */
export function medidasDisponibles(filas) {
  const nativas = new Set(filas.map((e) => e.medida))
  return {
    unidades: nativas.has('unidad') || nativas.size !== 1,
    kg: nativas.has('kg') || nativas.size !== 1,
  }
}

/** Agrupa por un campo (o por una función) sumando las cuatro medidas. */
export function agrupar(filas, campo, orden) {
  const mapa = new Map()
  filas.forEach((e) => {
    const k = typeof campo === 'function' ? campo(e) : e[campo]
    const t = mapa.get(k) ?? { clave: k, embarques: 0, unidades: 0, kg: 0, contenedores: 0 }
    t.embarques += 1
    t.unidades += e.unidades
    t.kg += e.kg
    t.contenedores += e.contenedores
    mapa.set(k, t)
  })
  const filasOut = [...mapa.values()]
  // Un orden fijo mantiene el color pegado a la entidad aunque cambie el filtro.
  if (orden) return orden.filter((k) => mapa.has(k)).map((k) => mapa.get(k))
  return filasOut.sort((a, b) => b.unidades - a.unidades)
}

/** Convierte un grupo a la forma que comen los gráficos. */
export const aSerie = (grupos, campo) => grupos.map((g) => ({ clave: g.clave, valor: g[campo] }))

export function resumenKpi(filas) {
  const unicos = (k) => new Set(filas.map((e) => e[k])).size
  return {
    embarques: filas.length,
    unidades: filas.reduce((a, e) => a + e.unidades, 0),
    kg: filas.reduce((a, e) => a + e.kg, 0),
    contenedores: filas.reduce((a, e) => a + e.contenedores, 0),
    plantas: unicos('planta'),
    proveedores: unicos('proveedor'),
    skus: unicos('sku'),
    aduanas: unicos('aduana'),
    navieras: unicos('naviera'),
  }
}

/** Serie mensual completa: los meses sin movimiento valen cero, no desaparecen. */
export function porMes(filas, campo = 'embarques') {
  const grupos = new Map(agrupar(filas, 'mes').map((g) => [g.clave, g]))
  return MESES_KPI.map((m) => ({ clave: m.slice(0, 3), valor: grupos.get(m)?.[campo] ?? 0 }))
}

export const porPlantaKpi = (filas) => agrupar(filas, 'planta', PLANTAS_KPI)
export const porModalidadKpi = (filas) => agrupar(filas, 'modalidad', MODALIDADES)
export const porSku = (filas) => agrupar(filas, 'sku')
export const porProveedor = (filas) => agrupar(filas, 'proveedor')
export const porOrigen = (filas) => agrupar(filas, 'origen')
export const porNaviera = (filas) => agrupar(filas, 'naviera')
export const porAduanaKpi = (filas) => agrupar(filas, 'aduana')

/** Cruce de dos dimensiones, para las tablas de detalle. */
export function cruzar(filas, a, b) {
  return agrupar(filas, (e) => `${e[a]}||${e[b]}`).map((g) => {
    const [uno, dos] = g.clave.split('||')
    return { ...g, [a]: uno, [b]: dos }
  })
}

/** Mes y semana juntos: es la tabla de resumen histórico de la vista general. */
export function resumenPorPeriodo(filas) {
  return cruzar(filas, 'mes', 'semana').sort(
    (x, y) => MESES_KPI.indexOf(x.mes) - MESES_KPI.indexOf(y.mes) || x.semana - y.semana,
  )
}

/** Contenedores por planta desglosados en las cinco modalidades. */
export function contenedoresPlantaModalidad(filas) {
  return PLANTAS_KPI.filter((p) => filas.some((e) => e.planta === p)).map((planta) => {
    const suyas = filas.filter((e) => e.planta === planta)
    const fila = { planta, total: suyas.reduce((a, e) => a + e.contenedores, 0) }
    MODALIDADES.forEach((m) => {
      fila[m] = suyas.filter((e) => e.modalidad === m).reduce((a, e) => a + e.contenedores, 0)
    })
    return fila
  })
}
