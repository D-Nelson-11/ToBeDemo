import { createContext, useCallback, useContext, useMemo, useReducer, useRef, useState } from 'react'
import { analizarCorreo, respuestaProveedor } from './correos'
import { ORDENES_INICIALES } from './ordenes'

const OcContext = createContext(null)

/** Todo despacho nace con sus dos checklists en cero. */
const normalizar = (d) => ({
  aduana: [false, false, false, false],
  logistica: [false, false, false, false],
  ...d,
})

// Correlativo global de despachos: DPE + número. El prefijo es fijo y el número
// no se reinicia por OC, así ningún código se repite en pantalla.
export const PREFIJO_DESPACHO = 'DPE'

const ultimoCorrelativo = (ordenes) =>
  ordenes.reduce(
    (max, oc) =>
      oc.despachos.reduce((m, d) => Math.max(m, Number(String(d.id).replace(/\D/g, '')) || 0), max),
    0,
  )

function reducer(state, action) {
  switch (action.type) {
    case 'toggle-estado':
      return state.map((oc) =>
        oc.id === action.id ? { ...oc, estado: oc.estado === 'abierta' ? 'cerrada' : 'abierta' } : oc,
      )
    case 'set-estado':
      return state.map((oc) => (oc.id === action.id ? { ...oc, estado: action.estado } : oc))
    case 'toggle-activa':
      return state.map((oc) => (oc.id === action.id ? { ...oc, activa: !oc.activa } : oc))
    case 'actualizar':
      return state.map((oc) => (oc.id === action.id ? { ...oc, ...action.patch } : oc))
    case 'crear':
      return [action.oc, ...state]
    case 'agregar-despachos': {
      // El código se asigna acá y no en la pantalla: es lo único que ve todo el store.
      let n = ultimoCorrelativo(state)
      const nuevos = action.despachos.map((d) =>
        normalizar({ ...d, id: PREFIJO_DESPACHO + ++n }),
      )
      return state.map((oc) =>
        oc.id === action.id
          ? {
              ...oc,
              despachos: [...oc.despachos, ...nuevos],
              pendiente: oc.pendiente === 'programar' || oc.pendiente === 'fechas' ? null : oc.pendiente,
            }
          : oc,
      )
    }
    // Reprograma varios despachos de una sola vez. Guarda la fecha planificada
    // original la primera vez, para poder mostrar siempre la variación contra el plan.
    case 'reprogramar':
      return state.map((oc) => {
        const cambios = action.cambios.filter((c) => c.ocId === oc.id)
        if (!cambios.length) return oc
        return {
          ...oc,
          despachos: oc.despachos.map((d) => {
            const c = cambios.find((x) => x.despachoId === d.id)
            if (!c) return d
            return {
              ...d,
              salidaPlan: d.salidaPlan ?? d.salida,
              salida: c.salida,
              causa: action.causa,
              categoria: action.categoria,
              notificado: action.notificar || d.notificado,
            }
          }),
        }
      })
    case 'marcar-check':
      return state.map((oc) =>
        oc.id === action.ocId
          ? {
              ...oc,
              despachos: oc.despachos.map((d) =>
                d.id === action.despachoId
                  ? {
                      ...d,
                      [action.lista]: d[action.lista].map((v, i) => (i === action.idx ? !v : v)),
                    }
                  : d,
              ),
            }
          : oc,
      )
    default:
      return state
  }
}

export function OcProvider({ children }) {
  const [ordenes, dispatch] = useReducer(reducer, ORDENES_INICIALES)
  const [avisos, setAvisos] = useState([])
  // Quién está viendo el portal: cambia el sidebar completo, por eso vive en el
  // store y no en el Shell — las pantallas de cliente también la van a leer.
  const [vista, setVista] = useState('especialista')
  // Hilos de correo por OC: arrancan vacíos y se llenan al enviar desde la
  // pantalla. `esperando` son las OC cuya respuesta todavía viene en camino.
  const [hilos, setHilos] = useState({})
  const [esperando, setEsperando] = useState([])
  // Documentos de transporte ya recolectados, por embarque. Vive acá y no en la
  // pantalla para que la recolecta sobreviva al cambio de tab de la torre.
  const [recolectas, setRecolectas] = useState({})
  // Coordinaciones de entrega y avance del finiquito, por embarque. Igual que
  // las recolectas: es estado de la torre, no de la OC ni del despacho.
  const [coordinaciones, setCoordinaciones] = useState({})
  const [finiquitos, setFiniquitos] = useState({})
  const envios = useRef({})
  const nextId = useRef(1)

  const avisar = useCallback((texto, tono = 'ok') => {
    const id = nextId.current++
    setAvisos((a) => [...a, { id, texto, tono }])
    setTimeout(() => setAvisos((a) => a.filter((x) => x.id !== id)), 4200)
  }, [])

  // El proveedor contesta a los 3 s. El temporizador vive en el store y no en el
  // modal para que la respuesta llegue aunque el usuario ya lo haya cerrado.
  const enviarCorreo = useCallback(
    (oc, correo) => {
      const n = (envios.current[oc.id] = (envios.current[oc.id] ?? 0) + 1)
      setHilos((h) => ({ ...h, [oc.id]: [...(h[oc.id] ?? []), correo] }))
      setEsperando((e) => [...e, oc.id])

      setTimeout(() => {
        const r = respuestaProveedor(oc, correo.para, n)
        setHilos((h) => ({ ...h, [oc.id]: [...(h[oc.id] ?? []), r] }))
        setEsperando((e) => e.filter((x) => x !== oc.id))

        const { tipo } = analizarCorreo(r.cuerpo)
        avisar(
          tipo
            ? `OC ${oc.id}: el proveedor reporta ${tipo}.`
            : `OC ${oc.id}: el proveedor confirmó la orden.`,
          tipo === 'retraso' ? 'alerta' : tipo ? 'rojo' : 'ok',
        )
      }, 3000)
    },
    [avisar],
  )

  const recolectarDocumento = useCallback((clave, instruccion) => {
    setRecolectas((r) => ({ ...r, [clave]: { instruccion, fecha: new Date() } }))
  }, [])

  // Un solo setter para toda la coordinación: registrarla, moverla a aduana o
  // confirmarla son el mismo cambio de estado sobre el mismo embarque.
  const coordinarEntrega = useCallback((clave, datos) => {
    setCoordinaciones((c) => ({ ...c, [clave]: { ...c[clave], ...datos } }))
  }, [])

  const avanzarFiniquito = useCallback((clave, estatus) => {
    setFiniquitos((f) => ({ ...f, [clave]: estatus }))
  }, [])

  const value = useMemo(
    () => ({
      ordenes,
      avisos,
      avisar,
      recolectas,
      recolectarDocumento,
      coordinaciones,
      coordinarEntrega,
      finiquitos,
      avanzarFiniquito,
      vista,
      setVista,
      hilos,
      esperando,
      enviarCorreo,
      descartarAviso: (id) => setAvisos((a) => a.filter((x) => x.id !== id)),
      toggleEstado: (id) => dispatch({ type: 'toggle-estado', id }),
      setEstado: (id, estado) => dispatch({ type: 'set-estado', id, estado }),
      toggleActiva: (id) => dispatch({ type: 'toggle-activa', id }),
      actualizarOc: (id, patch) => dispatch({ type: 'actualizar', id, patch }),
      crearOc: (oc) => dispatch({ type: 'crear', oc }),
      agregarDespachos: (id, despachos) => dispatch({ type: 'agregar-despachos', id, despachos }),
      marcarCheck: (ocId, despachoId, lista, idx) =>
        dispatch({ type: 'marcar-check', ocId, despachoId, lista, idx }),
      reprogramar: (cambios, meta) => dispatch({ type: 'reprogramar', cambios, ...meta }),
    }),
    [
      ordenes,
      avisos,
      avisar,
      vista,
      hilos,
      esperando,
      enviarCorreo,
      recolectas,
      recolectarDocumento,
      coordinaciones,
      coordinarEntrega,
      finiquitos,
      avanzarFiniquito,
    ],
  )

  return <OcContext.Provider value={value}>{children}</OcContext.Provider>
}

export function useOc() {
  const ctx = useContext(OcContext)
  if (!ctx) throw new Error('useOc debe usarse dentro de <OcProvider>')
  return ctx
}

// --- Derivados --------------------------------------------------------------

export const ETIQUETA_PENDIENTE = {
  pago: 'Pendiente de pago',
  fechas: 'Pend. asignar fechas',
  programar: 'Pendiente de programar',
}

export function totalOc(oc) {
  return oc.materiales.reduce((s, m) => s + m.cantidad * m.precio, 0)
}

export function cantidadTotalOc(oc) {
  return oc.materiales.reduce((s, m) => s + m.cantidad, 0)
}

export function cantidadDespachada(oc) {
  return oc.despachos.reduce((s, d) => s + d.cantidad, 0)
}
