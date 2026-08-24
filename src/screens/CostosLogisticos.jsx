import { useEffect, useRef, useMemo, useState } from 'react'
import { LuChevronDown, LuFileDown, LuPrinter, LuSearchX, LuZap } from 'react-icons/lu'
import Button, { cx } from '../components/ui/Button'
import { Input, Select } from '../components/ui/Field'
import ModalCostoEmbarque from './ModalCostoEmbarque'
import { useOc } from '../data/store'
import { MODULOS_COSTOS, VISTAS_COSTOS } from '../data/costos'

// Los tonos del HTML de referencia traducidos a la paleta del portal.
const TONO_METRICA = {
  red: 'border-rojo-100 bg-rojo-50',
  yellow: 'border-ambar-100 bg-ambar-50',
  green: 'border-teal-100 bg-teal-50',
  purple: 'border-navy-100 bg-navy-50',
}

const TONO_BADGE = {
  delay: 'bg-rojo-50 text-rojo-700',
  chasis: 'bg-navy-50 text-navy-700',
  multa: 'bg-ambar-50 text-ambar-700',
  alm: 'bg-teal-50 text-teal-700',
  high: 'bg-rojo-50 text-rojo-700',
  med: 'bg-ambar-50 text-ambar-700',
  low: 'bg-teal-50 text-teal-700',
}

const TONO_PUNTO = {
  rojo: 'bg-rojo-600',
  ambar: 'bg-ambar-500',
  verde: 'bg-teal-600',
  azul: 'bg-navy-600',
}

const ACCION_TONO = { Validar: 'text-teal-700', Aprobar: 'text-navy-700', Revisar: 'text-navy-700' }

// Las seis acciones masivas del Resumen; en la demo cada una deja su aviso.
const ACCIONES = [
  'Generar alerta',
  'Generar nota automática',
  'Escalar casos críticos',
  'Solicitar aprobación de pago',
  'Notificar áreas interesadas',
  'Actualizar proyección',
]

function MenuAcciones({ onAccion }) {
  const [abierto, setAbierto] = useState(false)
  const caja = useRef(null)

  useEffect(() => {
    if (!abierto) return
    const fuera = (e) => {
      if (!caja.current?.contains(e.target)) setAbierto(false)
    }
    document.addEventListener('mousedown', fuera)
    return () => document.removeEventListener('mousedown', fuera)
  }, [abierto])

  return (
    <div className="relative" ref={caja}>
      <Button size="sm" variant="primary" onClick={() => setAbierto((v) => !v)}>
        <LuZap size={14} /> Acciones
        <LuChevronDown size={13} className={cx('transition-transform duration-150', abierto && 'rotate-180')} />
      </Button>
      {abierto && (
        <div className="absolute right-0 top-full z-50 mt-1.5 w-64 overflow-hidden rounded-sm border border-line bg-surface shadow-[0_14px_32px_-12px_rgba(0,28,44,0.45)]">
          {ACCIONES.map((a) => (
            <button
              key={a}
              onClick={() => {
                onAccion(a)
                setAbierto(false)
              }}
              className="block w-full px-3 py-2.5 text-left text-sm text-ink transition-colors duration-100 hover:bg-surface-2"
            >
              {a}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function Metrica({ m }) {
  return (
    <div
      className={cx(
        'min-w-[150px] flex-1 rounded-sm border p-3',
        TONO_METRICA[m.tono] ?? 'border-line bg-surface-2',
      )}
    >
      <span className="block text-xs text-ink-3">{m.rotulo}</span>
      <b className="num block text-xl leading-tight font-bold text-navy-800">{m.valor}</b>
      {m.pie && <span className="block text-xs text-ink-3">{m.pie}</span>}
    </div>
  )
}

function Nota({ nota }) {
  return (
    <div
      className={cx(
        'rounded-sm border px-3 py-2 text-sm',
        nota.tipo === 'alert'
          ? 'border-rojo-100 bg-rojo-50 text-rojo-700'
          : 'border-line bg-surface-2 text-ink-2',
      )}
    >
      {nota.texto}
    </div>
  )
}

function Celda({ celda, onAccion }) {
  if (celda.acciones)
    return (
      <div className="flex flex-wrap gap-1.5">
        {celda.acciones.map((a) => (
          <button
            key={a}
            onClick={() => onAccion(a)}
            className={cx(
              'rounded-xs border border-line bg-surface px-2 py-[3px] text-xs font-semibold transition-colors duration-100 hover:bg-surface-2',
              ACCION_TONO[a] ?? 'text-ink-2',
            )}
          >
            {a}
          </button>
        ))}
      </div>
    )

  if (celda.badge)
    return (
      <span
        className={cx(
          'inline-block whitespace-nowrap rounded-full px-2.5 py-[3px] text-xs font-semibold',
          TONO_BADGE[celda.badge] ?? 'bg-surface-3 text-ink-2',
        )}
      >
        {celda.texto}
      </span>
    )

  if (celda.punto)
    return (
      <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
        <span className={cx('h-2 w-2 shrink-0 rounded-full', TONO_PUNTO[celda.punto])} />
        {celda.texto}
      </span>
    )

  return <span className={celda.fuerte ? 'cell-strong' : undefined}>{celda.texto}</span>
}

/** Costos logísticos: el módulo se elige por select y sus vistas son los tabs. */
export default function CostosLogisticos() {
  const { avisar } = useOc()
  const [moduloId, setModuloId] = useState(MODULOS_COSTOS[0].id)
  const [vistaId, setVistaId] = useState(MODULOS_COSTOS[0].vistas[0])
  const [tab, setTab] = useState('Todos')
  const [sitio, setSitio] = useState('')
  const [q, setQ] = useState('')
  const [detalle, setDetalle] = useState(null)

  const modulo = MODULOS_COSTOS.find((m) => m.id === moduloId)
  const v = VISTAS_COSTOS[vistaId]

  const limpiar = () => {
    setTab('Todos')
    setSitio('')
    setQ('')
  }

  const cambiarModulo = (id) => {
    setModuloId(id)
    setVistaId(MODULOS_COSTOS.find((m) => m.id === id).vistas[0])
    limpiar()
  }

  const cambiarVista = (id) => {
    setVistaId(id)
    limpiar()
  }

  // Los filtros se resuelven por nombre de columna: cada vista trae las suyas.
  const iSitio = v.columnas ? v.columnas.findIndex((c) => /sitio/i.test(c)) : -1
  const iTipo = v.columnas ? v.columnas.findIndex((c) => /^costo$|^tipo$/i.test(c)) : -1

  const filas = useMemo(() => {
    if (!v.filas) return []
    const texto = q.trim().toLowerCase()
    return v.filas.filter((f) => {
      if (sitio && iSitio >= 0 && f[iSitio]?.texto !== sitio) return false
      if (tab !== 'Todos' && iTipo >= 0 && f[iTipo]?.texto !== tab) return false
      if (!texto) return true
      return f.some((c) => (c.texto ?? '').toLowerCase().includes(texto))
    })
  }, [v, q, sitio, tab, iSitio, iTipo])

  const informe = (que) => avisar(que + ' · ' + v.titulo + ' (demo).')

  return (
    <div className="flex flex-col gap-4">
      {/* Módulo por select y sus vistas como tabs: es el sidebar del HTML plegado */}
      <div className="flex flex-wrap items-center gap-3">
        <Select
          className="w-[220px]"
          value={moduloId}
          onChange={(e) => cambiarModulo(e.target.value)}
          options={MODULOS_COSTOS.map((m) => ({ value: m.id, label: m.rotulo }))}
        />
        <div className="flex min-w-0 flex-1 gap-1.5 overflow-x-auto pb-1">
          {modulo.vistas.map((id) => {
            const activo = id === vistaId
            const vi = VISTAS_COSTOS[id]
            return (
              <button
                key={id}
                onClick={() => cambiarVista(id)}
                className={cx(
                  'inline-flex shrink-0 items-center gap-1.5 rounded-sm border px-3 py-1.5 text-sm transition-colors duration-100',
                  activo
                    ? 'border-navy-800 bg-navy-800 font-semibold text-white'
                    : 'border-line bg-surface text-ink-2 hover:border-navy-400 hover:text-ink',
                )}
              >
                {vi.rotulo}
                {vi.contador != null && (
                  <span
                    className={cx(
                      'num rounded-full px-1.5 text-xs font-bold',
                      activo ? 'bg-white/20' : 'bg-surface-3 text-ink-3',
                    )}
                  >
                    {vi.contador}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex flex-wrap items-start gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="m-0 truncate text-lg font-bold text-navy-800">{v.titulo}</h2>
          {v.sub && <p className="m-0 text-sm text-ink-3">{v.sub}</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          {v.tabs && <MenuAcciones onAccion={(a) => avisar(a + ' — ' + v.titulo + ' (demo).', 'alerta')} />}
          <Button size="sm" onClick={() => informe('Exportar data')}>
            <LuFileDown size={14} /> Exportar data
          </Button>
          <Button size="sm" variant="primary" onClick={() => informe('Imprimir informe')}>
            <LuPrinter size={14} /> Informe
          </Button>
        </div>
      </div>

      {v.metricas && (
        <div className="flex flex-wrap gap-2">
          {v.metricas.map((m) => (
            <Metrica key={m.rotulo} m={m} />
          ))}
        </div>
      )}

      {v.columnas && (
        <div className="flex flex-wrap items-center gap-2">
          {v.sitios && (
            <Select
              className="w-[190px]"
              value={sitio}
              onChange={(e) => setSitio(e.target.value)}
              placeholder="Todos los sitios"
              options={v.sitios.map((s) => ({ value: s, label: s }))}
            />
          )}
          <Input
            className="w-[280px]"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar embarque, OC, BL, causa..."
          />
          {(sitio || q || tab !== 'Todos') && (
            <Button size="sm" onClick={limpiar}>
              <LuSearchX size={14} /> Limpiar
            </Button>
          )}
        </div>
      )}

      {v.tabs && (
        <div className="flex flex-wrap gap-1.5 border-b border-line pb-2">
          {v.tabs.map(([clave, rotulo]) => (
            <button
              key={clave}
              onClick={() => setTab(clave)}
              className={cx(
                'rounded-sm px-2.5 py-1 text-sm transition-colors duration-100',
                tab === clave ? 'bg-navy-50 font-bold text-navy-800' : 'text-ink-2 hover:bg-surface-2',
              )}
            >
              {rotulo}
            </button>
          ))}
        </div>
      )}

      {v.columnas && (
        <div className="panel tabla-scroll">
          <table className="tbl">
            <thead>
              <tr>
                {v.columnas.map((c, i) => (
                  <th key={i}>{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filas.length === 0 && (
                <tr>
                  <td colSpan={v.columnas.length} className="text-ink-3">
                    Ningún registro con esos filtros.
                  </td>
                </tr>
              )}
              {filas.map((f, i) => (
                <tr key={i}>
                  {f.map((celda, j) => (
                    <td key={j}>
                      <Celda
                        celda={celda}
                        onAccion={(a) =>
                          a === 'Detalle'
                            ? setDetalle({ vista: v, fila: f })
                            : avisar(
                                a + ' · ' + (f[0]?.texto ?? '') + ' — registrado en la bitácora (demo).',
                                'alerta',
                              )
                        }
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {v.reglas && (
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          {v.reglas.map((r) => (
            <div key={r.titulo} className="panel p-3">
              <div className="mb-1 text-sm font-bold text-navy-800">{r.titulo}</div>
              <p className="m-0 text-sm text-ink-2">{r.texto}</p>
            </div>
          ))}
        </div>
      )}

      {v.notas && (
        <div className="flex flex-col gap-2">
          {v.notas.map((n, i) => (
            <Nota key={i} nota={n} />
          ))}
        </div>
      )}

      {v.paneles && (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          {v.paneles.map((p) => (
            <div
              key={p.titulo}
              className={cx(
                'panel flex flex-col gap-2 p-4',
                !p.barras.length && !p.filas.length && 'lg:col-span-3',
              )}
            >
              <div className="lbl">{p.titulo}</div>
              {p.filas.map(([et, val], i) => (
                <div key={et}>
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="text-ink-2">{et}</span>
                    <b className="num font-bold text-navy-800">{val}</b>
                  </div>
                  {p.barras[i] && (
                    <span className="mt-1 block h-1.5 w-full overflow-hidden rounded-full bg-surface-3">
                      <span
                        className="block h-full rounded-full"
                        style={{ width: p.barras[i][0] + '%', background: p.barras[i][1] }}
                      />
                    </span>
                  )}
                </div>
              ))}
              {p.notas.map((n, i) => (
                <Nota key={i} nota={n} />
              ))}
            </div>
          ))}
        </div>
      )}

      <ModalCostoEmbarque detalle={detalle} onClose={() => setDetalle(null)} />
    </div>
  )
}
