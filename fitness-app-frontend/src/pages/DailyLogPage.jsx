import React, { useEffect, useState, useCallback } from 'react';
import ModernNavbar from '../components/ModernNavbar';
import BottomNavigation from '../components/BottomNavigation';
import ExerciseSearchAndAdd from '../components/ExerciseSearchAndAdd';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import api from '../services/api';

const DailyLogPage = () => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [log, setLog] = useState(null);
    const [dailyExercises, setDailyExercises] = useState([]);
    const [loading, setLoading] = useState(true);
    
    const formattedDate = format(currentDate, 'yyyy-MM-dd');

    const fetchDailyLog = useCallback(async () => {
        setLoading(true);
        try {
            const response = await api.get(`/logs/${formattedDate}`);
            setLog(response.data.log);
            // Obtener ejercicios del día desde la respuesta
            setDailyExercises(response.data.dailyExercises || []);
        } catch (error) {
            console.error('Error al cargar log diario:', error);
            setLog(null);
            setDailyExercises([]);
        } finally {
            setLoading(false);
        }
    }, [formattedDate]);

    useEffect(() => {
        fetchDailyLog();
    }, [fetchDailyLog]);

    const handleDateChange = (days) => {
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() + days);
        setCurrentDate(newDate);
    };

    const handleLogUpdated = () => {
        fetchDailyLog();
    };

    const totalCaloriesBurned = dailyExercises.reduce((acc, exercise) => {
        const calories = parseFloat(exercise.burned_calories);
        return acc + (isNaN(calories) ? 0 : calories);
    }, 0);

    return (
        <>
            <ModernNavbar />
            <main className="min-h-screen bg-[#FAF3E1] dark:bg-black pb-24 md:pb-8 transition-colors duration-300">
                <div className="max-w-7xl mx-auto px-6 py-8">
                    {/* Header */}
                    <div className="mb-8">
                        <div className="flex items-center justify-between mb-2">
                            <h1 className="text-4xl md:text-5xl font-semibold text-gray-900 dark:text-white tracking-tight">
                                Registro Diario
                            </h1>
                            
                            {/* Date Picker */}
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => handleDateChange(-1)}
                                    className="w-10 h-10 rounded-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-gray-900 dark:text-white"
                                    aria-label="Día anterior"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                </button>
                                <input
                                    type="date"
                                    className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-center text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 dark:focus:border-blue-400 text-gray-900 dark:text-white transition-colors duration-300"
                                    value={formattedDate}
                                    onChange={(e) => {
                                        const newDate = new Date(e.target.value);
                                        setCurrentDate(newDate);
                                    }}
                                />
                                <button
                                    onClick={() => handleDateChange(1)}
                                    className="w-10 h-10 rounded-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-gray-900 dark:text-white"
                                    aria-label="Día siguiente"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                        <p className="text-lg text-gray-600 dark:text-gray-400">
                            {format(currentDate, 'EEEE, d MMMM yyyy', { locale: es })}
                        </p>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-20">
                            <div className="w-8 h-8 border-2 border-blue-600 dark:border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Resumen de Calorías Quemadas */}
                            <div className="bg-gradient-to-br from-pink-500 to-blue-600 dark:from-pink-600 dark:to-blue-500 rounded-3xl p-8 text-white shadow-lg">
                                <h2 className="text-2xl font-semibold mb-2">Calorías Quemadas</h2>
                                <div className="text-5xl font-bold mb-2">{totalCaloriesBurned.toFixed(0)}</div>
                                <div className="text-white/80">kcal totales</div>
                            </div>

                            {/* Búsqueda y Añadir Ejercicio */}
                            <ExerciseSearchAndAdd 
                                log={log}
                                onLogUpdated={handleLogUpdated}
                            />

                            {/* Lista de Ejercicios */}
                            <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm transition-colors duration-300">
                                <div className="p-6 border-b border-gray-200 dark:border-gray-800">
                                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                                        Ejercicios Registrados
                                    </h2>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                        {dailyExercises.length} {dailyExercises.length === 1 ? 'ejercicio registrado' : 'ejercicios registrados'}
                                    </p>
                                </div>
                                
                                {dailyExercises.length === 0 ? (
                                    <div className="text-center py-16 px-6">
                                        <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-400 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                            </svg>
                                        </div>
                                        <p className="text-gray-600 dark:text-gray-400 font-medium mb-1">No hay ejercicios registrados</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-500">Añade tu primer ejercicio para comenzar</p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-gray-200 dark:divide-gray-800">
                                        {dailyExercises.map((exercise) => (
                                            <div 
                                                key={exercise.daily_exercise_id} 
                                                className="p-6 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors duration-300"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex-1">
                                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                                            {exercise.exercise?.name || 'Ejercicio'}
                                                        </h3>
                                                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
                                                            {exercise.sets_done && (
                                                                <span>{exercise.sets_done} series</span>
                                                            )}
                                                            {exercise.reps_done && (
                                                                <span>{exercise.reps_done} reps</span>
                                                            )}
                                                            {exercise.duration_minutes && (
                                                                <span>{exercise.duration_minutes} min</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-xl font-semibold text-pink-600 dark:text-pink-400">
                                                            {(parseFloat(exercise.burned_calories) || 0).toFixed(0)}
                                                        </div>
                                                        <div className="text-xs text-gray-500 dark:text-gray-500">kcal</div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </main>
            <BottomNavigation />
        </>
    );
};

export default DailyLogPage;
