import { useState, useEffect, useCallback } from 'react';
import axiosInstance from '../api/axiosConfig';

/**
 * Hook para obtener el perfil de propietario autenticado.
 * Endpoint: GET /propietarios/me/
 * Devuelve (entre otros) campos: meses_mora, restringido_por_mora
 */
const usePropietario = () => {
  const [perfil, setPerfil] = useState(null);
  const [loadingPerfil, setLoadingPerfil] = useState(false);
  const [errorPerfil, setErrorPerfil] = useState(null);

  const fetchPerfil = useCallback(async () => {
    setLoadingPerfil(true);
    setErrorPerfil(null);
    try {
      const response = await axiosInstance.get('/propietarios/me/');
      setPerfil(response.data);
    } catch (err) {
      console.error('Error fetch perfil propietario', err);
      setErrorPerfil(err.response?.data?.detail || 'Error al cargar perfil');
    } finally {
      setLoadingPerfil(false);
    }
  }, []);

  useEffect(() => { fetchPerfil(); }, [fetchPerfil]);

  return { perfil, loadingPerfil, errorPerfil, fetchPerfil };
};

export default usePropietario;
