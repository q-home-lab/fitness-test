import React, { useEffect, useState, useCallback, lazy, Suspense } from 'react';
import ModernNavbar from '../components/ModernNavbar';
import BottomNavigation from '../components/BottomNavigation';
import CalorieRadialChart from '../components/CalorieRadialChart';
import MacroBarChart from '../components/MacroBarChart';
import WeeklyStatsWidget from '../components/WeeklyStatsWidget';
import GoalManager from '../components/GoalManager';
import FirstStepsGuide from '../components/FirstStepsGuide';
import { DashboardSkeleton } from '../components/SkeletonLoader';
import { format } from 'date-fns';
import api from '../services/api';

// Lazy load de componentes pesados
const WeightLineChart = lazy(() => import('../components/WeightLineChart'));

// Skeleton para WeightLineChart
const WeightChartSkeleton = () => (
  <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm animate-pulse">
    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
    <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
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
    // Usar el objetivo del usuario si existe, de lo contrario usar un valor por defecto
    const calorieGoal = goal && goal.daily_calorie_goal 
        ? parseFloat(goal.daily_calorie_goal) 
        : 2000; // Valor por defecto si no hay objetivo
    const caloriesBurned = log ? parseFloat(log.burned_calories) : 0;

    return (
        <>
            <ModernNavbar />
            <main id="main-content" className="min-h-screen bg-[#FAF3E1] dark:bg-black pb-24 md:pb-8 transition-colors duration-300" role="main" aria-label="Dashboard principal">
                <div className="max-w-7xl mx-auto px-6 py-8">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-4xl md:text-5xl font-semibold text-gray-900 dark:text-white mb-2 tracking-tight">
                            Dashboard
                        </h1>
                        <p className="text-lg text-gray-600 dark:text-gray-400">
                            Resumen de tu progreso hoy
                        </p>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-20">
                            <div className="w-8 h-8 border-2 border-[#D45A0F] dark:border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : (
                        <>
                            {/* Guía de Primeros Pasos - Solo para usuarios nuevos */}
                            <FirstStepsGuide />

                            {/* Sección 1: Resumen de Calorías y Objetivos */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                                {/* Gráfica Radial de Calorías */}
                                <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm hover:shadow-md transition-all duration-300">
                                    <div className="flex items-center justify-between mb-6">
                                        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                                            Calorías Consumidas
                                        </h2>
                                        {goal && goal.daily_calorie_goal && (
                                            <span className="text-xs px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full font-medium">
                                                Objetivo: {parseFloat(goal.daily_calorie_goal).toFixed(0)} kcal
                                            </span>
                                        )}
                                    </div>
                                    <CalorieRadialChart 
                                        consumed={caloriesConsumed} 
                                        goal={calorieGoal}
                                    />
                                    {!goal && (
                                        <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl">
                                            <p className="text-sm text-yellow-800 dark:text-yellow-300">
                                                💡 Establece un objetivo de peso para obtener recomendaciones personalizadas de calorías
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Gestor de Objetivos */}
                                <GoalManager 
                                    currentWeight={log ? parseFloat(log.weight) : null}
                                    onGoalUpdated={(updatedGoal) => {
                                        setGoal(updatedGoal);
                                        // Recargar el objetivo para obtener las recomendaciones actualizadas
                                        fetchGoal();
                                    }}
                                />
                            </div>

                            {/* Sección 2: Evolución de Peso */}
                            <div className="mb-6">
                                <Suspense fallback={<WeightChartSkeleton />}>
                                    <WeightLineChart macros={totalMacros} />
                                </Suspense>
                            </div>

                            {/* Sección 2.5: Macros y Estadísticas Semanales */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                                {/* Gráfico de Macros */}
                                <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm hover:shadow-md transition-all duration-300">
                                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
                                        Macronutrientes
                                    </h2>
                                    <MacroBarChart macros={totalMacros} goal={goal} />
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
                                <WeeklyStatsWidget />
                            </div>

                            {/* Sección 3: Resumen Rápido */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm hover:shadow-md transition-all duration-300">
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
                                
                                <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm hover:shadow-md transition-all duration-300">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-12 h-12 rounded-2xl bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center">
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

                                <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm hover:shadow-md transition-all duration-300">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-12 h-12 rounded-2xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
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
                </div>
            </main>
            <BottomNavigation />
        </>
    );
};

export default Dashboard;
