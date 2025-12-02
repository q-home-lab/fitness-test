import { useState, useCallback } from 'react';
import logger from '../utils/logger';

/**
 * Hook para retry automático de requests fallidos
 * @param {Function} asyncFn - Función async a ejecutar
 * @param {Object} options - Opciones de configuración
 * @param {number} options.maxRetries - Número máximo de reintentos (default: 3)
 * @param {number} options.delay - Delay entre reintentos en ms (default: 1000)
 * @param {Function} options.shouldRetry - Función que determina si se debe reintentar (default: retry en errores de red)
 * @returns {Object} - { execute, loading, error }
 */
export const useRetry = (asyncFn, options = {}) => {
    const { maxRetries = 3, delay = 1000, shouldRetry = null } = options;
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const execute = useCallback(async (...args) => {
        setLoading(true);
        setError(null);

        let lastError = null;
        
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                const result = await asyncFn(...args);
                setLoading(false);
                return result;
            } catch (err) {
                lastError = err;
                
                // Determinar si se debe reintentar
                const shouldRetryError = shouldRetry 
                    ? shouldRetry(err, attempt)
                    : (
                        // Por defecto, reintentar en errores de red o 5xx
                        !err.response || 
                        (err.response.status >= 500 && err.response.status < 600)
                    );

                if (!shouldRetryError || attempt >= maxRetries) {
                    setError(err);
                    setLoading(false);
                    throw err;
                }

                // Esperar antes del siguiente intento (exponential backoff)
                const waitTime = delay * Math.pow(2, attempt);
                logger.warn(`Intento ${attempt + 1} fallido, reintentando en ${waitTime}ms...`, err);
                await new Promise(resolve => setTimeout(resolve, waitTime));
            }
        }

        setError(lastError);
        setLoading(false);
        throw lastError;
    }, [asyncFn, maxRetries, delay, shouldRetry]);

    return { execute, loading, error };
};

/**
 * Hook para retry automático en llamadas API
 * Wrapper alrededor de useRetry específico para axios
 */
export const useApiRetry = (apiCall, options = {}) => {
    return useRetry(apiCall, {
        maxRetries: 3,
        delay: 1000,
        shouldRetry: (error, attempt) => {
            // Reintentar en errores de red o 5xx
            if (!error.response) return true; // Error de red
            if (error.response.status >= 500 && error.response.status < 600) return true; // Error del servidor
            // No reintentar en errores 4xx (errores del cliente)
            return false;
        },
        ...options,
    });
};

