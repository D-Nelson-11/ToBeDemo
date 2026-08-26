// Cost Control Tower · Snacks. Los 28 registros son los del mockup del cliente;
// `mes` va de 1 (marzo) a 6 (agosto) de 2026.

export const MESES_COSTO = ['Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago']

export const PERIODOS_COSTO = [
  { value: '6', label: 'Últimos 6 meses' },
  { value: '3', label: 'Últimos 3 meses' },
  { value: '1', label: 'Último mes' },
]

export const PRIORIDADES = ['Crítico', 'Seguimiento Proactivo', 'Normal']

// Semáforo de exposición. Son colores de estado, reservados: nunca se reusan
// para pintar una serie más de un gráfico.
export const TONO_PRIORIDAD = {
  Crítico: { chip: 'bg-rojo-50 text-rojo-700', lomo: 'var(--color-rojo-600)', borde: 'border-rojo-100 bg-rojo-50' },
  'Seguimiento Proactivo': { chip: 'bg-ambar-50 text-ambar-700', lomo: 'var(--color-ambar-500)', borde: 'border-ambar-100 bg-ambar-50' },
  Normal: { chip: 'bg-teal-50 text-teal-700', lomo: 'var(--color-teal-600)', borde: 'border-teal-100 bg-teal-50' },
}

// Las cuatro que NO son flete contratado: son las que no deberían existir.
export const CATEGORIAS_EXTRA = ['Demora', 'Estadías', 'Chasis', 'WTD']

// Las dos series del gráfico de tendencia. Par validado (luminosidad, croma,
// separación para daltonismo y contraste sobre el panel blanco).
export const SERIES_COSTO = [
  { id: 'total', rotulo: 'Costo total', color: '#1f6fb2' },
  { id: 'extra', rotulo: 'Extraordinario', color: '#b87400' },
]

// El ahorro que el mockup estima sobre el costo extraordinario.
export const FACTOR_AHORRO = 0.27

export const COSTOS_SNACKS = [
  { id: 'GW-1001', materia: 'Maíz amarillo',     aduana: 'Puerto Cortés', naviera: 'Great White Fleet', categoria: 'Demora',       monto: 6420, prioridad: 'Crítico',               mes: 1 },
  { id: 'MS-1002', materia: 'Aceite vegetal',    aduana: 'Puerto Cortés', naviera: 'MSC',               categoria: 'Estadías',     monto: 4850, prioridad: 'Crítico',               mes: 1 },
  { id: 'GW-1003', materia: 'Harina de maíz',    aduana: 'La Mesa',       naviera: 'Great White Fleet', categoria: 'Chasis',       monto: 3240, prioridad: 'Seguimiento Proactivo', mes: 1 },
  { id: 'MA-1004', materia: 'Papa deshidratada', aduana: 'Puerto Cortés', naviera: 'Maersk',            categoria: 'WTD',          monto: 2910, prioridad: 'Seguimiento Proactivo', mes: 1 },
  { id: 'CM-1005', materia: 'Condimentos',       aduana: 'Puerto Cortés', naviera: 'CMA CGM',           categoria: 'Flete Inland', monto: 2480, prioridad: 'Normal',                mes: 1 },
  { id: 'MS-1006', materia: 'Aceite vegetal',    aduana: 'Puerto Cortés', naviera: 'MSC',               categoria: 'Flete Inland', monto: 3650, prioridad: 'Normal',                mes: 2 },
  { id: 'GW-1007', materia: 'Maíz amarillo',     aduana: 'Puerto Cortés', naviera: 'Great White Fleet', categoria: 'Estadías',     monto: 3980, prioridad: 'Seguimiento Proactivo', mes: 2 },
  { id: 'MA-1008', materia: 'Empaque de snacks', aduana: 'La Mesa',       naviera: 'Maersk',            categoria: 'Chasis',       monto: 2180, prioridad: 'Normal',                mes: 2 },
  { id: 'GW-1009', materia: 'Harina de maíz',    aduana: 'Puerto Cortés', naviera: 'Great White Fleet', categoria: 'Demora',       monto: 5120, prioridad: 'Crítico',               mes: 3 },
  { id: 'CM-1010', materia: 'Condimentos',       aduana: 'Toncontín',     naviera: 'CMA CGM',           categoria: 'WTD',          monto: 1870, prioridad: 'Normal',                mes: 3 },
  { id: 'MS-1011', materia: 'Aceite vegetal',    aduana: 'Puerto Cortés', naviera: 'MSC',               categoria: 'Demora',       monto: 4320, prioridad: 'Crítico',               mes: 3 },
  { id: 'MA-1012', materia: 'Papa deshidratada', aduana: 'Puerto Cortés', naviera: 'Maersk',            categoria: 'Flete Inland', monto: 2760, prioridad: 'Normal',                mes: 3 },
  { id: 'GW-1013', materia: 'Maíz amarillo',     aduana: 'Puerto Cortés', naviera: 'Great White Fleet', categoria: 'Flete Inland', monto: 4480, prioridad: 'Normal',                mes: 4 },
  { id: 'MS-1014', materia: 'Aceite vegetal',    aduana: 'La Mesa',       naviera: 'MSC',               categoria: 'Estadías',     monto: 3520, prioridad: 'Seguimiento Proactivo', mes: 4 },
  { id: 'CM-1015', materia: 'Condimentos',       aduana: 'Puerto Cortés', naviera: 'CMA CGM',           categoria: 'Chasis',       monto: 2260, prioridad: 'Normal',                mes: 4 },
  { id: 'MA-1016', materia: 'Harina de maíz',    aduana: 'Puerto Cortés', naviera: 'Maersk',            categoria: 'Demora',       monto: 4760, prioridad: 'Crítico',               mes: 4 },
  { id: 'GW-1017', materia: 'Papa deshidratada', aduana: 'Puerto Cortés', naviera: 'Great White Fleet', categoria: 'Demora',       monto: 5680, prioridad: 'Crítico',               mes: 5 },
  { id: 'MS-1018', materia: 'Aceite vegetal',    aduana: 'Puerto Cortés', naviera: 'MSC',               categoria: 'WTD',          monto: 2640, prioridad: 'Normal',                mes: 5 },
  { id: 'CM-1019', materia: 'Condimentos',       aduana: 'La Mesa',       naviera: 'CMA CGM',           categoria: 'Flete Inland', monto: 1980, prioridad: 'Normal',                mes: 5 },
  { id: 'MA-1020', materia: 'Maíz amarillo',     aduana: 'Puerto Cortés', naviera: 'Maersk',            categoria: 'Estadías',     monto: 3890, prioridad: 'Seguimiento Proactivo', mes: 5 },
  { id: 'GW-1021', materia: 'Maíz amarillo',     aduana: 'Puerto Cortés', naviera: 'Great White Fleet', categoria: 'Demora',       monto: 6420, prioridad: 'Crítico',               mes: 6 },
  { id: 'MS-1022', materia: 'Aceite vegetal',    aduana: 'Puerto Cortés', naviera: 'MSC',               categoria: 'Estadías',     monto: 4850, prioridad: 'Crítico',               mes: 6 },
  { id: 'GW-1023', materia: 'Harina de maíz',    aduana: 'La Mesa',       naviera: 'Great White Fleet', categoria: 'Chasis',       monto: 3240, prioridad: 'Seguimiento Proactivo', mes: 6 },
  { id: 'MA-1024', materia: 'Papa deshidratada', aduana: 'Puerto Cortés', naviera: 'Maersk',            categoria: 'WTD',          monto: 2910, prioridad: 'Seguimiento Proactivo', mes: 6 },
  { id: 'CM-1025', materia: 'Condimentos',       aduana: 'Puerto Cortés', naviera: 'CMA CGM',           categoria: 'Flete Inland', monto: 2480, prioridad: 'Normal',                mes: 6 },
  { id: 'GW-1026', materia: 'Maíz amarillo',     aduana: 'Puerto Cortés', naviera: 'Great White Fleet', categoria: 'Flete Inland', monto: 4380, prioridad: 'Normal',                mes: 6 },
  { id: 'MS-1027', materia: 'Aceite vegetal',    aduana: 'Puerto Cortés', naviera: 'MSC',               categoria: 'Demora',       monto: 4120, prioridad: 'Crítico',               mes: 6 },
  { id: 'MA-1028', materia: 'Harina de maíz',    aduana: 'Toncontín',     naviera: 'Maersk',            categoria: 'Chasis',       monto: 2190, prioridad: 'Normal',                mes: 6 },
]
