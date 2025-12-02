import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Icon from './Icons';
import logger from '../utils/logger';

const UserTracking = ({ userId }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId) return;

    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/admin/users/${userId}/stats`);
        setStats(response.data);
        setError(null);
      } catch (err) {
        logger.error('Error al cargar estadísticas:', err);
        setError('No se pudieron cargar las estadísticas del usuario.');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [userId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-8 h-8 border-4 border-blue-600 dark:border-blue-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-4 text-red-600 dark:text-red-400">
        {error}
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-sm text-gray-600 dark:text-gray-400">
        No hay datos disponibles para este usuario.
      </div>
    );
  }

  const { weight, exercise, nutrition, recentActivity, recommendations, goal } = stats;

  return (
    <div className="space-y-6">
      {/* Resumen de Objetivo */}
      {goal && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl border border-blue-200 dark:border-blue-800 p-4 md:p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Objetivo Actual</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Peso Objetivo</div>
              <div className="text-xl font-bold text-gray-900 dark:text-white">{goal.targetWeight} kg</div>
            </div>
            <div>
              <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Peso Actual</div>
              <div className="text-xl font-bold text-gray-900 dark:text-white">
                {weight.current ? `${weight.current} kg` : 'N/A'}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Progreso</div>
              <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                {weight.progress ? `${weight.progress}%` : '0%'}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Calorías Objetivo</div>
              <div className="text-xl font-bold text-gray-900 dark:text-white">{goal.dailyCalorieGoal} kcal</div>
            </div>
          </div>
        </div>
      )}

      {/* Estadísticas de Peso */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 md:p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Evolución de Peso</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Peso Inicial (30 días)</div>
            <div className="text-xl font-bold text-gray-900 dark:text-white">
              {weight.initial ? `${weight.initial} kg` : 'N/A'}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Peso Actual</div>
            <div className="text-xl font-bold text-gray-900 dark:text-white">
              {weight.current ? `${weight.current} kg` : 'N/A'}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Cambio</div>
            <div
              className={`text-xl font-bold ${
                weight.change && weight.change < 0
                  ? 'text-green-600 dark:text-green-400'
                  : weight.change && weight.change > 0
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-gray-900 dark:text-white'
              }`}
            >
              {weight.change !== null && weight.change !== undefined ? `${weight.change > 0 ? '+' : ''}${parseFloat(weight.change).toFixed(1)} kg` : 'N/A'}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Tendencia</div>
            <div className="flex items-center gap-2">
              <span
                className={`text-xl font-bold ${
                  weight.trend === 'decreasing'
                    ? 'text-green-600 dark:text-green-400'
                    : weight.trend === 'increasing'
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                {weight.trend === 'decreasing' ? '↓' : weight.trend === 'increasing' ? '↑' : '→'}
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">{weight.trend}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Estadísticas de Ejercicio */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 md:p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Actividad Física</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Sesiones (30 días)</div>
            <div className="text-xl font-bold text-gray-900 dark:text-white">{exercise.totalSessions}</div>
          </div>
          <div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Frecuencia Semanal</div>
            <div className="text-xl font-bold text-gray-900 dark:text-white">{exercise.weeklyFrequency} días</div>
          </div>
          <div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Calorías Quemadas</div>
            <div className="text-xl font-bold text-orange-600 dark:text-orange-400">
              {(parseFloat(exercise.totalCaloriesBurned) || 0).toFixed(0)} kcal
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Adherencia</div>
            <div className="text-xl font-bold text-blue-600 dark:text-blue-400">{exercise.adherence}%</div>
          </div>
        </div>
        {exercise.mostFrequentExercise && (
          <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
            <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Ejercicio Más Frecuente</div>
            <div className="text-sm font-semibold text-gray-900 dark:text-white">
              {exercise.mostFrequentExercise.name} ({exercise.mostFrequentExercise.count} veces)
            </div>
          </div>
        )}
      </div>

      {/* Estadísticas de Nutrición */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 md:p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Nutrición</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Calorías Consumidas</div>
            <div className="text-xl font-bold text-green-600 dark:text-green-400">
              {(parseFloat(nutrition.totalCaloriesConsumed) || 0).toFixed(0)} kcal
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Promedio Diario</div>
            <div className="text-xl font-bold text-gray-900 dark:text-white">
              {nutrition.averageCaloriesPerDay} kcal
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Días con Registro</div>
            <div className="text-xl font-bold text-gray-900 dark:text-white">{nutrition.daysWithMeals}</div>
          </div>
          <div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Adherencia</div>
            <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
              {nutrition.calorieAdherence}%
            </div>
          </div>
        </div>
        {nutrition.mostConsumedFood && (
          <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
            <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Alimento Más Consumido</div>
            <div className="text-sm font-semibold text-gray-900 dark:text-white">
              {nutrition.mostConsumedFood.name} ({nutrition.mostConsumedFood.count} veces)
            </div>
          </div>
        )}
      </div>

      {/* Actividad Reciente (7 días) */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 md:p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Actividad Reciente (7 días)</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Días con Ejercicio</div>
            <div className="text-xl font-bold text-gray-900 dark:text-white">
              {recentActivity.daysWithExercise}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Días con Comidas</div>
            <div className="text-xl font-bold text-gray-900 dark:text-white">{recentActivity.daysWithMeals}</div>
          </div>
          <div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Calorías Quemadas (prom)</div>
            <div className="text-xl font-bold text-orange-600 dark:text-orange-400">
              {recentActivity.averageCaloriesBurned} kcal
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Calorías Consumidas (prom)</div>
            <div className="text-xl font-bold text-green-600 dark:text-green-400">
              {recentActivity.averageCaloriesConsumed} kcal
            </div>
          </div>
        </div>
      </div>

      {/* Recomendaciones */}
      {recommendations && recommendations.length > 0 && (
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-4 md:p-6">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recomendaciones Científicas</h3>
            <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full font-medium">
              Basadas en estudios oficiales
            </span>
          </div>
          <div className="space-y-3">
            {recommendations.map((rec, index) => (
              <div
                key={index}
                className={`p-4 rounded-xl border transition-all ${
                  rec.priority === 'high'
                    ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                    : rec.priority === 'medium'
                    ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                    : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`text-xl flex-shrink-0 ${
                      rec.priority === 'high'
                        ? 'text-red-600 dark:text-red-400'
                        : rec.priority === 'medium'
                        ? 'text-yellow-600 dark:text-yellow-400'
                        : 'text-green-600 dark:text-green-400'
                    }`}
                  >
                    {rec.priority === 'high' ? (
                        <Icon name="warning" className="w-4 h-4" />
                    ) : rec.priority === 'medium' ? (
                        <Icon name="recommendation" className="w-4 h-4" />
                    ) : (
                        <Icon name="success" className="w-4 h-4" />
                    )}
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                        {rec.type === 'weight' ? 'Peso' : rec.type === 'exercise' ? 'Ejercicio' : rec.type === 'nutrition' ? 'Nutrición' : 'General'}
                      </span>
                      {rec.category && (
                        <span className="text-xs px-2 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full">
                          {rec.category}
                        </span>
                      )}
                    </div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                      {rec.message}
                    </div>
                    {rec.scientificBasis && (
                      <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                        <div className="text-xs text-gray-600 dark:text-gray-400 italic">
                          <span className="font-semibold">Base científica:</span> {rec.scientificBasis}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default UserTracking;

