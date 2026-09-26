// Manifiesto de volúmenes: catálogos del dashboard del cliente.

export const PLANTAS = ['SPS', 'Choloma', 'Tegucigalpa']

export const PLANTA_ROTULO = {
  SPS: 'San Pedro Sula',
  Choloma: 'Choloma',
  Tegucigalpa: 'Tegucigalpa',
}

export const ADUANAS = [
  { id: 'Puerto Cortés', modos: ['Marítimo'] },
  { id: 'Aeropuerto Ramón Villeda Morales', modos: ['Aéreo'] },
  { id: 'Aeropuerto Toncontín', modos: ['Aéreo'] },
  { id: 'Frontera El Poy', modos: ['Terrestre FTL', 'Terrestre LCL'] },
  { id: 'Frontera Guasaule', modos: ['Terrestre FTL', 'Terrestre LCL'] },
]

export const MODOS = ['Marítimo', 'Aéreo', 'Terrestre FTL', 'Terrestre LCL']

// Azules de AZULES (Graficos.jsx), alternando oscuro/claro: si dos vecinos
// quedan del mismo tono ya no se distinguen en el Reparto.
export const MODO_COLOR = {
  Marítimo: '#003049',
  Aéreo: '#5b9bd5',
  'Terrestre FTL': '#1f5f8b',
  'Terrestre LCL': '#a9c9e6',
}

export const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

export const ANIO = 2026

// `base` = rango de toneladas por embarque de ese SKU.
export const SKUS = [
  { sku: 'MP-1001', desc: 'Harina de maíz precocida',         plantas: ['SPS', 'Choloma', 'Tegucigalpa'], modos: ['Marítimo', 'Terrestre FTL'],      base: [38, 70] },
  { sku: 'MP-1002', desc: 'Aceite de palma refinado',         plantas: ['SPS', 'Choloma'],                modos: ['Marítimo'],                       base: [30, 55] },
  { sku: 'MP-1003', desc: 'Papa fresca para snack',           plantas: ['Tegucigalpa'],                   modos: ['Terrestre FTL', 'Terrestre LCL'], base: [20, 45] },
  { sku: 'MP-1004', desc: 'Sal refinada fina',                plantas: ['SPS', 'Choloma', 'Tegucigalpa'], modos: ['Terrestre FTL'],                  base: [8, 18] },
  { sku: 'MP-1005', desc: 'Saborizante queso en polvo',       plantas: ['SPS', 'Choloma'],                modos: ['Aéreo', 'Terrestre LCL'],         base: [3, 9] },
  { sku: 'MP-1006', desc: 'Saborizante BBQ en polvo',         plantas: ['SPS', 'Tegucigalpa'],            modos: ['Aéreo', 'Terrestre LCL'],         base: [2, 7] },
  { sku: 'MP-1007', desc: 'Película flexible BOPP metalizada', plantas: ['SPS', 'Choloma', 'Tegucigalpa'], modos: ['Marítimo', 'Terrestre LCL'],      base: [10, 22] },
  { sku: 'MP-1008', desc: 'Cajas corrugadas display',         plantas: ['SPS', 'Choloma', 'Tegucigalpa'], modos: ['Terrestre FTL'],                  base: [12, 26] },
  { sku: 'MP-1009', desc: 'Almidón de maíz modificado',       plantas: ['Choloma', 'Tegucigalpa'],        modos: ['Marítimo', 'Terrestre FTL'],      base: [9, 20] },
  { sku: 'MP-1010', desc: 'Aceite de girasol alto oleico',    plantas: ['SPS'],                           modos: ['Marítimo'],                       base: [14, 28] },
  { sku: 'MP-1011', desc: 'Maíz amarillo entero',             plantas: ['SPS', 'Choloma', 'Tegucigalpa'], modos: ['Marítimo', 'Terrestre FTL'],      base: [40, 80] },
  { sku: 'MP-1012', desc: 'Antioxidante TBHQ',                plantas: ['Choloma'],                       modos: ['Aéreo'],                          base: [0.5, 2] },
]
