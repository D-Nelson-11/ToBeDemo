import { useEffect, useMemo, useState } from 'react'
import {
  LuCalendarDays,
  LuCircleCheck,
  LuLayers,
  LuMilestone,
  LuPackage,
  LuTriangleAlert,
  LuTruck,
} from 'react-icons/lu'
import Modal, { FootNote } from '../components/ui/Modal'
import { Seccion } from '../components/ui/Panel'
import Button, { cx } from '../components/ui/Button'
import { Field, Input } from '../components/ui/Field'
import RielTransito from '../components/RielTransito'
import { RUTAS, RUTAS_LISTA } from '../data/catalogos'
import { useOc } from '../data/store'
import { addDays, diasEntre, fmtFechaCorta, fmtNum, hoy, parseISO, toISO } from '../lib/fechas'

const RANURAS_INICIALES = ['hueneme', 'longbeach', 'losangeles', 'oakland']
const MAX_DESPACHOS = 120

// Comparar exige que las columnas se alineen: una rejilla, no cuatro tarjetas.
const REJILLA = 'grid grid-cols-[22px_minmax(150px,210px)_minmax(260px,1fr)_76px_168px] gap-4'

/** Fechas de una ruta según el modo de cálculo. */
function calcular(ruta, modo, requerida, salidaFija) {
  const hoyD = hoy()
  let salida = null
  let frontera = null
  let destino = null
  let holgura = null
  let tarde = false

  if (modo === 'requerida') {
    if (requerida) {
      frontera = addDays(requerida, -ruta.leg2)
      salida = addDays(frontera, -ruta.leg1)
      destino = requerida
      holgura = diasEntre(hoyD, salida)
      tarde = holgura < 0
      if (tarde) {
        // Ya no se llega: se reproyecta saliendo mañana y se recalcula hacia adelante.
        salida = addDays(hoyD, 1)
        frontera = addDays(salida, ruta.leg1)
        destino = addDays(frontera, ruta.leg2)
      }
    }
  } else if (salidaFija) {
    salida = salidaFija
    frontera = addDays(salida, ruta.leg1)
    destino = addDays(frontera, ruta.leg2)
  }

  return { salida, frontera, destino, holgura, tarde }
}

export default function ModalCrearDespacho({ oc, onClose }) {
  const { agregarDespachos, avisar } = useOc()

  const [modo, setModo] = useState('requerida')
  const [fRequerida, setFRequerida] = useState('')
  const [fSalida, setFSalida] = useState('')
  const [ranuras, setRanuras] = useState(RANURAS_INICIALES)
  const [rutaSel, setRutaSel] = useState(0)
  const [matSel, setMatSel] = useState(0)
  const [porDespacho, setPorDespacho] = useState(0)
  const [separacion, setSeparacion] = useState(4)
  const [filas, setFilas] = useState([])
  const [observacion, setObservacion] = useState('')
  const [fechaMasiva, setFechaMasiva] = useState('')

  const material = oc?.materiales[matSel]
  const totalMaterial = material?.cantidad ?? 0

  // Reinicia el borrador cada vez que se abre con otra OC
  useEffect(() => {
    if (!oc) return
    setModo('requerida')
    setFRequerida(toISO(addDays(hoy(), 60)))
    setFSalida(toISO(addDays(hoy(), 7)))
    setRanuras(RANURAS_INICIALES)
    setRutaSel(0)
    setMatSel(0)
    setSeparacion(4)
    setObservacion('')
  }, [oc])

  useEffect(() => {
    if (oc) setPorDespacho(Math.max(1, Math.round((oc.materiales[matSel]?.cantidad ?? 0) / 16)))
  }, [matSel, oc])

  const ruta = RUTAS[ranuras[rutaSel]]
  const anclaReq = parseISO(fRequerida)
  const anclaSal = parseISO(fSalida)
  const esReq = modo === 'requerida'

  const calculos = useMemo(
    () => ranuras.map((k) => calcular(RUTAS[k], modo, anclaReq, anclaSal)),
    [ranuras, modo, fRequerida, fSalida], // eslint-disable-line react-hooks/exhaustive-deps
  )

  // Reconstruye el borrador cuando cambia cualquier parámetro de partida
  useEffect(() => {
    if (!oc || !material) return
    // Si aún no hay tamaño de despacho (primer render), se usa el reparto por defecto.
    // El tope de MAX_DESPACHOS evita que un tamaño diminuto genere miles de filas.
    const unidad = Math.max(1, Number(porDespacho) || Math.round(totalMaterial / 16) || 1)
    const n = Math.min(MAX_DESPACHOS, Math.max(1, Math.ceil(totalMaterial / unidad)))
    const base = calcular(ruta, modo, anclaReq, anclaSal).salida

    setFilas(
      Array.from({ length: n }, (_, i) => ({
        id: i + 1,
        marcado: true,
        cantidad: Math.min(unidad, Math.max(0, totalMaterial - unidad * i)),
        // el último despacho llega justo a la fecha ancla; los previos se escalonan hacia atrás
        salida: base ? toISO(addDays(base, -(n - 1 - i) * (Number(separacion) || 0))) : '',
      })),
    )
  }, [oc, material, porDespacho, separacion, ruta, modo, fRequerida, fSalida]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (filas[0]?.salida) setFechaMasiva(filas[0].salida)
  }, [filas])

  if (!oc || !material) return null

  const marcadas = filas.filter((f) => f.marcado)
  const cantidadMarcada = marcadas.reduce((a, f) => a + f.cantidad, 0)
  const sinCubrir = Math.max(0, totalMaterial - cantidadMarcada)

  const setFila = (id, patch) => setFilas((fs) => fs.map((f) => (f.id === id ? { ...f, ...patch } : f)))
  const marcarTodas = (v) => setFilas((fs) => fs.map((f) => ({ ...f, marcado: v })))

  function crear() {
    agregarDespachos(
      oc.id,
      marcadas.map((f, i) => ({
        id: `D-${String(i + 1).padStart(2, '0')}`,
        material: material.codigo,
        cantidad: f.cantidad,
        salida: f.salida,
        ruta: ruta.id,
        observacion,
      })),
    )
    avisar(
      `${marcadas.length} despacho${marcadas.length === 1 ? '' : 's'} creado${
        marcadas.length === 1 ? '' : 's'
      } para la OC ${oc.id} vía ${ruta.frontera}. Ya aparecen en Seguimiento.`,
      'ok',
    )
    onClose()
  }

  return (
    <Modal
      open
      onClose={onClose}
      size="xl"
      eyebrow={`Orden de compra ${oc.id} · ${oc.proveedor}`}
      title="Crear despacho"
      footer={
        <>
          <div className="flex items-baseline gap-2">
            <span className="num text-xl font-bold text-navy-800">
              {marcadas.length}
            </span>
            <span className="lbl">
              despacho{marcadas.length === 1 ? '' : 's'} · {fmtNum(cantidadMarcada)} {material.unidad}
            </span>
          </div>
          <FootNote>
            {sinCubrir > 0 ? (
              <>
                Sin cubrir:{' '}
                <span className="font-semibold text-ambar-700">
                  {fmtNum(sinCubrir)} {material.unidad}
                </span>
              </>
            ) : (
              'La OC queda cubierta por completo.'
            )}
          </FootNote>
          <Button variant="quiet" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={crear} disabled={!marcadas.length}>
            Crear {marcadas.length} despacho{marcadas.length === 1 ? '' : 's'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        {/* 1. de qué fecha cuelga el cálculo — es el foco de la pantalla */}
        <Seccion titulo="Base del cálculo" icono={LuMilestone}>
          <div className="flex flex-wrap items-end gap-5 rounded-md border border-navy-100 bg-navy-50 p-4">
            <Field label="Calcular a partir de">
              <div className="segbar">
                <button
                  className={cx('seg h-7 px-3', esReq && 'seg-on')}
                  onClick={() => setModo('requerida')}
                >
                  <LuCalendarDays size={13} />
                  Fecha requerida en planta
                </button>
                <button
                  className={cx('seg h-7 px-3', !esReq && 'seg-on')}
                  onClick={() => setModo('salida')}
                >
                  <LuTruck size={13} />
                  Salida del proveedor
                </button>
              </div>
            </Field>

            <Field
              label={esReq ? 'Fecha requerida (planta)' : 'Salida del proveedor'}
              className="w-[200px]"
            >
              <Input
                date
                type="date"
                value={esReq ? fRequerida : fSalida}
                onChange={(e) => (esReq ? setFRequerida : setFSalida)(e.target.value)}
              />
            </Field>

            <p className="min-w-[200px] flex-1 text-sm leading-normal text-ink-2">
              {esReq ? (
                <>
                  Se calcula <b className="font-semibold text-navy-800">hacia atrás</b>: de la fecha en
                  planta se restan los días de cada ruta para obtener la salida del proveedor y la
                  holgura disponible.
                </>
              ) : (
                <>
                  Se calcula <b className="font-semibold text-navy-800">hacia adelante</b>: desde la
                  salida se proyectan la ETA frontera y la llegada a planta de cada ruta.
                </>
              )}
            </p>

            <Field label="Observación" className="w-[210px]">
              <Input
                placeholder="Opcional"
                value={observacion}
                onChange={(e) => setObservacion(e.target.value)}
              />
            </Field>
          </div>
        </Seccion>

        {/* 2. comparación de rutas */}
        <Seccion
          titulo="Rutas configuradas"
          icono={LuMilestone}
          pista="Las 4 ranuras son intercambiables — elige la que se usará"
        >
          <div className="overflow-hidden rounded-md border border-line">
            <div
              className={cx(
                REJILLA,
                'border-b border-line-strong bg-surface-2 py-2 pl-3 pr-4 text-sm font-bold text-ink-2',
              )}
            >
              <span />
              <span>Ruta</span>
              <span>Recorrido y fechas</span>
              <span className="text-right">Tránsito</span>
              <span>{esReq ? 'Holgura hasta la salida' : 'Llegada a planta'}</span>
            </div>

            {ranuras.map((clave, i) => {
              const r = RUTAS[clave]
              const cal = calculos[i]
              const total = r.leg1 + r.leg2
              const sel = rutaSel === i
              const tono = cal.tarde
                ? 'text-rojo-700'
                : cal.holgura !== null && cal.holgura <= 5
                  ? 'text-ambar-700'
                  : 'text-teal-700'

              return (
                <div
                  key={i}
                  onClick={() => setRutaSel(i)}
                  className={cx(
                    REJILLA,
                    'cursor-pointer items-center border-b border-line-soft border-l-[3px] py-3 pl-3 pr-4 transition duration-100 last:border-b-0',
                    sel ? 'border-l-navy-800 bg-navy-50' : 'border-l-transparent hover:bg-surface-2',
                  )}
                >
                  <span className={cx('rad', sel && 'rad-on')} />

                  <div>
                    <select
                      value={clave}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) =>
                        setRanuras((rs) => rs.map((x, j) => (j === i ? e.target.value : x)))
                      }
                      className="h-7 w-full cursor-pointer appearance-none rounded-sm border border-line bg-surface py-0 pl-2 pr-6 text-sm font-medium text-ink transition-colors hover:border-navy-400 focus:border-navy-600 focus:outline-none focus:ring-3 focus:ring-navy-600/25"
                    >
                      {RUTAS_LISTA.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.origen} → {o.frontera}
                        </option>
                      ))}
                    </select>
                  </div>

                  <RielTransito
                    estado={cal.tarde ? 'tarde' : sel ? 'activo' : 'inerte'}
                    tramos={[r.leg1, r.leg2]}
                    nodos={[
                      { rotulo: 'Salida proveedor', fecha: cal.salida, lugar: r.origen, ancla: !esReq },
                      { rotulo: 'ETA frontera', fecha: cal.frontera, lugar: r.frontera },
                      {
                        rotulo: 'En planta',
                        fecha: cal.destino,
                        lugar: oc.centro,
                        ancla: esReq && !cal.tarde,
                      },
                    ]}
                  />

                  <div className="text-right">
                    <div className="num text-lg font-bold text-navy-800">
                      {total}
                    </div>
                    <span className="block text-3xs text-ink-4">días</span>
                  </div>

                  {/* la holgura es el dato que decide si la ruta sirve */}
                  <div className="flex flex-col gap-0.5">
                    {!esReq ? (
                      <span className={cx('num font-semibold', tono)}>
                        {cal.destino ? fmtFechaCorta(cal.destino) : '—'}
                      </span>
                    ) : cal.holgura === null ? (
                      <span className="text-3xs text-ink-3">Indica la fecha requerida</span>
                    ) : (
                      <>
                        <span className={cx('num inline-flex items-center gap-1.5 font-semibold', tono)}>
                          {cal.tarde ? <LuTriangleAlert size={13} /> : <LuCircleCheck size={13} />}
                          {cal.tarde ? cal.holgura : `+${cal.holgura}`} días
                        </span>
                        <span
                          className={cx(
                            'text-3xs leading-snug text-pretty',
                            cal.tarde ? 'text-rojo-700' : 'text-ink-3',
                          )}
                        >
                          {cal.tarde
                            ? 'No se llega a la fecha en planta. Reproyectado saliendo mañana.'
                            : 'Margen antes de la salida límite del proveedor.'}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </Seccion>

        {/* 3. detalle de la OC */}
        <Seccion titulo="Detalle de la orden de compra" icono={LuPackage}>
          <div className="overflow-hidden rounded-md border border-line">
            <table className="tbl">
              <thead>
                <tr>
                  <th className="w-9" />
                  <th className="w-[110px]">Código</th>
                  <th>Material</th>
                  <th className="w-[88px]">Unidad</th>
                  <th className="w-[130px] text-right!">Total OC</th>
                  <th className="w-[150px] text-right!">Cant. seleccionada</th>
                  <th className="w-[130px] text-right!">Pendiente</th>
                </tr>
              </thead>
              <tbody>
                {oc.materiales.map((m, i) => (
                  <tr
                    key={m.codigo + i}
                    onClick={() => setMatSel(i)}
                    className={cx('cursor-pointer', i === matSel && '[&>td]:bg-navy-50!')}
                  >
                    <td className="text-center">
                      <span className={cx('rad inline-block', i === matSel && 'rad-on')} />
                    </td>
                    <td className="cell-key">{m.codigo}</td>
                    <td className="cell-strong">{m.nombre}</td>
                    <td>{m.unidad}</td>
                    <td className="cell-num">{fmtNum(m.cantidad)}</td>
                    <td className="cell-num cell-strong">
                      {i === matSel ? fmtNum(cantidadMarcada) : '0'}
                    </td>
                    <td className="cell-num">{i === matSel ? fmtNum(sinCubrir) : fmtNum(m.cantidad)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Seccion>

        {/* 4. borrador de despachos */}
        <Seccion
          titulo="Borrador de despachos"
          icono={LuLayers}
          pista={`Ruta aplicada: ${ruta.origen} → ${ruta.frontera}`}
        >
          <div className="flex flex-wrap items-end gap-4 rounded-t-md border border-b-0 border-line bg-surface-2 px-4 py-3">
            <Field
              label={`${material.unidad} por despacho`}
              className="w-32"
              hint={filas.length >= MAX_DESPACHOS ? `Tope de ${MAX_DESPACHOS} despachos` : undefined}
            >
              <Input
                numeric
                type="number"
                min={1}
                value={porDespacho}
                onChange={(e) => setPorDespacho(e.target.value)}
              />
            </Field>

            {/* Los dos campos son la misma decisión vista al revés: escribir uno recalcula el otro. */}
            <Field label="Cantidad de despachos" className="w-32">
              <Input
                numeric
                type="number"
                min={1}
                max={MAX_DESPACHOS}
                value={filas.length}
                onChange={(e) => {
                  const n = Math.min(MAX_DESPACHOS, Math.max(1, Number(e.target.value) || 1))
                  setPorDespacho(Math.ceil(totalMaterial / n))
                }}
              />
            </Field>

            <Field label="Días entre despachos" className="w-32">
              <Input
                numeric
                type="number"
                min={0}
                value={separacion}
                onChange={(e) => setSeparacion(e.target.value)}
              />
            </Field>

            <Field label="Aplicar salida a los marcados" className="w-[156px]">
              <Input
                date
                type="date"
                value={fechaMasiva}
                onChange={(e) => setFechaMasiva(e.target.value)}
              />
            </Field>

            <Button
              onClick={() => {
                if (!fechaMasiva) return
                setFilas((fs) => fs.map((f) => (f.marcado ? { ...f, salida: fechaMasiva } : f)))
                avisar(`Salida aplicada a ${marcadas.length} despachos.`, 'ok')
              }}
            >
              Aplicar
            </Button>

            <div className="ml-auto flex items-center gap-2 text-sm text-ink-3">
              <Button variant="link" onClick={() => marcarTodas(true)}>
                Todos
              </Button>
              <span className="text-line-strong">·</span>
              <Button variant="link" onClick={() => marcarTodas(false)}>
                Ninguno
              </Button>
            </div>
          </div>

          <div className="overflow-hidden rounded-b-md border border-line">
            <div className="max-h-[320px] overflow-auto">
              <table className="tbl">
                <thead>
                  <tr>
                    <th className="w-9">
                      <input
                        type="checkbox"
                        className="chk"
                        checked={marcadas.length === filas.length && filas.length > 0}
                        ref={(el) => {
                          if (el)
                            el.indeterminate = marcadas.length > 0 && marcadas.length < filas.length
                        }}
                        onChange={(e) => marcarTodas(e.target.checked)}
                      />
                    </th>
                    <th className="w-[110px]">Despacho</th>
                    <th>Material</th>
                    <th className="w-[130px] text-right!">Cantidad</th>
                    <th className="w-[150px]">Salida proveedor</th>
                    <th className="w-[130px]">ETA frontera</th>
                    <th className="w-[130px]">En planta</th>
                  </tr>
                </thead>
                <tbody>
                  {filas.map((f) => {
                    const salida = parseISO(f.salida)
                    const frontera = salida ? addDays(salida, ruta.leg1) : null
                    const planta = frontera ? addDays(frontera, ruta.leg2) : null
                    return (
                      <tr key={f.id} className={cx(!f.marcado && '[&>td]:opacity-45')}>
                        <td>
                          <input
                            type="checkbox"
                            className="chk"
                            checked={f.marcado}
                            onChange={(e) => setFila(f.id, { marcado: e.target.checked })}
                          />
                        </td>
                        <td className="cell-key">D-{String(f.id).padStart(2, '0')}</td>
                        <td className="cell-strong">
                          {material.codigo} · {material.nombre}
                        </td>
                        <td>
                          <input
                            className="cellinp cellinp-num"
                            type="number"
                            value={f.cantidad}
                            onChange={(e) => setFila(f.id, { cantidad: Number(e.target.value) || 0 })}
                          />
                        </td>
                        <td>
                          <input
                            className="cellinp inp-date"
                            type="date"
                            value={f.salida}
                            onChange={(e) => setFila(f.id, { salida: e.target.value })}
                          />
                        </td>
                        <td className="num">{fmtFechaCorta(frontera)}</td>
                        <td className="num">{fmtFechaCorta(planta)}</td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={3}>
                      Marcados: {marcadas.length} de {filas.length}
                    </td>
                    <td className="cell-num">
                      {fmtNum(cantidadMarcada)} {material.unidad}
                    </td>
                    <td colSpan={3}>
                      {sinCubrir > 0 ? (
                        <>
                          Pendiente de OC sin cubrir:{' '}
                          <span className="font-semibold text-ambar-700">
                            {fmtNum(sinCubrir)} {material.unidad}
                          </span>
                        </>
                      ) : (
                        'OC cubierta al 100%'
                      )}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </Seccion>
      </div>
    </Modal>
  )
}
