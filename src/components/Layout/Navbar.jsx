import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Bell,
  Menu,
  X,
  ChevronDown,
  LogOut,
  Wifi,
  WifiOff,
  Battery,
  MoreVertical
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { isMobile, isInstalled } from '../../serviceWorkerRegistration';

const Navbar = ({ onMenuToggle, isSidebarOpen }) => {
  const { user, logout } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isActionsOpen, setIsActionsOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [batteryLevel, setBatteryLevel] = useState(null);
  const [isPWA, setIsPWA] = useState(false);
  const profileRef = useRef(null);
  const actionsRef = useRef(null);
  const searchInputRef = useRef(null);

  // Detectar estado de conexión
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Verificar si es PWA
    setIsPWA(isInstalled());

    // Obtener nivel de batería (si el navegador lo soporta)
    if ('getBattery' in navigator) {
      navigator.getBattery().then(battery => {
        setBatteryLevel(battery.level * 100);

        battery.addEventListener('levelchange', () => {
          setBatteryLevel(battery.level * 100);
        });
      });
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Cerrar dropdowns cuando se hace clic afuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
      if (actionsRef.current && !actionsRef.current.contains(event.target)) {
        setIsActionsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Enfocar el input de búsqueda cuando se abre
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  return (
    <>
      {/* Barra de búsqueda móvil expandida */}
      {isSearchOpen && (
        <div className="fixed inset-0 bg-gradient-to-br from-teal-800 via-teal-700 to-teal-600 z-50 p-4 animate-fade-in">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSearchOpen(false)}
              className="text-white p-2 rounded-xl hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-teal-300" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Buscar..."
                className="w-full bg-white/10 border border-white/20 rounded-xl pl-12 pr-4 py-3 text-white placeholder-teal-200 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      )}

      <nav className="relative bg-black/80 backdrop-blur-lg border-b border-white/20 p-4 animate-fade-in">
        <div className="flex items-center justify-between">
          {/* Left Section */}
          <div className="flex items-center space-x-4">
            <button
              onClick={onMenuToggle}
              className="text-white/90 hover:text-white transition-all duration-300 p-2 rounded-xl hover:bg-white/10"
              aria-label="Toggle menu"
            >
              {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* <div className="bg-gradient-to-r from-teal-500 to-teal-600 w-10 h-10 rounded-xl flex items-center justify-center shadow-lg transition-transform duration-300 hover:scale-105">
              <span className="text-white font-bold text-lg">C</span>
            </div> */}

            <h1 className="text-white font-bold text-xl hidden md:block transition-opacity duration-300">Smart Condomininion</h1>
          </div>

          {/* Search Bar (Desktop) */}
          <div className="hidden md:flex relative flex-1 max-w-md mx-8 transition-all duration-300">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-teal-300 transition-colors duration-300" />
            <input
              type="text"
              placeholder="Buscar..."
              className="w-full bg-white/10 border border-white/20 rounded-xl pl-12 pr-4 py-2 text-white placeholder-teal-200 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent backdrop-blur-sm transition-all duration-300 hover:bg-white/15"
            />
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-2 md:space-x-4">
            {/* Botón de búsqueda móvil */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="md:hidden text-white/90 hover:text-white transition-all duration-300 p-2 rounded-xl hover:bg-white/10"
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Indicadores de estado (sólo visible en escritorio o PWA) */}
            {isPWA && (
              <div className="hidden md:flex items-center space-x-2 text-white/60 text-xs mr-2">
                {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
                {batteryLevel !== null && (
                  <div className="flex items-center">
                    <Battery className="w-4 h-4 mr-1" />
                    <span>{Math.round(batteryLevel)}%</span>
                  </div>
                )}
              </div>
            )}

            {/* Notificaciones */}
            <button className="relative text-white/90 hover:text-white transition-all duration-300 p-2 rounded-xl hover:bg-white/10">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 bg-teal-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center animate-pulse">3</span>
            </button>

            {/* Perfil - Desktop */}
            <div className="relative hidden md:block" ref={profileRef}>
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center space-x-3 p-2 rounded-xl hover:bg-white/10 transition-all duration-300"
              >
                <div className="w-8 h-8 bg-gradient-to-r from-teal-500 to-teal-600 rounded-full flex items-center justify-center transition-transform duration-300 hover:scale-110">
                  <span className="text-white text-sm font-medium">
                    {user?.first_name?.[0] || user?.username?.[0] || 'U'}
                  </span>
                </div>
                <div className="hidden md:block">
                  <p className="text-white text-sm font-medium text-left">
                    {user?.first_name || user?.username}
                  </p>
                </div>
                <ChevronDown className={`w-4 h-4 text-white transition-transform duration-300 ${isProfileOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown de perfil */}
              {isProfileOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-black/80 backdrop-blur-lg border border-teal-500/30 rounded-xl shadow-lg py-2 z-50 animate-fade-in">
                  <button
                    onClick={logout}
                    className="w-full flex items-center space-x-2 px-4 py-2 text-white hover:text-teal hover:bg-teal-400/20 transition-all duration-300"
                  >
                    <LogOut className="w-4 h-4 text-teal-300" />
                    <span>Cerrar Sesión</span>
                  </button>
                </div>
              )}
            </div>

            {/* Menú de acciones - Mobile */}
            <div className="relative md:hidden" ref={actionsRef}>
              <button
                onClick={() => setIsActionsOpen(!isActionsOpen)}
                className="text-white/90 hover:text-white transition-all duration-300 p-2 rounded-xl hover:bg-white/10"
              >
                <MoreVertical className="w-5 h-5" />
              </button>

              {isActionsOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl shadow-lg py-2 z-50 animate-fade-in">
                  <div className="px-4 py-2 border-b border-white/10">
                    <div className="flex items-center space-x-3 mb-1">
                      <div className="w-8 h-8 bg-gradient-to-r from-teal-500 to-teal-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-medium">
                          {user?.first_name?.[0] || user?.username?.[0] || 'U'}
                        </span>
                      </div>
                      <p className="text-white text-sm font-medium">
                        {user?.first_name || user?.username}
                      </p>
                    </div>
                  </div>

                 <button
                    onClick={logout}
                    className="w-full flex items-center space-x-2 px-4 py-2 text-white hover:text-teal hover:bg-teal-400/20 transition-all duration-300"
                  >
                    <LogOut className="w-4 h-4 text-black-300" />
                    <span>Cerrar Sesión</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>
    </>
  );
};

export default Navbar;
