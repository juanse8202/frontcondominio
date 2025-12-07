import { useState, useEffect } from 'react';
import axiosInstance, { withOfflineSupport } from '../api/axiosConfig';

/**
 * Hook para gestionar las visitas del propietario
 */
const useVisitas = () => {
  const [visitas, setVisitas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Helpers
  const VISITAS_CACHE_KEY = 'visitasCache';
  const cacheVisitas = (data) => {
    try { localStorage.setItem(VISITAS_CACHE_KEY, JSON.stringify({ data, ts: Date.now() })); } catch {}
  };
  const readVisitasCache = () => {
    try {
      const raw = localStorage.getItem(VISITAS_CACHE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed?.data || null;
    } catch { return null; }
  };

  // Cargar todas las visitas
  const fetchVisitas = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.get('/visitas/');
      const data = response.data.results || response.data;
      setVisitas(data);
      cacheVisitas(data);
    } catch (err) {
      // Intentar cargar desde caché si hay fallo de blue
      const cached = readVisitasCache();
      if (cached) {
        setVisitas(cached);
      }
      const backendMsg = err.response?.data?.detail || err.response?.data?.message;
      setError(backendMsg || 'Error al cargar visitas');
      console.error('Error fetching visitas:', err);
    } finally {
      setLoading(false);
    }
  };

  // Crear nueva visita
  const createVisita = async (visitaData) => {
    setLoading(true);
    setError(null);
    try {
      // Intentar respetar campos esperados por backend
      const payload = normalizeVisitaPayload(visitaData);
      const response = await axiosInstance.post('/visitas/', payload, withOfflineSupport({}));
      const offlinePending = response.offlineOperation || response.data?.offlineOperation;
      let created = response.data?.data || response.data;
      // Si es operación offline simulada, crear un registro temporal local
      if (offlinePending) {
        const tempId = `tmp-${Date.now()}`;
        created = { id: tempId, ...payload };
        // también incluir campo 'fecha' para compatibilidad en UI
        if (created.fecha_visita && !created.fecha) created.fecha = created.fecha_visita;
      }
      setVisitas(prev => {
        const next = [...prev, created];
        cacheVisitas(next);
        return next;
      });
      return { success: true, data: created, offlinePending: !!offlinePending };
    } catch (err) {
      const errorMsg = extractDrfError(err) || 'Error al crear visita';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  // Actualizar visita existente
  const updateVisita = async (id, visitaData) => {
    setLoading(true);
    setError(null);
    try {
      const payload = normalizeVisitaPayload(visitaData);
      const response = await axiosInstance.put(`/visitas/${id}/`, payload, withOfflineSupport({}));
      const offlinePending = response.offlineOperation || response.data?.offlineOperation;
      let updated = response.data?.data || response.data;
      if (offlinePending) {
        updated = { id, ...payload };
        if (updated.fecha_visita && !updated.fecha) updated.fecha = updated.fecha_visita;
      }
      setVisitas(prev => {
        const next = prev.map(visita => visita.id === id ? updated : visita);
        cacheVisitas(next);
        return next;
      });
      return { success: true, data: updated, offlinePending: !!offlinePending };
    } catch (err) {
      const errorMsg = extractDrfError(err) || 'Error al actualizar visita';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  // Eliminar visita
  const deleteVisita = async (id) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.delete(`/visitas/${id}/`, withOfflineSupport({}));
      const offlinePending = response.offlineOperation || response.data?.offlineOperation;
      setVisitas(prev => {
        const next = prev.filter(visita => visita.id !== id);
        cacheVisitas(next);
        return next;
      });
      return { success: true, offlinePending: !!offlinePending };
    } catch (err) {
      const errorMsg = extractDrfError(err) || 'Error al eliminar visita';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  // Cargar visitas al montar el componente
  useEffect(() => {
    fetchVisitas();
  }, []);

  return {
    visitas,
    loading,
    error,
    createVisita,
    updateVisita,
    deleteVisita,
    refetch: fetchVisitas
  };
};

// Normaliza payload hacia los campos esperados por backend
function normalizeVisitaPayload(data) {
  const payload = { ...data };
  // Si el backend espera fecha_visita, mapear
  if (!payload.fecha_visita && payload.fecha) {
    const raw = payload.fecha;
    let dateOnly = raw;
    if (typeof raw === 'string') {
      // tomar solo la parte YYYY-MM-DD si viene con tiempo (datetime-local)
      dateOnly = raw.split('T')[0];
    } else {
      const d = new Date(raw);
      if (!isNaN(d.getTime())) dateOnly = d.toISOString().slice(0, 10);
    }
    payload.fecha_visita = dateOnly;
    delete payload.fecha;
  }
  // Asegurar claves comunes
  if (!payload.nombre_visitante && payload.nombre) {
    payload.nombre_visitante = payload.nombre;
    delete payload.nombre;
  }
  // documento_visitante ya viene del formulario
  return payload;
}

// Extrae mensajes útiles de DRF
function extractDrfError(err) {
  const d = err?.response?.data;
  if (!d) return err?.message;
  if (typeof d === 'string') return d;
  if (d.detail) return d.detail;
  if (Array.isArray(d.non_field_errors) && d.non_field_errors.length) return d.non_field_errors[0];
  // tomar el primer error de campo
  for (const k of Object.keys(d)) {
    const v = d[k];
    if (Array.isArray(v) && v.length) return `${k}: ${v[0]}`;
    if (typeof v === 'string') return `${k}: ${v}`;
  }
  return undefined;
}

export default useVisitas;