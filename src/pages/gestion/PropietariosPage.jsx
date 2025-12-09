import React, { useState } from 'react';
import usePagedList from '../../hooks/usePagedList.jsx';
import axiosInstance from '../../api/axiosConfig.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';
import Table from '../../components/common/Table.jsx';
import Button from '../../components/common/Button.jsx';
import Input from '../../components/common/Input.jsx';
import Modal from '../../components/common/Modal.jsx';
import Badge from '../../components/common/Badge.jsx';
import { Users, RefreshCw, Filter, Edit3, ShieldAlert, Plus } from 'lucide-react';

// Gestión de Propietarios (Admin) según documentación API
// Endpoints usados: GET /propietarios/ , POST /propietarios/, PATCH /propietarios/{id}/

const PropietariosPage = () => {
  const { items, loading, error, page, setPage, count, setFilter, filters, refresh, updateItem } = usePagedList({
    endpoint: '/propietarios/',
    pageSize: 20,
    initialFilters: { restringido_por_mora: '', search: '' }
  });

  const [showFilters, setShowFilters] = useState(false);
  const [editing, setEditing] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editData, setEditData] = useState({ meses_mora: 0, restringido_por_mora: false });
  const [newPropietario, setNewPropietario] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    documento_identidad: '',
    telefono: ''
  });
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
      // Refrescar la tabla para mostrar los cambios
      await refresh();
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

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);
    try {
      await axiosInstance.post('/propietarios/', newPropietario);
      setFeedback({ type: 'success', message: 'Propietario creado exitosamente' });
      setTimeout(() => {
        setShowCreate(false);
        setNewPropietario({
          username: '',
          email: '',
          first_name: '',
          last_name: '',
          documento_identidad: '',
          telefono: ''
        });
        setFeedback(null);
        refresh();
      }, 1000);
    } catch (err) {
      const errorMsg = err.response?.data?.username?.[0] || 
                       err.response?.data?.documento_identidad?.[0] ||
                       err.response?.data?.detail || 
                       'Error al crear propietario';
      setFeedback({ type: 'error', message: errorMsg });
    } finally {
      setSaving(false);
    }
  };

  const headerActions = (
    <div className="flex gap-2">
      <Button variant="primary" icon={Plus} onClick={() => setShowCreate(true)}>
        Nuevo Propietario
      </Button>
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

      {/* Modal Crear Propietario */}
      <Modal
        isOpen={showCreate}
        onClose={() => { setShowCreate(false); setFeedback(null); }}
        title="Nuevo Propietario"
        size="md"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          {feedback && (
            <div className={feedback.type === 'success' ? 'alert-success' : 'alert-error'}>
              {feedback.message}
            </div>
          )}
          
          <div className="grid md:grid-cols-2 gap-4">
            <Input
              label="Nombre de usuario *"
              value={newPropietario.username}
              onChange={(e) => setNewPropietario({ ...newPropietario, username: e.target.value })}
              placeholder="usuario123"
              required
            />
            <Input
              label="Email *"
              type="email"
              value={newPropietario.email}
              onChange={(e) => setNewPropietario({ ...newPropietario, email: e.target.value })}
              placeholder="correo@ejemplo.com"
              required
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <Input
              label="Nombre *"
              value={newPropietario.first_name}
              onChange={(e) => setNewPropietario({ ...newPropietario, first_name: e.target.value })}
              placeholder="Juan"
              required
            />
            <Input
              label="Apellido *"
              value={newPropietario.last_name}
              onChange={(e) => setNewPropietario({ ...newPropietario, last_name: e.target.value })}
              placeholder="Pérez"
              required
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <Input
              label="Documento de Identidad *"
              value={newPropietario.documento_identidad}
              onChange={(e) => setNewPropietario({ ...newPropietario, documento_identidad: e.target.value })}
              placeholder="12345678"
              required
            />
            <Input
              label="Teléfono *"
              value={newPropietario.telefono}
              onChange={(e) => setNewPropietario({ ...newPropietario, telefono: e.target.value })}
              placeholder="+1234567890"
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
            <Button 
              type="button" 
              variant="secondary" 
              onClick={() => setShowCreate(false)} 
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button type="submit" loading={saving}>
              Crear Propietario
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Editar Mora */}
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
