import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import api from '../services/api';
import useToastStore from '../stores/useToastStore';
import logger from '../utils/logger';
import { goalSchema } from '../utils/validationSchemas';

const GoalManager = React.memo(({ currentWeight, onGoalUpdated }) => {
    const [goal, setGoal] = useState(null);
    const [recommendations, setRecommendations] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [loading, setLoading] = useState(true);
    
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        reset,
        setValue,
        watch,
    } = useForm({
        resolver: zodResolver(goalSchema),
        defaultValues: {
            target_weight: undefined,
            current_weight: currentWeight ? parseFloat(currentWeight) : undefined,
            weekly_weight_change_goal: -0.5,
            goal_type: 'weight_loss',
        },
    });

    const goalType = watch('goal_type');

    useEffect(() => {
        fetchGoal();
    }, []);

    useEffect(() => {
        if (currentWeight) {
            setValue('current_weight', parseFloat(currentWeight));
        }
    }, [currentWeight, setValue]);

    const fetchGoal = async () => {
        setLoading(true);
        try {
            const response = await api.get('/goals');
            if (response.data.goal) {
                setGoal(response.data.goal);
                if (response.data.recommendations) {
                    // Asegurar que los valores estén presentes
                    const recs = response.data.recommendations;
                    // Si caloriesToBurn o deficit no están, calcularlos desde tdee y dailyCalorieGoal
                    if (recs.tdee && response.data.goal.daily_calorie_goal) {
                        if (!recs.caloriesToBurn) {
                            recs.caloriesToBurn = recs.tdee;
                        }
                        if (!recs.deficit) {
                            recs.deficit = recs.tdee - parseFloat(response.data.goal.daily_calorie_goal);
                        }
                    }
                    setRecommendations(recs);
                }
            }
        } catch (error) {
            logger.error('Error al cargar objetivo:', error);
        } finally {
            setLoading(false);
        }
    };

    // Función para calcular calorías (reservada para uso futuro)
    // const handleCalculateCalories = async () => {
    //     if (!formData.target_weight || !formData.current_weight) return;
    //     
    //     try {
    //         const response = await api.get('/goals/calculate-calories', {
    //             params: {
    //                 current_weight: formData.current_weight,
    //                 target_weight: formData.target_weight,
    //                 weekly_weight_change_goal: formData.weekly_weight_change_goal,
    //                 goal_type: formData.goal_type,
    //             }
    //         });
    //         
    //         // Mostrar resultado (opcional)
    //         console.log('Calorías recomendadas:', response.data.daily_calorie_goal);
    //     } catch (error) {
    //         console.error('Error al calcular calorías:', error);
    //     }
    // };

    const onSubmit = async (data) => {
        try {
            const response = await api.post('/goals', {
                target_weight: data.target_weight,
                current_weight: data.current_weight,
                weekly_weight_change_goal: data.weekly_weight_change_goal || -0.5,
                goal_type: data.goal_type || 'weight_loss',
            });
            
            setGoal(response.data.goal);
            if (response.data.recommendations) {
                setRecommendations(response.data.recommendations);
            }
            setShowForm(false);
            if (onGoalUpdated) {
                onGoalUpdated(response.data.goal);
            }
            reset();
        } catch (error) {
            logger.error('Error al guardar objetivo:', error);
            useToastStore.getState().error(error.response?.data?.error || 'Error al guardar el objetivo');
            throw error;
        }
    };

    const weightDifference = goal ? (parseFloat(goal.target_weight) - parseFloat(goal.current_weight)).toFixed(1) : 0;

    if (loading) {
        return (
            <div className="backdrop-blur-xl bg-white/60 dark:bg-black/60 rounded-3xl border border-gray-200/50 dark:border-gray-800/50 p-6 transition-all duration-500">
                <div className="flex justify-center">
                    <div className="w-6 h-6 border-2 border-blue-600 dark:border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="backdrop-blur-xl bg-white/60 dark:bg-black/60 rounded-3xl border border-gray-200/50 dark:border-gray-800/50 overflow-hidden shadow-sm hover:shadow-lg hover:border-gray-300/50 dark:hover:border-gray-700/50 transition-all duration-500">
            <div className="p-6">
                {!goal || showForm ? (
                    <div>
                        <h2 className="text-2xl font-light tracking-tight text-gray-900 dark:text-white mb-6">
                            {showForm ? 'Editar Objetivo' : 'Establecer Objetivo'}
                        </h2>
                        
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" aria-label="Formulario de objetivo de fitness">
                            <div>
                                <label htmlFor="current-weight-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Peso Actual (kg)
                                </label>
                                <input
                                    id="current-weight-input"
                                    type="number"
                                    step="0.1"
                                    aria-describedby={errors.current_weight ? "current-weight-error" : undefined}
                                    aria-invalid={errors.current_weight ? "true" : "false"}
                                    aria-required="true"
                                    {...register('current_weight', { valueAsNumber: true })}
                                    className={`w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 dark:focus:border-blue-400 text-gray-900 dark:text-white transition-colors duration-300 ${
                                        errors.current_weight 
                                            ? 'border-red-300 dark:border-red-700' 
                                            : 'border-gray-300 dark:border-gray-700'
                                    }`}
                                />
                                {errors.current_weight && (
                                    <p id="current-weight-error" className="text-xs text-red-600 dark:text-red-400 mt-1" role="alert" aria-live="polite">
                                        {errors.current_weight.message}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label htmlFor="target-weight-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Peso Objetivo (kg)
                                </label>
                                <input
                                    id="target-weight-input"
                                    type="number"
                                    step="0.1"
                                    aria-describedby={errors.target_weight ? "target-weight-error" : undefined}
                                    aria-invalid={errors.target_weight ? "true" : "false"}
                                    aria-required="true"
                                    {...register('target_weight', { valueAsNumber: true })}
                                    className={`w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 dark:focus:border-blue-400 text-gray-900 dark:text-white transition-colors duration-300 ${
                                        errors.target_weight 
                                            ? 'border-red-300 dark:border-red-700' 
                                            : 'border-gray-300 dark:border-gray-700'
                                    }`}
                                />
                                {errors.target_weight && (
                                    <p id="target-weight-error" className="text-xs text-red-600 dark:text-red-400 mt-1" role="alert" aria-live="polite">
                                        {errors.target_weight.message}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label htmlFor="goal-type-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Tipo de Objetivo
                                </label>
                                <select
                                    id="goal-type-select"
                                    {...register('goal_type')}
                                    aria-required="true"
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 dark:focus:border-blue-400 text-gray-900 dark:text-white transition-colors duration-300"
                                >
                                    <option value="weight_loss">Perder Peso</option>
                                    <option value="weight_gain">Ganar Peso</option>
                                    <option value="maintain">Mantener Peso</option>
                                </select>
                            </div>

                            {goalType !== 'maintain' && (
                                <div>
                                    <label htmlFor="weekly-change-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Cambio Semanal Objetivo (kg/semana)
                                    </label>
                                    <input
                                        id="weekly-change-input"
                                        type="number"
                                        step="0.1"
                                        aria-describedby={errors.weekly_weight_change_goal ? "weekly-change-error" : "weekly-change-hint"}
                                        aria-invalid={errors.weekly_weight_change_goal ? "true" : "false"}
                                        {...register('weekly_weight_change_goal', { valueAsNumber: true })}
                                        className={`w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 dark:focus:border-blue-400 text-gray-900 dark:text-white transition-colors duration-300 ${
                                            errors.weekly_weight_change_goal 
                                                ? 'border-red-300 dark:border-red-700' 
                                                : 'border-gray-300 dark:border-gray-700'
                                        }`}
                                        placeholder="-0.5"
                                    />
                                    {errors.weekly_weight_change_goal && (
                                        <p id="weekly-change-error" className="text-xs text-red-600 dark:text-red-400 mt-1" role="alert" aria-live="polite">
                                            {errors.weekly_weight_change_goal.message}
                                        </p>
                                    )}
                                    <p id="weekly-change-hint" className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                        {goalType === 'weight_loss' 
                                            ? 'Recomendado: -0.5 a -1 kg/semana'
                                            : 'Recomendado: 0.3 a 0.5 kg/semana'}
                                    </p>
                                </div>
                            )}

                            <div className="flex gap-3 pt-4" role="group" aria-label="Acciones del formulario">
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    aria-label={isSubmitting ? "Guardando objetivo" : "Guardar objetivo de fitness"}
                                    className="flex-1 px-6 py-3 bg-blue-600 dark:bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <span className="sr-only">Guardando</span>
                                            <span aria-hidden="true">Guardando...</span>
                                        </>
                                    ) : (
                                        'Guardar Objetivo'
                                    )}
                                </button>
                                {showForm && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowForm(false);
                                            if (goal) {
                                                reset({
                                                    target_weight: parseFloat(goal.target_weight),
                                                    current_weight: parseFloat(goal.current_weight) || parseFloat(currentWeight) || undefined,
                                                    weekly_weight_change_goal: parseFloat(goal.weekly_weight_change_goal) || -0.5,
                                                    goal_type: goal.goal_type || 'weight_loss',
                                                });
                                            }
                                        }}
                                        aria-label="Cancelar edición de objetivo"
                                        className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                                    >
                                        Cancelar
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>
                ) : (
                    <div>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-light tracking-tight text-gray-900 dark:text-white">Mi Objetivo</h2>
                            <button
                                onClick={() => {
                                    setShowForm(true);
                                    reset({
                                        target_weight: parseFloat(goal.target_weight),
                                        current_weight: parseFloat(goal.current_weight) || parseFloat(currentWeight) || undefined,
                                        weekly_weight_change_goal: parseFloat(goal.weekly_weight_change_goal) || -0.5,
                                        goal_type: goal.goal_type || 'weight_loss',
                                    });
                                }}
                                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl text-sm font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                            >
                                Editar
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="backdrop-blur-md bg-gradient-to-br from-blue-50/60 to-pink-50/60 dark:from-blue-900/20 dark:to-pink-900/20 rounded-2xl p-6 border border-blue-200/50 dark:border-blue-800/50">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Peso Objetivo</div>
                                        <div className="text-3xl font-bold text-gray-900 dark:text-white">
                                            {parseFloat(goal.target_weight).toFixed(1)} kg
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                                            {Math.abs(weightDifference)} kg {parseFloat(weightDifference) > 0 ? 'más' : 'menos'}
                                        </div>
                                        <div className="text-xs text-gray-500 dark:text-gray-500">
                                            {goal.goal_type === 'weight_loss' ? 'Perder peso' : 
                                             goal.goal_type === 'weight_gain' ? 'Ganar peso' : 
                                             'Mantener peso'}
                                        </div>
                                    </div>
                                </div>

                                {goal.daily_calorie_goal && (
                                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800 space-y-3">
                                        <div>
                                            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Calorías Diarias Recomendadas</div>
                                            <div className="text-2xl font-semibold text-blue-600 dark:text-blue-400">
                                                {parseFloat(goal.daily_calorie_goal).toFixed(0)} kcal
                                            </div>
                                            <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                                Cambio objetivo: {parseFloat(goal.weekly_weight_change_goal) > 0 ? '+' : ''}
                                                {parseFloat(goal.weekly_weight_change_goal).toFixed(1)} kg/semana
                                            </div>
                                        </div>
                                        
                                        {recommendations && (
                                            <div className="backdrop-blur-md bg-green-50/60 dark:bg-green-900/20 rounded-xl p-4 border border-green-200/50 dark:border-green-800/50">
                                                <div className="text-sm font-semibold text-green-800 dark:text-green-300 mb-3">
                                                    💡 Plan de Déficit Calórico
                                                </div>
                                                
                                                {/* Resultado unificado: calorías a quemar y déficit */}
                                                <div className="backdrop-blur-sm bg-white/60 dark:bg-gray-800/60 rounded-lg p-3 mb-3 border border-gray-200/50 dark:border-gray-700/50">
                                                    <div className="flex justify-between items-center mb-2">
                                                        <span className="text-xs text-gray-600 dark:text-gray-400">Calorías a quemar:</span>
                                                        <span className="text-lg font-bold text-green-700 dark:text-green-400">
                                                            {(() => {
                                                                const calories = recommendations.caloriesToBurn ?? recommendations.tdee;
                                                                return calories != null && !isNaN(calories) ? Math.round(calories) : 'N/A';
                                                            })()} kcal/día
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-xs text-gray-600 dark:text-gray-400">Déficit resultante:</span>
                                                        <span className="text-lg font-bold text-green-700 dark:text-green-400">
                                                            {(() => {
                                                                let deficit = recommendations.deficit;
                                                                if (deficit == null || isNaN(deficit)) {
                                                                    const tdee = recommendations.tdee;
                                                                    const consumed = goal.daily_calorie_goal ? parseFloat(goal.daily_calorie_goal) : null;
                                                                    if (tdee != null && consumed != null && !isNaN(tdee) && !isNaN(consumed)) {
                                                                        deficit = tdee - consumed;
                                                                    }
                                                                }
                                                                return deficit != null && !isNaN(deficit) ? Math.round(deficit) : 'N/A';
                                                            })()} kcal/día
                                                        </span>
                                                    </div>
                                                </div>
                                                
                                                {/* Desglose del metabolismo */}
                                                <div className="text-xs text-green-700 dark:text-green-400 space-y-1 mb-2">
                                                    <div className="flex justify-between">
                                                        <span>Metabolismo basal (BMR):</span>
                                                        <span className="font-semibold">{recommendations.bmr} kcal</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span>Actividad diaria:</span>
                                                        <span className="font-semibold">
                                                            {recommendations.dailyActivity != null && !isNaN(recommendations.dailyActivity) 
                                                                ? `${Math.round(recommendations.dailyActivity)} kcal`
                                                                : recommendations.tdee && recommendations.bmr
                                                                    ? `${Math.round(recommendations.tdee - recommendations.bmr)} kcal`
                                                                    : 'N/A'}
                                                        </span>
                                                    </div>
                                                    {recommendations.exerciseCaloriesNeeded > 0 && (
                                                        <div className="flex justify-between">
                                                            <span>Ejercicio adicional:</span>
                                                            <span className="font-semibold">{recommendations.exerciseCaloriesNeeded} kcal</span>
                                                        </div>
                                                    )}
                                                    <div className="flex justify-between pt-1 border-t border-green-200 dark:border-green-700">
                                                        <span className="font-semibold">Total TDEE:</span>
                                                        <span className="font-semibold">{recommendations.tdee} kcal</span>
                                                    </div>
                                                </div>
                                                
                                                {recommendations.explanation && (
                                                    <div className="mt-3 p-4 backdrop-blur-sm bg-green-50/60 dark:bg-green-900/30 rounded-lg border border-green-200/50 dark:border-green-700/50">
                                                        <div className="text-sm font-semibold text-green-800 dark:text-green-300 mb-3">
                                                            📋 Explicación
                                                        </div>
                                                        <div className="text-sm text-green-700 dark:text-green-400 leading-relaxed whitespace-pre-line">
                                                            {recommendations.explanation}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
});

GoalManager.displayName = 'GoalManager';

export default GoalManager;
