import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import api from '@/services/api';

/**
 * Hook personalizado para manejar logs diarios
 * Centraliza la lógica de carga y actualización de logs
 */
export const useDailyLog = (initialDate = null) => {
  const [currentDate, setCurrentDate] = useState(initialDate || new Date());
  const [log, setLog] = useState(null);
  const [mealItems, setMealItems] = useState([]);
  const [dailyExercises, setDailyExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const formattedDate = format(currentDate, 'yyyy-MM-dd');

  const fetchDailyLog = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/logs/${formattedDate}`);
      setLog(response.data.log);
      setMealItems(response.data.mealItems || []);
      setDailyExercises(response.data.dailyExercises || []);
    } catch (err) {
      console.error('Error al cargar log diario:', err);
      setError(err.response?.data?.error || 'Error al cargar el log diario');
      setLog(null);
      setMealItems([]);
      setDailyExercises([]);
    } finally {
      setLoading(false);
    }
  }, [formattedDate]);

  useEffect(() => {
    fetchDailyLog();
  }, [fetchDailyLog]);

  const changeDate = useCallback((days) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + days);
    setCurrentDate(newDate);
  }, [currentDate]);

  const refreshLog = useCallback(() => {
    fetchDailyLog();
  }, [fetchDailyLog]);

  const totalCaloriesBurned = dailyExercises.reduce((acc, exercise) => {
    const calories = parseFloat(exercise.burned_calories);
    return acc + (isNaN(calories) ? 0 : calories);
  }, 0);

  return {
    currentDate,
    setCurrentDate,
    log,
    mealItems,
    dailyExercises,
    loading,
    error,
    changeDate,
    refreshLog,
    totalCaloriesBurned,
    formattedDate
  };
};

export default useDailyLog;

