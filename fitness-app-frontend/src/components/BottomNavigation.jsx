import React, { useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import useUserStore from '../stores/useUserStore';
import { getNavigationItems, isActiveRoute } from '@/app/config/navigation.config.jsx';

const BottomNavigation = () => {
    const location = useLocation();
    const user = useUserStore((state) => state.user);
    const isCoach = useUserStore((state) => state.isCoach());
    const isAdmin = useUserStore((state) => state.isAdmin());

    // Obtener solo los items para bottom navigation (bottomNav: true)
    const navItems = useMemo(() => {
        // Usar el rol del usuario directamente (viene en mayúsculas: 'COACH', 'ADMIN', 'CLIENT')
        const role = user?.role || 'CLIENT';
        return getNavigationItems(role, true);
    }, [user?.role]);

    const isActive = (path) => {
        return isActiveRoute(location.pathname, path);
    };

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-t border-gray-200/50 dark:border-gray-800/50 safe-area-bottom transition-colors duration-300 shadow-lg" aria-label="Navegación inferior">
            <div className="flex items-center justify-around h-16 sm:h-20 px-1 sm:px-2 pb-safe" role="list">
                {navItems.map((item) => {
                    const active = isActive(item.path);
                    const isCoachDashboard = item.path === '/coach/dashboard';
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`relative flex flex-col items-center justify-center gap-0.5 sm:gap-1.5 flex-1 h-full rounded-xl sm:rounded-2xl transition-all duration-300 min-w-0 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                                active 
                                    ? isCoachDashboard
                                        ? 'text-blue-600 dark:text-blue-400'
                                        : 'text-blue-600 dark:text-blue-400'
                                    : isCoachDashboard
                                        ? 'text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300'
                                        : 'text-gray-500 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                            }`}
                            aria-label={item.label}
                            aria-current={active ? 'page' : undefined}
                        >
                            <div className={`transition-transform duration-300 ${active ? 'scale-110' : 'scale-100'}`} aria-hidden="true">
                                {item.icon && <item.icon className="h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0" />}
                            </div>
                            <span className={`text-[10px] sm:text-xs font-medium transition-all duration-300 truncate w-full text-center px-0.5 ${active ? 'font-semibold' : ''}`}>{item.label}</span>
                            {active && (
                                <div className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 sm:w-10 h-0.5 sm:h-1 rounded-t-full transition-all duration-300 ${
                                    isCoachDashboard 
                                        ? 'bg-blue-600 dark:bg-blue-400' 
                                        : 'bg-blue-600 dark:bg-blue-400'
                                }`}></div>
                            )}
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
};

export default BottomNavigation;
