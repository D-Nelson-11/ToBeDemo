import {
  NIVELES,
  SEGMENTOS,
  construirAlertas,
  construirCostos,
  construirDocumentos,
  construirEmbarques,
  estatusAduana,
} from './torre'
import { fmtFecha } from './fechas'

export const SUGERENCIAS = [
  '¿Dónde va mi embarque?',
  'Estado de FYDUCA',
  'Documentos pendientes',
  'Alertas de hoy',
]

export const BIENVENIDA = {
  texto:
    'Hola, soy el asistente de Supply Hub. Preguntame por embarques, alertas, documentos, costos o aduana y te respondo con lo que hay en la torre.',
}

const plural = (n, uno, varios) => `${n} ${n === 1 ? uno : varios}`

// Sin quitar tildes, "aduána" o "embarqué" no caerían en ninguna regla.
const normalizar = (txt) =>
  txt
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')

function resumenEmbarques({ embarques }) {
  if (!embarques.length) return { texto: 'No tienes embarques programados por ahora.' }
  const items = SEGMENTOS.slice(1)
    .map((seg) => ({ seg, n: embarques.filter((e) => e.segmento === seg).length }))
    .filter((x) => x.n)
    .map((x) => ({ titulo: x.seg, detalle: plural(x.n, 'embarque', 'embarques') }))
  return {
    texto: `Hay ${plural(embarques.length, 'embarque activo', 'embarques activos')}. Así se reparten por segmento:`,
    items,
    pie: 'El detalle de cada uno está en Control Tower.',
  }
}

function alertas({ alertas }) {
  if (!alertas.length) return { texto: 'No tienes alertas abiertas: todo viaja dentro de tiempo.' }
  const items = alertas.slice(0, 4).map((a) => ({
    titulo: `OC ${a.embarque.id}`,
    detalle: `${NIVELES[a.nivel].rotulo} · +${a.embarque.delay} d`,
    tono: NIVELES[a.nivel].tono,
  }))
  return {
    texto: `Hay ${plural(alertas.length, 'alerta abierta', 'alertas abiertas')}. Las más atrasadas:`,
    items,
  }
}

function documentos({ documentos }) {
  const pend = documentos.filter((d) => d.estado !== 'Recolectado')
  if (!pend.length) return { texto: 'No tienes documentos de transporte pendientes.' }
  const liberados = pend.filter((d) => d.estado === 'Liberado')
  const items = (liberados.length ? liberados : pend).slice(0, 4).map((d) => ({
    titulo: d.numero,
    detalle: `${d.estado} · ${d.emisor}`,
    tono: d.relevancia === 'Alta' ? 'ambar' : 'teal',
  }))
  return {
    texto: liberados.length
      ? `${plural(liberados.length, 'documento liberado espera', 'documentos liberados esperan')} recolecta (BL o carta de porte):`
      : `${plural(pend.length, 'documento sigue', 'documentos siguen')} sin liberar; la naviera los libera después del zarpe.`,
    items,
  }
}

function costos({ costos }) {
  if (!costos.length) return { texto: 'No tienes costos abiertos por demora, estadía o almacenaje.' }
  const total = costos.reduce((s, c) => s + c.total, 0)
  return {
    texto: `Hay ${plural(costos.length, 'costo abierto', 'costos abiertos')} por USD ${total.toLocaleString('es-HN')}. Los mayores:`,
    items: [...costos]
      .sort((a, b) => b.total - a.total)
      .slice(0, 3)
      .map((c) => ({
        titulo: `OC ${c.embarque.id}`,
        detalle: `${c.tipo} · USD ${c.total.toLocaleString('es-HN')}`,
        tono: 'ambar',
      })),
  }
}

function aduana({ embarques }) {
  const en = embarques.filter((e) => e.segmento === 'Customs Clearance')
  if (!en.length) return { texto: 'No tienes embarques en aduana en este momento.' }
  return {
    texto: `${plural(en.length, 'embarque está', 'embarques están')} en trámite de aduana:`,
    items: en.slice(0, 4).map((e) => ({
      titulo: `OC ${e.id}`,
      detalle: `${e.ruta.frontera} · ${estatusAduana(e)}`,
    })),
  }
}

function proximo({ embarques }) {
  const enCamino = embarques
    .filter((e) => e.segmento !== 'At Plant')
    .sort((a, b) => a.planta - b.planta)
  if (!enCamino.length) return resumenEmbarques({ embarques })
  const e = enCamino[0]
  return {
    texto: `El próximo en llegar es la OC ${e.id} de ${e.oc.proveedor}. Va en ${e.segmento} (${e.ubicacion}) y se espera en ${e.sitio} el ${fmtFecha(e.planta)}.`,
    pie: 'Si querés otro, decime el número de OC.',
  }
}

function porOc(num, { embarques }) {
  const lista = embarques.filter((e) => e.oc.id === num)
  if (!lista.length) return { texto: `No encontré embarques para la OC ${num}. Revisá el número.` }
  return {
    texto: `La OC ${num} tiene ${plural(lista.length, 'embarque', 'embarques')}:`,
    items: lista.map((e) => ({
      titulo: e.id,
      detalle: `${e.segmento} · ETA ${fmtFecha(e.planta)}`,
      tono: e.delay > 2 ? 'rojo' : e.delay > 0 ? 'ambar' : 'teal',
    })),
  }
}

const FYDUCA = {
  texto:
    'La FYDUCA se gestiona desde el tipo de operación del despacho. Si el producto es agrícola primero se registra y paga el MSF; después se emite la FYDUCA y se habilita el pago de impuestos.',
  pie: 'Lo encontrás en Shipping Instruction, dentro de cada despacho.',
}

const MSF = {
  texto:
    'El MSF aplica a productos agrícolas bajo FYDUCA. La notificación llega por correo, se registra con su número de solicitud y se vuelve el primer pago antes de emitir la FYDUCA.',
}

const AYUDA = {
  texto:
    'No te entendí del todo. Probá con alguna de estas: embarques, alertas, documentos o BL, costos, aduana, FYDUCA o MSF. También podés escribir un número de OC.',
}

/** Se arma al momento de responder: así la respuesta ve lo último que cambió en el store. */
export function datosTorre(ordenes, recolectas) {
  const embarques = construirEmbarques(ordenes)
  return {
    embarques,
    alertas: construirAlertas(embarques),
    costos: construirCostos(embarques),
    documentos: construirDocumentos(embarques, recolectas),
  }
}

// El orden importa: "documentos de aduana" tiene que caer en documentos.
const REGLAS = [
  [/fyduca/, () => FYDUCA],
  [/\bmsf\b/, () => MSF],
  [/document|\bbl\b|carta de porte|recolect/, documentos],
  [/alerta|atras|riesgo|desvi/, alertas],
  [/costo|demora|estadia|almacenaje|cobro/, costos],
  [/aduana|liquid|selectivo|frontera/, aduana],
  [/donde|llega|proxim|eta\b/, proximo],
  [/embarque|segmento|transito|torre/, resumenEmbarques],
]

/** Respuesta mock: primero un número de OC, después palabras clave, si no la ayuda. */
export function responder(pregunta, datos) {
  const txt = normalizar(pregunta)
  const oc = txt.match(/\b\d{6,8}\b/)
  if (oc) return porOc(oc[0], datos)
  const regla = REGLAS.find(([re]) => re.test(txt))
  return regla ? regla[1](datos) : AYUDA
}
