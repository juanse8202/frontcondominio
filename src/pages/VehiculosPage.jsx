import React, { useState, useEffect } from 'react';
import usePagedList from '../hooks/usePagedList';
import axiosInstance from '../api/axiosConfig';
import PageHeader from '../components/common/PageHeader';
import Table from '../components/common/Table';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Modal from '../components/common/Modal';
import Badge from '../components/common/Badge';
import { Car, RefreshCw, Filter, QrCode, Eye, Plus } from 'lucide-react';

// Gestión de Vehículos (Admin)

const VehiculosPage = () => {
  const { items, loading, error, page, setPage, count, setFilter, filters, refresh, updateItem } = usePagedList({
    endpoint: '/vehiculos/',
    pageSize: 20,
    initialFilters: { search: '' }
  });

  const [showFilters, setShowFilters] = useState(false);
  const [generatingId, setGeneratingId] = useState(null);
  const [qrVehicle, setQrVehicle] = useState(null);
  const [feedback, setFeedback] = useState(null);

  // Estados para propietarios y crear vehículo
  const [propietarios, setPropietarios] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newVehicle, setNewVehicle] = useState({
    placa: '',
    marca: '',
    modelo: '',
    color: '',
    tipo_vehiculo: '',
    propietario: ''
  });
  const [creating, setCreating] = useState(false);

  // Cargar lista de propietarios al abrir el modal de crear
  useEffect(() => {
    if (showCreateModal && propietarios.length === 0) {
      axiosInstance.get('/propietarios/?page_size=1000').then(resp => {
        setPropietarios(resp.data.results || resp.data);
      });
    }
  }, [showCreateModal]);

  const generateQr = async (vehiculo) => {
    setGeneratingId(vehiculo.id);
    setFeedback(null);
    try {
      const resp = await axiosInstance.post(`/vehiculos/${vehiculo.id}/generate_qr/`);
      const data = resp.data || {};
      const qrUrl = data.qr_code_url || data.qr || data.qr_image_url || vehiculo.qr_code_url;
      updateItem(vehiculo.id, { ...data, qr_code_url: qrUrl });
      setQrVehicle({ ...vehiculo, ...data, qr_code_url: qrUrl });
      setFeedback({ type: 'success', message: 'QR generado correctamente' });
    } catch (err) {
      setFeedback({ type: 'error', message: err.response?.data?.detail || 'Error al generar QR' });
    } finally {
      setGeneratingId(null);
    }
  };

  const openQr = (vehiculo) => {
    setQrVehicle(vehiculo);
    setFeedback(null);
  };

  // Crear vehículo
  const openCreateModal = () => {
    setShowCreateModal(true);
    setNewVehicle({
      placa: '',
      marca: '',
      modelo: '',
      color: '',
      tipo_vehiculo: '',
      propietario: ''
    });
    setFeedback(null);
  };

  // Permitir ingresar el ID manualmente o seleccionar de la lista
  const handlePropietarioChange = (e) => {
    setNewVehicle(v => ({ ...v, propietario: e.target.value }));
  };

  // ...existing code...

const handleCreateVehicle = async () => {
  setCreating(true);
  setFeedback(null);
  try {
    // Solo enviar el id del propietario como número
    const { propietario, ...rest } = newVehicle;
    const payload = {
      ...rest,
      propietario: propietario ? Number(propietario) : undefined
    };
    await axiosInstance.post('/vehiculos/', payload);
    refresh();
    setShowCreateModal(false);
    setFeedback({ type: 'success', message: 'Vehículo creado correctamente' });
  } catch (err) {
    setFeedback({ type: 'error', message: err.response?.data?.detail || 'Error al crear vehículo' });
  } finally {
    setCreating(false);
  }
};

// ...existing code...

  const columns = [
    { key: 'id', header: 'ID', render: (v) => <span className="text-xs text-white/60">{v}</span> },
    { key: 'placa', header: 'Placa', render: (v) => v || '—' },
    { key: 'marca', header: 'Marca', render: (v) => v || '—' },
    { key: 'modelo', header: 'Modelo', render: (v) => v || '—' },
    { key: 'color', header: 'Color', render: (v) => v || '—' },
    { key: 'tipo_vehiculo', header: 'Tipo', render: (v) => <Badge variant="info">{v || '—'}</Badge> },
    { key: 'propietario_nombre', header: 'Propietario', render: (v) => v || '—' },
    { key: 'activo', header: 'Estado', render: (v) => v ? <Badge variant="success">Activo</Badge> : <Badge variant="error">Inactivo</Badge> },
    { key: 'qr_code_url', header: 'QR', render: (v, row) => (
        v ? (
          <Button variant="secondary" size="xs" onClick={() => openQr(row)}>Ver</Button>
        ) : (
          <span className="text-white/30 text-xs">No generado</span>
        )
      )
    },
    { key: 'actions', header: 'Acciones', className: 'text-right', cellClassName: 'text-right', render: (_, row) => (
        <div className="flex justify-end gap-2">
          <Button
            variant="secondary"
            size="xs"
            icon={QrCode}
            disabled={generatingId === row.id}
            onClick={() => generateQr(row)}
            title={row.qr_code_url ? 'Regenerar QR' : 'Generar QR'}
          >
            {generatingId === row.id ? 'Generando...' : (row.qr_code_url ? 'Regenerar' : 'Generar')}
          </Button>
        </div>
      )
    }
  ];

  const headerActions = (
    <div className="flex gap-2">
      <Button variant="primary" icon={Plus} onClick={openCreateModal}>Nuevo vehículo</Button>
      <Button variant="secondary" icon={Filter} onClick={() => setShowFilters(v => !v)}>Filtros</Button>
      <Button variant="secondary" icon={RefreshCw} onClick={refresh}>Refrescar</Button>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in ">
      <PageHeader
        title="Vehículos"
        description="Listado de vehículos registrados"
        icon={Car}
        actions={headerActions}
      />

      {showFilters && (
        <div className="card-minimal p-4 space-y-4 animate-slide-down">
          <div className="grid md:grid-cols-4 gap-4">
            <Input
              label="Buscar (placa/marca/modelo)"
              value={filters.search || ''}
              onChange={(e) => setFilter('search', e.target.value)}
              placeholder="Buscar..."
            />
          </div>
        </div>
      )}

      {feedback && (
        <div className={feedback.type === 'success' ? 'alert-success' : 'alert-error'}>{feedback.message}</div>
      )}
      {error && <div className="alert-error">{error}</div>}

      <Table
        columns={columns}
        data={items}
        loading={loading}
        emptyMessage="No hay vehículos registrados"
      />

      {count > 20 && (
        <div className="flex justify-end gap-2 items-center text-white/60 text-sm">
          <Button variant="secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>Anterior</Button>
          <span>Página {page}</span>
          <Button variant="secondary" disabled={(page * 20) >= count} onClick={() => setPage(page + 1)}>Siguiente</Button>
        </div>
      )}

      {/* Modal para mostrar QR */}
      <Modal
        isOpen={!!qrVehicle}
        onClose={() => setQrVehicle(null)}
        title={qrVehicle ? `QR Vehículo ${qrVehicle.placa || qrVehicle.id}` : ''}
        size="md"
      >
        {qrVehicle && (
          <div className="space-y-4">
            {qrVehicle.qr_code_url ? (
              <div className="flex flex-col items-center gap-3">
                <img
                  src={qrVehicle.qr_code_url}
                  alt="QR Código"
                  className="w-48 h-48 object-contain border border-white/10 rounded-lg bg-white p-2"
                />
                <Button variant="secondary" icon={Eye} onClick={() => window.open(qrVehicle.qr_code_url, '_blank')}>Abrir en pestaña</Button>
              </div>
            ) : (
              <p className="text-white/60 text-sm">Este vehículo aún no tiene un QR generado.</p>
            )}
            <div className="grid grid-cols-2 gap-4 text-sm text-white/80">
              <div>
                <label className="block text-white/50 mb-1">Placa</label>
                <p>{qrVehicle.placa || '—'}</p>
              </div>
              <div>
                <label className="block text-white/50 mb-1">Marca / Modelo</label>
                <p>{qrVehicle.marca || '—'} {qrVehicle.modelo || ''}</p>
              </div>
              <div>
                <label className="block text-white/50 mb-1">Propietario</label>
                <p>{qrVehicle.propietario_nombre || '—'}</p>
              </div>
              <div>
                <label className="block text-white/50 mb-1">Estado</label>
                <p>{qrVehicle.activo ? 'Activo' : 'Inactivo'}</p>
              </div>
            </div>
            <div className="flex justify-end">
              <Button variant="secondary" onClick={() => setQrVehicle(null)}>Cerrar</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal para crear vehículo */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Nuevo vehículo"
        size="sm"
      >
        <div className="space-y-4">
          <Input
            label="Placa"
            value={newVehicle.placa}
            onChange={e => setNewVehicle(v => ({ ...v, placa: e.target.value }))}
          />
          <Input
            label="Marca"
            value={newVehicle.marca}
            onChange={e => setNewVehicle(v => ({ ...v, marca: e.target.value }))}
          />
          <Input
            label="Modelo"
            value={newVehicle.modelo}
            onChange={e => setNewVehicle(v => ({ ...v, modelo: e.target.value }))}
          />
          <Input
            label="Color"
            value={newVehicle.color}
            onChange={e => setNewVehicle(v => ({ ...v, color: e.target.value }))}
          />
          <Input
            label="Tipo de vehículo"
            value={newVehicle.tipo_vehiculo}
            onChange={e => setNewVehicle(v => ({ ...v, tipo_vehiculo: e.target.value }))}
          />
          <label className="block text-white/80 mb-2">Propietario (ID o seleccione)</label>
          <div className="flex gap-2">
            <Input
              type="number"
              min="1"
              placeholder="ID propietario"
              value={newVehicle.propietario}
              onChange={handlePropietarioChange}
              style={{ width: 120 }}
            />
            <select
              className="input w-full"
              value={newVehicle.propietario}
              onChange={handlePropietarioChange}
            >
              <option value="">Seleccione un propietario</option>
              {propietarios.map(p => (
                <option key={p.id} value={p.id}>
                  {p.user?.first_name
                    ? `${p.user.first_name} ${p.user.last_name} (${p.user.username})`
                    : p.user?.username || `ID ${p.id}`}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>Cancelar</Button>
            <Button
              variant="primary"
              onClick={handleCreateVehicle}
              disabled={
                creating ||
                !newVehicle.placa ||
                !newVehicle.marca ||
                !newVehicle.modelo ||
                !newVehicle.tipo_vehiculo ||
                !newVehicle.propietario
              }
            >
              {creating ? 'Creando...' : 'Crear'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default VehiculosPage;