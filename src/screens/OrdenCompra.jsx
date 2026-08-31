import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LuFileText, LuPackage, LuPlus, LuRotateCcw, LuSparkles, LuTags, LuTrash2 } from 'react-icons/lu'
import Panel from '../components/ui/Panel'
import Button, { cx } from '../components/ui/Button'
import { Field, Input, Select, Textarea } from '../components/ui/Field'
import { siguienteIdOc, useOc } from '../data/store'
import {
  CATEGORIAS_PORTAL,
  CATEGORIAS_SKU,
  COND_PAGO,
  INCOTERMS,
  MONEDAS,
  PROVEEDORES,
  TIPOS_EMBALAJE,
  UNIDADES,
} from '../data/catalogos'
import { fmtMoneda, fmtNum, toISO } from '../lib/fechas'

const CONTEXTO = [
  ['Cliente', 'Corporación Dinant S.A'],
  ['Organización', 'DINANT'],
  ['Centro', 'CD DINANT SNACK'],
  ['Área de compra', 'Materia Prima'],
  ['Resp. compra', 'User'],
]

// Lo que "extrae" el lector de PDF al procesar la orden del proveedor.
const MATERIALES_DEL_PDF = [
  ['1001551', 'Papa Fresca para Proceso', 'Papa y tubérculos', 400000, 'KG', 0.886],
  ['1007712', 'Empaque Flexible Metalizado', 'Empaque primario', 1200000, 'UN', 0.021],
  ['1007730', 'Corrugado Master 12x1', 'Empaque secundario', 42000, 'UN', 0.264],
].map(([material, descripcion, categoria, cantidad, unidad, precio]) => ({
  material,
  descripcion,
  categoria,
  cantidad,
  unidad,
  precio,
  moneda: 'USD',
}))

const uid = () => Math.random().toString(36).slice(2)

const filaVacia = () => ({
  uid: uid(),
  material: '',
  descripcion: '',
  categoria: '',
  cantidad: 0,
  unidad: 'KG',
  moneda: 'USD',
  precio: 0,
})

export default function OrdenCompra() {
  const { crearOc, avisar, cargar, ordenes } = useOc()
  const navegar = useNavigate()

  const [form, setForm] = useState({
    documento: '',
    proveedor: '',
    incoterm: '',
    fechaDoc: '',
    fechaCorreo: '',
    condPago: '',
    instrucciones: '',
    nota: '',
    categoriaPortal: '',
    categoriaSku: '',
    embalaje: '',
  })
  const [materiales, setMateriales] = useState([])
  const [pdf, setPdf] = useState(null)

  const set = (campo) => (e) => setForm((f) => ({ ...f, [campo]: e.target.value }))

  const total = useMemo(
    () => materiales.reduce((a, m) => a + (Number(m.cantidad) || 0) * (Number(m.precio) || 0), 0),
    [materiales],
  )
  const unidades = useMemo(
    () => materiales.reduce((a, m) => a + (Number(m.cantidad) || 0), 0),
    [materiales],
  )

  const editar = (id, campo, valor) =>
    setMateriales((ms) => ms.map((m) => (m.uid === id ? { ...m, [campo]: valor } : m)))

  function procesarPdf() {
    setPdf('OC-ALLIED-5523833.pdf')
    setMateriales(MATERIALES_DEL_PDF.map((m) => ({ ...m, uid: uid() })))
    setForm((f) => ({
      ...f,
      documento: f.documento || siguienteIdOc(ordenes),
      proveedor: f.proveedor || 'ALLIED POTATO, INC',
      incoterm: f.incoterm || 'FOB',
      condPago: f.condPago || 'Crédito 30 días',
      fechaDoc: f.fechaDoc || toISO(new Date()),
      categoriaPortal: f.categoriaPortal || 'Materia Prima',
      categoriaSku: f.categoriaSku || 'Papa y tubérculos',
      embalaje: f.embalaje || 'Bin plástico',
    }))
    avisar('OC leída del PDF: 3 materiales y 6 campos de cabecera precargados.', 'ok', {
      destacado: true,
    })
  }

  function guardar() {
    if (!form.documento || !form.proveedor)
      return avisar('Falta el N° de documento o el proveedor.', 'rojo', { destacado: true })
    if (ordenes.some((o) => String(o.id) === String(form.documento).trim()))
      return avisar(`Ya existe una OC con el número ${form.documento}.`, 'rojo', { destacado: true })
    if (!materiales.length)
      return avisar('La OC necesita al menos un material.', 'rojo', { destacado: true })

    crearOc({
      id: form.documento,
      proveedor: form.proveedor,
      resp: 'User',
      organizacion: 'CORPORACION DINANT S.A',
      centro: 'CD DINANT SNACK',
      fechaDoc: form.fechaDoc || toISO(new Date()),
      fechaCorreo: form.fechaCorreo,
      ultEmbarque: null,
      estado: 'abierta',
      activa: true,
      pendiente: 'programar',
      incoterm: form.incoterm,
      condPago: form.condPago,
      moneda: materiales[0]?.moneda ?? 'USD',
      sugerencia: false,
      selloPendiente: true,
      nota: form.nota,
      instrucciones: form.instrucciones,
      materiales: materiales.map((m) => ({
        codigo: m.material,
        nombre: m.descripcion,
        categoria: m.categoria,
        cantidad: Number(m.cantidad) || 0,
        unidad: m.unidad,
        precio: Number(m.precio) || 0,
      })),
      despachos: [],
    })
    avisar(`OC ${form.documento} creada. Ya aparece en Crear Despacho.`, 'ok', { destacado: true })
    cargar('Cargando…', () => navegar('/despachos'))
  }

  return (
    <div className="flex min-h-full flex-col">
      {/* Contexto de la orden: una tira de datos, no una tarjeta. Es referencia, no protagonista. */}
      <div className="border-b border-line bg-surface-3">
        <div className="contenedor flex flex-wrap items-center gap-x-6 py-2.5">
        {CONTEXTO.map(([rotulo, valor]) => (
          <div key={rotulo} className="flex items-baseline gap-1.5 whitespace-nowrap">
            <span className="text-sm text-ink-3">
              {rotulo}
            </span>
            <span className="text-sm font-semibold text-ink">{valor}</span>
          </div>
        ))}
        </div>
      </div>

      <div className="contenedor flex flex-1 flex-col gap-4 py-5">
        <Panel titulo="Datos de la orden" icono={LuFileText}>
          <div className="grid grid-cols-1 gap-4 gap-x-5 md:grid-cols-2 xl:grid-cols-3">
            <Field label="N° de documento" required>
              <Input
                placeholder="No. Orden Compra"
                value={form.documento}
                onChange={set('documento')}
              />
            </Field>
            <Field label="Proveedor" required>
              <Select
                placeholder="Selecciona un proveedor…"
                options={PROVEEDORES}
                value={form.proveedor}
                onChange={set('proveedor')}
              />
            </Field>
            <Field label="Incoterms">
              <Select
                placeholder="Seleccione…"
                options={INCOTERMS}
                value={form.incoterm}
                onChange={set('incoterm')}
              />
            </Field>

            <Field label="Fecha de documento">
              <Input date type="date" value={form.fechaDoc} onChange={set('fechaDoc')} />
            </Field>
            <Field label="Fecha correo">
              <Input date type="datetime-local" value={form.fechaCorreo} onChange={set('fechaCorreo')} />
            </Field>
            <Field label="Cond. de pago">
              <Select
                placeholder="Seleccione…"
                options={COND_PAGO}
                value={form.condPago}
                onChange={set('condPago')}
              />
            </Field>

            {/* <Field label="Instrucciones especiales" className="md:col-span-2">
              <Textarea
                placeholder="Ingrese alguna observación para el proveedor…"
                value={form.instrucciones}
                onChange={set('instrucciones')}
              />
            </Field>
            <Field label="Nota interna" hint="No se comparte con el proveedor.">
              <Textarea value={form.nota} onChange={set('nota')} />
            </Field> */}
          </div>
        </Panel>

        <Panel titulo="Clasificación de SKU" icono={LuTags} sub="Se crean en Personas y en el Portal.">
          <div className="grid grid-cols-1 gap-4 gap-x-5 md:grid-cols-2 xl:grid-cols-3">
            <Field label="Categoría del portal">
              <Select
                placeholder="Seleccione…"
                options={CATEGORIAS_PORTAL}
                value={form.categoriaPortal}
                onChange={set('categoriaPortal')}
              />
            </Field>
            <Field label="Categoría del SKU">
              <Select
                placeholder="Selecciona una categoría…"
                options={CATEGORIAS_SKU}
                value={form.categoriaSku}
                onChange={set('categoriaSku')}
              />
            </Field>
            <Field label="Tipo de embalaje">
              <Select
                placeholder="Seleccione…"
                options={TIPOS_EMBALAJE}
                value={form.embalaje}
                onChange={set('embalaje')}
              />
            </Field>
          </div>
        </Panel>

        <Panel titulo="Materiales" icono={LuPackage} flush>
          <div className="flex flex-wrap items-center gap-3 border-b border-line bg-surface-2 px-4 py-3">
            <button
              onClick={procesarPdf}
              className={cx(
                'flex h-8 min-w-[240px] flex-1 items-center gap-2.5 rounded-sm border px-2.5 text-left text-sm transition duration-100',
                pdf
                  ? 'border-teal-100 bg-teal-50 font-medium text-teal-700'
                  : 'border-dashed border-line-strong bg-surface text-ink-3 hover:border-navy-600 hover:bg-navy-50 hover:text-navy-800',
              )}
            >
              <span className="inline-flex h-[17px] shrink-0 items-center justify-center rounded-xs bg-rojo-600 px-[5px] text-3xs font-bold text-white">
                PDF
              </span>
              {pdf ?? 'Seleccionar orden de compra del proveedor…'}
            </button>

            <Button variant="primary" onClick={procesarPdf}>
              <LuSparkles size={14} />
              Procesar OC
            </Button>
            <Button onClick={() => setMateriales((ms) => [...ms, filaVacia()])}>
              <LuPlus size={14} />
              Agregar material
            </Button>
          </div>

          <div className="tabla-scroll max-w-full">
            <table className="tbl">
              <thead>
                <tr>
                  <th className="w-[42px]">N°</th>
                  <th className="w-[120px]">Material</th>
                  <th>Descripción</th>
                  <th className="w-[170px]">Categoría</th>
                  <th className="w-[120px] text-right!">Cantidad</th>
                  <th className="w-[92px]">Unidad</th>
                  <th className="w-[88px]">Moneda</th>
                  <th className="w-[110px] text-right!">Precio</th>
                  <th className="w-[130px] text-right!">Total</th>
                  <th className="w-[46px]" />
                </tr>
              </thead>
              <tbody>
                {materiales.length === 0 && (
                  <tr>
                    <td colSpan={10} className="h-[148px]! bg-surface text-center">
                      <span className="inline-flex flex-col items-center gap-[7px]">
                        <LuPackage size={26} strokeWidth={1.5} className="text-navy-200" />
                        <span className="text-base font-semibold text-ink-2">Sin materiales</span>
                        <span className="text-sm text-ink-3">
                          Carga el PDF de la OC del proveedor o agrega las filas a mano.
                        </span>
                      </span>
                    </td>
                  </tr>
                )}

                {materiales.map((m, i) => (
                  <tr key={m.uid}>
                    <td className="cell-num text-ink-3">{String(i + 1).padStart(2, '0')}</td>
                    <td>
                      <input
                        className="cellinp cellinp-num text-left!"
                        value={m.material}
                        placeholder="Código"
                        onChange={(e) => editar(m.uid, 'material', e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        className="cellinp"
                        value={m.descripcion}
                        placeholder="Descripción del material"
                        onChange={(e) => editar(m.uid, 'descripcion', e.target.value)}
                      />
                    </td>
                    <td>
                      <select
                        className="cellinp cursor-pointer appearance-none"
                        value={m.categoria}
                        onChange={(e) => editar(m.uid, 'categoria', e.target.value)}
                      >
                        <option value="">—</option>
                        {CATEGORIAS_SKU.map((x) => (
                          <option key={x}>{x}</option>
                        ))}
                      </select>
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
                      <select
                        className="cellinp cursor-pointer appearance-none"
                        value={m.moneda}
                        onChange={(e) => editar(m.uid, 'moneda', e.target.value)}
                      >
                        {MONEDAS.map((u) => (
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
                      {fmtMoneda((Number(m.cantidad) || 0) * (Number(m.precio) || 0), m.moneda)}
                    </td>
                    <td>
                      <div className="flex items-center justify-end">
                        <button
                          className="ico ico-rojo"
                          title="Eliminar material"
                          onClick={() => setMateriales((ms) => ms.filter((x) => x.uid !== m.uid))}
                        >
                          <LuTrash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>

              {materiales.length > 0 && (
                <tfoot>
                  <tr>
                    <td colSpan={4}>
                      {materiales.length} material{materiales.length === 1 ? '' : 'es'}
                    </td>
                    <td className="cell-num">{fmtNum(unidades)}</td>
                    <td colSpan={3} />
                    <td className="cell-num">{fmtMoneda(total)}</td>
                    <td />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </Panel>
      </div>

      <div className="sticky bottom-0 mt-auto border-t border-line bg-surface">
        <div className="contenedor flex items-center gap-3 py-3">
        <div className="mr-auto flex items-baseline gap-2">
          <span className="lbl">Total OC</span>
          <span className="num text-xl font-bold text-navy-800">
            {fmtMoneda(total)}
          </span>
          <span className="text-sm text-ink-3">
            {fmtNum(unidades)} unidades · {materiales.length} línea
            {materiales.length === 1 ? '' : 's'}
          </span>
        </div>

        <Button
          variant="quiet"
          disabled={!materiales.length}
          onClick={() => {
            setMateriales([])
            setPdf(null)
            avisar('Tabla de materiales vaciada.', 'alerta')
          }}
        >
          <LuRotateCcw size={14} />
          Limpiar tabla
        </Button>
        <Button variant="primary" onClick={guardar}>
          Crear OC
        </Button>
        </div>
      </div>
    </div>
  )
}
