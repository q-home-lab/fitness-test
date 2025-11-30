import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const BrandContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const useBrand = () => useContext(BrandContext);

export const BrandProvider = ({ children }) => {
  const [brandSettings, setBrandSettings] = useState({
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
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBrandSettings();
  }, []);

  // Actualizar el título del documento cuando cambie el nombre de la marca
  useEffect(() => {
    if (brandSettings.brand_name) {
      document.title = brandSettings.brand_name;
    }
  }, [brandSettings.brand_name]);

  const loadBrandSettings = async () => {
    try {
      const response = await api.get('/brand');
      setBrandSettings(response.data);
    } catch (error) {
      console.error('Error al cargar configuración de marca:', error);
      // Mantener valores por defecto si hay error
    } finally {
      setLoading(false);
    }
  };

  const refreshBrandSettings = () => {
    loadBrandSettings();
  };

  return (
    <BrandContext.Provider value={{ brandSettings, loading, refreshBrandSettings }}>
      {children}
    </BrandContext.Provider>
  );
};

