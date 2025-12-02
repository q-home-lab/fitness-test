import { create } from 'zustand';
import api from '../services/api';
import { format } from 'date-fns';
import logger from '../utils/logger';

const useTodayLogStore = create((set, get) => ({
  // Estado
  log: null,
  mealItems: [],
  dailyExercises: [],
  currentDate: new Date(),
  loading: false,

  // Acciones
  setLog: (log) => set({ log }),
  setMealItems: (mealItems) => set({ mealItems }),
  setDailyExercises: (dailyExercises) => set({ dailyExercises }),
  setCurrentDate: (date) => set({ currentDate: date }),
  setLoading: (loading) => set({ loading }),

  // Cargar log del día
  loadTodayLog: async (date = null) => {
    const targetDate = date || get().currentDate;
    const formattedDate = format(targetDate, 'yyyy-MM-dd');
    
    set({ loading: true });
    try {
      const response = await api.get(`/logs/${formattedDate}`);
      set({
        log: response.data.log,
        mealItems: response.data.mealItems || [],
        dailyExercises: response.data.dailyExercises || [],
        loading: false,
      });
    } catch (error) {
      logger.error('Error al cargar log diario:', error);
      set({
        log: null,
        mealItems: [],
        dailyExercises: [],
        loading: false,
      });
    }
  },

  // Agregar meal item con optimistic update
  addMealItemOptimistic: async (mealItemData) => {
    const { mealItems, log } = get();
    
    // Crear item temporal con ID temporal
    const tempId = `temp-${Date.now()}`;
    const optimisticItem = {
      ...mealItemData,
      meal_item_id: tempId,
      created_at: new Date().toISOString(),
    };

    // Actualizar UI inmediatamente (optimistic update)
    set({
      mealItems: [...mealItems, optimisticItem],
    });

    try {
      // Hacer la petición real
      const response = await api.post('/meal-items', mealItemData);
      const newItem = response.data.mealItem;

      // Reemplazar item temporal con el real
      set({
        mealItems: mealItems.map(item => 
          item.meal_item_id === tempId ? newItem : item
        ),
      });

      return { success: true, mealItem: newItem };
    } catch (error) {
      logger.error('Error al agregar meal item:', error);
      
      // Revertir cambio optimista
      set({ mealItems });
      
      return {
        success: false,
        error: error.response?.data?.error || 'Error al agregar comida',
      };
    }
  },

  // Eliminar meal item con optimistic update
  removeMealItemOptimistic: async (mealItemId) => {
    const { mealItems } = get();
    const itemToRemove = mealItems.find(item => item.meal_item_id === mealItemId);
    
    // Remover inmediatamente de UI (optimistic update)
    set({
      mealItems: mealItems.filter(item => item.meal_item_id !== mealItemId),
    });

    try {
      await api.delete(`/meal-items/${mealItemId}`);
      return { success: true };
    } catch (error) {
      logger.error('Error al eliminar meal item:', error);
      
      // Revertir cambio optimista
      if (itemToRemove) {
        set({ mealItems });
      }
      
      return {
        success: false,
        error: error.response?.data?.error || 'Error al eliminar comida',
      };
    }
  },

  // Actualizar log después de cambios
  refreshLog: (date = null) => {
    get().loadTodayLog(date);
  },

  // Cambiar fecha
  changeDate: (days) => {
    const newDate = new Date(get().currentDate);
    newDate.setDate(newDate.getDate() + days);
    set({ currentDate: newDate });
    get().loadTodayLog(newDate);
  },

  // Calcular macros totales
  getTotalMacros: () => {
    const { mealItems } = get();
    return mealItems.reduce(
      (acc, item) => {
        const quantity = parseFloat(item.quantity_grams) || 0;
        const multiplier = quantity / 100;
        return {
          calories: acc.calories + (parseFloat(item.consumed_calories) || 0),
          protein: acc.protein + (parseFloat(item.protein_g || 0) * multiplier),
          carbs: acc.carbs + (parseFloat(item.carbs_g || 0) * multiplier),
          fat: acc.fat + (parseFloat(item.fat_g || 0) * multiplier),
        };
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  },

  // Calcular calorías quemadas totales
  getTotalCaloriesBurned: () => {
    const { dailyExercises } = get();
    return dailyExercises.reduce((acc, exercise) => {
      const calories = parseFloat(exercise.burned_calories) || 0;
      return acc + calories;
    }, 0);
  },
}));

export default useTodayLogStore;

