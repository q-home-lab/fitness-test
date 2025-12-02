import { create } from 'zustand';
import api from '../services/api';
import logger from '../utils/logger';

const useGoalStore = create((set, get) => ({
  // Estado
  goal: null,
  loading: false,

  // Acciones
  setGoal: (goal) => set({ goal }),
  
  setLoading: (loading) => set({ loading }),

  // Cargar objetivo
  loadGoal: async () => {
    set({ loading: true });
    try {
      const response = await api.get('/goals');
      if (response.data.goal) {
        set({ goal: response.data.goal, loading: false });
      } else {
        set({ goal: null, loading: false });
      }
    } catch (error) {
      logger.error('Error al cargar objetivo:', error);
      set({ goal: null, loading: false });
    }
  },

  // Crear/actualizar objetivo con optimistic update
  saveGoal: async (goalData) => {
    const { goal: currentGoal } = get();
    
    // Crear goal optimista
    const optimisticGoal = {
      ...currentGoal,
      target_weight: parseFloat(goalData.target_weight),
      current_weight: parseFloat(goalData.current_weight),
      weekly_weight_change_goal: parseFloat(goalData.weekly_weight_change_goal),
      goal_type: goalData.goal_type,
      is_active: true,
    };

    // Actualizar UI inmediatamente (optimistic update)
    set({ goal: optimisticGoal, loading: true });

    try {
      const response = await api.post('/goals', {
        target_weight: parseFloat(goalData.target_weight),
        current_weight: parseFloat(goalData.current_weight),
        weekly_weight_change_goal: parseFloat(goalData.weekly_weight_change_goal),
        goal_type: goalData.goal_type,
      });
      
      // Actualizar con datos reales del servidor
      set({ goal: response.data.goal, loading: false });
      return { success: true, goal: response.data.goal };
    } catch (error) {
      logger.error('Error al guardar objetivo:', error);
      
      // Revertir cambio optimista
      set({ goal: currentGoal, loading: false });
      
      return {
        success: false,
        error: error.response?.data?.error || 'Error al guardar el objetivo',
      };
    }
  },

  // Refrescar objetivo
  refreshGoal: () => {
    get().loadGoal();
  },
}));

export default useGoalStore;

