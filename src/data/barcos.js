import { addDays, hoy, toISO } from '../lib/fechas'

// Barcos a granel. Se descargan con cabezales de 25 TM: parte directo del costado
// del barco a planta (prioridad 1) y el resto pasa por el silo del puerto.

export const TM_POR_VIAJE = 25

export const FLOTA = [
  {
    id: 'BULK-2026-1048',
    buque: 'MV PACIFIC GRAIN',
    oc: 'OC-2026-1048',
    producto: 'Maíz amarillo',
    codigo: '1004001',
    total: 7000,
    puerto: 'Puerto Cortés',
    planta: 'Planta SPS',
    origen: 'New Orleans, USA',
    proveedor: 'Cargill Americas',
    directo: 5000,
    silo: 2000,
    // Días de navegación: la salida se calcula para que el barco esté hoy en aduana.
    navegacion: 7,
  },
]

export const UNIDADES_INICIALES = [
  ['Carlos Hernández', 'TR-101'],
  ['Miguel López', 'TR-102'],
  ['José Martínez', 'TR-103'],
  ['Luis Rivera', 'TR-104'],
  ['Andrés Cruz', 'TR-105'],
  ['Pedro Flores', 'TR-106'],
  ['Mario Gómez', 'TR-107'],
  ['Jorge Díaz', 'TR-108'],
].map(([nombre, unidad]) => {
  const n = unidad.slice(-3)
  return {
    nombre,
    transporte: 'Cabezal + Traileta',
    unidad,
    cabezal: `HND-${n}`,
    traileta: `TRL-${Number(n) + 400}`,
    disponible: true,
    viajesBarco: 0,
    viajesSilo: 0,
  }
})

/**
 * Los barcos con la forma de OC + despacho que lee la torre. Llegaron a Pto. Cortés
 * hoy, así que caen en Customs Clearance.
 */
export function barcosTorre() {
  return FLOTA.map((b) => ({
    id: b.id,
    activa: true,
    proveedor: b.proveedor,
    organizacion: 'CORPORACIÓN DINANT S.A',
    centro: b.planta.toUpperCase(),
    moneda: 'USD',
    incoterm: 'CFR',
    materiales: [{ codigo: b.codigo, nombre: b.producto, unidad: 'TM', precio: 260 }],
    despachos: [
      {
        id: 'GRANEL',
        material: b.codigo,
        cantidad: b.total,
        salida: toISO(addDays(hoy(), -b.navegacion)),
        rutaDetalle: { id: 'granel', origen: b.origen, frontera: 'Pto. Cortés', leg1: b.navegacion, leg2: 2 },
        transporte: 'Barco',
        buque: b.buque,
        aduana: [true, true, false, false],
        logistica: [true, true, true, false],
      },
    ],
  }))
}
