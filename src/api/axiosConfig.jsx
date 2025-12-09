// src/api/axiosConfig.js
import axios from "axios";
import { refresh as refreshToken, logout as rawLogout } from './auth';

// Permite configurar dinámicamente el backend desde variables de entorno Vite/Vercel.
// Definir en Vercel (Project Settings > Environment Variables):
//  KEY: VITE_API_BASE_URL  VALUE: https://3.23.127.131 (o tu dominio con HTTPS)
// En local usar .env.development o .env
let rawBase = import.meta.env?.VITE_API_URL || ""; // Ej: https://api.midominio.com

// Si la variable viene con /api al final, la limpiamos para que no duplique
if (rawBase.endsWith('/api')) {
  rawBase = rawBase.slice(0, -4);
}

// Normalizar para evitar // en la concatenación
const normalize = (v) => v.replace(/\/$/, "");
const basePrefix = rawBase ? normalize(rawBase) : ""; // vacío => fallback a relativo

// Base final para axios. Si no hay variable, mantiene comportamiento anterior (/api relativo)
// Fallback inteligente para evitar Mixed Content:
// Si el frontend está en HTTPS y solo tenemos un backend HTTP sin TLS, usamos rutas relativas
// para que el proxy (rewrite de Vercel) maneje la conexión y no el navegador directo.
let resolvedBaseURL = basePrefix ? `${basePrefix}/api` : "/api";
try {
  if (typeof window !== 'undefined') {
    const httpsPage = window.location.protocol === 'https:';
    const backendIsPlainHttp = resolvedBaseURL.startsWith('http://');
    if (httpsPage && backendIsPlainHttp) {
      // Forzar relativo para que pegue contra el dominio actual y el rewrite redirija
      resolvedBaseURL = '/api';
    }
  }
} catch (_) {
  // Ignorado: entorno SSR o acceso bloqueado
}

// Warning en desarrollo si hay mezcla HTTPS (frontend) -> HTTP (backend) sin proxy rewrite
if (typeof window !== 'undefined') {
  const isFrontendHttps = window.location.protocol === 'https:';
  const isBackendHttp = resolvedBaseURL.startsWith('http://');
  if (isFrontendHttps && isBackendHttp) {
    // El rewrite de Vercel soluciona esto, pero avisamos si se hace llamada directa
    // eslint-disable-next-line no-console
    console.warn('[API] Backend HTTP detrás de frontend HTTPS. Usar rewrite o habilitar TLS para evitar problemas futuros.');
  }
}

// Determinar si el dispositivo está en línea
const isOnline = () => navigator.onLine;

const axiosInstance = axios.create({
  baseURL: resolvedBaseURL,
});

// Exponer (para debug si hace falta) en window cuando está en desarrollo
if (typeof window !== 'undefined' && import.meta?.env?.MODE !== 'production') {
  window.__API_BASE_URL__ = resolvedBaseURL; // eslint-disable-line no-underscore-dangle
}

// Interceptor para añadir token de autenticación
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("access");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // Comprobar si el dispositivo está offline
  if (!isOnline()) {
    // Cancelar solicitudes que no estén configuradas para trabajar offline
    if (!config.offlineSupport) {
      throw new axios.Cancel("Operación cancelada: No hay conexión a internet");
    }
    
    // Si la solicitud admite offline, podemos continuar (se manejará en otro lugar)
    config.offlineRequest = true;
  }
  
  return config;
});

// Interceptor para manejar respuestas
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    // Si es una cancelación (como offline) no hacer nada más
    if (axios.isCancel(error)) {
      return Promise.reject(error);
    }
    
    // Si el error es por falta de conexión, guardar la solicitud para reintentarla
    if (!isOnline() || (error.message && error.message.includes('Network Error'))) {
      const { config } = error;
      
      // Si la solicitud admite operaciones offline, guardarla para reintento
      if (config && config.offlineSupport) {
        // Guardar en cola de operaciones pendientes
        const pendingOperation = {
          url: config.url,
          method: config.method,
          data: config.data ? JSON.parse(config.data) : null,
          headers: config.headers,
          timestamp: Date.now()
        };
        
        // Guardar en localStorage
        try {
          const pendingOps = JSON.parse(localStorage.getItem('pendingOperations') || '[]');
          pendingOps.push(pendingOperation);
          localStorage.setItem('pendingOperations', JSON.stringify(pendingOps));
        } catch (err) {
          console.error('Error al guardar operación para sincronización:', err);
        }
        
        // Retornar una respuesta simulada para operaciones offline
        return Promise.resolve({
          data: { success: true, offlineOperation: true, pendingSync: true },
          status: 200,
          offlineOperation: true
        });
      }
    }
    
    // Manejo de 401 para refrescar token una sola vez
    const originalRequest = error.config;
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshed = await refreshToken();
        if (refreshed && refreshed.access) {
          // Actualizar header y reintentar
          originalRequest.headers.Authorization = `Bearer ${refreshed.access}`;
          return axiosInstance(originalRequest);
        }
      } catch (refreshErr) {
        // Ignorado: proceder a logout abajo
      }
      // Si no se pudo refrescar, cerrar sesión globalmente
      rawLogout();
      localStorage.removeItem('user');
      // Emitir evento para que AuthContext pueda reaccionar si escucha
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('auth:logout'));
        // Redirigir al login si no estamos ya allí
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

// Función para habilitar soporte offline en una solicitud
export const withOfflineSupport = (config) => {
  return {
    ...config,
    offlineSupport: true
  };
};

// Función para sincronizar operaciones pendientes
export const syncPendingOperations = async () => {
  if (!isOnline()) return { success: false, message: 'Sin conexión a internet' };
  
  try {
    const pendingOps = JSON.parse(localStorage.getItem('pendingOperations') || '[]');
    if (pendingOps.length === 0) return { success: true, synced: 0 };
    
    const successfulOps = [];
    
    for (const op of pendingOps) {
      try {
        await axiosInstance({
          url: op.url,
          method: op.method,
          data: op.data,
          headers: op.headers
        });
        successfulOps.push(op);
      } catch (error) {
        console.error('Error sincronizando operación:', error);
      }
    }
    
    // Eliminar operaciones sincronizadas
    const remainingOps = pendingOps.filter(op => 
      !successfulOps.some(sop => 
        sop.url === op.url && 
        sop.method === op.method && 
        sop.timestamp === op.timestamp
      )
    );
    
    localStorage.setItem('pendingOperations', JSON.stringify(remainingOps));
    
    return { 
      success: true, 
      synced: successfulOps.length,
      pending: remainingOps.length
    };
  } catch (error) {
    console.error('Error durante la sincronización:', error);
    return { success: false, error: error.message };
  }
};

// Escuchar eventos de conexión para sincronizar automáticamente
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('Conexión recuperada. Sincronizando datos...');
    syncPendingOperations()
      .then(result => {
        if (result.synced > 0) {
          console.log(`Sincronización completada: ${result.synced} operaciones sincronizadas, ${result.pending} pendientes.`);
        }
      });
  });
}

export default axiosInstance;
