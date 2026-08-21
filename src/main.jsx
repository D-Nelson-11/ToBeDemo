import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { OcProvider } from './data/store'
import Shell from './components/Shell'
import OrdenCompra from './screens/OrdenCompra'
import Despachos from './screens/Despachos'
import Seguimiento from './screens/Seguimiento'
import Gestiones from './screens/Gestiones'
import Torre from './screens/Torre'
import './styles/app.css'

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
            <Route path="*" element={<Navigate to="/orden-compra" replace />} />
          </Route>
        </Routes>
      </HashRouter>
    </OcProvider>
  </StrictMode>,
)
