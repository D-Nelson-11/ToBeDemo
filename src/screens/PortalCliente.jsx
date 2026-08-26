import { useMemo, useState } from 'react'
import { LuBanknote, LuChartColumn, LuGauge, LuTowerControl } from 'react-icons/lu'
import { cx } from '../components/ui/Button'
import { useOc } from '../data/store'
import { construirEmbarques } from '../lib/torre'
import CostosLogisticos from './CostosLogisticos'
import DashboardVolumenes from './DashboardVolumenes'
import PlanningImportaciones from './PlanningImportaciones'
import TorreComprador from './TorreComprador'

// Las cuatro pantallas que el cliente ve. Costos es la misma que usa
// Abastecimiento: se reusa tal cual, no se duplica.
const TABS = [
  { id: 'planning', rotulo: 'Planning de importaciones', icono: LuGauge },
  { id: 'comprador', rotulo: 'Torre del comprador', icono: LuTowerControl },
  { id: 'costos', rotulo: 'Costos logísticos', icono: LuBanknote },
  { id: 'volumenes', rotulo: 'Manifiesto de volúmenes', icono: LuChartColumn },
]

export default function PortalCliente() {
  const { ordenes } = useOc()
  const [tab, setTab] = useState('planning')

  const embarques = useMemo(() => construirEmbarques(ordenes), [ordenes])

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

        {tab === 'planning' && <PlanningImportaciones />}
        {tab === 'comprador' && <TorreComprador embarques={embarques} />}
        {tab === 'costos' && <CostosLogisticos />}
        {tab === 'volumenes' && <DashboardVolumenes />}
      </div>
    </div>
  )
}
