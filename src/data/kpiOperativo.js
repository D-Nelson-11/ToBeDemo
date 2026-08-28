// Control Tower — desempeño operativo. Base de 50 embarques simulados: es el
// dataset del mockup, con la modalidad ya resuelta por aduana (en el HTML se
// calculaba pero no se guardaba, y la segmentación por modalidad salía vacía).

export const PROVEEDORES_OP = ['McCain', 'JBS', 'Dole', 'Sealed Air', 'SKF', 'Lamb Weston', 'Tyson', 'Smurfit Kappa', 'Bühler', 'Cargill Foods']

export const NAVIERAS_OP = ['Great White Fleet', 'Maersk', 'MSC', 'CMA CGM', 'Hapag-Lloyd']

export const ORIGENES_OP = ['Francia', 'Brasil', 'Costa Rica', 'Estados Unidos', 'Alemania', 'Países Bajos', 'Colombia', 'Suiza', 'Canadá', 'México']

export const ADUANAS_OP = ['Puerto Cortés', 'La Mesa', 'Toncontín', 'El Amatillo', 'Las Manos', 'El Poy', 'Agua Caliente', 'El Florido', 'Corinto', 'Guasaule', 'La Fraternidad', 'Mesoamérica', 'Henecán', 'Amapala']

export const PRODUCTOS_OP = ['MP', 'CARNES', 'FRUTAS', 'EMPAQUE', 'REPUESTOS']

export const SELECTIVOS = ['Verde', 'Amarillo', 'Rojo']

// Días de SLA de nacionalización que le corresponden a cada selectivo.
export const SLA_SELECTIVO = { Verde: 2, Amarillo: 4, Rojo: 6 }

// Un embarque cumple si sale/llega dentro de este margen sobre lo comprometido.
export const TOLERANCIA_DIAS = 1

// SLA único con el que se comparan las aduanas entre sí.
export const SLA_ADUANA = 4

export const COLOR_SELECTIVO = { Verde: '#2b8f5e', Amarillo: '#b87400', Rojo: '#c0453f' }

export const MODALIDADES_OP = ['Marítimo', 'Aéreo', 'Terrestre']

// etd/atd y eta/ata son días del mes: el mockup compara plan contra real, no fechas.
export const EMBARQUES_OP = [
  { id: "SHP-001", proveedor: "McCain", naviera: "Great White Fleet", origen: "Francia", aduana: "Puerto Cortés", producto: "MP", selectivo: "Verde", modalidad: "Marítimo", etd: 10, atd: 12, eta: 18, ata: 20, dias: 4 },
  { id: "SHP-002", proveedor: "JBS", naviera: "Hapag-Lloyd", origen: "Canadá", aduana: "La Mesa", producto: "EMPAQUE", selectivo: "Verde", modalidad: "Terrestre", etd: 11, atd: 14, eta: 21, ata: 22, dias: 2 },
  { id: "SHP-003", proveedor: "Dole", naviera: "Maersk", origen: "Colombia", aduana: "Toncontín", producto: "CARNES", selectivo: "Verde", modalidad: "Aéreo", etd: 12, atd: 13, eta: 24, ata: 25, dias: 2 },
  { id: "SHP-004", proveedor: "Sealed Air", naviera: "Great White Fleet", origen: "Alemania", aduana: "El Amatillo", producto: "CARNES", selectivo: "Verde", modalidad: "Terrestre", etd: 13, atd: 14, eta: 27, ata: 28, dias: 2 },
  { id: "SHP-005", proveedor: "SKF", naviera: "MSC", origen: "Costa Rica", aduana: "Las Manos", producto: "REPUESTOS", selectivo: "Rojo", modalidad: "Terrestre", etd: 14, atd: 14, eta: 30, ata: 30, dias: 5 },
  { id: "SHP-006", proveedor: "Lamb Weston", naviera: "Maersk", origen: "Francia", aduana: "El Poy", producto: "FRUTAS", selectivo: "Rojo", modalidad: "Terrestre", etd: 15, atd: 16, eta: 33, ata: 34, dias: 7 },
  { id: "SHP-007", proveedor: "Tyson", naviera: "CMA CGM", origen: "Canadá", aduana: "Agua Caliente", producto: "FRUTAS", selectivo: "Rojo", modalidad: "Terrestre", etd: 16, atd: 17, eta: 36, ata: 38, dias: 6 },
  { id: "SHP-008", proveedor: "Smurfit Kappa", naviera: "MSC", origen: "Colombia", aduana: "El Florido", producto: "MP", selectivo: "Rojo", modalidad: "Terrestre", etd: 17, atd: 18, eta: 39, ata: 40, dias: 6 },
  { id: "SHP-009", proveedor: "Bühler", naviera: "Hapag-Lloyd", origen: "Alemania", aduana: "Corinto", producto: "EMPAQUE", selectivo: "Amarillo", modalidad: "Marítimo", etd: 18, atd: 22, eta: 42, ata: 42, dias: 3 },
  { id: "SHP-010", proveedor: "Cargill Foods", naviera: "CMA CGM", origen: "Costa Rica", aduana: "Guasaule", producto: "EMPAQUE", selectivo: "Amarillo", modalidad: "Terrestre", etd: 19, atd: 20, eta: 20, ata: 21, dias: 6 },
  { id: "SHP-011", proveedor: "McCain", naviera: "Great White Fleet", origen: "Francia", aduana: "La Fraternidad", producto: "CARNES", selectivo: "Amarillo", modalidad: "Terrestre", etd: 20, atd: 21, eta: 23, ata: 24, dias: 5 },
  { id: "SHP-012", proveedor: "JBS", naviera: "Hapag-Lloyd", origen: "Canadá", aduana: "Mesoamérica", producto: "REPUESTOS", selectivo: "Amarillo", modalidad: "Terrestre", etd: 21, atd: 22, eta: 26, ata: 30, dias: 4 },
  { id: "SHP-013", proveedor: "Dole", naviera: "Maersk", origen: "Colombia", aduana: "Henecán", producto: "REPUESTOS", selectivo: "Verde", modalidad: "Marítimo", etd: 22, atd: 22, eta: 29, ata: 31, dias: 1 },
  { id: "SHP-014", proveedor: "Sealed Air", naviera: "Great White Fleet", origen: "Alemania", aduana: "Amapala", producto: "FRUTAS", selectivo: "Verde", modalidad: "Marítimo", etd: 23, atd: 26, eta: 32, ata: 33, dias: 2 },
  { id: "SHP-015", proveedor: "SKF", naviera: "MSC", origen: "Costa Rica", aduana: "Puerto Cortés", producto: "MP", selectivo: "Verde", modalidad: "Marítimo", etd: 24, atd: 25, eta: 35, ata: 36, dias: 2 },
  { id: "SHP-016", proveedor: "Lamb Weston", naviera: "Maersk", origen: "Francia", aduana: "La Mesa", producto: "MP", selectivo: "Verde", modalidad: "Terrestre", etd: 25, atd: 27, eta: 38, ata: 39, dias: 3 },
  { id: "SHP-017", proveedor: "Tyson", naviera: "CMA CGM", origen: "Canadá", aduana: "Toncontín", producto: "EMPAQUE", selectivo: "Rojo", modalidad: "Aéreo", etd: 26, atd: 26, eta: 41, ata: 41, dias: 5 },
  { id: "SHP-018", proveedor: "Smurfit Kappa", naviera: "MSC", origen: "Colombia", aduana: "El Amatillo", producto: "CARNES", selectivo: "Rojo", modalidad: "Terrestre", etd: 27, atd: 28, eta: 19, ata: 20, dias: 6 },
  { id: "SHP-019", proveedor: "Bühler", naviera: "Hapag-Lloyd", origen: "Alemania", aduana: "Las Manos", producto: "CARNES", selectivo: "Rojo", modalidad: "Terrestre", etd: 28, atd: 29, eta: 22, ata: 24, dias: 8 },
  { id: "SHP-020", proveedor: "Cargill Foods", naviera: "CMA CGM", origen: "Costa Rica", aduana: "El Poy", producto: "REPUESTOS", selectivo: "Rojo", modalidad: "Terrestre", etd: 29, atd: 30, eta: 25, ata: 26, dias: 6 },
  { id: "SHP-021", proveedor: "McCain", naviera: "Great White Fleet", origen: "Francia", aduana: "Agua Caliente", producto: "FRUTAS", selectivo: "Amarillo", modalidad: "Terrestre", etd: 10, atd: 10, eta: 28, ata: 28, dias: 5 },
  { id: "SHP-022", proveedor: "JBS", naviera: "Hapag-Lloyd", origen: "Canadá", aduana: "El Florido", producto: "FRUTAS", selectivo: "Amarillo", modalidad: "Terrestre", etd: 11, atd: 12, eta: 31, ata: 32, dias: 4 },
  { id: "SHP-023", proveedor: "Dole", naviera: "Maersk", origen: "Colombia", aduana: "Corinto", producto: "MP", selectivo: "Amarillo", modalidad: "Marítimo", etd: 12, atd: 15, eta: 34, ata: 37, dias: 4 },
  { id: "SHP-024", proveedor: "Sealed Air", naviera: "Great White Fleet", origen: "Alemania", aduana: "Guasaule", producto: "EMPAQUE", selectivo: "Amarillo", modalidad: "Terrestre", etd: 13, atd: 14, eta: 37, ata: 38, dias: 4 },
  { id: "SHP-025", proveedor: "SKF", naviera: "MSC", origen: "Costa Rica", aduana: "La Fraternidad", producto: "EMPAQUE", selectivo: "Verde", modalidad: "Terrestre", etd: 14, atd: 14, eta: 40, ata: 42, dias: 1 },
  { id: "SHP-026", proveedor: "Lamb Weston", naviera: "Maersk", origen: "Francia", aduana: "Mesoamérica", producto: "CARNES", selectivo: "Verde", modalidad: "Terrestre", etd: 15, atd: 16, eta: 18, ata: 19, dias: 3 },
  { id: "SHP-027", proveedor: "Tyson", naviera: "CMA CGM", origen: "Canadá", aduana: "Henecán", producto: "REPUESTOS", selectivo: "Verde", modalidad: "Marítimo", etd: 16, atd: 20, eta: 21, ata: 22, dias: 2 },
  { id: "SHP-028", proveedor: "Smurfit Kappa", naviera: "MSC", origen: "Colombia", aduana: "Amapala", producto: "REPUESTOS", selectivo: "Verde", modalidad: "Marítimo", etd: 17, atd: 18, eta: 24, ata: 25, dias: 4 },
  { id: "SHP-029", proveedor: "Bühler", naviera: "Hapag-Lloyd", origen: "Alemania", aduana: "Puerto Cortés", producto: "FRUTAS", selectivo: "Rojo", modalidad: "Marítimo", etd: 18, atd: 18, eta: 27, ata: 27, dias: 5 },
  { id: "SHP-030", proveedor: "Cargill Foods", naviera: "CMA CGM", origen: "Costa Rica", aduana: "La Mesa", producto: "MP", selectivo: "Rojo", modalidad: "Terrestre", etd: 19, atd: 23, eta: 30, ata: 31, dias: 6 },
  { id: "SHP-031", proveedor: "McCain", naviera: "Great White Fleet", origen: "Francia", aduana: "Toncontín", producto: "MP", selectivo: "Rojo", modalidad: "Aéreo", etd: 20, atd: 21, eta: 33, ata: 35, dias: 7 },
  { id: "SHP-032", proveedor: "JBS", naviera: "Hapag-Lloyd", origen: "Canadá", aduana: "El Amatillo", producto: "EMPAQUE", selectivo: "Rojo", modalidad: "Terrestre", etd: 21, atd: 22, eta: 36, ata: 37, dias: 6 },
  { id: "SHP-033", proveedor: "Dole", naviera: "Maersk", origen: "Colombia", aduana: "Las Manos", producto: "CARNES", selectivo: "Amarillo", modalidad: "Terrestre", etd: 22, atd: 22, eta: 39, ata: 39, dias: 3 },
  { id: "SHP-034", proveedor: "Sealed Air", naviera: "Great White Fleet", origen: "Alemania", aduana: "El Poy", producto: "CARNES", selectivo: "Amarillo", modalidad: "Terrestre", etd: 23, atd: 24, eta: 42, ata: 44, dias: 4 },
  { id: "SHP-035", proveedor: "SKF", naviera: "MSC", origen: "Costa Rica", aduana: "Agua Caliente", producto: "REPUESTOS", selectivo: "Amarillo", modalidad: "Terrestre", etd: 24, atd: 25, eta: 20, ata: 21, dias: 4 },
  { id: "SHP-036", proveedor: "Lamb Weston", naviera: "Maersk", origen: "Francia", aduana: "El Florido", producto: "FRUTAS", selectivo: "Amarillo", modalidad: "Terrestre", etd: 25, atd: 26, eta: 23, ata: 24, dias: 5 },
  { id: "SHP-037", proveedor: "Tyson", naviera: "CMA CGM", origen: "Canadá", aduana: "Corinto", producto: "FRUTAS", selectivo: "Verde", modalidad: "Marítimo", etd: 26, atd: 28, eta: 26, ata: 28, dias: 4 },
  { id: "SHP-038", proveedor: "Smurfit Kappa", naviera: "MSC", origen: "Colombia", aduana: "Guasaule", producto: "MP", selectivo: "Verde", modalidad: "Terrestre", etd: 27, atd: 28, eta: 29, ata: 30, dias: 2 },
  { id: "SHP-039", proveedor: "Bühler", naviera: "Hapag-Lloyd", origen: "Alemania", aduana: "La Fraternidad", producto: "EMPAQUE", selectivo: "Verde", modalidad: "Terrestre", etd: 28, atd: 29, eta: 32, ata: 33, dias: 2 },
  { id: "SHP-040", proveedor: "Cargill Foods", naviera: "CMA CGM", origen: "Costa Rica", aduana: "Mesoamérica", producto: "EMPAQUE", selectivo: "Verde", modalidad: "Terrestre", etd: 29, atd: 31, eta: 35, ata: 36, dias: 2 },
  { id: "SHP-041", proveedor: "McCain", naviera: "Great White Fleet", origen: "Francia", aduana: "Henecán", producto: "CARNES", selectivo: "Rojo", modalidad: "Marítimo", etd: 10, atd: 10, eta: 38, ata: 38, dias: 7 },
  { id: "SHP-042", proveedor: "JBS", naviera: "Hapag-Lloyd", origen: "Canadá", aduana: "Amapala", producto: "REPUESTOS", selectivo: "Rojo", modalidad: "Marítimo", etd: 11, atd: 12, eta: 41, ata: 42, dias: 6 },
  { id: "SHP-043", proveedor: "Dole", naviera: "Maersk", origen: "Colombia", aduana: "Puerto Cortés", producto: "REPUESTOS", selectivo: "Rojo", modalidad: "Marítimo", etd: 12, atd: 13, eta: 19, ata: 21, dias: 6 },
  { id: "SHP-044", proveedor: "Sealed Air", naviera: "Great White Fleet", origen: "Alemania", aduana: "La Mesa", producto: "FRUTAS", selectivo: "Rojo", modalidad: "Terrestre", etd: 13, atd: 16, eta: 22, ata: 23, dias: 6 },
  { id: "SHP-045", proveedor: "SKF", naviera: "MSC", origen: "Costa Rica", aduana: "Toncontín", producto: "MP", selectivo: "Amarillo", modalidad: "Aéreo", etd: 14, atd: 14, eta: 25, ata: 29, dias: 3 },
  { id: "SHP-046", proveedor: "Lamb Weston", naviera: "Maersk", origen: "Francia", aduana: "El Amatillo", producto: "MP", selectivo: "Amarillo", modalidad: "Terrestre", etd: 15, atd: 16, eta: 28, ata: 29, dias: 6 },
  { id: "SHP-047", proveedor: "Tyson", naviera: "CMA CGM", origen: "Canadá", aduana: "Las Manos", producto: "EMPAQUE", selectivo: "Amarillo", modalidad: "Terrestre", etd: 16, atd: 17, eta: 31, ata: 32, dias: 4 },
  { id: "SHP-048", proveedor: "Smurfit Kappa", naviera: "MSC", origen: "Colombia", aduana: "El Poy", producto: "CARNES", selectivo: "Amarillo", modalidad: "Terrestre", etd: 17, atd: 18, eta: 34, ata: 35, dias: 4 },
  { id: "SHP-049", proveedor: "Bühler", naviera: "Hapag-Lloyd", origen: "Alemania", aduana: "Agua Caliente", producto: "CARNES", selectivo: "Verde", modalidad: "Terrestre", etd: 18, atd: 18, eta: 37, ata: 39, dias: 1 },
  { id: "SHP-050", proveedor: "Cargill Foods", naviera: "CMA CGM", origen: "Costa Rica", aduana: "El Florido", producto: "REPUESTOS", selectivo: "Verde", modalidad: "Terrestre", etd: 19, atd: 20, eta: 40, ata: 41, dias: 2 },]
