// Cotizaciones de transporte al freight forwarder, para despachos Collect.
import { addDays, hoy, toISO } from '../lib/fechas'

// Con estos incoterms el transporte lo coordina el comprador: solo ellos se cotizan.
export const INCOTERMS_COLLECT = ['EXW', 'FAS', 'FOB', 'FCA']
export const esCollect = (incoterm) => INCOTERMS_COLLECT.includes(String(incoterm ?? '').toUpperCase())

export const FORWARDERS = [
  'DHL Global Forwarding',
  'Maersk Logistics',
  'DB Schenker',
  'Kuehne+Nagel',
  'Crowley Logistics',
  'UPS Supply Chain',
  'Otro / por asignar',
]

export const CONTRATOS = ['Door to Door', 'Door to Port', 'Port to Port', 'Port to Door']

export const TIPOS_CARGA = { 'Marítimo': ['FCL', 'LCL'], Terrestre: ['FTL', 'LTL'], 'Aéreo': ['AIR'] }
export const rotuloCarga = (t) => (t === 'AIR' ? 'Carga aérea' : t)

export const ESTADOS_COT = ['En proceso de cotización', 'Cotizado', 'Transporte asignado']

// `dias` es la antigüedad de la solicitud: se pasa a fecha real al arrancar.
const INICIALES = [
  { id: 'Q-1082', clave: '5523954-DPE2', ff: 'Maersk Logistics', estado: 'En proceso de cotización', dias: 4, modo: 'Marítimo', carga: 'FCL', nota: 'Esperando tarifa de origen y recargos portuarios', recordatorios: 0 },
  { id: 'Q-1081', clave: '5523954-DPE3', ff: 'DHL Global Forwarding', estado: 'En proceso de cotización', dias: 1, modo: 'Marítimo', carga: 'FCL', nota: 'Solicitud enviada; pendiente confirmación de recepción', recordatorios: 0 },
  { id: 'Q-1076', clave: '5532540-DPE7', ff: 'Crowley Logistics', estado: 'Cotizado', dias: 3, modo: 'Terrestre', carga: 'FTL', nota: 'Propuesta recibida para revisión', recordatorios: 1 },
]

export function cotizacionesIniciales() {
  return INICIALES.map(({ dias, ...c }) => ({ ...c, fecha: toISO(addDays(hoy(), -dias)) }))
}
