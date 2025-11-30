import { create } from 'zustand';
import api from '../services/api';

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
      console.error('Error al cargar objetivo:', error);
      set({ goal: null, loading: false });
    }
  },

  // Crear/actualizar objetivo
  saveGoal: async (goalData) => {
    set({ loading: true });
    try {
      const response = await api.post('/goals', {
        target_weight: parseFloat(goalData.target_weight),
        current_weight: parseFloat(goalData.current_weight),
        weekly_weight_change_goal: parseFloat(goalData.weekly_weight_change_goal),
        goal_type: goalData.goal_type,
      });
      
      set({ goal: response.data.goal, loading: false });
      return { success: true, goal: response.data.goal };
    } catch (error) {
      console.error('Error al guardar objetivo:', error);
      set({ loading: false });
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

