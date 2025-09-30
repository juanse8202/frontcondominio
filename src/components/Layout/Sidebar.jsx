import React, { useState } from 'react';
import {
  Home,
  BarChart3,
  Users,
  Settings,
  Building,
  CreditCard,
  FileText,
  Calendar,
  ChevronDown,
  Car,
  PawPrint,
  UsersRound,
  Megaphone,
  IdCard,
  TreePalm
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Link, useLocation } from 'react-router-dom';
import backgroundImage2 from '../../assets/condominio_reverse.png';


const Sidebar = ({ isOpen }) => {
  const { isAdmin } = useAuth();
  const location = useLocation();
  const [activeSubmenus, setActiveSubmenus] = useState({});

  const menuItems = [
    { icon: Home, label: 'Dashboard', path: '/dashboard' },
    { icon: Users, label: 'Propietarios', path: '/propietarios' },
    { icon: Building, label: 'Unidades', path: '/unidades' },
    { icon: Car, label: 'Vehículos', path: '/vehiculos' },
    { icon: Calendar, label: 'Reservas', path: '/reservas' },
    { icon: IdCard, label: 'Visitas', path: '/visitas' },
    // Finanzas
    { icon: CreditCard, label: 'Expensas', path: '/expensas' },
    { icon: CreditCard, label: 'Pagos', path: '/pagos' },
    // Infraestructura / otros
    { icon: TreePalm, label: 'Áreas Comunes', path: '/areas' },
    { icon: FileText, label: 'Reportes', path: '/reportes' },
    { icon: Megaphone, label: 'Comunicados', path: '/comunicados' },
  ];

  const adminMenuItems = isAdmin ? [
    { icon: BarChart3, label: 'Analytics', path: '/dashboard' },
    { icon: Settings, label: 'Configuración', path: '/dashboard' }
  ] : [];

  const isActive = (path) => location.pathname === path;

  const toggleSubmenu = (label) => {
    setActiveSubmenus(prev => ({
      ...prev,
      [label]: !prev[label]
    }));
  };

  return (
    <aside className={`
      fixed left-0 top-0 h-full bg-black/80 backdrop-blur-lg border-r border-white/20 
      transform transition-all duration-500 z-40 overflow-y-auto
      ${isOpen ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0'}
      w-64
    `}>
      <div className="p-6">
        {/* Logo */}
        {/* <div className="bg-gradient-to-r from-teal-500 to-teal-600 w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg transition-transform duration-300 hover:scale-105">
          <span className="text-white font-bold text-xl">C</span>
        </div> */}
        <div className="w-16 h-16 bg-gradient-to-br from-teal-600 to-indigo-700 rounded-xl flex items-center justify-center mx-auto mb-6 shadow-lg">
          <img
            src={backgroundImage2} // Aquí también usas la ruta correcta
            alt="Logo"
            className="w-12 h-12 object-cover"
          />
        </div>

        {/* <h2 className="text-white font-bold text-center mb-8 transition-opacity duration-300">Smart Condominium</h2> */}

        <nav className="space-y-1">
          {menuItems.map((item, index) => (
            <div key={item.label || item.path}>
              {item.submenu ? (
                // Elemento con submenú - usar button
                <button
                  onClick={() => toggleSubmenu(item.label)}
                  className={`
                    w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300 group
                    text-white/90 hover:bg-teal-600/10 hover:text-teal-500
                  `}
                  style={{ transitionDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-center space-x-3">
                    <item.icon className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
                    <span className="font-medium">{item.label}</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${activeSubmenus[item.label] ? 'rotate-180' : ''}`} />
                </button>
              ) : (
                // Elemento sin submenú - usar Link
                <Link
                  to={item.path}
                  className={`
                    w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300 group
                    ${isActive(item.path)
                      ? 'bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-lg'
                      : 'text-white/90 hover:bg-teal-600/10 hover:text-teal-500'
                    }
                  `}
                  style={{ transitionDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-center space-x-3">
                    <item.icon className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
                    <span className="font-medium">{item.label}</span>
                  </div>
                </Link>
              )}

              {/* Submenús */}
            </div>
          ))}

          {adminMenuItems.map((item, index) => (
            <Link
              key={item.path}
              to={item.path}
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-white/90 hover:bg-teal-600/10 hover:text-teal-500 transition-all duration-300"
              style={{ transitionDelay: `${(menuItems.length + index) * 50}ms` }}
            >
              <item.icon className="w-5 h-5 transition-transform duration-300 hover:scale-110" />
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;
