import { useState } from 'react'
import { LuChartColumn, LuGauge, LuHandCoins } from 'react-icons/lu'
import { cx } from '../components/ui/Button'
import CostosSnacks from './CostosSnacks'
import KpiOperativo from './KpiOperativo'
import KpiVolumenes from './KpiVolumenes'

// Tres lecturas del mismo negocio: cuánto entró, cuánto costó traerlo y qué tan
// bien cumplió la cadena. Cada una trae sus propios filtros y su encabezado.
const TABS = [
  { id: 'volumen', rotulo: 'Volumen', icono: LuChartColumn },
  { id: 'costos', rotulo: 'Costos', icono: LuHandCoins },
  { id: 'operativo', rotulo: 'Desempeño operativo', icono: LuGauge },
]

export default function Kpi() {
  const [tab, setTab] = useState('volumen')

  return (
    <>
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
      {tab === 'operativo' && <KpiOperativo />}
    </>
  )
}
