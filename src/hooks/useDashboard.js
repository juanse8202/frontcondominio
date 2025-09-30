import { useState, useEffect, useCallback } from 'react';
import dashboardService from '../api/dashboardService';

// Hook personalizado para manejar toda la lógica del dashboard
export const useDashboard = () => {
  const [dashboardData, setDashboardData] = useState({
    resumen: null,
    finanzas: null,
    riesgos: null,
    areasComunes: null,
    operacional: null,
    predicciones: null
  });

  const [loading, setLoading] = useState({
    global: false,
    resumen: false,
    finanzas: false,
    riesgos: false,
    areasComunes: false,
    operacional: false,
    predicciones: false
  });

  const [error, setError] = useState({
    global: null,
    resumen: null,
    finanzas: null,
    riesgos: null,
    areasComunes: null,
    operacional: null,
    predicciones: null
  });

  const [lastUpdated, setLastUpdated] = useState(null);

  // Función para limpiar errores
  const clearError = useCallback((section = 'global') => {
    setError(prev => ({ ...prev, [section]: null }));
  }, []);

  // Función para cargar resumen general
  const loadResumenGeneral = useCallback(async () => {
    setLoading(prev => ({ ...prev, resumen: true }));
    setError(prev => ({ ...prev, resumen: null }));
    
    try {
      const data = await dashboardService.getResumenGeneral();
      setDashboardData(prev => ({ ...prev, resumen: data }));
    } catch (err) {
      setError(prev => ({ 
        ...prev, 
        resumen: err.response?.data?.detail || 'Error cargando resumen general'
      }));
    } finally {
      setLoading(prev => ({ ...prev, resumen: false }));
    }
  }, []);

  // Función para cargar análisis financiero
  const loadAnalisisFinanciero = useCallback(async () => {
    setLoading(prev => ({ ...prev, finanzas: true }));
    setError(prev => ({ ...prev, finanzas: null }));
    
    try {
      const data = await dashboardService.getAnalisisFinanciero();
      setDashboardData(prev => ({ ...prev, finanzas: data }));
    } catch (err) {
      setError(prev => ({ 
        ...prev, 
        finanzas: err.response?.data?.detail || 'Error cargando análisis financiero'
      }));
    } finally {
      setLoading(prev => ({ ...prev, finanzas: false }));
    }
  }, []);

  // Función para cargar análisis de riesgos
  const loadAnalisisRiesgos = useCallback(async () => {
    setLoading(prev => ({ ...prev, riesgos: true }));
    setError(prev => ({ ...prev, riesgos: null }));
    
    try {
      const data = await dashboardService.getAnalisisRiesgos();
      setDashboardData(prev => ({ ...prev, riesgos: data }));
    } catch (err) {
      setError(prev => ({ 
        ...prev, 
        riesgos: err.response?.data?.detail || 'Error cargando análisis de riesgos'
      }));
    } finally {
      setLoading(prev => ({ ...prev, riesgos: false }));
    }
  }, []);

  // Función para cargar análisis de áreas comunes
  const loadAnalisisAreasComunes = useCallback(async () => {
    setLoading(prev => ({ ...prev, areasComunes: true }));
    setError(prev => ({ ...prev, areasComunes: null }));
    
    try {
      const data = await dashboardService.getAnalisisAreasComunes();
      setDashboardData(prev => ({ ...prev, areasComunes: data }));
    } catch (err) {
      setError(prev => ({ 
        ...prev, 
        areasComunes: err.response?.data?.detail || 'Error cargando análisis de áreas comunes'
      }));
    } finally {
      setLoading(prev => ({ ...prev, areasComunes: false }));
    }
  }, []);

  // Función para cargar análisis operacional
  const loadAnalisisOperacional = useCallback(async () => {
    setLoading(prev => ({ ...prev, operacional: true }));
    setError(prev => ({ ...prev, operacional: null }));
    
    try {
      const data = await dashboardService.getAnalisisOperacional();
      setDashboardData(prev => ({ ...prev, operacional: data }));
      // Si viene fallback, no lo tratamos como error pero podemos distinguir si hace falta
    } catch (err) {
      setError(prev => ({ 
        ...prev, 
        operacional: err.response?.data?.detail || 'Error cargando análisis operacional'
      }));
    } finally {
      setLoading(prev => ({ ...prev, operacional: false }));
    }
  }, []);

  // Función para cargar predicciones de IA
  const loadPrediccionesIA = useCallback(async () => {
    setLoading(prev => ({ ...prev, predicciones: true }));
    setError(prev => ({ ...prev, predicciones: null }));
    
    try {
      const data = await dashboardService.getPrediccionesIA();
      setDashboardData(prev => ({ ...prev, predicciones: data }));
    } catch (err) {
      setError(prev => ({ 
        ...prev, 
        predicciones: err.response?.data?.detail || 'Error cargando predicciones de IA'
      }));
    } finally {
      setLoading(prev => ({ ...prev, predicciones: false }));
    }
  }, []);

  // Función para cargar todos los datos del dashboard
  const loadAllDashboardData = useCallback(async (useParallel = true) => {
    setLoading(prev => ({ ...prev, global: true }));
    setError(prev => ({ ...prev, global: null }));
    
    try {
      if (useParallel) {
        // Carga paralela tolerante a fallos (allSettled)
        const data = await dashboardService.getAllDashboardData();
        const { _errors = {}, ...payload } = data;
        setDashboardData(prev => ({ ...prev, ...payload }));
        // Propagar errores parciales sin marcar global si al menos uno salió bien
        setError(prev => ({
          ...prev,
          resumen: _errors.resumen || prev.resumen,
            finanzas: _errors.finanzas || prev.finanzas,
            riesgos: _errors.riesgos || prev.riesgos,
            areasComunes: _errors.areasComunes || prev.areasComunes,
            operacional: _errors.operacional || prev.operacional,
            predicciones: _errors.predicciones || prev.predicciones,
            global: Object.keys(_errors).length === 6 ? (prev.global || 'Error cargando datos del dashboard') : null
        }));
      } else {
        // Carga secuencial si se prefiere
        await loadResumenGeneral();
        await loadAnalisisFinanciero();
        await loadAnalisisRiesgos();
        await loadAnalisisAreasComunes();
        await loadAnalisisOperacional();
        await loadPrediccionesIA();
      }
      
      setLastUpdated(new Date());
    } catch (err) {
      setError(prev => ({ 
        ...prev, 
        global: err.response?.data?.detail || 'Error cargando datos del dashboard'
      }));
    } finally {
      setLoading(prev => ({ ...prev, global: false }));
    }
  }, [loadResumenGeneral, loadAnalisisFinanciero, loadAnalisisRiesgos, 
      loadAnalisisAreasComunes, loadAnalisisOperacional, loadPrediccionesIA]);

  // Función para recargar datos (refresh)
  const refreshDashboard = useCallback(() => {
    loadAllDashboardData(true);
  }, [loadAllDashboardData]);

  // Función para verificar si hay datos cargados
  const hasData = (section) => {
    if (section) {
      return dashboardData[section] !== null;
    }
    return Object.values(dashboardData).some(data => data !== null);
  };

  // Función para verificar si está cargando
  const isLoading = (section) => {
    if (section) {
      return loading[section];
    }
    return Object.values(loading).some(isLoading => isLoading);
  };

  // Función para verificar si hay errores
  const hasError = (section) => {
    if (section) {
      return error[section] !== null;
    }
    return Object.values(error).some(err => err !== null);
  };

  // Cargar datos inicialmente
  useEffect(() => {
    loadAllDashboardData(true);
  }, [loadAllDashboardData]);

  return {
    // Datos
    dashboardData,
    
    // Estados
    loading,
    error,
    lastUpdated,
    
    // Funciones de carga individuales
    loadResumenGeneral,
    loadAnalisisFinanciero,
    loadAnalisisRiesgos,
    loadAnalisisAreasComunes,
    loadAnalisisOperacional,
    loadPrediccionesIA,
    
    // Funciones de carga masiva
    loadAllDashboardData,
    refreshDashboard,
    
    // Utilidades
    clearError,
    hasData,
    isLoading,
    hasError
  };
};

export default useDashboard;