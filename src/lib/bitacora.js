import { fmtFechaCorta } from './fechas'
import { requisitosDestino, tramiteAduana } from './torre'

const HORA_MS = 3600000

// Actividades del proceso aduanero, en orden. `dura` es lo que se muestra en la
// columna Tiempo y `gap` las horas hasta la actividad siguiente: no son lo mismo
// (una actividad de 1 h puede dejar 12 h muertas detrás). Los valores replican el
// escalonado del HTML de referencia. Las de corrección solo salen con incidencia.
const ACTIVIDADES = [
  { rotulo: 'Factura original conforme', dura: '1 h', gap: 12 },
  { rotulo: 'Arribo de carga', dura: '0', gap: 9 },
  { rotulo: 'Fin de operaciones / sellos', dura: '1 día', gap: 2 },
  { rotulo: 'Revisión de manifiesto', dura: '3 h', gap: 0.5 },
  { rotulo: 'Se solicitan correcciones', dura: '45 min', gap: 1, incidencia: true, marca: 'Incidencia' },
  { rotulo: 'Manifiesto corregido', dura: '20 min', gap: 26, incidencia: true },
  { rotulo: 'Documentos originales a aduana', dura: '0.5 d', gap: 18 },
  { rotulo: 'Envío a liquidación', dura: '1 h', gap: 1 },
  { rotulo: 'Registro DUCA', dura: '1 h', gap: 1.5 },
  { rotulo: 'Selectivo', dura: '1 d', gap: 21, semaforo: true },
  { rotulo: 'Orden de liberación', dura: '3 h', gap: 0 },
]

const SEMAFORO = { ok: 'Verde', riesgo: 'Amarillo', vencido: 'Rojo' }

/** Fracción del trámite ya cumplida, según los checklists del paso 3. */
function avanceDe(embarque) {
  const items = requisitosDestino(embarque).flatMap((g) => g.items)
  return items.filter(([, ok]) => ok).length / items.length
}

/**
 * Bitácora del proceso aduanero de un embarque: las actividades con su marca de
 * tiempo, el avance y la proyección de liberación.
 *
 * Lo cumplido se encadena desde la primera marca del riel de SLA, así la bitácora
 * y el semáforo del riel cuentan la misma historia; lo pendiente se proyecta desde
 * ahora, o un embarque vencido proyectaría su liberación en el pasado.
 */
export function bitacoraAduana(embarque, ahora = new Date()) {
  const hitos = tramiteAduana(embarque, ahora)
  const enCurso = hitos.find((h) => h.curso)
  const vencido = hitos.some((h) => h.estado === 'vencido')
  const semaforo = SEMAFORO[vencido ? 'vencido' : (enCurso?.estado ?? 'ok')]

  const lista = ACTIVIDADES.filter((a) => !a.incidencia || vencido)
  const hechas = Math.round(lista.length * avanceDe(embarque))

  let cursor = new Date((hitos[0].ts ?? ahora).getTime())

  const filas = lista.map((a, i) => {
    const pendiente = i > hechas
    if (pendiente && cursor < ahora) cursor = new Date(ahora.getTime())
    const fecha = new Date(cursor)
    cursor = new Date(cursor.getTime() + a.gap * HORA_MS)

    // Incidencia es la fila que abre el problema, nunca la que lo cierra; la
    // actividad en curso se marca así solo si su propio SLA ya venció.
    const estado = a.marca
      ? a.marca
      : i < hechas
        ? 'Completado'
        : pendiente
          ? 'Pendiente'
          : enCurso?.estado === 'vencido' && !a.incidencia
            ? 'Incidencia'
            : 'En proceso'

    return {
      rotulo: a.rotulo,
      fecha,
      estado,
      duracion: a.dura,
      detalle: a.semaforo
        ? semaforo
        : vencido && a.rotulo.startsWith('Revisión')
          ? 'Se solicitaron correcciones'
          : '',
    }
  })

  const pct = Math.round((hechas / lista.length) * 100)

  return {
    filas,
    avance: pct,
    pendiente: 100 - pct,
    // El SLA restante es el del hito en curso: es el reloj que de verdad corre.
    sla: enCurso?.nota ?? '—',
    slaEstado: enCurso?.estado ?? 'ok',
    liberacion: fmtFechaCorta(filas[filas.length - 1].fecha),
  }
}
