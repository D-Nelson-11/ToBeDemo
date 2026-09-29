import { StrictMode, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { OcProvider } from './data/store'
import Contenedor from './components/Contenedor'
import Shell from './components/Shell'
import './styles/app.css'

// Una pantalla por ruta y un archivo por pantalla: el navegador baja el código
// al entrar a la ruta, no al arrancar. El <Suspense> que las espera está en el
// Shell, para que el sidebar y el header no parpadeen mientras carga.
const OrdenCompra = lazy(() => import('./screens/OrdenCompra'))
const Despachos = lazy(() => import('./screens/Despachos'))
const Seguimiento = lazy(() => import('./screens/Seguimiento'))
const Gestiones = lazy(() => import('./screens/Gestiones'))
const Torre = lazy(() => import('./screens/Torre'))
const PlanningImportaciones = lazy(() => import('./screens/PlanningImportaciones'))
const TorreComprador = lazy(() => import('./screens/TorreComprador'))
const TorreLogistica = lazy(() => import('./screens/TorreLogistica'))
const CostosLogisticos = lazy(() => import('./screens/CostosLogisticos'))
const MerchantCarrier = lazy(() => import('./screens/MerchantCarrier'))
const Kpi = lazy(() => import('./screens/Kpi'))
const Correo = lazy(() => import('./screens/Correo'))
const WarehouseVirtual = lazy(() => import('./screens/WarehouseVirtual'))
const GestionBarco = lazy(() => import('./screens/GestionBarco'))

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <OcProvider>
      <HashRouter>
        <Routes>
          <Route element={<Shell />}>
            <Route path="/orden-compra" element={<OrdenCompra />} />
            <Route path="/despachos" element={<Despachos />} />
            <Route path="/seguimiento" element={<Seguimiento />} />
            <Route path="/gestiones" element={<Gestiones />} />
            <Route path="/torre" element={<Torre />} />
            {/* Cada pantalla del cliente es su ruta, dentro del contenedor común */}
            <Route path="/cliente" element={<Contenedor />}>
              <Route index element={<Navigate to="/cliente/planning" replace />} />
              <Route path="planning" element={<PlanningImportaciones />} />
              <Route path="torre" element={<TorreComprador />} />
              {/* Logística: el único módulo con submenú */}
              <Route path="logistica" element={<Navigate to="/cliente/logistica/transito" replace />} />
              <Route path="logistica/transito" element={<TorreLogistica />} />
              <Route path="logistica/costos" element={<CostosLogisticos />} />
              <Route path="logistica/merchant" element={<MerchantCarrier />} />
              {/* Entregable: Performance Compass + la torre de precios y gastos */}
              <Route path="entregable" element={<Kpi cliente />} />
            </Route>
            <Route path="/kpi" element={<Contenedor />}>
              <Route index element={<Kpi />} />
            </Route>
            {/* Sin entrada en el sidebar: se llega desde el barquito de la torre */}
            <Route path="/barco/:id" element={<Contenedor />}>
              <Route index element={<GestionBarco />} />
            </Route>
            <Route path="/warehouse" element={<Contenedor />}>
              <Route index element={<WarehouseVirtual />} />
            </Route>
            <Route path="/correo" element={<Correo />} />
            <Route path="*" element={<Navigate to="/orden-compra" replace />} />
          </Route>
        </Routes>
      </HashRouter>
    </OcProvider>
  </StrictMode>,
)
