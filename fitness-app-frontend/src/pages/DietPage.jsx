import React, { useEffect, useState, useCallback, lazy, Suspense } from 'react';
import { AppLayout } from '@/app/layout/AppLayout';
import { PageContainer } from '@/shared/components/layout/PageContainer';
import CalorieRadialChart from '../components/CalorieRadialChart';
import { DashboardSkeleton } from '../components/SkeletonLoader';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import api from '../services/api';
import logger from '../utils/logger';

// Lazy load de componentes pesados
const FoodSearchAndAdd = lazy(() => import('../components/FoodSearchAndAdd'));

// Skeleton para FoodSearchAndAdd
const FoodSearchSkeleton = () => (
  <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-8 shadow-sm animate-pulse">
    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-6"></div>
    <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
    <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
  </div>
);

const DietPage = () => {
    const [currentDate, setCurrentDate] = useState(new Date());
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
        } catch (error) {
            logger.error('Error al cargar log diario:', error);
            setLog(null);
            setMealItems([]);
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
            logger.error('Error al cargar objetivo:', error);
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

    const handleDateChange = (days) => {
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() + days);
        setCurrentDate(newDate);
    };

    const handleLogUpdated = (newLogOrMealItems) => {
        if (newLogOrMealItems.mealItems) {
            setLog(newLogOrMealItems.log);
            setMealItems(newLogOrMealItems.mealItems);
        } else {
            setLog(newLogOrMealItems);
            fetchDailyLog();
        }
    };

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

    const formattedDateLabel = format(currentDate, 'EEEE, d MMMM yyyy', { locale: es });

    return (
        <AppLayout>
            <PageContainer
                title="Dieta"
                description={formattedDateLabel}
            >
                {/* Date Picker */}
                <div className="flex items-center justify-end mb-8">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => handleDateChange(-1)}
                            className="w-10 h-10 rounded-full backdrop-blur-md bg-white/60 dark:bg-black/60 border border-gray-200/50 dark:border-gray-800/50 flex items-center justify-center hover:bg-white/80 dark:hover:bg-black/80 hover:border-gray-300/50 dark:hover:border-gray-700/50 transition-all duration-300 text-gray-900 dark:text-white shadow-sm hover:shadow-md"
                            aria-label="Día anterior"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <input
                            type="date"
                            className="px-4 py-2 backdrop-blur-md bg-white/60 dark:bg-black/60 border border-gray-200/50 dark:border-gray-800/50 rounded-xl text-center text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 dark:focus:border-blue-400 text-gray-900 dark:text-white transition-all duration-300 shadow-sm hover:shadow-md"
                            value={formattedDate}
                            onChange={(e) => {
                                const newDate = new Date(e.target.value);
                                setCurrentDate(newDate);
                            }}
                        />
                        <button
                            onClick={() => handleDateChange(1)}
                            className="w-10 h-10 rounded-full backdrop-blur-md bg-white/60 dark:bg-black/60 border border-gray-200/50 dark:border-gray-800/50 flex items-center justify-center hover:bg-white/80 dark:hover:bg-black/80 hover:border-gray-300/50 dark:hover:border-gray-700/50 transition-all duration-300 text-gray-900 dark:text-white shadow-sm hover:shadow-md"
                            aria-label="Día siguiente"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Búsqueda y Añadir Comida - SIEMPRE VISIBLE */}
                <div className="mb-6">
                    <Suspense fallback={<FoodSearchSkeleton />}>
                        <FoodSearchAndAdd 
                            log={log} 
                            onLogUpdated={handleLogUpdated}
                            date={formattedDate}
                        />
                    </Suspense>
                </div>

                {loading ? (
                    <DashboardSkeleton />
                ) : (
                    <div className="space-y-6">
                            {/* Gráfica Radial de Calorías */}
                            <div className="backdrop-blur-xl bg-white/60 dark:bg-black/60 rounded-3xl border border-gray-200/50 dark:border-gray-800/50 p-8 shadow-sm hover:shadow-lg hover:border-gray-300/50 dark:hover:border-gray-700/50 transition-all duration-500">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-2xl font-light tracking-tight text-gray-900 dark:text-white">
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
                                    <div className="mt-4 p-4 backdrop-blur-md bg-yellow-50/60 dark:bg-yellow-900/20 border border-yellow-200/50 dark:border-yellow-800/50 rounded-2xl">
                                        <p className="text-sm text-yellow-800 dark:text-yellow-300">
                                            💡 Establece un objetivo de peso para obtener recomendaciones personalizadas de calorías
                                        </p>
                                    </div>
                                )}
                                
                                {/* Macros Resumen */}
                                <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-200/50 dark:border-gray-800/50">
                                    <div className="text-center">
                                        <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Proteína</div>
                                        <div className="text-xl font-semibold text-gray-900 dark:text-white">{totalMacros.protein.toFixed(0)}g</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Carbohidratos</div>
                                        <div className="text-xl font-semibold text-gray-900 dark:text-white">{totalMacros.carbs.toFixed(0)}g</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Grasa</div>
                                        <div className="text-xl font-semibold text-gray-900 dark:text-white">{totalMacros.fat.toFixed(0)}g</div>
                                    </div>
                                </div>
                            </div>

                        {/* Lista de Comidas */}
                        <div className="backdrop-blur-xl bg-white/60 dark:bg-black/60 rounded-3xl border border-gray-200/50 dark:border-gray-800/50 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-500">
                                <div className="p-6 border-b border-gray-200/50 dark:border-gray-800/50">
                                    <h2 className="text-2xl font-light tracking-tight text-gray-900 dark:text-white">
                                        Comidas Registradas
                                    </h2>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                        {mealItems.length} {mealItems.length === 1 ? 'comida registrada' : 'comidas registradas'}
                                    </p>
                                </div>
                                
                            {mealItems.length === 0 ? (
                                    <div className="text-center py-16 px-6">
                                        <div className="w-20 h-20 backdrop-blur-sm bg-gray-100/60 dark:bg-gray-800/60 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-200/50 dark:border-gray-700/50">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-400 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                            </svg>
                                        </div>
                                        <p className="text-gray-600 dark:text-gray-400 font-medium mb-1">No hay comidas registradas</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-500">Añade tu primera comida para comenzar</p>
                                    </div>
                            ) : (
                                <div className="divide-y divide-gray-200/50 dark:divide-gray-800/50">
                                    {mealItems.map((item) => (
                                        <div 
                                            key={item.meal_item_id} 
                                            className="p-6 hover:backdrop-blur-md hover:bg-white/40 dark:hover:bg-black/40 transition-all duration-300"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-1">
                                                        <span className="text-sm font-medium text-gray-500 dark:text-gray-500">
                                                            {item.created_at ? format(new Date(item.created_at), 'HH:mm') : '--:--'}
                                                        </span>
                                                        <span className="px-3 py-1 backdrop-blur-sm bg-white/60 dark:bg-black/60 border border-gray-200/50 dark:border-gray-800/50 rounded-full text-xs font-medium text-gray-700 dark:text-gray-300">
                                                            {item.meal_type || 'Comida'}
                                                        </span>
                                                    </div>
                                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                                        {item.food?.name || 'Alimento'}
                                                    </h3>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-xl font-semibold text-blue-600 dark:text-blue-400">
                                                        {(parseFloat(item.consumed_calories) || 0).toFixed(0)}
                                                    </div>
                                                    <div className="text-xs text-gray-500 dark:text-gray-500">kcal</div>
                                                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                                        {item.quantity_grams || 0}g
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </PageContainer>
        </AppLayout>
    );
};

export default DietPage;
