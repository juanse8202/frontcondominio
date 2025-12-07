import React, { useState } from 'react';
import usePagedList from '../../hooks/usePagedList.jsx';
import axiosInstance from '../../api/axiosConfig.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';
import Table from '../../components/common/Table.jsx';
import Button from '../../components/common/Button.jsx';
import Input from '../../components/common/Input.jsx';
import Modal from '../../components/common/Modal.jsx';
import Badge from '../../components/common/Badge.jsx';
import Select from '../../components/common/Select.jsx';
import { Wallet, RefreshCw, Filter, Plus, Eye, Layers, PencilLine, DollarSign } from 'lucide-react';

// Página Administrativa de Expensas
// Basada en especificación ADMIN_EXPENSAS_PAGOS.md
// Se mantiene separado del componente de propietario (`ExpensasList`) para evitar mezclar lógicas.

// Utilidades
const formatCurrency = (v) => `$${Number(v || 0).toFixed(2)}`;
const formatMonth = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' });
};

const computeEstado = (e) => {
  if (e.pagado) return 'pagada';
  if (e.esta_vencida) return 'vencida';
  const saldo = Number(e.saldo_pendiente || 0);
  const total = Number(e.total || 0);
  if (saldo > 0 && saldo < total) return 'parcial';
  return 'pendiente';
};

const estadoBadge = (estado) => {
  switch (estado) {
    case 'pagada': return <Badge variant="success">Pagada</Badge>;
    case 'vencida': return <Badge variant="error">Vencida</Badge>;
    case 'parcial': return <Badge variant="info">Parcial</Badge>;
    default: return <Badge variant="warning">Pendiente</Badge>;
  }
};

const ExpensasPage = () => {
  const { items, loading, error, page, setPage, count, setFilter, filters, refresh, updateItem, addItem } = usePagedList({
    endpoint: '/expensas/',
    pageSize: 20,
    // Filtros según doc: ?propietario_id, ?pagado, ?mes, ?vencida
    initialFilters: { propietario_id: '', pagado: '', mes: '', vencida: '' }
  });

  // Estados UI
  const [showFilters, setShowFilters] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showMassive, setShowMassive] = useState(false);
  const [saving, setSaving] = useState(false);
  const [massiveSaving, setMassiveSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [selected, setSelected] = useState(null); // expensa seleccionada
  const [detalle, setDetalle] = useState(null);
  const [loadingDetalle, setLoadingDetalle] = useState(false);
  const [editing, setEditing] = useState(false);
  const [creatingPago, setCreatingPago] = useState(false);
  const [pagos, setPagos] = useState([]);
  const [loadingPagos, setLoadingPagos] = useState(false);
  const [pagoSaving, setPagoSaving] = useState(false);

  // Formularios
  const [formData, setFormData] = useState({
    propietario: '',
    mes: '', // YYYY-MM
    cuota_basica: '',
    multas: '',
    fecha_vencimiento: '', // YYYY-MM-DD
    observaciones: ''
  });

  const [editData, setEditData] = useState({ multas: '', observaciones: '' });
  const [massiveData, setMassiveData] = useState({ mes: '', cuota_basica: '' });
  const [pagoData, setPagoData] = useState({ monto: '', metodo_pago: 'transferencia', comprobante: '', notas: '' });

  // Helpers
  const monthToFirstDay = (m) => (m && /^\d{4}-\d{2}$/.test(m) ? `${m}-01` : m);

  const loadDetalle = async (exp) => {
    setSelected(exp);
    setDetalle(null);
    setFeedback(null);
    setLoadingDetalle(true);
    try {
      const resp = await axiosInstance.get(`/expensas/${exp.id}/`);
      setDetalle(resp.data);
      // Pre-cargar datos edición
      setEditData({ multas: resp.data.multas || '', observaciones: resp.data.observaciones || '' });
      // Cargar pagos asociados
      fetchPagos(resp.data.id);
    } catch (err) {
      setDetalle(exp);
      setFeedback({ type: 'error', message: 'No se pudo cargar detalle completo (vista parcial).' });
    } finally { setLoadingDetalle(false); }
  };

  const fetchPagos = async (expensaId) => {
    setLoadingPagos(true);
    try {
      const resp = await axiosInstance.get('/pagos/', { params: { expensa: expensaId } });
      const data = resp.data?.results || (Array.isArray(resp.data) ? resp.data : []);
      setPagos(data);
    } catch (e) {
      setPagos([]);
    } finally { setLoadingPagos(false); }
  };

  // Crear expensa individual
  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true); setFeedback(null);
    try {
      if (!/^\d{4}-\d{2}$/.test(formData.mes)) throw new Error('Mes inválido (formato YYYY-MM)');
      const payload = {
        propietario: Number(formData.propietario),
        mes_referencia: monthToFirstDay(formData.mes),
        cuota_basica: formData.cuota_basica || '0',
        multas: formData.multas ? formData.multas : '0',
        fecha_vencimiento: formData.fecha_vencimiento || undefined,
        observaciones: formData.observaciones?.trim() || undefined,
      };
      const resp = await axiosInstance.post('/expensas/', payload);
      addItem(resp.data);
      setFeedback({ type: 'success', message: 'Expensa creada correctamente' });
      setFormData({ propietario: '', mes: '', cuota_basica: '', multas: '', fecha_vencimiento: '', observaciones: '' });
      setTimeout(() => { setShowForm(false); setFeedback(null); }, 1000);
    } catch (err) {
      setFeedback({ type: 'error', message: err.response?.data?.detail || Object.values(err.response?.data || {})[0]?.[0] || err.message || 'Error al crear expensa' });
    } finally { setSaving(false); }
  };

  // Generar masivas
  const handleMassive = async (e) => {
    e.preventDefault();
    setMassiveSaving(true); setFeedback(null);
    try {
      if (!/^\d{4}-\d{2}$/.test(massiveData.mes)) throw new Error('Mes inválido (formato YYYY-MM)');
      const payload = {
        mes_referencia: monthToFirstDay(massiveData.mes),
        cuota_basica: massiveData.cuota_basica || '0'
      };
      const resp = await axiosInstance.post('/expensas/generar_masivas/', payload);
      setFeedback({ type: 'success', message: resp.data?.detail || 'Expensas generadas' });
      refresh();
      setTimeout(() => { setShowMassive(false); setFeedback(null); }, 1200);
    } catch (err) {
      setFeedback({ type: 'error', message: err.response?.data?.detail || Object.values(err.response?.data || {})[0]?.[0] || err.message || 'Error en generación' });
    } finally { setMassiveSaving(false); }
  };

  // Guardar edición (multas / observaciones)
  const handleEdit = async (e) => {
    e.preventDefault();
    if (!detalle) return;
    setSaving(true); setFeedback(null);
    try {
      const payload = {
        multas: editData.multas || '0',
        observaciones: editData.observaciones || ''
      };
      const resp = await axiosInstance.patch(`/expensas/${detalle.id}/`, payload);
      setDetalle(d => ({ ...d, ...resp.data }));
      updateItem(detalle.id, resp.data);
      setFeedback({ type: 'success', message: 'Expensa actualizada' });
      setEditing(false);
    } catch (err) {
      setFeedback({ type: 'error', message: err.response?.data?.detail || 'Error al actualizar' });
    } finally { setSaving(false); }
  };

  // Crear pago desde expensa
  const handleCrearPago = async (e) => {
    e.preventDefault();
    if (!detalle) return;
    setPagoSaving(true); setFeedback(null);
    try {
      const montoFloat = parseFloat(pagoData.monto);
      if (isNaN(montoFloat) || montoFloat <= 0) throw new Error('Monto inválido');
      const saldo = Number(detalle.saldo_pendiente || 0);
      if (montoFloat > saldo) throw new Error(`El monto excede el saldo pendiente (${saldo.toFixed(2)})`);
      const payload = {
        expensa: detalle.id,
        monto: montoFloat.toFixed(2),
        metodo_pago: pagoData.metodo_pago,
        comprobante: pagoData.comprobante || undefined,
        notas: pagoData.notas || undefined
      };
      await axiosInstance.post('/pagos/', payload);
      setFeedback({ type: 'success', message: 'Pago registrado (pendiente de verificación)' });
      // Refrescar detalle y pagos
      await Promise.all([
        (async () => { const r = await axiosInstance.get(`/expensas/${detalle.id}/`); setDetalle(r.data); updateItem(detalle.id, r.data); })(),
        fetchPagos(detalle.id)
      ]);
      setPagoData({ monto: '', metodo_pago: 'transferencia', comprobante: '', notas: '' });
      setTimeout(() => { setCreatingPago(false); setFeedback(null); }, 1500);
    } catch (err) {
      setFeedback({ type: 'error', message: err.response?.data?.detail || err.message || 'Error al crear pago' });
    } finally { setPagoSaving(false); }
  };

  // Columnas listado principal
  const columns = [
    { key: 'id', header: 'ID', render: (v) => <span className="text-xs text-white/60">{v}</span> },
    { key: 'propietario_nombre', header: 'Propietario', render: (v) => v || '—' },
    { key: 'mes_referencia', header: 'Mes', render: (v) => formatMonth(v) },
    { key: 'total', header: 'Total', render: (v) => formatCurrency(v) },
    { key: 'total_pagado_verificado', header: 'Pagado', render: (v) => formatCurrency(v) },
    { key: 'saldo_pendiente', header: 'Saldo', render: (v) => <span className={Number(v) > 0 ? 'text-yellow-400 font-medium' : 'text-white/60'}>{formatCurrency(v)}</span> },
    { key: 'estado', header: 'Estado', render: (_, row) => estadoBadge(computeEstado(row)) },
    { key: 'actions', header: 'Acciones', className: 'text-right', cellClassName: 'text-right', render: (_, row) => (
      <div className="flex justify-end gap-2">
        <Button variant="secondary" size="xs" icon={Eye} onClick={() => loadDetalle(row)} title="Ver" />
        <Button variant="secondary" size="xs" icon={PencilLine} onClick={() => { loadDetalle(row); setEditing(true); }} title="Editar" />
        {Number(row.saldo_pendiente) > 0 && (
          <Button variant="secondary" size="xs" icon={DollarSign} onClick={() => { loadDetalle(row); setCreatingPago(true); }} title="Pago" />
        )}
      </div>
    ) }
  ];

  const headerActions = (
    <div className="flex gap-2 flex-wrap">
      <Button variant="primary" icon={Plus} onClick={() => { setShowForm(true); setFeedback(null); }}>Nueva</Button>
      <Button variant="secondary" icon={Layers} onClick={() => { setShowMassive(true); setFeedback(null); }}>Generar Masivas</Button>
      <Button variant="secondary" icon={Filter} onClick={() => setShowFilters(v => !v)}>Filtros</Button>
      <Button variant="secondary" icon={RefreshCw} onClick={refresh}>Refrescar</Button>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in ">
      <PageHeader
        title="Expensas (Administración)"
        description="Creación, control y seguimiento de expensas"
        icon={Wallet}
        actions={headerActions}
      />

      {showFilters && (
        <div className="card-minimal p-4 space-y-4 animate-slide-down">
          <div className="grid md:grid-cols-6 gap-4">
            <Input
              label="Propietario ID"
              value={filters.propietario_id || ''}
              onChange={(e) => setFilter('propietario_id', e.target.value)}
              placeholder="ID"
            />
            <Input
              label="Mes"
              type="month"
              value={filters.mes || ''}
              onChange={(e) => setFilter('mes', e.target.value)}
            />
            <Select
              label="Pagado"
              value={filters.pagado}
              onChange={(e) => setFilter('pagado', e.target.value)}
              options={[
                { value: '', label: 'Todos' },
                { value: 'true', label: 'Sí' },
                { value: 'false', label: 'No' }
              ]}
            />
            <Select
              label="Vencida"
              value={filters.vencida}
              onChange={(e) => setFilter('vencida', e.target.value)}
              options={[
                { value: '', label: 'Todas' },
                { value: 'true', label: 'Sí' },
                { value: 'false', label: 'No' }
              ]}
            />
          </div>
        </div>
      )}

      {feedback && !showForm && !showMassive && !selected && (
        <div className={feedback.type === 'success' ? 'alert-success' : 'alert-error'}>{feedback.message}</div>
      )}
      {error && <div className="alert-error">{error}</div>}

      <Table
        columns={columns}
        data={items}
        loading={loading}
        emptyMessage="No hay expensas registradas"
      />

      {count > 20 && (
        <div className="flex justify-end gap-2 items-center text-white/60 text-sm">
          <Button variant="secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>Anterior</Button>
          <span>Página {page}</span>
          <Button variant="secondary" disabled={(page * 20) >= count} onClick={() => setPage(page + 1)}>Siguiente</Button>
        </div>
      )}

      {/* Modal Crear Individual */}
      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title="Crear Expensa"
        size="lg"
      >
        <form onSubmit={handleCreate} className="space-y-5">
          {feedback && showForm && (
            <div className={feedback.type === 'success' ? 'alert-success' : 'alert-error'}>{feedback.message}</div>
          )}
          <div className="grid md:grid-cols-3 gap-4">
            <Input
              label="Propietario ID"
              value={formData.propietario}
              onChange={(e) => setFormData(d => ({ ...d, propietario: e.target.value }))}
              placeholder="ID"
              required
            />
            <Input
              label="Mes referencia"
              type="month"
              value={formData.mes}
              onChange={(e) => setFormData(d => ({ ...d, mes: e.target.value }))}
              required
            />
            <Input
              label="Cuota básica"
              type="number"
              step="0.01"
              min={0}
              value={formData.cuota_basica}
              onChange={(e) => setFormData(d => ({ ...d, cuota_basica: e.target.value }))}
              required
            />
            <Input
              label="Multas"
              type="number"
              step="0.01"
              min={0}
              value={formData.multas}
              onChange={(e) => setFormData(d => ({ ...d, multas: e.target.value }))}
            />
            <Input
              label="Fecha vencimiento"
              type="date"
              value={formData.fecha_vencimiento}
              onChange={(e) => setFormData(d => ({ ...d, fecha_vencimiento: e.target.value }))}
            />
            <div className="md:col-span-3 flex flex-col">
              <label className="block text-white/60 text-sm mb-1">Observaciones</label>
              <textarea
                value={formData.observaciones}
                onChange={(e) => setFormData(d => ({ ...d, observaciones: e.target.value }))}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 min-h-[90px]"
                placeholder="Notas / detalles"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setShowForm(false)} disabled={saving}>Cancelar</Button>
            <Button type="submit" loading={saving}>Crear</Button>
          </div>
          <p className="text-xs text-white/40 pt-2">Campos calculados como total, saldo_pendiente o pagado NO deben enviarse (los calcula el backend).</p>
        </form>
      </Modal>

      {/* Modal Generación Masiva */}
      <Modal
        isOpen={showMassive}
        onClose={() => setShowMassive(false)}
        title="Generar Expensas Masivas"
        size="md"
      >
        <form onSubmit={handleMassive} className="space-y-5">
          {feedback && showMassive && (
            <div className={feedback.type === 'success' ? 'alert-success' : 'alert-error'}>{feedback.message}</div>
          )}
            <div className="grid md:grid-cols-2 gap-4">
              <Input
                label="Mes referencia"
                type="month"
                value={massiveData.mes}
                onChange={(e) => setMassiveData(d => ({ ...d, mes: e.target.value }))}
                required
              />
              <Input
                label="Cuota básica"
                type="number"
                min={0}
                step="0.01"
                value={massiveData.cuota_basica}
                onChange={(e) => setMassiveData(d => ({ ...d, cuota_basica: e.target.value }))}
                required
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="secondary" onClick={() => setShowMassive(false)} disabled={massiveSaving}>Cancelar</Button>
              <Button type="submit" loading={massiveSaving}>Generar</Button>
            </div>
            <p className="text-xs text-white/40 pt-2">Creará expensas para todos los propietarios activos.</p>
        </form>
      </Modal>

      {/* Modal Detalle / Edición / Pago */}
      <Modal
        isOpen={!!selected}
        onClose={() => { setSelected(null); setDetalle(null); setFeedback(null); setEditing(false); setCreatingPago(false); }}
        title={selected ? `Expensa #${selected.id}` : ''}
        size="xl"
      >
        {loadingDetalle && <div className="py-8 text-center text-white/70">Cargando detalles...</div>}
        {feedback && selected && (
          <div className={feedback.type === 'success' ? 'alert-success' : 'alert-error'}>{feedback.message}</div>
        )}
        {detalle && (
          <div className="space-y-6 text-sm text-white/80">
            {/* Resumen */}
            <div className="grid md:grid-cols-4 gap-4">
              <div>
                <label className="block text-white/50 mb-1">Propietario</label>
                <p>{detalle.propietario_nombre || detalle.propietario || '—'}</p>
              </div>
              <div>
                <label className="block text-white/50 mb-1">Mes</label>
                <p>{formatMonth(detalle.mes_referencia)}</p>
              </div>
              <div>
                <label className="block text-white/50 mb-1">Total</label>
                <p>{formatCurrency(detalle.total)}</p>
              </div>
              <div>
                <label className="block text-white/50 mb-1">Saldo</label>
                <p className={Number(detalle.saldo_pendiente) > 0 ? 'text-yellow-400 font-semibold' : ''}>{formatCurrency(detalle.saldo_pendiente)}</p>
              </div>
              <div>
                <label className="block text-white/50 mb-1">Pagado verificado</label>
                <p>{formatCurrency(detalle.total_pagado_verificado)}</p>
              </div>
              <div>
                <label className="block text-white/50 mb-1">Vencimiento</label>
                <p>{detalle.fecha_vencimiento ? new Date(detalle.fecha_vencimiento).toLocaleDateString('es-ES') : '—'}</p>
              </div>
              <div>
                <label className="block text-white/50 mb-1">Estado</label>
                <p>{estadoBadge(computeEstado(detalle))}</p>
              </div>
              <div>
                <label className="block text-white/50 mb-1">Multas</label>
                <p>{formatCurrency(detalle.multas)}</p>
              </div>
              {detalle.observaciones && (
                <div className="md:col-span-4">
                  <label className="block text-white/50 mb-1">Observaciones</label>
                  <p>{detalle.observaciones}</p>
                </div>
              )}
            </div>

            {/* Sección Edición */}
            {editing && (
              <form onSubmit={handleEdit} className="space-y-4 bg-white/5 border border-white/10 p-4 rounded-lg">
                <p className="text-white/70 text-xs">Editar multas u observaciones (no se permiten cambios en campos calculados)</p>
                <div className="grid md:grid-cols-4 gap-4">
                  <Input
                    label="Multas"
                    type="number"
                    step="0.01"
                    min={0}
                    value={editData.multas}
                    onChange={(e) => setEditData(d => ({ ...d, multas: e.target.value }))}
                  />
                  <div className="md:col-span-3 flex flex-col">
                    <label className="block text-white/60 text-sm mb-1">Observaciones</label>
                    <textarea
                      value={editData.observaciones}
                      onChange={(e) => setEditData(d => ({ ...d, observaciones: e.target.value }))}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 min-h-[70px]"
                      placeholder="Notas administrativas"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  <Button type="button" variant="secondary" onClick={() => setEditing(false)} disabled={saving}>Cancelar</Button>
                  <Button type="submit" loading={saving}>Guardar</Button>
                </div>
              </form>
            )}

            {/* Crear Pago */}
            {creatingPago && (
              <form onSubmit={handleCrearPago} className="space-y-4 bg-white/5 border border-white/10 p-4 rounded-lg">
                <p className="text-white/70 text-xs">Registrar un pago (quedará pendiente de verificación).</p>
                <div className="grid md:grid-cols-4 gap-4">
                  <Input
                    label="Monto"
                    type="number"
                    step="0.01"
                    min={0}
                    value={pagoData.monto}
                    onChange={(e) => setPagoData(d => ({ ...d, monto: e.target.value }))}
                    required
                  />
                  <Select
                    label="Método"
                    value={pagoData.metodo_pago}
                    onChange={(e) => setPagoData(d => ({ ...d, metodo_pago: e.target.value }))}
                    options={[
                      { value: 'efectivo', label: 'Efectivo' },
                      { value: 'transferencia', label: 'Transferencia' },
                      { value: 'tarjeta', label: 'Tarjeta' },
                      { value: 'cheque', label: 'Cheque' }
                    ]}
                    required
                  />
                  <Input
                    label="Comprobante"
                    value={pagoData.comprobante}
                    onChange={(e) => setPagoData(d => ({ ...d, comprobante: e.target.value }))}
                    placeholder="Referencia"
                  />
                  <Input
                    label="Notas"
                    value={pagoData.notas}
                    onChange={(e) => setPagoData(d => ({ ...d, notas: e.target.value }))}
                    placeholder="Opcional"
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <Button type="button" variant="secondary" onClick={() => setCreatingPago(false)} disabled={pagoSaving}>Cancelar</Button>
                  <Button type="submit" loading={pagoSaving}>Registrar Pago</Button>
                </div>
              </form>
            )}

            {/* Pagos vinculados */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-white font-medium text-sm">Pagos de la Expensa</h4>
                <div className="flex gap-2">
                  {!editing && !creatingPago && Number(detalle.saldo_pendiente) > 0 && (
                    <Button variant="secondary" size="xs" icon={DollarSign} onClick={() => setCreatingPago(true)}>Nuevo Pago</Button>
                  )}
                  {!editing && !creatingPago && (
                    <Button variant="secondary" size="xs" icon={PencilLine} onClick={() => setEditing(true)}>Editar</Button>
                  )}
                </div>
              </div>
              {loadingPagos && <div className="text-white/60 text-xs">Cargando pagos...</div>}
              {!loadingPagos && pagos.length === 0 && (
                <div className="text-white/40 text-xs">No hay pagos asociados.</div>
              )}
              {!loadingPagos && pagos.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="table-minimal text-xs">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Monto</th>
                        <th>Método</th>
                        <th>Fecha</th>
                        <th>Verificado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pagos.map(p => (
                        <tr key={p.id}>
                          <td className="text-white/60">{p.id}</td>
                          <td>{formatCurrency(p.monto)}</td>
                          <td>{p.metodo_pago}</td>
                          <td>{p.fecha_pago || '—'}</td>
                          <td>{p.verificado ? <Badge variant="success">Sí</Badge> : <Badge variant="warning">No</Badge>}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="secondary" onClick={() => { setSelected(null); setDetalle(null); setEditing(false); setCreatingPago(false); }}>Cerrar</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ExpensasPage;