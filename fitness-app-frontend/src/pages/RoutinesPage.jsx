import React, { useEffect, useState } from 'react';
import ModernNavbar from '../components/ModernNavbar';
import BottomNavigation from '../components/BottomNavigation';
import ModernRoutineCard from '../components/ModernRoutineCard';
import * as Dialog from '@radix-ui/react-dialog';
import api from '../services/api';

const RoutinesPage = () => {
    const [routines, setRoutines] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newRoutine, setNewRoutine] = useState({ name: '', description: '' });
    const [creating, setCreating] = useState(false);

    const fetchRoutines = async () => {
        try {
            setLoading(true);
            const response = await api.get('/routines');
            setRoutines(response.data.routines || []);
        } catch (err) {
            console.error('Error fetching routines:', err);
            setError('Error al cargar las rutinas.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRoutines();
    }, []);

    const handleCreateRoutine = async (e) => {
        e.preventDefault();
        if (!newRoutine.name.trim()) {
            alert('El nombre de la rutina es obligatorio');
            return;
        }

        setCreating(true);
        try {
            await api.post('/routines', newRoutine);
            setShowCreateModal(false);
            setNewRoutine({ name: '', description: '' });
            fetchRoutines();
        } catch (err) {
            console.error('Error creating routine:', err);
            alert('Error al crear la rutina');
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
            console.error('Error deleting routine:', err);
            alert('Error al eliminar la rutina');
        }
    };

    return (
        <>
            <ModernNavbar />
            <main className="min-h-screen bg-[#FAF3E1] dark:bg-black pb-24 md:pb-8 transition-colors duration-300">
                <div className="max-w-7xl mx-auto px-6 py-8">
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
                            className="px-6 py-3.5 bg-blue-600 dark:bg-blue-500 text-white rounded-full font-semibold hover:bg-blue-700 dark:hover:bg-blue-600 active:scale-[0.98] transition-all flex items-center gap-2 shadow-lg shadow-blue-600/20"
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
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-3xl p-6 text-red-600 dark:text-red-400">
                            {error}
                        </div>
                    ) : routines.length === 0 ? (
                        <div className="text-center py-20">
                            <div className="w-24 h-24 bg-white dark:bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-6 border border-gray-200 dark:border-gray-800">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                            </div>
                            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">No tienes rutinas creadas</h2>
                            <p className="text-gray-600 dark:text-gray-400 mb-8 font-light">Comienza creando tu primera rutina de entrenamiento</p>
                            <button
                                className="px-6 py-3.5 bg-blue-600 dark:bg-blue-500 text-white rounded-full font-semibold hover:bg-blue-700 dark:hover:bg-blue-600 active:scale-[0.98] transition-all flex items-center gap-2 mx-auto"
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
                            <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-2xl p-8 max-w-lg w-full mx-4 z-50 transition-colors duration-300">
                                <Dialog.Title className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">Nueva Rutina</Dialog.Title>
                                <Dialog.Description className="text-gray-600 dark:text-gray-400 mb-8 font-light">
                                    Define los detalles de tu nueva rutina
                                </Dialog.Description>
                                <form onSubmit={handleCreateRoutine} className="space-y-5">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Nombre *
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Ej: Rutina de Fuerza"
                                            className="w-full px-4 py-3.5 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 dark:focus:border-blue-400 transition-all text-gray-900 dark:text-white"
                                            value={newRoutine.name}
                                            onChange={(e) => setNewRoutine({ ...newRoutine, name: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Descripción
                                        </label>
                                        <textarea
                                            placeholder="Describe los objetivos de esta rutina..."
                                            className="w-full px-4 py-3.5 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 dark:focus:border-blue-400 transition-all h-24 resize-none text-gray-900 dark:text-white"
                                            value={newRoutine.description}
                                            onChange={(e) => setNewRoutine({ ...newRoutine, description: e.target.value })}
                                            rows="4"
                                        />
                                    </div>
                                    <div className="flex gap-3 pt-4">
                                        <Dialog.Close asChild>
                                            <button
                                                type="button"
                                                className="flex-1 px-4 py-3.5 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-2xl font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 active:scale-[0.98] transition-all"
                                                onClick={() => {
                                                    setNewRoutine({ name: '', description: '' });
                                                }}
                                                disabled={creating}
                                            >
                                                Cancelar
                                            </button>
                                        </Dialog.Close>
                                        <button
                                            type="submit"
                                            className="flex-1 px-4 py-3.5 bg-blue-600 dark:bg-blue-500 text-white rounded-2xl font-semibold hover:bg-blue-700 dark:hover:bg-blue-600 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                            disabled={creating}
                                        >
                                            {creating ? (
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
                </div>
            </main>
            <BottomNavigation />
        </>
    );
};

export default RoutinesPage;
