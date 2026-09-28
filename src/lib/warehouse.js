import { WAREHOUSE_INICIAL } from '../data/warehouse'
import { addDays, fmtFechaCorta, hoy, parseISO, toISO } from './fechas'

export const ESTADOS_WH = ['Enviado por proveedor', 'En tránsito', 'Llegada Warehouse', 'Recibido']

// Solo lo recibido se puede consolidar: es la regla que habilita el check de la fila.
export const esDisponible = (x) => estadoWh(x) === 'Recibido'

/** El mock en fechas reales: días desde hoy → ISO. Una salida "futura" todavía no ocurrió. */
export function warehouseInicial() {
  const iso = (n) => (n === null || n === undefined || n > 0 ? '' : toISO(addDays(hoy(), n)))
  return WAREHOUSE_INICIAL.map((x) => ({
    ...x,
    eta: toISO(addDays(hoy(), x.eta)),
    salida: iso(x.salida),
    llegada: iso(x.llegada),
    recepcion: iso(x.recepcion),
    traza: [],
  }))
}

/** El estado sale del último hito con fecha, igual que en el HTML de referencia. */
export function estadoWh(x) {
  if (x.recepcion) return 'Recibido'
  if (x.llegada) return 'Llegada Warehouse'
  if (x.salida) return 'En tránsito'
  return 'Enviado por proveedor'
}

export function transitoWh(x) {
  if (x.recepcion) return 'Arribado y recibido'
  if (x.llegada) return 'Llegada confirmada'
  if (x.salida) return x.retraso ? `Retrasado +${x.retraso} d` : `En tránsito · salida ${fmtFechaCorta(x.salida)}`
  return 'Pendiente de salida'
}

/** Un envío nuevo al Warehouse desde una fila de Supply Scheduling. */
export function envioDesdeFila(f, { ref, eta, salida }) {
  return {
    ref,
    clave: f.clave,
    oc: f.oc.id,
    despacho: f.despacho.id,
    proveedor: f.oc.proveedor,
    factura: `FAC-${f.oc.id.slice(-5)}-${f.despacho.id}`,
    sku: `${f.material?.codigo ?? ''} · ${f.material?.nombre ?? ''}`,
    origen: f.ruta?.origen ?? 'Origen proveedor',
    incoterm: f.oc.incoterm,
    eta,
    salida: salida ?? '',
    llegada: '',
    recepcion: '',
    gps: 'Pendiente GPS',
    traza: [],
  }
}

// La salida del Warehouse sale del centro de consolidación hacia la aduana de destino.
const RUTA_WH = { id: 'wh', origen: 'Warehouse Honduras', frontera: 'Pto. Cortés', leg1: 2, leg2: 3 }

/**
 * Una REF. WH con la forma de fila que usa Shipping Instruction (paso 4). Si vino
 * de un despacho real se reusan su OC y material; los envíos del mock no tienen OC
 * en el store, así que se arma una con lo que trae el envío.
 */
export function itemGestion(x, ordenes) {
  const [codigo, nombre] = x.sku.split(' · ')
  const real = ordenes.find((o) => o.id === x.oc)
  const d = real?.despachos.find((y) => y.id === x.despacho)
  const oc = real ?? {
    id: x.oc,
    proveedor: x.proveedor,
    organizacion: 'CORPORACIÓN DINANT S.A',
    condPago: 'Crédito 30 días',
    moneda: 'USD',
    incoterm: x.incoterm,
    centro: RUTA_WH.origen,
    materiales: [],
  }
  const material =
    (d && real.materiales.find((m) => m.codigo === d.material)) ?? { codigo, nombre, unidad: 'KG', precio: 1.2 }
  const etd = addDays(parseISO(x.eta) ?? hoy(), 1)
  return {
    clave: x.ref,
    oc,
    despacho: { ...(d ?? { cantidad: 500, aduana: [], logistica: [] }), id: x.ref },
    ruta: RUTA_WH,
    etd,
    planta: addDays(etd, RUTA_WH.leg1 + RUTA_WH.leg2),
    material,
  }
}

/**
 * La instrucción de salida del Warehouse como una OC con un solo despacho: con esa
 * forma la torre la procesa igual que al resto de embarques (segmento, riesgo, costos).
 */
export function salidaDesdeItems(items, n) {
  const primero = items[0]
  const proveedores = [...new Set(items.map((i) => i.oc.proveedor))]
  const cantidad = items.reduce((a, i) => a + (i.despacho.cantidad || 0), 0)
  // El destino es la planta de la primera OC real; las del mock no tienen, van al CD.
  const centro = items.find((i) => i.oc.activa)?.oc.centro ?? 'CD DINANT SNACK'
  return {
    id: 'SAL-WH-' + String(n).padStart(2, '0'),
    activa: true,
    proveedor: proveedores.length === 1 ? proveedores[0] : `Consolidado · ${proveedores.length} proveedores`,
    organizacion: 'CORPORACIÓN DINANT S.A',
    centro,
    moneda: 'USD',
    incoterm: primero.oc.incoterm,
    materiales: [{ ...primero.material }],
    despachos: [
      {
        id: items.map((i) => i.despacho.id).join('+'),
        material: primero.material.codigo,
        cantidad,
        salida: toISO(primero.etd),
        rutaDetalle: RUTA_WH,
        transporte: 'Consolidado WH',
        // Sale con la instrucción hecha: la aduana arranca con factura y DUCA, el booking pendiente.
        aduana: [true, true, false, false],
        logistica: [false, false, false, false],
      },
    ],
  }
}
