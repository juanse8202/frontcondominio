import { useState, useEffect, useCallback } from 'react';
import axiosInstance from '../api/axiosConfig';

/**
 * Hook genérico para listados paginados administrativos.
 * Compatible con respuestas DRF: { count, next, previous, results } o arrays directos.
 * Permite filtros dinámicos, refresco manual y actualización parcial de ítems.
 */
export default function usePagedList({ endpoint, pageSize = 20, initialFilters = {} }) {
  const [items, setItems] = useState([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState(initialFilters);
  const [refreshIndex, setRefreshIndex] = useState(0);

  const setFilter = (key, value) => {
    setPage(1); // reinicia a primera página
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const buildParams = () => {
    const params = { page, page_size: pageSize };
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') params[k] = v;
    });
    return params;
  };

  const fetchData = useCallback(async () => {
    if (!endpoint) return;
    setLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.get(endpoint, { params: buildParams() });
      const data = response.data;
      if (data?.results) {
        setItems(data.results);
        setCount(data.count || data.results.length || 0);
      } else if (Array.isArray(data)) {
        setItems(data);
        setCount(data.length);
      } else {
        // formato desconocido
        setItems([]);
        setCount(0);
      }
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Error al cargar datos';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [endpoint, page, pageSize, filters, refreshIndex]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const refresh = () => setRefreshIndex(i => i + 1);

  const updateItem = (id, partial) => {
    setItems(prev => prev.map(it => (it.id === id ? { ...it, ...partial } : it)));
  };

  const removeItem = (id) => {
    setItems(prev => prev.filter(it => it.id !== id));
    setCount(c => Math.max(0, c - 1));
  };

  const addItem = (item) => {
    setItems(prev => [item, ...prev]);
    setCount(c => c + 1);
  };

  return {
    items,
    count,
    page,
    setPage,
    loading,
    error,
    filters,
    setFilter,
    refresh,
    updateItem,
    removeItem,
    addItem,
    pageSize,
  };
}
