import Modal from './ui/Modal'
import Button from './ui/Button'
import BitacoraAduana from './BitacoraAduana'
import DetalleTransito from './DetalleTransito'
import { estatusAduana } from '../lib/torre'

/**
 * El detalle de un embarque, el mismo que abre la torre del especialista:
 * en tránsito muestra la proyección y la línea de tiempo; en aduana, la
 * bitácora del trámite. `tipo` decide cuál de los dos cuerpos se monta.
 */
export default function ModalEmbarque({ embarque: e, tipo, onClose }) {
  const aduana = tipo === 'aduana'
  return (
    <Modal
      open={!!e}
      onClose={onClose}
      size="lg"
      eyebrow={
        e ? (aduana ? `Bitácora proceso aduanero · ${e.ruta.frontera}` : `Detalle del embarque · ${e.buque}`) : ''
      }
      title={e ? `Embarque ${e.id}` : ''}
      footer={
        <>
          <span className="min-w-0 flex-1 text-sm text-ink-2">
            {e
              ? aduana
                ? `${estatusAduana(e)} · ${e.oc.proveedor} · ${e.oc.centro}`
                : e.delay > 0
                  ? `Acumula +${e.delay} días contra la fecha planificada.`
                  : 'Sin desviación contra la fecha planificada.'
              : ''}
          </span>
          <Button variant="quiet" onClick={onClose}>
            Cerrar
          </Button>
        </>
      }
    >
      {e && aduana && <BitacoraAduana embarque={e} />}
      {e && !aduana && <DetalleTransito embarque={e} />}
    </Modal>
  )
}
