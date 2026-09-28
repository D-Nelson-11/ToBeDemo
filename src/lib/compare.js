import { addDays, hoy } from './fechas'
import { elige, semilla } from './torre'

// Simulación: nada sale del navegador. La comparación factura vs BL corre al
// cargar la factura en el paso 4 (Shipping Instruction); acá solo se lee.

export const EJEMPLO = {
  a: 'Factura_INV-2026-0418.pdf',
  b: 'BL_MAEU-238817450.pdf',
}

const OBSERVACIONES = [
  { tono: 'rojo', campo: 'Peso bruto', a: '18.450 kg', b: '18.920 kg', texto: 'Diferencia de 470 kg (2,5 %), supera la tolerancia del 1 %.' },
  { tono: 'rojo', campo: 'Consignatario', a: 'Distribuidora Vesta S.A.', b: 'Distribuidora Vesta SA de CV', texto: 'La razón social no coincide; puede trabar la liberación en aduana.' },
  { tono: 'alerta', campo: 'Cantidad de bultos', a: '1.200 cajas', b: '1.180 cartons', texto: 'Faltan 20 bultos en el BL. Confirmar con el proveedor si hubo carga parcial.' },
  { tono: 'alerta', campo: 'Puerto de carga', a: 'Callao', b: 'Paita', texto: 'El puerto de embarque cambió respecto de lo facturado.' },
  { tono: 'alerta', campo: 'Descripción de la mercancía', a: 'Papas fritas sabor original 45 g', b: 'Snacks', texto: 'El BL usa una descripción genérica; aduana puede pedir el detalle.' },
  { tono: 'ok', campo: 'Contenedor', a: 'MSKU 482193-7', b: 'MSKU 482193-7', texto: 'Coincide.' },
  { tono: 'ok', campo: 'Orden de compra', a: 'OC-45120087', b: 'OC-45120087', texto: 'Coincide.' },
  { tono: 'ok', campo: 'Shipper', a: 'Snacks Andinos S.A.C.', b: 'Snacks Andinos S.A.C.', texto: 'Coincide.' },
]

// Semáforo del resultado: muchas diferencias rojo, pocas amarillo, ninguna verde.
export const NIVELES_COMPARE = {
  rojo: { rotulo: 'Muchas diferencias', texto: 'Revisar antes de liberar: la factura y el BL no cuadran.' },
  alerta: { rotulo: 'Pocas diferencias', texto: 'Hay diferencias menores que conviene confirmar con el proveedor.' },
  ok: { rotulo: 'Sin diferencias', texto: 'La factura y el BL coinciden en todos los campos revisados.' },
}

const nivelDe = (diferencias) => (diferencias === 0 ? 'ok' : diferencias <= 2 ? 'alerta' : 'rojo')

// Cuántas diferencias trae cada escenario; la semilla reparte los tres niveles entre los embarques.
const ESCENARIOS = [5, 4, 2, 1, 0]

/** Lo que ya dejó el escaneo del paso 4 para este embarque. Sin embarque, el ejemplo completo. */
export function compararEmbarque(e) {
  if (!e) {
    return { archivos: EJEMPLO, observaciones: OBSERVACIONES, diferencias: 5, nivel: 'rojo', escaneado: new Date() }
  }

  const s = semilla(e.clave + 'compare')
  // >> 3: el módulo directo de la semilla dejaba todos los embarques en el mismo escenario.
  const cuantas = elige(ESCENARIOS, s >> 3)
  const ref = `${e.oc.id}-${e.despacho.id}`
  const terrestre = /El Poy/i.test(e.ruta.frontera)

  // Las menores entran primero: con pocas diferencias no debería aparecer una crítica.
  const activas = new Set(
    OBSERVACIONES.filter((o) => o.tono !== 'ok')
      .sort((a, b) => (a.tono === 'alerta' ? -1 : 0) - (b.tono === 'alerta' ? -1 : 0))
      .slice(0, cuantas)
      .map((o) => o.campo),
  )

  // Las que no tocan quedan como coincidencias: el valor del BL pasa a ser el de la factura.
  const observaciones = OBSERVACIONES.map((o) => {
    const base =
      o.campo === 'Orden de compra'
        ? { ...o, a: e.oc.id, b: e.oc.id }
        : o.campo === 'Puerto de carga'
          ? { ...o, a: e.ruta.origen }
          : o
    if (base.tono === 'ok' || activas.has(base.campo)) return base
    return { ...base, tono: 'ok', b: base.a, texto: 'Coincide.' }
  })

  // Dos días antes del zarpe, pero nunca en el futuro: si el zarpe está lejos, se escaneó ayer.
  const escaneado = addDays(e.etd, -2) > hoy() ? addDays(hoy(), -1) : addDays(e.etd, -2)
  escaneado.setHours(8 + (s % 9), s % 60)

  return {
    archivos: { a: `Factura_${ref}.pdf`, b: `${terrestre ? 'CartaPorte' : 'BL'}_${ref}.pdf` },
    observaciones,
    diferencias: cuantas,
    nivel: nivelDe(cuantas),
    escaneado,
  }
}
