import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import useUserStore from '@/stores/useUserStore';
import { getNavigationItems, isActiveRoute } from '@/app/config/navigation.config.jsx';

/**
 * Hook personalizado para acceder a la configuración de navegación
 * Proporciona items de navegación filtrados por rol y utilidades de navegación
 */
export const useNavigation = (bottomNav = false) => {
  const location = useLocation();
  const user = useUserStore((state) => state.user);

  const navItems = useMemo(() => {
    const role = user?.role || 'user';
    return getNavigationItems(role, bottomNav);
  }, [user?.role, bottomNav]);

  const checkActiveRoute = (path) => {
    return isActiveRoute(location.pathname, path);
  };

  return {
    navItems,
    currentPath: location.pathname,
    isActive: checkActiveRoute
  };
};

export default useNavigation;

