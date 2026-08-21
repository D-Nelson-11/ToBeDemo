import { useEffect, useMemo, useState } from 'react'
import {
  LuCalendarClock,
  LuCircleAlert,
  LuCircleCheck,
  LuListChecks,
  LuFileText,
  LuMilestone,
  LuPaperclip,
  LuPlus,
  LuSave,
  LuScanText,
  LuShip,
  LuTrash2,
  LuTriangleAlert,
} from 'react-icons/lu'
import Button, { cx } from '../components/ui/Button'
import { Field, Input, Select, Textarea } from '../components/ui/Field'
import { useOc } from '../data/store'
import { INCOTERMS, MONEDAS, REGIMENES, RUTAS } from '../data/catalogos'
import { addDays, fmtFechaCorta, fmtNum, hoy, parseISO, toISO } from '../lib/fechas'

// ---------------------------------------------------------------------------
// Los campos van en configuración y no sueltos en el JSX: así el formulario, el
// llenado por OCR y el cálculo de "qué falta" salen todos de la misma lista.
// ---------------------------------------------------------------------------
const CAMPOS_FACTURA = [
  { id: 'factura', label: 'Factura', badge: 'De factura', req: true },
  { id: 'fechaFactura', label: 'Fecha factura', tipo: 'date', badge: 'De factura', req: true },
  { id: 'telefono', label: 'Teléfono', badge: 'De factura' },
  { id: 'blDoc', label: 'BL / Doc. transporte', badge: 'De factura / BL', req: true },
  { id: 'moneda', label: 'Moneda', tipo: 'select', opciones: MONEDAS, req: true },
  { id: 'incoterm', label: 'Incoterm', tipo: 'select', opciones: INCOTERMS, req: true },
  { id: 'refIdis', label: 'Referencia IDIS' },
  { id: 'fechaIdis', label: 'Fecha IDIS', tipo: 'date' },
]

const CAMPOS_BL = [
  { id: 'shipper', label: 'Shipper (embarcador)', req: true },
  { id: 'consignee', label: 'Consignee (consignatario)', req: true },
  { id: 'notify', label: 'Notify party' },
  { id: 'naviera', label: 'Naviera', req: true },
  { id: 'numeroBl', label: 'Número de BL', req: true },
  { id: 'buque', label: 'Buque / Viaje' },
  { id: 'pol', label: 'Puerto de carga (POL)', req: true },
  { id: 'pod', label: 'Puerto de descarga (POD)', req: true },
  { id: 'fechaEmbarque', label: 'Fecha de embarque', tipo: 'date', req: true },
  { id: 'contenedores', label: 'Contenedor(es)', req: true },
  { id: 'sello', label: 'Sello (seal)' },
  { id: 'tipoCarga', label: 'Tipo de carga', tipo: 'select', opciones: ['FCL', 'LCL'], req: true },
  { id: 'pesoBruto', label: 'Peso bruto (kg)', req: true },
  { id: 'volumen', label: 'Volumen (CBM)' },
].map((c) => ({ ...c, badge: 'De BL' }))

const TABS = [
  { id: 'factura', rotulo: 'Factura', icono: LuFileText, campos: CAMPOS_FACTURA },
  { id: 'bl', rotulo: 'BL', icono: LuShip, campos: CAMPOS_BL },
]

const GESTION_VACIA = {
  factura: {},
  bl: {},
  skus: [],
  isv: false,
  flete: '',
  seguro: '',
  instrucciones: '',
  observaciones: '',
  regimen: '',
}

const uid = () => Math.random().toString(36).slice(2)

/** Lo que "lee" el OCR de cada documento. */
function ocrFactura(fila, cantidadTotal) {
  return {
    valores: {
      factura: `FAC-${fila.despacho.id.replace('-', '')}${fila.oc.id.slice(-4)}`,
      fechaFactura: toISO(hoy()),
      telefono: '+1 562 802 4020',
      blDoc: `MAEU${fila.oc.id.slice(-7)}`,
      moneda: fila.oc.moneda,
      incoterm: fila.oc.incoterm,
    },
    skus: [
      {
        uid: uid(),
        codigo: fila.material?.codigo ?? '1001551',
        descripcion: fila.material?.nombre ?? 'Material',
        cantidad: cantidadTotal,
        peso: cantidadTotal,
        unitario: fila.material?.precio ?? 0.5,
      },
      {
        uid: uid(),
        codigo: '9000114',
        descripcion: 'Tarima de madera tratada',
        cantidad: 22,
        peso: 396,
        unitario: 14.5,
      },
      {
        uid: uid(),
        codigo: '9000205',
        descripcion: 'Termógrafo de contenedor',
        cantidad: 1,
        peso: 2,
        unitario: 68,
      },
    ],
  }
}

function ocrBl(fila) {
  return {
    shipper: fila.oc.proveedor,
    consignee: 'CORPORACIÓN DINANT S.A',
    notify: 'CORPORACIÓN DINANT S.A',
    naviera: 'MAERSK LINE',
    numeroBl: `MAEU${fila.oc.id.slice(-7)}`,
    buque: 'MAERSK SENTOSA / 431W',
    pol: fila.ruta?.origen ?? 'Long Beach, CA',
    pod: fila.ruta?.frontera ?? 'Pto. Cortés',
    fechaEmbarque: fila.etd ? toISO(fila.etd) : '',
    contenedores: 'MRKU7761243, MRKU7761250',
    sello: 'HN-884213',
    tipoCarga: 'FCL',
    pesoBruto: '18420',
    volumen: '54.6',
  }
}

/** Campos requeridos sin llenar en una pestaña. */
function faltantes(valores, campos) {
  return campos.filter((c) => c.req && !String(valores?.[c.id] ?? '').trim())
}

function Campo({ campo, valor, onChange }) {
  const control =
    campo.tipo === 'select' ? (
      <Select placeholder="Seleccionar…" options={campo.opciones} value={valor ?? ''} onChange={onChange} />
    ) : (
      <Input
        date={campo.tipo === 'date'}
        type={campo.tipo === 'date' ? 'date' : 'text'}
        placeholder={campo.tipo === 'date' ? undefined : 'Se completa con OCR'}
        value={valor ?? ''}
        onChange={onChange}
      />
    )

  return (
    <Field
      label={
        <>
          {campo.label}
          {campo.req && <span className="text-rojo-600">*</span>}
          {campo.badge && (
            <span className="rounded-xs bg-navy-50 px-1.5 py-px text-3xs font-bold text-navy-600">
              {campo.badge}
            </span>
          )}
        </>
      }
    >
      {control}
    </Field>
  )
}

function CampoFijo({ label, valor }) {
  return (
    <Field
      label={
        <>
          {label}
          <span className="rounded-xs bg-surface-3 px-1.5 py-px text-3xs font-bold text-ink-3">
            Precargado
          </span>
        </>
      }
    >
      <Input value={valor ?? '—'} disabled readOnly />
    </Field>
  )
}

export default function Gestiones() {
  const { ordenes, avisar } = useOc()
  const [tab, setTab] = useState('factura')
  const [panel, setPanel] = useState(null)
  const [sel, setSel] = useState(() => new Set())
  const [datos, setDatos] = useState({})

  // Los despachos ya programados son los que necesitan gestión aduanera.
  const despachos = useMemo(() => {
    const out = []
    ordenes
      .filter((oc) => oc.activa)
      .forEach((oc) =>
        oc.despachos.forEach((d) => {
          const ruta = RUTAS[d.ruta] ?? RUTAS.longbeach
          const etd = parseISO(d.salida)
          out.push({
            clave: `${oc.id}-${d.id}`,
            oc,
            despacho: d,
            ruta,
            etd,
            planta: etd ? addDays(etd, ruta.leg1 + ruta.leg2) : null,
            material: oc.materiales.find((m) => m.codigo === d.material) ?? oc.materiales[0],
          })
        }),
      )
    return out
  }, [ordenes])

  // Una gestión solo puede cubrir despachos de la misma OC y por la misma ruta:
  // comparten factura, BL y trámite aduanero. Por eso el grupo es OC + ruta.
  const grupos = useMemo(() => {
    const m = new Map()
    despachos.forEach((d) => {
      const clave = d.oc.id + '|' + d.ruta.id
      if (!m.has(clave)) m.set(clave, { clave, oc: d.oc, ruta: d.ruta, items: [] })
      m.get(clave).items.push(d)
    })
    return [...m.values()]
  }, [despachos])

  // Siempre hay al menos uno seleccionado: la pantalla no tiene estado vacío útil.
  useEffect(() => {
    if (!sel.size && despachos.length) setSel(new Set([despachos[0].clave]))
  }, [despachos, sel.size])

  const seleccionadas = despachos.filter((d) => sel.has(d.clave))
  const fila = seleccionadas[0] ?? despachos[0] ?? null
  const grupoActivo = fila ? fila.oc.id + '|' + fila.ruta.id : null
  const cantidadTotal = seleccionadas.reduce((a, d) => a + d.despacho.cantidad, 0)

  const g = (fila && datos[fila.clave]) || GESTION_VACIA

  // Cada cambio se escribe en todos los despachos marcados: el trámite es uno solo.
  const setG = (patch) =>
    setDatos((prev) => {
      const next = { ...prev }
      const destinos = seleccionadas.length ? seleccionadas : [fila]
      destinos.forEach((d) => {
        next[d.clave] = { ...(prev[d.clave] ?? GESTION_VACIA), ...patch }
      })
      return next
    })
  const setCampo = (lista, id, valor) => setG({ [lista]: { ...g[lista], [id]: valor } })

  // Dentro del grupo activo el check suma o resta, sin dejar la selección vacía.
  // Marcar algo de otro grupo reemplaza la selección: nunca se mezclan OC ni rutas.
  const alternar = (d) =>
    setSel((prev) => {
      if (d.oc.id + '|' + d.ruta.id !== grupoActivo) return new Set([d.clave])
      const s = new Set(prev)
      if (s.has(d.clave)) {
        if (s.size === 1) return prev
        s.delete(d.clave)
      } else {
        s.add(d.clave)
      }
      return s
    })

  const marcarGrupo = (grupo, todos) =>
    setSel(new Set(todos ? grupo.items.map((d) => d.clave) : [grupo.items[0].clave]))

  // Estado de llenado: alimenta las pestañas, el aviso y el botón de procesar.
  const estado = useMemo(() => {
    const porTab = {}
    TABS.forEach((t) => {
      const falta = faltantes(g[t.id], t.campos)
      porTab[t.id] = { falta, total: t.campos.filter((c) => c.req).length }
    })
    // La factura además necesita al menos una línea de SKU.
    const sinSkus = g.skus.length === 0
    return { porTab, sinSkus }
  }, [g])

  const totales = useMemo(() => {
    const sub = g.skus.reduce((a, s) => a + (Number(s.cantidad) || 0) * (Number(s.unitario) || 0), 0)
    const isv = g.isv ? sub * 0.15 : 0
    const flete = Number(g.flete) || 0
    const seguro = Number(g.seguro) || 0
    return { sub, isv, flete, seguro, total: sub + isv + flete + seguro }
  }, [g])

  if (!fila) {
    return (
      <div className="contenedor py-10">
        <div className="panel flex flex-col items-center gap-2 p-10 text-center">
          <LuShip size={26} strokeWidth={1.5} className="text-navy-200" />
          <span className="text-base font-semibold text-ink-2">No hay despachos programados</span>
          <span className="text-sm text-ink-3">Programá despachos en el paso 2 para gestionarlos acá.</span>
        </div>
      </div>
    )
  }

  const otroTab = TABS.find((t) => t.id !== tab)
  const faltaOtro = estado.porTab[otroTab.id].falta
  const faltaEste = estado.porTab[tab].falta
  const listo = !estado.porTab.factura.falta.length && !estado.porTab.bl.falta.length && !estado.sinSkus

  function usarOcr() {
    if (tab === 'factura') {
      const { valores, skus } = ocrFactura(fila, cantidadTotal)
      setG({ factura: { ...g.factura, ...valores }, skus })
      avisar(`OCR de factura: ${Object.keys(valores).length} campos y ${skus.length} SKU extraídos.`, 'ok')
    } else {
      const valores = ocrBl(fila)
      setG({ bl: { ...g.bl, ...valores } })
      avisar(`OCR de BL: ${Object.keys(valores).length} campos extraídos.`, 'ok')
    }
  }

  return (
    <div className="min-h-full">
      <div className="contenedor grid grid-cols-1 items-start gap-4 py-5 lg:grid-cols-[320px_minmax(0,1fr)]">
        {/* ------------------------------- izquierda ------------------------------ */}
        <div className="flex flex-col gap-4">
          <div className="panel">
            <div className="panel-head">
              <span className="panel-title">Despachos</span>
              <span className="num ml-auto text-xs text-ink-3">{despachos.length}</span>
            </div>
            <p className="border-b border-line bg-surface-2 px-3 py-2 text-sm text-ink-3">
              Se pueden marcar varios despachos, siempre que sean de la misma OC y por la misma
              ruta. Marcar uno de otro grupo reemplaza la selección.
            </p>
            <ul className="tabla-scroll m-0 list-none p-0">
              {grupos.map((grupo) => {
                const { oc, ruta, items } = grupo
                const activo = grupo.clave === grupoActivo
                const todos = items.every((d) => sel.has(d.clave))
                return (
                  <li key={grupo.clave}>
                    <div
                      className={cx(
                        'flex items-start gap-2 border-b border-line px-3 py-2',
                        activo ? 'bg-navy-50' : 'bg-surface-3',
                      )}
                    >
                      <input
                        type="checkbox"
                        className="chk mt-0.5"
                        aria-label={'Seleccionar los despachos de la OC ' + oc.id + ' por ' + ruta.frontera}
                        checked={todos}
                        ref={(el) => {
                          if (el) {
                            const n = items.filter((d) => sel.has(d.clave)).length
                            el.indeterminate = n > 0 && n < items.length
                          }
                        }}
                        onChange={(e) => marcarGrupo(grupo, e.target.checked)}
                      />
                      <span className="min-w-0 flex-1">
                        <span
                          className={cx(
                            'block text-sm font-bold',
                            activo ? 'text-navy-800' : 'text-ink-3',
                          )}
                        >
                          OC {oc.id}
                        </span>
                        {/* La ruta es parte de la identidad del grupo: no se pueden mezclar */}
                        <span className="block truncate text-xs text-ink-3">
                          {ruta.origen} → {ruta.frontera}
                        </span>
                      </span>
                      <span className="num mt-0.5 text-xs text-ink-3">{items.length}</span>
                    </div>

                    {items.map((d) => {
                      const dg = datos[d.clave]
                      const completo =
                        dg &&
                        !faltantes(dg.factura, CAMPOS_FACTURA).length &&
                        !faltantes(dg.bl, CAMPOS_BL).length &&
                        dg.skus.length > 0
                      const iniciado =
                        dg && (Object.keys(dg.factura).length || Object.keys(dg.bl).length)
                      const marcado = sel.has(d.clave)
                      return (
                        <div
                          key={d.clave}
                          className={cx(
                            'flex items-center gap-2 border-b border-line-soft px-3 py-2 transition-colors duration-100',
                            marcado ? 'bg-navy-50' : 'hover:bg-surface-2',
                          )}
                        >
                          <input
                            type="checkbox"
                            className="chk"
                            aria-label={'Seleccionar ' + d.despacho.id}
                            checked={marcado}
                            onChange={() => alternar(d)}
                          />
                          <button
                            onClick={() => alternar(d)}
                            className="min-w-0 flex-1 text-left"
                            title={activo ? undefined : 'Reemplaza la selección actual'}
                          >
                            <span className="block text-base font-bold text-ink">
                              {d.despacho.id}
                            </span>
                            <span className="block truncate text-sm text-ink-3">
                              {fmtNum(d.despacho.cantidad)} {d.material?.unidad} ·{' '}
                              {d.etd ? fmtFechaCorta(d.etd) : '—'}
                            </span>
                          </button>
                          <span
                            className={cx(
                              'shrink-0 whitespace-nowrap rounded-full px-2 py-[3px] text-xs font-semibold',
                              completo
                                ? 'bg-teal-50 text-teal-700'
                                : iniciado
                                  ? 'bg-ambar-50 text-ambar-700'
                                  : 'bg-surface-3 text-ink-3',
                            )}
                          >
                            {completo ? 'Completo' : iniciado ? 'En proceso' : 'Sin iniciar'}
                          </span>
                        </div>
                      )
                    })}
                  </li>
                )
              })}
            </ul>
          </div>

          <div className="panel">
            <div className="panel-head">
              <span className="panel-title">
                Cargar {tab === 'factura' ? 'factura' : 'BL'}
              </span>
            </div>
            <div className="flex flex-col gap-3 p-4">
              {/* El tab manda: elige el documento que se carga y la extracción que se ve */}
              <div className="segbar w-full">
                {TABS.map((t) => {
                  const falta = estado.porTab[t.id].falta.length + (t.id === 'factura' && estado.sinSkus ? 1 : 0)
                  return (
                    <button
                      key={t.id}
                      onClick={() => setTab(t.id)}
                      className={cx('seg flex-1 justify-center', tab === t.id && 'seg-on')}
                    >
                      <t.icono size={13} />
                      {t.rotulo}
                      {falta === 0 ? (
                        <LuCircleCheck
                          size={13}
                          className={tab === t.id ? 'text-teal-100' : 'text-teal-600'}
                        />
                      ) : (
                        <span
                          title={`${falta} dato${falta === 1 ? '' : 's'} sin llenar`}
                          className={cx(
                            'num rounded-full px-1.5 text-3xs font-bold',
                            tab === t.id ? 'bg-white/20 text-white' : 'bg-ambar-50 text-ambar-700',
                          )}
                        >
                          {falta}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>

              <button
                onClick={usarOcr}
                className="flex flex-col items-center gap-1 rounded-sm border border-dashed border-line-strong bg-surface-2 px-4 py-6 text-center transition-colors duration-100 hover:border-navy-600 hover:bg-navy-50"
              >
                <LuPaperclip size={18} className="text-navy-400" />
                <span className="text-base text-ink-2">
                  Arrastrá aquí el PDF de la {tab === 'factura' ? 'factura' : 'BL'}
                </span>
                <span className="text-sm text-ink-3">o hacé clic para buscar el archivo</span>
              </button>

              <Button variant="primary" block onClick={usarOcr}>
                <LuScanText size={14} />
                Usar OCR
              </Button>

              {/* Ruta del trámite: sale de la ruta ya elegida en el paso 2 */}
              <div className="rounded-sm border border-line bg-surface-2 p-3">
                <div className="lbl mb-2">
                  <LuMilestone size={13} /> Ruta del trámite
                </div>
                <ol className="m-0 list-none space-y-2.5 p-0">
                  {[
                    [fila.ruta.origen, 'Salida planta proveedor', fila.etd],
                    [fila.ruta.frontera, 'Embarque · BL asociado', fila.etd],
                    [`Aduana ${fila.ruta.frontera}`, 'Régimen de importación', null],
                    [fila.oc.centro, 'Entrega final', fila.planta],
                  ].map(([etapa, detalle, fecha], i) => (
                    <li key={i} className="flex gap-2.5">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-navy-400" />
                      <span className="min-w-0">
                        <span className="block text-sm font-bold text-ink">{etapa}</span>
                        <span className="block text-xs text-ink-3">
                          {detalle}
                          {fecha && <span className="num"> · {fmtFechaCorta(fecha)}</span>}
                        </span>
                      </span>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Acciones laterales: abren un panel a la vez, no navegan a otro lado */}
              <div className="segbar w-full">
                {[
                  ['checklist', 'Checklist', LuListChecks],
                  ['regimen', 'Régimen', LuFileText],
                  ['eta', 'ETA', LuCalendarClock],
                ].map(([id, rotulo, Icono]) => (
                  <button
                    key={id}
                    onClick={() => setPanel(panel === id ? null : id)}
                    className={cx('seg flex-1 justify-center', panel === id && 'seg-on')}
                  >
                    <Icono size={13} />
                    {rotulo}
                  </button>
                ))}
              </div>

              {panel === 'checklist' && (
                <div className="rounded-sm border border-line bg-surface-2 p-3">
                  <div className="lbl mb-2">Avance de checklists</div>
                  <ul className="m-0 flex list-none flex-col gap-2 p-0">
                    {seleccionadas.map((d) => (
                      <li key={d.clave} className="flex items-center gap-2 text-sm">
                        <span className="font-bold text-ink">{d.despacho.id}</span>
                        <span className="ml-auto text-ink-3">
                          Aduana{' '}
                          <b className="num font-bold text-ink">
                            {(d.despacho.aduana ?? []).filter(Boolean).length}/
                            {(d.despacho.aduana ?? []).length}
                          </b>
                          {' · '}Logístico{' '}
                          <b className="num font-bold text-ink">
                            {(d.despacho.logistica ?? []).filter(Boolean).length}/
                            {(d.despacho.logistica ?? []).length}
                          </b>
                        </span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-2 text-xs text-ink-3">Se marcan en el paso 3, Seguimiento.</p>
                </div>
              )}

              {panel === 'regimen' && (
                <div className="rounded-sm border border-line bg-surface-2 p-3">
                  <Field
                    label="Régimen aduanero"
                    hint="Define el trámite y los impuestos aplicables."
                  >
                    <Select
                      placeholder="Seleccionar…"
                      options={REGIMENES}
                      value={g.regimen}
                      onChange={(e) => setG({ regimen: e.target.value })}
                    />
                  </Field>
                </div>
              )}

              {panel === 'eta' && (
                <div className="rounded-sm border border-line bg-surface-2 p-3">
                  <div className="lbl mb-2">Fechas de la ruta</div>
                  <ul className="m-0 flex list-none flex-col gap-1.5 p-0 text-sm">
                    {[
                      ['Salida proveedor', fila.etd],
                      ['ETA frontera', fila.etd ? addDays(fila.etd, fila.ruta.leg1) : null],
                      ['ETA planta', fila.planta],
                    ].map(([rotulo, fecha]) => (
                      <li key={rotulo} className="flex items-center gap-2">
                        <span className="text-ink-2">{rotulo}</span>
                        <span className="num ml-auto font-bold text-ink">
                          {fecha ? fmtFechaCorta(fecha) : '—'}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-2 text-xs text-ink-3">
                    Tránsito total {fila.ruta.leg1 + fila.ruta.leg2} días por {fila.ruta.frontera}.
                    Se reprograma en el paso 3.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ------------------------------- derecha -------------------------------- */}
        <div className="panel">
          <div className="panel-head">
            <span className="panel-title">
              {tab === 'factura' ? <LuFileText size={14} /> : <LuShip size={14} />}
              Extracción de {tab === 'factura' ? 'factura' : 'BL'}
            </span>
            <span className="ml-auto text-sm text-ink-3">
              {fila.oc.id} ·{' '}
              <b className="font-bold text-ink">
                {seleccionadas.map((d) => d.despacho.id).join(', ')}
              </b>
              {seleccionadas.length > 1 && ' · un solo trámite'}
            </span>
          </div>

          <div className="flex flex-col gap-4 p-4">
            {/* Aviso de lo que falta: primero en esta pestaña, después en la otra */}
            {faltaEste.length > 0 && (
              <div className="flex items-start gap-2.5 rounded-sm border border-ambar-100 bg-ambar-50 px-3 py-2.5 text-sm text-ambar-700">
                <LuCircleAlert size={15} className="mt-px shrink-0" />
                <span>
                  Falta información en <b className="font-bold">{tab === 'factura' ? 'Factura' : 'BL'}</b>:{' '}
                  {faltaEste.map((c) => c.label).join(', ')}.
                </span>
              </div>
            )}

            {faltaOtro.length > 0 && (
              <div className="flex flex-wrap items-center gap-2.5 rounded-sm border border-line bg-surface-2 px-3 py-2.5 text-sm text-ink-2">
                <LuTriangleAlert size={15} className="shrink-0 text-ambar-600" />
                <span className="min-w-0 flex-1">
                  La pestaña <b className="font-bold text-ink">{otroTab.rotulo}</b> tiene{' '}
                  <b className="font-bold text-ink">{faltaOtro.length}</b> dato
                  {faltaOtro.length === 1 ? '' : 's'} sin llenar: {faltaOtro.map((c) => c.label).join(', ')}.
                </span>
                <Button variant="link" onClick={() => setTab(otroTab.id)}>
                  Ir a {otroTab.rotulo}
                </Button>
              </div>
            )}

            {/* ---- pestaña Factura ---- */}
            {tab === 'factura' && (
              <>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  <CampoFijo label="Cliente" valor={fila.oc.organizacion} />
                  <CampoFijo label="Proveedor" valor={fila.oc.proveedor} />
                  <CampoFijo label="Dirección" valor={fila.ruta.origen} />
                  {CAMPOS_FACTURA.slice(0, 4).map((c) => (
                    <Campo
                      key={c.id}
                      campo={c}
                      valor={g.factura[c.id]}
                      onChange={(e) => setCampo('factura', c.id, e.target.value)}
                    />
                  ))}
                  <CampoFijo label="RTN" valor="08019022438598" />
                  <CampoFijo label="Forma de pago" valor={fila.oc.condPago} />
                  <CampoFijo
                    label="Despachos"
                    valor={seleccionadas.map((d) => d.despacho.id).join(', ')}
                  />
                  {CAMPOS_FACTURA.slice(4).map((c) => (
                    <Campo
                      key={c.id}
                      campo={c}
                      valor={g.factura[c.id]}
                      onChange={(e) => setCampo('factura', c.id, e.target.value)}
                    />
                  ))}
                </div>

                <div className="flex flex-wrap gap-3">
                  {['Detalle XLSX', 'Factura PDF'].map((x) => (
                    <div
                      key={x}
                      className="flex flex-1 items-center gap-3 rounded-sm border border-line bg-surface-2 px-3 py-2"
                    >
                      <span className="flex-1 text-sm font-bold text-ink-2">{x}</span>
                      <Button size="sm" onClick={() => avisar(`${x} adjuntado (demo).`, 'ok')}>
                        <LuPaperclip size={12} />
                        Adjuntar
                      </Button>
                    </div>
                  ))}
                </div>

                <div>
                  <div className="mb-2 flex items-center gap-3">
                    <span className="panel-title">SKU extraídos de la factura</span>
                    <span className="h-px flex-1 bg-line" />
                    <Button
                      variant="link"
                      onClick={() =>
                        setG({
                          skus: [
                            ...g.skus,
                            { uid: uid(), codigo: '', descripcion: '', cantidad: 0, peso: 0, unitario: 0 },
                          ],
                        })
                      }
                    >
                      <LuPlus size={13} />
                      Agregar línea
                    </Button>
                  </div>

                  <div className="panel tabla-scroll">
                    <table className="tbl">
                      <thead>
                        <tr>
                          <th className="w-[52px]">Línea</th>
                          <th className="w-[120px]">Código ERP</th>
                          <th>Descripción</th>
                          <th className="w-[110px] text-right!">Cantidad</th>
                          <th className="w-[110px] text-right!">Peso (kg)</th>
                          <th className="w-[110px] text-right!">Valor unit.</th>
                          <th className="w-[120px] text-right!">Total</th>
                          <th className="w-[44px]" />
                        </tr>
                      </thead>
                      <tbody>
                        {g.skus.length === 0 && (
                          <tr>
                            <td colSpan={8} className="h-[120px]! bg-surface text-center text-sm text-ink-3">
                              Los SKU se ordenarán aquí automáticamente al cargar la factura con OCR.
                            </td>
                          </tr>
                        )}
                        {g.skus.map((s, i) => (
                          <tr key={s.uid}>
                            <td className="cell-num text-ink-3">{String(i + 1).padStart(2, '0')}</td>
                            {['codigo', 'descripcion'].map((k) => (
                              <td key={k}>
                                <input
                                  className={cx('cellinp', k === 'codigo' && 'cellinp-num text-left!')}
                                  value={s[k]}
                                  onChange={(e) =>
                                    setG({
                                      skus: g.skus.map((x) =>
                                        x.uid === s.uid ? { ...x, [k]: e.target.value } : x,
                                      ),
                                    })
                                  }
                                />
                              </td>
                            ))}
                            {['cantidad', 'peso', 'unitario'].map((k) => (
                              <td key={k}>
                                <input
                                  className="cellinp cellinp-num"
                                  type="number"
                                  step="0.01"
                                  value={s[k]}
                                  onChange={(e) =>
                                    setG({
                                      skus: g.skus.map((x) =>
                                        x.uid === s.uid ? { ...x, [k]: e.target.value } : x,
                                      ),
                                    })
                                  }
                                />
                              </td>
                            ))}
                            <td className="cell-num cell-strong">
                              {fmtNum((Number(s.cantidad) || 0) * (Number(s.unitario) || 0), 2)}
                            </td>
                            <td>
                              <div className="flex justify-end">
                                <button
                                  className="ico ico-rojo"
                                  title="Quitar línea"
                                  onClick={() => setG({ skus: g.skus.filter((x) => x.uid !== s.uid) })}
                                >
                                  <LuTrash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="flex justify-end">
                  <div className="w-full max-w-[360px] rounded-sm border border-line">
                    {[
                      ['SubTotal', fmtNum(totales.sub, 2), null],
                      [
                        <label key="isv" className="flex cursor-pointer items-center gap-2">
                          <input
                            type="checkbox"
                            className="chk"
                            checked={g.isv}
                            onChange={(e) => setG({ isv: e.target.checked })}
                          />
                          ISV (15%)
                        </label>,
                        fmtNum(totales.isv, 2),
                        null,
                      ],
                      ['Flete', null, 'flete'],
                      ['Seguro', null, 'seguro'],
                    ].map(([rotulo, valor, campo], i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 border-b border-line-soft px-3 py-2 text-base"
                      >
                        <span className="flex-1 text-ink-2">{rotulo}</span>
                        {campo ? (
                          <input
                            className="cellinp cellinp-num w-24 border-line!"
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={g[campo]}
                            onChange={(e) => setG({ [campo]: e.target.value })}
                          />
                        ) : (
                          <span className="num">{valor}</span>
                        )}
                      </div>
                    ))}
                    <div className="flex items-center gap-3 bg-surface-2 px-3 py-2.5">
                      <span className="flex-1 font-bold text-ink">Total</span>
                      <span className="num text-lg font-bold text-navy-800">
                        {fmtNum(totales.total, 2)}
                      </span>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* ---- pestaña BL ---- */}
            {tab === 'bl' && (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {CAMPOS_BL.map((c) => (
                  <Campo
                    key={c.id}
                    campo={c}
                    valor={g.bl[c.id]}
                    onChange={(e) => setCampo('bl', c.id, e.target.value)}
                  />
                ))}
              </div>
            )}

            {/* ---- común a las dos pestañas ---- */}
            <div className="grid grid-cols-1 gap-4 border-t border-line pt-4 md:grid-cols-2">
              <Field
                label="Instrucciones aduaneras"
                hint="Llenado manual — no se completa con OCR."
              >
                <Textarea
                  placeholder="Documentos adicionales, condiciones especiales, permisos, indicaciones para el agente aduanero…"
                  value={g.instrucciones}
                  onChange={(e) => setG({ instrucciones: e.target.value })}
                />
              </Field>
              <Field label="Observaciones">
                <Textarea
                  placeholder="Favor dejar sus observaciones."
                  value={g.observaciones}
                  onChange={(e) => setG({ observaciones: e.target.value })}
                />
              </Field>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 border-t border-line bg-surface-2 px-4 py-3">
            <span className="min-w-0 flex-1 text-sm">
              {listo ? (
                <span className="flex items-center gap-1.5 text-teal-700">
                  <LuCircleCheck size={14} />
                  Factura y BL completos: el despacho se puede procesar.
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-ambar-700">
                  <LuTriangleAlert size={14} />
                  {[
                    estado.porTab.factura.falta.length &&
                      `Factura: ${estado.porTab.factura.falta.length} dato${estado.porTab.factura.falta.length === 1 ? '' : 's'}`,
                    estado.sinSkus && 'Factura: sin SKU',
                    estado.porTab.bl.falta.length &&
                      `BL: ${estado.porTab.bl.falta.length} dato${estado.porTab.bl.falta.length === 1 ? '' : 's'}`,
                  ]
                    .filter(Boolean)
                    .join(' · ')}{' '}
                  sin llenar.
                </span>
              )}
            </span>
            <Button onClick={() => avisar('Borrador guardado.', 'ok')}>
              <LuSave size={14} />
              Guardar borrador
            </Button>
            <Button
              variant="primary"
              disabled={!listo}
              onClick={() =>
                avisar(
                  `OC ${fila.oc.id}: ${seleccionadas.length} despacho${seleccionadas.length === 1 ? '' : 's'} procesado${seleccionadas.length === 1 ? '' : 's'}.`,
                  'ok',
                )
              }
            >
              Procesar despacho
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
