import { useState } from 'react'
import {
  LuCircleCheck,
  LuInfo,
  LuLoaderCircle,
  LuPlay,
  LuScanText,
  LuTriangleAlert,
  LuWarehouse,
} from 'react-icons/lu'
import Modal from '../components/ui/Modal'
import Button, { cx } from '../components/ui/Button'
import { Field, Input, Select } from '../components/ui/Field'
import { useOc } from '../data/store'
import { CENTROS_WH as CENTROS } from '../data/warehouse'
import { addDays, diasEntre, fmtFechaCorta, fmtMoneda, fmtNum, toISO } from '../lib/fechas'


// Campos mínimos de la factura comercial que revisa el OCR (RECAUCA Art. 323).
const CHECK_RECAUCA = [
  ['Vendedor / domicilio', true],
  ['Comprador / domicilio', true],
  ['Lugar / fecha de expedición', true],
  ['Descripción detallada', true],
  ['Cantidad', true],
  ['Valor unitario / total', true],
  ['Términos pactados', true],
  ['Validar idioma / códigos si aplica', false],
]

function Dato({ rotulo, children }) {
  return (
    <div className="min-w-0 rounded-sm border border-line bg-surface-2 px-3 py-2">
      <span className="block text-xs text-ink-3">{rotulo}</span>
      <b className="block truncate text-sm font-bold text-ink">{children}</b>
    </div>
  )
}

function Aviso({ children }) {
  return (
    <div className="flex items-start gap-2.5 rounded-sm border border-line bg-surface-2 px-3 py-2.5 text-sm text-ink-2">
      <LuInfo size={15} className="mt-px shrink-0 text-navy-600" />
      <span className="min-w-0">{children}</span>
    </div>
  )
}

/** Enviar los despachos marcados al punto de consolidación (Warehouse), con factura por OCR e inicio de despacho. */
export default function ModalConsolidacion({ filas, onClose, onEnviar }) {
  const { avisar } = useOc()
  // null = sin cargar, 'leyendo' = OCR en curso, 'capturada' = campos a revisar, 'aceptada' = lista.
  const [factura, setFactura] = useState(null)
  const [salida, setSalida] = useState(() => toISO(filas[0]?.etd ?? new Date()))
  const [enTransito, setEnTransito] = useState(false)
  const [centro, setCentro] = useState(CENTROS[0])
  const [etaWh, setEtaWh] = useState(() => toISO(addDays(filas[0]?.etd ?? new Date(), 3)))

  const unidad = filas[0]?.material?.unidad ?? ''
  const cantidad = filas.reduce((a, f) => a + (f.despacho.cantidad || 0), 0)
  const valor = filas.reduce((a, f) => a + (f.despacho.cantidad || 0) * (f.material?.precio || 0), 0)
  const unir = (fn) => filas.map(fn).join(' · ')

  const cargarFactura = () => {
    setFactura('leyendo')
    setTimeout(() => {
      setFactura('capturada')
      avisar('Factura capturada por OCR. Revisá los campos y el cumplimiento RECAUCA Art. 323.', 'ok')
    }, 700)
  }

  const enviar = () => {
    onEnviar({ centro, eta: etaWh, salida: enTransito ? salida : '' })
    avisar(
      `${filas.length} despacho${filas.length === 1 ? '' : 's'} enviado${filas.length === 1 ? '' : 's'} a ${centro}.`,
      'ok',
    )
    onClose()
  }

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      eyebrow={`${filas.length} despacho${filas.length === 1 ? '' : 's'} seleccionado${filas.length === 1 ? '' : 's'}`}
      title="Enviar a punto de consolidación"
      footer={
        <>
          <span className="min-w-0 flex-1 text-sm text-ink-2">
            Destino: <b className="font-bold text-ink">{centro}</b> · ETA{' '}
            <b className="num font-bold text-ink">{fmtFechaCorta(etaWh)}</b>
          </span>
          <Button variant="quiet" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={enviar}>
            <LuWarehouse size={14} /> Enviar a consolidación
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Aviso>
          <b className="text-ink">Instrucción de consolidación:</b> los despachos seleccionados se envían al
          Warehouse / punto de consolidación. <b className="text-ink">El envío directo no aplica.</b>
        </Aviso>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <Dato rotulo="Despachos seleccionados">{filas.length}</Dato>
          <Dato rotulo="Cantidad total">
            {fmtNum(cantidad)} {unidad}
          </Dato>
          <Dato rotulo="Valor estimado">{valor ? fmtMoneda(valor) : '—'}</Dato>
        </div>

        {/* ------------------------- detalle de embarques ------------------------- */}
        <div>
          <div className="lbl mb-2">Detalle de los embarques</div>
          <div className="flex flex-col gap-3">
            {filas.map((f) => (
              <div key={f.clave} className="panel">
                <div className="panel-head flex-wrap">
                  <span className="panel-title">
                    {f.oc.id} · {f.material?.nombre}
                  </span>
                  <span className="text-sm text-ink-3">
                    Despacho {f.despacho.id} · Incoterm {f.oc.incoterm}
                  </span>
                  <span className="ml-auto rounded-full bg-navy-50 px-2.5 py-[3px] text-xs font-semibold text-navy-700">
                    Seleccionado
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 p-3 md:grid-cols-4">
                  <Dato rotulo="Cantidad enviada">
                    {fmtNum(f.despacho.cantidad)} {f.material?.unidad}
                  </Dato>
                  <Dato rotulo="Precio de producto">{f.material?.precio ? fmtMoneda(f.material.precio) : '—'}</Dato>
                  <Dato rotulo="ETD origen">{f.etd ? fmtFechaCorta(f.etd) : '—'}</Dato>
                  <Dato rotulo="ETA destino">{f.planta ? fmtFechaCorta(f.planta) : '—'}</Dato>
                  <Dato rotulo="Tiempo en tránsito">
                    {f.etd && f.planta ? `${diasEntre(f.etd, f.planta)} días` : '—'}
                  </Dato>
                  <Dato rotulo="Factura">{factura === 'aceptada' ? 'Revisada' : 'Por cargar'}</Dato>
                  <Dato rotulo="Próxima tarea">{f.tarea}</Dato>
                  <Dato rotulo="Cumplimiento">
                    Aduana {(f.despacho.aduana ?? []).filter(Boolean).length}/{(f.despacho.aduana ?? []).length} ·
                    Logística {(f.despacho.logistica ?? []).filter(Boolean).length}/
                    {(f.despacho.logistica ?? []).length}
                  </Dato>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ------------------------------ factura OCR ----------------------------- */}
        <div className="panel">
          <div className="panel-head">
            <span className="panel-title">Factura comercial · OCR</span>
            <span
              className={cx(
                'rounded-full px-2.5 py-[3px] text-xs font-semibold',
                factura === 'aceptada' || factura === 'capturada'
                  ? 'bg-teal-50 text-teal-700'
                  : 'bg-surface-3 text-ink-3',
              )}
            >
              {factura === 'aceptada'
                ? 'Factura revisada'
                : factura === 'capturada'
                  ? 'Información capturada'
                  : factura === 'leyendo'
                    ? 'OCR procesando…'
                    : 'Lista para captura'}
            </span>
            <Button size="sm" className="ml-auto" onClick={cargarFactura} disabled={factura === 'leyendo'}>
              {factura === 'leyendo' ? (
                <LuLoaderCircle size={13} className="motion-safe:animate-spin" />
              ) : (
                <LuScanText size={13} />
              )}
              Cargar factura · OCR
            </Button>
          </div>

          <div className="flex flex-col gap-3 p-4">
            {!factura && (
              <p className="m-0 text-sm text-ink-3">
                Carga la factura: el OCR extrae los datos comerciales y los presenta para revisión antes de
                continuar con el proceso aduanero.
              </p>
            )}

            {(factura === 'capturada' || factura === 'aceptada') && (
              <>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <Field label="No. factura">
                    <Input defaultValue={unir((f) => `FAC-${f.oc.id.slice(-5)}-${f.despacho.id}`)} />
                  </Field>
                  <Field label="Vendedor / domicilio">
                    <Input defaultValue={`${filas[0].oc.proveedor} · ${filas[0].ruta?.origen ?? ''}`} />
                  </Field>
                  <Field label="Comprador / domicilio">
                    <Input defaultValue={`${filas[0].oc.organizacion ?? 'Importador Honduras'} · ${filas[0].oc.centro}`} />
                  </Field>
                  <Field label="Lugar y fecha de expedición">
                    <Input defaultValue={unir((f) => (f.etd ? fmtFechaCorta(f.etd) : '—'))} />
                  </Field>
                  <Field label="Descripción detallada">
                    <Input defaultValue={unir((f) => f.material?.nombre ?? '—')} />
                  </Field>
                  <Field label="Cantidad">
                    <Input defaultValue={unir((f) => `${fmtNum(f.despacho.cantidad)} ${f.material?.unidad ?? ''}`)} />
                  </Field>
                  <Field label="Valor unitario">
                    <Input defaultValue={unir((f) => (f.material?.precio ? fmtMoneda(f.material.precio) : '—'))} />
                  </Field>
                  <Field label="Valor total">
                    <Input defaultValue={valor ? fmtMoneda(valor) : '—'} />
                  </Field>
                  <Field label="Términos / Incoterm">
                    <Input defaultValue={unir((f) => f.oc.incoterm)} />
                  </Field>
                </div>

                <Aviso>
                  <b className="text-ink">Control de cumplimiento · RECAUCA Art. 323:</b> revisión asistida de los
                  campos mínimos de la factura comercial. Validar traducción si viene en otro idioma y
                  descodificación cuando use información en códigos.
                </Aviso>

                <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 lg:grid-cols-4">
                  {CHECK_RECAUCA.map(([rotulo, ok]) => (
                    <span
                      key={rotulo}
                      className={cx(
                        'flex items-center gap-1.5 rounded-sm border px-2.5 py-1.5 text-xs font-semibold',
                        ok ? 'border-teal-100 bg-teal-50 text-teal-700' : 'border-ambar-100 bg-ambar-50 text-ambar-700',
                      )}
                    >
                      {ok ? <LuCircleCheck size={12} /> : <LuTriangleAlert size={12} />}
                      {rotulo}
                    </span>
                  ))}
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    size="sm"
                    onClick={() => avisar('Revisión de factura y control RECAUCA Art. 323 disponibles.', 'ok')}
                  >
                    Revisar factura
                  </Button>
                  <Button
                    size="sm"
                    variant="primary"
                    disabled={factura === 'aceptada'}
                    onClick={() => {
                      setFactura('aceptada')
                      avisar('Factura aceptada para continuar con la instrucción.', 'ok')
                    }}
                  >
                    <LuCircleCheck size={13} /> Aceptar factura para despacho
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* ---------------------------- iniciar despacho --------------------------- */}
        <div className="panel flex flex-wrap items-end gap-4 p-4">
          <div className="min-w-[220px] flex-1">
            <b className="block text-sm font-bold text-ink">Iniciar despacho</b>
            <span className="text-sm text-ink-3">
              Registra la fecha real de salida de origen y mueve los envíos a <b>En tránsito</b> hacia el
              Warehouse.
            </span>
          </div>
          <Field label="Fecha de salida de origen" className="w-[180px]">
            <Input date type="date" value={salida} onChange={(e) => setSalida(e.target.value)} />
          </Field>
          <Field label="Estado" className="w-[150px]">
            <span
              className={cx(
                'inline-flex h-8 items-center rounded-full px-2.5 text-xs font-semibold',
                enTransito ? 'bg-navy-50 text-navy-700' : 'bg-surface-3 text-ink-3',
              )}
            >
              {enTransito ? 'En tránsito' : 'Pendiente de iniciar'}
            </span>
          </Field>
          <Button
            disabled={enTransito || !salida}
            onClick={() => {
              setEnTransito(true)
              avisar(`Despacho iniciado · salida ${fmtFechaCorta(salida)}. Envíos en tránsito al Warehouse.`, 'ok')
            }}
          >
            <LuPlay size={13} /> Iniciar despacho
          </Button>
        </div>

        {/* ---------------------------- destino logístico -------------------------- */}
        <div className="panel">
          <div className="panel-head">
            <span className="panel-title">Destino logístico</span>
          </div>
          <div className="flex flex-col gap-4 p-4">
            <div className="flex items-start gap-3 rounded-sm border border-navy-600 bg-navy-50 px-4 py-3">
              <LuWarehouse size={18} className="mt-px shrink-0 text-navy-700" />
              <span>
                <b className="block text-base font-bold text-navy-800">Enviar a punto de consolidación</b>
                <span className="text-sm text-ink-3">
                  Toda la mercancía seleccionada va al Warehouse. No se habilita envío directo.
                </span>
              </span>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="Centro de consolidación">
                <Select options={CENTROS} value={centro} onChange={(e) => setCentro(e.target.value)} />
              </Field>
              <Field label="ETA Warehouse">
                <Input date type="date" value={etaWh} onChange={(e) => setEtaWh(e.target.value)} />
              </Field>
            </div>
            <Aviso>
              <b className="text-ink">Estados automáticos:</b> Proveedor indica listo → Enviado por proveedor →
              Pendiente de recibir → Recibido → Disponible para consolidar.
            </Aviso>
          </div>
        </div>
      </div>
    </Modal>
  )
}
