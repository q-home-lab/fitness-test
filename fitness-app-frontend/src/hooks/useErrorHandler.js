import { useCallback } from 'react';
import { useToastStore } from '../stores/useToastStore';
import api from '../services/api';

/**
 * Hook para manejo centralizado de errores
 * Proporciona funciones para manejar errores de manera consistente
 */
export const useErrorHandler = () => {
  const { showToast } = useToastStore();

  /**
   * Maneja un error y muestra un mensaje apropiado
   * @param {Error} error - El error a manejar
   * @param {Object} options - Opciones de configuración
   * @returns {Object} - Información del error manejado
   */
  const handleError = useCallback((error, options = {}) => {
    const {
      showToast: showToastOption = true,
      fallbackMessage = 'Ha ocurrido un error. Por favor, intenta de nuevo.',
      logError = true,
      redirectOn401 = true,
    } = options;

    // Log del error en desarrollo
    if (logError && import.meta.env.DEV) {
      console.error('Error capturado:', error);
    }

    // Determinar mensaje de error
    let message = fallbackMessage;
    let statusCode = null;

    if (error?.response) {
      // Error de respuesta del servidor
      statusCode = error.response.status;
      const data = error.response.data;

      switch (statusCode) {
        case 400:
          message = data?.error || data?.message || 'Datos inválidos';
          // Si hay detalles de validación, mostrarlos
          if (data?.details && Array.isArray(data.details)) {
            message = data.details.map(d => d.msg || d.message || d).join(', ');
          }
          break;
        case 401:
          message = 'Sesión expirada. Por favor, inicia sesión de nuevo.';
          // Redirigir a login si está habilitado
          if (redirectOn401 && typeof window !== 'undefined') {
            setTimeout(() => {
              window.location.href = '/login';
            }, 2000);
          }
          break;
        case 403:
          message = 'No tienes permisos para realizar esta acción';
          break;
        case 404:
          message = data?.error || 'Recurso no encontrado';
          break;
        case 409:
          message = data?.error || 'El recurso ya existe';
          break;
        case 429:
          message = 'Demasiadas solicitudes. Por favor, espera un momento.';
          break;
        case 500:
          message = 'Error del servidor. Por favor, intenta más tarde.';
          break;
        case 503:
          message = 'Servicio no disponible. Por favor, intenta más tarde.';
          break;
        default:
          message = data?.error || data?.message || fallbackMessage;
      }
    } else if (error?.request) {
      // Error de red (sin respuesta del servidor)
      message = 'Error de conexión. Verifica tu conexión a internet.';
    } else if (error?.message) {
      // Error de JavaScript
      message = error.message;
    }

    // Mostrar toast si está habilitado
    if (showToastOption) {
      showToast(message, 'error');
    }

    // Retornar información del error para manejo adicional si es necesario
    return {
      message,
      statusCode,
      error,
      handled: true,
    };
  }, [showToast]);

  /**
   * Ejecuta una función async y maneja errores automáticamente
   * @param {Function} asyncFn - Función async a ejecutar
   * @param {Object} options - Opciones para el manejo de errores
   * @returns {Promise} - Resultado de la función o error manejado
   */
  const handleAsyncError = useCallback(async (asyncFn, options = {}) => {
    try {
      return await asyncFn();
    } catch (error) {
      return handleError(error, options);
    }
  }, [handleError]);

  return {
    handleError,
    handleAsyncError,
  };
};

