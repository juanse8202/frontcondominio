import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import MainLayout from './components/Layout/MainLayout'
import LoginPage from './components/Auth/LoginPage'

// Páginas organizadas por módulos
import { DashboardPage, PropietariosPage, UnidadesPage, VehiculosPage } from './pages/gestion'
import { ExpensasPage, PagosPage } from './pages/finanzas'
import { AreasPage, ReservasPage } from './pages/areas_comunes'
import { ComunicadosPage } from './pages/comunicacion'
import { ReportesPage } from './pages/mantenimiento'
import { VisitasPage } from './pages/seguridad'
import PlateRecognitionPage from './pages/seguridad/PlateRecognitionPage'
import PlateRecognitionHistoryPage from './pages/seguridad/PlateRecognitionHistoryPage'
import UsuariosPage from './pages/administracion/UsuariosPage'
import NotFoundPage from './pages/NotFoundPage'

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
          <Route path="/usuarios" element={<ProtectedLayout><UsuariosPage /></ProtectedLayout>} />
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

          {/* Rutas de Reconocimiento de Placas */}
          <Route
            path="/reconocimiento-placas"
            element={
              <ProtectedLayout>
                <PlateRecognitionPage />
              </ProtectedLayout>
            }
          />
          <Route
            path="/historial-placas"
            element={
              <ProtectedLayout>
                <PlateRecognitionHistoryPage />
              </ProtectedLayout>
            }
          />


          {/* Debug Route */}
          <Route
            path="/debug"
            element={
              <ProtectedLayout>
                <ApiTest />
              </ProtectedLayout>
            }
          />

          {/* Rutas Admin */}
          <Route
            path="/analytics"
            element={
              <ProtectedLayout>
                <DashboardPage />
              </ProtectedLayout>
            }
          />
          <Route
            path="/configuracion"
            element={
              <ProtectedLayout>
                <div className="p-6">
                  <h1 className="text-2xl font-bold text-white mb-4">Configuración</h1>
                  <p className="text-white/70">Página de configuración en desarrollo...</p>
                </div>
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
