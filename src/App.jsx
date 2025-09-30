import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import MainLayout from './components/Layout/MainLayout'
import LoginPage from './components/Auth/LoginPage'

// Páginas
import DashboardPage from './pages/DashboardPage'
import ExpensasPage from './pages/ExpensasPage'
import UnidadesPage from './pages/UnidadesPage'
import ReportesPage from './pages/ReportesPage'
import VisitasPage from './pages/VisitasPage'
import VehiculosPage from './pages/VehiculosPage'
import PropietariosPage from './pages/PropietariosPage'
import PagosPage from './pages/PagosPage'
import AreasPage from './pages/AreasPage'
import NotFoundPage from './pages/NotFoundPage'
import ReservasPage from './pages/ReservasPage'
import ComunicadosPage from './pages/ComunicadosPage'

// Debug components
import ApiTest from './components/Debug/ApiTest'

// Componente protegido con layout
const ProtectedLayout = ({ children }) => {
  const { isAuthenticated, loading } = useAuth()

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        Cargando...
      </div>
    )

  return isAuthenticated ? <MainLayout>{children}</MainLayout> : <Navigate to="/login" />
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Rutas públicas */}
          <Route path="/login" element={<LoginPage />} />

          {/* Rutas protegidas */}
          <Route
            path="/dashboard"
            element={
              <ProtectedLayout>
                <DashboardPage />
              </ProtectedLayout>
            }
          />


          <Route path="/expensas" element={<ProtectedLayout><ExpensasPage /></ProtectedLayout>} />
          <Route path="/pagos" element={<ProtectedLayout><PagosPage /></ProtectedLayout>} />
          <Route path="/propietarios" element={<ProtectedLayout><PropietariosPage /></ProtectedLayout>} />
          <Route path="/areas" element={<ProtectedLayout><AreasPage /></ProtectedLayout>} />
          <Route path="/comunicados" element={<ProtectedLayout><ComunicadosPage /></ProtectedLayout>} />
    
          <Route
            path="/unidades"
            element={
              <ProtectedLayout>
                <UnidadesPage />
              </ProtectedLayout>
            }
          />

          <Route
            path="/reportes"
            element={
              <ProtectedLayout>
                <ReportesPage />
              </ProtectedLayout>
            }
          />

          {/* Rutas del submenú "Gestionar" para propietario */}

          <Route
            path="/visitas"
            element={
              <ProtectedLayout>
                <VisitasPage />
              </ProtectedLayout>
            }
          />
          <Route
            path="/reservas"
            element={
              <ProtectedLayout>
                <ReservasPage />
              </ProtectedLayout>
            }
          />
          <Route path="/vehiculos" element={<ProtectedLayout><VehiculosPage /></ProtectedLayout>} />

          <Route path="/areas" element={<ProtectedLayout><AreasPage /></ProtectedLayout>} />


          {/* Debug Route */}
          <Route
            path="/debug"
            element={
              <ProtectedLayout>
                <ApiTest />
              </ProtectedLayout>
            }
          />

          {/* Ruta por defecto */}
          <Route path="/" element={<Navigate to="/dashboard" />} />

          {/* Ruta 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App
