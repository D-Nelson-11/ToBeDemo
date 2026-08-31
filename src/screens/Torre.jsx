import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import {
  LuBanknote,
  LuBellRing,
  LuCircleCheck,
  LuContainer,
  LuEllipsis,
  LuFileCheck,
  LuHandshake,
  LuMail,
  LuMapPin,
  LuSearch,
  LuShip,
  LuTriangleAlert,
  LuTruck,
  LuWarehouse,
} from 'react-icons/lu'
import Modal from '../components/ui/Modal'
import Button, { cx } from '../components/ui/Button'
import { Select } from '../components/ui/Field'
import BitacoraAduana from '../components/BitacoraAduana'
import CostosLogisticos from './CostosLogisticos'
import LiberacionDocumentos from './LiberacionDocumentos'
import MerchantCarrier from './MerchantCarrier'
import ModalColaCorreo from './ModalColaCorreo'
import DetalleTransito from '../components/DetalleTransito'
import RielAduana from '../components/RielAduana'
import RielTransito from '../components/RielTransito'
import { useOc } from '../data/store'
import {
  NIVELES,
  RIESGOS,
  SEGMENTOS,
  construirAlertas,
  construirCostos,
  construirDocumentos,
  construirEmbarques,
  estadoTramite,
  estatusAduana,
  prioridadDe,
  requisitosDestino,
} from '../lib/torre'
import { construirMerchant } from '../lib/merchant'
import { fmtFechaCorta, fmtNum } from '../lib/fechas'

const ICONO_SEGMENTO = {
  All: LuContainer,
  Origin: LuWarehouse,
  'Port of Loading': LuContainer,
  'International Transit': LuShip,
  'Customs Clearance': LuBanknote,
  'Last Mile': LuTruck,
  'At Plant': LuWarehouse,
  Costos: LuBanknote,
  Alertas: LuBellRing,
  Documentos: LuFileCheck,
  'Merchant/Carrier': LuHandshake,
}

// Tabs que no listan embarques: son pantallas propias al final de la barra.
const PAGINAS = ['Costos', 'Alertas', 'Documentos', 'Merchant/Carrier']

const TONO_RIESGO = {
  'Dentro de tiempo': { chip: 'bg-teal-50 text-teal-700', punto: 'bg-teal-600', texto: 'text-teal-700', lomo: 'var(--color-teal-600)' },
  'En riesgo': { chip: 'bg-ambar-50 text-ambar-700', punto: 'bg-ambar-500', texto: 'text-ambar-700', lomo: 'var(--color-ambar-500)' },
  'Fuera de tiempo': { chip: 'bg-rojo-50 text-rojo-700', punto: 'bg-rojo-600', texto: 'text-rojo-700', lomo: 'var(--color-rojo-600)' },
}

const TONO_SLA = {
  ok: 'bg-teal-50 text-teal-700',
  riesgo: 'bg-ambar-50 text-ambar-700',
  vencido: 'bg-rojo-50 text-rojo-700',
}

const TONO_NIVEL = {
  teal: 'border-teal-100 bg-teal-50 text-teal-700',
  ambar: 'border-ambar-100 bg-ambar-50 text-ambar-700',
  rojo: 'border-rojo-100 bg-rojo-50 text-rojo-700',
}

function Kpi({ rotulo, valor, alerta }) {
  return (
    <div
      className={cx(
        'min-w-[150px] flex-1 rounded-sm border px-3 py-2.5',
        alerta ? 'border-rojo-100 bg-rojo-50' : 'border-line bg-surface',
      )}
    >
      <div className="text-sm text-ink-3">{rotulo}</div>
      <div className={cx('num text-2xl font-bold', alerta ? 'text-rojo-700' : 'text-navy-800')}>
        {valor}
      </div>
    </div>
  )
}

function BarraReq({ items }) {
  const hechos = items.filter(([, ok]) => ok).length
  const pct = Math.round((hechos / items.length) * 100)
  const tono = pct === 100 ? 'bg-teal-600' : pct >= 50 ? 'bg-ambar-500' : 'bg-rojo-600'
  return (
    <div className="mb-2 flex items-center gap-2">
      <span className="h-[5px] flex-1 overflow-hidden rounded-full bg-surface-3">
        <span className={cx('block h-full', tono)} style={{ width: `${pct}%` }} />
      </span>
      <span className="num text-xs text-ink-3">
        {hechos}/{items.length}
      </span>
    </div>
  )
}

export default function Torre() {
  const { ordenes, recolectas, coordinaciones, finiquitos, avisar } = useOc()
  const [segmento, setSegmento] = useState('All')
  const [sitio, setSitio] = useState('')
  const [riesgo, setRiesgo] = useState('')
  const [q, setQ] = useState('')
  const [nivelFiltro, setNivelFiltro] = useState('')
  const [detalle, setDetalle] = useState(null)
  // Embarque cuya cola de correo (correo de asignación a la agencia) se está viendo.
  const [cola, setCola] = useState(null)
  const enTramite = detalle?.segmento === 'Customs Clearance'
  const enTransito = detalle?.segmento === 'International Transit'

  // La rueda del mouse manda deltaY y la tabbar solo desborda en X: sin esto el
  // scroll se lo lleva la pagina y los tabs no se mueven.
  const tabbar = useRef(null)
  useEffect(() => {
    const el = tabbar.current
    const alRodar = (e) => {
      // Trackpad horizontal ya funciona solo; y si los tabs caben, no secuestrar la pagina.
      if (e.deltaX || el.scrollWidth <= el.clientWidth) return
      el.scrollLeft += e.deltaY
      e.preventDefault()
    }
    // passive: false porque React registra onWheel como pasivo y ahi preventDefault no corre.
    el.addEventListener('wheel', alRodar, { passive: false })
    return () => el.removeEventListener('wheel', alRodar)
  }, [])

  const embarques = useMemo(() => construirEmbarques(ordenes), [ordenes])
  const costos = useMemo(() => construirCostos(embarques), [embarques])
  const alertas = useMemo(() => construirAlertas(embarques), [embarques])
  const documentos = useMemo(() => construirDocumentos(embarques, recolectas), [embarques, recolectas])
  const merchant = useMemo(
    () => construirMerchant(embarques, coordinaciones, finiquitos),
    [embarques, coordinaciones, finiquitos],
  )

  const sitios = useMemo(() => [...new Set(embarques.map((e) => e.sitio))], [embarques])

  const filtrados = useMemo(() => {
    const t = q.toLowerCase().trim()
    return embarques.filter(
      (e) =>
        (segmento === 'All' || e.segmento === segmento) &&
        (!sitio || e.sitio === sitio) &&
        (!riesgo || e.riesgo === riesgo) &&
        (!t ||
          `${e.id} ${e.oc.proveedor} ${e.sitio} ${e.ubicacion} ${e.material?.nombre}`
            .toLowerCase()
            .includes(t)),
    )
  }, [embarques, segmento, sitio, riesgo, q])

  const conteoSegmento = useMemo(() => {
    const c = { All: embarques.length }
    SEGMENTOS.slice(1).forEach((s) => (c[s] = embarques.filter((e) => e.segmento === s).length))
    return c
  }, [embarques])

  const enAduana = useMemo(
    () => embarques.filter((e) => e.segmento === 'Customs Clearance'),
    [embarques],
  )

  const alertasFiltradas = alertas.filter((a) => !nivelFiltro || String(a.nivel) === nivelFiltro)

  const esPagina = PAGINAS.includes(segmento)

  // El contador de cada página es lo que hay por atender, no el total.
  const contadorPagina = {
    Costos: costos.length,
    Alertas: alertas.length,
    Documentos: documentos.filter((d) => d.estado === 'Liberado').length,
    // Lo accionable acá es lo que espera fecha o revisión, no todo el pipeline.
    'Merchant/Carrier':
      merchant.precoordinacion.length + merchant.liberados.length + merchant.recibidas.length,
  }

  return (
    <div className="min-h-full">
      <div className="contenedor flex flex-col gap-4 py-4">
        {/* Segmentos del viaje: son el eje de toda la torre */}
        <div ref={tabbar} className="tabbar">
          {[...SEGMENTOS, ...PAGINAS].map((s) => {
            const Icono = ICONO_SEGMENTO[s]
            const activo = segmento === s
            const n = contadorPagina[s] ?? conteoSegmento[s]
            return (
              <Fragment key={s}>
                {/* Los segmentos filtran la misma tabla; las páginas son otra pantalla */}
                {s === PAGINAS[0] && <span className="my-2 w-px shrink-0 bg-line" />}
                <button onClick={() => setSegmento(s)} className={cx('tab', activo && 'tab-on')}>
                  <Icono size={14} className={activo ? 'text-navy-700' : 'text-ink-4'} />
                  {s}
                  <span className="tab-n">{n}</span>
                </button>
              </Fragment>
            )
          })}
        </div>

        {/* Leyenda de riesgo */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-ink-3">
          {RIESGOS.map((r) => (
            <span key={r} className="flex items-center gap-1.5">
              <span className={cx('h-2 w-2 rounded-full', TONO_RIESGO[r].punto)} />
              {r}
              <b className={cx('num font-bold', TONO_RIESGO[r].texto)}>
                {embarques.filter((e) => e.riesgo === r).length}
              </b>
            </span>
          ))}
        </div>

        {/* ------------------------------ EMBARQUES ------------------------------ */}
        {!esPagina && (
          <>
            <div className="panel">
              <div className="panel-head">
                <span className="panel-title">
                  Embarques — {segmento === 'All' ? 'todos los segmentos' : segmento}
                </span>
                <div className="ml-auto flex flex-wrap items-center gap-2">
                  <Select
                    placeholder="Todos los sitios"
                    options={sitios}
                    value={sitio}
                    onChange={(e) => setSitio(e.target.value)}
                    className="w-[190px]"
                  />
                  <Select
                    placeholder="Todos los riesgos"
                    options={RIESGOS}
                    value={riesgo}
                    onChange={(e) => setRiesgo(e.target.value)}
                    className="w-[170px]"
                  />
                  <div className="relative flex items-center">
                    <LuSearch size={13} className="pointer-events-none absolute left-2.5 text-ink-4" />
                    <input
                      className="inp w-[230px] pl-7"
                      placeholder="Buscar embarque, OC, sitio…"
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="tabla-scroll">
                <table className="tbl">
                  <thead>
                    <tr>
                      <th className="w-[150px]">Embarque</th>
                      <th className="w-[140px]">Transporte</th>
                      <th className="w-[160px]">Estado</th>
                      <th className="min-w-[170px]">Ubicación</th>
                      <th className="w-[180px]">Sitio</th>
                      <th className="w-[210px]">ETD / ETA</th>
                      <th className="w-[100px] text-right!">Desviación</th>
                      <th className="w-[120px]">Actualizado</th>
                      <th className="w-[140px]">Riesgo</th>
                      <th className="w-[86px]" />
                    </tr>
                  </thead>
                  <tbody>
                    {filtrados.length === 0 && (
                      <tr>
                        <td colSpan={10} className="h-[140px]! bg-surface text-center text-sm text-ink-3">
                          Ningún embarque en este segmento con los filtros aplicados.
                        </td>
                      </tr>
                    )}
                    {filtrados.map((e) => {
                      const tono = TONO_RIESGO[e.riesgo]
                      return (
                        <tr key={e.clave} style={{ '--spine': tono.lomo }}>
                          <td className="cell-key">{e.id}</td>
                          <td>{e.transporte}</td>
                          <td className="cell-strong">{e.segmento}</td>
                          <td className="cell-cut" title={e.ubicacion}>
                            <span className="flex items-center gap-1.5">
                              <LuMapPin size={12} className="shrink-0 text-ink-4" />
                              {e.ubicacion}
                            </span>
                          </td>
                          <td className="cell-cut" title={e.sitio}>
                            {e.sitio}
                          </td>
                          <td className="num">
                            ETD {fmtFechaCorta(e.etd)} <span className="text-ink-4">·</span> ETA{' '}
                            {fmtFechaCorta(e.planta)}
                          </td>
                          <td className={cx('cell-num font-bold', e.delay > 0 && tono.texto)}>
                            {e.delay > 0 ? `+${e.delay} d` : '0 d'}
                          </td>
                          <td className="num text-ink-3">Hoy · {e.actualizado}</td>
                          <td>
                            <span
                              className={cx(
                                'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-[3px] text-xs font-semibold',
                                tono.chip,
                              )}
                            >
                              {e.riesgo === 'Dentro de tiempo' ? (
                                <LuCircleCheck size={11} />
                              ) : (
                                <LuTriangleAlert size={11} />
                              )}
                              {e.riesgo}
                            </span>
                          </td>
                          <td>
                            <div className="flex justify-end gap-1">
                              <button
                                className="ico"
                                title="Cola de correo · trámite asignado a la agencia aduanal"
                                onClick={() => setCola(e)}
                              >
                                <LuMail size={15} />
                              </button>
                              <button
                                className="ico"
                                title="Ver detalle del embarque"
                                onClick={() => setDetalle(e)}
                              >
                                <LuEllipsis size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="panel">
                <div className="panel-head">
                  <span className="panel-title">Notas automáticas y propuestas de decisión</span>
                </div>
                <div className="flex flex-col gap-2 p-4">
                  {alertas.length === 0 && (
                    <p className="text-sm text-ink-3">
                      Sin desviaciones: ningún embarque se movió respecto de su fecha planificada.
                    </p>
                  )}
                  {alertas.map((a) => (
                    <div
                      key={a.clave}
                      className="flex flex-wrap items-center gap-2 rounded-sm border border-line bg-surface-2 px-3 py-2 text-sm"
                    >
                      <b className="font-bold text-ink">{a.embarque.id}:</b>
                      <span className="min-w-0 flex-1 text-ink-2">{a.texto}</span>
                      <span
                        className={cx(
                          'whitespace-nowrap rounded-full border px-2 py-[2px] text-xs font-semibold',
                          TONO_NIVEL[NIVELES[a.nivel].tono],
                        )}
                      >
                        {NIVELES[a.nivel].rotulo}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="panel">
                <div className="panel-head">
                  <span className="panel-title">Reglas de comunicación</span>
                </div>
                <div className="flex flex-col gap-2 p-4">
                  {[1, 2, 3].map((n) => (
                    <div
                      key={n}
                      className={cx(
                        'flex flex-wrap items-baseline gap-2 rounded-sm border px-3 py-2 text-sm',
                        TONO_NIVEL[NIVELES[n].tono],
                      )}
                    >
                      <b className="font-bold">{NIVELES[n].rotulo}</b>
                      <span className="min-w-0 flex-1">{NIVELES[n].regla}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* La aduana de destino tiene su propio trámite por embarque */}
            {segmento === 'Customs Clearance' && (
              <div className="flex flex-col gap-4">
                {enAduana.length === 0 && (
                  <div className="panel p-4 text-sm text-ink-3">
                    No hay embarques en aduana de destino en este momento.
                  </div>
                )}
                {enAduana.map((e, i) => {
                  const grupos = requisitosDestino(e)
                  const tono = TONO_RIESGO[e.riesgo]
                  return (
                    <div key={e.clave} className="panel">
                      <div className="panel-head flex-wrap">
                        <span className="panel-title">
                          #{i + 1} · {e.id}
                        </span>
                        <span className="text-sm text-ink-3">
                          {e.oc.proveedor} · {e.ruta.frontera} · ETA {fmtFechaCorta(e.planta)}
                          {e.delay > 0 && (
                            <b className={cx('num font-bold', tono.texto)}> · +{e.delay} d</b>
                          )}
                        </span>
                        <div className="ml-auto flex items-center gap-2">
                          <span className="rounded-full bg-surface-3 px-2.5 py-[3px] text-xs font-semibold text-ink-2">
                            Prioridad {prioridadDe(e).toLowerCase()}
                          </span>
                          <span
                            className={cx(
                              'rounded-full px-2.5 py-[3px] text-xs font-semibold',
                              TONO_SLA[estadoTramite(e)],
                            )}
                          >
                            {estatusAduana(e)}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 xl:grid-cols-5">
                        {grupos.map((gr) => (
                          <div key={gr.grupo}>
                            <div className="lbl mb-1.5">{gr.grupo}</div>
                            <BarraReq items={gr.items} />
                            <ul className="m-0 flex list-none flex-col gap-1 p-0">
                              {gr.items.map(([rotulo, ok]) => (
                                <li
                                  key={rotulo}
                                  className={cx(
                                    'flex items-start gap-1.5 text-sm',
                                    ok ? 'text-ink-3 line-through' : 'text-ink',
                                  )}
                                >
                                  <input type="checkbox" className="chk mt-px" checked={ok} readOnly />
                                  {rotulo}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>

                      {/* Trámite en aduana: un SLA entre cada hito */}
                      <div className="border-t border-line bg-surface-2 px-4 py-3">
                        <RielAduana embarque={e} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}

        {/* -------------------------------- COSTOS -------------------------------- */}
        {segmento === 'Costos' && <CostosLogisticos />}

        {/* ------------------------------ DOCUMENTOS ------------------------------ */}
        {segmento === 'Documentos' && <LiberacionDocumentos documentos={documentos} />}

        {/* --------------------------- MERCHANT / CARRIER -------------------------- */}
        {segmento === 'Merchant/Carrier' && <MerchantCarrier embarques={embarques} />}

        {/* ------------------------------- ALERTAS -------------------------------- */}
        {segmento === 'Alertas' && (
          <div className="panel">
            <div className="panel-head">
              <span className="panel-title">Alertas y notificaciones automáticas</span>
              <div className="ml-auto flex items-center gap-2">
                <Select
                  placeholder="Todos los niveles"
                  options={[
                    { value: '1', label: 'Nivel 1' },
                    { value: '2', label: 'Nivel 2' },
                    { value: '3', label: 'Nivel 3' },
                  ]}
                  value={nivelFiltro}
                  onChange={(e) => setNivelFiltro(e.target.value)}
                  className="w-[170px]"
                />
                <Button onClick={() => avisar('Alertas notificadas a los responsables.', 'ok')}>
                  <LuBellRing size={14} />
                  Notificar
                </Button>
              </div>
            </div>
            <div className="flex flex-col gap-2 p-4">
              {alertasFiltradas.length === 0 && (
                <p className="text-sm text-ink-3">Sin alertas activas con este filtro.</p>
              )}
              {alertasFiltradas.map((a) => (
                <div
                  key={a.clave}
                  className={cx(
                    'flex flex-wrap items-start gap-2.5 rounded-sm border px-3 py-2.5 text-sm',
                    TONO_NIVEL[NIVELES[a.nivel].tono],
                  )}
                >
                  <LuTriangleAlert size={15} className="mt-px shrink-0" />
                  <span className="min-w-0 flex-1">
                    <b className="font-bold">
                      {NIVELES[a.nivel].rotulo} · {a.embarque.id}
                    </b>
                    <span className="block">{a.texto}</span>
                  </span>
                  <Button size="sm" onClick={() => setDetalle(a.embarque)}>
                    Ver embarque
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ------------------------------- DETALLE -------------------------------- */}
      {/* Una sola modal: en aduana de destino es la bitácora del trámite, en el
          resto de los segmentos sigue siendo el detalle del viaje. */}
      <Modal
        open={!!detalle}
        onClose={() => setDetalle(null)}
        size="lg"
        eyebrow={
          detalle
            ? enTramite
              ? `Bitácora proceso aduanero · ${detalle.ruta.frontera}`
              : enTransito
                ? `Detalle del embarque · ${detalle.buque}`
                : `${detalle.oc.proveedor} · ${detalle.transporte}`
            : ''
        }
        title={detalle ? `Embarque ${detalle.id}` : ''}
        footer={
          <>
            <span className="min-w-0 flex-1 text-sm text-ink-2">
              {enTramite
                ? `${estatusAduana(detalle)} · ${detalle.oc.proveedor} · ${detalle.oc.centro}`
                : detalle?.delay > 0
                  ? `Acumula +${detalle.delay} días contra la fecha planificada.`
                  : 'Sin desviación contra la fecha planificada.'}
            </span>
            <Button variant="quiet" onClick={() => setDetalle(null)}>
              Cerrar
            </Button>
          </>
        }
      >
        {detalle && enTramite && <BitacoraAduana embarque={detalle} />}
        {detalle && enTransito && <DetalleTransito embarque={detalle} />}

        {detalle && !enTramite && !enTransito && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-3">
              <Kpi rotulo="Segmento actual" valor={detalle.segmento} />
              <Kpi rotulo="Días de desviación" valor={`${detalle.delay} d`} alerta={detalle.delay > 0} />
              <Kpi rotulo="Cantidad" valor={`${fmtNum(detalle.despacho.cantidad)} ${detalle.material?.unidad}`} />
            </div>

            <div className="panel p-4">
              <div className="lbl mb-3">Ruta y ubicación</div>
              <RielTransito
                estado={detalle.delay > 2 ? 'tarde' : 'activo'}
                tramos={[detalle.ruta.leg1, detalle.ruta.leg2]}
                nodos={[
                  { rotulo: 'Salida proveedor', fecha: detalle.etd, lugar: detalle.ruta.origen },
                  { rotulo: 'ETA frontera', fecha: detalle.frontera, lugar: detalle.ruta.frontera },
                  { rotulo: 'En planta', fecha: detalle.planta, lugar: detalle.oc.centro, ancla: true },
                ]}
              />
            </div>

            <div className="panel p-4">
              <div className="lbl mb-3">Trámite en aduana de destino</div>
              <RielAduana embarque={detalle} leyenda />
            </div>

            <div className="panel p-4">
              <div className="lbl mb-2">Proyección y comunicación</div>
              <p className="text-base text-ink-2">
                {detalle.delay > 0 ? (
                  <>
                    Fecha planificada de salida <b className="num">{fmtFechaCorta(detalle.plan)}</b>,
                    reprogramada a <b className="num">{fmtFechaCorta(detalle.etd)}</b>. Nueva llegada a
                    planta: <b className="num">{fmtFechaCorta(detalle.planta)}</b>.{' '}
                    {NIVELES[detalle.delay > 3 ? 3 : detalle.delay >= 2 ? 2 : 1].regla}
                  </>
                ) : (
                  <>
                    El embarque va según lo planificado. Llegada a planta prevista para{' '}
                    <b className="num">{fmtFechaCorta(detalle.planta)}</b>.
                  </>
                )}
              </p>
            </div>
          </div>
        )}
      </Modal>

      <ModalColaCorreo embarque={cola} onClose={() => setCola(null)} />
    </div>
  )
}
