// Planning de importaciones: ETA por SKU y planta.
// Los datos son los del mockup del cliente (plantas reales del grupo); no se
// derivan del store porque son de otro dominio: inventario y cobertura por SKU,
// no órdenes de compra.

export const PLANTAS = [
  'Grasas y aceite',
  'Dixie',
  'Alimentos',
  'Dinant Exports',
  'Abumar',
  'Planta de cloro',
]

export const SITUACIONES = ['En tránsito', 'En inventario', 'En producción']

// cobertura = meses de inventario que alcanzan al ritmo de consumo actual.
export const IMPORTACIONES = [
  { sku: 'ACE-001', planta: 'Grasas y aceite', eta: '2026-08-20', situacion: 'En tránsito',   uom: 'KG', inventario: 4500,  cobertura: 0.8, transito: 12000, comprador: 'Stephanie Hernandez', causa: 'Retraso de proveedor',   proveedor: 'Proveedor A' },
  { sku: 'ACE-014', planta: 'Grasas y aceite', eta: '2026-08-24', situacion: 'En tránsito',   uom: 'KG', inventario: 7200,  cobertura: 1.4, transito: 8500,  comprador: 'Karen Barahona',      causa: 'Roleo de embarque',      proveedor: 'Proveedor B' },
  { sku: 'MAT-225', planta: 'Grasas y aceite', eta: '2026-08-28', situacion: 'En producción', uom: 'KG', inventario: 12800, cobertura: 2.1, transito: 0,     comprador: 'Mario',               causa: '',                       proveedor: 'Proveedor C' },
  { sku: 'DIX-110', planta: 'Dixie',           eta: '2026-08-22', situacion: 'En tránsito',   uom: 'UN', inventario: 900,   cobertura: 0.6, transito: 4500,  comprador: 'Doris',               causa: 'Pérdida de salida ETD',  proveedor: 'Proveedor D' },
  { sku: 'DIX-208', planta: 'Dixie',           eta: '2026-08-25', situacion: 'En inventario', uom: 'UN', inventario: 7800,  cobertura: 1.8, transito: 0,     comprador: 'Stephanie Hernandez', causa: '',                       proveedor: 'Proveedor E' },
  { sku: 'DIX-311', planta: 'Dixie',           eta: '2026-08-30', situacion: 'En producción', uom: 'UN', inventario: 3600,  cobertura: 0.9, transito: 0,     comprador: 'Karen Barahona',      causa: '',                       proveedor: 'Proveedor F' },
  { sku: 'ALI-045', planta: 'Alimentos',       eta: '2026-08-23', situacion: 'En tránsito',   uom: 'KG', inventario: 2500,  cobertura: 0.5, transito: 9800,  comprador: 'Mario',               causa: 'Atraso en aduana',       proveedor: 'Proveedor A' },
  { sku: 'ALI-088', planta: 'Alimentos',       eta: '2026-08-26', situacion: 'En producción', uom: 'KG', inventario: 11000, cobertura: 2.0, transito: 0,     comprador: 'Doris',               causa: '',                       proveedor: 'Proveedor B' },
  { sku: 'ALI-102', planta: 'Alimentos',       eta: '2026-09-02', situacion: 'En inventario', uom: 'KG', inventario: 4100,  cobertura: 1.2, transito: 0,     comprador: 'Stephanie Hernandez', causa: '',                       proveedor: 'Proveedor C' },
  { sku: 'DEX-501', planta: 'Dinant Exports',  eta: '2026-08-19', situacion: 'En tránsito',   uom: 'KG', inventario: 1800,  cobertura: 0.4, transito: 15000, comprador: 'Karen Barahona',      causa: 'Atraso de transporte',   proveedor: 'Proveedor D' },
  { sku: 'DEX-610', planta: 'Dinant Exports',  eta: '2026-08-27', situacion: 'En producción', uom: 'KG', inventario: 15000, cobertura: 2.7, transito: 0,     comprador: 'Mario',               causa: '',                       proveedor: 'Proveedor E' },
  { sku: 'DEX-722', planta: 'Dinant Exports',  eta: '2026-08-31', situacion: 'En inventario', uom: 'KG', inventario: 5600,  cobertura: 1.5, transito: 0,     comprador: 'Doris',               causa: '',                       proveedor: 'Proveedor F' },
  { sku: 'ABU-021', planta: 'Abumar',          eta: '2026-08-21', situacion: 'En tránsito',   uom: 'UN', inventario: 500,   cobertura: 0.7, transito: 3200,  comprador: 'Stephanie Hernandez', causa: 'Retraso de proveedor',   proveedor: 'Proveedor A' },
  { sku: 'ABU-044', planta: 'Abumar',          eta: '2026-08-26', situacion: 'En inventario', uom: 'UN', inventario: 2800,  cobertura: 1.3, transito: 0,     comprador: 'Karen Barahona',      causa: '',                       proveedor: 'Proveedor B' },
  { sku: 'ABU-077', planta: 'Abumar',          eta: '2026-09-01', situacion: 'En producción', uom: 'UN', inventario: 6400,  cobertura: 2.2, transito: 0,     comprador: 'Mario',               causa: '',                       proveedor: 'Proveedor C' },
  { sku: 'CL-010',  planta: 'Planta de cloro', eta: '2026-08-24', situacion: 'En tránsito',   uom: 'KG', inventario: 2100,  cobertura: 0.7, transito: 7200,  comprador: 'Doris',               causa: 'Atraso en entrega',      proveedor: 'Proveedor D' },
  { sku: 'CL-024',  planta: 'Planta de cloro', eta: '2026-08-29', situacion: 'En producción', uom: 'KG', inventario: 9200,  cobertura: 1.9, transito: 0,     comprador: 'Stephanie Hernandez', causa: '',                       proveedor: 'Proveedor E' },
  { sku: 'CL-031',  planta: 'Planta de cloro', eta: '2026-09-03', situacion: 'En inventario', uom: 'KG', inventario: 2400,  cobertura: 1.1, transito: 0,     comprador: 'Karen Barahona',      causa: '',                       proveedor: 'Proveedor F' },
]

// Filtros rápidos de la barra de comandos. `prueba` decide qué fila sobrevive.
export const COMANDOS = [
  { id: 'todos', rotulo: 'Todos', prueba: () => true },
  { id: 'criticos', rotulo: 'Solo críticos', prueba: (r) => r.estado === 'critico' },
  { id: 'transito', rotulo: 'Con tránsito', prueba: (r) => r.transito > 0 },
  { id: 'inventario', rotulo: 'Con inventario', prueba: (r) => r.inventario > 0 },
  { id: 'produccion', rotulo: 'En producción', prueba: (r) => r.situacion === 'En producción' },
  { id: 'cobertura', rotulo: 'Cobertura < 1 mes', prueba: (r) => r.cobertura < 1 },
]
