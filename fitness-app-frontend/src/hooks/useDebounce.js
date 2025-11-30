import { useState, useEffect } from 'react';

/**
 * Hook para debounce de valores
 * Útil para búsquedas, validaciones, etc.
 * @param {any} value - Valor a debounce
 * @param {number} delay - Delay en milisegundos (default: 500)
 * @returns {any} - Valor debounced
 */
export const useDebounce = (value, delay = 500) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

/**
 * Hook para debounce de funciones
 */
export const useDebouncedCallback = (callback, delay = 500) => {
  const [debouncedCallback, setDebouncedCallback] = useState(() => callback);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedCallback(() => callback);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [callback, delay]);

  return debouncedCallback;
};

