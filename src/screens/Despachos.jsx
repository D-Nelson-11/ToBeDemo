import { useMemo, useState } from 'react'
import {
  LuArrowDown,
  LuArrowUp,
  LuBan,
  LuCalendarDays,
  LuFileDown,
  LuFileUp,
  LuRotateCcw,
  LuSearchX,
  LuSparkles,
  LuSquarePen,
  LuStamp,
  LuStickyNote,
  LuTrash2,
  LuTruck,
  LuWallet,
  LuX,
} from 'react-icons/lu'
import Button, { cx } from '../components/ui/Button'
import ModalCrearDespacho from './ModalCrearDespacho'
import ModalEditarOc from './ModalEditarOc'
import { cantidadDespachada, cantidadTotalOc, useOc } from '../data/store'
import { desdeHoy, diasEntre, fmtFechaCorta, hoy, parseISO } from '../lib/fechas'

const SITUACIONES = {
  pago: { rotulo: 'Pendiente de pago', icono: LuWallet },
  fechas: { rotulo: 'Pend. asignar fechas', icono: LuCalendarDays },
  programar: { rotulo: 'Pendiente de programar', icono: LuTruck },
}

const FILTROS = [
  { id: 'todas', rotulo: 'Todas', punto: null },
  { id: 'pago', rotulo: 'Pend. de pago', punto: 'bg-ambar-500' },
  { id: 'fechas', rotulo: 'Pend. de fechas', punto: 'bg-navy-600' },
  { id: 'programar', rotulo: 'Pend. de programar', punto: 'bg-rojo-600' },
  { id: 'cerradas', rotulo: 'Cerradas', punto: 'bg-ink-4' },
]

const coincide = (oc, f) =>
  f === 'todas'
    ? true
    : f === 'cerradas'
      ? oc.estado === 'cerrada'
      : oc.estado === 'abierta' && oc.pendiente === f

/** Filtro por columna, en la segunda fila de la cabecera — como en el portal actual. */
function FiltroCol({ valor, onChange }) {
  return (
    <div className="relative flex items-center">
      <input
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        className="h-[26px] w-full rounded-xs border border-line bg-white px-1.5 pr-5 text-sm text-ink transition-colors duration-100 focus:border-navy-600 focus:outline-none focus:ring-2 focus:ring-navy-600/20"
      />
      {valor && (
        <button
          aria-label="Limpiar filtro"
          onClick={() => onChange('')}
          className="absolute right-1 flex h-[14px] w-[14px] items-center justify-center rounded-full bg-line text-ink-2 hover:bg-line-strong hover:text-ink"
        >
          <LuX size={9} />
        </button>
      )}
    </div>
  )
}

export default function Despachos() {
  const { ordenes, toggleEstado, toggleActiva, avisar } = useOc()

  const [qOc, setQOc] = useState('')
  const [qProv, setQProv] = useState('')
  const [qResp, setQResp] = useState('')
  const [filtro, setFiltro] = useState('todas')
  const [verInactivas, setVerInactivas] = useState(false)
  const [orden, setOrden] = useState({ campo: 'fechaDoc', dir: 'desc' })

  const [ocDespacho, setOcDespacho] = useState(null)
  const [ocEditar, setOcEditar] = useState(null)

  // Base sobre la que se cuentan los filtros: respeta el interruptor de inactivas
  const base = useMemo(
    () => ordenes.filter((oc) => verInactivas || oc.activa),
    [ordenes, verInactivas],
  )

  const conteos = useMemo(
    () => Object.fromEntries(FILTROS.map((f) => [f.id, base.filter((oc) => coincide(oc, f.id)).length])),
    [base],
  )
  const inactivas = useMemo(() => ordenes.filter((oc) => !oc.activa).length, [ordenes])

  const filas = useMemo(() => {
    const txt = (v) => (v ?? '').toString().toLowerCase()
    const lista = base.filter(
      (oc) =>
        coincide(oc, filtro) &&
        txt(oc.id).includes(qOc.toLowerCase().trim()) &&
        txt(oc.proveedor).includes(qProv.toLowerCase().trim()) &&
        txt(oc.resp).includes(qResp.toLowerCase().trim()),
    )
    const { campo, dir } = orden
    const signo = dir === 'asc' ? 1 : -1
    const val = (oc) =>
      campo === 'fechaDoc' || campo === 'ultEmbarque'
        ? oc[campo]
          ? parseISO(oc[campo]).getTime()
          : 0
        : oc[campo]
    return [...lista].sort((a, b) => (val(a) === val(b) ? 0 : val(a) > val(b) ? signo : -signo))
  }, [base, filtro, qOc, qProv, qResp, orden])

  const Th = ({ campo, children, className }) => (
    <th
      className={cx('th-sort', className)}
      onClick={() =>
        setOrden((o) => ({ campo, dir: o.campo === campo && o.dir === 'asc' ? 'desc' : 'asc' }))
      }
    >
      {children}
      {orden.campo === campo && (
        <span className="ml-1 inline-flex align-[-2px] text-white/80">
          {orden.dir === 'asc' ? <LuArrowUp size={11} /> : <LuArrowDown size={11} />}
        </span>
      )}
    </th>
  )

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Una sola banda: los filtros llevan el conteo y hacen de resumen,
          así no hace falta una fila de tarjetas KPI arriba. */}
      <div className="shrink-0 border-b border-line bg-surface">
        <div className="contenedor flex flex-wrap items-center gap-3 py-2.5">
        <div className="segbar">
          {FILTROS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFiltro(f.id)}
              className={cx('seg', filtro === f.id && 'seg-on')}
            >
              {f.punto && (
                <span
                  className={cx(
                    'h-[5px] w-[5px] shrink-0 rounded-full',
                    f.punto,
                    filtro === f.id && 'ring-2 ring-white/25',
                  )}
                />
              )}
              {f.rotulo}
              <span
                className={cx('num text-xs', filtro === f.id ? 'text-white/75' : 'text-ink-4')}
              >
                {conteos[f.id]}
              </span>
            </button>
          ))}
        </div>

        <label
          className={cx(
            'inline-flex h-[30px] cursor-pointer items-center gap-2 whitespace-nowrap rounded-md border py-0 pl-[9px] pr-[11px] text-sm transition duration-100',
            verInactivas
              ? 'border-navy-200 bg-navy-50 font-medium text-navy-800'
              : 'border-line bg-surface text-ink-2 hover:border-navy-400',
          )}
        >
          <input
            type="checkbox"
            className="chk"
            checked={verInactivas}
            onChange={(e) => setVerInactivas(e.target.checked)}
          />
          Ver OC inactivas
          <span className={cx('num text-xs', verInactivas ? 'text-navy-600' : 'text-ink-4')}>
            {inactivas}
          </span>
        </label>

        <span className="ml-auto whitespace-nowrap text-sm text-ink-3">
          <b className="num font-semibold text-ink">{filas.length}</b> de {base.length} órdenes
        </span>

        <span className="h-5 w-px bg-line" />

        <span className="whitespace-nowrap text-sm text-ink-3">Excel de despachos</span>
        <Button onClick={() => avisar('Plantilla de despachos descargada.', 'ok')}>
          <LuFileDown size={14} />
          Descargar
        </Button>
        <Button onClick={() => avisar('Selecciona el archivo a cargar (demo).', 'alerta')}>
          <LuFileUp size={14} />
          Cargar
        </Button>
        </div>
      </div>

      {/* La tabla vive en una caja blanca sobre el gris, como en el portal actual */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="contenedor py-5">
          <div className="panel tabla-scroll">
            <table className="tbl">
          <thead>
            <tr>
              <th className="w-[46px]" title="Crear despacho">
                Prog.
              </th>
              <Th campo="id" className="w-[108px]">
                Orden compra
              </Th>
              <Th campo="proveedor" className="min-w-[210px]">
                Proveedor
              </Th>
              <Th campo="incoterm" className="w-[92px]">
                Incoterm
              </Th>
              <th className="w-[128px]">Propuesta</th>
              <Th campo="fechaDoc" className="w-[104px]">
                Fecha doc.
              </Th>
              <Th campo="ultEmbarque" className="w-[112px]">
                Últ. embarque
              </Th>
              <th className="w-[66px] text-right!" title="Días desde la fecha de documento">
                Días
              </th>
              <th className="w-[176px]">Situación</th>
              <th className="w-[128px]">Despachado</th>
              <Th campo="resp" className="w-[180px]">
                Resp. compra
              </Th>
              <th className="w-[104px]">Estado</th>
              <th className="w-[138px] text-right!">Acciones</th>
            </tr>
            <tr className="filtros">
              <th />
              <th>
                <FiltroCol valor={qOc} onChange={setQOc} />
              </th>
              <th>
                <FiltroCol valor={qProv} onChange={setQProv} />
              </th>
              <th colSpan={7} />
              <th>
                <FiltroCol valor={qResp} onChange={setQResp} />
              </th>
              <th colSpan={2} />
            </tr>
          </thead>

          <tbody>
            {filas.length === 0 && (
              <tr>
                <td colSpan={13} className="h-[148px]! bg-surface text-center">
                  <span className="inline-flex flex-col items-center gap-[7px]">
                    <LuSearchX size={26} strokeWidth={1.5} className="text-navy-200" />
                    <span className="text-base font-semibold text-ink-2">Ninguna OC coincide</span>
                    <span className="text-sm text-ink-3">
                      Ajusta los filtros o activa «Ver OC inactivas».
                    </span>
                  </span>
                </td>
              </tr>
            )}

            {filas.map((oc) => {
              const dias = diasEntre(parseISO(oc.fechaDoc), hoy())
              const sit = SITUACIONES[oc.pendiente]
              const IconoSit = sit?.icono
              const totalKg = cantidadTotalOc(oc)
              const pct = totalKg ? Math.round((cantidadDespachada(oc) / totalKg) * 100) : 0
              const cerrada = oc.estado === 'cerrada'
              // el lomo solo se pinta cuando la fila pide acción: así el ojo va a lo que falta
              const spine = !oc.activa
                ? 'rgba(0,48,73,0.16)'
                : !cerrada && oc.pendiente
                  ? 'var(--color-ambar-500)'
                  : 'transparent'
              const embarqueViejo = oc.ultEmbarque && diasEntre(parseISO(oc.ultEmbarque), hoy()) > 120

              return (
                <tr key={oc.id} className={cx(!oc.activa && 'row-off')} style={{ '--spine': spine }}>
                  <td className="text-center">
                    <button
                      disabled={!oc.activa || cerrada}
                      onClick={() => setOcDespacho(oc)}
                      title={
                        cerrada
                          ? 'OC cerrada — no admite despachos'
                          : !oc.activa
                            ? 'OC inactiva'
                            : 'Crear despacho'
                      }
                      className={cx(
                        'inline-flex h-6 w-[26px] items-center justify-center rounded-xs border transition duration-100',
                        'hover:not-disabled:border-navy-800 hover:not-disabled:bg-navy-800 hover:not-disabled:text-white',
                        'active:not-disabled:scale-90 disabled:cursor-not-allowed disabled:opacity-30',
                        oc.sugerencia
                          ? 'border-ambar-100 bg-ambar-50 text-ambar-700'
                          : 'border-line bg-surface text-navy-600',
                      )}
                    >
                      <LuTruck size={14} />
                    </button>
                  </td>

                  <td className="cell-key">{oc.id}</td>

                  <td className="cell-strong cell-cut" title={oc.proveedor}>
                    {oc.proveedor}
                  </td>

                  <td>{oc.incoterm}</td>

                  <td>
                    {oc.sugerencia ? (
                      <span
                        title="Hay una propuesta de ruta y fechas lista para esta OC"
                        className="inline-flex items-center gap-1.5 whitespace-nowrap text-sm font-medium text-ambar-700"
                      >
                        <LuSparkles size={13} className="text-ambar-500" />
                        Sugerencia
                      </span>
                    ) : (
                      <span className="text-ink-4">—</span>
                    )}
                  </td>

                  <td className="num text-ink">{fmtFechaCorta(oc.fechaDoc)}</td>

                  {/* NUEVA: última vez que este producto ingresó de este proveedor */}
                  <td>
                    {oc.ultEmbarque ? (
                      <span className="flex flex-col gap-px leading-tight">
                        <span className="num text-ink">{fmtFechaCorta(oc.ultEmbarque)}</span>
                        <span
                          className={cx(
                            'text-3xs',
                            embarqueViejo ? 'font-semibold text-ambar-600' : 'text-ink-4',
                          )}
                        >
                          {desdeHoy(oc.ultEmbarque)}
                        </span>
                      </span>
                    ) : (
                      <span className="text-sm text-ink-4" title="Primer ingreso de este material">
                        Primer ingreso
                      </span>
                    )}
                  </td>

                  <td className={cx('cell-num', dias > 90 && 'text-ink-3')}>{dias}</td>

                  <td>
                    {sit ? (
                      <span className="inline-flex items-center gap-1.5 text-ink-2">
                        <IconoSit size={13} className="text-ink-3" />
                        {sit.rotulo}
                      </span>
                    ) : (
                      <span className="text-ink-4">Sin pendientes</span>
                    )}
                  </td>

                  <td>
                    {pct > 0 ? (
                      <span className="flex items-center gap-2">
                        <span className="h-1 w-11 shrink-0 overflow-hidden rounded-sm bg-surface-3">
                          <span
                            className="block h-full rounded-sm bg-teal-600"
                            style={{ width: `${pct}%` }}
                          />
                        </span>
                        <span className="num">{pct}%</span>
                      </span>
                    ) : (
                      <span className="text-ink-4">—</span>
                    )}
                  </td>

                  <td className="cell-cut" title={oc.resp}>
                    {oc.resp}
                  </td>

                  {/* Estado de la OC: se cambia desde la propia fila */}
                  <td>
                    <button
                      onClick={() => {
                        toggleEstado(oc.id)
                        avisar(`OC ${oc.id} ${cerrada ? 'reabierta' : 'cerrada'}.`, cerrada ? 'ok' : 'alerta')
                      }}
                      title={cerrada ? 'Reabrir la OC' : 'Cerrar la OC (deja de admitir despachos)'}
                      className={cx(
                        'inline-flex h-[22px] items-center gap-1.5 whitespace-nowrap rounded-full border py-0 pl-[7px] pr-[9px] text-xs font-semibold transition duration-100 hover:brightness-97 active:scale-95',
                        cerrada
                          ? 'border-line bg-surface-3 text-ink-2'
                          : 'border-teal-100 bg-teal-50 text-teal-700',
                      )}
                    >
                      {cerrada ? 'Cerrada' : 'Abierta'}
                    </button>
                  </td>

                  <td>
                    <div className="flex items-center justify-end">
                      <button className="ico" title="Editar OC: cantidades, precios y datos" onClick={() => setOcEditar(oc)}>
                        <LuSquarePen size={14} />
                      </button>

                      <button
                        className={cx('ico', oc.nota && 'ico-on')}
                        title={oc.nota || 'Sin nota'}
                        onClick={() => setOcEditar(oc)}
                      >
                        <LuStickyNote size={14} />
                      </button>

                      <button
                        className={cx('ico', oc.selloPendiente && 'ico-on')}
                        title={oc.selloPendiente ? 'Sello pendiente' : 'Sellada'}
                        onClick={() =>
                          avisar(
                            oc.selloPendiente
                              ? `OC ${oc.id}: sello pendiente de aplicar.`
                              : `OC ${oc.id} ya está sellada.`,
                            oc.selloPendiente ? 'alerta' : 'ok',
                          )
                        }
                      >
                        <LuStamp size={14} />
                      </button>

                      {/* Inactivar / reactivar */}
                      <button
                        className="ico ico-ambar"
                        title={oc.activa ? 'Inactivar OC' : 'Reactivar OC'}
                        onClick={() => {
                          toggleActiva(oc.id)
                          avisar(
                            `OC ${oc.id} ${oc.activa ? 'inactivada' : 'reactivada'}.`,
                            oc.activa ? 'alerta' : 'ok',
                          )
                        }}
                      >
                        {oc.activa ? <LuBan size={14} /> : <LuRotateCcw size={14} />}
                      </button>

                      <button
                        className="ico ico-rojo"
                        title="Eliminar OC"
                        onClick={() => avisar('Eliminar requiere aprobación de Compras (demo).', 'rojo')}
                      >
                        <LuTrash2 size={14} />
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
      </div>

      <ModalCrearDespacho oc={ocDespacho} onClose={() => setOcDespacho(null)} />
      <ModalEditarOc oc={ocEditar} onClose={() => setOcEditar(null)} />
    </div>
  )
}
