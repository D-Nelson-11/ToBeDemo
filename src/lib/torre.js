import { RUTAS } from '../data/catalogos'
import { addDays, diasEntre, hoy, parseISO } from './fechas'

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

export const ETAPAS_TRAMITE = [
  'ETA ingresada',
  'Revisión documental',
  'Verificación de peso',
  'Selectivo',
  'Pago de impuestos',
  'Liberación / salida',
]

/** En qué etapa del trámite va, según cuántos requisitos están cumplidos. */
export function etapaTramite(embarque) {
  const grupos = requisitosDestino(embarque)
  const items = grupos.flatMap((g) => g.items)
  const hechos = items.filter(([, ok]) => ok).length
  return Math.min(
    ETAPAS_TRAMITE.length - 1,
    Math.floor((hechos / items.length) * ETAPAS_TRAMITE.length),
  )
}

export const ESTATUS_ADUANA = [
  'Trámite en sitio',
  'Selectivo',
  'Pago de impuestos',
  'Listo para liquidar',
  'Liberación',
]

export function estatusAduana(embarque) {
  return ESTATUS_ADUANA[Math.min(ESTATUS_ADUANA.length - 1, etapaTramite(embarque))]
}

export function prioridadDe(embarque) {
  return embarque.delay > 2 ? 'Alta' : embarque.delay > 0 ? 'Media' : 'Baja'
}
