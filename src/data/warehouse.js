// Envíos que ya estaban en el Warehouse Virtual al abrir la demo. Las fechas van
// en días desde hoy (null = todavía no pasó): con fechas fijas la demo envejece.

export const CENTROS_WH = ['Warehouse Honduras', 'Warehouse San Pedro Sula']

export const WAREHOUSE_INICIAL = [
  { ref: 'WH-01', oc: '5521001', proveedor: 'Papas HN', factura: 'F-4588', sku: 'SKU-001 · Papa industrial', origen: 'San Pedro Sula', incoterm: 'DAP', eta: 0, salida: -1, llegada: 0, recepcion: 0, gps: '15.5042, -88.0250' },
  { ref: 'WH-02', oc: '5521002', proveedor: 'Aceites HN', factura: 'F-9912', sku: 'SKU-088 · Aceite vegetal', origen: 'La Ceiba', incoterm: 'DAP', eta: 1, salida: 0, llegada: 0, recepcion: 0, gps: '15.7597, -86.7822' },
  { ref: 'WH-03', oc: '5521003', proveedor: 'Empaques HN', factura: 'F-7781', sku: 'SKU-055 · Empaque', origen: 'San Pedro Sula', incoterm: 'EXW', eta: 1, salida: 0, llegada: 0, recepcion: null, gps: '15.5042, -88.0250' },
  { ref: 'WH-04', oc: '5521004', proveedor: 'Condimentos GT', factura: 'F-2214', sku: 'SKU-332 · Condimento', origen: 'Guatemala', incoterm: 'CIF', eta: 2, salida: 0, llegada: null, recepcion: null, gps: '14.6349, -90.5069' },
  { ref: 'WH-05', oc: '5521005', proveedor: 'Cartón CA', factura: 'F-3315', sku: 'SKU-411 · Cartón corrugado', origen: 'El Salvador', incoterm: 'EXW', eta: 3, salida: -1, llegada: null, recepcion: null, retraso: 1, gps: '13.7942, -88.8965' },
  { ref: 'WH-06', oc: '5521006', proveedor: 'Frutas GT', factura: 'F-4421', sku: 'SKU-621 · Fruta procesada', origen: 'Escuintla, GT', incoterm: 'CIF', eta: 4, salida: 1, llegada: null, recepcion: null, gps: '14.3050, -90.7850' },
]
