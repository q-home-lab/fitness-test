import { create } from 'zustand';

const useToastStore = create((set) => ({
  toasts: [],

  addToast: (toast) => {
    const id = Date.now() + Math.random();
    const newToast = {
      id,
      type: toast.type || 'info',
      message: toast.message,
      duration: toast.duration || 5000,
      ...toast,
    };

    set((state) => ({
      toasts: [...state.toasts, newToast],
    }));

    // Auto-remover después de la duración
    if (newToast.duration > 0) {
      setTimeout(() => {
        useToastStore.getState().removeToast(id);
      }, newToast.duration);
    }

    return id;
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id),
    }));
  },

  clearToasts: () => {
    set({ toasts: [] });
  },

  // Helpers
  success: (message, options = {}) => {
    return useToastStore.getState().addToast({ type: 'success', message, ...options });
  },

  error: (message, options = {}) => {
    return useToastStore.getState().addToast({ type: 'error', message, duration: 7000, ...options });
  },

  warning: (message, options = {}) => {
    return useToastStore.getState().addToast({ type: 'warning', message, ...options });
  },

  info: (message, options = {}) => {
    return useToastStore.getState().addToast({ type: 'info', message, ...options });
  },
}));

export default useToastStore;

