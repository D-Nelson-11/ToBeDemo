import { createContext, useCallback, useContext, useMemo, useReducer, useRef, useState } from 'react'
import { ORDENES_INICIALES } from './ordenes'

const OcContext = createContext(null)

/** Todo despacho nace con sus dos checklists en cero. */
const normalizar = (d) => ({
  aduana: [false, false, false, false],
  logistica: [false, false, false, false],
  ...d,
})

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
    case 'agregar-despachos':
      return state.map((oc) =>
        oc.id === action.id
          ? {
              ...oc,
              despachos: [...oc.despachos, ...action.despachos.map(normalizar)],
              pendiente: oc.pendiente === 'programar' || oc.pendiente === 'fechas' ? null : oc.pendiente,
            }
          : oc,
      )
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
  const nextId = useRef(1)

  const avisar = useCallback((texto, tono = 'ok') => {
    const id = nextId.current++
    setAvisos((a) => [...a, { id, texto, tono }])
    setTimeout(() => setAvisos((a) => a.filter((x) => x.id !== id)), 4200)
  }, [])

  const value = useMemo(
    () => ({
      ordenes,
      avisos,
      avisar,
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
    [ordenes, avisos, avisar],
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
