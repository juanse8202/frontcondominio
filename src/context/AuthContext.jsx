import React, { createContext, useContext, useState, useEffect } from 'react';
import { login as apiLogin, refresh as apiRefresh, logout as apiLogout } from '../api/auth';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const access = localStorage.getItem('access');
    const storedUser = localStorage.getItem('user');
    if (access && storedUser) {
      let parsedUser = JSON.parse(storedUser);
      
      // Asegurar que el usuario tenga los campos necesarios
      if (!parsedUser.role && !parsedUser.isAdmin) {
        parsedUser = {
          ...parsedUser,
          role: 'admin',
          isAdmin: true,
          permissions: ['dashboard', 'analytics', 'management']
        };
        localStorage.setItem('user', JSON.stringify(parsedUser));
      }
      
      setUser(parsedUser);
      setIsAuthenticated(true);
    }
    const handleForcedLogout = () => {
      setUser(null);
      setIsAuthenticated(false);
    };
    window.addEventListener('auth:logout', handleForcedLogout);
    setLoading(false);
    return () => window.removeEventListener('auth:logout', handleForcedLogout);
  }, []);

  const login = async (credentials) => {
    try {
      const data = await apiLogin(credentials);
      
      // Crear un usuario básico - puedes expandir esto con más información
      const basicUser = { 
        username: credentials.username,
        role: 'admin', // Asumimos que todos los usuarios logueados son admin por ahora
        isAdmin: true,
        permissions: ['dashboard', 'analytics', 'management']
      };
      
      localStorage.setItem('user', JSON.stringify(basicUser));
      setUser(basicUser);
      setIsAuthenticated(true);
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.detail || 'Credenciales inválidas';
      return { success: false, error: message };
    }
  };

  const silentRefresh = async () => {
    try {
      const data = await apiRefresh();
      if (!data) return false;
      return true;
    } catch (e) {
      return false;
    }
  };

  const logout = () => {
    apiLogout();
    localStorage.removeItem('user');
    setUser(null);
    setIsAuthenticated(false);
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    silentRefresh,
    logout,
    isAdmin: user?.role === 'admin' || user?.isAdmin || isAuthenticated // Flexibilidad para diferentes estructuras
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};