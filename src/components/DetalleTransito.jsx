import { LuBellPlus, LuTriangleAlert } from 'react-icons/lu'
import Button, { cx } from './ui/Button'
import { fmtFechaCorta } from '../lib/fechas'
import { NIVELES, nivelDe } from '../lib/torre'
import { useOc } from '../data/store'

const TONO = {
  'Dentro de tiempo': { caja: 'border-teal-100 bg-teal-50 text-teal-700', punto: 'bg-teal-600' },
  'En riesgo': { caja: 'border-ambar-100 bg-ambar-50 text-ambar-700', punto: 'bg-ambar-500' },
  'Fuera de tiempo': { caja: 'border-rojo-100 bg-rojo-50 text-rojo-700', punto: 'bg-rojo-600' },
}

// Recomendación por nivel de escalamiento, igual que en la torre: el nivel define
// a quién se comunica y qué se hace.
const RECOMENDACION = {
  1: 'Mantener vigilancia y actualizar ETA.',
  2: 'Coordinar intervención con aduana/comprador y validar impacto.',
  3: 'Escalar y solicitar decisión; revisar costos y fecha requerida.',
}

// Mapa ilustrativo: los pines van en posiciones fijas (origen, tránsito, destino).
// No se mueven con los datos; la posición real llegaría de AIS/TMS.
const PINES = [
  { left: '15%', top: '55%', color: 'bg-teal-600', rotulo: 'Origen' },
  { left: '48%', top: '38%', color: 'bg-ambar-500', rotulo: 'Posición estimada' },
  { left: '77%', top: '58%', color: 'bg-rojo-600', rotulo: 'Destino' },
]

const FONDO_MAPA = [
  'linear-gradient(25deg,transparent 48%,#d5c79d 49%,#d5c79d 50%,transparent 51%)',
  'linear-gradient(150deg,transparent 48%,#c9d8b8 49%,#c9d8b8 51%,transparent 52%)',
  '#bfe0ef',
].join(',')

function Metrica({ rotulo, valor }) {
  return (
    <div className="min-w-0 flex-1 rounded-sm border border-line bg-surface-2 px-3 py-2 text-center">
      <b className="num block truncate text-base leading-tight font-bold text-navy-800" title={valor}>
        {valor}
      </b>
      <span className="block text-xs text-ink-3">{rotulo}</span>
    </div>
  )
}

function Paso({ titulo, nota, estado }) {
  return (
    <div className="relative pb-4 pl-5 last:pb-0">
      <span
        className={cx(
          'absolute top-1 left-0 h-[9px] w-[9px] -translate-x-1/2 rounded-full ring-3 ring-surface',
          estado === 'hecho' ? 'bg-teal-600' : estado === 'riesgo' ? 'bg-rojo-600' : 'bg-navy-400',
        )}
      />
      <span className="block text-sm font-bold text-ink">{titulo}</span>
      <span className="block text-xs text-ink-3">{nota}</span>
    </div>
  )
}

/** Detalle del embarque en tránsito: ubicación, proyección y línea de tiempo. */
export default function DetalleTransito({ embarque: e }) {
  const { avisar } = useOc()
  const t = TONO[e.riesgo]
  const nivel = nivelDe(e.delay)
  const desviacion = e.delay > 0 ? `+${e.delay} d` : '0 d'
  const nuevaEta = fmtFechaCorta(e.planta)

  const generarAlerta = () =>
    avisar(
      `Alerta generada · ${e.id} — ${e.oc.centro}: ${e.riesgo}. Nueva ETA ${nuevaEta}.`,
      e.riesgo === 'Dentro de tiempo' ? 'ok' : e.riesgo === 'En riesgo' ? 'alerta' : 'rojo',
    )

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        <Metrica rotulo="OC" valor={e.oc.id} />
        <Metrica rotulo="Sitio" valor={e.oc.centro} />
        <Metrica rotulo="Estatus" valor={e.segmento} />
        <Metrica rotulo="Nueva ETA" valor={nuevaEta} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.2fr_.8fr]">
        <div className="panel p-4">
          <div className="lbl mb-2">Ruta / ubicación del barco</div>
          <div className="relative h-[200px] rounded-sm" style={{ background: FONDO_MAPA }}>
            {PINES.map((p) => (
              <span
                key={p.rotulo}
                title={p.rotulo}
                style={{ left: p.left, top: p.top }}
                className={cx(
                  'absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-white',
                  p.color,
                )}
              />
            ))}
          </div>
          <p className="mt-2 mb-0 text-xs text-ink-4">
            Vista esquemática. En una integración real se conectará AIS/TMS para la posición del barco.
          </p>
        </div>

        <div className="panel flex flex-col gap-3 p-4">
          <div className="lbl">Proyección automática</div>

          <div className={cx('rounded-sm border p-3 text-sm', t.caja)}>
            <b className="flex items-center gap-1.5 font-bold">
              <LuTriangleAlert size={13} /> {e.riesgo}
            </b>
            <div className="mt-1.5 flex flex-col gap-px text-ink-2">
              <span>
                ETA original: <b className="num">{fmtFechaCorta(e.etaOriginal)}</b>
              </span>
              <span>
                Nueva proyección: <b className="num">{nuevaEta}</b>
              </span>
              <span>
                Desviación: <b className="num">{desviacion}</b>
              </span>
            </div>
          </div>

          <p className="m-0 text-sm text-ink-2">
            <b>Ubicación:</b> {e.ubicacion} · {e.buque}
          </p>

          {/* Nota automática: el nivel sale de la misma regla de escalamiento de la torre */}
          <div className="rounded-sm border border-line bg-surface-2 p-3 text-sm text-ink-2">
            <b className="text-ink">Nota automática · {e.id}:</b> {e.oc.centro} registra{' '}
            {e.delay > 0 ? `${desviacion} de desviación` : 'cero desviación'}. Nueva fecha {nuevaEta}.{' '}
            <b className="text-ink">Recomendación:</b>{' '}
            {e.delay > 0 ? RECOMENDACION[nivel] : 'Sin acción: se mantiene la fecha comprometida.'}
            <span className="mt-2 block text-xs font-semibold text-ink-3">{NIVELES[nivel].rotulo}</span>
          </div>

          <Button size="sm" onClick={generarAlerta}>
            <LuBellPlus size={14} /> Generar alerta
          </Button>
        </div>
      </div>

      <div className="panel p-4">
        <div className="lbl mb-3">Línea de tiempo</div>
        <div className="ml-2 border-l-2 border-line pl-4">
          <Paso titulo="Programación / origen" nota="Completado" estado="hecho" />
          <Paso titulo="Zarpe / tránsito" nota="Última actualización registrada" estado="hecho" />
          <Paso
            titulo={e.segmento}
            nota={`${e.ubicacion} · ${e.buque}`}
            estado={e.riesgo === 'Dentro de tiempo' ? 'curso' : 'riesgo'}
          />
          <Paso
            titulo={`Arribo a ${e.oc.centro}`}
            nota={`Nueva fecha proyectada: ${nuevaEta} · ${desviacion}`}
            estado={e.delay > 0 ? 'riesgo' : 'curso'}
          />
        </div>
      </div>
    </div>
  )
}
