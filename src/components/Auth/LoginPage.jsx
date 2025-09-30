import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Eye, EyeOff, User, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Importa la imagen de fondo y el logo
import backgroundImage from '../../assets/fondo1.jpeg';
import backgroundImage2 from '../../assets/condominio_reverse.png';

const Login = () => {
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleChange = (e) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const result = await login(credentials);
      if (!result.success) {
        setError(result.error);
      }
    } catch (err) {
      setError('Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        backgroundImage: `url(${backgroundImage})`, // Usamos la imagen importada
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Decoración */}
      <div className="absolute top-10 left-10 w-32 h-32 bg-gradient-to-br from-blue-400 to-green-500 rounded-full blur-xl animate-pulse"></div>
      <div className="absolute bottom-10 right-10 w-24 h-24 bg-green-500/10 rounded-full blur-lg animate-pulse delay-1000"></div>

      {/* Tarjeta transparente */}
      <div className="relative w-full max-w-md bg-white/20 backdrop-blur-lg border border-white/30 rounded-xl shadow-2xl p-8">
        {/* Logo como imagen */}
        <div className="w-16 h-16 bg-gradient-to-br from-teal-600 to-indigo-700 rounded-xl flex items-center justify-center mx-auto mb-6 shadow-lg">
          <img 
            src={backgroundImage2} // Aquí también usas la ruta correcta
            alt="Logo" 
            className="w-12 h-12 object-cover"
          />
        </div>

        {/* Título */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-semibold text-white mb-2">Smart Condominium</h1>
          <p className="text-indigo-100/70 text-sm">Panel administrativo</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Campo Usuario */}
          <div className="relative">
            <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white-300/60" />
            <input
              type="text"
              name="username"
              value={credentials.username}
              onChange={handleChange}
              required
              placeholder="Usuario"
              className="w-full bg-white/10 border border-white/30 rounded-lg pl-12 pr-4 py-3 text-black placeholder-black-300/50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-200"
            />
          </div>

          {/* Campo Contraseña */}
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white-300/60" />
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={credentials.password}
              onChange={handleChange}
              required
              placeholder="Contraseña"
              className="w-full bg-white/10 border border-white/30 rounded-lg pl-12 pr-12 py-3 text-black placeholder-black-300/50 focus:outline-none focus:ring-2 focus:ring-black-500 focus:border-transparent transition duration-200"
            />
            <button 
              type="button" 
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-indigo-300/60 hover:text-indigo-300 transition-colors"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-500/20 border border-red-500/30 text-red-200 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Botón Login con color teal */}
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white font-medium py-3 rounded-lg shadow-lg transition-all duration-200 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                Ingresando...
              </div>
            ) : 'Ingresar'}
          </button>
        </form>

        {/* Footer */}
        <div className="text-center mt-6 pt-4 border-t border-white/10">
          <p className="text-indigo-100/50 text-xs">
            © {new Date().getFullYear()} Smart Condominium
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
