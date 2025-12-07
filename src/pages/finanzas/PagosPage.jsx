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
import { CreditCard, RefreshCw, Filter, Eye, Check, X, AlertCircle } from 'lucide-react';

// Página Administrativa de Pagos
// Implementa flujos de verificación/rechazo según documentación.

const metodoVariant = (metodo) => {
  if (!metodo) return 'info';
  switch (metodo) {
    case 'efectivo': return 'success';
    case 'transferencia': return 'info';
    case 'tarjeta': return 'warning';
    case 'cheque': return 'error';
    default: return 'info';
  }
};

const PagosPage = () => {
  const { items, loading, error, page, setPage, count, setFilter, filters, refresh, updateItem } = usePagedList({
    endpoint: '/pagos/',
    pageSize: 20,
    // Filtros soportados: expensa, verificado, metodo_pago, propietario
    // Mostramos inicialmente pendientes de verificación para foco operativo
    initialFilters: { expensa: '', verificado: 'false', metodo_pago: '', propietario: '' }
  });

  const [showFilters, setShowFilters] = useState(false);
  const [selected, setSelected] = useState(null);
  const [detalle, setDetalle] = useState(null);
  const [loadingDetalle, setLoadingDetalle] = useState(false);
  const [actionId, setActionId] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const openDetalle = async (pago) => {
    setSelected(pago);
    setDetalle(null);
    setLoadingDetalle(true);
    setFeedback(null);
    try {
      const resp = await axiosInstance.get(`/pagos/${pago.id}/`);
      setDetalle(resp.data);
    } catch (err) {
      setDetalle(pago);
      setFeedback({ type: 'error', message: 'No se pudo cargar detalle completo (vista básica).' });
    } finally { setLoadingDetalle(false); }
  };

  const verificarPago = async (pago) => {
    setActionId(pago.id); setFeedback(null);
    try {
      const resp = await axiosInstance.patch(`/pagos/${pago.id}/verificar/`);
      const updated = resp.data?.pago || { verificado: true };
      updateItem(pago.id, { ...pago, ...updated, verificado: true });
      if (selected && selected.id === pago.id) setDetalle(d => ({ ...d, ...updated, verificado: true }));
      setFeedback({ type: 'success', message: 'Pago verificado correctamente' });
    } catch (err) {
      setFeedback({ type: 'error', message: err.response?.data?.detail || 'Error al verificar' });
    } finally { setActionId(null); }
  };

  const rechazarPago = async (pago) => {
    setActionId(pago.id); setFeedback(null);
    try {
      await axiosInstance.patch(`/pagos/${pago.id}/rechazar_verificacion/`);
      updateItem(pago.id, { verificado: false });
      if (selected && selected.id === pago.id) setDetalle(d => ({ ...d, verificado: false }));
      setFeedback({ type: 'success', message: 'Verificación rechazada' });
    } catch (err) {
      setFeedback({ type: 'error', message: err.response?.data?.detail || 'Error al rechazar verificación' });
    } finally { setActionId(null); }
  };

  const columns = [
    { key: 'id', header: 'ID', render: (v) => <span className="text-xs text-white/60">{v}</span> },
    { key: 'expensa_info', header: 'Expensa', render: (v) => v || '—' },
    { key: 'propietario_nombre', header: 'Propietario', render: (v) => v || '—' },
    { key: 'fecha_pago', header: 'Fecha', render: (v) => v ? new Date(v).toLocaleDateString('es-ES') : '—' },
    { key: 'monto', header: 'Monto', render: (v) => v ? `$${Number(v).toFixed(2)}` : '—' },
    { key: 'metodo_pago', header: 'Método', render: (v) => <Badge variant={metodoVariant(v)}>{v || '—'}</Badge> },
    { key: 'verificado', header: 'Estado', render: (v) => v ? <Badge variant="success">Verificado</Badge> : <Badge variant="warning">Pendiente</Badge> },
    { key: 'actions', header: 'Acciones', className: 'text-right', cellClassName: 'text-right', render: (_, row) => (
      <div className="flex justify-end gap-2">
        <Button variant="secondary" size="xs" icon={Eye} onClick={() => openDetalle(row)} title="Ver" />
        {!row.verificado && row.puede_verificar && (
          <Button
            variant="secondary"
            size="xs"
            icon={Check}
            disabled={actionId === row.id}
            onClick={() => verificarPago(row)}
          >
            {actionId === row.id ? '...' : 'Verificar'}
          </Button>
        )}
        {row.verificado && (
          <Button
            variant="secondary"
            size="xs"
            icon={X}
            disabled={actionId === row.id}
            onClick={() => rechazarPago(row)}
          >
            {actionId === row.id ? '...' : 'Rechazar'}
          </Button>
        )}
      </div>
    ) }
  ];

  const headerActions = (
    <div className="flex gap-2 flex-wrap">
      <Button variant="secondary" icon={Filter} onClick={() => setShowFilters(v => !v)}>Filtros</Button>
      <Button variant="secondary" icon={RefreshCw} onClick={refresh}>Refrescar</Button>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in bg-black">
      <PageHeader
        title="Pagos"
        description="Verificación y control"
        icon={CreditCard}
        actions={headerActions}
      />

      {showFilters && (
        <div className="card-minimal p-4 space-y-4 animate-slide-down">
          <div className="grid md:grid-cols-5 gap-4">
            <Input
              label="Expensa ID"
              value={filters.expensa || ''}
              onChange={(e) => setFilter('expensa', e.target.value)}
              placeholder="ID expensa"
            />
            <Input
              label="Propietario ID"
              value={filters.propietario || ''}
              onChange={(e) => setFilter('propietario', e.target.value)}
              placeholder="ID propietario"
            />
            <Select
              label="Verificado"
              value={filters.verificado}
              onChange={(e) => setFilter('verificado', e.target.value)}
              options={[
                { value: '', label: 'Todos' },
                { value: 'true', label: 'Sí' },
                { value: 'false', label: 'No' }
              ]}
            />
            <Select
              label="Método"
              value={filters.metodo_pago}
              onChange={(e) => setFilter('metodo_pago', e.target.value)}
              options={[
                { value: '', label: 'Todos' },
                { value: 'efectivo', label: 'Efectivo' },
                { value: 'transferencia', label: 'Transferencia' },
                { value: 'tarjeta', label: 'Tarjeta' },
                { value: 'cheque', label: 'Cheque' }
              ]}
            />
            <div className="flex items-end">
              <Button variant="secondary" className="w-full" onClick={() => { refresh(); }}>Aplicar</Button>
            </div>
          </div>
        </div>
      )}

      {feedback && !selected && (
        <div className={feedback.type === 'success' ? 'alert-success' : 'alert-error'}>{feedback.message}</div>
      )}
      {error && <div className="alert-error">{error}</div>}

      <Table
        columns={columns}
        data={items}
        loading={loading}
        emptyMessage="No hay pagos"
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
        onClose={() => { setSelected(null); setDetalle(null); setFeedback(null); }}
        title={selected ? `Pago #${selected.id}` : ''}
        size="lg"
      >
        {loadingDetalle && <div className="py-8 text-center text-white/70">Cargando detalles...</div>}
        {feedback && selected && (
          <div className={feedback.type === 'success' ? 'alert-success' : 'alert-error'}>{feedback.message}</div>
        )}
        {detalle && (
          <div className="space-y-5 text-sm text-white/80">
            <div className="grid md:grid-cols-4 gap-4">
              <div>
                <label className="block text-white/50 mb-1">Expensa</label>
                <p>{detalle.expensa_info || detalle.expensa || '—'}</p>
              </div>
              <div>
                <label className="block text-white/50 mb-1">Propietario</label>
                <p>{detalle.propietario_nombre || '—'}</p>
              </div>
              <div>
                <label className="block text-white/50 mb-1">Monto</label>
                <p>{detalle.monto ? `$${Number(detalle.monto).toFixed(2)}` : '—'}</p>
              </div>
              <div>
                <label className="block text-white/50 mb-1">Saldo Expensa</label>
                <p>{detalle.saldo_pendiente_expensa !== undefined ? `$${Number(detalle.saldo_pendiente_expensa).toFixed(2)}` : '—'}</p>
              </div>
              <div>
                <label className="block text-white/50 mb-1">Método</label>
                <p><Badge variant={metodoVariant(detalle.metodo_pago)}>{detalle.metodo_pago || '—'}</Badge></p>
              </div>
              <div>
                <label className="block text-white/50 mb-1">Fecha Pago</label>
                <p>{detalle.fecha_pago ? new Date(detalle.fecha_pago).toLocaleDateString('es-ES') : '—'}</p>
              </div>
              <div>
                <label className="block text-white/50 mb-1">Verificado</label>
                <p>{detalle.verificado ? 'Sí' : 'No'}</p>
              </div>
              {detalle.comprobante && (
                <div className="md:col-span-2">
                  <label className="block text-white/50 mb-1">Comprobante</label>
                  <p className="break-all font-mono text-[11px] bg-white/5 px-2 py-1 rounded border border-white/10">{detalle.comprobante}</p>
                </div>
              )}
              {detalle.notas && (
                <div className="md:col-span-4">
                  <label className="block text-white/50 mb-1">Notas</label>
                  <p>{detalle.notas}</p>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 pt-2">
              {!detalle.verificado && detalle.puede_verificar && (
                <Button variant="secondary" icon={Check} disabled={actionId === detalle.id} onClick={() => verificarPago(detalle)}>
                  {actionId === detalle.id ? '...' : 'Verificar'}
                </Button>
              )}
              {detalle.verificado && (
                <Button variant="secondary" icon={X} disabled={actionId === detalle.id} onClick={() => rechazarPago(detalle)}>
                  {actionId === detalle.id ? '...' : 'Rechazar'}
                </Button>
              )}
              <Button variant="secondary" onClick={() => setSelected(null)}>Cerrar</Button>
            </div>
            {(!detalle.puede_verificar && !detalle.verificado) && (
              <div className="alert-error flex items-center gap-2 text-xs"><AlertCircle className="w-4 h-4" /> No puede verificar: ya verificado o sin permisos.</div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default PagosPage;
