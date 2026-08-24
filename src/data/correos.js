import { fmtFechaCorta, fmtNum } from '../lib/fechas'

// Palabras que disparan alerta en un correo entrante, agrupadas por tipo. Van sin
// tildes y en minúscula: el texto se normaliza antes de buscarlas.
export const VIGILADAS = {
  urgencia: ['urgente', 'urgencia', 'inmediato', 'lo antes posible', 'prioridad', 'critico'],
  retraso: ['retraso', 'retrasada', 'atraso', 'demora', 'demorado', 'reprogramar', 'no llegara', 'posterga'],
  problema: [
    'problema',
    'inconveniente',
    'incidencia',
    'falla',
    'escasez',
    'desabasto',
    'incumplimiento',
    'paro',
    'huelga',
    'fuerza mayor',
    'no podemos',
    'no contamos',
  ],
}


const sinTildes = (t) => t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

/**
 * Busca las palabras vigiladas en un correo.
 * @returns {{tipo: string|null, palabras: string[]}} tipo manda el color; urgencia gana.
 */
export function analizarCorreo(texto) {
  const plano = sinTildes(texto ?? '')
  const palabras = []
  let tipo = null
  for (const [clave, lista] of Object.entries(VIGILADAS)) {
    for (const p of lista) {
      if (!plano.includes(p)) continue
      palabras.push(p)
      // urgencia manda sobre problema, y problema sobre retraso.
      if (clave === 'urgencia' || (clave === 'problema' && tipo !== 'urgencia') || !tipo) tipo = clave
    }
  }
  return { tipo, palabras }
}

/** Correo del proveedor derivado de su nombre; el usuario lo puede corregir. */
export function correoDe(proveedor) {
  const dominio = sinTildes(proveedor)
    .replace(/,?\s*(s\.?a\.?( de c\.?v\.?)?|inc|ltda|sociedad anonima)\.?$/i, '')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .join('')
    .replace(/[^a-z0-9]/g, '')
  return `ventas@${dominio || 'proveedor'}.com`
}

/** El correo estándar que se le sugiere al comprador para esta OC. */
export function plantillaCorreo(oc) {
  const m = oc.materiales[0]
  const limite = new Date()
  limite.setDate(limite.getDate() + 3)

  return {
    para: oc.correoProveedor ?? correoDe(oc.proveedor),
    asunto: `OC ${oc.id} · Confirmación de recepción y disponibilidad`,
    cuerpo: `Estimados,

Adjuntamos la orden de compra ${oc.id} por ${fmtNum(m?.cantidad ?? 0)} ${m?.unidad ?? ''} de ${m?.nombre ?? ''}. Agradecemos confirmar a más tardar el ${fmtFechaCorta(limite)} los siguientes puntos:

 1. Recepción de la orden.
 2. Cantidad aceptada.
 3. Fecha de fabricación.
 4. Fecha estimada de disponibilidad.
 5. Posibles restricciones (materia prima, capacidad, permisos o transporte).

Cualquier variación respecto a lo solicitado, favor indicarla en la respuesta.

Saludos,
${oc.resp} · Abastecimiento · Vesta`,
  }
}

// --- Hilo mock -------------------------------------------------------------
// Respuestas de ejemplo. Las dos primeras traen palabras vigiladas a propósito:
// son las que tienen que encender la alerta en la fila de la OC.
const RESPUESTAS = [
  `Buenos días,

Confirmamos la recepción de la orden. Aceptamos la cantidad completa, pero tenemos un retraso en la línea de producción por saturación de planta.

Nueva fecha estimada de disponibilidad: dos semanas después de lo solicitado. Les pedimos reprogramar el despacho.

Saludos.`,
  `Estimados,

Recibimos la orden. La cantidad aceptada es parcial por escasez de materia prima este mes.

Es urgente que nos confirmen si aceptan el envío parcial hoy mismo para no perder la ventana de embarque.

Quedo atento.`,
  `Buen día,

Confirmamos recepción de la orden y la cantidad aceptada al 100%.

Fecha de fabricación: la próxima semana.
Fecha estimada de disponibilidad: cinco días después de fabricación.
Sin restricciones que reportar.

Saludos cordiales.`,
  `Estimados,

Acusamos recibo de la orden de compra. Cantidad aceptada completa.

La fabricación arranca esta semana y la disponibilidad queda dentro de la fecha solicitada. No tenemos restricciones de materia prima ni de transporte.

Saludos.`,
  `Buenas tardes,

Orden recibida y aceptada en su totalidad. Adjuntamos el calendario de fabricación y la fecha estimada de disponibilidad ya confirmada con planta.

Cualquier consulta quedamos atentos.`,
  `Buen día,

Confirmamos la recepción. Aceptamos la cantidad solicitada y ya quedó programada en el plan de producción.

Fecha estimada de disponibilidad según lo acordado, sin restricciones.

Gracias.`,
]

/** Hash estable: el hilo de una OC no puede cambiar en cada render. */
const semilla = (txt) => {
  let h = 0
  for (let i = 0; i < txt.length; i++) h = (h * 31 + txt.charCodeAt(i)) >>> 0
  return h
}

/**
 * La respuesta del proveedor a un envío. Determinista por OC y por número de
 * envío: la misma orden siempre contesta igual, pero un segundo correo trae otra
 * respuesta. Dos de las seis traen palabras vigiladas.
 */
export function respuestaProveedor(oc, para, envio = 1) {
  const cuerpo = RESPUESTAS[(semilla(oc.id) + envio) % RESPUESTAS.length]
  return {
    id: oc.id + '-r' + envio,
    direccion: 'recibido',
    de: para,
    para: 'abastecimiento@grupovesta.net',
    asunto: 'RE: OC ' + oc.id + ' · Confirmación de recepción y disponibilidad',
    cuerpo,
    fecha: new Date().toISOString(),
  }
}

/** El tipo de alerta más grave del hilo; es lo que pinta el botón de la fila. */
export function alertaDelHilo(hilo = []) {
  const tipos = hilo
    .filter((c) => c.direccion === 'recibido')
    .map((c) => analizarCorreo(c.cuerpo).tipo)
    .filter(Boolean)
  if (tipos.includes('urgencia')) return 'urgencia'
  if (tipos.includes('problema')) return 'problema'
  return tipos[0] ?? null
}
