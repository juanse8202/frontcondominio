import { useState, useEffect } from 'react';
import axiosInstance, { withOfflineSupport } from '../api/axiosConfig';

// Hook para gestionar reservas de áreas comunes (perfil propietario)
// Endpoints usados:
//  GET /reservas/
//  POST /reservas/
//  PUT/PATCH /reservas/{id}/
//  PATCH /reservas/{id}/confirm/
//  PATCH /reservas/{id}/cancelar/  (según guía, puede llamarse cancelar, ajustar si difiere)

const CACHE_KEY = 'reservasCache';

const useReservas = () => {
  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const cacheSet = (data) => { try { localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data })); } catch {} };
  const cacheGet = () => { try { return JSON.parse(localStorage.getItem(CACHE_KEY) || 'null')?.data || null; } catch { return null; } };

  const extractList = (respData) => respData?.results || respData || [];

  const fetchReservas = async (params = {}) => {
    setLoading(true); setError(null);
    try {
      const response = await axiosInstance.get('/reservas/', { params });
      const list = extractList(response.data);
      setReservas(list); cacheSet(list);
    } catch (err) {
      const cached = cacheGet(); if (cached) setReservas(cached);
      setError(readDrfError(err) || 'Error al cargar reservas');
    } finally { setLoading(false); }
  };

  const createReserva = async (data) => {
    setSaving(true); setError(null);
    try {
      const payload = normalizeReservaPayload(data, true);
      const response = await axiosInstance.post('/reservas/', payload, withOfflineSupport({}));
      const offlinePending = response.offlineOperation || response.data?.offlineOperation;
      let created = response.data?.data || response.data;
      if (offlinePending) {
        created = { id: `tmp-${Date.now()}`, estado: 'pendiente', ...payload };
      }
      setReservas(prev => { const next = [...prev, created]; cacheSet(next); return next; });
      return { success: true, data: created, offlinePending };
    } catch (err) {
      const msg = readDrfError(err) || 'Error al crear reserva'; setError(msg); return { success: false, error: msg };
    } finally { setSaving(false); }
  };

  const updateReserva = async (id, data) => {
    setSaving(true); setError(null);
    try {
      const payload = normalizeReservaPayload(data, false);
      const response = await axiosInstance.patch(`/reservas/${id}/`, payload, withOfflineSupport({}));
      const offlinePending = response.offlineOperation || response.data?.offlineOperation;
      let updated = response.data?.data || response.data;
      if (offlinePending) updated = { id, ...payload };
      setReservas(prev => { const next = prev.map(r => r.id === id ? { ...r, ...updated } : r); cacheSet(next); return next; });
      return { success: true, data: updated, offlinePending };
    } catch (err) {
      const msg = readDrfError(err) || 'Error al actualizar reserva'; setError(msg); return { success: false, error: msg };
    } finally { setSaving(false); }
  };

  const confirmReserva = async (id) => {
    setSaving(true); setError(null);
    try {
      const response = await axiosInstance.patch(`/reservas/${id}/confirm/`, {}, withOfflineSupport({}));
      const offlinePending = response.offlineOperation || response.data?.offlineOperation;
      setReservas(prev => { const next = prev.map(r => r.id === id ? { ...r, estado: offlinePending ? 'confirmada' : (response.data.estado || 'confirmada') } : r); cacheSet(next); return next; });
      return { success: true, data: response.data, offlinePending };
    } catch (err) {
      const msg = readDrfError(err) || 'Error al confirmar reserva'; setError(msg); return { success: false, error: msg };
    } finally { setSaving(false); }
  };

  const cancelReserva = async (id) => {
    setSaving(true); setError(null);
    try {
      const response = await axiosInstance.patch(`/reservas/${id}/cancelar/`, {}, withOfflineSupport({}));
      const offlinePending = response.offlineOperation || response.data?.offlineOperation;
      setReservas(prev => { const next = prev.map(r => r.id === id ? { ...r, estado: 'cancelada' } : r); cacheSet(next); return next; });
      return { success: true, data: response.data, offlinePending };
    } catch (err) {
      const msg = readDrfError(err) || 'Error al cancelar reserva'; setError(msg); return { success: false, error: msg };
    } finally { setSaving(false); }
  };

  useEffect(() => { fetchReservas(); }, []);

  return { reservas, loading, error, saving, fetchReservas, createReserva, updateReserva, confirmReserva, cancelReserva };
};

function normalizeReservaPayload(data, isCreate) {
  const payload = { ...data };
  // no enviar campos de solo lectura
  delete payload.propietario; delete payload.estado; delete payload.qr_anfitrion; delete payload.qr_invitados;
  // backend calcula costo_total; no enviarlo
  delete payload.costo_total;
  // invitados: asegurarse que sea array de objetos simple
  if (payload.invitados && !Array.isArray(payload.invitados)) {
    payload.invitados = [];
  }
  // fechas/horas se asumen correctas (frontend valida)
  if (isCreate) {
    // requeridos: area, fecha_reserva, hora_inicio, hora_fin, num_personas, costo_total
  }
  return payload;
}

function readDrfError(err) {
  const d = err?.response?.data; if (!d) return err?.message;
  if (typeof d === 'string') return d;
  if (d.detail) return d.detail;
  if (Array.isArray(d.non_field_errors) && d.non_field_errors.length) return d.non_field_errors[0];
  for (const k in d) { const v = d[k]; if (Array.isArray(v) && v.length) return `${k}: ${v[0]}`; if (typeof v === 'string') return `${k}: ${v}`; }
  return undefined;
}

export default useReservas;