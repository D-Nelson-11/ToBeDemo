// Torre de control logística end-to-end (vista del cliente). 40 embarques mock
// generados con una fórmula fija, como en el HTML de referencia: no salen del
// store porque son de otro dominio (tránsito, aduana y costos por embarque).

export const SITIOS = ['Planta Norte', 'Planta Centro', 'Planta Sur']
export const TRANSPORTES = ['Marítimo', 'Terrestre', 'Aéreo']
export const ESTATUS = [
  'En origen',
  'En tránsito internacional',
  'En aduana',
  'En tránsito a planta',
  'En planta',
]

const PROVEEDORES = ['McCain', 'Cargill', 'Unilever', 'Nestlé', 'Procter & Gamble']
const RUTAS = [
  'Francia → Puerto Cortés',
  'USA → Puerto Cortés',
  'Brasil → San Lorenzo',
  'España → Puerto Cortés',
]
const NAVIERAS = ['Maersk', 'MSC', 'Crowley', 'Hapag-Lloyd', 'DHL Express']

export const EMBARQUES = Array.from({ length: 40 }, (_, i) => {
  const n = String(i + 1).padStart(3, '0')
  const estatus = ESTATUS[i % ESTATUS.length]
  const alerta = i % 5 === 0
  return {
    id: `EMB-${n}`,
    oc: `OC-88${n}`,
    sku: `SKU-${2000 + i}`,
    contenedor: `CNTR-${9000 + i}-HN`,
    proveedor: PROVEEDORES[i % PROVEEDORES.length],
    ruta: RUTAS[i % RUTAS.length],
    naviera: NAVIERAS[i % NAVIERAS.length],
    transporte: TRANSPORTES[i % TRANSPORTES.length],
    destino: SITIOS[i % SITIOS.length],
    estatus,
    etd: `2026-08-${10 + (i % 5)}`,
    etaAduana: `2026-08-${20 + (i % 5)}`,
    etaPlanta: `2026-09-0${1 + (i % 4)}`,
    estadoOrigen:
      i % 2 === 0
        ? 'Booking confirmado · esperando carga'
        : 'Carga consolidada en rampa (PO issued)',
    geo:
      estatus === 'En tránsito internacional'
        ? 'Lat 18.42 · Long -64.61 (Mar Caribe)'
        : 'En nodo de ruta',
    estatusAduana: 'Aduana Central · proceso selectivo',
    avanceAduana: 35 + ((i * 2) % 60),
    proyeccionDespacho: '2026-08-30',
    alertaCosto: alerta,
    tipoCosto: alerta ? 'Demoras de contenedor / estadías' : 'Sin costo extra',
    montoProyectado: alerta ? (i + 1) * 250 : 0,
    causaRaiz: alerta ? 'Retraso en el aforo aduanal' : '—',
    instruccion: alerta
      ? 'Acelerar revisión documental con el agente aduanero para evitar sobrecostos.'
      : 'Seguimiento estándar.',
    llegadaPlanta: estatus === 'En planta' ? '08:30' : 'Pendiente',
    salidaProyectada: estatus === 'En planta' ? '14:00' : 'Pendiente',
  }
})

// Bitácoras del modal. Son fijas (ilustran el trámite), solo cambia la cabecera
// con los datos del embarque elegido.
export const BITACORA_ADUANA = [
  ['Envío a liquidación', '24/08/2026', '08:30', '1h 15m', 'Completado'],
  ['Registro DUCA', '25/08/2026', '07:50', '1h 00m', 'En proceso'],
  ['Selectivo', '25/08/2026', '10:20', '14m', 'Pendiente'],
  ['Orden de liberación', '30/08/2026', '18:00', '31h', 'Pendiente'],
]

export const BITACORA_PLANTA = [
  ['Salida de aduana', '03/08 13:15', 'Aduana', 'Completado', 'Reserva de salida confirmada'],
  ['En tránsito', '03/08 07:20', 'Transportista', 'Completado', 'Unidad en ruta a planta'],
  ['Llegada a planta', '10/08 10:40', 'Planta', 'Completado', 'Unidad en patio de descarga'],
  ['Descargando', '11/08 12:40', 'Planta', 'Completado', 'Descarga completada'],
  ['Vaciado entregado', '12/08 15:47', 'Transportista', 'En curso', 'Pendiente de devolver el vacío'],
]

export const TRAZABILIDAD = [
  ['pasado', 'Salida confirmada de puerto de origen', 'ATD 2026-08-12'],
  ['pasado', 'Transbordo e inspección ZEDE completados', ''],
  ['presente', 'En tránsito marítimo', 'Mar Caribe · Lat 18.42'],
  ['futuro', 'Arribo proyectado a Puerto Cortés', 'ETA 2026-08-28'],
]
