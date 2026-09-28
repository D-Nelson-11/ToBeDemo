// Operaciones FYDUCA del corredor terrestre centroamericano. `hitos` son las
// fechas de lo ya cumplido, en el orden de HITOS_FYDUCA según el tipo; lo que
// falta sale de comparar contra esa lista (lib/fyduca.js).

export const TIPOS_FYDUCA = {
  cuarentenario: 'Interés cuarentenario',
  general: 'Mercancía general',
}

// Estado = cómo se ve la operación mientras ese hito está pendiente.
export const HITOS_FYDUCA = {
  cuarentenario: [
    { rotulo: 'Solicitud creada', nota: 'Solicitud MSF registrada.' },
    { rotulo: 'MSF enviado a pago', estado: 'Pendiente MSF', accion: 'Enviar MSF a pago', nota: 'Solicitud MSF enviada al proceso de pago.' },
    { rotulo: 'MSF pagado', estado: 'MSF enviado a pago', accion: 'Confirmar pago MSF', nota: 'Comprobante registrado. Habilita emisión de FYDUCA.' },
    { rotulo: 'FYDUCA cargada', estado: 'Esperando FYDUCA', accion: 'Agregar FYDUCA', nota: 'Documento recibido del proveedor.' },
    { rotulo: 'Impuestos enviados a pago', estado: 'Pago impuestos', accion: 'Enviar impuestos a pago', nota: 'Segundo pago de la operación.' },
    { rotulo: 'Impuestos pagados', estado: 'Impuestos en pago', accion: 'Confirmar pago de impuestos', nota: 'Comprobante registrado. Lista para salida.' },
  ],
  general: [
    { rotulo: 'Solicitud creada', nota: 'Despacho procesado; el seguimiento pasa a Control FYDUCA.' },
    { rotulo: 'FYDUCA cargada', estado: 'Esperando FYDUCA', accion: 'Agregar FYDUCA', nota: 'Documento validado. Habilita pago de impuestos.' },
    { rotulo: 'Impuestos enviados a pago', estado: 'Pago impuestos', accion: 'Enviar impuestos a pago', nota: 'Único pago de la operación.' },
    { rotulo: 'Impuestos pagados', estado: 'Impuestos en pago', accion: 'Confirmar pago de impuestos', nota: 'Comprobante registrado. Lista para salida.' },
  ],
}

export const ESTADO_LISTA = 'Esperando salida'

export const FYDUCAS = [
  {
    id: 'HN-2026-F001',
    oc: 'OC-4521',
    tipo: 'cuarentenario',
    proveedor: 'Proveedor Agrícola GT',
    producto: 'Plátano verde',
    unidades: 500,
    msfSolicitud: 'HN-2026-G020842 · USD 6.25 + HNL 350.00',
    lugar: 'Guatemala · Bodega proveedor',
    gps: '14.6349, -90.5069',
    hitos: ['2026-09-26T08:12'],
  },
  {
    id: 'HN-2026-F002',
    oc: 'OC-4525',
    tipo: 'general',
    proveedor: 'Empaques Centroamérica',
    producto: 'Bolsa laminada',
    unidades: 820,
    lugar: 'El Salvador · Bodega proveedor',
    gps: '13.6929, -89.2182',
    hitos: ['2026-09-26T07:44'],
  },
  {
    id: 'HN-2026-F003',
    oc: 'OC-4530',
    tipo: 'cuarentenario',
    proveedor: 'Proveedor Regional A',
    producto: 'Vegetales frescos',
    unidades: 360,
    msfSolicitud: 'HN-2026-G020799 · USD 6.25 + HNL 350.00',
    lugar: 'Guatemala · Centro de control',
    gps: '14.9824, -88.0140',
    hitos: ['2026-09-25T09:10', '2026-09-25T09:22', '2026-09-25T11:05', '2026-09-26T07:50'],
  },
  {
    id: 'HN-2026-F004',
    oc: 'OC-4562',
    tipo: 'general',
    proveedor: 'Empaques Centroamérica',
    producto: 'Cartón corrugado',
    unidades: 640,
    lugar: 'Agua Caliente · Patio aduana',
    gps: '14.4230, -89.2280',
    hitos: ['2026-09-24T10:00', '2026-09-24T14:20', '2026-09-24T14:25', '2026-09-25T08:12'],
  },
  {
    id: 'HN-2026-F005',
    oc: 'OC-4570',
    tipo: 'cuarentenario',
    proveedor: 'Proveedor Agrícola GT',
    producto: 'Fruta congelada',
    unidades: 240,
    msfSolicitud: 'HN-2026-G020655 · USD 6.25 + HNL 350.00',
    lugar: 'Escuintla · Guatemala',
    gps: '14.3050, -90.7850',
    hitos: ['2026-09-23T08:20', '2026-09-23T08:31', '2026-09-23T12:10', '2026-09-24T09:14', '2026-09-24T10:02'],
  },
  {
    id: 'HN-2026-F006',
    oc: 'OC-4581',
    tipo: 'general',
    proveedor: 'Proveedor Regional B',
    producto: 'Materia prima',
    unidades: 300,
    lugar: 'El Poy · Patio aduana',
    gps: '14.3500, -89.2000',
    hitos: ['2026-09-22T08:30', '2026-09-22T10:12', '2026-09-22T11:03', '2026-09-22T15:40'],
  },
]
