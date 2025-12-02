import React, { useState, useEffect, useCallback } from 'react';
import { AppLayout } from '@/app/layout/AppLayout';
import { PageContainer } from '@/shared/components/layout/PageContainer';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, getDay } from 'date-fns';
import { es } from 'date-fns/locale';
import * as Dialog from '@radix-ui/react-dialog';
import api from '../services/api';
import logger from '@/utils/logger';

const CalendarPage = () => {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [scheduledRoutines, setScheduledRoutines] = useState([]);
    const [routines, setRoutines] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(null);
    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [selectedRoutine, setSelectedRoutine] = useState('');

    // Obtener rutinas planificadas para el mes actual
    const fetchScheduledRoutines = useCallback(async () => {
        try {
            setLoading(true);
            const year = currentMonth.getFullYear();
            const month = currentMonth.getMonth() + 1;
            
            const response = await api.get(`/calendar/schedule?month=${month}&year=${year}`);
            setScheduledRoutines(response.data.scheduled || []);
            
            // Verificar completitud de rutinas
            const today = format(new Date(), 'yyyy-MM-dd');
            await api.get(`/calendar/schedule/check-completion/${today}`);
            
        } catch (error) {
            logger.error('Error al cargar rutinas planificadas:', error);
        } finally {
            setLoading(false);
        }
    }, [currentMonth]);

    // Obtener lista de rutinas disponibles
    const fetchRoutines = useCallback(async () => {
        try {
            const response = await api.get('/routines');
            setRoutines(response.data.routines || []);
        } catch (error) {
            logger.error('Error al cargar rutinas:', error);
        }
    }, []);

    useEffect(() => {
        fetchScheduledRoutines();
        fetchRoutines();
    }, [fetchScheduledRoutines, fetchRoutines]);

    // Obtener rutinas para una fecha específica
    const getRoutinesForDate = (date) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        return scheduledRoutines.filter(sr => sr.scheduled_date === dateStr);
    };

    // Programar una rutina para una fecha
    const handleScheduleRoutine = async () => {
        if (!selectedDate || !selectedRoutine) {
            alert('Por favor selecciona una fecha y una rutina');
            return;
        }

        try {
            const dateStr = format(selectedDate, 'yyyy-MM-dd');
            await api.post('/calendar/schedule', {
                routine_id: parseInt(selectedRoutine),
                scheduled_date: dateStr
            });
            
            setShowScheduleModal(false);
            setSelectedRoutine('');
            fetchScheduledRoutines();
        } catch (error) {
            logger.error('Error al programar rutina:', error);
            alert(error.response?.data?.error || 'Error al programar la rutina');
        }
    };

    // Marcar rutina como completada/no completada
    const handleToggleComplete = async (scheduledId, currentStatus) => {
        try {
            await api.put(`/calendar/schedule/${scheduledId}/complete`, {
                is_completed: !currentStatus
            });
            
            fetchScheduledRoutines();
            // Verificar completitud del día
            const today = format(new Date(), 'yyyy-MM-dd');
            await api.get(`/calendar/schedule/check-completion/${today}`);
        } catch (error) {
            logger.error('Error al actualizar estado:', error);
            alert('Error al actualizar el estado de la rutina');
        }
    };

    // Eliminar rutina planificada
    const handleDeleteScheduled = async (scheduledId, routineName) => {
        if (!window.confirm(`¿Eliminar "${routineName}" de esta fecha?`)) {
            return;
        }

        try {
            await api.delete(`/calendar/schedule/${scheduledId}`);
            fetchScheduledRoutines();
        } catch (error) {
            logger.error('Error al eliminar rutina planificada:', error);
            alert('Error al eliminar la rutina planificada');
        }
    };

    // Generar días del calendario
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    // const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd }); // No se usa, se usa calendarDays
    
    // Añadir días de la semana anterior para completar la primera semana
    const firstDayOfWeek = getDay(monthStart);
    const daysToAdd = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1; // Lunes = 1
    const calendarStart = new Date(monthStart);
    calendarStart.setDate(calendarStart.getDate() - daysToAdd);
    
    // Añadir días de la semana siguiente para completar la última semana
    const lastDayOfWeek = getDay(monthEnd);
    const daysToAddEnd = lastDayOfWeek === 0 ? 0 : 7 - lastDayOfWeek;
    const calendarEnd = new Date(monthEnd);
    calendarEnd.setDate(calendarEnd.getDate() + daysToAddEnd);
    
    const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

    const handlePreviousMonth = () => {
        setCurrentMonth(subMonths(currentMonth, 1));
    };

    const handleNextMonth = () => {
        setCurrentMonth(addMonths(currentMonth, 1));
    };

    const handleDateClick = (date) => {
        setSelectedDate(date);
        setShowScheduleModal(true);
    };

    const dayNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

    if (loading) {
        return (
            <AppLayout>
                <PageContainer>
                    <div className="flex justify-center py-20">
                        <div className="w-8 h-8 border-2 border-[#D45A0F] dark:border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                </PageContainer>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <PageContainer
                title="Calendario"
                description="Planifica tus entrenamientos"
            >
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-4xl md:text-5xl font-semibold text-gray-900 dark:text-white mb-2 tracking-tight">
                            Calendario
                        </h1>
                        <p className="text-lg text-gray-600 dark:text-gray-400">
                            Planifica y rastrea tus rutinas
                        </p>
                    </div>

                    {/* Controles del calendario */}
                    <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-6 mb-6 shadow-sm transition-colors duration-300">
                        <div className="flex items-center justify-between mb-6">
                            <button
                                onClick={handlePreviousMonth}
                                className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-900 dark:text-white"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                                {format(currentMonth, 'MMMM yyyy', { locale: es })}
                            </h2>
                            <button
                                onClick={handleNextMonth}
                                className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-900 dark:text-white"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        </div>

                        {/* Calendario */}
                        <div className="grid grid-cols-7 gap-2">
                            {/* Días de la semana */}
                            {dayNames.map((day) => (
                                <div key={day} className="text-center font-semibold text-sm text-gray-600 dark:text-gray-400 py-2">
                                    {day}
                                </div>
                            ))}

                            {/* Días del mes */}
                            {calendarDays.map((day, index) => {
                                const isCurrentMonth = isSameMonth(day, currentMonth);
                                const isToday = isSameDay(day, new Date());
                                const dayRoutines = getRoutinesForDate(day);
                                const completedCount = dayRoutines.filter(r => r.is_completed).length;
                                const totalCount = dayRoutines.length;

                                return (
                                    <div
                                        key={index}
                                        onClick={() => isCurrentMonth && handleDateClick(day)}
                                        className={`min-h-[80px] p-2 rounded-xl border transition-all cursor-pointer ${
                                            !isCurrentMonth
                                                ? 'opacity-30 cursor-default border-gray-200 dark:border-gray-800'
                                                : isToday
                                                ? 'border-blue-600 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30'
                                                : 'border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800'
                                        }`}
                                    >
                                        <div className={`text-sm font-medium mb-1 ${isToday ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}`}>
                                            {format(day, 'd')}
                                        </div>
                                        {isCurrentMonth && dayRoutines.length > 0 && (
                                            <div className="space-y-1">
                                                {dayRoutines.slice(0, 2).map((sr) => (
                                                    <div
                                                        key={sr.scheduled_id}
                                                        className={`text-xs p-1 rounded truncate ${
                                                            sr.is_completed
                                                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                                                : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                                                        }`}
                                                        title={sr.routine_name}
                                                    >
                                                        {sr.routine_name}
                                                    </div>
                                                ))}
                                                {totalCount > 2 && (
                                                    <div className="text-xs text-gray-600 dark:text-gray-400">
                                                        +{totalCount - 2} más
                                                    </div>
                                                )}
                                                {completedCount > 0 && totalCount === completedCount && (
                                                    <div className="text-xs text-green-600 dark:text-green-400 font-semibold mt-1">
                                                        ✓ Completo
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Lista de rutinas planificadas para el mes */}
                    <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm transition-colors duration-300">
                        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                            Rutinas Planificadas
                        </h2>
                        {scheduledRoutines.length === 0 ? (
                            <p className="text-gray-600 dark:text-gray-400 text-center py-8">
                                No hay rutinas planificadas para este mes
                            </p>
                        ) : (
                            <div className="space-y-3">
                                {scheduledRoutines.map((sr) => (
                                    <div
                                        key={sr.scheduled_id}
                                        className={`p-4 rounded-xl border transition-colors duration-300 ${
                                            sr.is_completed
                                                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                                                : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-800'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h3 className="font-semibold text-gray-900 dark:text-white">
                                                        {sr.routine_name}
                                                    </h3>
                                                    {sr.is_completed && (
                                                        <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-medium">
                                                            Completado
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                                    {format(new Date(sr.scheduled_date), "EEEE, d 'de' MMMM", { locale: es })}
                                                </p>
                                                {sr.completed_at && (
                                                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                                        Completado: {format(new Date(sr.completed_at), "d MMM yyyy 'a las' HH:mm", { locale: es })}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleToggleComplete(sr.scheduled_id, sr.is_completed)}
                                                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                                                        sr.is_completed
                                                            ? 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                                                            : 'bg-blue-600 dark:bg-blue-500 text-white hover:bg-blue-700 dark:hover:bg-blue-600'
                                                    }`}
                                                >
                                                    {sr.is_completed ? 'Desmarcar' : 'Completar'}
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteScheduled(sr.scheduled_id, sr.routine_name)}
                                                    className="p-2 rounded-xl bg-gray-200 dark:bg-gray-700 text-red-600 dark:text-red-400 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                {/* Modal para programar rutina - Radix UI */}
                <Dialog.Root open={showScheduleModal} onOpenChange={setShowScheduleModal}>
                <Dialog.Portal>
                    <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
                    <Dialog.Content className="fixed top-0 md:top-1/2 left-0 md:left-1/2 md:transform md:-translate-x-1/2 md:-translate-y-1/2 bg-white dark:bg-gray-900 rounded-t-3xl md:rounded-3xl border border-gray-200 dark:border-gray-800 shadow-2xl p-6 md:p-8 max-w-md w-full md:w-[calc(100%-2rem)] md:mx-4 max-h-[90vh] md:max-h-[90vh] h-[90vh] md:h-auto overflow-y-auto z-50 transition-colors duration-300">
                        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 pb-4 md:pb-0 md:border-0 md:static z-10">
                            <Dialog.Title className="text-xl md:text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                                Programar Rutina
                            </Dialog.Title>
                            <Dialog.Description className="text-sm md:text-base text-gray-600 dark:text-gray-400 mb-4 md:mb-6">
                                {selectedDate && format(selectedDate, "EEEE, d 'de' MMMM yyyy", { locale: es })}
                            </Dialog.Description>
                        </div>
                        <div className="px-0 md:px-0 pb-6 md:pb-0">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Selecciona una rutina
                                </label>
                                <select
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 dark:focus:border-blue-400 text-gray-900 dark:text-white transition-colors duration-300"
                                    value={selectedRoutine}
                                    onChange={(e) => setSelectedRoutine(e.target.value)}
                                >
                                    <option value="">-- Selecciona una rutina --</option>
                                    {routines.map((routine) => (
                                        <option key={routine.routine_id} value={routine.routine_id}>
                                            {routine.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-3 pt-4">
                                <Dialog.Close asChild>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSelectedRoutine('');
                                            setSelectedDate(null);
                                        }}
                                        className="flex-1 px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-2xl font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                </Dialog.Close>
                                <button
                                    onClick={handleScheduleRoutine}
                                    className="flex-1 px-4 py-3 bg-blue-600 dark:bg-blue-500 text-white rounded-2xl font-semibold hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
                                >
                                    Programar
                                </button>
                            </div>
                        </div>
                        </div>
                    </Dialog.Content>
                </Dialog.Portal>
            </Dialog.Root>
            </PageContainer>
        </AppLayout>
    );
};

export default CalendarPage;
