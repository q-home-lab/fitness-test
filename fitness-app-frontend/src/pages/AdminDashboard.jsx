import React, { useEffect, useState } from 'react';
import { AppLayout } from '@/app/layout/AppLayout';
import { PageContainer } from '@/shared/components/layout/PageContainer';
import BrandSettings from '../components/BrandSettings';
import UserManagement from '../components/UserManagement';
import UserTracking from '../components/UserTracking';
import RoutineExerciseForm from '../components/RoutineExerciseForm';
import api from '../services/api';
import useUserStore from '../stores/useUserStore';
import Icon from '../components/Icons';
import useToastStore from '../stores/useToastStore';
import logger from '@/utils/logger';

const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

const AdminDashboard = () => {
  const user = useUserStore((state) => state.user);
  const [activeTab, setActiveTab] = useState('users'); // 'users', 'brand', 'coaching'
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [routines, setRoutines] = useState([]);
  const [mealPlans, setMealPlans] = useState([]);
  const [newRoutine, setNewRoutine] = useState({ name: '', description: '' });
  const [newMealPlan, setNewMealPlan] = useState({
    day_of_week: 1,
    breakfast: '',
    lunch: '',
    dinner: '',
    snacks: '',
  });
  const [saving, setSaving] = useState(false);
  const [generatingRoutine, setGeneratingRoutine] = useState(false);
  const [generatingMealPlan, setGeneratingMealPlan] = useState(false);
  const [selectedRoutine, setSelectedRoutine] = useState(null);
  const [routineExercises, setRoutineExercises] = useState([]);
  const [loadingRoutineDetails, setLoadingRoutineDetails] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState(null);
  const [editRoutineForm, setEditRoutineForm] = useState({ name: '', description: '' });
  const [showAddExerciseModal, setShowAddExerciseModal] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [exerciseForm, setExerciseForm] = useState({
    sets: 3,
    reps: 10,
    duration_minutes: null,
    weight_kg: 0,
    order_index: 1,
    day_of_week: null,
  });
  const [editingExercise, setEditingExercise] = useState(null);
  const [editExerciseForm, setEditExerciseForm] = useState({
    sets: 3,
    reps: 10,
    duration_minutes: null,
    weight_kg: 0,
    order_index: 1,
    day_of_week: null,
  });

  // Cargar todos los usuarios
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await api.get('/admin/users');
        setUsers(response.data.users || []);
      } catch (error) {
        logger.error('Error al cargar usuarios de administración:', error);
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchUsers();
  }, []);

  const loadUserDetail = async (userId) => {
    setSelectedUserId(userId);
    const userData = users.find((u) => u.id === userId) || null;
    setSelectedUser(userData);

    try {
      const [routinesRes, mealsRes] = await Promise.all([
        api.get(`/admin/users/${userId}/routines`),
        api.get(`/admin/users/${userId}/meal-plans`),
      ]);
      setRoutines(routinesRes.data.routines || []);
      setMealPlans(mealsRes.data.plans || []);
    } catch (error) {
      logger.error('Error al cargar detalle de usuario (admin):', error);
    }
  };

  const handleCreateRoutine = async (e) => {
    e.preventDefault();
    if (!selectedUserId || !newRoutine.name.trim()) return;

    setSaving(true);
    try {
      const response = await api.post(`/admin/users/${selectedUserId}/routines`, newRoutine);
      setRoutines((prev) => [...prev, response.data.routine]);
      setNewRoutine({ name: '', description: '' });
    } catch (error) {
      logger.error('Error al crear rutina para usuario (admin):', error);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveMealPlan = async (e) => {
    e.preventDefault();
    if (!selectedUserId) return;

    setSaving(true);
    try {
      const { day_of_week, ...rest } = newMealPlan;
      const response = await api.post(
        `/admin/users/${selectedUserId}/meal-plans/${day_of_week}`,
        rest
      );

      const updatedPlan = response.data.plan;
      setMealPlans((prev) => {
        const others = prev.filter((p) => p.day_of_week !== updatedPlan.day_of_week);
        return [...others, updatedPlan].sort((a, b) => a.day_of_week - b.day_of_week);
      });

      setNewMealPlan((current) => ({
        ...current,
        breakfast: '',
        lunch: '',
        dinner: '',
        snacks: '',
      }));
    } catch (error) {
      logger.error('Error al guardar plan de comidas (admin):', error);
      alert(error.response?.data?.error || 'Error al guardar el plan de comidas');
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateAutoRoutine = async () => {
    if (!selectedUserId) {
      alert('Por favor selecciona un usuario primero');
      return;
    }

    if (!confirm('¿Generar una rutina automática de 5 días? Esto creará una nueva rutina basada en el objetivo del usuario.')) {
      return;
    }

    setGeneratingRoutine(true);
    try {
      const response = await api.post(`/admin/users/${selectedUserId}/generate-routine`);
      const daysList = response.data.days && Array.isArray(response.data.days) 
        ? response.data.days.map(d => d.dayName || `Día ${d.day_of_week}`).join(', ')
        : 'Rutina generada';
      toast.success(`${response.data.message}\n\nRutina creada: ${response.data.routine?.name || 'Nueva rutina'}\nDías: ${daysList}`);
      
      // Recargar rutinas
      const routinesRes = await api.get(`/admin/users/${selectedUserId}/routines`);
      setRoutines(routinesRes.data.routines || []);
    } catch (error) {
      logger.error('Error al generar rutina automática:', error);
      alert(error.response?.data?.error || 'Error al generar la rutina automática');
    } finally {
      setGeneratingRoutine(false);
    }
  };

  const handleGenerateAutoMealPlan = async () => {
    if (!selectedUserId) {
      alert('Por favor selecciona un usuario primero');
      return;
    }

    if (!confirm('¿Generar un plan de comidas automático de 7 días? Esto actualizará o creará planes para toda la semana.')) {
      return;
    }

    setGeneratingMealPlan(true);
    try {
      const response = await api.post(`/admin/users/${selectedUserId}/generate-meal-plan`);
      const plan = response.data.plan || {};
      const macros = plan.macros || {};
      const proteinPercent = macros.protein?.percent || macros.proteinPercent || 0;
      const carbsPercent = macros.carbs?.percent || macros.carbsPercent || 0;
      const fatPercent = macros.fat?.percent || macros.fatPercent || 0;
      toast.success(`${response.data.message}\n\nPlan: ${plan.name || 'Plan de comidas'}\nCalorías diarias: ${plan.dailyCalories || 'N/A'} kcal\nMacros: P${proteinPercent}% C${carbsPercent}% G${fatPercent}%`);
      
      // Recargar planes de comidas
      const mealsRes = await api.get(`/admin/users/${selectedUserId}/meal-plans`);
      setMealPlans(mealsRes.data.plans || []);
    } catch (error) {
      logger.error('Error al generar plan de comidas automático:', error);
      alert(error.response?.data?.error || 'Error al generar el plan de comidas automático');
    } finally {
      setGeneratingMealPlan(false);
    }
  };

  const loadRoutineDetails = async (routineId) => {
    if (!selectedUserId || !routineId) return;
    
    setLoadingRoutineDetails(true);
    try {
      const response = await api.get(`/admin/users/${selectedUserId}/routines/${routineId}`);
      setSelectedRoutine(response.data.routine);
      setRoutineExercises(response.data.routine.exercises || []);
    } catch (error) {
      logger.error('Error al cargar detalles de rutina:', error);
      alert(error.response?.data?.error || 'Error al cargar los detalles de la rutina');
    } finally {
      setLoadingRoutineDetails(false);
    }
  };

  const handleEditRoutine = (routine) => {
    setEditingRoutine(routine);
    setEditRoutineForm({
      name: routine.name,
      description: routine.description || '',
    });
  };

  const handleUpdateRoutine = async (e) => {
    e.preventDefault();
    if (!editingRoutine || !selectedUserId) return;

    setSaving(true);
    try {
      await api.put(`/admin/users/${selectedUserId}/routines/${editingRoutine.routine_id}`, editRoutineForm);
      setEditingRoutine(null);
      setEditRoutineForm({ name: '', description: '' });
      
      // Recargar rutinas
      const routinesRes = await api.get(`/admin/users/${selectedUserId}/routines`);
      setRoutines(routinesRes.data.routines || []);
      
      // Si la rutina estaba seleccionada, recargar sus detalles
      if (selectedRoutine && selectedRoutine.routine_id === editingRoutine.routine_id) {
        await loadRoutineDetails(editingRoutine.routine_id);
      }
      
      toast.success('Rutina actualizada correctamente');
    } catch (error) {
      logger.error('Error al actualizar rutina:', error);
      alert(error.response?.data?.error || 'Error al actualizar la rutina');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRoutine = async (routineId) => {
    if (!selectedUserId || !routineId) return;
    
    if (!confirm('¿Estás seguro de que quieres eliminar esta rutina? Esta acción no se puede deshacer.')) {
      return;
    }

    setSaving(true);
    try {
      await api.delete(`/admin/users/${selectedUserId}/routines/${routineId}`);
      
      // Recargar rutinas
      const routinesRes = await api.get(`/admin/users/${selectedUserId}/routines`);
      setRoutines(routinesRes.data.routines || []);
      
      // Si la rutina estaba seleccionada, limpiar
      if (selectedRoutine && selectedRoutine.routine_id === routineId) {
        setSelectedRoutine(null);
        setRoutineExercises([]);
      }
      
      toast.success('Rutina eliminada correctamente');
    } catch (error) {
      logger.error('Error al eliminar rutina:', error);
      alert(error.response?.data?.error || 'Error al eliminar la rutina');
    } finally {
      setSaving(false);
    }
  };

  const handleEditExercise = (exercise) => {
    setEditingExercise(exercise);
    setEditExerciseForm({
      sets: exercise.sets || 3,
      reps: exercise.reps || null,
      duration_minutes: exercise.duration_minutes || null,
      weight_kg: exercise.weight_kg || 0,
      order_index: exercise.order_index || 1,
      day_of_week: exercise.day_of_week !== null && exercise.day_of_week !== undefined ? exercise.day_of_week : null,
    });
  };

  const handleUpdateExercise = async (e) => {
    e.preventDefault();
    if (!editingExercise || !selectedUserId || !selectedRoutine) return;

    setSaving(true);
    try {
      await api.put(
        `/admin/users/${selectedUserId}/routines/${selectedRoutine.routine_id}/exercises/${editingExercise.routine_exercise_id}`,
        editExerciseForm
      );

      // Recargar ejercicios de la rutina
      await loadRoutineDetails(selectedRoutine.routine_id);
      
      // Cerrar modal
      setEditingExercise(null);
      setEditExerciseForm({
        sets: 3,
        reps: 10,
        duration_minutes: null,
        weight_kg: 0,
        order_index: 1,
        day_of_week: null,
      });
      
      toast.success('Ejercicio actualizado correctamente');
    } catch (error) {
      logger.error('Error al actualizar ejercicio:', error);
      alert(error.response?.data?.error || 'Error al actualizar el ejercicio');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteExercise = async (routineExerciseId) => {
    if (!selectedUserId || !selectedRoutine) return;
    
    if (!confirm('¿Estás seguro de que quieres eliminar este ejercicio de la rutina?')) {
      return;
    }

    setSaving(true);
    try {
      await api.delete(`/admin/users/${selectedUserId}/routines/${selectedRoutine.routine_id}/exercises/${routineExerciseId}`);
      
      // Recargar ejercicios de la rutina
      await loadRoutineDetails(selectedRoutine.routine_id);
      
      toast.success('Ejercicio eliminado correctamente');
    } catch (error) {
      logger.error('Error al eliminar ejercicio:', error);
      alert(error.response?.data?.error || 'Error al eliminar el ejercicio');
    } finally {
      setSaving(false);
    }
  };

  const openAddExerciseModal = async (routineId) => {
    if (!routineId || !selectedUserId) return;
    
    // Cargar detalles de la rutina si no están cargados
    if (!selectedRoutine || selectedRoutine.routine_id !== routineId) {
      await loadRoutineDetails(routineId);
    }
    
    setExerciseForm({
      sets: 3,
      reps: 10,
      duration_minutes: null,
      weight_kg: 0,
      order_index: (routineExercises.length || 0) + 1,
      day_of_week: null,
    });
    setSelectedExercise(null);
    setShowAddExerciseModal(true);
  };

  const handleAddExerciseToRoutine = async (e) => {
    e.preventDefault();
    if (!selectedRoutine || !selectedExercise || !selectedUserId) return;

    setSaving(true);
    try {
      await api.post(`/admin/users/${selectedUserId}/routines/${selectedRoutine.routine_id}/exercises`, {
        exercise_id: selectedExercise.exercise_id || selectedExercise.id,
        sets: exerciseForm.sets,
        reps: exerciseForm.reps || null,
        duration_minutes: exerciseForm.duration_minutes || null,
        weight_kg: exerciseForm.weight_kg || 0,
        order_index: exerciseForm.order_index,
        day_of_week: exerciseForm.day_of_week !== null ? parseInt(exerciseForm.day_of_week) : null,
      });

      // Recargar ejercicios de la rutina
      await loadRoutineDetails(selectedRoutine.routine_id);
      
      // Limpiar formulario
      setShowAddExerciseModal(false);
      setSelectedExercise(null);
      setExerciseForm({
        sets: 3,
        reps: 10,
        duration_minutes: null,
        weight_kg: 0,
        order_index: 1,
        day_of_week: null,
      });
      
      toast.success('Ejercicio añadido a la rutina correctamente');
    } catch (error) {
      logger.error('Error al añadir ejercicio:', error);
      alert(error.response?.data?.error || 'Error al añadir el ejercicio a la rutina');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppLayout>
      <PageContainer>
          <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-4xl md:text-5xl font-semibold text-gray-900 dark:text-white mb-2 tracking-tight">
                Panel de Administración
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                Gestiona usuarios, marca, rutinas y planes de comidas diarios.
              </p>
            </div>
            {user && (
              <div className="px-4 py-2 rounded-2xl bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 text-sm text-blue-600 dark:text-blue-400">
                Sesión admin: <span className="font-semibold">{user.email}</span>
              </div>
            )}
          </div>

          {/* Pestañas */}
          <div className="mb-6 flex gap-2 border-b border-gray-200 dark:border-gray-800">
            <button
              onClick={() => setActiveTab('users')}
              className={`px-6 py-3 font-medium transition-colors border-b-2 ${
                activeTab === 'users'
                  ? 'border-[#D45A0F] dark:border-blue-500 text-[#D45A0F] dark:text-blue-500'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Gestión de Usuarios
            </button>
            <button
              onClick={() => setActiveTab('brand')}
              className={`px-6 py-3 font-medium transition-colors border-b-2 ${
                activeTab === 'brand'
                  ? 'border-[#D45A0F] dark:border-blue-500 text-[#D45A0F] dark:text-blue-500'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Configuración de Marca
            </button>
            <button
              onClick={() => setActiveTab('coaching')}
              className={`px-6 py-3 font-medium transition-colors border-b-2 ${
                activeTab === 'coaching'
                  ? 'border-[#D45A0F] dark:border-blue-500 text-[#D45A0F] dark:text-blue-500'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Coaching (Rutinas y Comidas)
            </button>
          </div>

          {/* Contenido de pestañas */}
          {activeTab === 'users' && (
            <div className="mb-6">
              <UserManagement />
            </div>
          )}

          {activeTab === 'brand' && (
            <div className="mb-6">
              <BrandSettings />
            </div>
          )}

          {activeTab === 'coaching' && (
            <div className="space-y-6">
            {/* Sección de seguimiento del usuario seleccionado */}
            {selectedUser && (
              <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-4 md:p-6 shadow-sm transition-colors duration-300">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Seguimiento del Usuario</h2>
                </div>
                <UserTracking userId={selectedUserId} />
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Columna 1: Lista de usuarios */}
            <section className="lg:col-span-1 bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-4 md:p-6 shadow-sm transition-colors duration-300">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Usuarios</h2>
                {loadingUsers && (
                  <div className="w-5 h-5 border-2 border-blue-600 dark:border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                )}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Selecciona un usuario para asignarle rutinas y un plan de comidas semanal.
              </p>
              <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
                {users.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => loadUserDetail(u.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-2xl text-left text-sm border transition-colors ${
                      selectedUserId === u.id
                        ? 'bg-blue-600 dark:bg-blue-500 text-white border-blue-600 dark:border-blue-500'
                        : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white'
                    }`}
                  >
                    <div>
                      <div className="font-medium truncate">{u.email}</div>
                      <div className="text-xs opacity-70">
                        Onboarding:{' '}
                        {u.onboardingCompleted ? 'Completo' : `Paso ${u.onboardingStep || 0}`}
                      </div>
                    </div>
                    <span className="text-xs opacity-70">ID #{u.id}</span>
                  </button>
                ))}
                {!loadingUsers && users.length === 0 && (
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    No hay usuarios registrados todavía.
                  </div>
                )}
              </div>
            </section>

            {/* Columna 2 y 3: Detalle del usuario seleccionado */}
            <section className="lg:col-span-2 space-y-6">
              {!selectedUser && (
                <div className="bg-white dark:bg-gray-900 rounded-3xl border border-dashed border-gray-300 dark:border-gray-700 p-10 text-center text-gray-600 dark:text-gray-400 text-sm transition-colors duration-300">
                  Selecciona un usuario en la lista para empezar a configurarle una rutina y su
                  plan de comidas diario.
                </div>
              )}

              {selectedUser && (
                <>
                  {/* Información básica del usuario */}
                  <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-4 md:p-6 shadow-sm transition-colors duration-300">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div>
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
                          {selectedUser.email}
                        </h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Usuario #{selectedUser.id} · Onboarding:{' '}
                          {selectedUser.onboardingCompleted
                            ? 'Completo'
                            : `Paso ${selectedUser.onboardingStep || 0}`}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Bloque: Gestión de Rutinas */}
                  <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-4 md:p-6 shadow-sm transition-colors duration-300">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Rutinas asignadas
                      </h3>
                      <button
                        onClick={handleGenerateAutoRoutine}
                        disabled={generatingRoutine || !selectedUserId}
                        className="px-4 py-2 bg-green-600 dark:bg-green-500 text-white rounded-xl text-sm font-semibold hover:bg-green-700 dark:hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {generatingRoutine ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            Generando...
                          </>
                        ) : (
                          <>
                            <span>✨</span>
                            Generar Rutina 5 Días
                          </>
                        )}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      {routines.map((r) => (
                        <div
                          key={r.routine_id}
                          className="p-4 rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 transition-colors duration-300"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900 dark:text-white truncate">{r.name}</h4>
                              {r.description && (
                                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{r.description}</p>
                              )}
                            </div>
                            {!r.is_active && (
                              <span className="px-2 py-1 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full text-[10px] font-medium ml-2">
                                Inactiva
                              </span>
                            )}
                          </div>
                          <div className="flex gap-2 mt-3">
                            <button
                              onClick={() => loadRoutineDetails(r.routine_id)}
                              className="flex-1 px-3 py-1.5 bg-blue-600 dark:bg-blue-500 text-white rounded-lg text-xs font-medium hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
                            >
                              Ver Ejercicios
                            </button>
                            <button
                              onClick={() => handleEditRoutine(r)}
                              className="px-3 py-1.5 bg-yellow-600 dark:bg-yellow-500 text-white rounded-lg text-xs font-medium hover:bg-yellow-700 dark:hover:bg-yellow-600 transition-colors flex items-center justify-center"
                              title="Editar rutina"
                            >
                              <Icon name="edit" className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteRoutine(r.routine_id)}
                              disabled={saving}
                              className="px-3 py-1.5 bg-red-600 dark:bg-red-500 text-white rounded-lg text-xs font-medium hover:bg-red-700 dark:hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center"
                              title="Eliminar rutina"
                            >
                              <Icon name="delete" className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                      {routines.length === 0 && (
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Este usuario aún no tiene rutinas creadas por el entrenador.
                        </div>
                      )}
                    </div>

                    {/* Vista de ejercicios de rutina seleccionada */}
                    {selectedRoutine && (
                      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-200 dark:border-blue-800">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h4 className="font-semibold text-gray-900 dark:text-white">
                              Ejercicios de: {selectedRoutine.name}
                            </h4>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                              {routineExercises.length} ejercicio{routineExercises.length !== 1 ? 's' : ''}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => openAddExerciseModal(selectedRoutine.routine_id)}
                              className="px-4 py-2 bg-green-600 dark:bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-700 dark:hover:bg-green-600 transition-colors"
                            >
                              + Añadir Ejercicio
                            </button>
                            <button
                              onClick={() => {
                                setSelectedRoutine(null);
                                setRoutineExercises([]);
                              }}
                              className="px-4 py-2 bg-gray-600 dark:bg-gray-500 text-white rounded-lg text-sm font-medium hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
                            >
                              Cerrar
                            </button>
                          </div>
                        </div>

                        {loadingRoutineDetails ? (
                          <div className="flex justify-center py-8">
                            <div className="w-6 h-6 border-2 border-blue-600 dark:border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                          </div>
                        ) : routineExercises.length === 0 ? (
                          <p className="text-sm text-gray-600 dark:text-gray-400 text-center py-4">
                            Esta rutina no tiene ejercicios aún. Añade el primero.
                          </p>
                        ) : (
                          <div className="space-y-2 max-h-96 overflow-y-auto">
                            {routineExercises.map((ex) => (
                              <div
                                key={ex.routine_exercise_id}
                                className="p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 flex items-center justify-between"
                              >
                                <div className="flex-1">
                                  <div className="font-medium text-gray-900 dark:text-white">
                                    {ex.exercise_name}
                                  </div>
                                  <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                    {ex.sets} series
                                    {ex.reps && ` × ${ex.reps} reps`}
                                    {ex.duration_minutes && ` × ${ex.duration_minutes} min`}
                                    {ex.weight_kg > 0 && ` @ ${ex.weight_kg}kg`}
                                    {ex.day_of_week !== null && ` · ${dayNames[ex.day_of_week]}`}
                                  </div>
                                </div>
                                <div className="flex gap-2 ml-3">
                                  <button
                                    onClick={() => handleEditExercise(ex)}
                                    disabled={saving}
                                    className="px-3 py-1.5 bg-yellow-600 dark:bg-yellow-500 text-white rounded-lg text-xs font-medium hover:bg-yellow-700 dark:hover:bg-yellow-600 transition-colors disabled:opacity-50 flex items-center justify-center"
                                    title="Editar ejercicio"
                                  >
                                    <Icon name="edit" className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteExercise(ex.routine_exercise_id)}
                                    disabled={saving}
                                    className="px-3 py-1.5 bg-red-600 dark:bg-red-500 text-white rounded-lg text-xs font-medium hover:bg-red-700 dark:hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center"
                                    title="Eliminar ejercicio"
                                  >
                                    <Icon name="delete" className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    <form onSubmit={handleCreateRoutine} className="space-y-3 mt-2">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Nombre de la rutina
                          </label>
                          <input
                            type="text"
                            className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 dark:focus:border-blue-400 transition-all"
                            placeholder="Rutina fuerza 3 días, por ejemplo"
                            value={newRoutine.name}
                            onChange={(e) =>
                              setNewRoutine((prev) => ({ ...prev, name: e.target.value }))
                            }
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Descripción (opcional)
                          </label>
                          <input
                            type="text"
                            className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 dark:focus:border-blue-400 transition-all"
                            placeholder="Resumen rápido de la rutina"
                            value={newRoutine.description}
                            onChange={(e) =>
                              setNewRoutine((prev) => ({
                                ...prev,
                                description: e.target.value,
                              }))
                            }
                          />
                        </div>
                      </div>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        disabled={saving || !newRoutine.name.trim()}
                      >
                        {saving ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            Creando...
                          </>
                        ) : (
                          'Crear rutina para este usuario'
                        )}
                      </button>
                    </form>
                  </div>

                  {/* Bloque: Plan de comidas semanal */}
                  <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-4 md:p-6 shadow-sm transition-colors duration-300">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Plan de comidas semanal
                      </h3>
                      <button
                        onClick={handleGenerateAutoMealPlan}
                        disabled={generatingMealPlan || !selectedUserId}
                        className="px-4 py-2 bg-purple-600 dark:bg-purple-500 text-white rounded-xl text-sm font-semibold hover:bg-purple-700 dark:hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {generatingMealPlan ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            Generando...
                          </>
                        ) : (
                          <>
                            <Icon name="food" className="w-4 h-4" />
                            Generar Plan 7 Días
                          </>
                        )}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      {mealPlans
                        .slice()
                        .sort((a, b) => a.day_of_week - b.day_of_week)
                        .map((plan) => (
                          <div
                            key={plan.plan_id}
                            className="p-4 rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 transition-colors duration-300"
                          >
                            <div className="font-semibold text-gray-900 dark:text-white mb-2">
                              {dayNames[plan.day_of_week]}
                            </div>
                            <div className="space-y-1 text-xs text-gray-700 dark:text-gray-300">
                              {plan.breakfast && (
                                <p>
                                  <span className="font-semibold">Desayuno:</span>{' '}
                                  {plan.breakfast}
                                </p>
                              )}
                              {plan.lunch && (
                                <p>
                                  <span className="font-semibold">Comida:</span> {plan.lunch}
                                </p>
                              )}
                              {plan.dinner && (
                                <p>
                                  <span className="font-semibold">Cena:</span> {plan.dinner}
                                </p>
                              )}
                              {plan.snacks && (
                                <p>
                                  <span className="font-semibold">Snacks:</span> {plan.snacks}
                                </p>
                              )}
                              {!plan.breakfast &&
                                !plan.lunch &&
                                !plan.dinner &&
                                !plan.snacks && (
                                  <p className="italic opacity-70">
                                    Sin recomendaciones definidas aún.
                                  </p>
                                )}
                            </div>
                          </div>
                        ))}
                      {mealPlans.length === 0 && (
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Todavía no hay un plan de comidas definido para este usuario.
                        </div>
                      )}
                    </div>

                    <form onSubmit={handleSaveMealPlan} className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Día de la semana
                          </label>
                          <select
                            className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 dark:focus:border-blue-400 transition-all"
                            value={newMealPlan.day_of_week}
                            onChange={(e) =>
                              setNewMealPlan((prev) => ({
                                ...prev,
                                day_of_week: Number(e.target.value),
                              }))
                            }
                          >
                            {dayNames.map((name, index) => (
                              <option key={index} value={index}>
                                {name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Desayuno (lista de alimentos / ejemplo)
                          </label>
                          <input
                            type="text"
                            className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 dark:focus:border-blue-400 transition-all"
                            placeholder="Ej: Avena, fruta, yogur..."
                            value={newMealPlan.breakfast}
                            onChange={(e) =>
                              setNewMealPlan((prev) => ({
                                ...prev,
                                breakfast: e.target.value,
                              }))
                            }
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Comida
                          </label>
                          <input
                            type="text"
                            className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 dark:focus:border-blue-400 transition-all"
                            placeholder="Plato principal, acompañamientos..."
                            value={newMealPlan.lunch}
                            onChange={(e) =>
                              setNewMealPlan((prev) => ({ ...prev, lunch: e.target.value }))
                            }
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Cena
                          </label>
                          <input
                            type="text"
                            className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 dark:focus:border-blue-400 transition-all"
                            placeholder="Opciones ligeras o de recuperación"
                            value={newMealPlan.dinner}
                            onChange={(e) =>
                              setNewMealPlan((prev) => ({ ...prev, dinner: e.target.value }))
                            }
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Snacks (opcional)
                        </label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 dark:focus:border-blue-400 transition-all"
                          placeholder="Frutos secos, fruta extra, etc."
                          value={newMealPlan.snacks}
                          onChange={(e) =>
                            setNewMealPlan((prev) => ({ ...prev, snacks: e.target.value }))
                          }
                        />
                      </div>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-pink-600 dark:bg-pink-500 text-white rounded-xl text-sm font-semibold hover:bg-pink-700 dark:hover:bg-pink-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        disabled={saving || !selectedUserId}
                      >
                        {saving ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            Guardando...
                          </>
                        ) : (
                          'Guardar plan de comidas para este día'
                        )}
                      </button>
                    </form>
                  </div>
                </>
              )}
            </section>
            </div>
            </div>
          )}
      </PageContainer>

      {/* Modal para añadir ejercicio a rutina */}
      {showAddExerciseModal && selectedRoutine && (
        <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50 p-0 md:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-900 rounded-t-3xl md:rounded-3xl p-6 max-w-2xl w-full md:my-8 max-h-[90vh] md:max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white pr-4">
                Añadir Ejercicio a: {selectedRoutine.name}
              </h3>
              <button
                onClick={() => {
                  setShowAddExerciseModal(false);
                  setSelectedExercise(null);
                  setExerciseForm({
                    sets: 3,
                    reps: 10,
                    duration_minutes: null,
                    weight_kg: 0,
                    order_index: 1,
                    day_of_week: null,
                  });
                }}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-2xl flex-shrink-0"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddExerciseToRoutine} className="space-y-4">
              <RoutineExerciseForm
                selectedExercise={selectedExercise}
                onExerciseSelect={setSelectedExercise}
                exerciseForm={exerciseForm}
                setExerciseForm={setExerciseForm}
              />

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button
                  type="submit"
                  disabled={saving || !selectedExercise}
                  className="flex-1 px-4 py-2.5 md:py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Añadiendo...' : 'Añadir Ejercicio'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddExerciseModal(false);
                    setSelectedExercise(null);
                    setExerciseForm({
                      sets: 3,
                      reps: 10,
                      duration_minutes: null,
                      weight_kg: 0,
                      order_index: 1,
                      day_of_week: null,
                    });
                  }}
                  className="px-4 py-2.5 md:py-2 bg-gray-600 dark:bg-gray-500 text-white rounded-xl text-sm font-semibold hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Edición de Ejercicio */}
      {editingExercise && selectedRoutine && (
        <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50 p-0 md:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-900 rounded-t-3xl md:rounded-3xl p-6 max-w-2xl w-full md:my-8 max-h-[90vh] md:max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white pr-4">
                Editar Ejercicio: {editingExercise.exercise_name}
              </h3>
              <button
                onClick={() => {
                  setEditingExercise(null);
                  setEditExerciseForm({
                    sets: 3,
                    reps: 10,
                    duration_minutes: null,
                    weight_kg: 0,
                    order_index: 1,
                    day_of_week: null,
                  });
                }}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-2xl flex-shrink-0"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateExercise} className="space-y-4">
              <div className="space-y-4">
                {/* Series */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Series *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 dark:focus:border-blue-400 transition-all"
                    value={editExerciseForm.sets}
                    onChange={(e) =>
                      setEditExerciseForm((prev) => ({
                        ...prev,
                        sets: parseInt(e.target.value) || 1,
                      }))
                    }
                  />
                </div>

                {/* Reps */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Repeticiones (opcional)
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 dark:focus:border-blue-400 transition-all"
                    value={editExerciseForm.reps || ''}
                    onChange={(e) =>
                      setEditExerciseForm((prev) => ({
                        ...prev,
                        reps: e.target.value ? parseInt(e.target.value) : null,
                      }))
                    }
                    placeholder="Dejar vacío si no aplica"
                  />
                </div>

                {/* Duración (minutos) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Duración en minutos (opcional)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 dark:focus:border-blue-400 transition-all"
                    value={editExerciseForm.duration_minutes || ''}
                    onChange={(e) =>
                      setEditExerciseForm((prev) => ({
                        ...prev,
                        duration_minutes: e.target.value ? parseFloat(e.target.value) : null,
                      }))
                    }
                    placeholder="Dejar vacío si no aplica"
                  />
                </div>

                {/* Peso (kg) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Peso en kg (opcional)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 dark:focus:border-blue-400 transition-all"
                    value={editExerciseForm.weight_kg || ''}
                    onChange={(e) =>
                      setEditExerciseForm((prev) => ({
                        ...prev,
                        weight_kg: parseFloat(e.target.value) || 0,
                      }))
                    }
                    placeholder="0"
                  />
                </div>

                {/* Orden */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Orden en la rutina *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 dark:focus:border-blue-400 transition-all"
                    value={editExerciseForm.order_index}
                    onChange={(e) =>
                      setEditExerciseForm((prev) => ({
                        ...prev,
                        order_index: parseInt(e.target.value) || 1,
                      }))
                    }
                  />
                </div>

                {/* Día de la semana */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Día de la semana (opcional)
                  </label>
                  <select
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 dark:focus:border-blue-400 transition-all"
                    value={editExerciseForm.day_of_week !== null ? editExerciseForm.day_of_week : ''}
                    onChange={(e) =>
                      setEditExerciseForm((prev) => ({
                        ...prev,
                        day_of_week: e.target.value !== '' ? parseInt(e.target.value) : null,
                      }))
                    }
                  >
                    <option value="">Sin día específico</option>
                    {dayNames.map((day, index) => (
                      <option key={index} value={index}>
                        {day}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Guardando...' : 'Guardar Cambios'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingExercise(null);
                    setEditExerciseForm({
                      sets: 3,
                      reps: 10,
                      duration_minutes: null,
                      weight_kg: 0,
                      order_index: 1,
                      day_of_week: null,
                    });
                  }}
                  className="px-4 py-2 bg-gray-600 dark:bg-gray-500 text-white rounded-xl text-sm font-semibold hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de editar rutina */}
      {editingRoutine && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 max-w-md w-full">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Editar Rutina
            </h3>
            <form onSubmit={handleUpdateRoutine} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nombre
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 dark:focus:border-blue-400 transition-all"
                  value={editRoutineForm.name}
                  onChange={(e) => setEditRoutineForm({ ...editRoutineForm, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Descripción
                </label>
                <textarea
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 dark:focus:border-blue-400 transition-all h-24 resize-none"
                  value={editRoutineForm.description}
                  onChange={(e) => setEditRoutineForm({ ...editRoutineForm, description: e.target.value })}
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Guardando...' : 'Guardar'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingRoutine(null);
                    setEditRoutineForm({ name: '', description: '' });
                  }}
                  className="px-4 py-2 bg-gray-600 dark:bg-gray-500 text-white rounded-xl text-sm font-semibold hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
};

export default AdminDashboard;
