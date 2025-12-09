import { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosConfig';

const useUnidades = () => {
  const [unidades, setUnidades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Obtener todas las unidades del propietario
  const fetchUnidades = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching unidades from /unidades/...');
      const response = await axiosInstance.get('/unidades/');
      console.log('Response received:', response);
      console.log('Response data:', response.data);
      
      // La API devuelve directamente los resultados o con paginación
      if (response.data.results) {
        // Respuesta paginada
        console.log('Paginated response, results:', response.data.results);
        setUnidades(response.data.results || []);
      } else if (Array.isArray(response.data)) {
        // Respuesta directa
        console.log('Direct array response:', response.data);
        setUnidades(response.data);
      } else {
        console.log('Unknown response format, setting empty array');
        setUnidades([]);
      }
    } catch (err) {
      console.error('Error fetching unidades:', err);
      console.error('Error response:', err.response);
      if (err.response?.status === 404) {
        setUnidades([]);
        setError(null);
      } else {
        setError(
          err.response?.data?.detail || 
          err.response?.data?.message || 
          'Error de conexión. Por favor, intenta nuevamente.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // Obtener detalles específicos de una unidad
  const fetchUnidadDetails = async (unidadId) => {
    try {
      const response = await axiosInstance.get(`/unidades/${unidadId}/`);
      
      if (response.data) {
        return { success: true, data: response.data };
      } else {
        return { success: false, message: 'No se pudieron obtener los detalles' };
      }
    } catch (err) {
      console.error('Error fetching unidad details:', err);
      return { 
        success: false, 
        message: err.response?.data?.detail || 'Error al obtener detalles de la unidad'
      };
    }
  };

  // Obtener información de convivencia (inquilinos actuales)
  const fetchConvivientes = async (unidadId) => {
    try {
      // Nota: Este endpoint puede no existir en la API actual
      // Se podría implementar con propietarios que tengan relación familiar
      const response = await axiosInstance.get(`/propietarios/?unidad=${unidadId}`);
      
      if (response.data.results) {
        return { success: true, data: response.data.results || [] };
      } else if (Array.isArray(response.data)) {
        return { success: true, data: response.data };
      } else {
        return { success: false, message: 'No se encontraron convivientes' };
      }
    } catch (err) {
      console.error('Error fetching convivientes:', err);
      return { 
        success: false, 
        message: err.response?.data?.detail || 'Error al obtener información de convivientes'
      };
    }
  };

  // Crear una nueva unidad
  const createUnidad = async (unidadData) => {
    try {
      const response = await axiosInstance.post('/unidades/', unidadData);
      await fetchUnidades(); // Refrescar la lista
      return { success: true, data: response.data };
    } catch (err) {
      console.error('Error creating unidad:', err);
      return {
        success: false,
        message: err.response?.data?.detail || err.response?.data || 'Error al crear la unidad'
      };
    }
  };

  // Actualizar una unidad existente
  const updateUnidad = async (unidadId, unidadData) => {
    try {
      const response = await axiosInstance.patch(`/unidades/${unidadId}/`, unidadData);
      await fetchUnidades(); // Refrescar la lista
      return { success: true, data: response.data };
    } catch (err) {
      console.error('Error updating unidad:', err);
      return {
        success: false,
        message: err.response?.data?.detail || err.response?.data || 'Error al actualizar la unidad'
      };
    }
  };

  // Eliminar una unidad
  const deleteUnidad = async (unidadId) => {
    try {
      await axiosInstance.delete(`/unidades/${unidadId}/`);
      await fetchUnidades(); // Refrescar la lista
      return { success: true };
    } catch (err) {
      console.error('Error deleting unidad:', err);
      return {
        success: false,
        message: err.response?.data?.detail || 'Error al eliminar la unidad'
      };
    }
  };

  // Cargar datos al montar el componente
  useEffect(() => {
    fetchUnidades();
  }, []);

  return {
    unidades,
    loading,
    error,
    fetchUnidades,
    fetchUnidadDetails,
    fetchConvivientes,
    createUnidad,
    updateUnidad,
    deleteUnidad
  };
};

export default useUnidades;