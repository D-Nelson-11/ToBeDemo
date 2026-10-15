import { useState } from 'react'
import { LuPlane, LuSend, LuShip, LuTruck } from 'react-icons/lu'
import Modal, { FootNote } from '../components/ui/Modal'
import Button, { cx } from '../components/ui/Button'
import { Field, Input, Select, Textarea } from '../components/ui/Field'
import { useOc } from '../data/store'
import { CONTRATOS, FORWARDERS, TIPOS_CARGA, rotuloCarga } from '../data/cotizaciones'
import { fmtFechaCorta, fmtNum, toISO } from '../lib/fechas'

const MODOS = [
  { modo: 'Marítimo', icono: LuShip, sub: 'FCL · LCL' },
  { modo: 'Terrestre', icono: LuTruck, sub: 'FTL · LTL' },
  { modo: 'Aéreo', icono: LuPlane, sub: 'Carga aérea' },
]

// Las rutas por carretera arrancan en Terrestre; el resto en Marítimo.
const RUTAS_TERRESTRES = ['laredo', 'sanantonio']

const sel = (id, label, opciones) => ({ id, label, opciones, valor: () => opciones[0] })
const num = (id, label, valor) => ({ id, label, tipo: 'number', valor })
const txt = (id, label, valor) => ({ id, label, valor })

const unidades = (q) => Math.max(1, Math.ceil(q / 25000))
const bultos = [
  num('bultos', 'Número de bultos / pallets', () => 1),
  num('largo', 'Largo por bulto (cm)', () => 120),
  num('ancho', 'Ancho por bulto (cm)', () => 100),
  num('alto', 'Alto por bulto (cm)', () => 100),
]
const pesoTotal = num('peso', 'Peso total (KG)', (q) => q)
const producto = txt('producto', 'Producto / mercancía', (q, f) => f.material?.nombre ?? '')

// Lo que pide el forwarder cambia por tipo de carga: un FCL se cotiza por contenedor, un LCL por volumen.
const CAMPOS = {
  FCL: [
    sel('contenedor', 'Tipo de contenedor', ["20GP · 20' Dry", "40GP · 40' Dry", "40HC · 40' High Cube", "20RF · 20' Reefer", "40RF · 40' Reefer", 'Open Top']),
    sel('tipoCarga', 'Tipo de carga', ['Seca', 'Refrigerada', 'Congelada', 'Peligrosa (IMO)', 'Sobredimensionada']),
    num('contenedores', 'Cantidad de contenedores', unidades),
    num('pesoUnidad', 'Peso estimado por contenedor (KG)', (q) => Math.ceil(q / unidades(q))),
  ],
  LCL: [sel('tipoCarga', 'Tipo de carga', ['General seca', 'Refrigerada', 'Congelada', 'Peligrosa (IMO)']), pesoTotal, ...bultos, producto],
  FTL: [
    sel('unidad', 'Tipo / tamaño de unidad', ['Furgón 3.5 t', 'Furgón 5 t', 'Furgón 10 t', 'Furgón 20 ft', 'Furgón 40 ft', 'Plataforma', 'Refrigerado', 'Cama baja']),
    num('unidades', 'Cantidad de unidades', unidades),
    sel('tipoCarga', 'Tipo de carga', ['General seca', 'Refrigerada', 'Congelada', 'Peligrosa', 'Sobredimensionada']),
    pesoTotal,
  ],
  LTL: [sel('tipoCarga', 'Tipo de carga', ['General seca', 'Refrigerada', 'Congelada', 'Peligrosa']), pesoTotal, ...bultos, producto],
  AIR: [...bultos, num('peso', 'Peso bruto total (KG)', (q) => q), producto, num('cobrable', 'Peso volumétrico / cobrable (KG)', (q) => q)],
}

const detalleInicial = (carga, f) =>
  Object.fromEntries(CAMPOS[carga].map((c) => [c.id, String(c.valor(f.despacho.cantidad, f))]))

function Dato({ rotulo, children }) {
  return (
    <div className="min-w-0 rounded-sm border border-line bg-surface-2 px-3 py-2">
      <span className="block text-xs text-ink-3">{rotulo}</span>
      <b className="block text-sm font-bold text-ink [overflow-wrap:anywhere]">{children}</b>
    </div>
  )
}

/** Solicitud de cotización de transporte para un despacho Collect: hereda todo lo que ya sabe el despacho. */
export default function ModalCotizarTransporte({ fila: f, onClose }) {
  const { crearCotizacion, avisar } = useOc()
  const [modo, setModo] = useState(RUTAS_TERRESTRES.includes(f.ruta?.id) ? 'Terrestre' : 'Marítimo')
  const [carga, setCarga] = useState(TIPOS_CARGA[modo][0])
  const [detalle, setDetalle] = useState(() => detalleInicial(carga, f))
  const [form, setForm] = useState({
    contrato: CONTRATOS[0],
    ff: '',
    recoleccion: f.ruta?.origen ?? '',
    entrega: `${f.oc.centro}, Honduras`,
    fechaRecoleccion: toISO(f.etd),
    fechaEntrega: toISO(f.planta),
    contactoOrigen: '',
    contactoDestino: '',
    instrucciones: '',
  })
  const set = (k) => (e) => setForm((x) => ({ ...x, [k]: e.target.value }))

  const elegirCarga = (c) => {
    setCarga(c)
    setDetalle(detalleInicial(c, f))
  }
  const elegirModo = (m) => {
    setModo(m)
    elegirCarga(TIPOS_CARGA[m][0])
  }

  // Volumen calculado: solo LCL lo muestra, porque es lo que el forwarder cobra.
  const volumen =
    ((Number(detalle.largo) || 0) * (Number(detalle.ancho) || 0) * (Number(detalle.alto) || 0) * (Number(detalle.bultos) || 1)) /
    1e6

  const falta = !form.ff
    ? 'Falta el freight forwarder.'
    : !form.recoleccion.trim() || !form.entrega.trim()
      ? 'Faltan las direcciones de recolección y entrega.'
      : null

  const enviar = () => {
    const id = crearCotizacion({
      clave: f.clave,
      ff: form.ff,
      estado: 'En proceso de cotización',
      fecha: toISO(new Date()),
      modo,
      carga,
      nota: 'Solicitud enviada al freight forwarder',
      recordatorios: 0,
      ...form,
      detalle,
    })
    avisar(`Solicitud ${id} enviada a ${form.ff}: queda en proceso de cotización.`, 'ok')
    onClose()
  }

  const heredado = [
    ['OC', f.oc.id],
    ['Despacho', f.despacho.id],
    ['Proveedor', f.oc.proveedor],
    ['Producto', f.material?.nombre],
    ['SKU', f.material?.codigo],
    ['Cantidad a importar', `${fmtNum(f.despacho.cantidad)} ${f.material?.unidad ?? ''}`],
    ['Incoterm', f.oc.incoterm],
    ['Origen', f.ruta?.origen],
    ['Aduana de importación', f.ruta?.frontera],
    ['Destino / planta', f.oc.centro],
    ['ETD salida', fmtFechaCorta(f.etd)],
    ['ETA planta', fmtFechaCorta(f.planta)],
  ]

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      eyebrow={`OC ${f.oc.id} · ${f.material?.nombre} · ${fmtNum(f.despacho.cantidad)} ${f.material?.unidad ?? ''}`}
      title={`Solicitar cotización · ${f.despacho.id}`}
      footer={
        <>
          <FootNote>{falta ?? `Se envía a ${form.ff} como ${modo} · ${rotuloCarga(carga)}.`}</FootNote>
          <Button variant="quiet" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" disabled={!!falta} onClick={enviar}>
            <LuSend size={14} /> Enviar al freight forwarder
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div>
          <div className="lbl mb-2">Información heredada del despacho</div>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            {heredado.map(([k, v]) => (
              <Dato key={k} rotulo={k}>
                {v || '—'}
              </Dato>
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="panel-head">
            <span className="panel-title">1 · Modalidad de transporte</span>
          </div>
          <div className="flex flex-col gap-3 p-4">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {MODOS.map(({ modo: m, icono: Icono, sub }) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => elegirModo(m)}
                  className={cx(
                    'flex items-center gap-3 rounded-sm border px-3 py-2.5 text-left transition-colors duration-100',
                    modo === m ? 'border-teal-600 bg-teal-50 shadow-[inset_0_0_0_1px_var(--color-teal-600)]' : 'border-line hover:bg-surface-2',
                  )}
                >
                  <Icono size={18} className={modo === m ? 'text-teal-700' : 'text-ink-3'} />
                  <span>
                    <b className="block text-base font-bold text-ink">{m}</b>
                    <span className="block text-xs text-ink-3">{sub}</span>
                  </span>
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              {TIPOS_CARGA[modo].map((c) => (
                <Button key={c} size="sm" variant={carga === c ? 'primary' : 'secondary'} onClick={() => elegirCarga(c)}>
                  {rotuloCarga(c)}
                </Button>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Field label="Modalidad de contrato / tramo">
                <Select options={CONTRATOS} value={form.contrato} onChange={set('contrato')} />
              </Field>
              <Field label="Incoterm del despacho">
                <Input value={f.oc.incoterm} readOnly />
              </Field>
              <Field label="Freight forwarder a cotizar" required>
                <Select placeholder="Selecciona un proveedor de transporte" options={FORWARDERS} value={form.ff} onChange={set('ff')} />
              </Field>
            </div>

            <div className="lbl mt-1">Detalle {rotuloCarga(carga)}</div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {CAMPOS[carga].map((c) => (
                <Field key={c.id} label={c.label} required>
                  {c.opciones ? (
                    <Select options={c.opciones} value={detalle[c.id]} onChange={(e) => setDetalle((d) => ({ ...d, [c.id]: e.target.value }))} />
                  ) : (
                    <Input
                      type={c.tipo ?? 'text'}
                      min={c.tipo ? 1 : undefined}
                      numeric={c.tipo === 'number'}
                      value={detalle[c.id]}
                      onChange={(e) => setDetalle((d) => ({ ...d, [c.id]: e.target.value }))}
                    />
                  )}
                </Field>
              ))}
              {carga === 'LCL' && (
                <Field label="Volumen total calculado (m³)">
                  <Input numeric readOnly value={volumen.toFixed(3)} />
                </Field>
              )}
            </div>
          </div>
        </div>

        <div className="panel">
          <div className="panel-head">
            <span className="panel-title">2 · Recolección, entrega y solicitud</span>
          </div>
          <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2">
            <Field label="Dirección de recolección" required>
              <Input value={form.recoleccion} onChange={set('recoleccion')} />
            </Field>
            <Field label="Dirección de entrega" required>
              <Input value={form.entrega} onChange={set('entrega')} />
            </Field>
            <Field label="Fecha requerida de recolección">
              <Input type="date" date value={form.fechaRecoleccion} onChange={set('fechaRecoleccion')} />
            </Field>
            <Field label="Fecha límite en destino">
              <Input type="date" date value={form.fechaEntrega} onChange={set('fechaEntrega')} />
            </Field>
            <Field label="Contacto en origen">
              <Input placeholder="Nombre / correo / teléfono" value={form.contactoOrigen} onChange={set('contactoOrigen')} />
            </Field>
            <Field label="Contacto en destino">
              <Input placeholder="Nombre / correo / teléfono" value={form.contactoDestino} onChange={set('contactoDestino')} />
            </Field>
            <Field label="Instrucciones para el freight forwarder" className="sm:col-span-2">
              <Textarea
                placeholder="Requisitos de manejo, horario de carga, documentos…"
                value={form.instrucciones}
                onChange={set('instrucciones')}
              />
            </Field>
          </div>
        </div>
      </div>
    </Modal>
  )
}
