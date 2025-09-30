import React, { useState } from 'react';
import usePagedList from '../hooks/usePagedList';
import axiosInstance from '../api/axiosConfig';
import PageHeader from '../components/common/PageHeader';
import Table from '../components/common/Table';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Modal from '../components/common/Modal';
import Badge from '../components/common/Badge';
import { Users, RefreshCw, Filter, Edit3, ShieldAlert } from 'lucide-react';

// Gestión de Propietarios (Admin) según documentación API
// Endpoints usados: GET /propietarios/ , PATCH /propietarios/{id}/

const PropietariosPage = () => {
  const { items, loading, error, page, setPage, count, setFilter, filters, refresh, updateItem } = usePagedList({
    endpoint: '/propietarios/',
    pageSize: 20,
    initialFilters: { restringido_por_mora: '', search: '' }
  });

  const [showFilters, setShowFilters] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [editData, setEditData] = useState({ meses_mora: 0, restringido_por_mora: false });
  const [feedback, setFeedback] = useState(null);

  const openEdit = (prop) => {
    setEditing(prop);
    setEditData({
      meses_mora: prop.meses_mora || 0,
      restringido_por_mora: !!prop.restringido_por_mora
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!editing) return;
    setSaving(true); setFeedback(null);
    try {
      const payload = {
        meses_mora: editData.meses_mora,
        restringido_por_mora: editData.restringido_por_mora
      };
      const response = await axiosInstance.patch(`/propietarios/${editing.id}/`, payload);
      updateItem(editing.id, response.data);
      setFeedback({ type: 'success', message: 'Propietario actualizado' });
      setTimeout(() => { setEditing(null); setFeedback(null); }, 1000);
    } catch (err) {
      setFeedback({ type: 'error', message: err.response?.data?.detail || 'Error al actualizar' });
    } finally { setSaving(false); }
  };

  const columns = [
    {
      key: 'id',
      header: 'ID',
      render: (v) => <span className="text-white/70 text-xs">{v}</span>
    },
    {
      key: 'user',
      header: 'Usuario',
      render: (_, row) => (
        <div>
          <p className="font-medium">{row.user?.username || '—'}</p>
          <p className="text-xs text-white/50">{row.user?.email}</p>
        </div>
      )
    },
    {
      key: 'documento_identidad',
      header: 'Documento',
      render: (v) => v || '—'
    },
    {
      key: 'telefono',
      header: 'Teléfono',
      render: (v) => v || '—'
    },
    {
      key: 'meses_mora',
      header: 'Meses Mora',
      render: (v) => (
        <span className={v > 0 ? 'text-amber-300 font-semibold' : 'text-white/70'}>{v}</span>
      )
    },
    {
      key: 'restringido_por_mora',
      header: 'Restricción',
      render: (v) => v ? <Badge variant="error">Restringido</Badge> : <Badge variant="success">Activo</Badge>
    },
    {
      key: 'actions',
      header: 'Acciones',
      className: 'text-right',
      cellClassName: 'text-right',
      render: (_, row) => (
        <div className="flex justify-end">
          <Button variant="icon" icon={Edit3} onClick={() => openEdit(row)} title="Editar mora" />
        </div>
      )
    }
  ];

  const headerActions = (
    <div className="flex gap-2">
      <Button variant="secondary" icon={Filter} onClick={() => setShowFilters(v => !v)}>
        Filtros
      </Button>
      <Button variant="secondary" icon={RefreshCw} onClick={refresh}>
        Refrescar
      </Button>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Propietarios"
        description="Listado y control de estado de mora"
        icon={Users}
        actions={headerActions}
      />

      {showFilters && (
        <div className="card-minimal p-4 space-y-4 animate-slide-down">
          <div className="grid md:grid-cols-4 gap-4">
            <Input
              label="Buscar (username/email)"
              value={filters.search || ''}
              onChange={(e) => setFilter('search', e.target.value)}
              placeholder="Buscar..."
            />
            <select
              className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={filters.restringido_por_mora}
              onChange={(e) => setFilter('restringido_por_mora', e.target.value)}
            >
              <option value="">Restricción (Todos)</option>
              <option value="true">Restringidos</option>
              <option value="false">No restringidos</option>
            </select>
          </div>
        </div>
      )}

      {error && (
        <div className="alert-error">{error}</div>
      )}

      <Table
        columns={columns}
        data={items}
        loading={loading}
        emptyMessage="No hay propietarios registrados"
        className="bg-black text-white/90 border border-white/20 rounded-lg"
      />


      {/* Paginación simple */}
      {count > 20 && (
        <div className="flex justify-end gap-2 items-center text-white/60 text-sm">
          <Button variant="secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>Anterior</Button>
          <span>Página {page}</span>
          <Button variant="secondary" disabled={(page * 20) >= count} onClick={() => setPage(page + 1)}>Siguiente</Button>
        </div>
      )}

      <Modal
        isOpen={!!editing}
        onClose={() => { setEditing(null); setFeedback(null); }}
        title={editing ? `Editar Mora - ${editing.user?.username}` : ''}
        size="sm"
      >
        {editing && (
          <form onSubmit={handleSave} className="space-y-4">
            {feedback && (
              <div className={feedback.type === 'success' ? 'alert-success' : 'alert-error'}>
                {feedback.message}
              </div>
            )}
            <div>
              <label className="block text-white/60 text-sm mb-1">Meses en mora</label>
              <input
                type="number"
                min={0}
                value={editData.meses_mora}
                onChange={(e) => setEditData(d => ({ ...d, meses_mora: Number(e.target.value) }))}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                id="restriccion"
                type="checkbox"
                checked={editData.restringido_por_mora}
                onChange={(e) => setEditData(d => ({ ...d, restringido_por_mora: e.target.checked }))}
                className="w-4 h-4 accent-blue-500"
              />
              <label htmlFor="restriccion" className="text-white/80 text-sm flex items-center gap-1">
                <ShieldAlert className="w-4 h-4" /> Restringido por mora
              </label>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="secondary" onClick={() => setEditing(null)} disabled={saving}>Cancelar</Button>
              <Button type="submit" loading={saving}>Guardar</Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default PropietariosPage;
