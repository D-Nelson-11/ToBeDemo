import { useMemo, useState } from 'react'
import {
  LuCircleCheck,
  LuFileDown,
  LuHourglass,
  LuMapPin,
  LuPackageCheck,
  LuPrinter,
  LuSearch,
  LuSearchX,
  LuTriangleAlert,
} from 'react-icons/lu'
import Button, { cx } from '../components/ui/Button'
import { Select, Textarea } from '../components/ui/Field'
import Modal from '../components/ui/Modal'
import { Dato, Kpi } from '../components/ui/Valores'
import { useOc } from '../data/store'
import { ESTADOS_DOCUMENTO, NAVIERAS, TRANSPORTISTAS } from '../lib/torre'
import { fmtFechaCorta, fmtFechaHora } from '../lib/fechas'

const TONO_ESTADO = {
  Liberado: { chip: 'bg-teal-50 text-teal-700', lomo: 'var(--color-teal-600)', icono: LuCircleCheck },
  Pendiente: { chip: 'bg-ambar-50 text-ambar-700', lomo: 'var(--color-ambar-500)', icono: LuHourglass },
  Recolectado: { chip: 'bg-navy-50 text-navy-700', lomo: 'var(--color-navy-600)', icono: LuPackageCheck },
}

const TONO_RELEVANCIA = { Alta: 'text-rojo-700', Media: 'text-ambar-700' }

const INSTRUCCION_BASE =
  'Recolectar documento liberado. Confirmar recepción física y entregar al responsable de aduana de destino.'

/** Liberación de documentos de transporte: identificar y mandar a recolectar. */
export default function LiberacionDocumentos({ documentos }) {
  const { recolectarDocumento, avisar } = useOc()
  const [q, setQ] = useState('')
  const [estado, setEstado] = useState('')
  const [emisor, setEmisor] = useState('')
  const [recolectando, setRecolectando] = useState(null)
  const [instruccion, setInstruccion] = useState('')

  const filtrados = useMemo(() => {
    const t = q.toLowerCase().trim()
    return documentos.filter(
      (d) =>
        (!estado || d.estado === estado) &&
        (!emisor || d.emisor === emisor) &&
        (!t ||
          `${d.embarque.id} ${d.numero} ${d.emisor} ${d.origen} ${d.destino} ${d.embarque.oc.proveedor}`
            .toLowerCase()
            .includes(t)),
    )
  }, [documentos, q, estado, emisor])

  const cuenta = (fn) => documentos.filter(fn).length

  const limpiar = () => {
    setQ('')
    setEstado('')
    setEmisor('')
  }

  const abrir = (d) => {
    setRecolectando(d)
    setInstruccion(INSTRUCCION_BASE)
  }

  const confirmar = () => {
    const texto = instruccion.trim()
    if (!texto) {
      avisar('Escriba la instrucción de recolecta antes de confirmar.', 'rojo')
      return
    }
    recolectarDocumento(recolectando.clave, texto)
    avisar(`Instrucción de recolecta creada para el embarque ${recolectando.embarque.id}.`)
    setRecolectando(null)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="m-0 text-lg font-bold text-navy-800">
            Liberación de documentos de transporte
          </h2>
          <p className="m-0 text-sm text-ink-3">
            El documento se libera después del zarpe. Una vez liberado se habilita la única acción
            operativa: recolectarlo y girar la instrucción.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => avisar('Exportación de documentos generada (demo).')}>
            <LuFileDown size={14} /> Exportar
          </Button>
          <Button
            size="sm"
            variant="primary"
            onClick={() => avisar('Informe de documentos enviado (demo).')}
          >
            <LuPrinter size={14} /> Informe
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Kpi
          rotulo="Disponibles para recolectar"
          valor={cuenta((d) => d.estado === 'Liberado')}
          tono="border-teal-100 bg-teal-50"
        />
        <Kpi
          rotulo="Pendientes de liberación"
          valor={cuenta((d) => d.estado === 'Pendiente')}
          tono="border-ambar-100 bg-ambar-50"
        />
        <Kpi rotulo="Recolectados" valor={cuenta((d) => d.estado === 'Recolectado')} />
        <Kpi
          rotulo="Alta relevancia sin recolectar"
          valor={cuenta((d) => d.relevancia === 'Alta' && d.estado !== 'Recolectado')}
          tono="border-rojo-100 bg-rojo-50"
        />
      </div>

      <div className="panel">
        <div className="panel-head flex-wrap">
          <span className="panel-title">Documentos por embarque</span>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <Select
              placeholder="Todos los estados"
              options={ESTADOS_DOCUMENTO}
              value={estado}
              onChange={(e) => setEstado(e.target.value)}
              className="w-[170px]"
            />
            <Select
              placeholder="Todas las navieras"
              options={[...NAVIERAS, ...TRANSPORTISTAS]}
              value={emisor}
              onChange={(e) => setEmisor(e.target.value)}
              className="w-[190px]"
            />
            <div className="relative flex items-center">
              <LuSearch size={13} className="pointer-events-none absolute left-2.5 text-ink-4" />
              <input
                className="inp w-[230px] pl-7"
                placeholder="Buscar embarque, BL, naviera…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
            {(q || estado || emisor) && (
              <Button size="sm" onClick={limpiar}>
                <LuSearchX size={14} /> Limpiar
              </Button>
            )}
          </div>
        </div>

        <div className="tabla-scroll">
          <table className="tbl">
            <thead>
              <tr>
                <th className="w-[150px]">Embarque</th>
                <th className="w-[140px]">N.º de documento</th>
                <th className="w-[150px]">Naviera / transportista</th>
                <th className="min-w-[180px]">Origen</th>
                <th className="w-[190px]">Destino / aduana</th>
                <th className="w-[150px]">Estado</th>
                <th className="w-[130px]">Fecha liberación</th>
                <th className="w-[100px]">Relevancia</th>
                <th className="w-[190px]">Acción</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.length === 0 && (
                <tr>
                  <td colSpan={9} className="h-[140px]! bg-surface text-center text-sm text-ink-3">
                    Ningún documento con los filtros aplicados.
                  </td>
                </tr>
              )}
              {filtrados.map((d) => {
                const tono = TONO_ESTADO[d.estado]
                const Icono = tono.icono
                return (
                  <tr key={d.clave} style={{ '--spine': tono.lomo }}>
                    <td className="cell-key">{d.embarque.id}</td>
                    <td className="num cell-strong">{d.numero}</td>
                    <td>{d.emisor}</td>
                    <td className="cell-cut" title={d.origen}>
                      <span className="flex items-center gap-1.5">
                        <LuMapPin size={12} className="shrink-0 text-ink-4" />
                        {d.origen}
                      </span>
                    </td>
                    <td className="cell-cut" title={d.destino}>
                      {d.destino}
                    </td>
                    <td>
                      <span
                        className={cx(
                          'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-[3px] text-xs font-semibold',
                          tono.chip,
                        )}
                      >
                        <Icono size={11} />
                        {d.estado}
                      </span>
                    </td>
                    <td className="num">{d.liberacion ? fmtFechaHora(d.liberacion) : 'Pendiente'}</td>
                    <td className={cx('font-bold', TONO_RELEVANCIA[d.relevancia])}>{d.relevancia}</td>
                    <td>
                      {d.estado === 'Liberado' ? (
                        <Button size="sm" variant="primary" onClick={() => abrir(d)}>
                          Recolectar documento
                        </Button>
                      ) : (
                        <span className="text-sm text-ink-3" title={d.instruccion || undefined}>
                          {d.estado === 'Recolectado'
                            ? `Recolectado · ${fmtFechaHora(d.recoleccion)}`
                            : `Espera zarpe · ETD ${fmtFechaCorta(d.embarque.etd)}`}
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={!!recolectando}
        onClose={() => setRecolectando(null)}
        title="Recolectar documento"
        eyebrow={
          recolectando ? `${recolectando.embarque.id} · ${recolectando.emisor} · ${recolectando.numero}` : ''
        }
        footer={
          <>
            <span className="min-w-0 flex-1 text-sm text-ink-2">
              La instrucción queda registrada contra el embarque.
            </span>
            <Button variant="quiet" onClick={() => setRecolectando(null)}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={confirmar}>
              <LuCircleCheck size={14} /> Crear instrucción y recolectar
            </Button>
          </>
        }
      >
        {recolectando && (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <Dato rotulo="Embarque">{recolectando.embarque.id}</Dato>
              <Dato rotulo="N.º de documento">{recolectando.numero}</Dato>
              <Dato rotulo="Naviera / transportista">{recolectando.emisor}</Dato>
              <Dato rotulo="Proveedor">{recolectando.embarque.oc.proveedor}</Dato>
              <Dato rotulo="Origen">{recolectando.origen}</Dato>
              <Dato rotulo="Destino / aduana">{recolectando.destino}</Dato>
              <Dato rotulo="Documento">{recolectando.documento}</Dato>
              <Dato rotulo="Fecha de liberación">{fmtFechaHora(recolectando.liberacion)}</Dato>
              <Dato rotulo="Dirección de recolecta">{recolectando.direccion}</Dato>
              <Dato rotulo="Relevancia">
                <span className={TONO_RELEVANCIA[recolectando.relevancia]}>
                  {recolectando.relevancia}
                </span>
              </Dato>
            </div>

            {recolectando.relevancia === 'Alta' && (
              <div className="flex items-start gap-2 rounded-sm border border-rojo-100 bg-rojo-50 px-3 py-2 text-sm text-rojo-700">
                <LuTriangleAlert size={15} className="mt-px shrink-0" />
                <span>
                  La aduana de destino necesita el original a más tardar el{' '}
                  <b className="num">{fmtFechaCorta(recolectando.embarque.frontera)}</b>. Sin el
                  documento no se puede liquidar y empieza a correr el almacenaje.
                </span>
              </div>
            )}

            <div>
              <div className="lbl mb-1.5">Instrucción especial de recolecta</div>
              <Textarea
                value={instruccion}
                onChange={(e) => setInstruccion(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
