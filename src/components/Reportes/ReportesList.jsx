import React, { useState } from 'react';
import { FileWarning, Plus, RefreshCw, Eye, Edit3, CheckCircle2, XCircle, Lock, Activity } from 'lucide-react';
import usePagedList from '../../hooks/usePagedList';
import axiosInstance from '../../api/axiosConfig';
import PageHeader from '../common/PageHeader';
import Table from '../common/Table';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Select from '../common/Select';
import Button from '../common/Button';
import Badge from '../common/Badge';
// (Se elimina StatsGrid para homogeneizar con otras páginas)

// Tipos y estados soportados
const TIPO_OPTIONS = [
  { value: '', label: 'Todos los tipos' },
  { value: 'mantenimiento', label: 'Mantenimiento' },
  { value: 'ruido', label: 'Ruido' },
  { value: 'seguridad', label: 'Seguridad' },
  { value: 'limpieza', label: 'Limpieza' },
  { value: 'otro', label: 'Otro' }
];

const ESTADO_ORDER = ['pendiente', 'en_proceso', 'resuelto', 'cerrado'];
const ESTADO_LABELS = {
  pendiente: 'Pendiente',
  en_proceso: 'En Proceso',
  resuelto: 'Resuelto',
  cerrado: 'Cerrado'
};

const estadoVariant = (estado) => {
  switch (estado) {
    case 'pendiente': return 'neutral';
    case 'en_proceso': return 'info';
    case 'resuelto': return 'success';
    case 'cerrado': return 'success';
    default: return 'neutral';
  }
};

const tipoVariant = (tipo) => {
  switch (tipo) {
    case 'mantenimiento': return 'warning';
    case 'ruido': return 'error';
    case 'seguridad': return 'info';
    case 'limpieza': return 'success';
    default: return 'neutral';
  }
};

const ReportesList = () => {
  const { items: reportes, loading, error, page, setPage, count, setFilter, filters, refresh, updateItem, addItem } = usePagedList({
    endpoint: '/reportes/',
    pageSize: 20,
    initialFilters: { search: '', tipo: '', estado: '' }
  });

  const [feedback, setFeedback] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({ propietario: '', tipo: '', titulo: '', descripcion: '', ubicacion: '' });
  const [saving, setSaving] = useState(false);
  const [propietarios, setPropietarios] = useState([]);
  const [loadingPropietarios, setLoadingPropietarios] = useState(false);
  const [detailId, setDetailId] = useState(null);
  const [detailData, setDetailData] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [changingEstado, setChangingEstado] = useState(false);

  // Cargar propietarios al montar el componente
  React.useEffect(() => {
    const fetchPropietarios = async () => {
      setLoadingPropietarios(true);
      try {
        const resp = await axiosInstance.get('/propietarios/');
        const data = resp.data?.results || (Array.isArray(resp.data) ? resp.data : []);
        console.log('Propietarios cargados:', data);
        setPropietarios(data);
      } catch (err) {
        console.error('Error cargando propietarios:', err);
      } finally {
        setLoadingPropietarios(false);
      }
    };
    fetchPropietarios();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setFormData({ propietario: '', tipo: '', titulo: '', descripcion: '', ubicacion: '' });
    setShowForm(true);
  };

  const openEdit = (reporte) => {
    if (reporte.estado === 'cerrado') return;
    setEditing(reporte);
    setFormData({
      propietario: reporte.propietario || '',
      tipo: reporte.tipo || '',
      titulo: reporte.titulo || '',
      descripcion: reporte.descripcion || '',
      ubicacion: reporte.ubicacion || ''
    });
    setShowForm(true);
  };

  const openDetail = async (reporte) => {
    setDetailId(reporte.id);
    setDetailLoading(true);
    setFeedback(null);
    try {
      const resp = await axiosInstance.get(`/reportes/${reporte.id}/`);
      setDetailData(resp.data);
    } catch (err) {
      setDetailData(reporte); // fallback
      setFeedback({ type: 'error', message: 'No se pudo cargar detalle completo.' });
    } finally { setDetailLoading(false); }
  };

  const validate = () => {
    if (!formData.titulo.trim()) return 'El título es requerido';
    if (!formData.tipo) return 'Seleccione un tipo';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);
    try {
      const valErr = validate();
      if (valErr) throw new Error(valErr);
      const payload = {
        propietario: formData.propietario || null,
        tipo: formData.tipo,
        titulo: formData.titulo.trim(),
        descripcion: formData.descripcion.trim(),
        ubicacion: formData.ubicacion.trim() || null
      };
      if (editing) {
        const resp = await axiosInstance.patch(`/reportes/${editing.id}/`, payload);
        updateItem(editing.id, resp.data);
        setFeedback({ type: 'success', message: 'Reporte actualizado' });
      } else {
        const resp = await axiosInstance.post('/reportes/', { ...payload, estado: 'pendiente' });
        addItem(resp.data);
        setFeedback({ type: 'success', message: 'Reporte creado' });
        setFormData({ propietario: '', tipo: '', titulo: '', descripcion: '', ubicacion: '' });
      }
      setTimeout(() => { setShowForm(false); setFeedback(null); }, 800);
    } catch (err) {
      setFeedback({ type: 'error', message: err.response?.data?.detail || err.message || 'Error al guardar' });
    } finally { setSaving(false); }
  };

  const nextEstados = (estado) => {
    if (estado === 'cerrado') return [];
    const idx = ESTADO_ORDER.indexOf(estado);
    if (idx === -1) return [];
    const opciones = [];
    if (estado === 'resuelto') opciones.push('cerrado');
    else opciones.push(ESTADO_ORDER[idx + 1]);
    if (estado === 'en_proceso') opciones.push('pendiente'); // rollback opcional
    return opciones.filter(Boolean);
  };

  const cambiarEstado = async (reporte, nuevoEstado) => {
    setChangingEstado(reporte.id + '-' + nuevoEstado);
    setFeedback(null);
    try {
      const resp = await axiosInstance.patch(`/reportes/${reporte.id}/`, { estado: nuevoEstado });
      updateItem(reporte.id, resp.data);
      if (detailData && detailData.id === reporte.id) setDetailData(resp.data);
      setFeedback({ type: 'success', message: 'Estado actualizado' });
    } catch (err) {
      setFeedback({ type: 'error', message: err.response?.data?.detail || 'No se pudo cambiar estado' });
    } finally { setChangingEstado(false); }
  };

  const columns = [
    { key: 'id', header: 'ID', render: v => <span className="text-xs text-white/60">{v}</span> },
    { key: 'tipo', header: 'Tipo', render: v => <Badge variant={tipoVariant(v)}>{v || '—'}</Badge> },
    { key: 'titulo', header: 'Título', render: (v, row) => <button className="text-left text-blue-300 hover:underline" onClick={() => openDetail(row)}>{v || '—'}</button> },
    { key: 'propietario_nombre', header: 'Propietario', render: v => v || '—' },
    { key: 'estado', header: 'Estado', render: v => <Badge variant={estadoVariant(v)}>{ESTADO_LABELS[v] || v}</Badge> },
    { key: 'created_at', header: 'Creado', render: v => v ? new Date(v).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }) : '—' },
    { key: 'actions', header: 'Acciones', className: 'text-right', cellClassName: 'text-right', render: (_, row) => (
      <div className="flex justify-end gap-2">
        <Button variant="icon" icon={Eye} onClick={() => openDetail(row)} title="Ver detalle" />
        {row.estado !== 'cerrado' && (
          <Button variant="icon" icon={Edit3} onClick={() => openEdit(row)} title="Editar" />
        )}
      </div>
    ) }
  ];

  // Estadísticas removidas para mantener consistencia visual

  const headerActions = (
    <>
      <Button variant="secondary" icon={RefreshCw} onClick={() => refresh()}>Refrescar</Button>
      <Button variant="primary" icon={Plus} onClick={openCreate}>Nuevo Reporte</Button>
    </>
  );

  return (
    <div className="space-y-6 animate-fade-in bg-black">
      <PageHeader
        title="Reportes (Incidencias)"
        description="Gestión del ciclo de vida de incidencias"
        icon={FileWarning}
        actions={headerActions}
      />

  {/* Sin StatsGrid: homogeneizado con otras páginas */}

      {feedback && (
        <div className={feedback.type === 'success' ? 'alert-success' : 'alert-error'}>{feedback.message}</div>
      )}
      {error && !feedback && <div className="alert-error">{error}</div>}

      {/* Filtros */}
      <div className="bg-white/5 rounded-lg border border-white/10 p-4 space-y-4">
        <div className="grid md:grid-cols-5 gap-4">
          <Input label="Buscar (título)" value={filters.search || ''} onChange={(e) => setFilter('search', e.target.value)} placeholder="Texto..." />
          <Select label="Tipo" value={filters.tipo} onChange={(e) => setFilter('tipo', e.target.value)} options={TIPO_OPTIONS} />
          <Select label="Estado" value={filters.estado} onChange={(e) => setFilter('estado', e.target.value)} options={[{ value: '', label: 'Todos' }, ...ESTADO_ORDER.map(v => ({ value: v, label: ESTADO_LABELS[v] }))]} />
        </div>
      </div>

      <Table
        columns={columns}
        data={reportes}
        loading={loading}
        emptyMessage="No hay reportes"
        page={page}
        pageSize={20}
        totalItems={count}
        onPageChange={setPage}
      />

      {/* Formulario Crear/Editar */}
      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title={editing ? `Editar Reporte #${editing.id}` : 'Nuevo Reporte'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-5">
          {feedback && showForm && (
            <div className={feedback.type === 'success' ? 'alert-success' : 'alert-error'}>{feedback.message}</div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Tipo"
              required
              value={formData.tipo}
              onChange={(e) => setFormData(d => ({ ...d, tipo: e.target.value }))}
              options={TIPO_OPTIONS.filter(o => o.value !== '')}
            />
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">Propietario</label>
              <select
                value={formData.propietario}
                onChange={(e) => setFormData(d => ({ ...d, propietario: e.target.value }))}
                className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loadingPropietarios}
              >
                <option value="">Opcional</option>
                {propietarios.length > 0 ? (
                  propietarios.map(p => {
                    const nombre = p.user?.first_name && p.user?.last_name
                      ? `${p.user.first_name} ${p.user.last_name}`
                      : p.user?.username || `ID: ${p.id}`;
                    return (
                      <option key={p.id} value={p.id}>
                        {nombre}
                      </option>
                    );
                  })
                ) : (
                  !loadingPropietarios && <option disabled>No hay propietarios</option>
                )}
              </select>
            </div>
            <div className="col-span-2">
              <Input
                label="Título"
                required
                value={formData.titulo}
                onChange={(e) => setFormData(d => ({ ...d, titulo: e.target.value }))}
                placeholder="Ej: Fuga de agua en torre A"
              />
            </div>
            <div className="col-span-2 flex flex-col">
              <label className="text-white/60 text-sm mb-1">Descripción</label>
              <textarea
                value={formData.descripcion}
                onChange={(e) => setFormData(d => ({ ...d, descripcion: e.target.value }))}
                className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 min-h-[90px]"
                placeholder="Detalles de la incidencia..."
              />
            </div>
            <Input
              label="Ubicación"
              value={formData.ubicacion}
              onChange={(e) => setFormData(d => ({ ...d, ubicacion: e.target.value }))}
              placeholder="Ej: Torre B - Piso 2"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setShowForm(false)} disabled={saving}>Cancelar</Button>
            <Button type="submit" loading={saving}>{editing ? 'Guardar Cambios' : 'Crear Reporte'}</Button>
          </div>
        </form>
      </Modal>

      {/* Detalle */}
      <Modal isOpen={!!detailId} onClose={() => { setDetailId(null); setDetailData(null); }} title={detailData ? `Reporte #${detailData.id}` : 'Reporte'} size="lg">
        {detailLoading && <div className="py-8 text-center text-white/70">Cargando...</div>}
        {detailData && (
          <div className="space-y-5 text-sm text-white/80">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <h3 className="text-lg font-semibold text-white">{detailData.titulo}</h3>
                <div className="flex gap-2 mt-1">
                  <Badge variant={tipoVariant(detailData.tipo)}>{detailData.tipo}</Badge>
                  <Badge variant={estadoVariant(detailData.estado)}>{ESTADO_LABELS[detailData.estado] || detailData.estado}</Badge>
                </div>
              </div>
              <div>
                <label className="block text-white/50 mb-1">Creado</label>
                <p>{detailData.created_at ? new Date(detailData.created_at).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' }) : '—'}</p>
              </div>
              <div>
                <label className="block text-white/50 mb-1">Propietario</label>
                <p>{detailData.propietario_nombre || detailData.propietario || '—'}</p>
              </div>
              {detailData.ubicacion && (
                <div>
                  <label className="block text-white/50 mb-1">Ubicación</label>
                  <p>{detailData.ubicacion}</p>
                </div>
              )}
              <div className="md:col-span-3">
                <label className="block text-white/50 mb-1">Descripción</label>
                <p className="whitespace-pre-line leading-relaxed text-white/70">{detailData.descripcion || '—'}</p>
              </div>
            </div>
            {/* Acciones estado */}
            {detailData.estado !== 'cerrado' && (
              <div className="flex flex-wrap gap-2 pt-2">
                {nextEstados(detailData.estado).map(ne => (
                  <Button
                    key={ne}
                    size="xs"
                    variant={ne === 'cerrado' ? 'primary' : 'secondary'}
                    loading={changingEstado === detailData.id + '-' + ne}
                    onClick={() => cambiarEstado(detailData, ne)}
                  >
                    {ESTADO_LABELS[ne]}
                  </Button>
                ))}
              </div>
            )}
            {detailData.estado === 'cerrado' && <p className="text-xs text-white/50">Reporte cerrado - no editable.</p>}
            <div className="flex justify-end gap-2 pt-4">
              {detailData.estado !== 'cerrado' && <Button variant="secondary" onClick={() => openEdit(detailData)}>Editar</Button>}
              <Button variant="secondary" onClick={() => setDetailId(null)}>Cerrar</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ReportesList;