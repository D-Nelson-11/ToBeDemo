import { useEffect, useMemo, useState } from 'react'
import {
  LuBan,
  LuCalendarDays,
  LuCheck,
  LuFileText,
  LuPackage,
  LuPlus,
  LuRotateCcw,
  LuTrash2,
  LuTruck,
  LuWallet,
} from 'react-icons/lu'
import Modal, { FootNote } from '../components/ui/Modal'
import { Seccion } from '../components/ui/Panel'
import Button, { cx } from '../components/ui/Button'
import { Field, Input, Select, Textarea } from '../components/ui/Field'
import { totalOc, useOc } from '../data/store'
import { COND_PAGO, INCOTERMS, MONEDAS, PROVEEDORES, RESPONSABLES, UNIDADES } from '../data/catalogos'
import { fmtMoneda, fmtNum } from '../lib/fechas'

const SITUACIONES = [
  { id: null, rotulo: 'Sin pendientes', icono: LuCheck },
  { id: 'pago', rotulo: 'Pendiente de pago', icono: LuWallet },
  { id: 'fechas', rotulo: 'Asignar fechas', icono: LuCalendarDays },
  { id: 'programar', rotulo: 'Programar', icono: LuTruck },
]

export default function ModalEditarOc({ oc, onClose }) {
  const { actualizarOc, toggleActiva, avisar } = useOc()
  const [b, setB] = useState(null)

  useEffect(() => {
    setB(
      oc ? { ...oc, materiales: oc.materiales.map((m, i) => ({ ...m, uid: `${oc.id}-${i}` })) } : null,
    )
  }, [oc])

  const totalOriginal = useMemo(() => (oc ? totalOc(oc) : 0), [oc])
  const total = useMemo(
    () =>
      b ? b.materiales.reduce((a, m) => a + (Number(m.cantidad) || 0) * (Number(m.precio) || 0), 0) : 0,
    [b],
  )
  const cantidad = useMemo(
    () => (b ? b.materiales.reduce((a, m) => a + (Number(m.cantidad) || 0), 0) : 0),
    [b],
  )

  if (!oc || !b) return null

  const set = (campo) => (e) => setB((x) => ({ ...x, [campo]: e.target.value }))
  const editar = (uid, campo, valor) =>
    setB((x) => ({
      ...x,
      materiales: x.materiales.map((m) => (m.uid === uid ? { ...m, [campo]: valor } : m)),
    }))

  const delta = total - totalOriginal

  function guardar() {
    const { materiales, ...cabecera } = b
    actualizarOc(oc.id, {
      ...cabecera,
      ultEmbarque: b.ultEmbarque || null,
      materiales: materiales.map(({ uid, ...m }) => ({
        ...m,
        cantidad: Number(m.cantidad) || 0,
        precio: Number(m.precio) || 0,
      })),
    })
    avisar(
      delta === 0
        ? `OC ${oc.id} actualizada.`
        : `OC ${oc.id} actualizada · total ${delta > 0 ? '+' : ''}${fmtMoneda(delta, b.moneda)}.`,
      'ok',
    )
    onClose()
  }

  return (
    <Modal
      open
      onClose={onClose}
      size="xl"
      eyebrow={`Orden de compra ${oc.id}`}
      title={b.proveedor}
      footer={
        <>
          <div className="flex items-baseline gap-2">
            <span className="lbl">Total OC</span>
            <span className="num text-xl font-bold text-navy-800">
              {fmtMoneda(total, b.moneda)}
            </span>
            {delta !== 0 && (
              <span className="text-sm font-semibold text-ambar-700">
                {delta > 0 ? '+' : ''}
                {fmtMoneda(delta, b.moneda)}
              </span>
            )}
          </div>
          <FootNote>
            {fmtNum(cantidad)} unidades · {b.materiales.length} línea
            {b.materiales.length === 1 ? '' : 's'}
          </FootNote>
          <Button variant="quiet" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={guardar}>
            Guardar cambios
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        {!oc.activa && (
          <div className="flex items-center gap-2.5 rounded-md border border-ambar-100 bg-ambar-50 px-3 py-2.5 text-sm font-medium text-ambar-700">
            <LuBan size={15} className="shrink-0" />
            <span className="flex-1">
              Esta OC está inactiva: no aparece en la operación ni admite despachos.
            </span>
            <Button
              size="sm"
              onClick={() => {
                toggleActiva(oc.id)
                avisar(`OC ${oc.id} reactivada.`, 'ok')
              }}
            >
              <LuRotateCcw size={12} />
              Reactivar
            </Button>
          </div>
        )}

        <Seccion titulo="Datos de la orden" icono={LuFileText}>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <Field label="Proveedor" className="col-span-2">
              <Select options={PROVEEDORES} value={b.proveedor} onChange={set('proveedor')} />
            </Field>
            <Field label="Resp. de compra">
              <Select options={RESPONSABLES} value={b.resp} onChange={set('resp')} />
            </Field>
            <Field label="Estado de la OC">
              <Select
                value={b.estado}
                onChange={set('estado')}
                options={[
                  { value: 'abierta', label: 'Abierta — admite despachos' },
                  { value: 'cerrada', label: 'Cerrada — no admite despachos' },
                ]}
              />
            </Field>

            <Field label="Fecha de documento">
              <Input date type="date" value={b.fechaDoc} onChange={set('fechaDoc')} />
            </Field>
            <Field label="Último embarque" hint="Última vez que ingresó este producto.">
              <Input date type="date" value={b.ultEmbarque ?? ''} onChange={set('ultEmbarque')} />
            </Field>
            <Field label="Incoterm">
              <Select options={INCOTERMS} value={b.incoterm} onChange={set('incoterm')} />
            </Field>
            <Field label="Cond. de pago">
              <Select options={COND_PAGO} value={b.condPago} onChange={set('condPago')} />
            </Field>

            <Field label="Situación" className="col-span-2" hint="Determina en qué filtro aparece la OC.">
              <div className="flex flex-wrap gap-1.5">
                {SITUACIONES.map(({ id, rotulo, icono: Icono }) => (
                  <button
                    key={rotulo}
                    onClick={() => setB((x) => ({ ...x, pendiente: id }))}
                    className={cx(
                      'inline-flex h-8 items-center gap-1.5 whitespace-nowrap rounded-sm border px-[11px] text-sm transition duration-100',
                      b.pendiente === id
                        ? 'border-navy-800 bg-navy-800 font-semibold text-white'
                        : 'border-line bg-surface font-medium text-ink-2 hover:border-navy-400 hover:text-ink',
                    )}
                  >
                    <Icono size={13} className={b.pendiente === id ? 'text-white/75' : 'text-ink-4'} />
                    {rotulo}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Moneda">
              <Select options={MONEDAS} value={b.moneda} onChange={set('moneda')} />
            </Field>
          </div>
        </Seccion>

        <Seccion titulo="Materiales y cantidades" icono={LuPackage}>
          <div className="overflow-hidden rounded-md border border-line">
            <table className="tbl">
              <thead>
                <tr>
                  <th className="w-[110px]">Código</th>
                  <th>Material</th>
                  <th className="w-[130px] text-right!">Cantidad</th>
                  <th className="w-[88px]">Unidad</th>
                  <th className="w-[110px] text-right!">Precio</th>
                  <th className="w-[132px] text-right!">Total línea</th>
                  <th className="w-[44px]" />
                </tr>
              </thead>
              <tbody>
                {b.materiales.map((m) => (
                  <tr key={m.uid}>
                    <td>
                      <input
                        className="cellinp cellinp-num text-left!"
                        value={m.codigo}
                        onChange={(e) => editar(m.uid, 'codigo', e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        className="cellinp"
                        value={m.nombre}
                        onChange={(e) => editar(m.uid, 'nombre', e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        className="cellinp cellinp-num"
                        type="number"
                        value={m.cantidad}
                        onChange={(e) => editar(m.uid, 'cantidad', e.target.value)}
                      />
                    </td>
                    <td>
                      <select
                        className="cellinp cursor-pointer appearance-none"
                        value={m.unidad}
                        onChange={(e) => editar(m.uid, 'unidad', e.target.value)}
                      >
                        {UNIDADES.map((u) => (
                          <option key={u}>{u}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <input
                        className="cellinp cellinp-num"
                        type="number"
                        step="0.001"
                        value={m.precio}
                        onChange={(e) => editar(m.uid, 'precio', e.target.value)}
                      />
                    </td>
                    <td className="cell-num cell-strong">
                      {fmtMoneda((Number(m.cantidad) || 0) * (Number(m.precio) || 0), b.moneda)}
                    </td>
                    <td>
                      <div className="flex items-center justify-end">
                        <button
                          className="ico ico-rojo"
                          title="Quitar material"
                          disabled={b.materiales.length === 1}
                          onClick={() =>
                            setB((x) => ({
                              ...x,
                              materiales: x.materiales.filter((y) => y.uid !== m.uid),
                            }))
                          }
                        >
                          <LuTrash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={2}>
                    <Button
                      variant="link"
                      onClick={() =>
                        setB((x) => ({
                          ...x,
                          materiales: [
                            ...x.materiales,
                            {
                              uid: Math.random().toString(36).slice(2),
                              codigo: '',
                              nombre: '',
                              categoria: '',
                              cantidad: 0,
                              unidad: 'KG',
                              precio: 0,
                            },
                          ],
                        }))
                      }
                    >
                      <LuPlus size={13} />
                      Agregar material
                    </Button>
                  </td>
                  <td className="cell-num">{fmtNum(cantidad)}</td>
                  <td colSpan={2} />
                  <td className="cell-num">{fmtMoneda(total, b.moneda)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </Seccion>

        <Seccion titulo="Notas" icono={LuFileText}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Nota interna">
              <Textarea
                value={b.nota}
                placeholder="Visible solo para el equipo de abastecimiento…"
                onChange={set('nota')}
              />
            </Field>
            <Field label="Instrucciones al proveedor">
              <Textarea
                value={b.instrucciones}
                placeholder="Condiciones de carga, temperatura, documentación…"
                onChange={set('instrucciones')}
              />
            </Field>
          </div>
        </Seccion>
      </div>
    </Modal>
  )
}
