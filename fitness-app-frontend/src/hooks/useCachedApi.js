import { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../services/api';
import apiCache from '../utils/cache';

/**
 * Hook para hacer llamadas API con caché automático
 * @param {string} url - URL del endpoint
 * @param {object} options - Opciones de configuración
 * @param {object} options.params - Parámetros de query
 * @param {number} options.ttl - Tiempo de vida del caché en ms (default: 5 minutos)
 * @param {boolean} options.enableCache - Habilitar caché (default: true)
 * @param {string} options.method - Método HTTP (default: 'GET')
 * @param {object} options.data - Datos para POST/PUT
 */
export const useCachedApi = (url, options = {}) => {
  const {
    params = {},
    ttl = 5 * 60 * 1000, // 5 minutos por defecto
    enableCache = true,
    method = 'GET',
    body = null, // Datos para POST/PUT
    immediate = true, // Ejecutar inmediatamente
  } = options;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState(null);

  const cacheKey = apiCache.generateKey(url, params);
  
  // Memoizar valores stringificados para evitar expresiones complejas en dependencias
  const paramsString = useMemo(() => JSON.stringify(params), [params]);
  const bodyString = useMemo(() => JSON.stringify(body), [body]);

  const fetchData = useCallback(async (forceRefresh = false) => {
    // Intentar obtener del caché si está habilitado y no es refresh forzado
    if (enableCache && !forceRefresh) {
      const cached = apiCache.get(cacheKey);
      if (cached) {
        setData(cached);
        setLoading(false);
        return;
      }
    }

    try {
      setLoading(true);
      setError(null);

      let response;
      switch (method.toUpperCase()) {
        case 'GET':
          response = await api.get(url, { params });
          break;
        case 'POST':
          response = await api.post(url, body, { params });
          break;
        case 'PUT':
          response = await api.put(url, body, { params });
          break;
        case 'DELETE':
          response = await api.delete(url, { params });
          break;
        default:
          throw new Error(`Método HTTP no soportado: ${method}`);
      }

      const responseData = response.data;

      // Guardar en caché solo para GET requests exitosos
      if (enableCache && method.toUpperCase() === 'GET' && responseData) {
        apiCache.set(cacheKey, responseData, ttl);
      }

      setData(responseData);
    } catch (err) {
      setError(err);
      console.error('Error en useCachedApi:', err);
    } finally {
      setLoading(false);
    }
  }, [url, paramsString, method, bodyString, enableCache, cacheKey, ttl]);

  useEffect(() => {
    if (immediate) {
      fetchData();
    }
  }, [fetchData, immediate]);

  // Función para refrescar datos (ignorar caché)
  const refresh = useCallback(() => {
    fetchData(true);
  }, [fetchData]);

  // Función para invalidar caché
  const invalidate = useCallback(() => {
    apiCache.delete(cacheKey);
  }, [cacheKey]);

  return {
    data,
    loading,
    error,
    refresh,
    invalidate,
  };
};

export default useCachedApi;

