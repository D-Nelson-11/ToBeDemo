import { useEffect, useState } from 'react'
import { LuCircleAlert, LuLoaderCircle, LuMailCheck, LuSend, LuTriangleAlert } from 'react-icons/lu'
import Modal from '../components/ui/Modal'
import Button, { cx } from '../components/ui/Button'
import { Field, Input, Textarea } from '../components/ui/Field'
import { useOc } from '../data/store'
import { analizarCorreo, correoDe, plantillaCorreo } from '../data/correos'

const TONO = {
  urgencia: { chip: 'bg-rojo-50 text-rojo-700 border-rojo-100', icono: LuCircleAlert, rotulo: 'Urgencia' },
  problema: { chip: 'bg-rojo-50 text-rojo-700 border-rojo-100', icono: LuTriangleAlert, rotulo: 'Problema reportado' },
  retraso: { chip: 'bg-ambar-50 text-ambar-700 border-ambar-100', icono: LuTriangleAlert, rotulo: 'Retraso' },
}

const fmt = (iso) =>
  new Date(iso).toLocaleString('es-HN', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })

// Las palabras vigiladas son solo letras (no hay que escaparlas) y van sin tildes,
// pero el correo sí las trae: cada vocal se abre a su versión acentuada.
const flexible = (p) =>
  p
    .replace(/a/g, '[aá]')
    .replace(/e/g, '[eé]')
    .replace(/i/g, '[ií]')
    .replace(/o/g, '[oó]')
    .replace(/u/g, '[uúü]')

/** Pinta el cuerpo resaltando las palabras que dispararon la alerta. */
function Cuerpo({ texto, palabras }) {
  if (!palabras.length) return <p className="m-0 whitespace-pre-wrap text-sm text-ink-2">{texto}</p>

  const fuente = palabras.map(flexible).join('|')
  const esMarca = new RegExp('^(?:' + fuente + ')$', 'i')

  return (
    <p className="m-0 whitespace-pre-wrap text-sm text-ink-2">
      {texto.split(new RegExp('(' + fuente + ')', 'gi')).map((parte, i) =>
        esMarca.test(parte) ? (
          <mark key={i} className="rounded-xs bg-ambar-100 px-0.5 font-semibold text-ambar-700">
            {parte}
          </mark>
        ) : (
          parte
        ),
      )}
    </p>
  )
}

function Mensaje({ correo }) {
  const recibido = correo.direccion === 'recibido'
  const { tipo, palabras } = recibido ? analizarCorreo(correo.cuerpo) : { tipo: null, palabras: [] }
  const t = tipo ? TONO[tipo] : null
  const Icono = t?.icono

  return (
    <div
      className={cx(
        'rounded-sm border p-3',
        tipo === 'retraso' && 'border-ambar-100 bg-ambar-50/40',
        (tipo === 'urgencia' || tipo === 'problema') && 'border-rojo-100 bg-rojo-50/40',
        !tipo && (recibido ? 'border-line bg-surface' : 'border-line bg-surface-2'),
      )}
    >
      <div className="mb-1.5 flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className="text-sm font-bold text-ink">{recibido ? correo.de : 'Vos'}</span>
        <span className="text-xs text-ink-3">
          {recibido ? 'recibido' : 'enviado a ' + correo.para}
        </span>
        <span className="num ml-auto text-xs text-ink-3">{fmt(correo.fecha)}</span>
      </div>

      {t && (
        <div
          className={cx(
            'mb-2 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-[3px] text-xs font-semibold',
            t.chip,
          )}
        >
          <Icono size={12} />
          {t.rotulo} · {palabras.join(', ')}
        </div>
      )}

      <div className="mb-1 text-sm font-semibold text-navy-800">{correo.asunto}</div>
      <Cuerpo texto={correo.cuerpo} palabras={palabras} />
    </div>
  )
}

/** Correo al proveedor de una OC: el hilo y el borrador estándar de consulta. */
export default function ModalCorreoProveedor({ oc, onClose }) {
  const { hilos, esperando, enviarCorreo, actualizarOc } = useOc()
  const [b, setB] = useState(null)

  useEffect(() => {
    if (!oc) return setB(null)
    const p = plantillaCorreo(oc)
    setB({ para: oc.correoProveedor ?? p.para, asunto: p.asunto, cuerpo: p.cuerpo })
  }, [oc])

  const hilo = (oc && hilos[oc.id]) || []
  const enEspera = !!oc && esperando.includes(oc.id)

  const enviar = () => {
    // El correo vinculado se guarda en la OC: es el que queda asociado de acá en adelante.
    if (b.para !== oc.correoProveedor) actualizarOc(oc.id, { correoProveedor: b.para })
    enviarCorreo(oc, {
      id: oc.id + '-' + Date.now(),
      direccion: 'enviado',
      de: 'abastecimiento@grupovesta.net',
      para: b.para,
      asunto: b.asunto,
      cuerpo: b.cuerpo,
      fecha: new Date().toISOString(),
    })
  }

  return (
    <Modal
      open={!!oc}
      onClose={onClose}
      size="lg"
      eyebrow={oc ? oc.proveedor + ' · ' + oc.resp : ''}
      title={oc ? 'Correo al proveedor · OC ' + oc.id : ''}
      footer={
        <>
          <span className="min-w-0 flex-1 text-sm text-ink-2">
            {enEspera
              ? 'Enviado. Esperando respuesta del proveedor…'
              : hilo.length
                ? hilo.length + ' correo' + (hilo.length > 1 ? 's' : '') + ' en el hilo de esta OC.'
                : 'Esta OC todavía no tiene correos.'}
          </span>
          <Button variant="quiet" onClick={onClose}>
            Cerrar
          </Button>
          <Button variant="primary" onClick={enviar} disabled={!b?.para || !b?.asunto || enEspera}>
            <LuSend size={14} /> {hilo.length ? 'Enviar de nuevo' : 'Enviar consulta'}
          </Button>
        </>
      }
    >
      {b && oc && (
        <div className="flex flex-col gap-4">
          <Field
            label="Correo vinculado a esta OC"
            hint={'Sugerido a partir del proveedor: ' + correoDe(oc.proveedor)}
          >
            <Input value={b.para} onChange={(e) => setB({ ...b, para: e.target.value })} />
          </Field>

          {hilo.length > 0 && (
            <div className="flex flex-col gap-2">
              <div className="lbl">Hilo de la OC</div>
              {hilo.map((c) => (
                <Mensaje key={c.id} correo={c} />
              ))}
              {enEspera && (
                <div className="flex items-center gap-2 rounded-sm border border-dashed border-line-strong bg-surface-2 px-3 py-2.5 text-sm text-ink-3">
                  <LuLoaderCircle size={14} className="motion-safe:animate-spin" />
                  El proveedor está respondiendo…
                </div>
              )}
            </div>
          )}

          <div className="flex flex-col gap-3 rounded-sm border border-line bg-surface-2 p-3">
            <div className="flex items-center gap-2">
              <LuMailCheck size={15} className="text-navy-700" />
              <span className="lbl">Consulta estándar sugerida</span>
            </div>
            <Field label="Asunto">
              <Input value={b.asunto} onChange={(e) => setB({ ...b, asunto: e.target.value })} />
            </Field>
            <Field label="Mensaje">
              <Textarea
                rows={14}
                value={b.cuerpo}
                onChange={(e) => setB({ ...b, cuerpo: e.target.value })}
              />
            </Field>
          </div>
        </div>
      )}
    </Modal>
  )
}
