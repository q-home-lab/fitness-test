import React, { useState, useEffect, useCallback } from 'react';
import { format, subDays, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import api from '../services/api';
import logger from '../utils/logger';

const WeeklyStatsWidget = React.memo(() => {
    const [weeklyData, setWeeklyData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedWeek, setSelectedWeek] = useState(0); // 0 = esta semana, 1 = semana pasada, etc.

    const fetchWeeklyData = useCallback(async () => {
        setLoading(true);
        try {
            const today = new Date();
            const weekStart = startOfWeek(subDays(today, selectedWeek * 7), { locale: es });
            const weekEnd = endOfWeek(subDays(today, selectedWeek * 7), { locale: es });
            const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

            const promises = weekDays.map(day => 
                api.get(`/logs/${format(day, 'yyyy-MM-dd')}`).catch(() => ({ data: { log: null } }))
            );

            const responses = await Promise.all(promises);
            const weekData = weekDays.map((day, idx) => {
                const log = responses[idx].data.log;
                return {
                    date: format(day, 'EEE', { locale: es }),
                    dateFull: format(day, 'yyyy-MM-dd'),
                    weight: log ? parseFloat(log.weight) : null,
                    caloriesConsumed: log ? parseFloat(log.consumed_calories || 0) : 0,
                    caloriesBurned: log ? parseFloat(log.burned_calories || 0) : 0,
                    hasData: !!log,
                };
            });

            setWeeklyData(weekData);
        } catch (error) {
            logger.error('Error al cargar datos semanales:', error);
        } finally {
            setLoading(false);
        }
    }, [selectedWeek]);

    useEffect(() => {
        fetchWeeklyData();
    }, [fetchWeeklyData]);

    const totalCaloriesConsumed = weeklyData.reduce((sum, day) => sum + day.caloriesConsumed, 0);
    const totalCaloriesBurned = weeklyData.reduce((sum, day) => sum + day.caloriesBurned, 0);
    const avgWeight = weeklyData.filter(d => d.weight).reduce((sum, d) => sum + d.weight, 0) / weeklyData.filter(d => d.weight).length || 0;
    const activeDays = weeklyData.filter(d => d.caloriesBurned > 0 || d.caloriesConsumed > 0).length;

    if (loading) {
        return (
            <div className="backdrop-blur-xl bg-white/60 dark:bg-black/60 rounded-3xl border border-gray-200/50 dark:border-gray-800/50 p-6 shadow-sm transition-all duration-500">
                <div className="flex justify-center py-8">
                    <div className="w-6 h-6 border-2 border-blue-600 dark:border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="backdrop-blur-xl bg-white/60 dark:bg-black/60 rounded-3xl border border-gray-200/50 dark:border-gray-800/50 p-6 shadow-sm hover:shadow-lg hover:border-gray-300/50 dark:hover:border-gray-700/50 transition-all duration-500">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-light tracking-tight text-gray-900 dark:text-white">
                    Resumen Semanal
                </h2>
                <div className="flex gap-2">
                    <button
                        onClick={() => setSelectedWeek(prev => Math.max(0, prev - 1))}
                        disabled={selectedWeek === 0}
                        className="px-3 py-1.5 backdrop-blur-md bg-white/60 dark:bg-black/60 border border-gray-200/50 dark:border-gray-800/50 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-white/80 dark:hover:bg-black/80 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        ←
                    </button>
                    <button
                        onClick={() => setSelectedWeek(prev => prev + 1)}
                        className="px-3 py-1.5 backdrop-blur-md bg-white/60 dark:bg-black/60 border border-gray-200/50 dark:border-gray-800/50 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-white/80 dark:hover:bg-black/80 transition-all"
                    >
                        →
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="backdrop-blur-md bg-blue-50/60 dark:bg-blue-900/20 rounded-2xl p-4 border border-blue-200/50 dark:border-blue-800/50">
                    <div className="text-sm text-blue-600 dark:text-blue-400 font-medium mb-1">
                        Calorías Consumidas
                    </div>
                    <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                        {totalCaloriesConsumed.toFixed(0)}
                    </div>
                    <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                        kcal totales
                    </div>
                </div>

                <div className="backdrop-blur-md bg-green-50/60 dark:bg-green-900/20 rounded-2xl p-4 border border-green-200/50 dark:border-green-800/50">
                    <div className="text-sm text-green-600 dark:text-green-400 font-medium mb-1">
                        Calorías Quemadas
                    </div>
                    <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                        {totalCaloriesBurned.toFixed(0)}
                    </div>
                    <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                        kcal totales
                    </div>
                </div>

                <div className="backdrop-blur-md bg-purple-50/60 dark:bg-purple-900/20 rounded-2xl p-4 border border-purple-200/50 dark:border-purple-800/50">
                    <div className="text-sm text-purple-600 dark:text-purple-400 font-medium mb-1">
                        Peso Promedio
                    </div>
                    <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                        {avgWeight > 0 ? `${avgWeight.toFixed(1)} kg` : 'N/A'}
                    </div>
                    <div className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                        esta semana
                    </div>
                </div>

                <div className="backdrop-blur-md bg-orange-50/60 dark:bg-orange-900/20 rounded-2xl p-4 border border-orange-200/50 dark:border-orange-800/50">
                    <div className="text-sm text-orange-600 dark:text-orange-400 font-medium mb-1">
                        Días Activos
                    </div>
                    <div className="text-2xl font-bold text-orange-700 dark:text-orange-300">
                        {activeDays}/7
                    </div>
                    <div className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                        con actividad
                    </div>
                </div>
            </div>

            {/* Gráfico de barras simple para la semana */}
            <div className="space-y-2">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    Calorías por Día
                </h3>
                {weeklyData.map((day, idx) => {
                    const maxCalories = Math.max(...weeklyData.map(d => d.caloriesConsumed + d.caloriesBurned), 1);
                    const consumedPercent = (day.caloriesConsumed / maxCalories) * 100;
                    const burnedPercent = (day.caloriesBurned / maxCalories) * 100;
                    
                    return (
                        <div key={idx} className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                                <span className="font-medium text-gray-700 dark:text-gray-300 w-12">
                                    {day.date}
                                </span>
                                <div className="flex-1 mx-2">
                                    <div className="flex h-4 rounded-full overflow-hidden">
                                        <div
                                            className="bg-blue-500 dark:bg-blue-400"
                                            style={{ width: `${consumedPercent}%` }}
                                            title={`Consumidas: ${day.caloriesConsumed.toFixed(0)} kcal`}
                                        ></div>
                                        <div
                                            className="bg-green-500 dark:bg-green-400"
                                            style={{ width: `${burnedPercent}%` }}
                                            title={`Quemadas: ${day.caloriesBurned.toFixed(0)} kcal`}
                                        ></div>
                                    </div>
                                </div>
                                <span className="text-gray-600 dark:text-gray-400 text-xs w-20 text-right">
                                    {(day.caloriesConsumed + day.caloriesBurned).toFixed(0)} kcal
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
});

WeeklyStatsWidget.displayName = 'WeeklyStatsWidget';

export default WeeklyStatsWidget;

