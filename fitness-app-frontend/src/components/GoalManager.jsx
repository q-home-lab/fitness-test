import React, { useState, useEffect } from 'react';
import api from '../services/api';
import useToastStore from '../stores/useToastStore';

const GoalManager = ({ currentWeight, onGoalUpdated }) => {
    const [goal, setGoal] = useState(null);
    const [recommendations, setRecommendations] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    const [formData, setFormData] = useState({
        target_weight: '',
        current_weight: currentWeight || '',
        weekly_weight_change_goal: '-0.5',
        goal_type: 'weight_loss',
    });

    useEffect(() => {
        fetchGoal();
    }, []);

    useEffect(() => {
        if (currentWeight) {
            setFormData(prev => ({ ...prev, current_weight: currentWeight }));
        }
    }, [currentWeight]);

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
            console.error('Error al cargar objetivo:', error);
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        
        try {
            const response = await api.post('/goals', {
                target_weight: parseFloat(formData.target_weight),
                current_weight: parseFloat(formData.current_weight),
                weekly_weight_change_goal: parseFloat(formData.weekly_weight_change_goal),
                goal_type: formData.goal_type,
            });
            
            setGoal(response.data.goal);
            if (response.data.recommendations) {
                setRecommendations(response.data.recommendations);
            }
            setShowForm(false);
            if (onGoalUpdated) {
                onGoalUpdated(response.data.goal);
            }
        } catch (error) {
            console.error('Error al guardar objetivo:', error);
            useToastStore.getState().error(error.response?.data?.error || 'Error al guardar el objetivo');
        } finally {
            setSaving(false);
        }
    };

    const weightDifference = goal ? (parseFloat(goal.target_weight) - parseFloat(goal.current_weight)).toFixed(1) : 0;

    if (loading) {
        return (
            <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-6 transition-colors duration-300">
                <div className="flex justify-center">
                    <div className="w-6 h-6 border-2 border-blue-600 dark:border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm transition-colors duration-300">
            <div className="p-6">
                {!goal || showForm ? (
                    <div>
                        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
                            {showForm ? 'Editar Objetivo' : 'Establecer Objetivo'}
                        </h2>
                        
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Peso Actual (kg)
                                </label>
                                <input
                                    type="number"
                                    step="0.1"
                                    value={formData.current_weight}
                                    onChange={(e) => setFormData({ ...formData, current_weight: e.target.value })}
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 dark:focus:border-blue-400 text-gray-900 dark:text-white transition-colors duration-300"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Peso Objetivo (kg)
                                </label>
                                <input
                                    type="number"
                                    step="0.1"
                                    value={formData.target_weight}
                                    onChange={(e) => setFormData({ ...formData, target_weight: e.target.value })}
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 dark:focus:border-blue-400 text-gray-900 dark:text-white transition-colors duration-300"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Tipo de Objetivo
                                </label>
                                <select
                                    value={formData.goal_type}
                                    onChange={(e) => setFormData({ ...formData, goal_type: e.target.value })}
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 dark:focus:border-blue-400 text-gray-900 dark:text-white transition-colors duration-300"
                                >
                                    <option value="weight_loss">Perder Peso</option>
                                    <option value="weight_gain">Ganar Peso</option>
                                    <option value="maintain">Mantener Peso</option>
                                </select>
                            </div>

                            {formData.goal_type !== 'maintain' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Cambio Semanal Objetivo (kg/semana)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={formData.weekly_weight_change_goal}
                                        onChange={(e) => setFormData({ ...formData, weekly_weight_change_goal: e.target.value })}
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 dark:focus:border-blue-400 text-gray-900 dark:text-white transition-colors duration-300"
                                        required
                                    />
                                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                        {formData.goal_type === 'weight_loss' 
                                            ? 'Recomendado: -0.5 a -1 kg/semana'
                                            : 'Recomendado: 0.3 a 0.5 kg/semana'}
                                    </p>
                                </div>
                            )}

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex-1 px-6 py-3 bg-blue-600 dark:bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors disabled:opacity-50"
                                >
                                    {saving ? 'Guardando...' : 'Guardar Objetivo'}
                                </button>
                                {showForm && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowForm(false);
                                            setFormData({
                                                target_weight: goal.target_weight,
                                                current_weight: goal.current_weight,
                                                weekly_weight_change_goal: goal.weekly_weight_change_goal,
                                                goal_type: goal.goal_type,
                                            });
                                        }}
                                        className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
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
                            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Mi Objetivo</h2>
                            <button
                                onClick={() => {
                                    setShowForm(true);
                                    setFormData({
                                        target_weight: goal.target_weight,
                                        current_weight: goal.current_weight || currentWeight || '',
                                        weekly_weight_change_goal: goal.weekly_weight_change_goal,
                                        goal_type: goal.goal_type,
                                    });
                                }}
                                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl text-sm font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                            >
                                Editar
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="bg-gradient-to-br from-blue-50 to-pink-50 dark:from-blue-900/20 dark:to-pink-900/20 rounded-2xl p-6 border border-blue-200 dark:border-blue-800">
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
                                            <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
                                                <div className="text-sm font-semibold text-green-800 dark:text-green-300 mb-3">
                                                    💡 Plan de Déficit Calórico
                                                </div>
                                                
                                                {/* Resultado unificado: calorías a quemar y déficit */}
                                                <div className="bg-white dark:bg-gray-800 rounded-lg p-3 mb-3">
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
                                                    <div className="mt-3 p-4 bg-green-50 dark:bg-green-900/30 rounded-lg border border-green-200 dark:border-green-700">
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
};

export default GoalManager;
