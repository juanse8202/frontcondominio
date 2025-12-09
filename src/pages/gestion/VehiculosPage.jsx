import React, { useState, useEffect } from 'react';
import usePagedList from '../../hooks/usePagedList.jsx';
import useVehiculosData from '../../hooks/useVehiculosData.jsx';
import axiosInstance from '../../api/axiosConfig.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';
import Table from '../../components/common/Table.jsx';
import Button from '../../components/common/Button.jsx';
import Input from '../../components/common/Input.jsx';
import Modal from '../../components/common/Modal.jsx';
import Badge from '../../components/common/Badge.jsx';
import { Car, RefreshCw, Filter, QrCode, Eye, Plus } from 'lucide-react';

// Gestión de Vehículos (Admin)

const VehiculosPage = () => {
  const { items, loading, error, page, setPage, count, setFilter, filters, refresh, updateItem } = usePagedList({
    endpoint: '/vehiculos/',
    pageSize: 20,
    initialFilters: { search: '' }
  });
  const { marcas, tipos, colores, getModelosPorMarca } = useVehiculosData();

  const [showFilters, setShowFilters] = useState(false);
  const [modelosDisponibles, setModelosDisponibles] = useState([]);
  const [generatingId, setGeneratingId] = useState(null);
  const [qrVehicle, setQrVehicle] = useState(null);
  const [feedback, setFeedback] = useState(null);

  // Estados para propietarios y crear/editar vehículo
  const [propietarios, setPropietarios] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [newVehicle, setNewVehicle] = useState({
    placa: '',
    marca: '',
    modelo: '',
    color: '',
    tipo: '',
    año: '',
    propietario: '',
    activo: true
  });
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);

  // Cargar lista de propietarios al abrir el modal de crear o editar
  useEffect(() => {
    if ((showCreateModal || showEditModal) && propietarios.length === 0) {
      axiosInstance.get('/propietarios/?page_size=1000').then(resp => {
        setPropietarios(resp.data.results || resp.data);
      });
    }
  }, [showCreateModal, showEditModal]);

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
      tipo: '',
      año: '',
      propietario: '',
      activo: true
    });
    setModelosDisponibles([]);
    setFeedback(null);
  };

  // Abrir modal de edición
  const openEditModal = (vehiculo) => {
    setEditingVehicle(vehiculo);
    setNewVehicle({
      placa: vehiculo.placa || '',
      marca: vehiculo.marca || '',
      modelo: vehiculo.modelo || '',
      color: vehiculo.color || '',
      tipo: vehiculo.tipo || '',
      año: vehiculo.año || '',
      propietario: vehiculo.propietario || '',
      activo: vehiculo.activo !== undefined ? vehiculo.activo : true
    });
    setModelosDisponibles(getModelosPorMarca(vehiculo.marca || ''));
    setShowEditModal(true);
    setFeedback(null);
  };

  // Permitir ingresar el ID manualmente o seleccionar de la lista
  const handlePropietarioChange = (e) => {
    setNewVehicle(v => ({ ...v, propietario: e.target.value }));
  };

  // Actualizar modelos cuando cambia la marca
  const handleMarcaChange = (e) => {
    const marca = e.target.value;
    setNewVehicle(v => ({ ...v, marca, modelo: '' }));
    setModelosDisponibles(getModelosPorMarca(marca));
  };

  // ...existing code...

const handleCreateVehicle = async () => {
  setCreating(true);
  setFeedback(null);
  try {
    const payload = {
      placa: newVehicle.placa,
      marca: newVehicle.marca,
      modelo: newVehicle.modelo,
      color: newVehicle.color,
      tipo: newVehicle.tipo || null,
      año: newVehicle.año ? parseInt(newVehicle.año) : null,
      propietario: Number(newVehicle.propietario),
      activo: newVehicle.activo
    };
    await axiosInstance.post('/vehiculos/', payload);
    refresh();
    setShowCreateModal(false);
    setFeedback({ type: 'success', message: 'Vehículo creado correctamente' });
  } catch (err) {
    const errorMsg = err.response?.data?.detail || JSON.stringify(err.response?.data) || 'Error al crear vehículo';
    setFeedback({ type: 'error', message: errorMsg });
  } finally {
    setCreating(false);
  }
};

const handleUpdateVehicle = async () => {
  setUpdating(true);
  setFeedback(null);
  try {
    const payload = {
      placa: newVehicle.placa,
      marca: newVehicle.marca,
      modelo: newVehicle.modelo,
      color: newVehicle.color,
      tipo: newVehicle.tipo || null,
      año: newVehicle.año ? parseInt(newVehicle.año) : null,
      propietario: Number(newVehicle.propietario),
      activo: newVehicle.activo
    };
    await axiosInstance.patch(`/vehiculos/${editingVehicle.id}/`, payload);
    refresh();
    setShowEditModal(false);
    setFeedback({ type: 'success', message: 'Vehículo actualizado correctamente' });
  } catch (err) {
    const errorMsg = err.response?.data?.detail || JSON.stringify(err.response?.data) || 'Error al actualizar vehículo';
    setFeedback({ type: 'error', message: errorMsg });
  } finally {
    setUpdating(false);
  }
};

// ...existing code...

const columns = [
    { key: 'id', header: 'ID', className: 'w-16', render: (v) => <span className="text-xs text-white/60">#{v}</span> },
    { key: 'placa', header: 'Placa', className: 'w-28', render: (v) => <span className="font-semibold">{v || '—'}</span> },
    { key: 'marca', header: 'Marca', className: 'w-32', render: (v) => v || '—' },
    { key: 'modelo', header: 'Modelo', className: 'w-32', render: (v) => v || '—' },
    { key: 'color', header: 'Color', className: 'w-24', render: (v) => v || '—' },
    { key: 'tipo_display', header: 'Tipo', className: 'w-28', render: (v) => <Badge variant="info">{v || '—'}</Badge> },
    { key: 'propietario_nombre', header: 'Propietario', render: (v) => v || '—' },
    { key: 'activo', header: 'Estado', className: 'w-24', render: (v) => v ? <Badge variant="success">Activo</Badge> : <Badge variant="error">Inactivo</Badge> },
    { key: 'qr_code_url', header: 'QR', className: 'w-32', render: (v, row) => (
        v ? (
          <Button variant="secondary" size="xs" onClick={() => openQr(row)}>Ver</Button>
        ) : (
          <span className="text-white/30 text-xs">No generado</span>
        )
      )
    },
    { key: 'actions', header: 'Acciones', className: 'text-right w-40', cellClassName: 'text-right', render: (_, row) => (
        <div className="flex justify-end gap-2">
          <Button
            variant="secondary"
            size="xs"
            onClick={() => openEditModal(row)}
            title="Editar"
          >
            Editar
          </Button>
          <Button
            variant="secondary"
            size="xs"
            icon={QrCode}
            disabled={generatingId === row.id}
            onClick={() => generateQr(row)}
            title={row.qr_code_url ? 'Regenerar QR' : 'Generar QR'}
          >
            {generatingId === row.id ? '...' : 'QR'}
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
            placeholder="Ej: ABC-123"
          />
          
          <div>
            <label className="block text-white/70 text-sm mb-2">Marca *</label>
            <select
              className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 w-full"
              value={newVehicle.marca}
              onChange={handleMarcaChange}
            >
              <option value="">Seleccionar marca</option>
              {marcas.map(marca => (
                <option key={marca.nombre} value={marca.nombre}>{marca.nombre}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-white/70 text-sm mb-2">Modelo *</label>
            <select
              className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 w-full"
              value={newVehicle.modelo}
              onChange={e => setNewVehicle(v => ({ ...v, modelo: e.target.value }))}
              disabled={!newVehicle.marca}
            >
              <option value="">Seleccionar modelo</option>
              {modelosDisponibles.map(modelo => (
                <option key={modelo} value={modelo}>{modelo}</option>
              ))}
            </select>
            {!newVehicle.marca && (
              <p className="text-white/40 text-xs mt-1">Selecciona una marca primero</p>
            )}
          </div>

          <div>
            <label className="block text-white/70 text-sm mb-2">Color *</label>
            <select
              className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 w-full"
              value={newVehicle.color}
              onChange={e => setNewVehicle(v => ({ ...v, color: e.target.value }))}
            >
              <option value="">Seleccionar color</option>
              {colores.map(color => (
                <option key={color} value={color}>{color}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-white/70 text-sm mb-2">Tipo</label>
            <select
              className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 w-full"
              value={newVehicle.tipo || ''}
              onChange={e => setNewVehicle(v => ({ ...v, tipo: e.target.value }))}
            >
              <option value="">Seleccionar tipo</option>
              {tipos.map(tipo => (
                <option key={tipo.value} value={tipo.value}>{tipo.label}</option>
              ))}
            </select>
          </div>

<Input
            label="Año"
            type="number"
            value={newVehicle.año}
            onChange={e => setNewVehicle(v => ({ ...v, año: e.target.value }))}
            placeholder="Ej: 2023"
            min="1900"
            max={new Date().getFullYear() + 1}
          />

          <div>
            <label className="block text-white/70 text-sm mb-2">Propietario *</label>
            <select
              className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 w-full"
              value={newVehicle.propietario}
              onChange={handlePropietarioChange}
            >
              <option value="">Seleccione un propietario</option>
              {propietarios.map(p => (
                <option key={p.id} value={p.id}>
                  {p.nombre_completo || p.user?.username || `ID ${p.id}`} - {p.documento_identidad}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="activo"
              checked={newVehicle.activo}
              onChange={e => setNewVehicle(v => ({ ...v, activo: e.target.checked }))}
              className="w-4 h-4 text-blue-600 bg-white/10 border-white/20 rounded focus:ring-blue-500"
            />
            <label htmlFor="activo" className="text-white/70 text-sm">Vehículo activo</label>
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
                !newVehicle.propietario
              }
            >
              {creating ? 'Creando...' : 'Crear'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal para editar vehículo */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Editar vehículo"
        size="lg"
      >
        <div className="space-y-4">
          {feedback && (
            <div className={feedback.type === 'error' ? 'alert-error' : 'alert-success'}>
              {feedback.message}
            </div>
          )}

          <Input
            label="Placa"
            value={newVehicle.placa}
            onChange={e => setNewVehicle(v => ({ ...v, placa: e.target.value }))}
            placeholder="Ej: ABC-123"
          />
          
          <div>
            <label className="block text-white/70 text-sm mb-2">Marca *</label>
            <select
              className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 w-full"
              value={newVehicle.marca}
              onChange={handleMarcaChange}
            >
              <option value="">Seleccionar marca</option>
              {marcas.map(marca => (
                <option key={marca.nombre} value={marca.nombre}>{marca.nombre}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-white/70 text-sm mb-2">Modelo *</label>
            <select
              className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 w-full"
              value={newVehicle.modelo}
              onChange={e => setNewVehicle(v => ({ ...v, modelo: e.target.value }))}
              disabled={!newVehicle.marca}
            >
              <option value="">Seleccionar modelo</option>
              {modelosDisponibles.map(modelo => (
                <option key={modelo} value={modelo}>{modelo}</option>
              ))}
            </select>
            {!newVehicle.marca && (
              <p className="text-white/40 text-xs mt-1">Selecciona una marca primero</p>
            )}
          </div>

          <div>
            <label className="block text-white/70 text-sm mb-2">Color *</label>
            <select
              className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 w-full"
              value={newVehicle.color}
              onChange={e => setNewVehicle(v => ({ ...v, color: e.target.value }))}
            >
              <option value="">Seleccionar color</option>
              {colores.map(color => (
                <option key={color} value={color}>{color}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-white/70 text-sm mb-2">Tipo</label>
            <select
              className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 w-full"
              value={newVehicle.tipo || ''}
              onChange={e => setNewVehicle(v => ({ ...v, tipo: e.target.value }))}
            >
              <option value="">Seleccionar tipo</option>
              {tipos.map(tipo => (
                <option key={tipo.value} value={tipo.value}>{tipo.label}</option>
              ))}
            </select>
          </div>

          <Input
            label="Año"
            type="number"
            value={newVehicle.año}
            onChange={e => setNewVehicle(v => ({ ...v, año: e.target.value }))}
            placeholder="Ej: 2023"
            min="1900"
            max={new Date().getFullYear() + 1}
          />

          <div>
            <label className="block text-white/70 text-sm mb-2">Propietario *</label>
            <select
              className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 w-full"
              value={newVehicle.propietario}
              onChange={handlePropietarioChange}
            >
              <option value="">Seleccione un propietario</option>
              {propietarios.map(p => (
                <option key={p.id} value={p.id}>
                  {p.nombre_completo || p.user?.username || `ID ${p.id}`} - {p.documento_identidad}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="activo-edit"
              checked={newVehicle.activo}
              onChange={e => setNewVehicle(v => ({ ...v, activo: e.target.checked }))}
              className="w-4 h-4 text-blue-600 bg-white/10 border-white/20 rounded focus:ring-blue-500"
            />
            <label htmlFor="activo-edit" className="text-white/70 text-sm">Vehículo activo</label>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowEditModal(false)}>Cancelar</Button>
            <Button
              variant="primary"
              onClick={handleUpdateVehicle}
              disabled={
                updating ||
                !newVehicle.placa ||
                !newVehicle.marca ||
                !newVehicle.modelo ||
                !newVehicle.propietario
              }
            >
              {updating ? 'Actualizando...' : 'Actualizar'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default VehiculosPage;