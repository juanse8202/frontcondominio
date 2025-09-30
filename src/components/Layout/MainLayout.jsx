// MainLayout.jsx
import React, { useState, useEffect } from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { isMobile } from '../../serviceWorkerRegistration';

const MainLayout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isInstallPromptVisible, setIsInstallPromptVisible] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  
  // Cerrar sidebar al hacer clic en el contenido principal en dispositivos móviles
  const handleMainContentClick = () => {
    if (isMobile() && isSidebarOpen) {
      setIsSidebarOpen(false);
    }
  };

  // Detectar estado de conexión
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Detectar si la app puede ser instalada
  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      // Prevenir que Chrome muestre automáticamente el prompt
      e.preventDefault();
      // Guardar el evento para usarlo más tarde
      setDeferredPrompt(e);
      // Mostrar nuestro propio prompt de instalación
      setIsInstallPromptVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Manejar la instalación de la PWA
  const handleInstallClick = () => {
    // Ocultar nuestro prompt
    setIsInstallPromptVisible(false);
    
    if (deferredPrompt) {
      // Mostrar el prompt de instalación del navegador
      deferredPrompt.prompt();
      
      // Esperar a que el usuario responda al prompt
      deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('Usuario aceptó la instalación');
        } else {
          console.log('Usuario rechazó la instalación');
        }
        // Limpiar el prompt guardado, ya que solo se puede usar una vez
        setDeferredPrompt(null);
      });
    }
  };

  return (
    // <div className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800 overflow-hidden relative">
      <div className="min-h-screen bg-gradient-to-br from-black-950 via-blue-900 to-blue-800 overflow-hidden relative">
      {/* Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-4 -right-4 w-24 h-24 bg-black-400/20 rounded-full blur-xl animate-pulse-slow" />
        <div className="absolute bottom-0 -left-8 w-32 h-32 bg-black-500/20 rounded-full blur-2xl animate-ping-slow" />
      </div>

      {/* Estado de conexión */}
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 bg-yellow-500 text-black py-1 px-4 text-sm text-center z-50">
          Sin conexión a internet - Modo offline
        </div>
      )}

      {/* Prompt de instalación */}
      {isInstallPromptVisible && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-72 bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-4 shadow-lg z-50 animate-fade-in">
          <h3 className="text-white font-bold mb-2">Instalar App</h3>
          <p className="text-white/80 text-sm mb-3">Instala esta aplicación en tu dispositivo para acceder más rápido y usarla sin conexión.</p>
          <div className="flex justify-end gap-2">
            <button 
              onClick={() => setIsInstallPromptVisible(false)}
              className="px-3 py-1 text-sm text-white/70 hover:text-white"
            >
              Después
            </button>
            <button 
              onClick={handleInstallClick}
              className="px-3 py-1 text-sm bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg shadow-sm"
            >
              Instalar
            </button>
          </div>
        </div>
      )}

      {/* Overlay para sidebar en móvil */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-30 lg:hidden animate-fade-in" 
          onClick={toggleSidebar} 
        />
      )}

      <Sidebar isOpen={isSidebarOpen} onClose={toggleSidebar} />

      {/* Main Content */}
      <div 
        className={`relative min-h-screen transition-all duration-500 ${
          isSidebarOpen ? 'lg:ml-64' : 'lg:ml-0'
        }`}
        onClick={handleMainContentClick}
      >
        <Navbar onMenuToggle={toggleSidebar} isSidebarOpen={isSidebarOpen} />
        <main className="p-4 md:p-6 transition-all duration-300 pb-20">
          <div className="animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
