import {
  COSTOS_ENTREGA,
  ESTADOS_FINIQUITO,
  ETAPAS_TRANSPORTE,
  MOTORISTAS,
  TIPOS_UNIDAD,
  VENTANAS,
} from '../data/merchant'
import { DIAS_ADUANA, elige, etapaTramite, requisitosDestino, semilla } from './torre'
import { addDays, fmtNum, hoy, parseISO } from './fechas'

// Coordinación de entrega. Todo sale del mismo embarque de la torre: el Merchant
// pide la fecha de recepción y el Carrier ejecuta. Lo único que se guarda es la
// coordinación que registra el usuario y el avance del finiquito.

/** % del trámite de aduana ya cumplido: es el "% liberado" de la pre-coordinación. */
export function porcentajeLiberacion(embarque) {
  const items = requisitosDestino(embarque).flatMap((g) => g.items)
  return Math.round((items.filter(([, ok]) => ok).length / items.length) * 100)
}

/** Cuándo se estima que el embarque sale de la aduana de destino. */
export const fechaLiberacion = (embarque) => addDays(embarque.frontera, DIAS_ADUANA)

/**
 * Coordinación deducida del avance del embarque: nadie coordina una entrega que
 * todavía no tiene fecha de liberación a la vista, y nada llega a planta sin
 * haberse coordinado antes. `null` = todavía no hay coordinación.
 */
function coordinacionBase(e) {
  if (e.segmento === 'At Plant') return 'Confirmado'
  // El tramo a planta es donde vive la acción: liberado y sin fecha de recepción.
  if (e.segmento === 'Last Mile') return null
  if (e.segmento === 'Customs Clearance' && etapaTramite(e) >= 3) return 'Por revisar'
  return null
}

/** La coordinación del usuario gana sobre la deducida. */
function coordinacionDe(e, coordinaciones) {
  const propia = coordinaciones[e.clave]
  // La pantalla guarda la fecha como ISO; el resto del módulo trabaja con Date.
  if (propia)
    return { ...propia, fecha: typeof propia.fecha === 'string' ? parseISO(propia.fecha) : propia.fecha }
  const estado = coordinacionBase(e)
  if (!estado) return null
  const s = semilla(e.clave + 'coord')
  return { estado, fecha: e.planta, ventana: elige(VENTANAS, s), origen: 'Programación previa' }
}

/** aammdd, para el correlativo de la unidad. */
const fechaCodigo = (d) =>
  `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`

/** Riesgo de la entrega en las tres etiquetas del mockup. */
const riesgoEntrega = (e) => (e.delay > 2 ? 'Alto' : e.delay > 0 ? 'Medio' : 'Bajo')

/** Unidad asignada por el Carrier. Sin coordinación confirmada no hay unidad. */
export function transporteDe(e, coordinacion) {
  const s = semilla(e.clave + 'unidad')
  const asignada = coordinacion?.estado !== 'Por revisar'
  return {
    tipo: asignada ? elige(TIPOS_UNIDAD, s) : 'Por asignar',
    motorista: asignada ? elige(MOTORISTAS, s >> 2) : 'Pendiente',
    cabezal: asignada ? `HND-${4000 + (s % 3000)}` : 'Pendiente',
    id: asignada ? `TR-${fechaCodigo(coordinacion?.fecha ?? e.planta)}-${100 + (s % 899)}` : 'Pendiente',
  }
}

// Hasta qué etapa de la bitácora llegó el embarque. Sale del segmento del viaje
// y del estado de la coordinación; no hay un campo aparte que mantener.
function etapaTransporte(e, coordinacion) {
  if (e.segmento === 'At Plant') return e.delay > 0 ? 6 : 7
  if (e.segmento === 'Last Mile') return 4
  if (!coordinacion) return 0
  return coordinacion.estado === 'Por revisar' ? 1 : 3
}

/** Estado corto del transporte: es el chip de la tabla de coordinados. */
export function estadoTransporte(e, coordinacion) {
  const i = etapaTransporte(e, coordinacion)
  if (i <= 1) return 'Por asignar'
  if (i <= 3) return 'Asignado'
  if (i === 4) return 'En tránsito'
  if (i === 5) return 'Llegada a planta'
  if (i === 6) return 'Descargado'
  return 'Vacío entregado'
}

/**
 * Las ocho etapas con su fecha, responsable y estado. El hito en curso se ancla
 * a hoy si la carga sigue en camino, y a la llegada si ya está en planta; el
 * resto se reparte un día por etapa hacia atrás. Las pendientes van sin fecha.
 */
export function bitacoraTransporte(e, coordinacion) {
  const actual = etapaTransporte(e, coordinacion)
  const s = semilla(e.clave + 'bitacora')
  const ancla = e.segmento === 'At Plant' ? e.planta : hoy()
  return ETAPAS_TRANSPORTE.map((etapa, i) => {
    const estado = i < actual ? 'Completado' : i === actual ? 'En curso' : 'Pendiente'
    const fecha = estado === 'Pendiente' ? null : addDays(ancla, i - actual)
    if (fecha) fecha.setHours(7 + ((s + i * 3) % 11), (s + i * 7) % 60, 0, 0)
    return {
      ...etapa,
      indice: i,
      estado,
      fecha,
      observacion:
        estado === 'Completado'
          ? OBS_OK[i]
          : estado === 'En curso'
            ? OBS_CURSO[i]
            : 'Pendiente',
    }
  })
}

const OBS_OK = [
  'Ventana de recepción confirmada',
  'Solicitud procesada por logística',
  'Unidad asignada por el transportista',
  'Reserva de salida confirmada',
  'Unidad en ruta a planta',
  'Unidad en patio de descarga',
  'Descarga completada',
  'Contenedor vacío devuelto',
]

const OBS_CURSO = [
  'Esperando fecha de recepción del cliente',
  'En revisión de disponibilidad',
  'Buscando unidad disponible',
  'Reserva de salida pendiente con aduana',
  'En ruta hacia planta',
  'En patio, esperando andén',
  'Descargando',
  'Pendiente de devolver el vacío',
]

/** Costos excedidos de la entrega. Cero, uno o dos por embarque. */
export function costosEntrega(embarque) {
  const s = semilla(embarque.clave + 'finiquito')
  const n = s % 3
  return Array.from({ length: n }, (_, k) => {
    const base = elige(COSTOS_ENTREGA, s >>> (k * 3))
    const dias = 1 + ((s >>> k) % 3) * 0.5
    return { ...base, dias, monto: Math.round(base.tarifa * dias) }
  })
}

/** Estatus del finiquito: sin costos ya está cerrado, con costos avanza por pasos. */
function finiquitoBase(embarque, costos) {
  if (!costos.length) return 'Finalizado'
  return ESTADOS_FINIQUITO[semilla(embarque.clave + 'estatus') % 4]
}

/**
 * Las cinco vistas de la pantalla, en un solo recorrido. `coordinaciones` y
 * `finiquitos` son los mapas del store; lo que el usuario registra gana sobre
 * lo deducido, igual que en el resto de la torre.
 */
export function construirMerchant(embarques, coordinaciones = {}, finiquitos = {}) {
  const precoordinacion = []
  const liberados = []
  const recibidas = []
  const coordinados = []
  const entregados = []

  embarques.forEach((e) => {
    const coordinacion = coordinacionDe(e, coordinaciones)
    const fila = {
      clave: e.clave,
      embarque: e,
      cuenta: e.oc.centro,
      sku: e.material?.nombre ?? '—',
      cantidad: `${fmtNum(e.despacho.cantidad)} ${e.material?.unidad ?? ''}`.trim(),
      aduana: `Aduana ${e.ruta.frontera}`,
      destino: e.oc.centro,
      riesgo: riesgoEntrega(e),
      coordinacion,
    }

    // Pre-coordinación: todavía en aduana o en camino a ella, sin coordinar.
    if (!coordinacion && ['International Transit', 'Customs Clearance'].includes(e.segmento))
      precoordinacion.push({ ...fila, pct: porcentajeLiberacion(e), liberacion: fechaLiberacion(e) })

    // Liberados: ya salieron de aduana y les falta fecha de recepción.
    if (!coordinacion && e.segmento === 'Last Mile')
      liberados.push({ ...fila, liberacion: fechaLiberacion(e) })

    if (coordinacion?.estado === 'Por revisar') recibidas.push(fila)

    if (coordinacion && coordinacion.estado !== 'Por revisar')
      coordinados.push({
        ...fila,
        transporte: transporteDe(e, coordinacion),
        estadoTransporte: estadoTransporte(e, coordinacion),
      })

    if (e.segmento === 'At Plant') {
      const costos = costosEntrega(e)
      const estatus = finiquitos[e.clave] ?? finiquitoBase(e, costos)
      entregados.push({
        ...fila,
        costos,
        total: costos.reduce((a, c) => a + c.monto, 0),
        estatus,
        retorno: estatus === 'Finalizado' ? 'Retorno realizado' : 'Pendiente retorno',
      })
    }
  })

  return { precoordinacion, liberados, recibidas, coordinados, entregados }
}
