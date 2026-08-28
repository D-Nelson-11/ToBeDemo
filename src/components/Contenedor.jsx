import { Outlet } from 'react-router-dom'

// Layout de ruta: el ancho y el aire que comparten todas las pantallas. Las que
// se montan acá no traen contenedor propio, para no anidar dos.
export default function Contenedor() {
  return (
    <div className="min-h-full">
      <div className="contenedor flex flex-col gap-4 py-4">
        <Outlet />
      </div>
    </div>
  )
}
