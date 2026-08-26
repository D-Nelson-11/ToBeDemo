import { ADUANAS, ANIO, MESES, MODOS, PLANTAS, SKUS } from '../data/volumenes'

// Manifiesto de volúmenes. Los 52 embarques-semana se generan una sola vez con
// un RNG sembrado: la misma cifra en cada carga, sin traer un dump de datos.

/** mulberry32: PRNG de 32 bits, corto y determinista para la semilla dada. */
function mulberry32(semilla) {
  return function () {
    semilla |= 0
    semilla = (semilla + 0x6d2b79f5) | 0
    let t = Math.imul(semilla ^ (semilla >>> 15), 1 | semilla)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Reparte las 52 semanas en los 12 meses. */
const semanaAMes = (w) => Math.min(11, Math.floor(((w - 1) / 52) * 12))

function generar() {
  const rng = mulberry32(20260826)
  const rand = (min, max) => min + rng() * (max - min)
  const entero = (min, max) => Math.floor(rand(min, max + 1))
  const elegir = (lista) => lista[entero(0, lista.length - 1)]
  // Cada modalidad entra por las aduanas habilitadas para ella.
  const aduanaDe = (modo) => elegir(ADUANAS.filter((a) => a.modos.includes(modo))).id

  const out = []
  for (let semana = 1; semana <= 52; semana++) {
    const mes = semanaAMes(semana)
    SKUS.forEach((s) => {
      // Los SKU de alto volumen se embarcan más seguido que los de especialidad.
      if (rng() > (s.base[1] > 20 ? 0.55 : 0.35)) return
      s.plantas.forEach((planta) => {
        if (rng() > 0.7) return // no llega a todas sus plantas cada semana
        const modo = elegir(s.modos)
        // El aéreo y el LCL no llenan contenedor; el marítimo es el que los mueve.
        const contenedores =
          modo === 'Marítimo' ? entero(1, 4) : modo === 'Terrestre FTL' ? entero(1, 3) : rng() > 0.5 ? 1 : 0
        out.push({
          clave: `${semana}-${s.sku}-${planta}`,
          semana,
          mes,
          anio: ANIO,
          sku: s.sku,
          desc: s.desc,
          planta,
          modo,
          aduana: aduanaDe(modo),
          tm: +rand(s.base[0] * 0.25, s.base[1] * 0.4).toFixed(2),
          contenedores,
        })
      })
    })
  }
  return out
}

export const EMBARQUES = generar()

export const GRANULARIDADES = [
  { id: 'semana', rotulo: 'Semana' },
  { id: 'mes', rotulo: 'Mes' },
  { id: 'anio', rotulo: 'Año' },
]

/** Las opciones del selector de periodo para cada granularidad. */
export function periodosDe(gran) {
  if (gran === 'anio') return [{ value: '0', label: String(ANIO) }]
  if (gran === 'mes') return MESES.map((m, i) => ({ value: String(i), label: `${m} ${ANIO}` }))
  return Array.from({ length: 52 }, (_, i) => ({ value: String(i + 1), label: `Semana ${i + 1}` }))
}

export function filtrar(gran, periodo) {
  const n = Number(periodo)
  if (gran === 'anio') return EMBARQUES
  if (gran === 'mes') return EMBARQUES.filter((e) => e.mes === n)
  return EMBARQUES.filter((e) => e.semana === n)
}

export function rotuloPeriodo(gran, periodo) {
  const n = Number(periodo)
  if (gran === 'anio') return `Año ${ANIO}`
  if (gran === 'mes') return `${MESES[n]} ${ANIO}`
  return `Semana ${n} · ${ANIO}`
}

const suma = (filas, campo) => filas.reduce((a, e) => a + e[campo], 0)

/** Los seis indicadores de cabecera. */
export function resumen(filas) {
  const porPlanta = PLANTAS.map((p) => [p, suma(filas.filter((e) => e.planta === p), 'tm')])
  const lider = porPlanta.sort((a, b) => b[1] - a[1])[0]
  return {
    tm: suma(filas, 'tm'),
    contenedores: suma(filas, 'contenedores'),
    embarques: filas.length,
    skus: new Set(filas.map((e) => e.sku)).size,
    aduanas: new Set(filas.map((e) => e.aduana)).size,
    lider: lider && lider[1] > 0 ? lider[0] : null,
  }
}

/** Agrupa por un campo y devuelve {clave, tm, contenedores} ordenado de mayor a menor. */
function agrupar(filas, campo, orden) {
  const mapa = new Map()
  filas.forEach((e) => {
    const t = mapa.get(e[campo]) ?? { clave: e[campo], tm: 0, contenedores: 0 }
    t.tm += e.tm
    t.contenedores += e.contenedores
    mapa.set(e[campo], t)
  })
  const out = [...mapa.values()]
  // Las modalidades conservan su orden fijo: el color va con la entidad.
  if (orden) return orden.filter((k) => mapa.has(k)).map((k) => mapa.get(k))
  return out.sort((a, b) => b.tm - a.tm)
}

export const porModalidad = (filas) => agrupar(filas, 'modo', MODOS)
export const porAduana = (filas) => agrupar(filas, 'aduana')
export const porPlanta = (filas) => agrupar(filas, 'planta', PLANTAS)

/**
 * Serie de contenedores dentro del periodo. Con un año se ve por mes, con un mes
 * por semana, y con una sola semana no hay tiempo que mostrar: se abre por planta.
 */
export function serieContenedores(filas, gran) {
  if (gran === 'anio')
    return MESES.map((m, i) => ({
      clave: m,
      valor: suma(filas.filter((e) => e.mes === i), 'contenedores'),
    }))
  if (gran === 'mes') {
    const semanas = [...new Set(filas.map((e) => e.semana))].sort((a, b) => a - b)
    return semanas.map((w) => ({
      clave: `S${w}`,
      valor: suma(filas.filter((e) => e.semana === w), 'contenedores'),
    }))
  }
  return PLANTAS.map((p) => ({
    clave: p,
    valor: suma(filas.filter((e) => e.planta === p), 'contenedores'),
  }))
}

/** Una fila por SKU con el desglose de toneladas por planta. */
export function tablaSku(filas) {
  const mapa = new Map()
  filas.forEach((e) => {
    const f = mapa.get(e.sku) ?? {
      sku: e.sku,
      desc: e.desc,
      modos: new Set(),
      plantas: Object.fromEntries(PLANTAS.map((p) => [p, 0])),
      total: 0,
      contenedores: 0,
    }
    f.modos.add(e.modo)
    f.plantas[e.planta] += e.tm
    f.total += e.tm
    f.contenedores += e.contenedores
    mapa.set(e.sku, f)
  })
  return [...mapa.values()]
    .map((f) => ({ ...f, modos: [...f.modos] }))
    .sort((a, b) => b.total - a.total)
}
