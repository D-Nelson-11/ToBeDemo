import { Fragment, useState } from 'react'
import { LuBellRing, LuCheck, LuEye, LuRefreshCw, LuTruck, LuX } from 'react-icons/lu'
import Modal from '../components/ui/Modal'
import Button, { cx } from '../components/ui/Button'
import { Field, Select } from '../components/ui/Field'
import { useOc } from '../data/store'
import { TIPOS_CARGA, rotuloCarga } from '../data/cotizaciones'
import { diasEntre, fmtFechaCorta, fmtNum, hoy, parseISO, toISO } from '../lib/fechas'

const CHIP = {
  'En proceso de cotización': 'bg-ambar-50 text-ambar-700',
  Cotizado: 'bg-teal-50 text-teal-700',
  'Transporte asignado': 'bg-navy-50 text-navy-700',
}

// A partir de estos días sin respuesta, la solicitud pide recordatorio.
const DIAS_RECORDATORIO = 3

const espera = (c) => diasEntre(parseISO(c.fecha), hoy())
const pideRecordatorio = (c) =>
  c.estado === 'En proceso de cotización' && (espera(c) >= DIAS_RECORDATORIO || c.recordatorios > 0)

function Resumen({ rotulo, valor }) {
  return (
    <div className="rounded-sm border border-line bg-surface px-3 py-2.5">
      <span className="lbl block">{rotulo}</span>
      <b className="num mt-1 block text-xl font-bold text-navy-800">{valor}</b>
    </div>
  )
}

function Dato({ rotulo, children }) {
  return (
    <div className="min-w-0 rounded-sm border border-line bg-surface px-3 py-2">
      <span className="block text-xs text-ink-3">{rotulo}</span>
      <b className="block text-sm font-bold text-ink [overflow-wrap:anywhere]">{children}</b>
    </div>
  )
}

/** Detalle de una solicitud, con el cambio de modalidad: va desplegado bajo su fila. */
function Detalle({ c, f, onGuardar }) {
  const [modo, setModo] = useState(c.modo)
  const [carga, setCarga] = useState(c.carga)
  const cambio = modo !== c.modo || carga !== c.carga

  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_280px]">
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        <Dato rotulo="Producto">{f?.material?.nombre ?? '—'}</Dato>
        <Dato rotulo="SKU">{f?.material?.codigo ?? '—'}</Dato>
        <Dato rotulo="Cantidad">{f ? `${fmtNum(f.despacho.cantidad)} ${f.material?.unidad ?? ''}` : '—'}</Dato>
        <Dato rotulo="Origen → aduana">{f ? `${f.ruta?.origen} → ${f.ruta?.frontera}` : '—'}</Dato>
        <Dato rotulo="Proveedor">{f?.oc.proveedor ?? '—'}</Dato>
        <Dato rotulo="Contrato">{c.contrato ?? '—'}</Dato>
        <Dato rotulo="Recordatorios">{c.recordatorios}</Dato>
        <Dato rotulo="Último recordatorio">{c.ultRecordatorio ? fmtFechaCorta(c.ultRecordatorio) : '—'}</Dato>
      </div>

      <div className="flex flex-col gap-2 rounded-sm border border-line bg-surface p-3">
        <Field label="Modalidad">
          <Select
            options={Object.keys(TIPOS_CARGA)}
            value={modo}
            onChange={(e) => {
              setModo(e.target.value)
              setCarga(TIPOS_CARGA[e.target.value][0])
            }}
          />
        </Field>
        <Field label="Tipo de servicio">
          <Select
            options={TIPOS_CARGA[modo].map((t) => ({ value: t, label: rotuloCarga(t) }))}
            value={carga}
            onChange={(e) => setCarga(e.target.value)}
          />
        </Field>
        <Button variant="primary" size="sm" disabled={!cambio} onClick={() => onGuardar(modo, carga)}>
          Guardar modalidad y recotizar
        </Button>
      </div>
    </div>
  )
}

/** Seguimiento de las solicitudes de cotización: estados, recordatorios, recotización y asignación. */
export default function ModalCotizaciones({ filas, onClose }) {
  const { cotizaciones, actualizarCotizacion, avisar } = useOc()
  const [abierta, setAbierta] = useState(null)

  const porClave = Object.fromEntries(filas.map((f) => [f.clave, f]))
  const contar = (estado) => cotizaciones.filter((c) => c.estado === estado).length

  // Recotizar, rechazar y cambiar modalidad reinician la espera: el forwarder vuelve a cotizar.
  const reiniciar = (c, nota, extra) => {
    actualizarCotizacion(c.id, { estado: 'En proceso de cotización', fecha: toISO(hoy()), recordatorios: 0, nota, ...extra })
  }

  const recordar = (c) => {
    actualizarCotizacion(c.id, {
      recordatorios: c.recordatorios + 1,
      ultRecordatorio: toISO(hoy()),
      nota: `Recordatorio enviado el ${fmtFechaCorta(hoy())}`,
    })
    avisar(`Recordatorio enviado a ${c.ff} por ${c.id}.`, 'ok')
  }

  const asignar = (c) => {
    actualizarCotizacion(c.id, { estado: 'Transporte asignado', nota: `Transporte asignado a ${c.ff}` })
    avisar(`${c.id}: transporte asignado a ${c.ff}.`, 'ok')
  }

  return (
    <Modal
      open
      onClose={onClose}
      size="xl"
      eyebrow={`${cotizaciones.length} solicitud${cotizaciones.length === 1 ? '' : 'es'}`}
      title="Solicitudes de cotización de transporte"
    >
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          <Resumen rotulo="En proceso de cotización" valor={contar('En proceso de cotización')} />
          <Resumen rotulo="Cotizado" valor={contar('Cotizado')} />
          <Resumen rotulo="Transporte asignado" valor={contar('Transporte asignado')} />
          <Resumen rotulo="Requieren recordatorio" valor={cotizaciones.filter(pideRecordatorio).length} />
        </div>

        <div className="panel">
          <div className="tabla-scroll">
            <table className="tbl">
              <thead>
                <tr>
                  <th className="w-[150px]">OC / Despacho</th>
                  <th className="min-w-[160px]">Freight forwarder</th>
                  <th className="w-[130px]">Modalidad</th>
                  <th className="w-[92px]">Solicitud</th>
                  <th className="w-[110px]">Espera</th>
                  <th className="w-[170px]">Estado</th>
                  <th className="min-w-[200px]">Último comentario</th>
                  <th className="w-[1%]">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {cotizaciones.length === 0 && (
                  <tr>
                    <td colSpan={8} className="h-[120px]! text-center text-ink-3">
                      Todavía no hay solicitudes de cotización.
                    </td>
                  </tr>
                )}
                {cotizaciones.map((c) => {
                  const f = porClave[c.clave]
                  const dias = espera(c)
                  const ver = abierta === c.id
                  return (
                    <Fragment key={c.id}>
                      <tr className={cx(ver && '[&>td]:bg-navy-50!')}>
                        <td>
                          <b className="cell-key">
                            {f?.oc.id ?? c.clave.split('-')[0]} / {f?.despacho.id ?? c.clave.split('-')[1]}
                          </b>
                          <span className="block text-xs text-ink-3">{c.id}</span>
                        </td>
                        <td>{c.ff}</td>
                        <td>
                          {c.modo} · {rotuloCarga(c.carga)}
                        </td>
                        <td className="num">{fmtFechaCorta(c.fecha)}</td>
                        <td>
                          <span className={cx('num', pideRecordatorio(c) && 'font-bold text-ambar-700')}>
                            {dias === 0 ? 'Hoy' : `${dias} días`}
                          </span>
                          {c.recordatorios > 0 && (
                            <span className="block text-xs text-ambar-700">
                              {c.recordatorios} recordatorio{c.recordatorios === 1 ? '' : 's'}
                            </span>
                          )}
                        </td>
                        <td>
                          <span className={cx('inline-flex whitespace-nowrap rounded-full px-2.5 py-[3px] text-xs font-semibold', CHIP[c.estado])}>
                            {c.estado}
                          </span>
                        </td>
                        <td className="cell-cut" title={c.nota}>
                          {c.nota || '—'}
                        </td>
                        <td>
                          <div className="flex gap-1.5">
                            <Button size="sm" variant={ver ? 'primary' : 'secondary'} onClick={() => setAbierta(ver ? null : c.id)}>
                              <LuEye size={13} /> {ver ? 'Ocultar' : 'Ver'}
                            </Button>
                            {c.estado === 'En proceso de cotización' && (
                              <Button size="sm" onClick={() => recordar(c)}>
                                <LuBellRing size={13} /> Recordatorio
                              </Button>
                            )}
                            {c.estado !== 'Transporte asignado' && (
                              <Button size="sm" onClick={() => reiniciar(c, 'Recotización solicitada al freight forwarder')}>
                                <LuRefreshCw size={13} /> Recotizar
                              </Button>
                            )}
                            {c.estado === 'Cotizado' && (
                              <>
                                <Button size="sm" variant="danger" onClick={() => reiniciar(c, 'Propuesta rechazada · se requiere nueva cotización')}>
                                  <LuX size={13} /> Rechazar
                                </Button>
                                <Button size="sm" variant="primary" onClick={() => asignar(c)}>
                                  <LuCheck size={13} /> Asignar transporte
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                      {ver && (
                        <tr>
                          <td colSpan={8} className="bg-surface-2! p-3!">
                            <Detalle
                              c={c}
                              f={f}
                              onGuardar={(modo, carga) => {
                                reiniciar(c, `Modalidad cambiada a ${modo} · ${rotuloCarga(carga)}; en recotización`, { modo, carga })
                                avisar(`${c.id}: modalidad actualizada, vuelve a cotización.`, 'ok')
                              }}
                            />
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        <p className="flex items-center gap-2 text-sm text-ink-3">
          <LuTruck size={13} className="shrink-0" />
          Los envíos al forwarder son de demostración: el correo o la API real requieren integración.
        </p>
      </div>
    </Modal>
  )
}
