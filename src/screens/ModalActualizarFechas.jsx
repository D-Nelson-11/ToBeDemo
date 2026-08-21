import { useEffect, useMemo, useState } from 'react'
import {
  LuArrowRight,
  LuBellRing,
  LuCalendarDays,
  LuCircleCheck,
  LuClock,
  LuSend,
  LuTriangleAlert,
} from 'react-icons/lu'
import Modal from '../components/ui/Modal'
import Button, { cx } from '../components/ui/Button'
import { Field, Input, Select, Textarea } from '../components/ui/Field'
import { CATEGORIAS_IMPACTO } from '../data/catalogos'
import { useOc } from '../data/store'
import { addDays, diasEntre, fmtFecha, fmtFechaCorta, parseISO, toISO } from '../lib/fechas'

const MAX_CAUSA = 500

const HITOS = [
  { clave: 'salida', rotulo: 'Salida proveedor' },
  { clave: 'frontera', rotulo: 'ETA frontera' },
  { clave: 'planta', rotulo: 'ETA planta' },
]

/** Rango de un grupo de fechas: una sola si coinciden, min – max si no. */
function rango(fechas) {
  const t = fechas.filter(Boolean).map((d) => d.getTime())
  if (!t.length) return null
  const min = new Date(Math.min(...t))
  const max = new Date(Math.max(...t))
  return { min, max, unico: min.getTime() === max.getTime() }
}

function TextoRango({ r, fuerte }) {
  if (!r) return <span className="text-ink-4">—</span>
  if (r.unico) return <span className={cx('num', fuerte && 'font-bold')}>{fmtFechaCorta(r.min)}</span>
  return (
    <span className={cx('num whitespace-nowrap', fuerte && 'font-bold')}>
      {fmtFechaCorta(r.min)} <span className="text-ink-4">–</span> {fmtFechaCorta(r.max)}
    </span>
  )
}

export default function ModalActualizarFechas({ filas, abierto, onClose, onListo }) {
  const { reprogramar, avisar } = useOc()

  // Con un solo despacho tiene sentido fijar la fecha; con varios, correrlos en bloque
  // sin perder el escalonamiento entre ellos.
  const [modo, setModo] = useState('dias')
  const [dias, setDias] = useState(1)
  const [fechaPlanta, setFechaPlanta] = useState('')
  const [causa, setCausa] = useState('')
  const [categoria, setCategoria] = useState('')
  const [notificar, setNotificar] = useState(true)

  const una = filas.length === 1

  useEffect(() => {
    if (!abierto) return
    setModo(una ? 'fecha' : 'dias')
    setDias(1)
    setFechaPlanta(filas[0]?.planta ? toISO(filas[0].planta) : '')
    setCausa('')
    setCategoria('')
    setNotificar(true)
  }, [abierto, una]) // eslint-disable-line react-hooks/exhaustive-deps

  // Un solo cálculo para toda la selección: mismo desfase o misma fecha destino.
  const calculo = useMemo(() => {
    const destino = parseISO(fechaPlanta)
    const items = filas.map((f) => {
      const transito = (f.ruta?.leg1 ?? 0) + (f.ruta?.leg2 ?? 0)
      let salidaNueva = f.etd
      if (modo === 'dias') {
        salidaNueva = f.etd ? addDays(f.etd, Number(dias) || 0) : null
      } else if (destino) {
        salidaNueva = addDays(destino, -transito)
      }
      const fronteraNueva = salidaNueva ? addDays(salidaNueva, f.ruta?.leg1 ?? 0) : null
      const plantaNueva = fronteraNueva ? addDays(fronteraNueva, f.ruta?.leg2 ?? 0) : null
      return {
        fila: f,
        salidaNueva,
        fronteraNueva,
        plantaNueva,
        variacion: f.planta && plantaNueva ? diasEntre(f.planta, plantaNueva) : null,
      }
    })

    const variaciones = items.map((i) => i.variacion).filter((v) => v !== null)
    return {
      items,
      antes: {
        salida: rango(filas.map((f) => f.etd)),
        frontera: rango(filas.map((f) => f.frontera)),
        planta: rango(filas.map((f) => f.planta)),
      },
      despues: {
        salida: rango(items.map((i) => i.salidaNueva)),
        frontera: rango(items.map((i) => i.fronteraNueva)),
        planta: rango(items.map((i) => i.plantaNueva)),
      },
      varMin: variaciones.length ? Math.min(...variaciones) : 0,
      varMax: variaciones.length ? Math.max(...variaciones) : 0,
    }
  }, [filas, modo, dias, fechaPlanta])

  if (!abierto || !filas.length) return null

  const { varMin, varMax } = calculo
  const retrasa = varMax > 0
  const adelanta = varMin < 0
  const mismaVar = varMin === varMax
  const textoVar = mismaVar
    ? `${varMax > 0 ? '+' : ''}${varMax} día${Math.abs(varMax) === 1 ? '' : 's'}`
    : `de ${varMin > 0 ? '+' : ''}${varMin} a +${varMax} días`

  const puedeGuardar = categoria && calculo.items.every((i) => i.plantaNueva)

  function guardar() {
    reprogramar(
      calculo.items.map((i) => ({
        ocId: i.fila.oc.id,
        despachoId: i.fila.despacho.id,
        salida: toISO(i.salidaNueva),
      })),
      { causa, categoria, notificar },
    )
    avisar(
      `${filas.length} despacho${filas.length === 1 ? '' : 's'} reprogramado${
        filas.length === 1 ? '' : 's'
      } · ${categoria}${notificar ? ' · cliente notificado' : ''}.`,
      retrasa ? 'alerta' : 'ok',
    )
    onListo?.()
    onClose()
  }

  return (
    <Modal
      open
      onClose={onClose}
      size="xl"
      eyebrow={`${filas.length} despacho${filas.length === 1 ? '' : 's'} seleccionado${filas.length === 1 ? '' : 's'}`}
      title="Actualizar fechas de despacho"
      footer={
        <>
          <span className="min-w-0 flex-1 text-sm text-ink-2">
            {puedeGuardar ? (
              <>
                Se aplicará <b className="font-bold text-ink">{textoVar}</b> a {filas.length}{' '}
                despacho{filas.length === 1 ? '' : 's'}.
              </>
            ) : (
              <span className="text-ambar-700">
                Indicá la categoría de impacto y una fecha válida para guardar.
              </span>
            )}
          </span>
          <Button variant="quiet" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={guardar} disabled={!puedeGuardar}>
            Guardar cambios
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {/* Aviso: lo primero que se lee es el impacto para el cliente */}
        <div
          className={cx(
            'flex items-start gap-2.5 rounded-sm border px-3 py-2.5 text-sm',
            retrasa
              ? 'border-ambar-100 bg-ambar-50 text-ambar-700'
              : adelanta
                ? 'border-teal-100 bg-teal-50 text-teal-700'
                : 'border-line bg-surface-2 text-ink-2',
          )}
        >
          {retrasa ? (
            <LuTriangleAlert size={15} className="mt-px shrink-0" />
          ) : (
            <LuCircleCheck size={15} className="mt-px shrink-0" />
          )}
          <span>
            <b className="font-bold">
              {retrasa ? 'Alerta al cliente:' : adelanta ? 'Adelanto:' : 'Sin variación:'}
            </b>{' '}
            {retrasa
              ? `estos embarques se retrasan ${textoVar}. Nueva llegada a planta: `
              : adelanta
                ? `estos embarques se adelantan ${textoVar}. Nueva llegada a planta: `
                : 'las fechas quedan igual. Llegada a planta: '}
            <b className="font-bold">
              {calculo.despues.planta
                ? calculo.despues.planta.unico
                  ? fmtFecha(calculo.despues.planta.min)
                  : `${fmtFecha(calculo.despues.planta.min)} – ${fmtFecha(calculo.despues.planta.max)}`
                : '—'}
            </b>
          </span>
        </div>

        {/* Sobre qué se está actuando. Va en tabla y no en campos sueltos: con varios
            marcados, una lista separada por comas se vuelve ilegible. */}
        <div className="panel max-h-[150px] overflow-auto">
          <table className="tbl">
            <thead>
              <tr>
                <th className="w-[180px]">N°</th>
                <th className="w-[180px]">Orden de compra</th>
                <th className="w-[140px]">Despacho</th>
                <th>Proveedor</th>
              </tr>
            </thead>
            <tbody>
              {filas.map((f, i) => (
                <tr key={f.clave}>
                  <td className="num">{i + 1}</td>
                  <td className="num">{f.oc.id}</td>
                  <td className="cell-key">{f.despacho.id}</td>
                  <td className="cell-strong cell-cut" title={f.oc.proveedor}>
                    {f.oc.proveedor}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1.15fr_1fr]">
          {/* --- el control del cambio --- */}
          <div className="panel p-4">
            <h3 className="panel-title mb-1">Nuevo calendario</h3>
            <p className="mb-3 text-sm text-ink-3">
              El sistema recalcula salida, frontera y planta de cada despacho con los días de su
              ruta.
            </p>

            <div className="segbar mb-3">
              <button
                className={cx('seg', modo === 'dias' && 'seg-on')}
                onClick={() => setModo('dias')}
              >
                <LuClock size={13} />
                Correr N días
              </button>
              <button
                className={cx('seg', modo === 'fecha' && 'seg-on')}
                onClick={() => setModo('fecha')}
              >
                <LuCalendarDays size={13} />
                Nueva fecha en planta
              </button>
            </div>

            {modo === 'dias' ? (
              <Field
                label="Días de desfase"
                className="w-40"
                hint="Positivo retrasa, negativo adelanta. Mantiene la separación entre despachos."
              >
                <Input
                  numeric
                  type="number"
                  value={dias}
                  onChange={(e) => setDias(e.target.value)}
                />
              </Field>
            ) : (
              <Field
                label="Nueva fecha requerida en planta"
                className="w-52"
                hint={
                  filas.length > 1
                    ? 'Ojo: con varios seleccionados los deja a todos llegando el mismo día.'
                    : undefined
                }
              >
                <Input
                  date
                  type="date"
                  value={fechaPlanta}
                  onChange={(e) => setFechaPlanta(e.target.value)}
                />
              </Field>
            )}
          </div>

          {/* --- el resumen del impacto --- */}
          <div
            className={cx(
              'panel p-4',
              retrasa && 'border-ambar-100 bg-ambar-50',
              adelanta && 'border-teal-100 bg-teal-50',
            )}
          >
            <h3 className="panel-title mb-3">Resumen del cambio</h3>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
              <div>
                <div className="lbl mb-0.5">{retrasa ? 'Retraso' : adelanta ? 'Adelanto' : 'Variación'}</div>
                <div
                  className={cx(
                    'num text-2xl font-bold',
                    retrasa ? 'text-ambar-700' : adelanta ? 'text-teal-700' : 'text-ink-2',
                  )}
                >
                  {textoVar}
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <div>
                  <div className="lbl mb-0.5">Llegada actual</div>
                  <TextoRango r={calculo.antes.planta} />
                </div>
                <LuArrowRight size={15} className="mt-3 shrink-0 text-ink-4" />
                <div>
                  <div className="lbl mb-0.5">Llegada nueva</div>
                  <span
                    className={cx(
                      retrasa ? 'text-ambar-700' : adelanta ? 'text-teal-700' : 'text-ink',
                    )}
                  >
                    <TextoRango r={calculo.despues.planta} fuerte />
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* --- comparación hito por hito, para toda la selección --- */}
        <div className="panel tabla-scroll">
          <table className="tbl">
            <thead>
              <tr>
                <th className="w-[190px]">Hito</th>
                {HITOS.map((h) => (
                  <th key={h.clave}>{h.rotulo}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="cell-strong">
                  Fechas actuales <span className="text-ink-3">(planificadas)</span>
                </td>
                {HITOS.map((h) => (
                  <td key={h.clave}>
                    <TextoRango r={calculo.antes[h.clave]} />
                  </td>
                ))}
              </tr>
              <tr>
                <td className="cell-strong">
                  Nuevas fechas <span className="text-ink-3">(recalculadas)</span>
                </td>
                {HITOS.map((h) => (
                  <td key={h.clave} className="text-navy-800">
                    <TextoRango r={calculo.despues[h.clave]} fuerte />
                  </td>
                ))}
              </tr>
              <tr>
                <td className="cell-strong">Variación</td>
                {HITOS.map((h) => (
                  <td
                    key={h.clave}
                    className={cx(
                      'num font-bold',
                      retrasa ? 'text-ambar-700' : adelanta ? 'text-teal-700' : 'text-ink-3',
                    )}
                  >
                    {textoVar}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        {/* --- por qué se movió --- */}
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_320px]">
          <div className="panel p-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-[240px_1fr]">
              <Field label="Categoría de impacto" required hint="Es lo que se reporta al cliente.">
                <Select
                  placeholder="Seleccione…"
                  options={CATEGORIAS_IMPACTO}
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                />
              </Field>
              <Field
                label="Causa del cambio"
                hint={`${causa.length} / ${MAX_CAUSA}`}
              >
                <Textarea
                  maxLength={MAX_CAUSA}
                  placeholder="Detalle de lo que pasó: origen, responsable, acciones tomadas…"
                  value={causa}
                  onChange={(e) => setCausa(e.target.value)}
                />
              </Field>
            </div>
          </div>

          <div className="panel p-4">
            <h3 className="panel-title mb-3">Notificación al cliente</h3>
            <label className="mb-3 flex cursor-pointer items-start gap-2.5 text-base">
              <input
                type="checkbox"
                className="chk mt-px"
                checked={notificar}
                onChange={(e) => setNotificar(e.target.checked)}
              />
              <span>
                Enviar alerta automática
                <span className="block text-sm text-ink-3">
                  Indica la nueva fecha de entrega y la categoría de impacto.
                </span>
              </span>
            </label>
            <Button
              block
              disabled={!notificar || !categoria}
              onClick={() =>
                avisar(`Alerta enviada al cliente por ${filas.length} despachos.`, 'ok')
              }
            >
              <LuSend size={13} />
              Enviar ahora
            </Button>
            {!notificar && (
              <p className="mt-2 flex items-start gap-1.5 text-sm text-ink-3">
                <LuBellRing size={13} className="mt-px shrink-0" />
                El cambio se guarda sin avisar al cliente.
              </p>
            )}
          </div>
        </div>
      </div>
    </Modal>
  )
}
