import React, { useState, useEffect } from 'react';
import usePagedList from '../../hooks/usePagedList.jsx';
import axiosInstance from '../../api/axiosConfig.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';
import Table from '../../components/common/Table.jsx';
import Button from '../../components/common/Button.jsx';
import Input from '../../components/common/Input.jsx';
import Modal from '../../components/common/Modal.jsx';
import Badge from '../../components/common/Badge.jsx';
import { Users, Plus, Edit3, Key, Shield } from 'lucide-react';

const UsuariosPage = () => {
  const { items, loading, error, page, setPage, count, refresh } = usePagedList({
    endpoint: '/administracion/users/',
    pageSize: 20
  });

  const [roles, setRoles] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState(null);
  const [showEdit, setShowEdit] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [editData, setEditData] = useState({
    rol: '',
    is_active: true
  });
  const [newUser, setNewUser] = useState({
    username: '',
    password: '',
    email: '',
    first_name: '',
    last_name: '',
    telefono: '',
    rol: 'PROPIETARIO',
    documento_identidad: ''
  });

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    try {
      const response = await axiosInstance.get('/administracion/roles/');
      setRoles(response.data.results || response.data);
    } catch (err) {
      console.error('Error loading roles:', err);
    }
  };

  const handleCreatePropietario = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);
    try {
      await axiosInstance.post('/administracion/users/crear_propietario/', newUser);
      setFeedback({ type: 'success', message: 'Usuario propietario creado exitosamente' });
      await refresh();
      setTimeout(() => {
        setShowCreate(false);
        setFeedback(null);
        setNewUser({
          username: '',
          password: '',
          email: '',
          first_name: '',
          last_name: '',
          telefono: '',
          rol: 'PROPIETARIO',
          documento_identidad: ''
        });
      }, 1500);
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.error || 'Error al crear usuario'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);
    try {
      await axiosInstance.post('/administracion/users/crear_staff/', {
        ...newUser,
        password: newUser.password || newUser.username + '123'
      });
      setFeedback({ type: 'success', message: 'Usuario staff creado exitosamente' });
      await refresh();
      setTimeout(() => {
        setShowCreate(false);
        setFeedback(null);
        setNewUser({
          username: '',
          password: '',
          email: '',
          first_name: '',
          last_name: '',
          telefono: '',
          rol: 'PROPIETARIO',
          documento_identidad: ''
        });
      }, 1500);
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.error || 'Error al crear usuario'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = (e) => {
    if (newUser.rol === 'PROPIETARIO') {
      handleCreatePropietario(e);
    } else {
      handleCreateStaff(e);
    }
  };

  const getRolBadge = (rol) => {
    const badges = {
      'ADMIN': <Badge variant="purple">Administrador</Badge>,
      'PROPIETARIO': <Badge variant="blue">Propietario</Badge>,
      'INQUILINO': <Badge variant="green">Inquilino</Badge>,
      'GUARDIA': <Badge variant="yellow">Guardia</Badge>,
    };
    return badges[rol] || <Badge variant="gray">{rol}</Badge>;
  };

  const openEdit = (user) => {
    setEditing(user);
    setEditData({
      rol: user.perfil?.rol || '',
      is_active: user.is_active
    });
    setShowEdit(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);
    try {
      // Asignar rol si cambió
      if (editData.rol && editData.rol !== editing.perfil?.rol) {
        await axiosInstance.patch(`/administracion/users/${editing.id}/asignar_rol/`, {
          rol: editData.rol
        });
      }
      
      // Activar/desactivar usuario si cambió
      if (editData.is_active !== editing.is_active) {
        const action = editData.is_active ? 'activar' : 'desactivar';
        await axiosInstance.post(`/administracion/users/${editing.id}/${action}/`);
      }

      setFeedback({ type: 'success', message: 'Usuario actualizado exitosamente' });
      await refresh();
      setTimeout(() => {
        setShowEdit(false);
        setFeedback(null);
        setEditing(null);
      }, 1500);
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.error || 'Error al actualizar usuario'
      });
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    {
      key: 'id',
      header: 'ID',
      render: (v) => <span className="text-white/70 text-xs">{v}</span>
    },
    {
      key: 'username',
      header: 'Usuario',
      render: (v, row) => (
        <div>
          <p className="font-medium">{v}</p>
          <p className="text-xs text-white/50">{row.email}</p>
        </div>
      )
    },
    {
      key: 'first_name',
      header: 'Nombre Completo',
      render: (v, row) => `${v} ${row.last_name}` || '—'
    },
    {
      key: 'perfil',
      header: 'Rol',
      render: (perfil) => perfil?.rol ? getRolBadge(perfil.rol) : <Badge variant="gray">Sin rol</Badge>
    },
    {
      key: 'perfil',
      header: 'Teléfono',
      render: (perfil) => perfil?.telefono || '—'
    },
    {
      key: 'is_active',
      header: 'Estado',
      render: (v) => v ? <Badge variant="green">Activo</Badge> : <Badge variant="red">Inactivo</Badge>
    },
    {
      key: 'actions',
      header: 'Acciones',
      render: (_, row) => (
        <button
          onClick={() => openEdit(row)}
          className="p-2 hover:bg-white/5 rounded-lg transition-colors"
          title="Editar usuario"
        >
          <Edit3 size={16} className="text-blue-400" />
        </button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestión de Usuarios"
        subtitle="Administra usuarios y asigna roles del sistema"
        icon={Users}
      />

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-300">
          {error}
        </div>
      )}

      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <Button onClick={() => setShowCreate(true)} icon={Plus}>
            Nuevo Usuario
          </Button>
        </div>
      </div>

      <Table
        columns={columns}
        data={items}
        loading={loading}
        page={page}
        totalPages={Math.ceil(count / 20)}
        onPageChange={setPage}
      />

      <Modal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        title="Crear Nuevo Usuario"
        icon={Plus}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {feedback && (
            <div
              className={`p-4 rounded-lg ${
                feedback.type === 'success'
                  ? 'bg-green-500/10 border border-green-500/30 text-green-300'
                  : 'bg-red-500/10 border border-red-500/30 text-red-300'
              }`}
            >
              {feedback.message}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Usuario *"
              value={newUser.username}
              onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
              required
            />
            <Input
              label="Email *"
              type="email"
              value={newUser.email}
              onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Nombre *"
              value={newUser.first_name}
              onChange={(e) => setNewUser({ ...newUser, first_name: e.target.value })}
              required
            />
            <Input
              label="Apellido *"
              value={newUser.last_name}
              onChange={(e) => setNewUser({ ...newUser, last_name: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">
              Rol *
            </label>
            <select
              value={newUser.rol}
              onChange={(e) => setNewUser({ ...newUser, rol: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="PROPIETARIO">Propietario</option>
              <option value="INQUILINO">Inquilino</option>
              <option value="ADMIN">Administrador</option>
              <option value="GUARDIA">Guardia</option>
            </select>
          </div>

          {newUser.rol === 'PROPIETARIO' && (
            <Input
              label="Documento de Identidad *"
              value={newUser.documento_identidad}
              onChange={(e) => setNewUser({ ...newUser, documento_identidad: e.target.value })}
              placeholder="Debe existir un propietario con este documento"
              required
            />
          )}

          {newUser.rol !== 'PROPIETARIO' && (
            <Input
              label="Contraseña"
              type="password"
              value={newUser.password}
              onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
              placeholder="Si no se proporciona, será: usuario123"
            />
          )}

          <Input
            label="Teléfono"
            value={newUser.telefono}
            onChange={(e) => setNewUser({ ...newUser, telefono: e.target.value })}
          />

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" onClick={() => setShowCreate(false)}>
              Cancelar
            </Button>
            <Button type="submit" loading={saving}>
              Crear Usuario
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Editar Usuario */}
      <Modal
        isOpen={showEdit}
        onClose={() => {
          setShowEdit(false);
          setEditing(null);
          setFeedback(null);
        }}
        title="Editar Usuario"
      >
        {feedback && (
          <div className={`mb-4 p-3 rounded-lg ${
            feedback.type === 'success' 
              ? 'bg-green-500/10 text-green-300 border border-green-500/30' 
              : 'bg-red-500/10 text-red-300 border border-red-500/30'
          }`}>
            {feedback.message}
          </div>
        )}

        <form onSubmit={handleUpdate} className="space-y-4">
          <div className="bg-slate-700/30 rounded-lg p-4 mb-4">
            <p className="text-sm text-white/50">Usuario</p>
            <p className="font-medium">{editing?.username}</p>
            <p className="text-sm text-white/70">{editing?.first_name} {editing?.last_name}</p>
            {editing?.perfil?.telefono && (
              <p className="text-sm text-white/50 mt-1">📞 {editing.perfil.telefono}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">
              Rol *
            </label>
            <select
              value={editData.rol}
              onChange={(e) => setEditData({ ...editData, rol: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Seleccionar rol...</option>
              <option value="PROPIETARIO">Propietario</option>
              <option value="INQUILINO">Inquilino</option>
              <option value="ADMIN">Administrador</option>
              <option value="GUARDIA">Guardia</option>
            </select>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="is_active_edit"
              checked={editData.is_active}
              onChange={(e) => setEditData({ ...editData, is_active: e.target.checked })}
              className="w-4 h-4 rounded border-slate-600 bg-slate-700/50 text-blue-500 focus:ring-2 focus:ring-blue-500"
            />
            <label htmlFor="is_active_edit" className="text-sm font-medium text-white/70">
              Usuario activo
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" onClick={() => setShowEdit(false)}>
              Cancelar
            </Button>
            <Button type="submit" loading={saving}>
              Guardar Cambios
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default UsuariosPage;
