import { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosConfig';

export const useUsuarios = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchUsuarios = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get('/api/usuarios/');
      setUsuarios(response.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data || 'Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsuarios();
  }, []);

  return { usuarios, loading, error, fetchUsuarios };
};