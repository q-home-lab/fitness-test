import React, { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import api from '../services/api';
import { Dumbbell, Utensils, Calendar, X } from 'lucide-react';
import useToastStore from '../stores/useToastStore';
import logger from '../utils/logger';

const AssignTemplateModal = ({ open, onOpenChange, clientId, clientEmail, type = 'routine', onSuccess }) => {
    const [templates, setTemplates] = useState([]);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [assignedDate, setAssignedDate] = useState(new Date().toISOString().split('T')[0]);
    const [isRecurring, setIsRecurring] = useState(false);
    const [recurringDay, setRecurringDay] = useState(null);
    const [loading, setLoading] = useState(false);
    const [templatesLoading, setTemplatesLoading] = useState(true);
    const toast = useToastStore();

    useEffect(() => {
        if (open) {
            loadTemplates();
            // Reset form
            setSelectedTemplate(null);
            setAssignedDate(new Date().toISOString().split('T')[0]);
            setIsRecurring(false);
            setRecurringDay(null);
        }
    }, [open, type]);

    const loadTemplates = async () => {
        try {
            setTemplatesLoading(true);
            const endpoint = type === 'routine' ? '/templates/routines' : '/templates/diets';
            const response = await api.get(endpoint);
            setTemplates(response.data.templates || []);
        } catch (error) {
            logger.error('Error cargando plantillas:', error);
            toast.error('Error al cargar las plantillas');
        } finally {
            setTemplatesLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!selectedTemplate) {
            toast.error('Por favor, selecciona una plantilla');
            return;
        }

        setLoading(true);
        try {
            await api.post('/templates/assign', {
                client_id: clientId,
                template_id: selectedTemplate.template_id,
                assigned_date: assignedDate,
                is_recurring: isRecurring,
                recurring_day: isRecurring ? recurringDay : null,
            });

            toast.success(`${type === 'routine' ? 'Rutina' : 'Dieta'} asignada correctamente`);
            onSuccess?.();
            onOpenChange(false);
        } catch (error) {
            logger.error('Error asignando plantilla:', error);
            toast.error(error.response?.data?.error || `Error al asignar la ${type === 'routine' ? 'rutina' : 'dieta'}`);
        } finally {
            setLoading(false);
        }
    };

    const daysOfWeek = [
        { value: 0, label: 'Domingo' },
        { value: 1, label: 'Lunes' },
        { value: 2, label: 'Martes' },
        { value: 3, label: 'Miércoles' },
        { value: 4, label: 'Jueves' },
        { value: 5, label: 'Viernes' },
        { value: 6, label: 'Sábado' },
    ];

    return (
        <Dialog.Root open={open} onOpenChange={onOpenChange}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
                <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 backdrop-blur-xl bg-white/60 dark:bg-black/60 rounded-3xl shadow-xl p-6 w-full max-w-2xl z-50 border border-gray-200/50 dark:border-gray-800/50 max-h-[90vh] overflow-y-auto">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            {type === 'routine' ? (
                                <div className="w-12 h-12 backdrop-blur-sm bg-blue-100/60 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center border border-blue-200/50 dark:border-blue-800/50">
                                    <Dumbbell className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                </div>
                            ) : (
                                <div className="w-12 h-12 backdrop-blur-sm bg-green-100/60 dark:bg-green-900/30 rounded-2xl flex items-center justify-center border border-green-200/50 dark:border-green-800/50">
                                    <Utensils className="w-6 h-6 text-green-600 dark:text-green-400" />
                                </div>
                            )}
                            <div>
                                <Dialog.Title className="text-2xl font-light tracking-tight text-gray-900 dark:text-white">
                                    Asignar {type === 'routine' ? 'Rutina' : 'Dieta'}
                                </Dialog.Title>
                                <Dialog.Description className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                    Para {clientEmail}
                                </Dialog.Description>
                            </div>
                        </div>
                        <Dialog.Close asChild>
                            <button className="w-10 h-10 rounded-xl backdrop-blur-sm bg-gray-100/60 dark:bg-gray-800/60 hover:bg-gray-200/60 dark:hover:bg-gray-700/60 border border-gray-200/50 dark:border-gray-800/50 flex items-center justify-center transition-all text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </Dialog.Close>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Selección de plantilla */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                Selecciona una plantilla
                            </label>
                            {templatesLoading ? (
                                <div className="flex justify-center py-8">
                                    <div className="w-6 h-6 border-2 border-blue-600 dark:border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                                </div>
                            ) : templates.length === 0 ? (
                                <div className="backdrop-blur-sm bg-gray-100/60 dark:bg-gray-800/60 rounded-2xl p-6 text-center border border-gray-200/50 dark:border-gray-700/50">
                                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                                        No tienes plantillas de {type === 'routine' ? 'rutinas' : 'dietas'} creadas
                                    </p>
                                    <a
                                        href="/coach/templates"
                                        className="inline-flex items-center gap-2 px-4 py-2 backdrop-blur-xl bg-blue-600 dark:bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-700 dark:hover:bg-blue-600 transition-all shadow-sm hover:shadow-md active:scale-95"
                                    >
                                        Crear Plantilla
                                    </a>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-3 max-h-64 overflow-y-auto">
                                    {templates.map((template) => (
                                        <button
                                            key={template.template_id}
                                            type="button"
                                            onClick={() => setSelectedTemplate(template)}
                                            className={`p-4 rounded-2xl border-2 transition-all text-left ${
                                                selectedTemplate?.template_id === template.template_id
                                                    ? 'backdrop-blur-xl bg-blue-50/60 dark:bg-blue-900/20 border-blue-500/50 dark:border-blue-500/50 shadow-md'
                                                    : 'backdrop-blur-sm bg-white/60 dark:bg-black/60 border-gray-200/50 dark:border-gray-800/50 hover:border-gray-300/50 dark:hover:border-gray-700/50'
                                            }`}
                                        >
                                            <div className="font-semibold text-gray-900 dark:text-white mb-1">
                                                {template.name}
                                            </div>
                                            {template.description && (
                                                <div className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                                                    {template.description}
                                                </div>
                                            )}
                                            {type === 'routine' && template.exercises && (
                                                <div className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                                                    {Array.isArray(template.exercises) ? template.exercises.length : 0} ejercicios
                                                </div>
                                            )}
                                            {type === 'diet' && template.meals && (
                                                <div className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                                                    {Array.isArray(template.meals) ? template.meals.length : 0} comidas
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Fecha de asignación */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Fecha de asignación
                            </label>
                            <input
                                type="date"
                                value={assignedDate}
                                onChange={(e) => setAssignedDate(e.target.value)}
                                className="w-full px-4 py-3 backdrop-blur-sm bg-white/60 dark:bg-black/60 border border-gray-300/50 dark:border-gray-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 dark:focus:border-blue-400 text-gray-900 dark:text-white transition-all shadow-sm"
                                required
                            />
                        </div>

                        {/* Recurrencia */}
                        <div className="space-y-3">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={isRecurring}
                                    onChange={(e) => setIsRecurring(e.target.checked)}
                                    className="w-5 h-5 rounded border-gray-300 dark:border-gray-700 text-blue-600 focus:ring-blue-500/20"
                                />
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Repetir semanalmente
                                </span>
                            </label>

                            {isRecurring && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Día de la semana
                                    </label>
                                    <select
                                        value={recurringDay ?? ''}
                                        onChange={(e) => setRecurringDay(parseInt(e.target.value))}
                                        className="w-full px-4 py-3 backdrop-blur-sm bg-white/60 dark:bg-black/60 border border-gray-300/50 dark:border-gray-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 dark:focus:border-blue-400 text-gray-900 dark:text-white transition-all shadow-sm"
                                        required={isRecurring}
                                    >
                                        <option value="">Selecciona un día</option>
                                        {daysOfWeek.map((day) => (
                                            <option key={day.value} value={day.value}>
                                                {day.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>

                        {/* Botones */}
                        <div className="flex gap-3 pt-4">
                            <Dialog.Close asChild>
                                <button
                                    type="button"
                                    className="flex-1 px-6 py-3 backdrop-blur-sm bg-gray-200/60 dark:bg-gray-700/60 text-gray-900 dark:text-white rounded-xl font-medium hover:bg-gray-300/60 dark:hover:bg-gray-600/60 transition-all shadow-sm hover:shadow-md active:scale-95"
                                >
                                    Cancelar
                                </button>
                            </Dialog.Close>
                            <button
                                type="submit"
                                disabled={loading || !selectedTemplate || templates.length === 0}
                                className="flex-1 px-6 py-3 backdrop-blur-xl bg-blue-600 dark:bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-700 dark:hover:bg-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl active:scale-95"
                            >
                                {loading ? 'Asignando...' : `Asignar ${type === 'routine' ? 'Rutina' : 'Dieta'}`}
                            </button>
                        </div>
                    </form>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
};

export default AssignTemplateModal;

