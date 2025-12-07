import { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosConfig';

export const useNotificaciones = () => {
  const [notificaciones, setNotificaciones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchNotificaciones = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get('/api/notificaciones/');
      setNotificaciones(response.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data || 'Error al cargar notificaciones');
    } finally {
      setLoading(false);
    }
  };

  const createNotificacion = async (notificacionData) => {
    try {
      const response = await axiosInstance.post('/api//notificaciones/', notificacionData);
      setNotificaciones(prev => [...prev, response.data]);
      return response.data;
    } catch (err) {
      setError(err.response?.data || 'Error al crear notificación');
      throw err;
    }
  };

  const notificarMora = async (notificacionData) => {
    try {
      const response = await axiosInstance.post('/api//notificar-mora/', notificacionData);
      return response.data;
    } catch (err) {
      setError(err.response?.data || 'Error al notificar mora');
      throw err;
    }
  };

  useEffect(() => {
    fetchNotificaciones();
  }, []);

  return { 
    notificaciones, 
    loading, 
    error, 
    fetchNotificaciones, 
    createNotificacion, 
    notificarMora 
  };
};