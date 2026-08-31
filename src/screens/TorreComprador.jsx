import { useMemo, useState } from 'react'
import {
  LuBell,
  LuCalendarRange,
  LuCircleCheck,
  LuClipboardList,
  LuEllipsis,
  LuLayoutDashboard,
  LuMapPinned,
  LuShip,
  LuStamp,
  LuTriangleAlert,
  LuWarehouse,
} from 'react-icons/lu'
import Button, { cx } from '../components/ui/Button'
import ModalEmbarque from '../components/ModalEmbarque'
import { Select } from '../components/ui/Field'
import { Kpi } from '../components/ui/Valores'
import { useOc } from '../data/store'
import { construirComprador } from '../lib/comprador'
import { NIVELES, construirAlertas, construirEmbarques } from '../lib/torre'
import { fmtFechaCorta, fmtNum } from '../lib/fechas'

const VISTAS = [
  { id: 'resumen', rotulo: 'Resumen', icono: LuLayoutDashboard },
  { id: 'sinProgramacion', rotulo: 'Sin programación', icono: LuTriangleAlert },
  { id: 'programacion', rotulo: 'Programación proveedor', icono: LuCalendarRange },
  { id: 'transito', rotulo: 'En tránsito', icono: LuShip },
  { id: 'aduana', rotulo: 'En aduana', icono: LuStamp },
  { id: 'planta', rotulo: 'En planta', icono: LuWarehouse },
  { id: 'entregados', rotulo: 'Entregados', icono: LuCircleCheck },
  { id: 'alertas', rotulo: 'Alertas', icono: LuBell },
  { id: 'sitios', rotulo: 'Sitios / CEDIS', icono: LuMapPinned },
]

const TONO_RIESGO = {
  'En tiempo': 'bg-teal-50 text-teal-700',
  Vigilancia: 'bg-ambar-50 text-ambar-700',
  Riesgo: 'bg-rojo-50 text-rojo-700',
}

const TONO_IMPACTO = { Alto: 'text-rojo-700', Medio: 'text-ambar-700', Bajo: 'text-teal-700' }

const TONO_NIVEL = {
  teal: 'border-teal-100 bg-teal-50 text-teal-700',
  ambar: 'border-ambar-100 bg-ambar-50 text-ambar-700',
  rojo: 'border-rojo-100 bg-rojo-50 text-rojo-700',
}

function Barra({ pct }) {
  const tono = pct >= 80 ? 'bg-teal-600' : pct >= 40 ? 'bg-navy-600' : 'bg-ambar-500'
  return (
    <span className="flex items-center gap-2">
      <span className="h-[5px] w-[70px] overflow-hidden rounded-full bg-surface-3">
        <span className={cx('block h-full', tono)} style={{ width: `${pct}%` }} />
      </span>
      <span className="num text-xs text-ink-3">{pct}%</span>
    </span>
  )
}

function Chip({ tono, children }) {
  return (
    <span
      className={cx(
        'inline-block whitespace-nowrap rounded-full px-2.5 py-[3px] text-xs font-semibold',
        tono ?? 'bg-surface-3 text-ink-2',
      )}
    >
      {children}
    </span>
  )
}

function Tabla({ columnas, filas, vacio, children }) {
  return (
    <div className="panel tabla-scroll">
      <table className="tbl">
        <thead>
          <tr>
            {columnas.map(([rotulo, ancho]) => (
              <th key={rotulo} className={ancho}>
                {rotulo}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filas.length === 0 && (
            <tr>
              <td colSpan={columnas.length} className="h-[140px]! bg-surface text-center text-sm text-ink-3">
                {vacio}
              </td>
            </tr>
          )}
          {filas.map(children)}
        </tbody>
      </table>
    </div>
  )
}

/** Torre del comprador: la misma operación, contada desde el pedido. */
export default function TorreComprador() {
  const { ordenes, avisar } = useOc()
  const [vista, setVista] = useState('resumen')
  const [proveedor, setProveedor] = useState('')
  const [sku, setSku] = useState('')
  // Embarque cuyo detalle se está viendo: { embarque, tipo: 'transito' | 'aduana' }.
  const [detalle, setDetalle] = useState(null)

  // Ya no llega por prop del portal: la pantalla es su propia ruta.
  const embarques = useMemo(() => construirEmbarques(ordenes), [ordenes])
  const d = useMemo(() => construirComprador(ordenes, embarques), [ordenes, embarques])
  const alertas = useMemo(() => construirAlertas(embarques), [embarques])

  // Opciones de los dos filtros de cabecera, sacadas de las OC activas.
  const proveedores = useMemo(
    () => [...new Set(ordenes.filter((o) => o.activa).map((o) => o.proveedor))].sort(),
    [ordenes],
  )
  const skus = useMemo(
    () =>
      [
        ...new Set(ordenes.filter((o) => o.activa).flatMap((o) => o.materiales.map((m) => m.nombre))),
      ].sort(),
    [ordenes],
  )

  // Dos filtros de cabecera para todas las vistas: proveedor y SKU. La OC y el
  // SKU de cada fila viven en campos distintos según la vista (en entregados el
  // SKU es la lista de materiales de la OC).
  const filtrar = (filas) =>
    filas.filter((f) => {
      const prov = f.oc?.proveedor ?? f.embarque?.oc?.proveedor
      const okProv = !proveedor || prov === proveedor
      const okSku =
        !sku ||
        f.sku === sku ||
        f.embarque?.material?.nombre === sku ||
        (f.oc ?? f.embarque?.oc)?.materiales?.some((m) => m.nombre === sku)
      return okProv && okSku
    })

  // Todo lo de la pantalla —cards, barras, tablas y contadores— sale de estas
  // listas ya filtradas, así los números cambian junto con los selects.
  const rows = {
    sinProgramacion: filtrar(d.sinProgramacion),
    programacion: filtrar(d.programacion),
    transito: filtrar(d.transito),
    aduana: filtrar(d.aduana),
    planta: filtrar(d.planta),
    entregados: filtrar(d.entregados),
    alertas: filtrar(alertas),
  }

  const suma = (filas, valor) => filas.reduce((a, x) => a + valor(x), 0)
  const cantEmbarque = (x) => x.embarque.despacho.cantidad
  const totales = {
    sinProgramacion: suma(rows.sinProgramacion, (x) => x.cantidad),
    programacion: suma(rows.programacion, cantEmbarque),
    transito: suma(rows.transito, cantEmbarque),
    aduana: suma(rows.aduana, cantEmbarque),
    planta: suma(rows.planta, cantEmbarque),
    entregados: suma(rows.entregados, (x) => x.cantidad),
  }

  const cuenta = {
    resumen: null,
    sinProgramacion: rows.sinProgramacion.length,
    programacion: rows.programacion.length,
    transito: rows.transito.length,
    aduana: rows.aduana.length,
    planta: rows.planta.length,
    entregados: rows.entregados.length,
    alertas: rows.alertas.length + rows.sinProgramacion.length,
    sitios: d.sitios.length,
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="m-0 text-lg font-bold text-navy-800">Torre de control del comprador</h2>
          <p className="m-0 text-sm text-ink-3">
            Visibilidad de pedidos, embarques y entregas. Son las mismas órdenes que gestiona
            Abastecimiento, vistas desde el pedido.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select
            placeholder="Todos los proveedores"
            options={proveedores}
            value={proveedor}
            onChange={(e) => setProveedor(e.target.value)}
            className="w-[220px]"
          />
          <Select
            placeholder="Todos los SKU"
            options={skus}
            value={sku}
            onChange={(e) => setSku(e.target.value)}
            className="w-[220px]"
          />
        </div>
      </div>

      <div className="tabbar">
        {VISTAS.map(({ id, rotulo, icono: Icono }) => {
          const activo = vista === id
          return (
            <button key={id} onClick={() => setVista(id)} className={cx('tab', activo && 'tab-on')}>
              <Icono size={14} className={activo ? 'text-navy-700' : 'text-ink-4'} />
              {rotulo}
              {cuenta[id] != null && <span className="tab-n">{cuenta[id]}</span>}
            </button>
          )
        })}
      </div>

      {/* -------------------------------- RESUMEN -------------------------------- */}
      {vista === 'resumen' && (
        <>
          <div className="flex flex-wrap gap-2">
            <Kpi rotulo="Sin programación" valor={fmtNum(totales.sinProgramacion)} tono="border-rojo-100 bg-rojo-50" />
            <Kpi rotulo="Programado" valor={fmtNum(totales.programacion)} tono="border-ambar-100 bg-ambar-50" />
            <Kpi rotulo="En tránsito" valor={fmtNum(totales.transito)} />
            <Kpi rotulo="En aduana" valor={fmtNum(totales.aduana)} />
            <Kpi rotulo="En planta" valor={fmtNum(totales.planta)} />
            <Kpi rotulo="Entregado" valor={fmtNum(totales.entregados)} tono="border-teal-100 bg-teal-50" />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="panel">
              <div className="panel-head">
                <span className="panel-title">Pedidos por etapa</span>
                <span className="ml-auto text-sm text-ink-3">unidades</span>
              </div>
              <div className="flex flex-col gap-2.5 p-4">
                {[
                  ['Sin programación', totales.sinProgramacion, 'bg-rojo-600'],
                  ['Programado', totales.programacion, 'bg-ambar-500'],
                  ['En tránsito', totales.transito, 'bg-navy-600'],
                  ['En aduana', totales.aduana, 'bg-navy-400'],
                  ['En planta', totales.planta, 'bg-teal-600'],
                  ['Entregado', totales.entregados, 'bg-teal-700'],
                ].map(([rotulo, valor, tono]) => {
                  const max = Math.max(...Object.values(totales), 1)
                  return (
                    <div key={rotulo}>
                      <div className="flex items-baseline justify-between gap-3 text-sm">
                        <span className="text-ink-2">{rotulo}</span>
                        <b className="num font-bold text-navy-800">{fmtNum(valor)}</b>
                      </div>
                      <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-surface-3">
                        <span className={cx('block h-full', tono)} style={{ width: `${(valor / max) * 100}%` }} />
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="panel">
              <div className="panel-head">
                <span className="panel-title">Alertas prioritarias</span>
              </div>
              <div className="flex flex-col gap-2 p-4">
                {rows.sinProgramacion.length === 0 && rows.alertas.length === 0 && (
                  <p className="text-sm text-ink-3">Ningún pedido requiere gestión en este momento.</p>
                )}
                {rows.sinProgramacion.slice(0, 3).map((f) => (
                  <div key={f.clave} className="rounded-sm border border-rojo-100 bg-rojo-50 px-3 py-2 text-sm text-rojo-700">
                    <b className="font-bold">OC {f.oc.id} — {f.motivo}</b>
                    <span className="block">
                      {fmtNum(f.cantidad)} {f.unidad} sin programación del proveedor.
                    </span>
                  </div>
                ))}
                {rows.alertas.slice(0, 3).map((a) => (
                  <div key={a.clave} className={cx('rounded-sm border px-3 py-2 text-sm', TONO_NIVEL[NIVELES[a.nivel].tono])}>
                    <b className="font-bold">{a.embarque.id}</b>
                    <span className="block">{a.texto}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <Tabla
            columnas={[
              ['OC', 'w-[110px]'],
              ['SKU', 'min-w-[190px]'],
              ['Proveedor', 'w-[210px]'],
              ['Sitio', 'w-[180px]'],
              ['Cantidad', 'w-[120px] text-right!'],
              ['Estatus', 'w-[150px]'],
              ['ETA', 'w-[110px]'],
              ['Alerta', 'w-[170px]'],
            ]}
            filas={rows.programacion}
            vacio="Ningún pedido con ese criterio."
          >
            {(f) => (
              <tr key={f.clave}>
                <td className="cell-key">{f.oc.id}</td>
                <td className="cell-cut" title={f.embarque.material?.nombre}>
                  {f.embarque.material?.nombre ?? '—'}
                </td>
                <td className="cell-cut" title={f.oc.proveedor}>
                  {f.oc.proveedor}
                </td>
                <td className="cell-cut" title={f.sitio}>
                  {f.sitio}
                </td>
                <td className="cell-num">{fmtNum(f.embarque.despacho.cantidad)}</td>
                <td className="cell-strong">{f.embarque.segmento}</td>
                <td className="num">{fmtFechaCorta(f.eta)}</td>
                <td className={f.embarque.delay > 0 ? 'text-rojo-700' : 'text-ink-3'}>
                  {f.embarque.delay > 0 ? `+${f.embarque.delay} d contra el plan` : 'Sin alerta'}
                </td>
              </tr>
            )}
          </Tabla>
        </>
      )}

      {/* --------------------------- SIN PROGRAMACIÓN ---------------------------- */}
      {vista === 'sinProgramacion' && (
        <Tabla
          columnas={[
            ['OC', 'w-[110px]'],
            ['Proveedor', 'w-[220px]'],
            ['SKU', 'min-w-[190px]'],
            ['Cantidad', 'w-[130px] text-right!'],
            ['Motivo', 'w-[230px]'],
            ['Sitio', 'w-[180px]'],
            ['Impacto', 'w-[90px]'],
            ['Acción', 'w-[190px]'],
          ]}
          filas={rows.sinProgramacion}
          vacio="Todos los pedidos tienen fecha del proveedor."
        >
          {(f) => (
            <tr key={f.clave}>
              <td className="cell-key">{f.oc.id}</td>
              <td className="cell-cut" title={f.oc.proveedor}>
                {f.oc.proveedor}
              </td>
              <td className="cell-cut" title={f.sku}>
                {f.sku}
              </td>
              <td className="cell-num">
                {fmtNum(f.cantidad)} {f.unidad}
              </td>
              <td>{f.motivo}</td>
              <td className="cell-cut" title={f.oc.centro}>
                {f.oc.centro}
              </td>
              <td className={cx('font-bold', TONO_IMPACTO[f.impacto])}>{f.impacto}</td>
              <td>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => avisar(`Programación solicitada al proveedor para la OC ${f.oc.id}.`)}
                >
                  Solicitar programación
                </Button>
              </td>
            </tr>
          )}
        </Tabla>
      )}

      {/* ---------------------------- PROGRAMACIÓN ------------------------------- */}
      {vista === 'programacion' && (
        <Tabla
          columnas={[
            ['OC', 'w-[110px]'],
            ['Proveedor', 'w-[220px]'],
            ['Embarque', 'w-[150px]'],
            ['Carga / zarpe', 'w-[120px]'],
            ['ETA frontera', 'w-[120px]'],
            ['ETA planta', 'w-[120px]'],
            ['Sitio', 'w-[180px]'],
            ['Estado', 'w-[130px]'],
          ]}
          filas={rows.programacion}
          vacio="Ningún despacho programado."
        >
          {(f) => (
            <tr key={f.clave}>
              <td className="cell-key">{f.oc.id}</td>
              <td className="cell-cut" title={f.oc.proveedor}>
                {f.oc.proveedor}
              </td>
              <td className="num">{f.embarque.id}</td>
              <td className="num">{fmtFechaCorta(f.zarpe)}</td>
              <td className="num">{fmtFechaCorta(f.embarque.frontera)}</td>
              <td className="num cell-strong">{fmtFechaCorta(f.eta)}</td>
              <td className="cell-cut" title={f.sitio}>
                {f.sitio}
              </td>
              <td>
                <Chip tono={f.estado === 'Confirmada' ? 'bg-teal-50 text-teal-700' : 'bg-ambar-50 text-ambar-700'}>
                  {f.estado}
                </Chip>
              </td>
            </tr>
          )}
        </Tabla>
      )}

      {/* ------------------------------- TRÁNSITO -------------------------------- */}
      {vista === 'transito' && (
        <Tabla
          columnas={[
            ['Embarque', 'w-[150px]'],
            ['OC', 'w-[110px]'],
            ['Origen', 'w-[170px]'],
            ['Destino / sitio', 'w-[180px]'],
            ['Etapa', 'w-[170px]'],
            ['ETA planta', 'w-[120px]'],
            ['Avance', 'w-[140px]'],
            ['Riesgo', 'w-[130px]'],
            ['', 'w-[52px]'],
          ]}
          filas={rows.transito}
          vacio="Ningún embarque en tránsito."
        >
          {(f) => (
            <tr key={f.clave}>
              <td className="cell-key">{f.embarque.id}</td>
              <td className="num">{f.oc.id}</td>
              <td className="cell-cut" title={f.embarque.ruta.origen}>
                {f.embarque.ruta.origen}
              </td>
              <td className="cell-cut" title={f.sitio}>
                {f.sitio}
              </td>
              <td className="cell-strong">{f.embarque.segmento}</td>
              <td className="num">{fmtFechaCorta(f.embarque.planta)}</td>
              <td>
                <Barra pct={f.avance} />
              </td>
              <td>
                <Chip tono={TONO_RIESGO[f.riesgo]}>{f.riesgo}</Chip>
              </td>
              <td>
                <div className="flex justify-end">
                  <button
                    className="ico"
                    title="Ver detalle del embarque"
                    onClick={() => setDetalle({ embarque: f.embarque, tipo: 'transito' })}
                  >
                    <LuEllipsis size={15} />
                  </button>
                </div>
              </td>
            </tr>
          )}
        </Tabla>
      )}

      {/* -------------------------------- ADUANA --------------------------------- */}
      {vista === 'aduana' && (
        <Tabla
          columnas={[
            ['Embarque', 'w-[150px]'],
            ['OC', 'w-[110px]'],
            ['Aduana', 'w-[160px]'],
            ['Hito del trámite', 'w-[170px]'],
            ['Documentos', 'w-[130px]'],
            ['ETA planta', 'w-[120px]'],
            ['SLA', 'w-[120px]'],
            ['Riesgo', 'w-[130px]'],
            ['', 'w-[52px]'],
          ]}
          filas={rows.aduana}
          vacio="Ningún embarque en aduana de destino."
        >
          {(f) => (
            <tr key={f.clave}>
              <td className="cell-key">{f.embarque.id}</td>
              <td className="num">{f.oc.id}</td>
              <td className="cell-cut" title={f.embarque.ruta.frontera}>
                {f.embarque.ruta.frontera}
              </td>
              <td className="cell-strong">{f.hito}</td>
              <td>
                <Chip tono={f.documentos === 'Completos' ? 'bg-teal-50 text-teal-700' : 'bg-ambar-50 text-ambar-700'}>
                  {f.documentos}
                </Chip>
              </td>
              <td className="num">{fmtFechaCorta(f.embarque.planta)}</td>
              <td>
                <Chip
                  tono={
                    f.sla === 'ok'
                      ? 'bg-teal-50 text-teal-700'
                      : f.sla === 'riesgo'
                        ? 'bg-ambar-50 text-ambar-700'
                        : 'bg-rojo-50 text-rojo-700'
                  }
                >
                  {f.sla === 'ok' ? 'En tiempo' : f.sla === 'riesgo' ? 'Por vencer' : 'Vencido'}
                </Chip>
              </td>
              <td>
                <Chip tono={TONO_RIESGO[f.riesgo]}>{f.riesgo}</Chip>
              </td>
              <td>
                <div className="flex justify-end">
                  <button
                    className="ico"
                    title="Ver bitácora del trámite aduanero"
                    onClick={() => setDetalle({ embarque: f.embarque, tipo: 'aduana' })}
                  >
                    <LuEllipsis size={15} />
                  </button>
                </div>
              </td>
            </tr>
          )}
        </Tabla>
      )}

      {/* -------------------------------- PLANTA --------------------------------- */}
      {vista === 'planta' && (
        <Tabla
          columnas={[
            ['OC', 'w-[110px]'],
            ['Embarque', 'w-[150px]'],
            ['Sitio', 'w-[190px]'],
            ['Arribo', 'w-[120px]'],
            ['Cantidad', 'w-[130px] text-right!'],
            ['Recepción', 'w-[150px]'],
            ['Riesgo', 'w-[130px]'],
          ]}
          filas={rows.planta}
          vacio="Ningún embarque en planta."
        >
          {(f) => (
            <tr key={f.clave}>
              <td className="cell-key">{f.oc.id}</td>
              <td className="num">{f.embarque.id}</td>
              <td className="cell-cut" title={f.sitio}>
                {f.sitio}
              </td>
              <td className="num">{fmtFechaCorta(f.embarque.planta)}</td>
              <td className="cell-num">{fmtNum(f.embarque.despacho.cantidad)}</td>
              <td>
                <Chip tono="bg-navy-50 text-navy-700">Programada</Chip>
              </td>
              <td>
                <Chip tono={TONO_RIESGO[f.riesgo]}>{f.riesgo}</Chip>
              </td>
            </tr>
          )}
        </Tabla>
      )}

      {/* ------------------------------ ENTREGADOS ------------------------------- */}
      {vista === 'entregados' && (
        <Tabla
          columnas={[
            ['OC', 'w-[110px]'],
            ['Proveedor', 'w-[220px]'],
            ['Sitio', 'w-[190px]'],
            ['Embarques', 'w-[110px] text-right!'],
            ['Fecha de entrega', 'w-[140px]'],
            ['Cantidad', 'w-[140px] text-right!'],
            ['Cumplimiento', 'w-[160px]'],
          ]}
          filas={rows.entregados}
          vacio="Ningún pedido entregado por completo todavía."
        >
          {(f) => (
            <tr key={f.clave}>
              <td className="cell-key">{f.oc.id}</td>
              <td className="cell-cut" title={f.oc.proveedor}>
                {f.oc.proveedor}
              </td>
              <td className="cell-cut" title={f.oc.centro}>
                {f.oc.centro}
              </td>
              <td className="cell-num">{f.embarques.length}</td>
              <td className="num">{fmtFechaCorta(f.entrega)}</td>
              <td className="cell-num">
                {fmtNum(f.cantidad)} {f.unidad}
              </td>
              <td>
                <Chip tono={f.enFecha ? 'bg-teal-50 text-teal-700' : 'bg-ambar-50 text-ambar-700'}>
                  {f.cumplimiento}
                </Chip>
              </td>
            </tr>
          )}
        </Tabla>
      )}

      {/* ------------------------------- ALERTAS --------------------------------- */}
      {vista === 'alertas' && (
        <div className="panel">
          <div className="panel-head">
            <span className="panel-title">Centro de alertas</span>
            <Button
              size="sm"
              className="ml-auto"
              onClick={() => avisar('Alertas notificadas a Abastecimiento.', 'alerta')}
            >
              <LuBell size={14} /> Notificar
            </Button>
          </div>
          <div className="flex flex-col gap-2 p-4">
            {rows.sinProgramacion.length === 0 && rows.alertas.length === 0 && (
              <p className="text-sm text-ink-3">Sin alertas activas.</p>
            )}
            {rows.sinProgramacion.map((f) => (
              <div
                key={f.clave}
                className="flex flex-wrap items-start gap-2.5 rounded-sm border border-rojo-100 bg-rojo-50 px-3 py-2.5 text-sm text-rojo-700"
              >
                <LuTriangleAlert size={15} className="mt-px shrink-0" />
                <span className="min-w-0 flex-1">
                  <b className="font-bold">OC {f.oc.id} — {f.motivo}</b>
                  <span className="block">
                    {fmtNum(f.cantidad)} {f.unidad} para {f.oc.centro}. Impacto {f.impacto.toLowerCase()}.
                  </span>
                </span>
              </div>
            ))}
            {rows.alertas.map((a) => (
              <div
                key={a.clave}
                className={cx(
                  'flex flex-wrap items-start gap-2.5 rounded-sm border px-3 py-2.5 text-sm',
                  TONO_NIVEL[NIVELES[a.nivel].tono],
                )}
              >
                <LuClipboardList size={15} className="mt-px shrink-0" />
                <span className="min-w-0 flex-1">
                  <b className="font-bold">
                    {NIVELES[a.nivel].rotulo} · {a.embarque.id}
                  </b>
                  <span className="block">{a.texto}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* -------------------------------- SITIOS --------------------------------- */}
      {vista === 'sitios' && (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {d.sitios.length === 0 && (
            <div className="panel p-4 text-sm text-ink-3">Ningún sitio con embarques activos.</div>
          )}
          {d.sitios.map((s) => (
            <div key={s.clave} className="panel p-4">
              <div className="flex items-baseline gap-2">
                <LuWarehouse size={15} className="shrink-0 text-navy-400" />
                <b className="min-w-0 flex-1 truncate font-bold text-navy-800">{s.centro}</b>
              </div>
              <p className="mt-1 text-sm text-ink-3">
                {s.activos} embarque(s) activo(s)
                {s.alertas > 0 && (
                  <>
                    {' · '}
                    <b className="font-bold text-rojo-700">{s.alertas} con alerta</b>
                  </>
                )}
              </p>
              <div className="mt-2">
                <Barra pct={s.avance} />
              </div>
            </div>
          ))}
        </div>
      )}

      <ModalEmbarque
        embarque={detalle?.embarque}
        tipo={detalle?.tipo}
        onClose={() => setDetalle(null)}
      />
    </div>
  )
}
