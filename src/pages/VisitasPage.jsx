import React, { useState } from 'react';
import usePagedList from '../hooks/usePagedList';
import axiosInstance from '../api/axiosConfig';
import PageHeader from '../components/common/PageHeader';
import Table from '../components/common/Table';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Modal from '../components/common/Modal';
import Badge from '../components/common/Badge';
import { UsersRound, RefreshCw, Filter, Plus, Eye, QrCode, Calendar, AlertCircle, X, Pencil, Check } from 'lucide-react';

// Refactor Administrativo Visitas
// Acciones requeridas: crear visita, editar campos menores mientras está activa, desactivar (activa=false), ver QR.
// Evitamos cualquier lógica de flujo "propietario" y mantenemos sólo perspectiva admin.

const VisitasPage = () => {
  const { items, loading, error, page, setPage, count, setFilter, filters, refresh, addItem, updateItem } = usePagedList({
    endpoint: '/visitas/',
    pageSize: 20,
    initialFilters: { search: '', fecha_visita: '', propietario: '', activa: '' }
  });

  const [showFilters, setShowFilters] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [selected, setSelected] = useState(null);
  const [detalle, setDetalle] = useState(null);
  const [loadingDetalle, setLoadingDetalle] = useState(false);
  const [formData, setFormData] = useState({ propietario: '', nombre_visitante: '', documento_visitante: '', telefono_visitante: '', fecha_visita: '', hora_entrada_esperada: '', observaciones: '' });
  const [actionId, setActionId] = useState(null);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState(null);

  const openDetalle = async (visita) => {
    setSelected(visita);
    setDetalle(null);
    setLoadingDetalle(true);
    setFeedback(null);
    setEditing(false);
    try {
      const resp = await axiosInstance.get(`/visitas/${visita.id}/`);
      setDetalle(resp.data);
      setEditData({
        nombre_visitante: resp.data.nombre_visitante || '',
        documento_visitante: resp.data.documento_visitante || '',
        telefono_visitante: resp.data.telefono_visitante || '',
        hora_entrada_esperada: resp.data.hora_entrada_esperada || '',
        observaciones: resp.data.observaciones || ''
      });
    } catch (err) {
      setDetalle(visita);
      setFeedback({ type: 'error', message: 'No se pudo cargar detalle ampliado (mostrando básico).' });
    } finally { setLoadingDetalle(false); }
  };

  const deactivateVisita = async (visita) => {
    setActionId(visita.id); setFeedback(null);
    try {
      const resp = await axiosInstance.patch(`/visitas/${visita.id}/`, { activa: false });
      updateItem(visita.id, resp.data);
      if (selected?.id === visita.id) setDetalle(resp.data);
      setFeedback({ type: 'success', message: 'Visita desactivada' });
    } catch (err) {
      setFeedback({ type: 'error', message: err.response?.data?.detail || 'Error al desactivar' });
    } finally { setActionId(null); }
  };

  const saveEdits = async (e) => {
    e.preventDefault();
    if (!detalle) return;
    setActionId(detalle.id); setFeedback(null);
    try {
      const payload = {
        nombre_visitante: editData.nombre_visitante.trim(),
        documento_visitante: editData.documento_visitante.trim(),
        telefono_visitante: editData.telefono_visitante.trim() || null,
        hora_entrada_esperada: editData.hora_entrada_esperada || null,
        observaciones: editData.observaciones || ''
      };
      const resp = await axiosInstance.patch(`/visitas/${detalle.id}/`, payload);
      updateItem(detalle.id, resp.data);
      setDetalle(resp.data);
      setEditing(false);
      setFeedback({ type: 'success', message: 'Cambios guardados' });
    } catch (err) {
      setFeedback({ type: 'error', message: err.response?.data?.detail || 'Error al guardar cambios' });
    } finally { setActionId(null); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true); setFeedback(null);
    try {
      const payload = {
        propietario: formData.propietario ? Number(formData.propietario) : null,
        nombre_visitante: formData.nombre_visitante.trim(),
        documento_visitante: formData.documento_visitante.trim(),
        telefono_visitante: formData.telefono_visitante.trim() || null,
        fecha_visita: formData.fecha_visita || null,
        hora_entrada_esperada: formData.hora_entrada_esperada || null,
        observaciones: formData.observaciones.trim() || ''
      };
      const resp = await axiosInstance.post('/visitas/', payload);
      addItem(resp.data);
      setFeedback({ type: 'success', message: 'Visita creada' });
      setFormData({ propietario: '', nombre_visitante: '', documento_visitante: '', telefono_visitante: '', fecha_visita: '', hora_entrada_esperada: '', observaciones: '' });
      setTimeout(() => { setShowForm(false); setFeedback(null); }, 800);
    } catch (err) {
      setFeedback({ type: 'error', message: err.response?.data?.detail || 'Error al crear visita' });
    } finally { setSaving(false); }
  };

  const columns = [
    { key: 'id', header: 'ID', render: (v) => <span className="text-xs text-white/60">{v}</span> },
    { key: 'propietario_nombre', header: 'Propietario', render: (v, row) => v || row.propietario || '—' },
    { key: 'nombre_visitante', header: 'Visitante', render: (v) => v || '—' },
    { key: 'documento_visitante', header: 'Documento', render: (v, row) => v || row.documento || '—' },
    { key: 'fecha_visita', header: 'Fecha', render: (v) => v || '—' },
    { key: 'hora_entrada_esperada', header: 'Hora', render: (v) => v || '—' },
    { key: 'qr_code', header: 'QR', render: (v, row) => v ? <Button variant="secondary" size="xs" onClick={() => openDetalle(row)}>Ver</Button> : <span className="text-white/30 text-xs">No</span> },
    { key: 'activa', header: 'Activa', render: (v) => v ? <Badge variant="success">Sí</Badge> : <Badge variant="error">No</Badge> },
    { key: 'actions', header: 'Acciones', className: 'text-right', cellClassName: 'text-right', render: (_, row) => (
      <div className="flex justify-end gap-2">
        <Button variant="secondary" size="xs" icon={Eye} onClick={() => openDetalle(row)} title="Ver detalles" />
        {row.activa && (
          <Button
            variant="secondary"
            size="xs"
            icon={X}
            disabled={actionId === row.id}
            onClick={() => deactivateVisita(row)}
            title="Desactivar"
          >
            {actionId === row.id ? '...' : 'Off'}
          </Button>
        )}
      </div>
    ) }
  ];

  const headerActions = (
    <div className="flex gap-2 flex-wrap">
      <Button variant="primary" icon={Plus} onClick={() => { setShowForm(true); setFeedback(null); }}>Nueva</Button>
      <Button variant="secondary" icon={Filter} onClick={() => setShowFilters(v => !v)}>Filtros</Button>
      <Button variant="secondary" icon={RefreshCw} onClick={refresh}>Refrescar</Button>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in ">
      <PageHeader
        title="Visitas"
        description="Registro y control de visitas"
        icon={UsersRound}
        actions={headerActions}
      />

      {showFilters && (
        <div className="card-minimal p-4 space-y-4 animate-slide-down">
          <div className="grid md:grid-cols-6 gap-4">
            <Input
              label="Buscar (visitante/doc)"
              value={filters.search || ''}
              onChange={(e) => setFilter('search', e.target.value)}
              placeholder="Buscar..."
            />
            <Input
              label="Fecha"
              type="date"
              value={filters.fecha_visita || ''}
              onChange={(e) => setFilter('fecha_visita', e.target.value)}
            />
            <Input
              label="Propietario ID"
              value={filters.propietario || ''}
              onChange={(e) => setFilter('propietario', e.target.value)}
              placeholder="ID"
            />
            {/* Unidad eliminada de filtros */}
            <select
              className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={filters.activa}
              onChange={(e) => setFilter('activa', e.target.value)}
            >
              <option value="">Activa (Todas)</option>
              <option value="true">Activas</option>
              <option value="false">Inactivas</option>
            </select>
          </div>
        </div>
      )}

      {feedback && !showForm && !selected && (
        <div className={feedback.type === 'success' ? 'alert-success' : 'alert-error'}>{feedback.message}</div>
      )}
      {error && <div className="alert-error">{error}</div>}

      <Table
        columns={columns}
        data={items}
        loading={loading}
        emptyMessage="No hay visitas registradas"
      />

      {count > 20 && (
        <div className="flex justify-end gap-2 items-center text-white/60 text-sm">
          <Button variant="secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>Anterior</Button>
          <span>Página {page}</span>
          <Button variant="secondary" disabled={(page * 20) >= count} onClick={() => setPage(page + 1)}>Siguiente</Button>
        </div>
      )}

      {/* Modal Crear Visita */}
      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title="Nueva Visita"
        size="md"
      >
        <form onSubmit={handleCreate} className="space-y-5">
          {feedback && showForm && (
            <div className={feedback.type === 'success' ? 'alert-success' : 'alert-error'}>{feedback.message}</div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Input
                label="Propietario ID"
                value={formData.propietario}
                onChange={(e) => setFormData(d => ({ ...d, propietario: e.target.value }))}
                placeholder="ID"
                required
              />
            </div>
            {/* Campo Unidad eliminado del formulario de creación */}
            <div className="col-span-2">
              <Input
                label="Nombre Visitante"
                value={formData.nombre_visitante}
                onChange={(e) => setFormData(d => ({ ...d, nombre_visitante: e.target.value }))}
                placeholder="Nombre completo"
                required
              />
            </div>
            <div>
              <Input
                label="Documento"
                value={formData.documento_visitante}
                onChange={(e) => setFormData(d => ({ ...d, documento_visitante: e.target.value }))}
                placeholder="Documento"
                required
              />
            </div>
            <div>
              <Input
                label="Teléfono"
                value={formData.telefono_visitante}
                onChange={(e) => setFormData(d => ({ ...d, telefono_visitante: e.target.value }))}
                placeholder="Teléfono"
              />
            </div>
            <div>
              <Input
                label="Fecha Visita"
                type="date"
                value={formData.fecha_visita}
                onChange={(e) => setFormData(d => ({ ...d, fecha_visita: e.target.value }))}
                required
              />
            </div>
            <div>
              <Input
                label="Hora Esperada"
                type="time"
                value={formData.hora_entrada_esperada}
                onChange={(e) => setFormData(d => ({ ...d, hora_entrada_esperada: e.target.value }))}
                required
              />
            </div>
            <div className="col-span-2">
              <label className="block text-white/60 text-sm mb-1">Observaciones</label>
              <textarea
                value={formData.observaciones}
                onChange={(e) => setFormData(d => ({ ...d, observaciones: e.target.value }))}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 min-h-[90px]"
                placeholder="Detalles adicionales"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setShowForm(false)} disabled={saving}>Cancelar</Button>
            <Button type="submit" loading={saving}>Crear</Button>
          </div>
        </form>
      </Modal>

      {/* Modal Detalle */}
      <Modal
        isOpen={!!selected}
        onClose={() => { setSelected(null); setDetalle(null); setFeedback(null); setEditing(false); setEditData(null); }}
        title={selected ? `Visita #${selected.id}` : ''}
        size="lg"
      >
        {loadingDetalle && <div className="py-8 text-center text-white/70">Cargando detalles...</div>}
        {feedback && selected && (
          <div className={feedback.type === 'success' ? 'alert-success' : 'alert-error'}>{feedback.message}</div>
        )}
        {detalle && (
          <div className="space-y-5 text-sm text-white/80">
            <div className="flex justify-between items-start gap-4">
              <div className="grid grid-cols-2 gap-4 flex-1">
                <div>
                  <label className="block text-white/50 mb-1">Propietario</label>
                  <p>{detalle.propietario_nombre || '—'}</p>
                </div>
                {/* Unidad eliminada del detalle */}
                {!editing && <>
                  <div>
                    <label className="block text-white/50 mb-1">Visitante</label>
                    <p>{detalle.nombre_visitante || '—'}</p>
                  </div>
                  <div>
                    <label className="block text-white/50 mb-1">Documento</label>
                    <p>{detalle.documento_visitante || '—'}</p>
                  </div>
                  <div>
                    <label className="block text-white/50 mb-1">Teléfono</label>
                    <p>{detalle.telefono_visitante || '—'}</p>
                  </div>
                  <div>
                    <label className="block text-white/50 mb-1">Fecha / Hora</label>
                    <p className="flex items-center gap-2"><Calendar className="w-4 h-4" /> {detalle.fecha_visita || '—'} {detalle.hora_entrada_esperada || ''}</p>
                  </div>
                </>}
                {editing && (
                  <form onSubmit={saveEdits} className="col-span-2 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <Input label="Visitante" value={editData.nombre_visitante} onChange={(e) => setEditData(d => ({ ...d, nombre_visitante: e.target.value }))} required />
                      <Input label="Documento" value={editData.documento_visitante} onChange={(e) => setEditData(d => ({ ...d, documento_visitante: e.target.value }))} required />
                      <Input label="Teléfono" value={editData.telefono_visitante} onChange={(e) => setEditData(d => ({ ...d, telefono_visitante: e.target.value }))} />
                      <Input label="Hora Esperada" type="time" value={editData.hora_entrada_esperada} onChange={(e) => setEditData(d => ({ ...d, hora_entrada_esperada: e.target.value }))} />
                      <div className="col-span-2 flex flex-col">
                        <label className="block text-white/50 text-xs mb-1">Observaciones</label>
                        <textarea
                          className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-400 min-h-[60px]"
                          value={editData.observaciones}
                          onChange={(e) => setEditData(d => ({ ...d, observaciones: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="secondary" onClick={() => { setEditing(false); setEditData({
                        nombre_visitante: detalle.nombre_visitante || '',
                        documento_visitante: detalle.documento_visitante || '',
                        telefono_visitante: detalle.telefono_visitante || '',
                        hora_entrada_esperada: detalle.hora_entrada_esperada || '',
                        observaciones: detalle.observaciones || ''
                      }); }}>Cancelar</Button>
                      <Button type="submit" loading={actionId === detalle.id} icon={Check}>Guardar</Button>
                    </div>
                  </form>
                )}
                <div>
                  <label className="block text-white/50 mb-1">Activa</label>
                  <p>{detalle.activa ? <Badge variant="success">Sí</Badge> : <Badge variant="error">No</Badge>}</p>
                </div>
                {detalle.observaciones && !editing && (
                  <div className="col-span-2">
                    <label className="block text-white/50 mb-1">Observaciones</label>
                    <p>{detalle.observaciones}</p>
                  </div>
                )}
              </div>
              {detalle.qr_code && (
                <div className="w-48 flex flex-col items-center gap-3">
                  <label className="block text-white/50 mb-1">QR</label>
                  <div className="p-3 bg-white rounded-lg border border-white/20 w-full flex flex-col items-center gap-2">
                    <QrCode className="w-7 h-7 text-black" />
                    <p className="text-[10px] text-black/70 font-mono break-all w-full text-center max-h-24 overflow-auto">{detalle.qr_code}</p>
                  </div>
                </div>
              )}
            </div>
            {!detalle.qr_code && (
              <div className="alert-error flex items-center gap-2 text-xs"><AlertCircle className="w-4 h-4" /> No hay QR asociado.</div>
            )}
            <div className="flex justify-end gap-2 pt-2">
              {detalle.activa && !editing && (
                <Button variant="secondary" size="sm" icon={Pencil} onClick={() => setEditing(true)}>Editar</Button>
              )}
              {detalle.activa && !editing && (
                <Button variant="secondary" size="sm" icon={X} disabled={actionId === detalle.id} onClick={() => deactivateVisita(detalle)}>
                  {actionId === detalle.id ? '...' : 'Desactivar'}
                </Button>
              )}
              <Button variant="secondary" onClick={() => { setSelected(null); setDetalle(null); setEditing(false); }}>Cerrar</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default VisitasPage;