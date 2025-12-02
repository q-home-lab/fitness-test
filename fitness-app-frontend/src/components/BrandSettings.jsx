import React, { useState, useEffect } from 'react';
import api from '../services/api';
import useBrandStore from '../stores/useBrandStore';
import logger from '../utils/logger';

const BrandSettings = () => {
  const refreshBrandSettings = useBrandStore((state) => state.refreshBrandSettings);
  const [settings, setSettings] = useState({
    brand_name: '',
    tagline: '',
    logo_url: '',
    instagram_url: '',
    facebook_url: '',
    twitter_url: '',
    linkedin_url: '',
    youtube_url: '',
    tiktok_url: '',
    website_url: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await api.get('/brand/admin');
      if (response.data.settings) {
        setSettings({
          brand_name: response.data.settings.brand_name || '',
          tagline: response.data.settings.tagline || '',
          logo_url: response.data.settings.logo_url || '',
          instagram_url: response.data.settings.instagram_url || '',
          facebook_url: response.data.settings.facebook_url || '',
          twitter_url: response.data.settings.twitter_url || '',
          linkedin_url: response.data.settings.linkedin_url || '',
          youtube_url: response.data.settings.youtube_url || '',
          tiktok_url: response.data.settings.tiktok_url || '',
          website_url: response.data.settings.website_url || '',
        });
      }
    } catch (error) {
      logger.error('Error al cargar configuración de marca:', error);
      setMessage({ type: 'error', text: 'Error al cargar la configuración.' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      await api.put('/brand/admin', settings);
      setMessage({ type: 'success', text: 'Configuración guardada exitosamente.' });
      // Recargar configuración local y refrescar el contexto global
      setTimeout(() => {
        loadSettings();
        refreshBrandSettings(); // Actualizar el contexto para que todos los componentes se actualicen
      }, 1000);
    } catch (error) {
      logger.error('Error al guardar configuración:', error);
      setMessage({
        type: 'error',
        text: error.response?.data?.error || 'Error al guardar la configuración.',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="w-8 h-8 border-2 border-[#D45A0F] dark:border-blue-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm transition-colors duration-300">
      <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
        Configuración de Marca
      </h2>

      {message.text && (
        <div
          className={`mb-4 p-4 rounded-2xl ${
            message.type === 'success'
              ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400'
              : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400'
          }`}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Información Básica */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Información Básica
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nombre de la Marca *
              </label>
              <input
                type="text"
                name="brand_name"
                value={settings.brand_name}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 rounded-2xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#D45A0F] dark:focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="Ej: MiGimnasio"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tagline / Slogan
              </label>
              <input
                type="text"
                name="tagline"
                value={settings.tagline}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-2xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#D45A0F] dark:focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="Ej: Transforma tu cuerpo, transforma tu vida"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                URL del Logo
              </label>
              <input
                type="url"
                name="logo_url"
                value={settings.logo_url}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-2xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#D45A0F] dark:focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="https://ejemplo.com/logo.png"
              />
              {settings.logo_url && (
                <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Vista previa del logo:</p>
                  <div className="relative w-16 h-16">
                    <img 
                      src={settings.logo_url} 
                      alt="Vista previa del logo"
                      className="w-16 h-16 rounded-xl object-cover border border-gray-300 dark:border-gray-700"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        const errorMsg = e.target.parentElement.querySelector('.logo-error');
                        if (errorMsg) errorMsg.style.display = 'block';
                      }}
                    />
                    <div className="logo-error hidden text-xs text-red-600 dark:text-red-400 mt-1">
                      No se pudo cargar la imagen. Verifica que la URL sea válida y accesible.
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Redes Sociales */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Redes Sociales
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Instagram
              </label>
              <input
                type="url"
                name="instagram_url"
                value={settings.instagram_url}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-2xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#D45A0F] dark:focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="https://instagram.com/tu-cuenta"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Facebook
              </label>
              <input
                type="url"
                name="facebook_url"
                value={settings.facebook_url}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-2xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#D45A0F] dark:focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="https://facebook.com/tu-pagina"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Twitter / X
              </label>
              <input
                type="url"
                name="twitter_url"
                value={settings.twitter_url}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-2xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#D45A0F] dark:focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="https://twitter.com/tu-cuenta"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                LinkedIn
              </label>
              <input
                type="url"
                name="linkedin_url"
                value={settings.linkedin_url}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-2xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#D45A0F] dark:focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="https://linkedin.com/company/tu-empresa"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                YouTube
              </label>
              <input
                type="url"
                name="youtube_url"
                value={settings.youtube_url}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-2xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#D45A0F] dark:focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="https://youtube.com/@tu-canal"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                TikTok
              </label>
              <input
                type="url"
                name="tiktok_url"
                value={settings.tiktok_url}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-2xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#D45A0F] dark:focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="https://tiktok.com/@tu-cuenta"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Sitio Web
              </label>
              <input
                type="url"
                name="website_url"
                value={settings.website_url}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-2xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#D45A0F] dark:focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="https://tu-sitio.com"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 bg-[#D45A0F] dark:bg-blue-600 text-white rounded-2xl font-medium hover:bg-[#B84A0D] dark:hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Guardando...' : 'Guardar Configuración'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default BrandSettings;

