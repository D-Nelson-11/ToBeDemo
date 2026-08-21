// Catálogos maestros del demo (proveedores, incoterms, rutas, etc.)

export const PROVEEDORES = [
  'ALLIED POTATO, INC',
  'MUNDO DE FRUTAS',
  'CARLOS LOPEZ URCUYO',
  'FRUTAS TROPICALES DEL SUR, S.A.',
  'CORPORACION DINANT AGRICOLAS',
  'MUSÁCEAS DE OCCIDENTE, S.A',
  'DE LA GRANJA SOCIEDAD ANONIMA',
  'AGROINDUSTRIAS DEL VALLE',
]

export const INCOTERMS = ['FOB', 'CIF', 'DAP', 'EXW', 'FCA', 'CFR']

export const COND_PAGO = [
  'Contado',
  'Crédito 15 días',
  'Crédito 30 días',
  'Crédito 45 días',
  'Crédito 60 días',
  'Anticipo 50%',
]

export const UNIDADES = ['KG', 'LB', 'CAJA', 'UN', 'TON', 'SACO']

export const MONEDAS = ['USD', 'HNL', 'EUR']

export const CATEGORIAS_PORTAL = [
  'Materia Prima',
  'Producto Terminado',
  'Empaque',
  'Repuestos',
  'Servicios',
]

export const CATEGORIAS_SKU = [
  'Papa y tubérculos',
  'Frutas frescas',
  'Aceites',
  'Granos',
  'Empaque primario',
  'Empaque secundario',
]

export const TIPOS_EMBALAJE = ['Caja de cartón', 'Saco', 'Granel', 'Tarima', 'Bin plástico']

export const RESPONSABLES = [
  'Karen Varela',
  'Kevin Joel Mejía Fajardo',
  'Guillermo M. Quan Solórzano',
  'Dafne Amaya',
]

export const ORGANIZACIONES = ['CORPORACION DINANT S.A', 'JETSTEREO SA DE CV']

export const CENTROS = ['CD DINANT SNACK', 'CD JETSTEREO AMARATECA', 'PLANTA AMARATECA']

// ---------------------------------------------------------------------------
// Maestro de rutas: cada ruta es Salida Proveedor → ETA Frontera → Planta.
// leg1 = días proveedor→frontera/puerto, leg2 = días frontera→planta.
// ---------------------------------------------------------------------------
export const RUTAS = {
  hueneme: {
    id: 'hueneme',
    nombre: 'ALLIED POTATO CA / PTO. HUENEME / PTO. ACAJUTLA / EL POY / DINANT SNACK',
    origen: 'Hueneme, CA',
    frontera: 'Pto. Acajutla',
    leg1: 2,
    leg2: 12,
  },
  longbeach: {
    id: 'longbeach',
    nombre: 'ALLIED POTATO CA / PTO. LONG BEACH / PTO. CORTÉS / DINANT SNACK',
    origen: 'Long Beach, CA',
    frontera: 'Pto. Cortés',
    leg1: 3,
    leg2: 9,
  },
  losangeles: {
    id: 'losangeles',
    nombre: 'ALLIED POTATO CA / PTO. LOS ANGELES / PTO. CORTÉS / DINANT SNACK',
    origen: 'Los Angeles, CA',
    frontera: 'Pto. Cortés',
    leg1: 4,
    leg2: 10,
  },
  oakland: {
    id: 'oakland',
    nombre: 'ALLIED POTATO CA / PTO. OAKLAND / PTO. CORTÉS / DINANT SNACK',
    origen: 'Oakland, CA',
    frontera: 'Pto. Cortés',
    leg1: 3,
    leg2: 11,
  },
  houston: {
    id: 'houston',
    nombre: 'ALLIED POTATO CA / PTO. HOUSTON / PTO. CORTÉS / DINANT SNACK',
    origen: 'Houston, TX',
    frontera: 'Pto. Cortés',
    leg1: 5,
    leg2: 7,
  },
  miami: {
    id: 'miami',
    nombre: 'ALLIED POTATO CA / PTO. MIAMI / PTO. CORTÉS / DINANT SNACK',
    origen: 'Miami, FL',
    frontera: 'Pto. Cortés',
    leg1: 2,
    leg2: 8,
  },
  laredo: {
    id: 'laredo',
    nombre: 'ALLIED POTATO CA / TERRESTRE LAREDO / EL POY / DINANT SNACK',
    origen: 'Laredo, TX',
    frontera: 'El Poy',
    leg1: 4,
    leg2: 6,
  },
  sanantonio: {
    id: 'sanantonio',
    nombre: 'ALLIED POTATO CA / TERRESTRE SAN ANTONIO / EL POY / DINANT SNACK',
    origen: 'San Antonio, TX',
    frontera: 'El Poy',
    leg1: 5,
    leg2: 6,
  },
}

export const RUTAS_LISTA = Object.values(RUTAS)

// ---------------------------------------------------------------------------
// Checklists de seguimiento. El despacho no avanza hasta que ambos cierran.
// ---------------------------------------------------------------------------
export const CHECK_ADUANA = [
  'Factura comercial recibida',
  'Declaración de mercancías (DUCA/póliza)',
  'Certificado de origen',
  'Permiso fitosanitario',
]

export const CHECK_LOGISTICA = [
  'Booking confirmado con naviera',
  'Contenedor asignado',
  'BL confirmado',
  'Transporte interno coordinado',
]

// ---------------------------------------------------------------------------
// Reprogramación: por qué se movió la fecha. La categoría es la etiqueta corta
// que se reporta; la causa es el detalle que escribe quien hace el cambio.
// ---------------------------------------------------------------------------
export const CATEGORIAS_IMPACTO = [
  'Atraso en producción',
  'Falta de contenedor',
  'Atraso de la naviera',
  'Retención en aduana',
  'Clima / fuerza mayor',
  'Documentación incompleta',
  'Cambio solicitado por planta',
  'Cambio de ruta',
  'Otro',
]
