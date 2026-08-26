import { diasEntre, hoy } from './fechas'
import { estadoTramite, estatusAduana, requisitosDestino } from './torre'

// Torre del comprador: la misma operación que ve el especialista, pero contada
// desde el pedido. Todo sale de `ordenes` y de los embarques ya derivados; acá
// no hay un segundo estado que mantener.

// Por qué un pedido todavía no tiene fecha del proveedor. Es el motivo que el
// comprador tiene que gestionar, no una etiqueta interna.
const MOTIVO = {
  pago: 'Pedido sin pago confirmado',
  fechas: 'Sin fechas asignadas por el proveedor',
  programar: 'Sin programación de despacho',
}

// En qué etapa del viaje mira el comprador cada segmento de la torre.
const ETAPAS = {
  transito: ['Puerto de Origen', 'Tránsito Internacional', 'Tránsito a Planta'],
  aduana: ['Aduana de Destino'],
  planta: ['En Planta'],
}

const cantidadOc = (oc) => oc.materiales.reduce((s, m) => s + m.cantidad, 0)
const despachado = (oc) => oc.despachos.reduce((s, d) => s + d.cantidad, 0)

/** Cuánto del viaje lleva recorrido, entre el zarpe y la llegada a planta. */
export function avanceViaje(e) {
  const total = diasEntre(e.etd, e.planta)
  if (!total || total <= 0) return 100
  const hecho = diasEntre(e.etd, hoy())
  return Math.max(0, Math.min(100, Math.round((hecho / total) * 100)))
}

const riesgoDe = (e) => (e.delay > 2 ? 'Riesgo' : e.delay > 0 ? 'Vigilancia' : 'En tiempo')

/**
 * Las nueve vistas del portal, en un solo recorrido.
 * @returns {{ sinProgramacion, programacion, transito, aduana, planta, entregados, sitios, totales }}
 */
export function construirComprador(ordenes, embarques) {
  const activas = ordenes.filter((oc) => oc.activa)

  // Sin programación: el proveedor todavía no comprometió fecha, o falta el pago.
  const sinProgramacion = activas
    .filter((oc) => oc.pendiente || !oc.despachos.length)
    .map((oc) => {
      const pendiente = despachado(oc) ? cantidadOc(oc) - despachado(oc) : cantidadOc(oc)
      return {
        clave: oc.id,
        oc,
        sku: oc.materiales[0]?.nombre ?? '—',
        unidad: oc.materiales[0]?.unidad ?? '',
        cantidad: pendiente,
        motivo: MOTIVO[oc.pendiente] ?? 'Sin despachos programados',
        // Sin fecha comprometida el impacto lo marca el volumen sin cubrir.
        impacto: pendiente > 100000 ? 'Alto' : pendiente > 20000 ? 'Medio' : 'Bajo',
      }
    })

  // Programación: los despachos que ya tienen fecha del proveedor.
  const programacion = embarques.map((e) => ({
    clave: e.clave,
    embarque: e,
    oc: e.oc,
    carga: e.etd,
    zarpe: e.etd,
    eta: e.planta,
    sitio: e.oc.centro,
    // Reprogramado = el proveedor movió la fecha que ya había comprometido.
    estado: e.delay > 0 ? 'Reprogramada' : 'Confirmada',
  }))

  const deEtapa = (etapa) =>
    embarques
      .filter((e) => ETAPAS[etapa].includes(e.segmento))
      .map((e) => ({
        clave: e.clave,
        embarque: e,
        oc: e.oc,
        sitio: e.oc.centro,
        avance: avanceViaje(e),
        riesgo: riesgoDe(e),
      }))

  const transito = deEtapa('transito')

  const aduana = deEtapa('aduana').map((f) => {
    const items = requisitosDestino(f.embarque).flatMap((g) => g.items)
    return {
      ...f,
      hito: estatusAduana(f.embarque),
      sla: estadoTramite(f.embarque),
      documentos: items.every(([, ok]) => ok) ? 'Completos' : 'Pendientes',
    }
  })

  const planta = deEtapa('planta')

  // Entregado = todos los despachos de la OC llegaron a planta.
  const clavesEnPlanta = new Set(planta.map((f) => f.clave))
  const entregados = activas
    .filter(
      (oc) =>
        oc.despachos.length &&
        oc.despachos.every((d) => clavesEnPlanta.has(`${oc.id}-${d.id}`)),
    )
    .map((oc) => {
      const suyos = planta.filter((f) => f.oc.id === oc.id)
      const atraso = Math.max(...suyos.map((f) => f.embarque.delay))
      return {
        clave: oc.id,
        oc,
        embarques: suyos,
        cantidad: despachado(oc),
        unidad: oc.materiales[0]?.unidad ?? '',
        entrega: suyos.map((f) => f.embarque.planta).sort((a, b) => b - a)[0],
        cumplimiento: atraso === 0 ? 'En fecha' : `${atraso} d de atraso`,
        enFecha: atraso === 0,
      }
    })

  // Sitios: la misma operación agrupada por planta de destino.
  const sitios = [...new Set(embarques.map((e) => e.oc.centro))].map((centro) => {
    const suyos = embarques.filter((e) => e.oc.centro === centro)
    return {
      clave: centro,
      centro,
      activos: suyos.length,
      alertas: suyos.filter((e) => e.delay > 0).length,
      avance: Math.round(suyos.reduce((a, e) => a + avanceViaje(e), 0) / (suyos.length || 1)),
    }
  })

  return {
    sinProgramacion,
    programacion,
    transito,
    aduana,
    planta,
    entregados,
    sitios,
    // Unidades por etapa: es el lenguaje del comprador, no la cuenta de embarques.
    totales: {
      sinProgramacion: sinProgramacion.reduce((a, f) => a + f.cantidad, 0),
      programacion: programacion.reduce((a, f) => a + f.embarque.despacho.cantidad, 0),
      transito: transito.reduce((a, f) => a + f.embarque.despacho.cantidad, 0),
      aduana: aduana.reduce((a, f) => a + f.embarque.despacho.cantidad, 0),
      planta: planta.reduce((a, f) => a + f.embarque.despacho.cantidad, 0),
      entregados: entregados.reduce((a, f) => a + f.cantidad, 0),
    },
  }
}
