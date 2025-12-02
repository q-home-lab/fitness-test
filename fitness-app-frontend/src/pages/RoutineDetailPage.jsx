import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AppLayout } from '@/app/layout/AppLayout';
import { PageContainer } from '@/shared/components/layout/PageContainer';
import ModernExerciseCard from '../components/ModernExerciseCard';
import RoutineExerciseForm from '../components/RoutineExerciseForm';
import * as Dialog from '@radix-ui/react-dialog';
import api from '../services/api';
import { exportRoutine } from '../utils/exportData';

const RoutineDetailPage = () => {
    const { id } = useParams();

    const [routine, setRoutine] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({ name: '', description: '' });
    const [showAddExerciseModal, setShowAddExerciseModal] = useState(false);
    const [selectedDay, setSelectedDay] = useState(null); // Día seleccionado para añadir ejercicio
    const [selectedExercise, setSelectedExercise] = useState(null);
    const [activeTab, setActiveTab] = useState('all'); // 'all' o número del día (0-6)
    const [exerciseForm, setExerciseForm] = useState({
        sets: 3,
        reps: 10,
        duration_minutes: null,
        weight_kg: 0,
        order_index: 1,
        day_of_week: null
    });
    const [showExerciseGif, setShowExerciseGif] = useState(null);
    const [exerciseGifUrl, setExerciseGifUrl] = useState(null);
    const [exerciseVideoUrl, setExerciseVideoUrl] = useState(null);
    const [loadingExerciseGif, setLoadingExerciseGif] = useState(false);

    const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const dayNamesShort = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

    const fetchRoutineDetails = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/routines/${id}`);
            setRoutine(response.data.routine);
            setEditForm({
                name: response.data.routine.name,
                description: response.data.routine.description || ''
            });
        } catch (err) {
            logger.error('Error fetching routine details:', err);
            setError('Error al cargar los detalles de la rutina.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRoutineDetails();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const handleExerciseSelect = (exercise) => {
        setSelectedExercise(exercise);
        if (exercise) {
            // Calcular order_index basado en ejercicios del día seleccionado o total
            let nextIndex = 1;
            if (routine) {
                if (selectedDay !== null) {
                    const dayExercises = routine.exercises.filter(ex => 
                        ex.day_of_week === selectedDay
                    );
                    nextIndex = dayExercises.length + 1;
                } else {
                    nextIndex = routine.exercises.length + 1;
                }
            }
            setExerciseForm({
                ...exerciseForm,
                order_index: nextIndex,
                day_of_week: selectedDay
            });
        }
    };

    const handleUpdateRoutine = async (e) => {
        e.preventDefault();
        try {
            await api.put(`/routines/${id}`, editForm);
            setIsEditing(false);
            fetchRoutineDetails();
        } catch (err) {
            logger.error('Error updating routine:', err);
            alert('Error al actualizar la rutina');
        }
    };

    const handleAddExercise = async (e) => {
        e.preventDefault();
        if (!selectedExercise || !selectedExercise.exercise_id) {
            alert('Selecciona un ejercicio');
            return;
        }

        try {
            await api.post(`/routines/${id}/exercises`, {
                exercise_id: selectedExercise.exercise_id,
                ...exerciseForm
            });
            setShowAddExerciseModal(false);
            setSelectedExercise(null);
            setSelectedDay(null);
            setActiveTab(exerciseForm.day_of_week !== null ? String(exerciseForm.day_of_week) : 'all');
            setExerciseForm({
                sets: 3,
                reps: 10,
                duration_minutes: null,
                weight_kg: 0,
                order_index: 1,
                day_of_week: null
            });
            fetchRoutineDetails();
        } catch (err) {
            logger.error('Error adding exercise:', err);
            alert(err.response?.data?.error || 'Error al añadir ejercicio a la rutina');
        }
    };

    const handleRemoveExercise = async (routineExerciseId, exerciseName) => {
        if (!window.confirm(`¿Eliminar "${exerciseName}" de esta rutina?`)) {
            return;
        }

        try {
            await api.delete(`/routines/${id}/exercises/${routineExerciseId}`);
            fetchRoutineDetails();
        } catch (err) {
            logger.error('Error removing exercise:', err);
            alert('Error al eliminar ejercicio de la rutina');
        }
    };

    const handleViewExerciseGif = async (exerciseName, exercise) => {
        setShowExerciseGif(exerciseName);
        setLoadingExerciseGif(true);
        setExerciseGifUrl(null);
        setExerciseVideoUrl(null);
        try {
            if (exercise?.gif_url || exercise?.video_url) {
                setExerciseGifUrl(exercise.gif_url || null);
                setExerciseVideoUrl(exercise.video_url || null);
                setLoadingExerciseGif(false);
                return;
            }
            
            const wgerId = exercise?.wger_id;
            const queryParam = wgerId 
                ? `wger_id=${encodeURIComponent(wgerId)}` 
                : `name=${encodeURIComponent(exerciseName)}`;
            
            const response = await api.get(`/exercises/gif?${queryParam}`);
            if (response.data) {
                setExerciseGifUrl(response.data.gif_url || null);
                setExerciseVideoUrl(response.data.video_url || null);
            } else {
                setExerciseGifUrl('https://via.placeholder.com/300x200/4a5568/ffffff?text=Exercise+Demonstration');
            }
        } catch (err) {
            logger.error('Error loading exercise GIF/video:', err);
            setExerciseGifUrl('https://via.placeholder.com/300x200/4a5568/ffffff?text=Exercise+Demonstration');
        } finally {
            setLoadingExerciseGif(false);
        }
    };

    const openAddExerciseModal = (dayIndex = null) => {
        setSelectedDay(dayIndex);
        // Calcular order_index basado en ejercicios del día seleccionado
        let nextIndex = 1;
        if (routine) {
            if (dayIndex !== null) {
                const dayExercises = routine.exercises.filter(ex => 
                    ex.day_of_week === dayIndex
                );
                nextIndex = dayExercises.length + 1;
            } else {
                nextIndex = routine.exercises.length + 1;
            }
        }
        setExerciseForm({
            sets: 3,
            reps: 10,
            duration_minutes: null,
            weight_kg: 0,
            order_index: nextIndex,
            day_of_week: dayIndex
        });
        setSelectedExercise(null); // Limpiar selección previa
        setShowAddExerciseModal(true);
    };

    // Agrupar ejercicios por día y ordenarlos
    const getExercisesByDay = () => {
        if (!routine) return {};
        
        const exercisesByDay = {
            all: [],
            0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: []
        };
        
        // Ordenar todos los ejercicios por order_index primero
        const sortedExercises = [...routine.exercises].sort((a, b) => {
            const orderA = a.order_index || 0;
            const orderB = b.order_index || 0;
            return orderA - orderB;
        });
        
        sortedExercises.forEach((ex) => {
            if (ex.day_of_week !== null && ex.day_of_week !== undefined) {
                exercisesByDay[ex.day_of_week].push(ex);
                exercisesByDay.all.push(ex); // También añadir a "all" para la vista general
            } else {
                exercisesByDay.all.push(ex); // Ejercicios sin día específico van solo a "all"
            }
        });
        
        return exercisesByDay;
    };

    if (loading) {
        return (
            <AppLayout>
                <PageContainer>
                    <div className="flex justify-center py-20">
                        <div className="w-8 h-8 border-2 border-blue-600 dark:border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                </PageContainer>
            </AppLayout>
        );
    }

    if (error || !routine) {
        return (
            <AppLayout>
                <PageContainer>
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-3xl p-6 text-red-600 dark:text-red-400 mb-6">{error || 'Rutina no encontrada'}</div>
                    <Link to="/routines" className="px-6 py-3.5 bg-blue-600 dark:bg-blue-500 text-white rounded-full font-semibold hover:bg-blue-700 dark:hover:bg-blue-600 active:scale-[0.98] transition-all inline-block">
                        Volver a Rutinas
                    </Link>
                </PageContainer>
            </AppLayout>
        );
    }

    const exercisesByDay = getExercisesByDay();
    const currentExercises = activeTab === 'all' 
        ? exercisesByDay.all 
        : exercisesByDay[parseInt(activeTab)] || [];
    
    const totalExercises = routine.exercises.length;

    return (
        <AppLayout>
            <PageContainer>
                    {/* Header */}
                    <div className="mb-8">
                        <Link 
                            to="/routines" 
                            className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6 transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                            </svg>
                            Volver
                        </Link>
                        
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            {!isEditing ? (
                                <div className="flex-1">
                                    <h1 className="text-5xl md:text-6xl font-semibold text-gray-900 dark:text-white mb-3 tracking-tight">
                                        {routine.name}
                                    </h1>
                                    <p className="text-xl text-gray-600 dark:text-gray-400 font-light">
                                        {routine.description || 'Sin descripción'}
                                    </p>
                                </div>
                            ) : (
                                <div className="flex-1 max-w-md">
                                    <form onSubmit={handleUpdateRoutine} className="space-y-4">
                                        <input
                                            type="text"
                                            className="w-full px-4 py-3.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-2xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 dark:focus:border-blue-400 transition-all"
                                            value={editForm.name}
                                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                            required
                                        />
                                        <textarea
                                            className="w-full px-4 py-3.5 bg-base-100 border border-base-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all h-24 resize-none"
                                            placeholder="Descripción"
                                            value={editForm.description}
                                            onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                        />
                                        <div className="flex gap-3">
                                            <button 
                                                type="submit" 
                                                className="px-6 py-3.5 bg-blue-600 dark:bg-blue-500 text-white rounded-full font-semibold hover:bg-blue-700 dark:hover:bg-blue-600 active:scale-[0.98] transition-all"
                                            >
                                                Guardar
                                            </button>
                                            <button
                                                type="button"
                                                className="px-6 py-3.5 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-full font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 active:scale-[0.98] transition-all"
                                                onClick={() => {
                                                    setIsEditing(false);
                                                    setEditForm({
                                                        name: routine.name,
                                                        description: routine.description || ''
                                                    });
                                                }}
                                            >
                                                Cancelar
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            )}
                            {!isEditing && (
                                <div className="flex gap-3">
                                    {routine.exercises.length > 0 && (
                                        <Link
                                            to={`/routines/${id}/workout`}
                                            className="px-6 py-3.5 bg-green-600 dark:bg-green-500 text-white rounded-full font-semibold hover:bg-green-700 dark:hover:bg-green-600 active:scale-[0.98] transition-all flex items-center gap-2"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            Iniciar Entrenamiento
                                        </Link>
                                    )}
                                    <button
                                        onClick={() => exportRoutine(routine)}
                                        className="px-6 py-3.5 bg-blue-600 dark:bg-blue-500 text-white rounded-full font-semibold hover:bg-blue-700 dark:hover:bg-blue-600 active:scale-[0.98] transition-all flex items-center gap-2"
                                        title="Exportar rutina"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        Exportar
                                    </button>
                                    <button
                                        className="px-6 py-3.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-full font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 active:scale-[0.98] transition-all text-gray-900 dark:text-white"
                                        onClick={() => setIsEditing(true)}
                                    >
                                        Editar
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Vista Semanal con Tabs */}
                    <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm transition-colors duration-300">
                        {/* Tabs de días de la semana */}
                        <div className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800">
                            <div className="flex overflow-x-auto scrollbar-hide">
                                {/* Tab "Todos" */}
                                <button
                                    onClick={() => setActiveTab('all')}
                                    className={`px-6 py-4 font-semibold text-sm transition-all whitespace-nowrap border-b-2 ${
                                        activeTab === 'all'
                                            ? 'border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400 bg-white dark:bg-gray-900'
                                            : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white dark:hover:bg-gray-900'
                                    }`}
                                >
                                    <div className="flex items-center gap-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                                        </svg>
                                        Todos
                                        <span className={`px-2 py-0.5 rounded-full text-xs ${
                                            activeTab === 'all'
                                                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                                                : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-500'
                                        }`}>
                                            {totalExercises}
                                        </span>
                                    </div>
                                </button>
                                
                                {/* Tabs para cada día */}
                                {dayNames.map((dayName, index) => {
                                    const dayExercises = exercisesByDay[index] || [];
                                    const exerciseCount = dayExercises.length;
                                    
                                    return (
                                        <button
                                            key={index}
                                            onClick={() => setActiveTab(String(index))}
                                            className={`px-4 md:px-6 py-4 font-semibold text-sm transition-all whitespace-nowrap border-b-2 ${
                                                activeTab === String(index)
                                                    ? 'border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400 bg-white dark:bg-gray-900'
                                                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white dark:hover:bg-gray-900'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <span>{dayNamesShort[index]}</span>
                                                {exerciseCount > 0 && (
                                                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                                                        activeTab === String(index)
                                                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                                                            : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-500'
                                                    }`}>
                                                        {exerciseCount}
                                                    </span>
                                                )}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Contenido del tab activo */}
                        <div className="p-6">
                            {/* Header del día seleccionado */}
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                                        {activeTab === 'all' 
                                            ? 'Todos los Ejercicios' 
                                            : dayNames[parseInt(activeTab)]}
                                    </h2>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                        {currentExercises.length} {currentExercises.length === 1 ? 'ejercicio' : 'ejercicios'}
                                    </p>
                                </div>
                                <button
                                    className="px-6 py-3.5 bg-blue-600 dark:bg-blue-500 text-white rounded-full font-semibold hover:bg-blue-700 dark:hover:bg-blue-600 active:scale-[0.98] transition-all flex items-center gap-2"
                                    onClick={() => openAddExerciseModal(activeTab === 'all' ? null : parseInt(activeTab))}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                    </svg>
                                    Añadir Ejercicio
                                </button>
                            </div>

                            {/* Lista de ejercicios */}
                            {currentExercises.length === 0 ? (
                                <div className="text-center py-16">
                                    <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6 border border-gray-200 dark:border-gray-800">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                        </svg>
                                    </div>
                                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                                        {activeTab === 'all' 
                                            ? 'No hay ejercicios en esta rutina' 
                                            : `No hay ejercicios programados para ${dayNames[parseInt(activeTab)]}`}
                                    </h3>
                                    <p className="text-gray-600 dark:text-gray-400 mb-8 font-light">
                                        {activeTab === 'all'
                                            ? 'Añade tu primer ejercicio para comenzar'
                                            : `Añade ejercicios específicos para ${dayNames[parseInt(activeTab)]}`}
                                    </p>
                                    <button
                                        className="px-6 py-3.5 bg-blue-600 dark:bg-blue-500 text-white rounded-full font-semibold hover:bg-blue-700 dark:hover:bg-blue-600 active:scale-[0.98] transition-all"
                                        onClick={() => openAddExerciseModal(activeTab === 'all' ? null : parseInt(activeTab))}
                                    >
                                        Añadir ejercicio
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {currentExercises.map((ex, index) => (
                                        <ModernExerciseCard
                                            key={`${ex.routine_exercise_id || ex.exercise_id}-${index}`}
                                            exercise={ex}
                                            index={index}
                                            onViewGif={handleViewExerciseGif}
                                            onRemove={handleRemoveExercise}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                {/* Add Exercise Modal - Radix UI */}
                <Dialog.Root open={showAddExerciseModal} onOpenChange={setShowAddExerciseModal}>
                <Dialog.Portal>
                    <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
                    <Dialog.Content className="fixed top-0 md:top-1/2 left-0 md:left-1/2 md:transform md:-translate-x-1/2 md:-translate-y-1/2 bg-white dark:bg-gray-900 rounded-t-3xl md:rounded-3xl border border-gray-200 dark:border-gray-800 shadow-2xl max-w-4xl max-h-[90vh] md:max-h-[90vh] h-[90vh] md:h-auto overflow-y-auto w-full md:w-[calc(100%-2rem)] md:mx-4 z-50 transition-colors duration-300">
                        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4 md:px-0 md:py-0 md:border-0 md:static z-10">
                            <Dialog.Title className="text-xl md:text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                                Añadir Ejercicio
                                {selectedDay !== null && (
                                    <span className="text-base md:text-lg font-normal text-gray-600 dark:text-gray-400 block md:inline">
                                        {' '}para {dayNames[selectedDay]}
                                    </span>
                                )}
                            </Dialog.Title>
                            <Dialog.Description className="text-sm md:text-base text-gray-600 dark:text-gray-400 mb-4 md:mb-6 font-light">
                                Busca y selecciona un ejercicio para añadir
                            </Dialog.Description>
                        </div>
                        <div className="px-6 md:px-0 pb-6 md:pb-0">
                            <form onSubmit={handleAddExercise}>
                                <RoutineExerciseForm
                                    onExerciseSelect={handleExerciseSelect}
                                    selectedExercise={selectedExercise}
                                    exerciseForm={exerciseForm}
                                    setExerciseForm={setExerciseForm}
                                />
                                
                                <div className="flex flex-col sm:flex-row gap-3 pt-6 mt-6 border-t border-gray-200 dark:border-gray-800">
                                <Dialog.Close asChild>
                                    <button
                                        type="button"
                                        className="flex-1 px-4 py-3.5 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-2xl font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 active:scale-[0.98] transition-all"
                                        onClick={() => {
                                            setSelectedExercise(null);
                                            setSelectedDay(null);
                                            setExerciseForm({
                                                sets: 3,
                                                reps: 10,
                                                duration_minutes: null,
                                                weight_kg: 0,
                                                order_index: routine.exercises.length + 1,
                                                day_of_week: null
                                            });
                                        }}
                                    >
                                        Cancelar
                                    </button>
                                </Dialog.Close>
                                <button 
                                    type="submit" 
                                    className="flex-1 px-4 py-3.5 bg-blue-600 dark:bg-blue-500 text-white rounded-2xl font-semibold hover:bg-blue-700 dark:hover:bg-blue-600 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={!selectedExercise}
                                >
                                    Añadir
                                </button>
                            </div>
                        </form>
                        </div>
                    </Dialog.Content>
                </Dialog.Portal>
            </Dialog.Root>

            {/* Exercise GIF/Video Modal - Radix UI */}
            <Dialog.Root open={!!showExerciseGif} onOpenChange={(open) => {
                if (!open) {
                    setShowExerciseGif(null);
                    setExerciseGifUrl(null);
                    setExerciseVideoUrl(null);
                }
            }}>
                <Dialog.Portal>
                    <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
                    <Dialog.Content className="fixed top-0 md:top-1/2 left-0 md:left-1/2 md:transform md:-translate-x-1/2 md:-translate-y-1/2 bg-white dark:bg-gray-900 rounded-t-3xl md:rounded-3xl border border-gray-200 dark:border-gray-800 shadow-2xl max-w-2xl w-full md:w-[calc(100%-2rem)] md:mx-4 max-h-[90vh] md:max-h-[90vh] h-[90vh] md:h-auto overflow-y-auto z-50 transition-colors duration-300">
                        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4 md:px-0 md:py-0 md:border-0 md:static z-10">
                            <Dialog.Title className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white mb-4 md:mb-6">Cómo hacer: {showExerciseGif}</Dialog.Title>
                        </div>
                        <div className="px-6 md:px-0 pb-6 md:pb-0">
                        
                        {loadingExerciseGif ? (
                            <div className="flex justify-center items-center h-64">
                                <div className="w-8 h-8 border-2 border-blue-600 dark:border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        ) : exerciseVideoUrl ? (
                            <div className="w-full flex justify-center mb-6">
                                <video 
                                    src={exerciseVideoUrl} 
                                    controls
                                    className="rounded-2xl max-w-full h-auto max-h-96 object-contain"
                                    onError={(e) => {
                                        if (exerciseGifUrl) {
                                            e.target.style.display = 'none';
                                        }
                                    }}
                                >
                                    Tu navegador no soporta la reproducción de videos.
                                </video>
                            </div>
                        ) : exerciseGifUrl ? (
                            <div className="w-full flex justify-center mb-6">
                                <img 
                                    src={exerciseGifUrl} 
                                    alt={`Cómo hacer ${showExerciseGif}`}
                                    className="rounded-2xl max-w-full h-auto max-h-96 object-contain"
                                    onError={(e) => {
                                        e.target.src = 'https://via.placeholder.com/300x200?text=Exercise+Demonstration';
                                    }}
                                />
                            </div>
                        ) : (
                            <div className="text-center text-gray-600 dark:text-gray-400 py-12 font-light">
                                No hay demostración disponible para este ejercicio.
                            </div>
                        )}

                        <div className="flex justify-end pt-6 border-t border-gray-200 dark:border-gray-800">
                            <Dialog.Close asChild>
                                <button
                                    className="w-full sm:w-auto px-6 py-3.5 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-full font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 active:scale-[0.98] transition-all"
                                    onClick={() => {
                                        setShowExerciseGif(null);
                                        setExerciseGifUrl(null);
                                        setExerciseVideoUrl(null);
                                    }}
                                >
                                    Cerrar
                                </button>
                            </Dialog.Close>
                        </div>
                        </div>
                    </Dialog.Content>
                </Dialog.Portal>
            </Dialog.Root>
            </PageContainer>
        </AppLayout>
    );
};

export default RoutineDetailPage;

