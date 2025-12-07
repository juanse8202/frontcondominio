import { useState, useEffect, useCallback } from 'react';
import axiosInstance from '../api/axiosConfig';

/**
 * Hook de expensas alineado con la guía backend (EXPENSAS_FRONTEND.md)
 * Campos clave expensa: id, mes_referencia, total, total_pagado_verificado, saldo_pendiente, pagado, esta_vencida, fecha_vencimiento
 * Endpoints:
 *   GET /expensas/?page=&pagado=&vencida=&mes=YYYY-MM
 *   GET /expensas/{id}/
 *   POST /pagos/ { expensa, monto, metodo_pago, comprobante? }
 */
const useExpensas = () => {
  const [expensas, setExpensas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [savingPayment, setSavingPayment] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10); // si backend ignora, queda local
  const [count, setCount] = useState(0);
  const [filters, setFilters] = useState({ pagado: '', vencida: '', mes: '' });

  const extractResults = (data) => Array.isArray(data?.results) ? data.results : (Array.isArray(data) ? data : []);

  const buildQueryParams = () => {
    const params = new URLSearchParams();
  if (page) params.append('page', page);
  if (pageSize) params.append('page_size', pageSize);
    if (filters.pagado) params.append('pagado', filters.pagado);
    if (filters.vencida) params.append('vencida', filters.vencida);
    if (filters.mes) params.append('mes', filters.mes); // YYYY-MM
    return params.toString() ? `?${params.toString()}` : '';
  };

  const fetchExpensas = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qp = buildQueryParams();
      const response = await axiosInstance.get(`/expensas/${qp}`);
      const data = response.data;
      const rows = extractResults(data);
      setExpensas(rows);
      if (typeof data.count === 'number') setCount(data.count);
    } catch (err) {
      console.error('Error fetchExpensas:', err);
      setError(err.response?.data?.detail || 'Error al cargar expensas');
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  const setFilter = (name, value) => {
    setPage(1); // reset page
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const fetchExpensaDetail = async (id) => {
    try {
      const response = await axiosInstance.get(`/expensas/${id}/`);
      return { success: true, data: response.data };
    } catch (err) {
      return { success: false, error: err.response?.data?.detail || 'Error al obtener expensa' };
    }
  };

  const createPago = async (payload) => {
    setSavingPayment(true);
    setError(null);
    try {
      const response = await axiosInstance.post('/pagos/', payload);
      // Refrescar listado tras pago
      fetchExpensas();
      return { success: true, data: response.data };
    } catch (err) {
      const backendData = err.response?.data;
      let msg = backendData?.detail;
      // Mensaje custom según guía
      if (!msg && backendData) {
        // Intentar extraer primer error
        msg = Object.values(backendData)[0];
        if (Array.isArray(msg)) msg = msg[0];
      }
      if (!msg) msg = 'Error al registrar pago';
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setSavingPayment(false);
    }
  };

  const computeStats = () => {
    const totalReg = expensas.length; // solo página actual si paginado en backend
    let pagadas = 0, vencidas = 0, parciales = 0, pendientes = 0;
    let saldoAcumulado = 0;
    let totalMonto = 0;
    expensas.forEach(e => {
      const pagado = !!e.pagado;
      const vencida = !!e.esta_vencida;
      const saldo = parseFloat(e.saldo_pendiente || 0) || 0;
      const total = parseFloat(e.total || 0) || 0;
      const pagadoVerificado = parseFloat(e.total_pagado_verificado || 0) || 0;
      totalMonto += total;
      saldoAcumulado += saldo;
      if (pagado) pagadas++;
      else if (vencida) vencidas++;
      else if (!pagado && pagadoVerificado > 0 && saldo > 0) parciales++;
      else if (!pagado) pendientes++;
    });
    return { totalReg, pagadas, vencidas, parciales, pendientes, saldoAcumulado, totalMonto };
  };

  const getEstado = (e) => {
    if (e.pagado) return 'pagada';
    if (e.esta_vencida) return 'vencida';
    const saldo = parseFloat(e.saldo_pendiente || 0) || 0;
    const total = parseFloat(e.total || 0) || 0;
    if (saldo < total && saldo > 0) return 'parcial';
    return 'pendiente';
  };

  useEffect(() => { fetchExpensas(); }, [fetchExpensas]);

  return {
    expensas,
    loading,
    error,
    savingPayment,
    page,
    setPage,
    count,
    filters,
    setFilter,
    fetchExpensas,
    fetchExpensaDetail,
    createPago,
    computeStats,
  getEstado,
  pageSize,
  setPageSize,
  };
};

export default useExpensas;