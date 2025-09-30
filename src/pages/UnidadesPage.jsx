import React, { useState } from 'react';
import usePagedList from '../hooks/usePagedList';
import axiosInstance from '../api/axiosConfig';
import PageHeader from '../components/common/PageHeader';
import Table from '../components/common/Table';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Modal from '../components/common/Modal';
import Badge from '../components/common/Badge';
import { Building, RefreshCw, Filter, Eye, Ruler, User, Home } from 'lucide-react';

// Gestión de Unidades (Admin)
// Endpoints: GET /unidades/ , GET /unidades/{id}/ (detalle si fuera necesario), (crear/editar sería POST/PATCH pero aún no implementado aquí)

const UnidadesPage = () => {
  const { items, loading, error, page, setPage, count, setFilter, filters, refresh } = usePagedList({
    endpoint: '/unidades/',
    pageSize: 20,
    initialFilters: { tipo_unidad: '', search: '' }
  });

  const [showFilters, setShowFilters] = useState(false);
  const [selected, setSelected] = useState(null);
  const [details, setDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const fetchDetails = async (unidad) => {
    setSelected(unidad);
    setLoadingDetails(true);
    setDetails(null);
    setFeedback(null);
    try {
      const resp = await axiosInstance.get(`/unidades/${unidad.id}/`);
      setDetails(resp.data);
    } catch (err) {
      setFeedback({ type: 'error', message: err.response?.data?.detail || 'Error al cargar detalles' });
    } finally { setLoadingDetails(false); }
  };

  const tipoVariant = (tipo) => {
    if (!tipo) return 'neutral';
    switch (tipo.toLowerCase()) {
      case 'apartamento': return 'info';
      case 'casa': return 'success';
      case 'local': return 'warning';
      case 'oficina': return 'neutral';
      default: return 'default';
    }
  };

  const columns = [
    { key: 'id', header: 'ID', render: (v) => <span className="text-xs text-white/60">{v}</span> },
    { key: 'numero_unidad', header: 'Unidad', render: (v) => v || '—' },
    { key: 'edificio', header: 'Edificio', render: (v) => v || '—' },
    { key: 'tipo_unidad', header: 'Tipo', render: (v) => <Badge variant={tipoVariant(v)}>{v || '—'}</Badge> },
    { key: 'area_m2', header: 'Área (m²)', render: (v) => v ? Number(v).toFixed(2) : '—' },
    { key: 'propietario_nombre', header: 'Propietario', render: (v) => v || '—' },
    { key: 'actions', header: 'Acciones', className: 'text-right', cellClassName: 'text-right', render: (_, row) => (
      <Button variant="icon" icon={Eye} onClick={() => fetchDetails(row)} title="Ver detalles" />
    ) }
  ];

  const headerActions = (
    <div className="flex gap-2">
      <Button variant="secondary" icon={Filter} onClick={() => setShowFilters(v => !v)}>Filtros</Button>
      <Button variant="secondary" icon={RefreshCw} onClick={refresh}>Refrescar</Button>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in ">
      <PageHeader
        title="Unidades"
        description="Listado de unidades habitacionales"
        icon={Building}
        actions={headerActions}
      />

      {showFilters && (
        <div className="card-minimal p-4 space-y-4 animate-slide-down">
          <div className="grid md:grid-cols-4 gap-4">
            <Input
              label="Buscar (número/edificio)"
              value={filters.search || ''}
              onChange={(e) => setFilter('search', e.target.value)}
              placeholder="Buscar..."
            />
            <select
              className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={filters.tipo_unidad}
              onChange={(e) => setFilter('tipo_unidad', e.target.value)}
            >
              <option value="">Tipo (Todos)</option>
              <option value="apartamento">Apartamento</option>
              <option value="casa">Casa</option>
              <option value="local">Local</option>
              <option value="oficina">Oficina</option>
            </select>
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

      <Modal
        isOpen={!!selected}
        onClose={() => { setSelected(null); setDetails(null); setFeedback(null); }}
        title={selected ? `Unidad ${selected.numero_unidad || selected.id}` : ''}
        size="lg"
      >
        {loadingDetails && (
          <div className="py-8 text-center text-white/70">Cargando detalles...</div>
        )}
        {feedback && (
          <div className={feedback.type === 'error' ? 'alert-error' : 'alert-success'}>{feedback.message}</div>
        )}
        {details && (
          <div className="grid grid-cols-2 gap-4 text-sm text-white/80">
            <div>
              <label className="block text-white/50 mb-1">Número</label>
              <p>{details.numero_unidad || '—'}</p>
            </div>
            <div>
              <label className="block text-white/50 mb-1">Edificio</label>
              <p>{details.edificio || '—'}</p>
            </div>
            <div>
              <label className="block text-white/50 mb-1">Tipo</label>
              <p className="flex items-center gap-2"><Home className="w-4 h-4" /> {details.tipo_unidad || '—'}</p>
            </div>
            <div>
              <label className="block text-white/50 mb-1">Área</label>
              <p className="flex items-center gap-2"><Ruler className="w-4 h-4" /> {details.area_m2 ? `${details.area_m2} m²` : '—'}</p>
            </div>
            <div className="col-span-2">
              <label className="block text-white/50 mb-1">Propietario</label>
              <p className="flex items-center gap-2"><User className="w-4 h-4" /> {details.propietario_nombre || '—'}</p>
            </div>
            {details.created_at && (
              <div className="col-span-2">
                <label className="block text-white/50 mb-1">Registrada</label>
                <p>{new Date(details.created_at).toLocaleDateString('es-ES')}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default UnidadesPage;