// Catálogos de la coordinación de entrega (Merchant / Carrier).
// El Merchant pide la fecha de recepción; el Carrier ejecuta el transporte.

// Ventanas de recepción en planta: bloques de 4–5 horas, no una hora exacta.
export const VENTANAS = ['08:00–13:00', '09:00–14:00', '10:00–15:00', '11:00–16:00', '12:00–17:00']

// Estado de una coordinación, en orden. El cliente registra, logística revisa y
// aduana reserva la salida; hasta ahí no hay entrega programada.
export const ESTADOS_COORDINACION = ['Por revisar', 'Enviada a Aduana', 'Confirmado']

// Bitácora del transporte: ocho etapas fijas, del pedido de fecha al vacío
// devuelto. El avance no se marca a mano, sale de dónde va la carga.
export const ETAPAS_TRANSPORTE = [
  { rotulo: 'Asignación de fecha de recepción', responsable: 'Merchant' },
  { rotulo: 'Coordinación', responsable: 'Coordinación logística' },
  { rotulo: 'Asignación de unidad', responsable: 'Transportista' },
  { rotulo: 'Salida de aduana', responsable: 'Aduana' },
  { rotulo: 'En tránsito', responsable: 'Transportista' },
  { rotulo: 'Llegada a planta', responsable: 'Planta' },
  { rotulo: 'Descargado', responsable: 'Planta' },
  { rotulo: 'Vacío entregado', responsable: 'Transportista' },
]

export const TIPOS_UNIDAD = ['Cabezal + furgón', 'Cabezal + contenedor', 'Cabezal + plataforma']

export const MOTORISTAS = [
  'Carlos Mejía',
  'José Hernández',
  'Luis Flores',
  'Marvin Reyes',
  'Óscar Padilla',
]

// Costos excedidos que nacen de la ENTREGA, no de la desviación del ETD (esos
// ya viven en el tab Costos). Son los que sostienen el finiquito.
export const COSTOS_ENTREGA = [
  { tipo: 'Demora', causa: 'Exceso sobre el tiempo libre de la naviera', tarifa: 210 },
  { tipo: 'Estadía', causa: 'La unidad excedió la ventana de descarga', tarifa: 180 },
  { tipo: 'Chasis', causa: 'Estadía de chasis posterior a la descarga', tarifa: 125 },
  { tipo: 'Sobrepeso', causa: 'Peso excedido frente al límite autorizado', tarifa: 250 },
  { tipo: 'Redireccionamiento', causa: 'Cambio de destino solicitado', tarifa: 90 },
]

// Estatus del finiquito, en orden. El embarque entregado sigue visible hasta
// que sus costos recorren los cinco.
export const ESTADOS_FINIQUITO = [
  'En validación de costos',
  'Pendiente de aprobación',
  'Pendiente de pago',
  'Pagado',
  'Finalizado',
]

// Qué botón toca en cada estatus y a cuál pasa. El último no tiene siguiente.
export const PASO_FINIQUITO = {
  'En validación de costos': {
    rotulo: 'Enviar solicitud de aprobación',
    siguiente: 'Pendiente de aprobación',
    aviso: 'Solicitud de aprobación enviada al cliente',
  },
  'Pendiente de aprobación': {
    rotulo: 'Aprobar costos',
    siguiente: 'Pendiente de pago',
    aviso: 'Costos aprobados; el embarque pasa a pendiente de pago',
  },
  'Pendiente de pago': {
    rotulo: 'Enviar a pago',
    siguiente: 'Pagado',
    aviso: 'Costos enviados a pago',
  },
  Pagado: {
    rotulo: 'Finiquitar embarque',
    siguiente: 'Finalizado',
    aviso: 'Embarque finiquitado',
  },
}
