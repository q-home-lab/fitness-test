import React, { useState, useEffect } from 'react';
import api from '../services/api';
import ModernNavbar from '../components/ModernNavbar';
import { Plus, Dumbbell, Utensils, Trash2, Edit2 } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';

const TemplatesPage = () => {
    const [activeTab, setActiveTab] = useState('routines');
    const [routineTemplates, setRoutineTemplates] = useState([]);
    const [dietTemplates, setDietTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState(null);

    useEffect(() => {
        loadTemplates();
    }, [activeTab]);

    const loadTemplates = async () => {
        try {
            setLoading(true);
            if (activeTab === 'routines') {
                const response = await api.get('/templates/routines');
                setRoutineTemplates(response.data.templates || []);
            } else {
                const response = await api.get('/templates/diets');
                setDietTemplates(response.data.templates || []);
            }
        } catch (error) {
            console.error('Error cargando plantillas:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id, type) => {
        if (!confirm('¿Estás seguro de que quieres eliminar esta plantilla?')) return;

        try {
            await api.delete(`/templates/${type}/${id}`);
            loadTemplates();
        } catch (error) {
            console.error('Error eliminando plantilla:', error);
        }
    };

    const templates = activeTab === 'routines' ? routineTemplates : dietTemplates;

    return (
        <>
            <ModernNavbar />
            <div className="min-h-screen bg-background dark:bg-gray-900 p-6 pt-24">
                <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                            Mis Plantillas
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400">
                            Gestiona tus plantillas de rutinas y dietas
                        </p>
                    </div>
                    <button
                        onClick={() => {
                            setEditingTemplate(null);
                            setModalOpen(true);
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                    >
                        <Plus className="w-5 h-5" />
                        Nueva Plantilla
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-700">
                    <button
                        onClick={() => setActiveTab('routines')}
                        className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                            activeTab === 'routines'
                                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                        }`}
                    >
                        <div className="flex items-center gap-2">
                            <Dumbbell className="w-4 h-4" />
                            Rutinas ({routineTemplates.length})
                        </div>
                    </button>
                    <button
                        onClick={() => setActiveTab('diets')}
                        className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                            activeTab === 'diets'
                                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                        }`}
                    >
                        <div className="flex items-center gap-2">
                            <Utensils className="w-4 h-4" />
                            Dietas ({dietTemplates.length})
                        </div>
                    </button>
                </div>

                {/* Templates Grid */}
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="w-8 h-8 border-4 border-gray-300 dark:border-gray-700 border-t-primary-500 rounded-full animate-spin"></div>
                    </div>
                ) : templates.length === 0 ? (
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center border border-gray-200 dark:border-gray-700">
                        <p className="text-gray-500 dark:text-gray-400">
                            No hay plantillas. Crea tu primera plantilla.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {templates.map((template) => (
                            <div
                                key={template.template_id}
                                className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                                            {template.name}
                                        </h3>
                                        {template.description && (
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                {template.description}
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => {
                                                setEditingTemplate(template);
                                                setModalOpen(true);
                                            }}
                                            className="p-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(template.template_id, activeTab)}
                                            className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                    {activeTab === 'routines'
                                        ? `${template.exercises?.length || 0} ejercicios`
                                        : `${template.meals?.length || 0} comidas`}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <TemplateModal
                    open={modalOpen}
                    onOpenChange={setModalOpen}
                    template={editingTemplate}
                    type={activeTab}
                    onSuccess={loadTemplates}
                />
                </div>
            </div>
        </>
    );
};

const TemplateModal = ({ open, onOpenChange, template, type, onSuccess }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [exercises, setExercises] = useState([]);
    const [meals, setMeals] = useState([]);

    useEffect(() => {
        if (template) {
            setName(template.name || '');
            setDescription(template.description || '');
            setExercises(template.exercises || []);
            setMeals(template.meals || []);
        } else {
            setName('');
            setDescription('');
            setExercises([]);
            setMeals([]);
        }
    }, [template, open]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const data = type === 'routines'
                ? { name, description, exercises: exercises.length > 0 ? exercises : [] }
                : { name, description, meals: meals.length > 0 ? meals : [] };

            if (template) {
                await api.put(`/templates/${type}/${template.template_id}`, data);
            } else {
                await api.post(`/templates/${type}`, data);
            }

            onSuccess();
            onOpenChange(false);
        } catch (error) {
            console.error('Error guardando plantilla:', error);
            alert('Error al guardar la plantilla');
        }
    };

    return (
        <Dialog.Root open={open} onOpenChange={onOpenChange}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
                <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6 w-full max-w-2xl z-50 border border-gray-200 dark:border-gray-800 max-h-[90vh] overflow-y-auto">
                    <Dialog.Title className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                        {template ? 'Editar' : 'Nueva'} Plantilla de {type === 'routines' ? 'Rutina' : 'Dieta'}
                    </Dialog.Title>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Nombre
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Descripción
                            </label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={3}
                                className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            />
                        </div>

                        {type === 'routines' ? (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Ejercicios (JSON)
                                </label>
                                <textarea
                                    value={JSON.stringify(exercises, null, 2)}
                                    onChange={(e) => {
                                        try {
                                            setExercises(JSON.parse(e.target.value));
                                        } catch {}
                                    }}
                                    rows={10}
                                    className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono text-sm"
                                    placeholder='[{"exercise_id": 1, "sets": 3, "reps": 10, "weight_kg": 20}]'
                                />
                            </div>
                        ) : (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Comidas (JSON)
                                </label>
                                <textarea
                                    value={JSON.stringify(meals, null, 2)}
                                    onChange={(e) => {
                                        try {
                                            setMeals(JSON.parse(e.target.value));
                                        } catch {}
                                    }}
                                    rows={10}
                                    className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono text-sm"
                                    placeholder='[{"meal_type": "Desayuno", "foods": [{"food_id": 1, "quantity_grams": 100}]}]'
                                />
                            </div>
                        )}

                        <div className="flex gap-3 justify-end pt-4">
                            <Dialog.Close asChild>
                                <button
                                    type="button"
                                    className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                                >
                                    Cancelar
                                </button>
                            </Dialog.Close>
                            <button
                                type="submit"
                                className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                            >
                                {template ? 'Actualizar' : 'Crear'}
                            </button>
                        </div>
                    </form>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
};

export default TemplatesPage;

