import { LuCheck, LuInbox, LuMail, LuShieldCheck } from 'react-icons/lu'
import Modal from '../components/ui/Modal'
import Button, { cx } from '../components/ui/Button'
import { semilla } from '../lib/torre'
import { addDays, fmtFecha } from '../lib/fechas'

// Cuenta de Google Workspace desde la que la Torre de Control despacha los correos.
const CUENTA_TORRE = 'torredecontrol@grupovesta.net'
const AGENCIA_ADUANAL = 'operaciones@agencia-aduanal.hn'

// Última letra del estado de la ruta de origen → país declarado en el trámite.
const PAIS_ORIGEN = {
  CA: 'Estados Unidos (California)',
  TX: 'Estados Unidos (Texas)',
  FL: 'Estados Unidos (Florida)',
}

const DOCUMENTOS = [
  'Factura comercial',
  'Lista de empaque',
  'Conocimiento de embarque (BL) / Carta de porte',
  'Certificado de origen',
  'Certificado fitosanitario del país de origen',
]

// Plantilla de asignación de la Torre de Control. Los *tramos* entre asteriscos
// se pintan en negrita; los {{campos}} se sustituyen con datos del embarque.
const PLANTILLA = `Estimados,

Por medio del presente, la *Torre de Control* asigna un nuevo trámite para su gestión y seguimiento.

*DATOS GENERALES DEL TRÁMITE*

* No. de trámite: {{No_Tramite}}
* Cliente / Importador: {{Cliente}}
* Proveedor: {{Proveedor}}
* Orden de compra / Referencia: {{Orden_Compra}}
* Factura comercial: {{Factura}}
* País de origen: {{Pais_Origen}}
* Aduana / Punto de ingreso: {{Aduana_Ingreso}}
* Régimen aduanero: {{Regimen_Aduanero}}
* Medio de transporte: {{Medio_Transporte}}

*FECHAS DEL EMBARQUE*

* Fecha estimada de embarque (ETD): {{ETD}}
* Fecha estimada de llegada (ETA): {{ETA}}
* Fecha requerida de entrega: {{Fecha_Requerida}}

*INSTRUCCIONES ADUANERAS*

Favor proceder con la gestión del trámite considerando las siguientes instrucciones:

{{Instrucciones_Aduaneras}}

*DOCUMENTACIÓN ADJUNTA*

Se adjunta la documentación disponible para la gestión:

{{Listado_Documentos}}

En caso de identificar documentación pendiente, inconsistencias, restricciones arancelarias/no arancelarias o cualquier condición que pueda impactar el despacho, agradeceremos notificarlo a la *Torre de Control* a la brevedad para gestionar las acciones correspondientes.

*INSTRUCCIONES / CONSIDERACIONES ESPECIALES*

{{Observaciones_Especiales}}

Favor confirmar:

1. Recepción y revisión de la documentación.
2. Aceptación del trámite.
3. Documentación o información adicional requerida, si aplica.
4. Cualquier riesgo identificado que pueda afectar el despacho o la fecha objetivo.

La Torre de Control dará seguimiento al trámite hasta completar la gestión aduanera y coordinación de entrega correspondiente.

Saludos,

*Supply Optimization Control Tower*
{{Nombre_Ejecutivo_Torre}}
{{Correo_Torre}} | {{Telefono_Torre}}`

/** Rellena la plantilla de asignación de trámite con los datos del embarque. */
function correoTramite(e) {
  const s = semilla(e.clave + 'tramite')
  const terrestre = /El Poy/i.test(e.ruta.frontera)
  const estado = (e.ruta.origen.match(/,\s*([A-Z]{2})\s*$/) ?? [])[1]

  const enviado = addDays(e.etd, -4)
  enviado.setHours(8 + (s % 8), s % 60, 0, 0)

  const v = {
    No_Tramite: e.id,
    Cliente: e.oc.organizacion,
    Proveedor: e.oc.proveedor,
    Orden_Compra: e.oc.id,
    Factura: `FC-${100000 + (s % 899999)}`,
    Pais_Origen: PAIS_ORIGEN[estado] ?? 'Estados Unidos',
    Aduana_Ingreso: `${e.ruta.frontera} · Aduana de destino`,
    Regimen_Aduanero: 'Importación definitiva (4000)',
    Medio_Transporte: terrestre ? 'Terrestre (FTL)' : 'Marítimo (FCL)',
    ETD: fmtFecha(e.etd),
    ETA: fmtFecha(e.frontera),
    Fecha_Requerida: fmtFecha(e.planta),
    Instrucciones_Aduaneras:
      e.oc.instrucciones?.trim() ||
      'Sin instrucciones aduaneras adicionales. Aplicar el procedimiento estándar de importación definitiva.',
    Listado_Documentos: DOCUMENTOS.map((d) => `- ${d}`).join('\n'),
    Observaciones_Especiales:
      e.oc.nota?.trim() || 'Sin consideraciones especiales para este trámite.',
    Nombre_Ejecutivo_Torre: e.oc.resp,
    Correo_Torre: CUENTA_TORRE,
    Telefono_Torre: '+504 2540-0000',
  }

  const cuerpo = PLANTILLA.replace(/\{\{(\w+)\}\}/g, (_, k) => v[k] ?? `{{${k}}}`)

  return {
    de: CUENTA_TORRE,
    deNombre: 'Supply Optimization Control Tower',
    para: AGENCIA_ADUANAL,
    asunto: `Asignación de trámite ${e.id} · ${e.oc.proveedor}`,
    enviado,
    cuerpo,
  }
}

const fmtEnviado = (d) =>
  d.toLocaleString('es-HN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

/** El cuerpo con los *tramos* marcados en negrita, tal como los trae la plantilla. */
function Cuerpo({ texto }) {
  return (
    <p className="m-0 whitespace-pre-wrap text-sm leading-relaxed text-ink-2">
      {texto.split(/(\*[^*\n]+\*)/g).map((parte, i) =>
        parte.length > 2 && parte.startsWith('*') && parte.endsWith('*') ? (
          <strong key={i} className="font-bold text-ink">
            {parte.slice(1, -1)}
          </strong>
        ) : (
          parte
        ),
      )}
    </p>
  )
}

function Fila({ rotulo, valor }) {
  return (
    <div className="flex gap-2 text-sm">
      <span className="w-14 shrink-0 text-ink-3">{rotulo}</span>
      <span className="min-w-0 flex-1 text-ink-2">{valor}</span>
    </div>
  )
}

/** Cola de correo de un embarque: el correo de asignación que la Torre ya envió
 *  a la agencia aduanal, mostrado como en la bandeja de Enviados de Gmail. */
export default function ModalColaCorreo({ embarque, onClose }) {
  const correo = embarque ? correoTramite(embarque) : null

  return (
    <Modal
      open={!!embarque}
      onClose={onClose}
      size="md"
      eyebrow={embarque ? `${embarque.oc.proveedor} · trámite asignado a la agencia aduanal` : ''}
      title={embarque ? `Cola de correo · Embarque ${embarque.id}` : ''}
      footer={
        <>
          <span className="min-w-0 flex-1 text-sm text-ink-2">
            1 correo en la cola de este trámite · entregado a la agencia aduanal.
          </span>
          <Button variant="quiet" onClick={onClose}>
            Cerrar
          </Button>
        </>
      }
    >
      {correo && (
        <div className="flex flex-col gap-4">
          {/* Barra de conexión: simula la sesión de Gmail de la Torre */}
          <div className="flex flex-wrap items-center gap-2 rounded-sm border border-line bg-surface-2 px-3 py-2.5">
            <span className="flex h-6 w-6 items-center justify-center rounded-sm bg-rojo-600 text-white">
              <LuMail size={14} />
            </span>
            <span className="text-sm font-bold text-ink">Gmail</span>
            <span className="ml-auto flex items-center gap-1.5 rounded-full bg-teal-50 px-2.5 py-[3px] text-xs font-semibold text-teal-700">
              <span className="h-1.5 w-1.5 rounded-full bg-teal-600" />
              Conectado como {correo.de}
            </span>
          </div>

          {/* Carpeta y estado */}
          <div className="flex flex-wrap items-center gap-2 text-sm text-ink-3">
            <span className="inline-flex items-center gap-1.5 font-medium text-ink-2">
              <LuInbox size={13} /> Enviados
            </span>
            <span className="text-ink-4">·</span>
            <span className="num">{fmtEnviado(correo.enviado)}</span>
            <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-teal-50 px-2 py-[2px] text-xs font-semibold text-teal-700">
              <LuCheck size={12} strokeWidth={3} /> Enviado
            </span>
          </div>

          {/* Correo */}
          <div className="rounded-sm border border-line bg-surface p-4">
            <div className="mb-3 text-base font-bold text-navy-800">{correo.asunto}</div>
            <div className="mb-3 flex flex-col gap-1 border-b border-line pb-3">
              <Fila rotulo="De" valor={`${correo.deNombre} <${correo.de}>`} />
              <Fila rotulo="Para" valor={correo.para} />
            </div>
            <Cuerpo texto={correo.cuerpo} />
          </div>

          <div className="flex items-start gap-2 rounded-sm border border-line bg-surface-2 px-3 py-2.5 text-sm text-ink-3">
            <LuShieldCheck size={15} className="mt-px shrink-0 text-navy-700" />
            Este correo viaja adjunto al embarque desde el segmento Origin y queda en la bitácora del
            trámite para toda la Torre de Control.
          </div>
        </div>
      )}
    </Modal>
  )
}
