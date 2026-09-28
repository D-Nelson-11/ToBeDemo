import { ESTADO_LISTA, FYDUCAS, HITOS_FYDUCA, TIPOS_FYDUCA } from '../data/fyducas'

// Estado de cada columna (MSF / FYDUCA / impuestos) según cuántos hitos van.
function columnas(tipo, hechos) {
  const hitos = HITOS_FYDUCA[tipo]
  const cumplido = (rotulo) => hitos.findIndex((h) => h.rotulo === rotulo) < hechos
  return {
    msf:
      tipo === 'general'
        ? 'No aplica'
        : cumplido('MSF pagado')
          ? 'Pagado'
          : cumplido('MSF enviado a pago')
            ? 'Enviado'
            : 'Pendiente',
    fyduca: cumplido('FYDUCA cargada') ? 'Cargada' : 'Pendiente',
    impuestos: cumplido('Impuestos pagados')
      ? 'Pagado'
      : cumplido('Impuestos enviados a pago')
        ? 'Enviado'
        : cumplido('FYDUCA cargada')
          ? 'Pendiente'
          : '—',
  }
}

/**
 * Las operaciones con su estado derivado. `avances` es el mapa del store
 * (id → fechas de los hitos cumplidos en la demo); se suman a los del mock.
 */
export function construirFyducas(avances = {}) {
  return FYDUCAS.map((f) => {
    const hitos = HITOS_FYDUCA[f.tipo]
    const fechas = [...f.hitos.map((s) => new Date(s)), ...(avances[f.id] ?? [])]
    const hechos = Math.min(fechas.length, hitos.length)
    const pendiente = hitos[hechos] ?? null
    return {
      ...f,
      tipoRotulo: TIPOS_FYDUCA[f.tipo],
      hitos,
      fechas,
      hechos,
      pendiente,
      estado: pendiente?.estado ?? ESTADO_LISTA,
      ...columnas(f.tipo, hechos),
    }
  })
}

/** Todos los estados posibles, en el orden del flujo: alimenta el filtro. */
export const ESTADOS_FYDUCA = [
  ...new Set(Object.values(HITOS_FYDUCA).flatMap((hs) => hs.map((h) => h.estado).filter(Boolean))),
  ESTADO_LISTA,
]
