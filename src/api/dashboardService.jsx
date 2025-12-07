import axiosInstance from './axiosConfig';

// Circuit breaker simple para /dashboard/operacional/
const operacionalBreaker = {
  open: false,
  openedAt: 0,
  cooldownMs: 5 * 60 * 1000, // 5 minutos
};

const operacionalFallback = () => ({
  tickets_abiertos: 0,
  alertas_activas: 0,
  eficiencia: 98,
  __fallback: true
});

// Servicio para consumir los endpoints del dashboard con IA/ML
export const dashboardService = {
  // Endpoint: /api/dashboard/resumen/
  // Obtiene resumen general del condominio con métricas principales
  getResumenGeneral: async () => {
    try {
      const response = await axiosInstance.get('/dashboard/resumen/');
      return response.data;
    } catch (error) {
      console.error('Error obteniendo resumen general:', error);
      throw error;
    }
  },

  // Endpoint: /api/dashboard/finanzas/
  // Análisis financiero detallado con ML - predicciones, tendencias, anomalías
  getAnalisisFinanciero: async () => {
    try {
      const response = await axiosInstance.get('/dashboard/finanzas/');
      return response.data;
    } catch (error) {
      console.error('Error obteniendo análisis financiero:', error);
      throw error;
    }
  },

  // Endpoint: /api/dashboard/riesgos/
  // Análisis de riesgos con scoring de IA para cada propietario
  getAnalisisRiesgos: async () => {
    try {
      const response = await axiosInstance.get('/dashboard/riesgos/');
      return response.data;
    } catch (error) {
      console.error('Error obteniendo análisis de riesgos:', error);
      throw error;
    }
  },

  // Endpoint: /api/dashboard/areas-comunes/
  // Análisis inteligente de uso de áreas comunes con predicciones
  getAnalisisAreasComunes: async () => {
    try {
      const response = await axiosInstance.get('/dashboard/areas-comunes/');
      return response.data;
    } catch (error) {
      console.error('Error obteniendo análisis de áreas comunes:', error);
      throw error;
    }
  },

  // Endpoint: /api/dashboard/operacional/
  // Indicadores operacionales con IA - eficiencia, reportes, alertas
  getAnalisisOperacional: async () => {
    // Versión totalmente estática solicitada: no se hace petición a backend
    if (!window.__OPERACIONAL_STATIC_LOGGED__) {
      console.info('[Dashboard] Datos operacionales estáticos (sin petición al backend).');
      window.__OPERACIONAL_STATIC_LOGGED__ = true;
    }
    return {
      tickets_abiertos: 2,
      alertas_activas: 1,
      eficiencia: 97,
      __static: true
    };
  },

  // Endpoint: /api/dashboard/predicciones/
  // Predicciones avanzadas con IA - 6 meses futuro, insights automáticos
  getPrediccionesIA: async () => {
    try {
      const response = await axiosInstance.get('/dashboard/predicciones/');
      return response.data;
    } catch (error) {
      console.error('Error obteniendo predicciones de IA:', error);
      throw error;
    }
  },

  // Función para obtener todos los datos del dashboard en una sola llamada
  // (opcional - para optimizar la carga inicial)
  getAllDashboardData: async () => {
    // Usar allSettled para no abortar todo si un endpoint (ej: operacional) da 500
    const entries = {
      resumen: dashboardService.getResumenGeneral(),
      finanzas: dashboardService.getAnalisisFinanciero(),
      riesgos: dashboardService.getAnalisisRiesgos(),
      areasComunes: dashboardService.getAnalisisAreasComunes(),
      operacional: dashboardService.getAnalisisOperacional(),
      predicciones: dashboardService.getPrediccionesIA()
    };

    const keys = Object.keys(entries);
    const settled = await Promise.allSettled(Object.values(entries));

    const result = { resumen: null, finanzas: null, riesgos: null, areasComunes: null, operacional: null, predicciones: null };
    const errors = {};

    settled.forEach((res, idx) => {
      const k = keys[idx];
      if (res.status === 'fulfilled') {
        result[k] = res.value;
      } else {
        errors[k] = res.reason?.response?.data?.detail || res.reason?.message || 'Error';
      }
    });

    return { ...result, _errors: errors };
  }
};

export default dashboardService;