import { useState, useEffect } from 'react';
import logger from '../utils/logger';

/**
 * Hook para manejar localStorage de forma reactiva
 * @param {string} key - Clave del localStorage
 * @param {any} initialValue - Valor inicial si no existe
 * @returns {[any, Function]} - [valor, setValue]
 */
export const useLocalStorage = (key, initialValue) => {
  // Estado para almacenar el valor
  const [storedValue, setStoredValue] = useState(() => {
    try {
      // Obtener del localStorage
      const item = window.localStorage.getItem(key);
      // Parsear JSON o devolver valor inicial
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      logger.error(`Error al leer localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Función para actualizar el valor
  const setValue = (value) => {
    try {
      // Permitir función como useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      
      // Guardar estado
      setStoredValue(valueToStore);
      
      // Guardar en localStorage
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      logger.error(`Error al guardar en localStorage key "${key}":`, error);
    }
  };

  // Escuchar cambios en otras pestañas
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === key && e.newValue !== null) {
        try {
          setStoredValue(JSON.parse(e.newValue));
        } catch (error) {
          logger.error(`Error al parsear nuevo valor de localStorage key "${key}":`, error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key]);

  return [storedValue, setValue];
};

