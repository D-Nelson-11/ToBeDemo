import { LuHardHat } from 'react-icons/lu'

/** Pantalla del menú que todavía no se construyó: existe la ruta, no el contenido. */
export default function Pendiente({ titulo, detalle }) {
  return (
    <div className="panel flex flex-col items-center justify-center gap-2 px-6 py-16 text-center">
      <LuHardHat size={30} strokeWidth={1.6} className="text-ink-4" />
      <span className="text-lg font-bold text-navy-800">{titulo}</span>
      <span className="max-w-md text-sm text-ink-3">{detalle}</span>
    </div>
  )
}
