import { TM_POR_VIAJE, UNIDADES_INICIALES } from '../data/barcos'

// Estados de un viaje, en orden. Cada acción de la tabla lo mueve al siguiente.
export const ESTADOS_VIAJE = ['PENDIENTE', 'EN TRÁNSITO', 'LLEGÓ A PLANTA', 'DESCARGANDO', 'CERRADO']

export const ACCION_VIAJE = {
  PENDIENTE: 'Marcar salida',
  'EN TRÁNSITO': 'Marcar llegada',
  'LLEGÓ A PLANTA': 'Finalizar descarga',
  DESCARGANDO: 'Recibir en almacén',
}

// El campo que registra la hora de cada paso.
const CAMPO_PASO = {
  PENDIENTE: 'salida',
  'EN TRÁNSITO': 'llegada',
  'LLEGÓ A PLANTA': 'descarga',
  DESCARGANDO: 'almacen',
}

const ACTIVOS = ['EN TRÁNSITO', 'LLEGÓ A PLANTA', 'DESCARGANDO']

/** "2026-09-29T08:30" del momento actual: el valor por defecto de los datetime-local. */
export function ahoraLocal() {
  const d = new Date()
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
}

export function fmtMomento(v) {
  if (!v) return '—'
  const d = new Date(v)
  return Number.isNaN(d.getTime())
    ? v
    : d.toLocaleString('es-HN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

export function estadoInicial(barco) {
  return {
    ...barco,
    aduana: 2,
    ciclos: 1,
    atraque: ahoraLocal(),
    horasLibres: 48,
    costoHora: 5000,
    ingresoSilo: ahoraLocal(),
    costoSiloTmDia: 100,
    inicio: Date.now(),
    secViaje: 1,
    secSilo: 1,
    unidades: UNIDADES_INICIALES.map((u) => ({ ...u })),
    viajes: [],
    movimientosSilo: [],
  }
}

/** Todo lo que se muestra y no se guarda: se recalcula de los viajes en cada render. */
export function metricas(s) {
  const activos = s.viajes.filter((v) => v.estado !== 'CERRADO')
  const cerrados = s.viajes.filter((v) => v.estado === 'CERRADO')
  const movidoSilo = s.movimientosSilo.reduce((a, m) => a + m.tm, 0)
  const unidadesCon = (tipo) => new Set(activos.filter((v) => v.tipo === tipo).map((v) => v.unidad)).size
  const directas = unidadesCon('directo')
  const deSilo = unidadesCon('silo')
  const viajesDirectos = Math.ceil(s.directo / TM_POR_VIAJE)
  const viajesSilo = Math.max(0, Math.ceil((s.silo - movidoSilo) / TM_POR_VIAJE))
  return {
    activos,
    cerrados,
    recibido: cerrados.reduce((a, v) => a + v.tm, 0),
    enTransito: activos.filter((v) => ACTIVOS.includes(v.estado)).reduce((a, v) => a + v.tm, 0),
    stockSilo: Math.max(0, s.silo - movidoSilo),
    disponibles: s.unidades.filter((u) => u.disponible).length,
    directas,
    deSilo,
    viajesDirectos,
    viajesSilo,
    diasDirecto: directas ? Math.ceil(viajesDirectos / (directas * s.ciclos)) : null,
    diasSilo: deSilo ? Math.ceil(viajesSilo / deSilo) : null,
  }
}

/** Dónde está cada unidad según su último viaje: alimenta la vista de asignaciones. */
export function etapaUnidad(s, u) {
  const ultimo = s.viajes.filter((v) => v.unidad === u.unidad).at(-1)
  if (u.disponible || !ultimo) return { etapa: 'Disponible', ultimo }
  if (ultimo.estado === 'PENDIENTE') return { etapa: 'En puerto', ultimo }
  if (ultimo.estado === 'EN TRÁNSITO') return { etapa: 'En tránsito a planta', ultimo }
  return { etapa: 'En planta', ultimo }
}

// ---- acciones: reciben una copia del estado y la modifican ----------------

export function crearViaje(s, tipo, unidad, hora) {
  const u = s.unidades.find((x) => x.unidad === unidad)
  if (!u?.disponible) return null
  const n = tipo === 'directo' ? s.secViaje++ : s.secSilo++
  const viaje = {
    id: (tipo === 'directo' ? 'V-' : 'S-') + String(n).padStart(3, '0'),
    tipo,
    unidad: u.unidad,
    tm: TM_POR_VIAJE,
    estado: 'PENDIENTE',
    asignado: hora,
    salida: '',
    eta: '',
    llegada: '',
    descarga: '',
    almacen: '',
  }
  s.viajes.push(viaje)
  u.disponible = false
  if (tipo === 'directo') u.viajesBarco++
  else u.viajesSilo++
  return viaje
}

export function avanzarViaje(s, id, hora) {
  const v = s.viajes.find((x) => x.id === id)
  if (!v || v.estado === 'CERRADO') return
  v[CAMPO_PASO[v.estado]] = hora
  if (v.estado === 'PENDIENTE') v.eta = new Date(new Date(hora).getTime() + 2 * 3600000).toISOString()
  v.estado = ESTADOS_VIAJE[ESTADOS_VIAJE.indexOf(v.estado) + 1]
  if (v.estado === 'CERRADO') {
    const horas = (new Date(v.almacen) - new Date(v.salida || v.asignado)) / 3600000
    v.duracion = `${Math.max(0, horas).toFixed(1)} h`
    const u = s.unidades.find((x) => x.unidad === v.unidad)
    if (u) u.disponible = true
  }
}

/** Costado y silo siempre suman el total del barco, en múltiplos de un viaje. */
export function repartir(s, campo, tm) {
  const redondeado = Math.max(0, Math.min(s.total, Math.round((Number(tm) || 0) / TM_POR_VIAJE) * TM_POR_VIAJE))
  s[campo] = redondeado
  s[campo === 'directo' ? 'silo' : 'directo'] = s.total - redondeado
}
