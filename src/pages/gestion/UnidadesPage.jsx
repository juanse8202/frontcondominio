import React, { useState, useEffect } from 'react';
import useUnidades from '../../hooks/useUnidades.jsx';
import usePagedList from '../../hooks/usePagedList.jsx';
import axiosInstance from '../../api/axiosConfig.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';
import Table from '../../components/common/Table.jsx';
import Button from '../../components/common/Button.jsx';
import Input from '../../components/common/Input.jsx';
import Modal from '../../components/common/Modal.jsx';
import Badge from '../../components/common/Badge.jsx';
import { Building, RefreshCw, Filter, Plus, Edit, Trash2 } from 'lucide-react';

const UnidadesPage = () => {
  const { createUnidad, updateUnidad, deleteUnidad } = useUnidades();
  const { items, loading, error, page, setPage, count, setFilter, filters, refresh } = usePagedList({
    endpoint: '/unidades/',
    pageSize: 20,
    initialFilters: { tipo: '', search: '' }
  });

  const [showFilters, setShowFilters] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingUnidad, setEditingUnidad] = useState(null);
  const [deletingUnidad, setDeletingUnidad] = useState(null);
  const [propietarios, setPropietarios] = useState([]);
  const [loadingPropietarios, setLoadingPropietarios] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    propietario: '',
    numero: '',
    edificio: '',
    tipo: 'departamento',
    piso: '',
    caracteristicas: ''
  });

// Cargar lista de propietarios para el select
  useEffect(() => {
    const fetchPropietarios = async () => {
      setLoadingPropietarios(true);
      try {
        const response = await axiosInstance.get('/propietarios/');
        const data = response.data.results || response.data;
        setPropietarios(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Error al cargar propietarios:', err);
      } finally {
        setLoadingPropietarios(false);
      }
    };
    fetchPropietarios();
  }, []);

  const openCreateModal = () => {
    setEditingUnidad(null);
    setFormData({
      propietario: '',
      numero: '',
      edificio: '',
      tipo: 'departamento',
      piso: '',
      caracteristicas: ''
    });
    setFeedback(null);
    setShowFormModal(true);
  };

  const openEditModal = (unidad) => {
    setEditingUnidad(unidad);
    setFormData({
      propietario: unidad.propietario || '',
      numero: unidad.numero || '',
      edificio: unidad.edificio || '',
      tipo: unidad.tipo || 'departamento',
      piso: unidad.piso || '',
      caracteristicas: unidad.caracteristicas || ''
    });
    setFeedback(null);
    setShowFormModal(true);
  };

  const openDeleteModal = (unidad) => {
    setDeletingUnidad(unidad);
    setFeedback(null);
    setShowDeleteModal(true);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFeedback(null);

    if (!formData.propietario) {
      setFeedback({ type: 'error', message: 'Debe seleccionar un propietario' });
      setSubmitting(false);
      return;
    }
    if (!formData.numero) {
      setFeedback({ type: 'error', message: 'El número de unidad es requerido' });
      setSubmitting(false);
      return;
    }

    const dataToSend = {
      propietario: parseInt(formData.propietario),
      numero: formData.numero,
      edificio: formData.edificio || '',
      tipo: formData.tipo,
      piso: formData.piso ? parseInt(formData.piso) : null,
      caracteristicas: formData.caracteristicas || ''
    };

    let result;
    if (editingUnidad) {
      result = await updateUnidad(editingUnidad.id, dataToSend);
    } else {
      result = await createUnidad(dataToSend);
    }

    if (result.success) {
      setFeedback({ type: 'success', message: editingUnidad ? 'Unidad actualizada exitosamente' : 'Unidad creada exitosamente' });
      setTimeout(() => {
        setShowFormModal(false);
        refresh();
      }, 1500);
    } else {
      let errorMsg = result.message;
      if (typeof result.message === 'object') {
        errorMsg = Object.entries(result.message)
          .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
          .join('; ');
      }
      setFeedback({ type: 'error', message: errorMsg });
    }

    setSubmitting(false);
  };

  const handleDelete = async () => {
    setSubmitting(true);
    setFeedback(null);

    const result = await deleteUnidad(deletingUnidad.id);

    if (result.success) {
      setFeedback({ type: 'success', message: 'Unidad eliminada exitosamente' });
      setTimeout(() => {
        setShowDeleteModal(false);
        refresh();
      }, 1500);
    } else {
      setFeedback({ type: 'error', message: result.message });
    }

    setSubmitting(false);
  };

const tipoVariant = (tipo) => {
    if (!tipo) return 'neutral';
    switch (tipo.toLowerCase()) {
      case 'casa': return 'success';
      case 'departamento': return 'info';
      case 'penthouse': return 'warning';
      default: return 'default';
    }
  };

  const columns = [
    { key: 'id', header: 'ID', className: 'w-16', render: (v) => <span className="text-xs text-white/60">#{v}</span> },
    { key: 'numero', header: 'Número', className: 'w-32', render: (v) => <span className="font-semibold">{v || '—'}</span> },
    { key: 'edificio', header: 'Edificio', className: 'w-40', render: (v) => v || '—' },
    { key: 'tipo', header: 'Tipo', className: 'w-36', render: (v) => <Badge variant={tipoVariant(v)}>{v || '—'}</Badge> },
    { key: 'piso', header: 'Piso', className: 'w-20', render: (v) => v || '—' },
    { key: 'propietario_nombre', header: 'Propietario', render: (v) => v || '—' },
    { 
      key: 'actions', 
      header: 'Acciones', 
      className: 'text-right w-28', 
      cellClassName: 'text-right', 
      render: (_, row) => (
        <div className="flex gap-2 justify-end">
          <Button variant="icon" icon={Edit} onClick={() => openEditModal(row)} title="Editar" />
          <Button variant="icon-danger" icon={Trash2} onClick={() => openDeleteModal(row)} title="Eliminar" />
        </div>
      ) 
    }
  ];

const headerActions = (
    <div className="flex gap-2">
      <Button variant="primary" icon={Plus} onClick={openCreateModal}>Nueva Unidad</Button>
      <Button variant="secondary" icon={Filter} onClick={() => setShowFilters(v => !v)}>Filtros</Button>
      <Button variant="secondary" icon={RefreshCw} onClick={refresh}>Refrescar</Button>
    </div>
  );

return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Unidades"
        description="Listado y gestión de unidades habitacionales"
        icon={Building}
        actions={headerActions}
      />

      {showFilters && (
        <div className="card-minimal p-4 space-y-4 animate-slide-down">
          <div className="grid md:grid-cols-3 gap-4">
            <Input
              label="Buscar (número/edificio)"
              value={filters.search || ''}
              onChange={(e) => setFilter('search', e.target.value)}
              placeholder="Buscar..."
            />
            <div>
              <label className="block text-white/70 text-sm mb-2">Tipo</label>
              <select
                className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 w-full"
                value={filters.tipo || ''}
                onChange={(e) => setFilter('tipo', e.target.value)}
              >
                <option value="">Todos</option>
                <option value="casa">Casa</option>
                <option value="departamento">Departamento</option>
                <option value="penthouse">Penthouse</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {error && <div className="alert-error">{error}</div>}

      <Table
        columns={columns}
        data={items}
        loading={loading}
        emptyMessage="No hay unidades registradas"
      />

      {count > 20 && (
        <div className="flex justify-end gap-2 items-center text-white/60 text-sm">
          <Button variant="secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>Anterior</Button>
          <span>Página {page}</span>
          <Button variant="secondary" disabled={(page * 20) >= count} onClick={() => setPage(page + 1)}>Siguiente</Button>
        </div>
      )}

{/* Modal de Formulario (Crear/Editar) */}
      <Modal
        isOpen={showFormModal}
        onClose={() => setShowFormModal(false)}
        title={editingUnidad ? 'Editar Unidad' : 'Nueva Unidad'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {feedback && (
            <div className={feedback.type === 'error' ? 'alert-error' : 'alert-success'}>
              {feedback.message}
            </div>
          )}

          <div>
            <label className="block text-white/70 text-sm mb-2">Propietario *</label>
            <select
              className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 w-full"
              value={formData.propietario}
              onChange={(e) => handleInputChange('propietario', e.target.value)}
              required
              disabled={loadingPropietarios}
            >
              <option value="">Seleccionar propietario</option>
              {propietarios.map(prop => (
                <option key={prop.id} value={prop.id}>
                  {prop.nombre_completo || prop.user?.username} - {prop.documento_identidad}
                </option>
              ))}
            </select>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <Input
              label="Número de Unidad *"
              value={formData.numero}
              onChange={(e) => handleInputChange('numero', e.target.value)}
              placeholder="Ej: 101, A-5"
              required
            />

            <Input
              label="Edificio"
              value={formData.edificio}
              onChange={(e) => handleInputChange('edificio', e.target.value)}
              placeholder="Ej: Torre A, Bloque B"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-white/70 text-sm mb-2">Tipo *</label>
              <select
                className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 w-full"
                value={formData.tipo}
                onChange={(e) => handleInputChange('tipo', e.target.value)}
                required
              >
                <option value="casa">Casa</option>
                <option value="departamento">Departamento</option>
                <option value="penthouse">Penthouse</option>
              </select>
            </div>

            <Input
              label="Piso"
              type="number"
              value={formData.piso}
              onChange={(e) => handleInputChange('piso', e.target.value)}
              placeholder="Ej: 1, 2, 3"
            />
          </div>

          <div>
            <label className="block text-white/70 text-sm mb-2">Características</label>
            <textarea
              className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 w-full"
              value={formData.caracteristicas}
              onChange={(e) => handleInputChange('caracteristicas', e.target.value)}
              placeholder="Ej: 2 habitaciones, 1 baño, cocina integrada"
              rows="3"
            />
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowFormModal(false)}
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={submitting}
            >
              {submitting ? 'Guardando...' : (editingUnidad ? 'Actualizar' : 'Crear')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal de Confirmación de Eliminación */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Eliminar Unidad"
        size="sm"
      >
        <div className="space-y-4">
          {feedback && (
            <div className={feedback.type === 'error' ? 'alert-error' : 'alert-success'}>
              {feedback.message}
            </div>
          )}

          <p className="text-white/80">
            ¿Estás seguro de que deseas eliminar la unidad <strong>{deletingUnidad?.numero}</strong>?
            Esta acción no se puede deshacer.
          </p>

          <div className="flex gap-3 justify-end pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowDeleteModal(false)}
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={handleDelete}
              disabled={submitting}
            >
              {submitting ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default UnidadesPage;