import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AppLayout } from '@/app/layout/AppLayout';
import { PageContainer } from '@/shared/components/layout/PageContainer';
import ModernRoutineCard from '../components/ModernRoutineCard';
import * as Dialog from '@radix-ui/react-dialog';
import api from '../services/api';
import logger from '../utils/logger';
import { routineSchema } from '../utils/validationSchemas';

const RoutinesPage = () => {
    const [routines, setRoutines] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [creating, setCreating] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        reset,
    } = useForm({
        resolver: zodResolver(routineSchema),
        defaultValues: {
            name: '',
            description: '',
        },
    });

    const fetchRoutines = async () => {
        try {
            setLoading(true);
            const response = await api.get('/routines');
            setRoutines(response.data.routines || []);
        } catch (err) {
            logger.error('Error fetching routines:', err);
            setError('Error al cargar las rutinas.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRoutines();
    }, []);

    const onSubmit = async (data) => {
        setCreating(true);
        try {
            await api.post('/routines', data);
            setShowCreateModal(false);
            reset();
            fetchRoutines();
        } catch (err) {
            logger.error('Error creating routine:', err);
            alert('Error al crear la rutina');
            throw err;
        } finally {
            setCreating(false);
        }
    };

    const handleDeleteRoutine = async (routineId, routineName) => {
        if (!window.confirm(`¿Estás seguro de eliminar la rutina "${routineName}"?`)) {
            return;
        }

        try {
            await api.delete(`/routines/${routineId}`);
            fetchRoutines();
        } catch (err) {
            logger.error('Error deleting routine:', err);
            alert('Error al eliminar la rutina');
        }
    };

    return (
        <AppLayout>
            <PageContainer>
                {/* Header Minimalista */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
                    <div>
                        <h1 className="text-5xl md:text-6xl font-semibold text-gray-900 dark:text-white mb-3 tracking-tight">
                            Rutinas
                        </h1>
                        <p className="text-xl text-gray-600 dark:text-gray-400 font-light">
                            Gestiona tus entrenamientos personalizados
                        </p>
                    </div>
                        <button
                            className="px-6 py-3.5 bg-blue-600 dark:bg-blue-500 text-white rounded-full font-medium hover:bg-blue-700 dark:hover:bg-blue-600 active:scale-[0.98] transition-all duration-300 flex items-center gap-2 shadow-lg hover:shadow-xl shadow-blue-600/20"
                            onClick={() => setShowCreateModal(true)}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                            </svg>
                            Nueva Rutina
                        </button>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-20">
                            <div className="w-8 h-8 border-2 border-blue-600 dark:border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : error ? (
                        <div className="backdrop-blur-xl bg-red-50/60 dark:bg-red-900/20 border border-red-200/50 dark:border-red-800/50 rounded-3xl p-6 text-red-600 dark:text-red-400">
                            {error}
                        </div>
                    ) : routines.length === 0 ? (
                        <div className="text-center py-20">
                            <div className="w-24 h-24 backdrop-blur-xl bg-white/60 dark:bg-black/60 rounded-full flex items-center justify-center mx-auto mb-6 border border-gray-200/50 dark:border-gray-800/50 shadow-lg">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                            </div>
                            <h2 className="text-2xl font-light tracking-tight text-gray-900 dark:text-white mb-2">No tienes rutinas creadas</h2>
                            <p className="text-gray-600 dark:text-gray-400 mb-8 font-light">Comienza creando tu primera rutina de entrenamiento</p>
                            <button
                                className="px-6 py-3.5 bg-blue-600 dark:bg-blue-500 text-white rounded-full font-medium hover:bg-blue-700 dark:hover:bg-blue-600 active:scale-[0.98] transition-all duration-300 flex items-center gap-2 mx-auto shadow-lg hover:shadow-xl"
                                onClick={() => setShowCreateModal(true)}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                </svg>
                                Crear mi primera rutina
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {routines.map((routine) => (
                                <ModernRoutineCard
                                    key={routine.routine_id}
                                    routine={routine}
                                    onDelete={handleDeleteRoutine}
                                />
                            ))}
                        </div>
                    )}

                    {/* Create Routine Modal - Radix UI */}
                    <Dialog.Root open={showCreateModal} onOpenChange={setShowCreateModal}>
                        <Dialog.Portal>
                            <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
                            <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 backdrop-blur-xl bg-white/80 dark:bg-black/80 rounded-3xl border border-gray-200/50 dark:border-gray-800/50 shadow-2xl p-8 max-w-lg w-full mx-4 z-50 transition-all duration-300">
                                <Dialog.Title className="text-2xl font-light tracking-tight text-gray-900 dark:text-white mb-2">Nueva Rutina</Dialog.Title>
                                <Dialog.Description className="text-gray-600 dark:text-gray-400 mb-8 font-light">
                                    Define los detalles de tu nueva rutina
                                </Dialog.Description>
                                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Nombre *
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Ej: Rutina de Fuerza"
                                            {...register('name')}
                                            className={`w-full px-4 py-3.5 bg-gray-50 dark:bg-gray-800 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 dark:focus:border-blue-400 transition-all text-gray-900 dark:text-white ${
                                                errors.name 
                                                    ? 'border-red-300 dark:border-red-700' 
                                                    : 'border-gray-300 dark:border-gray-700'
                                            }`}
                                        />
                                        {errors.name && (
                                            <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                                                {errors.name.message}
                                            </p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Descripción
                                        </label>
                                        <textarea
                                            placeholder="Describe los objetivos de esta rutina..."
                                            {...register('description')}
                                            className={`w-full px-4 py-3.5 bg-gray-50 dark:bg-gray-800 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 dark:focus:border-blue-400 transition-all h-24 resize-none text-gray-900 dark:text-white ${
                                                errors.description 
                                                    ? 'border-red-300 dark:border-red-700' 
                                                    : 'border-gray-300 dark:border-gray-700'
                                            }`}
                                            rows="4"
                                        />
                                        {errors.description && (
                                            <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                                                {errors.description.message}
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex gap-3 pt-4">
                                        <Dialog.Close asChild>
                                            <button
                                                type="button"
                                                className="flex-1 px-4 py-3.5 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-2xl font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 active:scale-[0.98] transition-all"
                                                onClick={() => {
                                                    reset();
                                                }}
                                                disabled={isSubmitting}
                                            >
                                                Cancelar
                                            </button>
                                        </Dialog.Close>
                                        <button
                                            type="submit"
                                            className="flex-1 px-4 py-3.5 bg-blue-600 dark:bg-blue-500 text-white rounded-2xl font-semibold hover:bg-blue-700 dark:hover:bg-blue-600 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                            disabled={isSubmitting}
                                        >
                                            {isSubmitting ? (
                                                <>
                                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                    Creando...
                                                </>
                                            ) : (
                                                'Crear Rutina'
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </Dialog.Content>
                        </Dialog.Portal>
                    </Dialog.Root>
            </PageContainer>
        </AppLayout>
    );
};

export default RoutinesPage;
