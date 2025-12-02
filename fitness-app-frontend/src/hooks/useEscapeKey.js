/**
 * Hook para manejar la tecla Escape
 * Útil para cerrar modales, dropdowns, etc.
 */
import { useEffect } from 'react';

/**
 * @param {Function} callback - Función a ejecutar cuando se presiona Escape
 * @param {boolean} enabled - Si el hook está habilitado
 */
export const useEscapeKey = (callback, enabled = true) => {
  useEffect(() => {
    if (!enabled) return;

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        callback(event);
      }
    };

    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [callback, enabled]);
};

