import { HITOS_ADUANA, RUTAS } from '../data/catalogos'
import { addDays, diasEntre, fmtDuracion, hoy, parseISO } from './fechas'

// Segmentos del viaje. Son los mismos botones de la torre y salen de comparar
// la fecha de hoy contra los hitos de la ruta, no de un campo de estado.
export const SEGMENTOS = [
  'Todos',
  'En Origen',
  'Puerto de Origen',
  'Tránsito Internacional',
  'Aduana de Destino',
  'Tránsito a Planta',
  'En Planta',
]

export const RIESGOS = ['Dentro de tiempo', 'En riesgo', 'Fuera de tiempo']

const DIAS_ADUANA = 2 // cuánto se estima que la carga permanece en la frontera

// Nombre del medio en que viaja la carga; el marítimo lleva buque y el terrestre
// número de unidad. Es lo que la torre muestra junto a la ubicación.
const BUQUES = ['MSC Aurora', 'CMA Horizon', 'Maersk Sentosa', 'Evergreen Ace', 'ONE Trust']

/** Hash estable de una cadena: los mocks no deben cambiar en cada render. */
function semilla(txt) {
  let h = 0
  for (let i = 0; i < txt.length; i++) h = (h * 31 + txt.charCodeAt(i)) >>> 0
  return h
}
const elige = (lista, s) => lista[s % lista.length]

function segmentoDe(etd, frontera, planta) {
  const d = hoy()
  if (!etd) return 'En Origen'
  if (d < addDays(etd, -1)) return 'En Origen'
  if (d < etd) return 'Puerto de Origen'
  if (d < frontera) return 'Tránsito Internacional'
  if (d < addDays(frontera, DIAS_ADUANA)) return 'Aduana de Destino'
  if (d < planta) return 'Tránsito a Planta'
  return 'En Planta'
}

const UBICACION = {
  'En Origen': (r) => r.origen,
  'Puerto de Origen': (r) => r.origen,
  'Tránsito Internacional': () => 'En ruta',
  'Aduana de Destino': (r) => `Aduana ${r.frontera}`,
  'Tránsito a Planta': (r, oc) => `${r.frontera} → ${oc.centro}`,
  'En Planta': (r, oc) => oc.centro,
}

/** Un embarque de la torre por cada despacho programado. */
export function construirEmbarques(ordenes) {
  const out = []

  ordenes
    .filter((oc) => oc.activa)
    .forEach((oc) =>
      oc.despachos.forEach((d) => {
        const ruta = RUTAS[d.ruta] ?? RUTAS.longbeach
        const etd = parseISO(d.salida)
        if (!etd) return
        const frontera = addDays(etd, ruta.leg1)
        const planta = addDays(frontera, ruta.leg2)

        // La desviación sale de comparar contra la fecha planificada original,
        // que es la que guarda el paso 3 al reprogramar.
        const plan = parseISO(d.salidaPlan ?? d.salida)
        const delay = Math.max(0, diasEntre(plan, etd))
        const riesgo = delay === 0 ? RIESGOS[0] : delay <= 2 ? RIESGOS[1] : RIESGOS[2]

        const segmento = segmentoDe(etd, frontera, planta)
        const s = semilla(oc.id + d.id)
        const terrestre = /El Poy/i.test(ruta.frontera)

        out.push({
          clave: `${oc.id}-${d.id}`,
          id: `${oc.id}·${d.id}`,
          oc,
          despacho: d,
          ruta,
          material: oc.materiales.find((m) => m.codigo === d.material) ?? oc.materiales[0],
          etd,
          frontera,
          planta,
          plan,
          delay,
          riesgo,
          segmento,
          sitio: oc.centro,
          transporte: terrestre ? 'FTL · Terrestre' : 'FCL · Contenedor',
          buque: terrestre ? `Unidad ${1000 + (s % 900)}` : elige(BUQUES, s),
          // ETA original: la que se prometió con la fecha de salida planificada.
          etaOriginal: addDays(plan, ruta.leg1 + ruta.leg2),
          ubicacion: UBICACION[segmento](ruta, oc),
          actualizado: `${String(6 + (s % 6)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`,
        })
      }),
    )

  return out
}

// --- Costos ----------------------------------------------------------------
const TIPOS_COSTO = ['Demora', 'Estadía', 'Almacenaje']
export const CAUSAS_COSTO = ['Aduana', 'Documentación', 'Transporte', 'Recepción / descarga']

const MOTIVOS = {
  Aduana: 'Correcciones de manifiesto / selectivo amarillo',
  Documentación: 'Documentos recibidos después del zarpe',
  Transporte: 'Unidad esperando liberación aduanera',
  'Recepción / descarga': 'Ventana de descarga no disponible',
}

const COMUNICAR = {
  Aduana: 'Aduana + Compras + Logística',
  Documentación: 'Proveedor + Compras',
  Transporte: 'Transporte + Aduana',
  'Recepción / descarga': 'Planta + Logística',
}

/** Solo los embarques desviados generan costo abierto. */
export function construirCostos(embarques) {
  return embarques
    .filter((e) => e.delay > 0)
    .map((e) => {
      const s = semilla(e.clave)
      const tipo = elige(TIPOS_COSTO, s)
      const causa = elige(CAUSAS_COSTO, s >> 3)
      const costoDia = 900 + (s % 9) * 95
      return {
        clave: e.clave,
        embarque: e,
        tipo,
        causa,
        motivo: MOTIVOS[causa],
        dias: e.delay,
        costoDia,
        total: costoDia * e.delay,
        comunicar: COMUNICAR[causa],
      }
    })
}

// --- Alertas ---------------------------------------------------------------
// El nivel define a quién se comunica: es la regla de escalamiento de la torre.
export const NIVELES = {
  1: { rotulo: 'Nivel 1 · Seguimiento', tono: 'teal', regla: '≤ 1 día — Torre de Control.' },
  2: {
    rotulo: 'Nivel 2 · Intervención',
    tono: 'ambar',
    regla: '2 a 3 días o costo relevante — Compras + Logística + área responsable.',
  },
  3: {
    rotulo: 'Nivel 3 · Escalamiento',
    tono: 'rojo',
    regla: 'Más de 3 días o caso crítico — escalar a responsable y aprobación.',
  },
}

export const nivelDe = (delay) => (delay > 3 ? 3 : delay >= 2 ? 2 : 1)

export function construirAlertas(embarques) {
  return embarques
    .filter((e) => e.delay > 0)
    .sort((a, b) => b.delay - a.delay)
    .map((e) => {
      const nivel = nivelDe(e.delay)
      return {
        clave: e.clave,
        embarque: e,
        nivel,
        texto:
          nivel === 3
            ? `+${e.delay} días acumulados. Nueva proyección de llegada a planta y escalamiento al responsable.`
            : nivel === 2
              ? `+${e.delay} días y costo abierto asociado. Requiere intervención del área responsable.`
              : `+${e.delay} día de desviación. Se mantiene bajo seguimiento, sin escalamiento.`,
      }
    })
}

// --- Requisitos de aduana de destino ---------------------------------------
// Se derivan de los checklists del paso 3 para no inventar un segundo estado:
// lo que se marca en Seguimiento es lo que avanza acá.
export function requisitosDestino(embarque) {
  const a = embarque.despacho.aduana ?? []
  const l = embarque.despacho.logistica ?? []
  const todoDoc = a.every(Boolean) && l.every(Boolean)

  return [
    {
      grupo: 'Documentos copia',
      items: [
        ['Factura comercial (copia)', !!a[0]],
        ['Lista de empaque (copia)', !!a[0]],
        ['BL / AWB (copia)', !!l[2]],
      ],
    },
    {
      grupo: 'Manifiestos',
      items: [
        ['Manifiesto de carga', !!a[1]],
        ['Manifiesto de descarga', !!a[1] && !!l[1]],
      ],
    },
    {
      grupo: 'Licencias y permisos',
      items: [
        ['Certificado de origen', !!a[2]],
        ['Permiso fitosanitario', !!a[3]],
        ['Licencia de importación', !!a[2] && !!a[3]],
      ],
    },
    {
      grupo: 'ETA',
      items: [
        ['ETA confirmada', true],
        ['Notificación a aduana', !!l[0]],
      ],
    },
    {
      grupo: 'Documentos originales',
      items: [
        ['Factura original', todoDoc],
        ['BL original', todoDoc],
        ['Cert. origen original', todoDoc],
      ],
    },
  ]
}

// --- Trámite en la aduana de destino ---------------------------------------
// Seis hitos con un SLA entre cada par (HITOS_ADUANA, en catalogos.js). En qué
// hito va sigue saliendo de los checklists del paso 3, para no inventar un
// segundo estado; lo que se agrega acá son los tiempos y el semáforo.

const HORA_MS = 3600000
export const ETAPAS_TRAMITE = HITOS_ADUANA.map((h) => h.rotulo)

/** En qué hito del trámite va, según cuántos requisitos están cumplidos. */
export function etapaTramite(embarque) {
  const grupos = requisitosDestino(embarque)
  const items = grupos.flatMap((g) => g.items)
  const hechos = items.filter(([, ok]) => ok).length
  return Math.min(
    HITOS_ADUANA.length - 1,
    Math.floor((hechos / items.length) * HITOS_ADUANA.length),
  )
}

/** Fracción determinista dentro de [min, max] — los mocks no cambian por render. */
function fraccion(s, min, max) {
  return min + ((s % 97) / 97) * (max - min)
}

/**
 * Los seis hitos con su hora, su límite de SLA y el estado del semáforo.
 * Las horas son mock y se calculan HACIA ATRÁS desde `ahora`: así el hito en
 * curso siempre cae cerca de su vencimiento, que es lo que la demo debe mostrar.
 */
export function tramiteAduana(embarque, ahora = new Date()) {
  const actual = etapaTramite(embarque)
  const s = semilla(embarque.clave)
  const marcas = new Array(HITOS_ADUANA.length).fill(null)

  if (actual >= 1) {
    // Cuánto del SLA lleva consumido el tramo en curso: 0.45 a 1.4 reparte
    // verdes, amarillos y rojos entre los embarques sin tener que sortearlos.
    const consumido = fraccion(s, 0.45, 1.4) * HITOS_ADUANA[actual].sla
    marcas[actual - 1] = new Date(ahora.getTime() - consumido * HORA_MS)
    for (let k = actual - 1; k >= 1; k--) {
      const real = fraccion(s >> k, 0.55, 1.25) * HITOS_ADUANA[k].sla
      marcas[k - 1] = new Date(marcas[k].getTime() - real * HORA_MS)
    }
  }

  return HITOS_ADUANA.map((h, i) => {
    const limite =
      i >= 1 && marcas[i - 1] ? new Date(marcas[i - 1].getTime() + h.sla * HORA_MS) : null
    const base = { ...h, indice: i, ts: marcas[i], limite, curso: i === actual }

    // Pendiente: todavía no le toca, solo se anuncia su SLA.
    if (i > actual) return { ...base, estado: 'pendiente', nota: `SLA ${h.sla} h` }

    // El primer hito abre el reloj, no tiene SLA contra el cual medirse.
    if (i === 0) {
      return actual === 0
        ? { ...base, estado: 'pendiente', nota: 'en curso' }
        : { ...base, estado: 'ok', nota: '' }
    }

    const holgura = ((limite?.getTime() ?? 0) - (base.curso ? ahora : marcas[i]).getTime()) / 60000
    const margen = h.sla * 60 * (base.curso ? 0.25 : 0.15) // amarillo dentro de este resto

    if (holgura < 0)
      return {
        ...base,
        estado: 'vencido',
        minutos: holgura,
        nota: `${base.curso ? 'vencido ' : ''}+${fmtDuracion(holgura)}${base.curso ? '' : ' tarde'}`,
      }
    return {
      ...base,
      estado: holgura <= margen ? 'riesgo' : 'ok',
      minutos: holgura,
      nota: base.curso ? `vence en ${fmtDuracion(holgura)}` : `${fmtDuracion(holgura)} antes`,
    }
  })
}

/** El hito donde está parado el embarque; es lo que va en el chip de la tarjeta. */
export function estatusAduana(embarque) {
  return HITOS_ADUANA[etapaTramite(embarque)].rotulo
}

/** El peor estado del trámite: manda el color del chip. */
export function estadoTramite(embarque, ahora) {
  const hitos = tramiteAduana(embarque, ahora)
  const enCurso = hitos.find((h) => h.curso) ?? hitos[hitos.length - 1]
  if (hitos.some((h) => h.estado === 'vencido')) return 'vencido'
  return enCurso.estado === 'pendiente' ? 'ok' : enCurso.estado
}

export function prioridadDe(embarque) {
  return embarque.delay > 2 ? 'Alta' : embarque.delay > 0 ? 'Media' : 'Baja'
}
