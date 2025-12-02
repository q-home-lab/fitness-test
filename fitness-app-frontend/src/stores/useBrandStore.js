import { create } from 'zustand';
import api from '../services/api';
import logger from '../utils/logger';

const useBrandStore = create((set, get) => ({
  // Estado
  brandSettings: {
    brand_name: 'FitnessApp',
    tagline: 'Transforma tu cuerpo, transforma tu vida',
    logo_url: null,
    instagram_url: null,
    facebook_url: null,
    twitter_url: null,
    linkedin_url: null,
    youtube_url: null,
    tiktok_url: null,
    website_url: null,
  },
  loading: true,

  // Acciones
  setBrandSettings: (settings) => {
    set({ brandSettings: settings });
    // Actualizar título del documento
    if (settings.brand_name) {
      document.title = settings.brand_name;
    }
  },

  setLoading: (loading) => set({ loading }),

  loadBrandSettings: async () => {
    set({ loading: true });
    try {
      const response = await api.get('/brand');
      const settings = response.data;
      set({ brandSettings: settings, loading: false });
      
      // Actualizar título del documento
      if (settings.brand_name) {
        document.title = settings.brand_name;
      }
    } catch (error) {
      logger.error('Error al cargar configuración de marca:', error);
      // Mantener valores por defecto si hay error
      set({ loading: false });
    }
  },

  refreshBrandSettings: () => {
    get().loadBrandSettings();
  },
}));

export default useBrandStore;

