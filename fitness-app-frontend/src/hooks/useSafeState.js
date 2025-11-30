import { useState, useEffect, useRef } from 'react';

/**
 * Hook para manejar estado de forma segura (evita memory leaks)
 * Útil cuando el componente puede desmontarse antes de que se complete una operación asíncrona
 */
export const useSafeState = (initialValue) => {
  const [state, setState] = useState(initialValue);
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const setSafeState = (value) => {
    if (isMountedRef.current) {
      setState(value);
    }
  };

  return [state, setSafeState];
};

/**
 * Hook para manejar estado de carga y error de forma segura
 */
export const useAsyncState = (initialData = null) => {
  const [data, setData] = useSafeState(initialData);
  const [loading, setLoading] = useSafeState(false);
  const [error, setError] = useSafeState(null);

  const execute = async (asyncFunction) => {
    setLoading(true);
    setError(null);
    try {
      const result = await asyncFunction();
      setData(result);
      return result;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, execute, setData, setLoading, setError };
};

