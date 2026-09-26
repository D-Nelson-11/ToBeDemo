import { useEffect, useRef, useState } from 'react'
import {
  LuCircleAlert,
  LuCircleCheck,
  LuFileDiff,
  LuFileText,
  LuLoaderCircle,
  LuPlay,
  LuRotateCcw,
  LuSparkles,
  LuTriangleAlert,
  LuUpload,
} from 'react-icons/lu'
import Button, { cx } from '../components/ui/Button'
import Panel from '../components/ui/Panel'
import PanelPlegable from '../components/ui/PanelPlegable'

// Simulación: nada sale del navegador. Los PDFs solo se muestran por nombre y
// las observaciones son siempre las mismas, inventadas.
const EJEMPLO = {
  a: 'Factura_INV-2026-0418.pdf',
  b: 'BL_MAEU-238817450.pdf',
}

const PASOS_IA = [
  'Leyendo la factura…',
  'Leyendo el BL…',
  'Comparando campos según las instrucciones…',
]

const OBSERVACIONES = [
  {
    tono: 'rojo',
    campo: 'Peso bruto',
    a: '18.450 kg',
    b: '18.920 kg',
    texto: 'Diferencia de 470 kg (2,5 %), supera la tolerancia del 1 %.',
  },
  {
    tono: 'rojo',
    campo: 'Consignatario',
    a: 'Distribuidora Vesta S.A.',
    b: 'Distribuidora Vesta SA de CV',
    texto: 'La razón social no coincide; puede trabar la liberación en aduana.',
  },
  {
    tono: 'alerta',
    campo: 'Cantidad de bultos',
    a: '1.200 cajas',
    b: '1.180 cartons',
    texto: 'Faltan 20 bultos en el BL. Confirmar con el proveedor si hubo carga parcial.',
  },
  {
    tono: 'alerta',
    campo: 'Puerto de carga',
    a: 'Callao',
    b: 'Paita',
    texto: 'El puerto de embarque cambió respecto de lo facturado.',
  },
  {
    tono: 'alerta',
    campo: 'Descripción de la mercancía',
    a: 'Papas fritas sabor original 45 g',
    b: 'Snacks',
    texto: 'El BL usa una descripción genérica; aduana puede pedir el detalle.',
  },
  {
    tono: 'ok',
    campo: 'Contenedor',
    a: 'MSKU 482193-7',
    b: 'MSKU 482193-7',
    texto: 'Coincide.',
  },
  {
    tono: 'ok',
    campo: 'Orden de compra',
    a: 'OC-45120087',
    b: 'OC-45120087',
    texto: 'Coincide.',
  },
  {
    tono: 'ok',
    campo: 'Shipper',
    a: 'Snacks Andinos S.A.C.',
    b: 'Snacks Andinos S.A.C.',
    texto: 'Coincide.',
  },
]

const TONO = {
  rojo: { icono: LuCircleAlert, rotulo: 'Crítica', chip: 'bg-rojo-50 text-rojo-700 border-rojo-100' },
  alerta: { icono: LuTriangleAlert, rotulo: 'Revisar', chip: 'bg-ambar-50 text-ambar-700 border-ambar-100' },
  ok: { icono: LuCircleCheck, rotulo: 'Coincide', chip: 'bg-teal-50 text-teal-700 border-teal-100' },
}

/** Tarjeta de un archivo: muestra el PDF cargado y deja elegir otro. */
function Archivo({ letra, tipo, nombre, onElegir, bloqueado }) {
  const input = useRef(null)
  return (
    <div className="flex flex-1 items-center gap-3 rounded-md border border-dashed border-line-strong bg-surface-2 p-4">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-navy-800 text-lg font-bold text-white">
        {letra}
      </span>
      <div className="min-w-0 flex-1">
        <span className="lbl block">{tipo}</span>
        <span className="flex items-center gap-1.5 text-base font-bold text-ink">
          <LuFileText size={15} className="shrink-0 text-rojo-600" />
          <span className="truncate">{nombre}</span>
        </span>
      </div>
      <input
        ref={input}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={(e) => e.target.files[0] && onElegir(e.target.files[0].name)}
      />
      <Button size="sm" onClick={() => input.current.click()} disabled={bloqueado}>
        <LuUpload /> Cambiar
      </Button>
    </div>
  )
}

export default function Compare() {
  const [archivos, setArchivos] = useState(EJEMPLO)
  // null = sin correr, número = paso de la IA en curso, 'listo' = con resultado
  const [estado, setEstado] = useState(null)

  // Avanza un paso cada 900 ms; al pasar el último, muestra el resultado.
  useEffect(() => {
    if (typeof estado !== 'number') return
    const t = setTimeout(() => setEstado(estado + 1 < PASOS_IA.length ? estado + 1 : 'listo'), 900)
    return () => clearTimeout(t)
  }, [estado])

  const corriendo = typeof estado === 'number'
  const cuenta = (tono) => OBSERVACIONES.filter((o) => o.tono === tono).length

  return (
    <>
      <Panel
        titulo="Documentos a comparar"
        icono={LuFileDiff}
        sub="La IA compara la factura contra el BL y devuelve las diferencias"
      >
        <div className="flex flex-col gap-3 md:flex-row">
          <Archivo
            letra="A"
            tipo="Factura comercial"
            nombre={archivos.a}
            bloqueado={corriendo}
            onElegir={(n) => setArchivos((p) => ({ ...p, a: n }))}
          />
          <Archivo
            letra="B"
            tipo="Bill of Lading (BL)"
            nombre={archivos.b}
            bloqueado={corriendo}
            onElegir={(n) => setArchivos((p) => ({ ...p, b: n }))}
          />
        </div>

        <div className="mt-4 flex items-center justify-end gap-2">
          {estado === 'listo' && (
            <Button variant="quiet" onClick={() => setEstado(null)}>
              <LuRotateCcw /> Limpiar
            </Button>
          )}
          <Button variant="primary" onClick={() => setEstado(0)} disabled={corriendo}>
            {corriendo ? <LuLoaderCircle className="motion-safe:animate-spin" /> : <LuPlay />}
            {corriendo ? 'Ejecutando…' : 'Ejecutar comparación'}
          </Button>
        </div>
      </Panel>

      {corriendo && (
        <Panel>
          <div className="flex flex-col items-center gap-3 py-8">
            <LuSparkles size={26} className="text-navy-600 motion-safe:animate-pulse" />
            <span className="text-lg font-bold text-navy-800">{PASOS_IA[estado]}</span>
            <span className="h-1.5 w-64 overflow-hidden rounded-full bg-line-soft">
              <span
                className="block h-full bg-navy-600 transition-[width] duration-700"
                style={{ width: ((estado + 1) / PASOS_IA.length) * 100 + '%' }}
              />
            </span>
          </div>
        </Panel>
      )}

      {estado === 'listo' && (
        <PanelPlegable
          titulo={
            <>
              <LuSparkles size={14} /> Observaciones de la IA
            </>
          }
        >
          <div className="flex flex-wrap items-center gap-2 border-b border-line px-4 py-3">
            {['rojo', 'alerta', 'ok'].map((t) => {
              const { icono: Icono, rotulo, chip } = TONO[t]
              return (
                <span key={t} className={cx('flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-bold', chip)}>
                  <Icono size={14} /> {cuenta(t)} {rotulo}
                </span>
              )
            })}
            <span className="ml-auto text-sm text-ink-3">
              {archivos.a} vs {archivos.b}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="tbl w-full">
              <thead>
                <tr>
                  <th>Estado</th>
                  <th>Campo</th>
                  <th>Factura (A)</th>
                  <th>BL (B)</th>
                  <th>Observación</th>
                </tr>
              </thead>
              <tbody>
                {OBSERVACIONES.map((o) => {
                  const { icono: Icono, rotulo, chip } = TONO[o.tono]
                  return (
                    <tr key={o.campo}>
                      <td>
                        <span className={cx('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-bold', chip)}>
                          <Icono size={12} /> {rotulo}
                        </span>
                      </td>
                      <td className="cell-strong">{o.campo}</td>
                      <td>{o.a}</td>
                      <td className={cx(o.tono !== 'ok' && 'font-bold text-rojo-700')}>{o.b}</td>
                      <td className="text-ink-2">{o.texto}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </PanelPlegable>
      )}
    </>
  )
}
