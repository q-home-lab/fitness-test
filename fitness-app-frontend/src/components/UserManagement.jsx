import React, { useState, useEffect } from 'react';
import api from '../services/api';
import logger from '../utils/logger';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({ email: '', password: '', role: 'CLIENT' });
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const response = await api.get('/admin/users');
      setUsers(response.data.users || []);
    } catch (error) {
      logger.error('Error al cargar usuarios:', error);
      setMessage({ type: 'error', text: 'Error al cargar usuarios.' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    try {
      await api.post('/admin/users', formData);
      setMessage({ type: 'success', text: 'Usuario creado exitosamente.' });
      setFormData({ email: '', password: '', role: 'CLIENT' });
      setShowCreateForm(false);
      loadUsers();
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.error || 'Error al crear usuario.',
      });
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({ email: user.email, password: '', role: user.role || 'CLIENT' });
    setShowCreateForm(false);
    setMessage({ type: '', text: '' });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    try {
      await api.put(`/admin/users/${editingUser.id}`, formData);
      setMessage({ type: 'success', text: 'Usuario actualizado exitosamente.' });
      setEditingUser(null);
      setFormData({ email: '', password: '' });
      loadUsers();
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.error || 'Error al actualizar usuario.',
      });
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este usuario?')) {
      return;
    }

    try {
      await api.delete(`/admin/users/${userId}`);
      setMessage({ type: 'success', text: 'Usuario eliminado exitosamente.' });
      loadUsers();
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.error || 'Error al eliminar usuario.',
      });
    }
  };

  const cancelForm = () => {
    setShowCreateForm(false);
    setEditingUser(null);
    setFormData({ email: '', password: '' });
    setMessage({ type: '', text: '' });
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="w-8 h-8 border-2 border-[#D45A0F] dark:border-blue-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm transition-colors duration-300">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Gestión de Usuarios
        </h2>
        {!showCreateForm && !editingUser && (
          <button
            onClick={() => {
              setShowCreateForm(true);
              setEditingUser(null);
              setFormData({ email: '', password: '' });
              setMessage({ type: '', text: '' });
            }}
            className="px-4 py-2 bg-[#D45A0F] dark:bg-blue-600 text-white rounded-2xl font-medium hover:bg-[#B84A0D] dark:hover:bg-blue-700 transition-colors"
          >
            + Nuevo Usuario
          </button>
        )}
      </div>

      {message.text && (
        <div
          className={`mb-4 p-4 rounded-2xl ${
            message.type === 'success'
              ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400'
              : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Formulario de Crear/Editar */}
      {(showCreateForm || editingUser) && (
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
          </h3>
          <form onSubmit={editingUser ? handleUpdate : handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 rounded-2xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#D45A0F] dark:focus:ring-blue-500 focus:border-transparent transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {editingUser ? 'Nueva Contraseña (dejar vacío para mantener la actual)' : 'Contraseña *'}
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required={!editingUser}
                minLength={6}
                className="w-full px-4 py-3 rounded-2xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#D45A0F] dark:focus:ring-blue-500 focus:border-transparent transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Rol *
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 rounded-2xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#D45A0F] dark:focus:ring-blue-500 focus:border-transparent transition-colors"
              >
                <option value="CLIENT">Cliente</option>
                <option value="COACH">Entrenador</option>
                <option value="ADMIN">Administrador</option>
              </select>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {editingUser 
                  ? 'Cambiar el rol del usuario afectará sus permisos y acceso a funcionalidades.'
                  : 'Selecciona el rol que tendrá el usuario en el sistema.'}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                className="px-4 py-2 bg-[#D45A0F] dark:bg-blue-600 text-white rounded-2xl font-medium hover:bg-[#B84A0D] dark:hover:bg-blue-700 transition-colors"
              >
                {editingUser ? 'Actualizar' : 'Crear'}
              </button>
              <button
                type="button"
                onClick={cancelForm}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-2xl font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de Usuarios */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                Email
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                Rol
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                Fecha de Registro
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                Onboarding
              </th>
              <th className="text-right py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan="5" className="py-8 text-center text-gray-500 dark:text-gray-400">
                  No hay usuarios registrados
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">
                    {user.email}
                  </td>
                  <td className="py-3 px-4 text-sm">
                    <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                      user.role === 'ADMIN' 
                        ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'
                        : user.role === 'COACH'
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400'
                    }`}>
                      {user.role === 'ADMIN' ? 'Admin' : user.role === 'COACH' ? 'Entrenador' : 'Cliente'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                    {new Date(user.createdAt).toLocaleDateString('es-ES')}
                  </td>
                  <td className="py-3 px-4 text-sm">
                    {user.onboardingCompleted ? (
                      <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg text-xs">
                        Completado
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-lg text-xs">
                        Pendiente
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-sm text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleEdit(user)}
                        className="px-3 py-1 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(user.id)}
                        className="px-3 py-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserManagement;

