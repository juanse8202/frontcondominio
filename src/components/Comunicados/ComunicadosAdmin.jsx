import React, { useState } from 'react';
import usePagedList from '../../hooks/usePagedList';
import axiosInstance from '../../api/axiosConfig';
import PageHeader from '../common/PageHeader';
import Table from '../common/Table';
import Button from '../common/Button';
import Input from '../common/Input';
import Select from '../common/Select';
import Modal from '../common/Modal';
import Badge from '../common/Badge';
import { Megaphone, RefreshCw, Filter, Plus, Edit3, Trash2, Eye, Users, FileDown, Send } from 'lucide-react';

// Tipos permitidos (deben coincidir con el backend)
const TIPO_OPTIONS = [
  { value: 'aviso', label: 'Aviso' },
  { value: 'noticia', label: 'Noticia' },
  { value: 'evento', label: 'Evento' },
  { value: 'urgente', label: 'Urgente' }
];

const tipoVariant = (tipo) => {
  switch (tipo) {
    case 'urgente': return 'error';
    case 'evento': return 'warning';
    case 'noticia': return 'info';
    case 'aviso': return 'success';
    default: return 'neutral';
  }
};

const ComunicadosAdmin = () => {
  const { items, loading, error, page, setPage, count, setFilter, filters, refresh, addItem, updateItem, removeItem } = usePagedList({
    endpoint: '/comunicados/',
    pageSize: 20,
    initialFilters: { search: '', tipo: '' }
  });

  const [showFilters, setShowFilters] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(null);
  const [formData, setFormData] = useState({ titulo: '', contenido: '', tipo: 'aviso' });
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [detailData, setDetailData] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  // Panel acciones masivas
  const [showMass, setShowMass] = useState(false);
  const [morososData, setMorososData] = useState(null);
  const [morososLoading, setMorososLoading] = useState(false);
  const [morososThreshold, setMorososThreshold] = useState(3);
  const [sendingMorosos, setSendingMorosos] = useState(false);
  const [sendingLista, setSendingLista] = useState(false);
  const [listaPropietarios, setListaPropietarios] = useState('');
  const [pdfLoading, setPdfLoading] = useState(false);
  const [morososMensaje, setMorososMensaje] = useState({
    titulo: 'Aviso de Mora',
    mensaje: 'Tiene expensas pendientes. Regularice para evitar restricciones.',
    tipo: 'urgente'
  });
  const [listaMensaje, setListaMensaje] = useState({
    titulo: 'Comunicado',
    mensaje: 'Detalle del comunicado',
    tipo: 'aviso'
  });

  const openCreate = () => {
    setEditing(null);
    setFormData({ titulo: '', contenido: '', tipo: 'aviso' });
    setShowForm(true);
    setFeedback(null);
  };

  const openEdit = (row) => {
    setEditing(row);
    setFormData({
      titulo: row.titulo || '',
      contenido: row.contenido || '',
      tipo: row.tipo || 'aviso'
    });
    setShowForm(true);
  };

  const openDetail = async (row) => {
    setShowDetail(row.id);
    setDetailLoading(true);
    setDetailData(null);
    try {
      const resp = await axiosInstance.get(`/comunicados/${row.id}/`);
      setDetailData(resp.data);
    } catch (err) {
      setDetailData(row);
      setFeedback({ type: 'error', message: 'No se pudo cargar detalle completo.' });
    } finally { setDetailLoading(false); }
  };

  const validate = () => {
    if (!formData.titulo.trim()) return 'El título es requerido';
    if (!formData.contenido.trim()) return 'El contenido es requerido';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true); setFeedback(null);
    try {
      const valErr = validate();
      if (valErr) throw new Error(valErr);
      const payload = {
        titulo: formData.titulo.trim(),
        contenido: formData.contenido.trim(),
        tipo: formData.tipo
      };
      if (editing) {
        const resp = await axiosInstance.patch(`/comunicados/${editing.id}/`, payload);
        updateItem(editing.id, resp.data);
        setFeedback({ type: 'success', message: 'Comunicado actualizado' });
      } else {
        const resp = await axiosInstance.post('/comunicados/', payload);
        addItem(resp.data);
        setFeedback({ type: 'success', message: 'Comunicado creado' });
        setFormData({ titulo: '', contenido: '', tipo: 'aviso' });
      }
      setTimeout(() => { setShowForm(false); setFeedback(null); }, 800);
    } catch (err) {
      setFeedback({ type: 'error', message: err.response?.data?.detail || err.message || 'Error al guardar' });
    } finally { setSaving(false); }
  };

  const deleteComunicado = async (row) => {
    if (!window.confirm('¿Eliminar comunicado?')) return;
    setDeletingId(row.id);
    setFeedback(null);
    try {
      await axiosInstance.delete(`/comunicados/${row.id}/`);
      removeItem(row.id);
      setFeedback({ type: 'success', message: 'Eliminado' });
    } catch (err) {
      setFeedback({ type: 'error', message: err.response?.data?.detail || 'No se pudo eliminar' });
    } finally { setDeletingId(null); }
  };

  const columns = [
    { key: 'id', header: 'ID', render: v => <span className="text-xs text-white/60">{v}</span> },
    { key: 'tipo', header: 'Tipo', render: v => <Badge variant={tipoVariant(v)}>{v}</Badge> },
    { key: 'titulo', header: 'Título', render: (v, row) => <button className="text-left text-blue-300 hover:underline" onClick={() => openDetail(row)}>{v || '—'}</button> },
    { key: 'autor_nombre', header: 'Autor', render: v => <span className="text-xs text-white/70">{v || '—'}</span> },
    { key: 'fecha_publicacion', header: 'Publicado', render: v => v ? new Date(v).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }) : '—' },
    { key: 'actions', header: 'Acciones', className: 'text-right', cellClassName: 'text-right', render: (_, row) => (
      <div className="flex justify-end gap-2">
        <Button variant="icon" icon={Eye} onClick={() => openDetail(row)} title="Ver" />
        <Button variant="icon" icon={Edit3} onClick={() => openEdit(row)} title="Editar" />
        <Button variant="icon" icon={Trash2} loading={deletingId === row.id} onClick={() => deleteComunicado(row)} title="Eliminar" />
      </div>
    ) }
  ];

  const headerActions = (
    <div className="flex gap-2 flex-wrap">
      <Button variant="primary" icon={Plus} onClick={openCreate}>Nuevo</Button>
      <Button variant="secondary" icon={Filter} onClick={() => setShowFilters(v => !v)}>Filtros</Button>
      <Button variant="secondary" icon={RefreshCw} onClick={refresh}>Refrescar</Button>
  <Button variant="secondary" icon={Users} onClick={() => setShowMass(v => !v)}>{showMass ? 'Ocultar' : 'Masivo'}</Button>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in ">
      <PageHeader
        title="Comunicados"
        description="Avisos y notificaciones a propietarios"
        icon={Megaphone}
        actions={headerActions}
      />

      {showFilters && (
        <div className="card-minimal p-4 space-y-4 animate-slide-down">
          <div className="grid md:grid-cols-5 gap-4">
            <Input label="Buscar (título)" value={filters.search || ''} onChange={(e) => setFilter('search', e.target.value)} placeholder="Buscar..." />
            <Select label="Tipo" value={filters.tipo} onChange={(e) => setFilter('tipo', e.target.value)} options={[{ value: '', label: 'Todos' }, ...TIPO_OPTIONS]} />
          </div>
        </div>
      )}

      {feedback && !showForm && !showDetail && (
        <div className={feedback.type === 'success' ? 'alert-success' : 'alert-error'}>{feedback.message}</div>
      )}
      {error && <div className="alert-error">{error}</div>}

      {showMass && (
        <div className="card-minimal p-4 space-y-4 animate-slide-down">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3 items-end">
                <Input label="Mora >=" type="number" min={1} value={morososThreshold} onChange={(e) => setMorososThreshold(Number(e.target.value) || 1)} />
                <Button variant="secondary" size="sm" loading={morososLoading} onClick={async () => {
                  setMorososLoading(true); setFeedback(null);
                  try { const resp = await axiosInstance.get(`/comunicados/morosos/`, { params: { threshold: morososThreshold } }); setMorososData(resp.data); }
                  catch (err) { setFeedback({ type: 'error', message: err.response?.data?.detail || 'Error morosos' }); }
                  finally { setMorososLoading(false); }
                }}>Cargar</Button>
                <Button variant="secondary" size="sm" icon={FileDown} loading={pdfLoading} onClick={async () => {
                  setPdfLoading(true); setFeedback(null);
                  try { const resp = await axiosInstance.get('/comunicados/morosos_pdf/', { params: { threshold: morososThreshold }, responseType: 'blob' }); const url = window.URL.createObjectURL(new Blob([resp.data])); const a = document.createElement('a'); a.href = url; a.download = `morosos_${morososThreshold}.pdf`; a.click(); window.URL.revokeObjectURL(url); }
                  catch (err) { setFeedback({ type: 'error', message: err.response?.data?.detail || 'Error PDF' }); }
                  finally { setPdfLoading(false); }
                }}>PDF</Button>
              </div>
              {morososData && (
                <div className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs max-h-36 overflow-auto">
                  <div className="flex justify-between text-white/40 mb-1"><span>{morososData.count} prop.</span><span>≥ {morososData.threshold}m</span></div>
                  {morososData.propietarios?.map(p => (<div key={p.id} className="flex justify-between"><span className="truncate">#{p.id} {p.nombre}</span><span className="text-white/40">{p.meses_mora}</span></div>))}
                </div>
              )}
              <Input label="Título" value={morososMensaje.titulo} onChange={(e) => setMorososMensaje(d => ({ ...d, titulo: e.target.value }))} />
              <Select label="Tipo" value={morososMensaje.tipo} onChange={(e) => setMorososMensaje(d => ({ ...d, tipo: e.target.value }))} options={TIPO_OPTIONS} />
              <div className="flex flex-col">
                <label className="text-white/50 text-xs mb-1">Mensaje</label>
                <textarea value={morososMensaje.mensaje} onChange={(e) => setMorososMensaje(d => ({ ...d, mensaje: e.target.value }))} className="bg-white/10 border border-white/20 rounded-lg px-2 py-2 text-white text-xs min-h-[70px] focus:outline-none focus:ring-2 focus:ring-blue-400" />
              </div>
              <Button variant="primary" size="sm" icon={Send} loading={sendingMorosos} disabled={!morososData?.count} onClick={async () => {
                setSendingMorosos(true); setFeedback(null);
                try { const resp = await axiosInstance.post('/comunicados/enviar_morosos/', { ...morososMensaje, threshold: morososThreshold }); setFeedback({ type: 'success', message: `Generados: ${resp.data.creados}` }); refresh(); }
                catch (err) { setFeedback({ type: 'error', message: err.response?.data?.detail || 'Error enviando' }); }
                finally { setSendingMorosos(false); }
              }}>Enviar Morosos</Button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-white/50 text-xs mb-1">Propietarios (IDs coma)</label>
                <textarea value={listaPropietarios} onChange={(e) => setListaPropietarios(e.target.value)} className="w-full bg-white/10 border border-white/20 rounded-lg px-2 py-2 text-white text-xs min-h-[70px] focus:outline-none focus:ring-2 focus:ring-blue-400" placeholder="12,19,31" />
              </div>
              <Input label="Título" value={listaMensaje.titulo} onChange={(e) => setListaMensaje(d => ({ ...d, titulo: e.target.value }))} />
              <Select label="Tipo" value={listaMensaje.tipo} onChange={(e) => setListaMensaje(d => ({ ...d, tipo: e.target.value }))} options={TIPO_OPTIONS} />
              <div className="flex flex-col">
                <label className="text-white/50 text-xs mb-1">Mensaje</label>
                <textarea value={listaMensaje.mensaje} onChange={(e) => setListaMensaje(d => ({ ...d, mensaje: e.target.value }))} className="bg-white/10 border border-white/20 rounded-lg px-2 py-2 text-white text-xs min-h-[70px] focus:outline-none focus:ring-2 focus:ring-blue-400" />
              </div>
              <Button variant="primary" size="sm" icon={Send} loading={sendingLista} disabled={!listaPropietarios.trim()} onClick={async () => {
                setSendingLista(true); setFeedback(null);
                try { const propietarios = listaPropietarios.split(',').map(v => Number(v.trim())).filter(v => !isNaN(v)); const resp = await axiosInstance.post('/comunicados/enviar_propietarios/', { propietarios, ...listaMensaje }); setFeedback({ type: 'success', message: `Creación: ${resp.data.creados}${resp.data.no_encontrados?.length ? ' | No: ' + resp.data.no_encontrados.join(',') : ''}` }); refresh(); }
                catch (err) { setFeedback({ type: 'error', message: err.response?.data?.detail || 'Error envío lista' }); }
                finally { setSendingLista(false); }
              }}>Enviar Lista</Button>
            </div>
          </div>
        </div>
      )}

      <Table
        columns={columns}
        data={items}
        loading={loading}
        emptyMessage="No hay comunicados"
      />

      {count > 20 && (
        <div className="flex justify-end gap-2 items-center text-white/60 text-sm">
          <Button variant="secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>Anterior</Button>
          <span>Página {page}</span>
          <Button variant="secondary" disabled={(page * 20) >= count} onClick={() => setPage(page + 1)}>Siguiente</Button>
        </div>
      )}

      {/* Modal Crear/Editar */}
      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title={editing ? `Editar Comunicado #${editing.id}` : 'Nuevo Comunicado'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-5">
          {feedback && showForm && (
            <div className={feedback.type === 'success' ? 'alert-success' : 'alert-error'}>{feedback.message}</div>
          )}
          <div className="space-y-4">
            <Input label="Título" value={formData.titulo} onChange={(e) => setFormData(d => ({ ...d, titulo: e.target.value }))} required placeholder="Ej: Corte de agua" />
            <Select label="Tipo" value={formData.tipo} onChange={(e) => setFormData(d => ({ ...d, tipo: e.target.value }))} options={TIPO_OPTIONS} />
            <div className="flex flex-col">
              <label className="text-white/60 text-sm mb-1">Contenido</label>
              <textarea
                value={formData.contenido}
                onChange={(e) => setFormData(d => ({ ...d, contenido: e.target.value }))}
                className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 min-h-[120px]"
                placeholder="Contenido del comunicado"
                required
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setShowForm(false)} disabled={saving}>Cancelar</Button>
            <Button type="submit" loading={saving}>{editing ? 'Guardar Cambios' : 'Publicar'}</Button>
          </div>
        </form>
      </Modal>

      {/* Modal Detalle */}
      <Modal isOpen={!!showDetail} onClose={() => { setShowDetail(null); setDetailData(null); }} title={detailData ? detailData.titulo : 'Comunicado'} size="lg">
        {detailLoading && <div className="py-8 text-center text-white/70">Cargando...</div>}
        {detailData && (
          <div className="space-y-5 text-sm text-white/80">
            <div className="flex flex-wrap gap-3 items-center">
              <Badge variant={tipoVariant(detailData.tipo)}>{detailData.tipo}</Badge>
              <Badge variant="neutral">Autor: {detailData.autor_nombre || '—'}</Badge>
              <Badge variant="neutral">{detailData.fecha_publicacion ? new Date(detailData.fecha_publicacion).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' }) : '—'}</Badge>
            </div>
            <div>
              <label className="block text-white/50 mb-1">Contenido</label>
              <p className="whitespace-pre-line leading-relaxed text-white/70">{detailData.contenido}</p>
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

export default ComunicadosAdmin;
