import { StrictMode, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { OcProvider } from './data/store'
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
const PortalCliente = lazy(() => import('./screens/PortalCliente'))
const KpiVolumenes = lazy(() => import('./screens/KpiVolumenes'))

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
            <Route path="/cliente" element={<PortalCliente />} />
            <Route path="/kpi" element={<KpiVolumenes />} />
            <Route path="*" element={<Navigate to="/orden-compra" replace />} />
          </Route>
        </Routes>
      </HashRouter>
    </OcProvider>
  </StrictMode>,
)
