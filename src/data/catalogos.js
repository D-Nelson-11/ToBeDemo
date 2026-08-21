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

// ---------------------------------------------------------------------------
// Requerimientos de aduana sugeridos. Se arman en tres capas: los que aplican a
// toda importación, los que dependen de la categoría del SKU y los que dependen
// del origen y del modo de transporte de la ruta.
// ---------------------------------------------------------------------------
const REQ_BASE = [
  ['Declaración Única Centroamericana (DUCA)', 'Documento aduanero obligatorio para toda importación.', true],
  ['Factura comercial', 'Es la base para la valoración en aduana.', true],
  ['Documento de transporte (BL / AWB)', 'Acredita el contrato de transporte y la titularidad de la carga.', true],
  ['Packing list', 'Detalle de bultos, pesos y contenido por contenedor.', false],
]

const REQ_CATEGORIA = {
  'Papa y tubérculos': [
    ['Permiso fitosanitario de importación (SENASA)', 'Debe emitirse antes del embarque, no al arribo.', true],
    ['Certificado fitosanitario del país de origen', 'Emitido por la autoridad sanitaria del exportador.', true],
    ['Declaración de tratamiento antibrote', 'Aplica a papa destinada a proceso industrial.', false],
    ['Registro de importador de vegetales vigente', 'Se valida contra el RTN del importador.', false],
  ],
  'Frutas frescas': [
    ['Permiso fitosanitario de importación (SENASA)', 'Producto vegetal fresco: requiere permiso previo.', true],
    ['Certificado fitosanitario del país de origen', 'Debe coincidir con el lote declarado en factura.', true],
    ['Registro de cadena de frío (termógrafo)', 'La inspección puede rechazar la carga sin evidencia de temperatura.', true],
    ['Inspección en punto de ingreso', 'Coordinar con el inspector antes del arribo para no pagar demoras.', false],
  ],
  Aceites: [
    ['Registro sanitario del producto (ARSA)', 'Sin registro vigente la mercancía no se nacionaliza.', true],
    ['Certificado de libre venta del país de origen', 'Acredita comercialización legal en origen.', true],
    ['Análisis de laboratorio del lote', 'Parámetros de acidez, humedad e impurezas.', false],
    ['Ficha técnica y hoja de seguridad', 'Requerida para clasificación arancelaria.', false],
  ],
  Granos: [
    ['Permiso fitosanitario de importación (SENASA)', 'Obligatorio para grano a granel.', true],
    ['Certificado de fumigación', 'Con producto, dosis y fecha de aplicación.', true],
    ['Análisis de micotoxinas', 'Aflatoxinas para maíz destinado a consumo o proceso.', true],
  ],
  'Empaque primario': [
    ['Ficha técnica de material en contacto con alimentos', 'Debe declarar grado alimenticio.', true],
    ['Declaración de conformidad FDA / UE', 'Respalda la inocuidad del material.', true],
    ['Certificado de inocuidad del proveedor', 'Vigente al momento del embarque.', false],
  ],
  'Empaque secundario': [
    ['Certificado de tratamiento NIMF-15', 'Obligatorio si viaja sobre tarima de madera.', true],
    ['Ficha técnica del corrugado', 'Gramaje y resistencia declarados.', false],
  ],
}

/**
 * Requerimientos sugeridos para un SKU en una ruta dada.
 * @returns [{ requisito, motivo, critico, fuente }]
 */
export function requisitosAduana(material, ruta) {
  const arma = (lista, fuente) =>
    lista.map(([requisito, motivo, critico]) => ({ requisito, motivo, critico, fuente }))

  const porCategoria = REQ_CATEGORIA[material?.categoria] ?? []
  const origen = ruta?.origen ?? ''
  const esEeuu = /,\s*(CA|TX|FL)$/.test(origen)
  const esTerrestre = /El Poy/i.test(ruta?.frontera ?? '')

  const porRuta = []
  if (esEeuu)
    porRuta.push([
      'Certificado de origen CAFTA-DR',
      `Mercancía de ${origen}: habilita la preferencia arancelaria.`,
      false,
    ])
  if (esTerrestre)
    porRuta.push([
      'Declaración de tránsito terrestre',
      `Cruce por ${ruta.frontera}: requiere el tránsito abierto antes de llegar.`,
      true,
    ])

  return [
    ...arma(REQ_BASE, 'Toda importación'),
    ...arma(porCategoria, material?.categoria ?? 'Categoría del SKU'),
    ...arma(porRuta, 'Ruta y origen'),
  ]
}
