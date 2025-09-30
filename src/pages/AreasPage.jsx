import React, { useState, useEffect } from 'react';
import usePagedList from '../hooks/usePagedList';
import axiosInstance from '../api/axiosConfig';
import PageHeader from '../components/common/PageHeader';
import Table from '../components/common/Table';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import Modal from '../components/common/Modal';
import Badge from '../components/common/Badge';
import { Layers, RefreshCw, Filter, Plus, Edit3 } from 'lucide-react';

// Refactor Administrativo Áreas según ADMIN_REPORTES_AREAS.md
// Campos: nombre, descripcion, capacidad, tarifa_hora, horario_apertura, horario_cierre, activa
// Validaciones front: capacidad >=1, apertura < cierre.

const emptyForm = { nombre: '', descripcion: '', capacidad: '', tarifa_hora: '', horario_apertura: '', horario_cierre: '', activa: true };

const AreasPage = () => {
  const { items, loading, error, page, setPage, count, setFilter, filters, refresh, updateItem, addItem } = usePagedList({
    endpoint: '/areas/',
    pageSize: 20,
    initialFilters: { search: '', activa: '' }
  });

  const [showFilters, setShowFilters] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [showDetail, setShowDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailData, setDetailData] = useState(null);

  useEffect(() => {
    if (!showForm) {
      setEditing(null);
      setFormData(emptyForm);
      setFeedback(null);
    }
  }, [showForm]);

  const openCreate = () => {
    setEditing(null);
    setFormData(emptyForm);
    setShowForm(true);
  };

  const openEdit = (area) => {
    setEditing(area);
    setFormData({
      nombre: area.nombre || '',
      descripcion: area.descripcion || '',
      capacidad: area.capacidad ?? '',
      tarifa_hora: area.tarifa_hora || '',
      horario_apertura: area.horario_apertura || '',
      horario_cierre: area.horario_cierre || '',
      activa: area.activa !== undefined ? area.activa : true
    });
    setShowForm(true);
  };

  const openDetail = async (area) => {
    setShowDetail(area.id);
    setDetailLoading(true);
    setDetailData(null);
    setFeedback(null);
    try {
      const resp = await axiosInstance.get(`/areas/${area.id}/`);
      setDetailData(resp.data);
    } catch (err) {
      setDetailData(area); // fallback
      setFeedback({ type: 'error', message: 'No se pudo cargar detalle completo.' });
    } finally { setDetailLoading(false); }
  };

  const validate = () => {
    if (!formData.nombre.trim()) return 'Nombre requerido';
    if (formData.capacidad !== '' && Number(formData.capacidad) < 1) return 'La capacidad debe ser al menos 1';
    if (formData.horario_apertura && formData.horario_cierre && formData.horario_apertura >= formData.horario_cierre)
      return 'El horario de apertura debe ser menor al de cierre';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true); setFeedback(null);
    try {
      const valErr = validate();
      if (valErr) throw new Error(valErr);
      const payload = {
        nombre: formData.nombre.trim(),
        descripcion: formData.descripcion.trim() || '',
        capacidad: formData.capacidad !== '' ? Number(formData.capacidad) : null,
        tarifa_hora: formData.tarifa_hora !== '' ? formData.tarifa_hora : null,
        horario_apertura: formData.horario_apertura || null,
        horario_cierre: formData.horario_cierre || null,
        activa: !!formData.activa
      };
      if (editing) {
        const resp = await axiosInstance.patch(`/areas/${editing.id}/`, payload);
        updateItem(editing.id, resp.data);
        setFeedback({ type: 'success', message: 'Área actualizada' });
      } else {
        const resp = await axiosInstance.post('/areas/', payload);
        addItem(resp.data);
        setFeedback({ type: 'success', message: 'Área creada' });
        // Limpiar formulario para crear otra rápidamente
        setFormData(emptyForm);
      }
      setTimeout(() => { setShowForm(false); setFeedback(null); }, 800);
    } catch (err) {
      setFeedback({ type: 'error', message: err.response?.data?.detail || err.message || 'Error al guardar' });
    } finally { setSaving(false); }
  };

  const toggleActivo = async (area) => {
    try {
      const resp = await axiosInstance.patch(`/areas/${area.id}/`, { activa: !area.activa });
      updateItem(area.id, resp.data);
    } catch (err) {
      setFeedback({ type: 'error', message: 'No se pudo cambiar estado' });
    }
  };
  const horarioDisplay = (row) => {
    if (!row.horario_apertura || !row.horario_cierre) return '—';
    return `${row.horario_apertura} - ${row.horario_cierre}`;
  };

  const columns = [
    { key: 'id', header: 'ID', render: (v) => <span className="text-xs text-white/60">{v}</span> },
    { key: 'nombre', header: 'Nombre', render: (v, row) => (
      <button onClick={() => openDetail(row)} className="text-left text-blue-300 hover:underline">
        {v || '—'}
      </button>) },
    { key: 'capacidad', header: 'Capacidad', render: (v) => v ?? '—' },
    { key: 'tarifa_hora', header: 'Tarifa/H', render: (v) => v ? `$${Number(v).toFixed(2)}` : '—' },
    { key: 'horario', header: 'Horario', render: (_, row) => horarioDisplay(row) },
    { key: 'activa', header: 'Estado', render: (v) => v ? <Badge variant="success">Activa</Badge> : <Badge variant="error">Inactiva</Badge> },
    { key: 'actions', header: 'Acciones', className: 'text-right', cellClassName: 'text-right', render: (_, row) => (
      <div className="flex justify-end gap-2">
        <Button variant="secondary" size="xs" icon={Edit3} onClick={() => openEdit(row)}>Editar</Button>
        <Button
          variant={row.activa ? 'secondary' : 'primary'}
          size="xs"
          onClick={() => toggleActivo(row)}
          title={row.activa ? 'Desactivar' : 'Activar'}
        >
          {row.activa ? 'Desactivar' : 'Activar'}
        </Button>
      </div>
    ) }
  ];

  const headerActions = (
    <div className="flex gap-2">
      <Button variant="primary" icon={Plus} onClick={openCreate}>Nueva Área</Button>
      <Button variant="secondary" icon={Filter} onClick={() => setShowFilters(v => !v)}>Filtros</Button>
      <Button variant="secondary" icon={RefreshCw} onClick={refresh}>Refrescar</Button>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in ">
      <PageHeader
        title="Áreas Comunes"
        description="Catálogo y disponibilidad de recursos"
        icon={Layers}
        actions={headerActions}
      />

      {showFilters && (
        <div className="card-minimal p-4 space-y-4 animate-slide-down">
          <div className="grid md:grid-cols-4 gap-4">
            <Input
              label="Buscar (nombre)"
              value={filters.search || ''}
              onChange={(e) => setFilter('search', e.target.value)}
              placeholder="Buscar..."
            />
            <select
              className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={filters.activa}
              onChange={(e) => setFilter('activa', e.target.value)}
            >
              <option value="">Estado (Todos)</option>
              <option value="true">Activas</option>
              <option value="false">Inactivas</option>
            </select>
          </div>
        </div>
      )}

      {error && <div className="alert-error">{error}</div>}
      {feedback && !showForm && (
        <div className={feedback.type === 'success' ? 'alert-success' : 'alert-error'}>{feedback.message}</div>
      )}

      <Table
        columns={columns}
        data={items}
        loading={loading}
        emptyMessage="No hay áreas registradas"
      />

      {count > 20 && (
        <div className="flex justify-end gap-2 items-center text-white/60 text-sm">
          <Button variant="secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>Anterior</Button>
          <span>Página {page}</span>
          <Button variant="secondary" disabled={(page * 20) >= count} onClick={() => setPage(page + 1)}>Siguiente</Button>
        </div>
      )}

      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title={editing ? `Editar Área: ${editing.nombre}` : 'Nueva Área'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          {feedback && showForm && (
            <div className={feedback.type === 'success' ? 'alert-success' : 'alert-error'}>{feedback.message}</div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Input label="Nombre" value={formData.nombre} required onChange={(e) => setFormData(d => ({ ...d, nombre: e.target.value }))} placeholder="Ej: Piscina" />
            </div>
            <div className="col-span-2 flex flex-col">
              <label className="text-white/60 text-sm mb-1">Descripción</label>
              <textarea
                value={formData.descripcion}
                onChange={(e) => setFormData(d => ({ ...d, descripcion: e.target.value }))}
                className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 min-h-[80px]"
                placeholder="Condiciones, normas, notas..."
              />
            </div>
            <Input label="Capacidad" type="number" min={1} value={formData.capacidad} onChange={(e) => setFormData(d => ({ ...d, capacidad: e.target.value }))} placeholder="Ej: 50" />
            <Input label="Tarifa Hora" type="number" min={0} step="0.01" value={formData.tarifa_hora} onChange={(e) => setFormData(d => ({ ...d, tarifa_hora: e.target.value }))} placeholder="Ej: 45000" />
            <Input label="Apertura" type="time" value={formData.horario_apertura} onChange={(e) => setFormData(d => ({ ...d, horario_apertura: e.target.value }))} />
            <Input label="Cierre" type="time" value={formData.horario_cierre} onChange={(e) => setFormData(d => ({ ...d, horario_cierre: e.target.value }))} />
            <Select
              label="Estado"
              value={formData.activa ? 'true' : 'false'}
              onChange={(e) => setFormData(d => ({ ...d, activa: e.target.value === 'true' }))}
              options={[
                { value: 'true', label: 'Activa' },
                { value: 'false', label: 'Inactiva' }
              ]}
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setShowForm(false)} disabled={saving}>Cancelar</Button>
            <Button type="submit" loading={saving}>{editing ? 'Guardar Cambios' : 'Crear Área'}</Button>
          </div>
          <p className="text-xs text-white/40">La tarifa afecta reservas futuras. Valida horario apertura &lt; cierre.</p>
        </form>
      </Modal>

      {/* Detalle Área */}
      <Modal
        isOpen={!!showDetail}
        onClose={() => { setShowDetail(null); setDetailData(null); setFeedback(null); }}
        title={detailData ? detailData.nombre : 'Área'}
        size="lg"
      >
        {detailLoading && <div className="py-8 text-center text-white/70">Cargando...</div>}
        {feedback && showDetail && (
          <div className={feedback.type === 'success' ? 'alert-success' : 'alert-error'}>{feedback.message}</div>
        )}
        {detailData && (
          <div className="space-y-5 text-sm text-white/80">
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-white/50 mb-1">Capacidad</label>
                <p>{detailData.capacidad ?? '—'}</p>
              </div>
              <div>
                <label className="block text-white/50 mb-1">Tarifa Hora</label>
                <p>{detailData.tarifa_hora ? `$${Number(detailData.tarifa_hora).toFixed(2)}` : '—'}</p>
              </div>
              <div>
                <label className="block text-white/50 mb-1">Estado</label>
                <p>{detailData.activa ? <Badge variant="success">Activa</Badge> : <Badge variant="error">Inactiva</Badge>}</p>
              </div>
              <div className="md:col-span-3">
                <label className="block text-white/50 mb-1">Horario</label>
                <p>{detailData.horario_apertura && detailData.horario_cierre ? `${detailData.horario_apertura} - ${detailData.horario_cierre}` : '—'}</p>
              </div>
              {detailData.descripcion && (
                <div className="md:col-span-3">
                  <label className="block text-white/50 mb-1">Descripción</label>
                  <p className="whitespace-pre-line leading-relaxed text-white/70">{detailData.descripcion}</p>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => openEdit(detailData)}>Editar</Button>
              <Button variant="secondary" onClick={() => setShowDetail(null)}>Cerrar</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AreasPage;
