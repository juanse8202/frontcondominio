import React, { useState } from 'react';
import usePagedList from '../../hooks/usePagedList.jsx';
import axiosInstance from '../../api/axiosConfig.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';
import Table from '../../components/common/Table.jsx';
import Button from '../../components/common/Button.jsx';
import Input from '../../components/common/Input.jsx';
import Select from '../../components/common/Select.jsx';
import Modal from '../../components/common/Modal.jsx';
import Badge from '../../components/common/Badge.jsx';
import { CalendarCheck, RefreshCw, Filter, Eye, Check, X, Users, Plus, QrCode } from 'lucide-react';

// Refactor Administrativo Reservas según ADMIN_RESERVAS_VISITAS.md
// Estados: pendiente, confirmada, rechazada, cancelada

const estadoVariant = (estado) => {
  if (!estado) return 'info';
  switch (estado.toLowerCase()) {
    case 'pendiente': return 'warning';
    case 'confirmada': return 'success';
    case 'rechazada': return 'error';
    case 'cancelada': return 'error';
    default: return 'info';
  }
};

const ReservasPage = () => {
  const { items, loading, error, page, setPage, count, setFilter, filters, refresh, updateItem, addItem } = usePagedList({
    endpoint: '/reservas/',
    pageSize: 20,
    initialFilters: { estado: '', area: '', fecha: '' }
  });

  // UI State
  const [showFilters, setShowFilters] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState(null);
  const [detalle, setDetalle] = useState(null);
  const [loadingDetalle, setLoadingDetalle] = useState(false);
  const [actionId, setActionId] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [editingInvitados, setEditingInvitados] = useState(false);
  const [savingInvitados, setSavingInvitados] = useState(false);

  // Form Create
  const [formData, setFormData] = useState({
    propietario: '',
    area: '',
    fecha_reserva: '',
    hora_inicio: '',
    hora_fin: '',
    num_personas: '',
    observaciones: '',
    invitadosRaw: '' // línea por invitado: Nombre|Documento
  });

  const parseInvitados = () => {
    if (!formData.invitadosRaw.trim()) return [];
    return formData.invitadosRaw.split('\n').map(l => {
      const [nombre, documento] = l.split('|').map(s => s?.trim());
      if (!nombre) return null; return { nombre, documento: documento || '' };
    }).filter(Boolean);
  };

  const buildInvitadosList = (arr) => arr.map(i => `${i.nombre}${i.documento ? ' | ' + i.documento : ''}`).join('\n');

  const openDetalle = async (reserva, editInv = false) => {
    setSelected(reserva);
    setDetalle(null);
    setLoadingDetalle(true);
    setFeedback(null);
    setEditingInvitados(false);
    try {
      const resp = await axiosInstance.get(`/reservas/${reserva.id}/`);
      setDetalle(resp.data);
      if (editInv) setEditingInvitados(true);
    } catch (err) {
      setDetalle(reserva);
      setFeedback({ type: 'error', message: 'No se pudo cargar detalle completo.' });
    } finally { setLoadingDetalle(false); }
  };

  const validarHoras = () => {
    if (!formData.hora_inicio || !formData.hora_fin) return 'Horas requeridas';
    if (formData.hora_inicio >= formData.hora_fin) return 'La hora de inicio debe ser menor que la de fin';
    return null;
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true); setFeedback(null);
    try {
      const horaErr = validarHoras();
      if (horaErr) throw new Error(horaErr);
      const invitados = parseInvitados();
      const payload = {
        propietario: Number(formData.propietario),
        area: Number(formData.area),
        fecha_reserva: formData.fecha_reserva,
        hora_inicio: formData.hora_inicio,
        hora_fin: formData.hora_fin,
        num_personas: formData.num_personas ? Number(formData.num_personas) : 0,
        invitados,
        observaciones: formData.observaciones || undefined
      };
      const resp = await axiosInstance.post('/reservas/', payload);
      addItem(resp.data);
      setFeedback({ type: 'success', message: 'Reserva creada (pendiente)' });
      setFormData({ propietario: '', area: '', fecha_reserva: '', hora_inicio: '', hora_fin: '', num_personas: '', observaciones: '', invitadosRaw: '' });
      setTimeout(() => { setShowCreate(false); setFeedback(null); }, 1200);
    } catch (err) {
      setFeedback({ type: 'error', message: err.response?.data?.detail || err.message || 'Error al crear' });
    } finally { setCreating(false); }
  };

  const patchReserva = async (id, data, msgOk) => {
    setActionId(id); setFeedback(null);
    try {
      const resp = await axiosInstance.patch(`/reservas/${id}/`, data);
      updateItem(id, resp.data);
      if (selected?.id === id) setDetalle(resp.data);
      setFeedback({ type: 'success', message: msgOk });
    } catch (err) {
      setFeedback({ type: 'error', message: err.response?.data?.detail || 'Error' });
    } finally { setActionId(null); }
  };

  const confirmarReserva = async (reserva) => {
    setActionId(reserva.id); setFeedback(null);
    try {
      // Endpoint específico confirm
      await axiosInstance.patch(`/reservas/${reserva.id}/confirm/`);
      // Refrescar detalle
      const det = await axiosInstance.get(`/reservas/${reserva.id}/`);
      updateItem(reserva.id, det.data);
      setDetalle(det.data);
      setFeedback({ type: 'success', message: 'Reserva confirmada' });
    } catch (err) {
      setFeedback({ type: 'error', message: err.response?.data?.detail || 'Error al confirmar' });
    } finally { setActionId(null); }
  };

  const cancelarReserva = async (reserva) => {
    setActionId(reserva.id); setFeedback(null);
    try {
      await axiosInstance.patch(`/reservas/${reserva.id}/cancelar/`);
      const det = await axiosInstance.get(`/reservas/${reserva.id}/`);
      updateItem(reserva.id, det.data);
      setDetalle(det.data);
      setFeedback({ type: 'success', message: 'Reserva cancelada' });
    } catch (err) {
      setFeedback({ type: 'error', message: err.response?.data?.detail || 'Error al cancelar' });
    } finally { setActionId(null); }
  };

  // Guardar invitados/observaciones antes de confirmar
  const guardarInvitados = async (e) => {
    e.preventDefault();
    if (!detalle) return;
    setSavingInvitados(true); setFeedback(null);
    try {
      const payload = {
        invitados: detalle.invitados || [],
        observaciones: detalle.observaciones || ''
      };
      const resp = await axiosInstance.patch(`/reservas/${detalle.id}/`, payload);
      setDetalle(resp.data); updateItem(detalle.id, resp.data);
      setFeedback({ type: 'success', message: 'Invitados actualizados' });
      setEditingInvitados(false);
    } catch (err) {
      setFeedback({ type: 'error', message: err.response?.data?.detail || 'Error al actualizar invitados' });
    } finally { setSavingInvitados(false); }
  };

  const addInvitado = () => {
    setDetalle(d => ({ ...d, invitados: [...(d.invitados || []), { nombre: '', documento: '' }] }));
  };

  const updateInvitado = (idx, field, value) => {
    setDetalle(d => ({ ...d, invitados: d.invitados.map((inv, i) => i === idx ? { ...inv, [field]: value } : inv) }));
  };

  const removeInvitado = (idx) => {
    setDetalle(d => ({ ...d, invitados: d.invitados.filter((_, i) => i !== idx) }));
  };

  // Columnas
  const columns = [
    { key: 'id', header: 'ID', render: v => <span className="text-xs text-white/60">{v}</span> },
    { key: 'propietario_nombre', header: 'Propietario', render: v => v || '—' },
    { key: 'area', header: 'Área', render: (_, r) => r.area_nombre || r.area || '—' },
    { key: 'fecha_reserva', header: 'Fecha', render: v => v || '—' },
    { key: 'hora_inicio', header: 'Inicio', render: v => v || '—' },
    { key: 'hora_fin', header: 'Fin', render: v => v || '—' },
    { key: 'estado', header: 'Estado', render: v => <Badge variant={estadoVariant(v)}>{v}</Badge> },
    { key: 'costo_total', header: 'Costo', render: v => v ? `$${Number(v).toFixed(2)}` : '—' },
    { key: 'actions', header: 'Acciones', className: 'text-right', cellClassName: 'text-right', render: (_, row) => (
      <div className="flex justify-end gap-2">
        <Button variant="secondary" size="xs" icon={Eye} onClick={() => openDetalle(row)} />
        {row.estado === 'pendiente' && (
          <Button variant="secondary" size="xs" icon={Check} disabled={actionId === row.id} onClick={() => confirmarReserva(row)}>{actionId === row.id ? '...' : 'Confirmar'}</Button>
        )}
        {['pendiente','confirmada'].includes(row.estado) && (
          <Button variant="secondary" size="xs" icon={X} disabled={actionId === row.id} onClick={() => cancelarReserva(row)}>{actionId === row.id ? '...' : 'Cancelar'}</Button>
        )}
      </div>
    ) }
  ];

  const headerActions = (
    <div className="flex gap-2 flex-wrap">
      <Button variant="primary" icon={Plus} onClick={() => { setShowCreate(true); setFeedback(null); }}>Nueva</Button>
      <Button variant="secondary" icon={Filter} onClick={() => setShowFilters(v => !v)}>Filtros</Button>
      <Button variant="secondary" icon={RefreshCw} onClick={refresh}>Refrescar</Button>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in ">
      <PageHeader
        title="Reservas"
        description="Gestión administrativa de reservas de áreas comunes"
        icon={CalendarCheck}
        actions={headerActions}
      />

      {showFilters && (
        <div className="card-minimal p-4 space-y-4 animate-slide-down">
          <div className="grid md:grid-cols-6 gap-4">
            <Select
              label="Estado"
              value={filters.estado}
              onChange={(e) => setFilter('estado', e.target.value)}
              options={[
                { value: '', label: 'Todos' },
                { value: 'pendiente', label: 'Pendiente' },
                { value: 'confirmada', label: 'Confirmada' },
                { value: 'rechazada', label: 'Rechazada' },
                { value: 'cancelada', label: 'Cancelada' }
              ]}
            />
            <Input
              label="Área ID"
              value={filters.area || ''}
              onChange={(e) => setFilter('area', e.target.value)}
              placeholder="ID"
            />
            <Input
              label="Fecha"
              type="date"
              value={filters.fecha || ''}
              onChange={(e) => setFilter('fecha', e.target.value)}
            />
          </div>
        </div>
      )}

      {feedback && !selected && !showCreate && (
        <div className={feedback.type === 'success' ? 'alert-success' : 'alert-error'}>{feedback.message}</div>
      )}
      {error && <div className="alert-error">{error}</div>}

      <Table
        columns={columns}
        data={items}
        loading={loading}
        emptyMessage="No hay reservas registradas"
      />

      {count > 20 && (
        <div className="flex justify-end gap-2 items-center text-white/60 text-sm">
          <Button variant="secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>Anterior</Button>
          <span>Página {page}</span>
          <Button variant="secondary" disabled={(page * 20) >= count} onClick={() => setPage(page + 1)}>Siguiente</Button>
        </div>
      )}

      {/* Crear Reserva */}
      <Modal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        title="Nueva Reserva"
        size="lg"
      >
        <form onSubmit={handleCreate} className="space-y-5">
          {feedback && showCreate && (
            <div className={feedback.type === 'success' ? 'alert-success' : 'alert-error'}>{feedback.message}</div>
          )}
          <div className="grid md:grid-cols-4 gap-4">
            <Input label="Propietario ID" value={formData.propietario} onChange={(e) => setFormData(d => ({ ...d, propietario: e.target.value }))} required />
            <Input label="Área ID" value={formData.area} onChange={(e) => setFormData(d => ({ ...d, area: e.target.value }))} required />
            <Input label="Fecha" type="date" value={formData.fecha_reserva} onChange={(e) => setFormData(d => ({ ...d, fecha_reserva: e.target.value }))} required />
            <Input label="Personas" type="number" min={1} value={formData.num_personas} onChange={(e) => setFormData(d => ({ ...d, num_personas: e.target.value }))} required />
            <Input label="Hora Inicio" type="time" value={formData.hora_inicio} onChange={(e) => setFormData(d => ({ ...d, hora_inicio: e.target.value }))} required />
            <Input label="Hora Fin" type="time" value={formData.hora_fin} onChange={(e) => setFormData(d => ({ ...d, hora_fin: e.target.value }))} required />
            <div className="md:col-span-4 flex flex-col">
              <label className="block text-white/60 text-sm mb-1">Observaciones</label>
              <textarea
                value={formData.observaciones}
                onChange={(e) => setFormData(d => ({ ...d, observaciones: e.target.value }))}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 min-h-[70px]"
                placeholder="Notas administrativas"
              />
            </div>
            <div className="md:col-span-4 flex flex-col">
              <label className="block text-white/60 text-sm mb-1">Invitados (uno por línea: Nombre|Documento)</label>
              <textarea
                value={formData.invitadosRaw}
                onChange={(e) => setFormData(d => ({ ...d, invitadosRaw: e.target.value }))}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 min-h-[90px] font-mono"
                placeholder="Juan Perez|12345678\nAna Rios|87654321"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setShowCreate(false)} disabled={creating}>Cancelar</Button>
            <Button type="submit" loading={creating}>Crear</Button>
          </div>
          <p className="text-xs text-white/40">No envíes costo_total / QR – se generan al confirmar.</p>
        </form>
      </Modal>

      {/* Detalle Reserva */}
      <Modal
        isOpen={!!selected}
        onClose={() => { setSelected(null); setDetalle(null); setFeedback(null); setEditingInvitados(false); }}
        title={selected ? `Reserva #${selected.id}` : ''}
        size="xl"
      >
        {loadingDetalle && <div className="py-8 text-center text-white/70">Cargando detalles...</div>}
        {feedback && selected && (
          <div className={feedback.type === 'success' ? 'alert-success' : 'alert-error'}>{feedback.message}</div>
        )}
        {detalle && (
          <div className="space-y-6 text-sm text-white/80">
            <div className="grid md:grid-cols-4 gap-4">
              <div><label className="block text-white/50 mb-1">Propietario</label><p>{detalle.propietario_nombre || detalle.propietario || '—'}</p></div>
              <div><label className="block text-white/50 mb-1">Área</label><p>{detalle.area_nombre || detalle.area || '—'}</p></div>
              <div><label className="block text-white/50 mb-1">Fecha</label><p>{detalle.fecha_reserva}</p></div>
              <div><label className="block text-white/50 mb-1">Horario</label><p>{detalle.hora_inicio} - {detalle.hora_fin}</p></div>
              <div><label className="block text-white/50 mb-1">Personas</label><p>{detalle.num_personas}</p></div>
              <div><label className="block text-white/50 mb-1">Estado</label><p><Badge variant={estadoVariant(detalle.estado)}>{detalle.estado}</Badge></p></div>
              <div><label className="block text-white/50 mb-1">Costo</label><p>{detalle.costo_total ? `$${Number(detalle.costo_total).toFixed(2)}` : '—'}</p></div>
              {detalle.observaciones && (
                <div className="md:col-span-4"><label className="block text-white/50 mb-1">Observaciones</label><p>{detalle.observaciones}</p></div>
              )}
              {detalle.qr_anfitrion && (
                <div className="md:col-span-4">
                  <label className="block text-white/50 mb-1">QR Anfitrión</label>
                  <div className="flex items-center gap-3 bg-white/5 border border-white/10 p-3 rounded">
                    <QrCode className="w-6 h-6" />
                    <p className="font-mono text-[11px] break-all">{detalle.qr_anfitrion}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Invitados */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-white font-medium text-sm flex items-center gap-2"><Users className="w-4 h-4" /> Invitados</h4>
                {detalle.estado === 'pendiente' && !editingInvitados && (
                  <Button variant="secondary" size="xs" onClick={() => setEditingInvitados(true)}>Editar Invitados</Button>
                )}
              </div>
              {!editingInvitados && (
                <div className="overflow-x-auto">
                  <table className="table-minimal text-xs">
                    <thead><tr><th>Nombre</th><th>Documento</th></tr></thead>
                    <tbody>
                      {(detalle.invitados || []).length === 0 && (
                        <tr><td colSpan={2} className="text-white/40">Sin invitados</td></tr>
                      )}
                      {(detalle.invitados || []).map((inv,i) => (
                        <tr key={i}><td>{inv.nombre || '—'}</td><td>{inv.documento || '—'}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {editingInvitados && detalle.estado === 'pendiente' && (
                <form onSubmit={guardarInvitados} className="space-y-4">
                  <div className="space-y-3">
                    {(detalle.invitados || []).map((inv, i) => (
                      <div key={i} className="grid md:grid-cols-5 gap-2 items-center">
                        <input
                          className="md:col-span-2 bg-white/10 border border-white/20 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                          placeholder="Nombre"
                          value={inv.nombre}
                          onChange={(e) => updateInvitado(i, 'nombre', e.target.value)}
                        />
                        <input
                          className="md:col-span-2 bg-white/10 border border-white/20 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                          placeholder="Documento"
                          value={inv.documento}
                          onChange={(e) => updateInvitado(i, 'documento', e.target.value)}
                        />
                        <Button type="button" variant="secondary" size="xs" onClick={() => removeInvitado(i)}>Quitar</Button>
                      </div>
                    ))}
                    <Button type="button" variant="secondary" size="xs" onClick={addInvitado}>Agregar Invitado</Button>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="secondary" onClick={() => { setEditingInvitados(false); }}>Cancelar</Button>
                    <Button type="submit" loading={savingInvitados}>Guardar</Button>
                  </div>
                </form>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              {detalle.estado === 'pendiente' && !editingInvitados && (
                <Button variant="secondary" icon={Check} disabled={actionId === detalle.id} onClick={() => confirmarReserva(detalle)}>{actionId === detalle.id ? '...' : 'Confirmar'}</Button>
              )}
              {['pendiente','confirmada'].includes(detalle.estado) && !editingInvitados && (
                <Button variant="secondary" icon={X} disabled={actionId === detalle.id} onClick={() => cancelarReserva(detalle)}>{actionId === detalle.id ? '...' : 'Cancelar'}</Button>
              )}
              <Button variant="secondary" onClick={() => { setSelected(null); setDetalle(null); setEditingInvitados(false); }}>Cerrar</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ReservasPage;