import {
  ADUANAS_OP,
  EMBARQUES_OP,
  MODALIDADES_OP,
  PRODUCTOS_OP,
  SELECTIVOS,
  SLA_ADUANA,
  SLA_SELECTIVO,
  TOLERANCIA_DIAS,
} from '../data/kpiOperativo'

// Agregaciones del desempeño operativo. Las ocho pestañas leen la misma base
// filtrada: cada vista es otro corte sobre las mismas 50 filas.

export const FILTRO_VACIO_OP = {
  proveedor: '',
  naviera: '',
  origen: '',
  aduana: '',
  producto: '',
  selectivo: '',
}

export function filtrarOp(f) {
  return EMBARQUES_OP.filter(
    (e) =>
      (!f.proveedor || e.proveedor === f.proveedor) &&
      (!f.naviera || e.naviera === f.naviera) &&
      (!f.origen || e.origen === f.origen) &&
      (!f.aduana || e.aduana === f.aduana) &&
      (!f.producto || e.producto === f.producto) &&
      (!f.selectivo || e.selectivo === f.selectivo),
  )
}

// Los tres criterios de cumplimiento viven acá: las ocho vistas los reusan.
export const salioATiempo = (e) => e.atd <= e.etd + TOLERANCIA_DIAS
export const llegoATiempo = (e) => e.ata <= e.eta + TOLERANCIA_DIAS
export const dentroDeSla = (e) => e.dias <= SLA_SELECTIVO[e.selectivo]

const prom = (nums) => (nums.length ? nums.reduce((a, v) => a + v, 0) / nums.length : 0)
const pct = (n, total) => (total ? Math.round((n / total) * 100) : 0)

/** Score 1–5 del mockup: es el % de cumplimiento traducido a nota. */
export const score = (v) => (v >= 98 ? 5 : v >= 95 ? 4 : v >= 90 ? 3 : v >= 80 ? 2 : 1)

const valores = (filas, campo) => [...new Set(filas.map((e) => e[campo]))].sort()

/** Agrupa por un campo: cuántos, cuánto cumplen y cuánto tardan. */
function agrupar(filas, campo, cumple) {
  return valores(filas, campo).map((clave) => {
    const a = filas.filter((e) => e[campo] === clave)
    return {
      clave,
      n: a.length,
      cumplimiento: pct(a.filter(cumple).length, a.length),
      dias: prom(a.map((e) => e.dias)),
      desviacion: prom(a.map((e) => e.ata - e.eta)),
    }
  })
}

/** Los números del encabezado: los mismos para todas las pestañas. */
export function resumenOp(filas) {
  const n = filas.length
  const proveedor = pct(filas.filter(salioATiempo).length, n)
  const transito = pct(filas.filter(llegoATiempo).length, n)
  const aduana = pct(filas.filter(dentroDeSla).length, n)
  return {
    embarques: n,
    proveedor,
    transito,
    aduana,
    desviacion: prom(filas.map((e) => e.ata - e.eta)),
    // Salud operativa: las tres dimensiones pesan igual.
    salud: Math.round((proveedor + transito + aduana) / 3),
    diasAduana: prom(filas.map((e) => e.dias)),
    fueraDeSla: filas.filter((e) => !dentroDeSla(e)).length,
  }
}

export const porProveedorOp = (filas) =>
  agrupar(filas, 'proveedor', salioATiempo).sort((a, b) => b.cumplimiento - a.cumplimiento)

export const porNavieraOp = (filas) =>
  agrupar(filas, 'naviera', llegoATiempo).sort((a, b) => b.cumplimiento - a.cumplimiento)

/** Origen ordenado por riesgo: qué porcentaje de sus embarques llegó tarde. */
export function porOrigenOp(filas) {
  return valores(filas, 'origen')
    .map((origen) => {
      const a = filas.filter((e) => e.origen === origen)
      return {
        clave: origen,
        n: a.length,
        riesgo: pct(a.filter((e) => !llegoATiempo(e)).length, a.length),
        rutas: [...new Set(a.map((e) => `${e.origen} → ${e.aduana}`))],
      }
    })
    .sort((a, b) => b.riesgo - a.riesgo)
}

/** Aduanas del corte, de la más lenta a la más rápida. */
export const porAduanaOp = (filas) =>
  agrupar(filas, 'aduana', dentroDeSla).sort((a, b) => b.dias - a.dias)

/** Todas las aduanas del país, incluso las que el filtro dejó sin embarques. */
export function aduanasDelPais(filas) {
  return ADUANAS_OP.map((aduana) => {
    const a = filas.filter((e) => e.aduana === aduana)
    return {
      clave: aduana,
      n: a.length,
      dias: prom(a.map((e) => e.dias)),
      cumplimiento: pct(a.filter((e) => e.dias <= SLA_ADUANA).length, a.length),
    }
  }).sort((x, y) => x.dias - y.dias)
}

export const porModalidadOp = (filas) =>
  MODALIDADES_OP.map((modalidad) => {
    const a = filas.filter((e) => e.modalidad === modalidad)
    return { clave: modalidad, n: a.length, dias: prom(a.map((e) => e.dias)) }
  }).filter((m) => m.n)

export const porSelectivo = (filas) =>
  SELECTIVOS.map((selectivo) => {
    const a = filas.filter((e) => e.selectivo === selectivo)
    return {
      clave: selectivo,
      n: a.length,
      participacion: pct(a.length, filas.length),
      dias: prom(a.map((e) => e.dias)),
      sla: SLA_SELECTIVO[selectivo],
    }
  })

export const porProductoOp = (filas) =>
  PRODUCTOS_OP.map((producto) => {
    const a = filas.filter((e) => e.producto === producto)
    return {
      clave: producto,
      n: a.length,
      dias: prom(a.map((e) => e.dias)),
      participacion: pct(a.length, filas.length),
    }
  })

// Cada segmento del comparador define contra qué se mide el real.
export const SEGMENTOS_OP = [
  { id: 'proveedor', rotulo: 'Proveedor · ETD vs ATD', campo: 'proveedor', unidad: 'casos' },
  { id: 'naviera', rotulo: 'Naviera · ETA vs ATA', campo: 'naviera', unidad: 'casos' },
  { id: 'aduana', rotulo: 'Aduana · SLA vs real', campo: 'aduana', unidad: 'días' },
  { id: 'producto', rotulo: 'Producto · objetivo vs real', campo: 'producto', unidad: 'días' },
]

export const referenciasDe = (filas, id) =>
  valores(filas, SEGMENTOS_OP.find((s) => s.id === id).campo)

/**
 * Plan vs real de una referencia. En proveedor y naviera el plan son todos los
 * casos y el real los que cumplieron; en aduana y producto son días promedio.
 */
export function comparar(filas, id, referencia) {
  const seg = SEGMENTOS_OP.find((s) => s.id === id)
  const a = filas.filter((e) => e[seg.campo] === referencia)
  if (!a.length) return null

  const porCasos = seg.unidad === 'casos'
  const cumple = id === 'proveedor' ? salioATiempo : llegoATiempo
  const dentro = id === 'aduana' ? dentroDeSla : (e) => e.dias <= SLA_ADUANA
  const planDe = (e) =>
    id === 'proveedor' ? e.etd : id === 'naviera' ? e.eta : id === 'aduana' ? SLA_SELECTIVO[e.selectivo] : SLA_ADUANA
  const realDe = (e) => (id === 'proveedor' ? e.atd : id === 'naviera' ? e.ata : e.dias)

  const afectados = a.filter((e) => (porCasos ? !cumple(e) : !dentro(e)))
  const plan = porCasos ? a.length : prom(a.map(planDe))
  const real = porCasos ? a.filter(cumple).length : prom(a.map(realDe))

  // En casos el gap son puntos porcentuales; en días, días de más.
  const ratio = porCasos && plan ? (real / plan) * 100 : 0
  const gap = porCasos ? 100 - ratio : real - plan

  return {
    unidad: seg.unidad,
    porCasos,
    plan,
    real,
    ratio,
    gap,
    afectados,
    desviado: afectados.length > 0 || (!porCasos && gap > 0),
    prioridad: afectados.length >= 3 ? 'Alta' : afectados.length ? 'Media' : 'Baja',
    // La serie del gráfico: hasta 30 embarques, plan y real de cada uno.
    serie: a.slice(0, 30).map((e) => ({ clave: e.id.slice(-3), plan: planDe(e), real: realDe(e) })),
    rotuloPlan:
      id === 'proveedor' ? 'ETD plan' : id === 'naviera' ? 'ETA plan' : id === 'aduana' ? 'SLA plan' : 'Objetivo plan',
    rotuloReal: id === 'proveedor' ? 'ATD real' : id === 'naviera' ? 'ATA real' : 'Días real',
  }
}
