import React from 'react';
import { Link } from 'react-router-dom';
import { Home, AlertCircle } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800 p-4 overflow-hidden fixed inset-0">
      {/* Background Effects */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-4 -right-4 w-24 h-24 bg-blue-400/20 rounded-full blur-xl" />
        <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-blue-500/20 rounded-full blur-2xl" />
      </div>

      <div className="text-center bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8 md:p-12 max-w-md w-full mx-4 transform hover:scale-[1.02] transition-all duration-300 z-10">
        {/* Icono */}
        <div className="mb-6">
          <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <AlertCircle className="w-10 h-10 text-white" />
          </div>
        </div>

        {/* Texto */}
        <h1 className="text-6xl font-bold text-white mb-2">404</h1>
        <h2 className="text-2xl font-semibold text-white mb-4">Página No Encontrada</h2>
        
        <p className="text-blue-100/80 mb-8">
          Lo sentimos, la página que estás buscando no existe o ha sido movida.
        </p>

        {/* Botón de regreso */}
        <Link
          to="/dashboard"
          className="inline-flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium px-6 py-3 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
        >
          <Home className="w-5 h-5" />
          <span>Volver al Dashboard</span>
        </Link>

        {/* Decoración adicional */}
        <div className="mt-8 flex justify-center space-x-2">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="w-2 h-2 bg-blue-400/50 rounded-full animate-bounce"
              style={{ animationDelay: `${item * 0.2}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default NotFound;