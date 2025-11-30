import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useUserStore from '../stores/useUserStore';
import useBrandStore from '../stores/useBrandStore';

// Componente que inicializa los stores al cargar la app
const StoreInitializer = ({ children }) => {
  const navigate = useNavigate();
  const loadUser = useUserStore((state) => state.loadUser);
  const loading = useUserStore((state) => state.loading);
  const loadBrandSettings = useBrandStore((state) => state.loadBrandSettings);

  useEffect(() => {
    // Cargar usuario y marca al inicio
    loadUser();
    loadBrandSettings();
  }, [loadUser, loadBrandSettings]);

  // Mostrar loading mientras se carga el usuario inicial
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#FAF3E1] dark:bg-black transition-colors duration-300">
        <div className="w-8 h-8 border-2 border-blue-600 dark:border-blue-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return children;
};

export default StoreInitializer;

