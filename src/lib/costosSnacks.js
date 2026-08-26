import {
  CATEGORIAS_EXTRA,
  COSTOS_SNACKS,
  FACTOR_AHORRO,
  MESES_COSTO,
  PRIORIDADES,
} from '../data/costosSnacks'

export const FILTRO_COSTOS = {
  periodo: '6',
  aduana: '',
  materia: '',
  naviera: '',
  categoria: '',
  prioridad: '',
}

const unicos = (campo) => [...new Set(COSTOS_SNACKS.map((r) => r[campo]))].sort()

export const ADUANAS_COSTO = unicos('aduana')
export const MATERIAS_COSTO = unicos('materia')
export const NAVIERAS_COSTO = unicos('naviera')
export const CATEGORIAS_COSTO = unicos('categoria')

/** Costo que no debería existir: todo lo que no es flete contratado. */
export const esExtraordinario = (r) => CATEGORIAS_EXTRA.includes(r.categoria)

export function filtrarCostos(f) {
  const desde = MESES_COSTO.length - Number(f.periodo) + 1
  return COSTOS_SNACKS.filter(
    (r) =>
      r.mes >= desde &&
      (!f.aduana || r.aduana === f.aduana) &&
      (!f.materia || r.materia === f.materia) &&
      (!f.naviera || r.naviera === f.naviera) &&
      (!f.categoria || r.categoria === f.categoria) &&
      (!f.prioridad || r.prioridad === f.prioridad),
  )
}

const suma = (filas) => filas.reduce((a, r) => a + r.monto, 0)

/** Los cinco indicadores de cabecera. */
export function indicadoresCosto(filas) {
  const total = suma(filas)
  const extra = suma(filas.filter(esExtraordinario))
  const demora = suma(filas.filter((r) => ['Demora', 'Estadías'].includes(r.categoria)))
  return {
    total,
    extra,
    demora,
    embarques: filas.length,
    promedio: filas.length ? total / filas.length : 0,
    ahorro: extra * FACTOR_AHORRO,
    pctExtra: total ? Math.round((extra / total) * 100) : 0,
    pctDemora: total ? Math.round((demora / total) * 100) : 0,
  }
}

/** Agrupa por un campo sumando monto y contando embarques. */
export function agruparCosto(filas, campo) {
  const mapa = new Map()
  filas.forEach((r) => {
    const t = mapa.get(r[campo]) ?? { clave: r[campo], valor: 0, embarques: 0 }
    t.valor += r.monto
    t.embarques += 1
    mapa.set(r[campo], t)
  })
  const total = suma(filas) || 1
  return [...mapa.values()]
    .map((g) => ({ ...g, pct: Math.round((g.valor / total) * 100) }))
    .sort((a, b) => b.valor - a.valor)
}

/**
 * Las dos series de la tendencia: costo total y, encima, la parte que es
 * extraordinaria. Los meses fuera del periodo no se dibujan.
 */
export function tendenciaCosto(filas, periodo) {
  const desde = MESES_COSTO.length - Number(periodo) + 1
  return MESES_COSTO.map((rotulo, i) => i + 1)
    .filter((mes) => mes >= desde)
    .map((mes) => {
      const delMes = filas.filter((r) => r.mes === mes)
      return {
        clave: MESES_COSTO[mes - 1],
        total: suma(delMes),
        extra: suma(delMes.filter(esExtraordinario)),
      }
    })
}

/** Semáforo de exposición: cuántos embarques hay en cada prioridad. */
export function exposicion(filas) {
  return PRIORIDADES.map((prioridad) => ({
    prioridad,
    embarques: filas.filter((r) => r.prioridad === prioridad).length,
    monto: suma(filas.filter((r) => r.prioridad === prioridad)),
  }))
}

/** Los embarques que piden atención: los que no son normales, por exposición. */
export const mayorAtencion = (filas, tope = 5) =>
  filas
    .filter((r) => r.prioridad !== 'Normal')
    .sort((a, b) => b.monto - a.monto)
    .slice(0, tope)

/** Ranking de materias primas, con la de mayor impacto aparte. */
export function porMateria(filas) {
  const ranking = agruparCosto(filas, 'materia')
  return { lider: ranking[0] ?? null, ranking }
}

export const detalleCosto = (filas, tope = 12) =>
  filas.slice().sort((a, b) => b.monto - a.monto).slice(0, tope)
