import React, { useEffect, useState, useCallback, lazy, Suspense } from 'react';
import { AppLayout } from '@/app/layout/AppLayout';
import { PageContainer } from '@/shared/components/layout/PageContainer';
import TodayTasksPanel from '../components/TodayTasksPanel';
import { DashboardSkeleton } from '@/components/SkeletonLoader';
import RequestCoachAttention from '@/components/RequestCoachAttention';
import { format } from 'date-fns';
import api from '@/services/api';
import useUserStore from '@/stores/useUserStore';

// Lazy load de componentes pesados para optimizar bundle size
const WeightLineChart = lazy(() => import('@/components/WeightLineChart'));
const CalorieRadialChart = lazy(() => import('@/components/CalorieRadialChart'));
const MacroBarChart = lazy(() => import('@/components/MacroBarChart'));
const WeeklyStatsWidget = lazy(() => import('@/components/WeeklyStatsWidget'));
const GoalManager = lazy(() => import('@/components/GoalManager'));
const FirstStepsGuide = lazy(() => import('@/components/FirstStepsGuide'));

// Skeleton para WeightLineChart
const WeightChartSkeleton = () => (
  <div className="backdrop-blur-xl bg-white/60 dark:bg-black/60 rounded-3xl border border-gray-200/50 dark:border-gray-800/50 p-6 shadow-sm animate-pulse">
    <div className="h-6 bg-gray-200/60 dark:bg-gray-700/60 rounded w-1/2 mb-4"></div>
    <div className="h-64 bg-gray-200/60 dark:bg-gray-700/60 rounded"></div>
  </div>
); 

const Dashboard = () => {
    const [currentDate] = useState(new Date());
    const [log, setLog] = useState(null); 
    const [mealItems, setMealItems] = useState([]);
    const [goal, setGoal] = useState(null);
    const [loading, setLoading] = useState(true);
    
    const formattedDate = format(currentDate, 'yyyy-MM-dd');
    
    const fetchDailyLog = useCallback(async () => {
        try {
            const response = await api.get(`/logs/${formattedDate}`);
            setLog(response.data.log); 
            setMealItems(response.data.mealItems || []);
        } catch (err) {
            console.error('Error al cargar log diario:', err);
        }
    }, [formattedDate]);

    const fetchGoal = useCallback(async () => {
        try {
            const response = await api.get('/goals');
            if (response.data.goal) {
                setGoal(response.data.goal);
            } else {
                setGoal(null);
            }
        } catch (error) {
            console.error('Error al cargar objetivo:', error);
            setGoal(null);
        }
    }, []);

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            await Promise.all([fetchDailyLog(), fetchGoal()]);
            setLoading(false);
        };
        loadData();
    }, [fetchDailyLog, fetchGoal]);

    const totalMacros = mealItems.reduce((acc, item) => {
        if (!item || !item.food) return acc;
        const quantity = parseFloat(item.quantity_grams) || 0;
        const food = item.food;
        
        acc.protein += (parseFloat(food.protein_g || 0) / 100) * quantity;
        acc.carbs += (parseFloat(food.carbs_g || 0) / 100) * quantity;
        acc.fat += (parseFloat(food.fat_g || 0) / 100) * quantity;
        return acc;
    }, { protein: 0, carbs: 0, fat: 0 });

    const caloriesConsumed = log ? parseFloat(log.consumed_calories) : 0;
    const calorieGoal = goal && goal.daily_calorie_goal 
        ? parseFloat(goal.daily_calorie_goal) 
        : 2000;
    const caloriesBurned = log ? parseFloat(log.burned_calories) : 0;

    const handleTaskComplete = (task) => {
        // Recargar datos cuando se complete una tarea
        fetchDailyLog();
        fetchGoal();
    };

    return (
        <AppLayout>
            <PageContainer 
                title="Dashboard" 
                description="Resumen de tu progreso hoy"
            >
                {loading ? (
                    <DashboardSkeleton />
                ) : (
                    <>
                        {/* Guía de Primeros Pasos - Solo para usuarios nuevos */}
                        <Suspense fallback={null}>
                            <FirstStepsGuide />
                        </Suspense>

                        {/* SECCIÓN PRINCIPAL: Tareas Pendientes de Hoy */}
                        <div className="mb-8">
                            <TodayTasksPanel onTaskComplete={handleTaskComplete} />
                        </div>

                        {/* Sección 1: Resumen de Calorías y Objetivos */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                            {/* Gráfica Radial de Calorías */}
                            <div className="backdrop-blur-xl bg-white/60 dark:bg-black/60 rounded-3xl border border-gray-200/50 dark:border-gray-800/50 p-6 shadow-sm hover:shadow-lg hover:border-gray-300/50 dark:hover:border-gray-700/50 transition-all duration-500">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-2xl font-light tracking-tight text-gray-900 dark:text-white">
                                        Calorías Consumidas
                                    </h2>
                                    {goal && goal.daily_calorie_goal && (
                                        <span className="text-xs px-3 py-1.5 bg-white/60 dark:bg-black/60 backdrop-blur-md border border-gray-200/50 dark:border-gray-800/50 text-gray-700 dark:text-gray-300 rounded-full font-medium">
                                            Objetivo: {parseFloat(goal.daily_calorie_goal).toFixed(0)} kcal
                                        </span>
                                    )}
                                </div>
                                <Suspense fallback={<div className="h-64 flex items-center justify-center"><div className="w-8 h-8 border-2 border-blue-600 dark:border-blue-400 border-t-transparent rounded-full animate-spin"></div></div>}>
                                    <CalorieRadialChart 
                                        consumed={caloriesConsumed} 
                                        goal={calorieGoal}
                                    />
                                </Suspense>
                                {!goal && (
                                    <div className="mt-4 p-4 backdrop-blur-md bg-yellow-50/60 dark:bg-yellow-900/20 border border-yellow-200/50 dark:border-yellow-800/50 rounded-2xl">
                                        <p className="text-sm text-yellow-800 dark:text-yellow-300">
                                            💡 Establece un objetivo de peso para obtener recomendaciones personalizadas de calorías
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Gestor de Objetivos */}
                            <Suspense fallback={<div className="h-64 backdrop-blur-xl bg-white/60 dark:bg-black/60 rounded-3xl border border-gray-200/50 dark:border-gray-800/50 p-6 animate-pulse"></div>}>
                                <GoalManager 
                                    currentWeight={log ? parseFloat(log.weight) : null}
                                    onGoalUpdated={(updatedGoal) => {
                                        setGoal(updatedGoal);
                                        fetchGoal();
                                    }}
                                />
                            </Suspense>
                        </div>

                        {/* Sección 2: Evolución de Peso */}
                        <div className="mb-6">
                            <Suspense fallback={<WeightChartSkeleton />}>
                                <WeightLineChart macros={totalMacros} />
                            </Suspense>
                        </div>

                        {/* Sección 3: Macros y Estadísticas Semanales */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                            {/* Gráfico de Macros */}
                            <div className="backdrop-blur-xl bg-white/60 dark:bg-black/60 rounded-3xl border border-gray-200/50 dark:border-gray-800/50 p-6 shadow-sm hover:shadow-lg hover:border-gray-300/50 dark:hover:border-gray-700/50 transition-all duration-500">
                                <h2 className="text-2xl font-light tracking-tight text-gray-900 dark:text-white mb-6">
                                    Macronutrientes
                                </h2>
                                <Suspense fallback={<div className="h-64 flex items-center justify-center"><div className="w-8 h-8 border-2 border-blue-600 dark:border-blue-400 border-t-transparent rounded-full animate-spin"></div></div>}>
                                    <MacroBarChart macros={totalMacros} goal={goal} />
                                </Suspense>
                                <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                                    <div>
                                        <div className="text-sm text-gray-600 dark:text-gray-400">Proteína</div>
                                        <div className="text-lg font-bold text-gray-900 dark:text-white">
                                            {totalMacros.protein.toFixed(1)}g
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-gray-600 dark:text-gray-400">Carbohidratos</div>
                                        <div className="text-lg font-bold text-gray-900 dark:text-white">
                                            {totalMacros.carbs.toFixed(1)}g
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-gray-600 dark:text-gray-400">Grasas</div>
                                        <div className="text-lg font-bold text-gray-900 dark:text-white">
                                            {totalMacros.fat.toFixed(1)}g
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Estadísticas Semanales */}
                            <Suspense fallback={<div className="h-64 backdrop-blur-xl bg-white/60 dark:bg-black/60 rounded-3xl border border-gray-200/50 dark:border-gray-800/50 p-6 animate-pulse"></div>}>
                                <WeeklyStatsWidget />
                            </Suspense>
                        </div>

                        {/* Sección 4: Resumen Rápido */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="backdrop-blur-xl bg-white/60 dark:bg-black/60 rounded-3xl border border-gray-200/50 dark:border-gray-800/50 p-6 shadow-sm hover:shadow-lg hover:border-gray-300/50 dark:hover:border-gray-700/50 transition-all duration-500">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-12 h-12 rounded-2xl bg-[#D45A0F]/10 dark:bg-blue-900/30 flex items-center justify-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#D45A0F] dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <div className="text-sm text-gray-600 dark:text-gray-400">Calorías Quemadas</div>
                                        <div className="text-2xl font-bold text-gray-900 dark:text-white">{(caloriesBurned || 0).toFixed(0)}</div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="backdrop-blur-xl bg-white/60 dark:bg-black/60 rounded-3xl border border-gray-200/50 dark:border-gray-800/50 p-6 shadow-sm hover:shadow-lg hover:border-gray-300/50 dark:hover:border-gray-700/50 transition-all duration-500">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-12 h-12 rounded-2xl bg-pink-100/60 dark:bg-pink-900/30 backdrop-blur-sm flex items-center justify-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-pink-600 dark:text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <div className="text-sm text-gray-600 dark:text-gray-400">Peso Actual</div>
                                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                            {log ? `${parseFloat(log.weight).toFixed(1)} kg` : 'N/A'}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="backdrop-blur-xl bg-white/60 dark:bg-black/60 rounded-3xl border border-gray-200/50 dark:border-gray-800/50 p-6 shadow-sm hover:shadow-lg hover:border-gray-300/50 dark:hover:border-gray-700/50 transition-all duration-500">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-12 h-12 rounded-2xl bg-green-100/60 dark:bg-green-900/30 backdrop-blur-sm flex items-center justify-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <div className="text-sm text-gray-600 dark:text-gray-400">Comidas Registradas</div>
                                        <div className="text-2xl font-bold text-gray-900 dark:text-white">{mealItems.length}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}
                {/* Botón flotante para solicitar atención del entrenador */}
                <RequestCoachAttention />
            </PageContainer>
        </AppLayout>
    );
};

export default Dashboard;

