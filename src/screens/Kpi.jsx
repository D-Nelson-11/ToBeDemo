import { useState } from 'react'
import { LuChartColumn, LuHandCoins } from 'react-icons/lu'
import { cx } from '../components/ui/Button'
import CostosSnacks from './CostosSnacks'
import KpiVolumenes from './KpiVolumenes'

// Dos lecturas del mismo negocio: cuánto entró y cuánto costó traerlo.
// Cada una trae sus propios filtros y su propio encabezado.
const TABS = [
  { id: 'volumen', rotulo: 'Volumen', icono: LuChartColumn },
  { id: 'costos', rotulo: 'Costos', icono: LuHandCoins },
]

export default function Kpi() {
  const [tab, setTab] = useState('volumen')

  return (
    <div className="min-h-full">
      <div className="contenedor flex flex-col gap-4 py-4">
        <div className="tabbar">
          {TABS.map(({ id, rotulo, icono: Icono }) => {
            const activo = tab === id
            return (
              <button key={id} onClick={() => setTab(id)} className={cx('tab', activo && 'tab-on')}>
                <Icono size={14} className={activo ? 'text-navy-700' : 'text-ink-4'} />
                {rotulo}
              </button>
            )
          })}
        </div>

        {tab === 'volumen' && <KpiVolumenes />}
        {tab === 'costos' && <CostosSnacks />}
      </div>
    </div>
  )
}
