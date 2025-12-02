import React, { useState, useEffect, useMemo } from 'react';
import useUserStore from '../stores/useUserStore';
import useBrandStore from '../stores/useBrandStore';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';
import NotificationsBell from './NotificationsBell';
import InviteClientModal from './InviteClientModal';
import StreakBadge from './StreakBadge';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { getNavigationItems, isActiveRoute } from '@/app/config/navigation.config.jsx';

const ModernNavbar = React.memo(() => {
    const navigate = useNavigate();
    const user = useUserStore((state) => state.user);
    const logout = useUserStore((state) => state.logout);
    const isAdmin = useUserStore((state) => state.isAdmin());
    const isCoach = useUserStore((state) => state.isCoach());
    const brandSettings = useBrandStore((state) => state.brandSettings);
    const location = useLocation();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [inviteModalOpen, setInviteModalOpen] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const userEmail = user?.email || 'Usuario';
    const firstLetter = userEmail.charAt(0).toUpperCase();
    
    // Obtener la primera letra del nombre de la marca para el logo
    const brandFirstLetter = brandSettings.brand_name?.charAt(0).toUpperCase() || 'F';

    // Debug: Log para verificar que el navbar se renderiza
    useEffect(() => {
        // Logging removido - usar logger si es necesario para debugging
        // En desarrollo, el logger ya maneja los niveles apropiados
    }, [user, isCoach, isAdmin, location.pathname]);

    // Cerrar el menú móvil cuando cambia la ruta
    useEffect(() => {
        setMobileMenuOpen(false);
    }, [location.pathname]);

    // Obtener items de navegación desde la configuración centralizada
    const navItems = useMemo(() => {
        // Usar el rol del usuario directamente (viene en mayúsculas: 'COACH', 'ADMIN', 'CLIENT')
        const role = user?.role || 'CLIENT';
        return getNavigationItems(role, false);
    }, [user?.role, isCoach, isAdmin]);

    const isActive = (path) => {
        return isActiveRoute(location.pathname, path);
    };

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-white/95 dark:bg-gray-900/95 border-b border-gray-200/50 dark:border-gray-800/50 transition-colors duration-300 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
                <div className="flex items-center justify-between h-16 lg:h-20 gap-3 md:gap-4">
                    {/* Logo */}
                    <Link 
                        to={isCoach || isAdmin ? "/coach/dashboard" : "/dashboard"} 
                        className="flex items-center gap-2 md:gap-3 group flex-shrink-0 min-w-0"
                        onClick={() => setMobileMenuOpen(false)}
                    >
                        <div className="relative w-10 h-10 flex-shrink-0">
                            {brandSettings.logo_url ? (
                                <img 
                                    src={brandSettings.logo_url} 
                                    alt={brandSettings.brand_name}
                                    className="w-10 h-10 rounded-2xl object-cover transition-transform duration-200 group-hover:scale-105"
                                    onError={(e) => {
                                        // Si la imagen falla al cargar, ocultar y mostrar el fallback
                                        e.target.style.display = 'none';
                                        const fallback = e.target.parentElement.querySelector('.logo-fallback');
                                        if (fallback) fallback.style.display = 'flex';
                                    }}
                                />
                            ) : null}
                            <div 
                                className={`logo-fallback w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-pink-500 flex items-center justify-center transition-transform duration-200 group-hover:scale-105 ${brandSettings.logo_url ? 'hidden absolute inset-0' : ''}`}
                            >
                                <span className="text-white font-bold text-lg">{brandFirstLetter}</span>
                            </div>
                        </div>
                        <div className="hidden sm:block min-w-0">
                            <span className="text-xl font-semibold text-gray-900 dark:text-white tracking-tight truncate block max-w-[150px] md:max-w-[200px]">
                                {brandSettings.brand_name}
                            </span>
                        </div>
                    </Link>

                    {/* Navigation - Desktop */}
                    {user && (
                        <div className="hidden lg:flex items-center flex-1 justify-center min-w-0 px-4">
                            <nav className="flex items-center gap-0.5 justify-center flex-nowrap" aria-label="Navegación principal">
                                {navItems.map((item) => {
                                    const isCoachDashboard = item.path === '/coach/dashboard';
                                    return (
                                        <Link
                                            key={item.path}
                                            to={item.path}
                                            aria-label={item.label}
                                            aria-current={isActive(item.path) ? 'page' : undefined}
                                            className={`group relative w-10 h-10 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                                                isActive(item.path)
                                                    ? isCoachDashboard
                                                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 shadow-sm'
                                                        : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                                                    : isCoachDashboard
                                                        ? 'text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-100/50 dark:hover:bg-blue-900/20'
                                                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100/50 dark:hover:bg-gray-800/50'
                                            }`}
                                            title={item.label}
                                        >
                                            <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center" aria-hidden="true">
                                                {item.icon && <item.icon className="h-5 w-5" />}
                                            </span>
                                            {/* Tooltip on hover */}
                                            <span className="absolute -bottom-11 left-1/2 transform -translate-x-1/2 px-2.5 py-1.5 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 z-[60] shadow-lg" role="tooltip">
                                                {item.label}
                                                <span className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-900 dark:bg-gray-700 rotate-45" aria-hidden="true"></span>
                                            </span>
                                        </Link>
                                    );
                                })}
                            </nav>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 md:gap-2 xl:gap-3 flex-shrink-0" role="toolbar" aria-label="Acciones de usuario">
                        {user && !isCoach && <div className="hidden lg:block"><StreakBadge /></div>}
                        {user && <div className="hidden lg:block"><NotificationsBell /></div>}
                        {isCoach && (
                            <button
                                onClick={() => setInviteModalOpen(true)}
                                className="group relative hidden lg:flex items-center justify-center w-10 h-10 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                                title="Invitar Cliente"
                            >
                                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                {/* Tooltip on hover */}
                                <span className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 z-50">
                                    Invitar Cliente
                                </span>
                            </button>
                        )}
                        <ThemeToggle />
                        
                        {/* Mobile Menu Button */}
                        {user && (
                            <button
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                className="md:hidden w-10 h-10 flex items-center justify-center rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                aria-label="Menú de navegación"
                                aria-expanded={mobileMenuOpen}
                            >
                                {mobileMenuOpen ? (
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                ) : (
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                    </svg>
                                )}
                            </button>
                        )}

                        {/* User Dropdown - Desktop */}
                        {user && (
                            <div className="hidden md:block">
                                <DropdownMenu.Root open={dropdownOpen} onOpenChange={setDropdownOpen}>
                                    <DropdownMenu.Trigger asChild>
                                        <button 
                                            className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-100 to-pink-100 dark:from-blue-900/30 dark:to-pink-900/30 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-gray-900 dark:text-white font-semibold text-sm hover:scale-105 transition-transform cursor-pointer"
                                            aria-label={`Menú de usuario: ${userEmail}`}
                                            aria-haspopup="menu"
                                            aria-expanded={dropdownOpen}
                                        >
                                            {firstLetter}
                                        </button>
                                    </DropdownMenu.Trigger>
                                    <DropdownMenu.Portal>
                                        <DropdownMenu.Content
                                            className="min-w-[14rem] bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 p-2 backdrop-blur-xl z-50"
                                            sideOffset={5}
                                        >
                                            <div className="px-3 py-2 mb-1">
                                                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Sesión actual</span>
                                            </div>
                                            <div className="px-3 py-2 mb-2">
                                                <span className="text-sm text-gray-900 dark:text-white font-medium truncate block">{userEmail}</span>
                                            </div>
                                            <div className="h-px bg-gray-200 dark:bg-gray-800 my-2"></div>
                                            <DropdownMenu.Item
                                                onSelect={() => logout(navigate)}
                                                className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors py-2.5 px-3 cursor-pointer outline-none flex items-center gap-2"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                                </svg>
                                                Cerrar Sesión
                                            </DropdownMenu.Item>
                                        </DropdownMenu.Content>
                                    </DropdownMenu.Portal>
                                </DropdownMenu.Root>
                            </div>
                        )}
                    </div>
                </div>

                {/* Mobile Menu */}
                {user && mobileMenuOpen && (
                    <div className="md:hidden border-t border-gray-200 dark:border-gray-800 py-4">
                        <div className="flex flex-col gap-2">
                            {navItems.map((item) => (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className={`px-4 py-3 rounded-lg text-base font-medium transition-all duration-300 flex items-center gap-3 ${
                                        isActive(item.path)
                                            ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white font-semibold'
                                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100/50 dark:hover:bg-gray-800/50'
                                    }`}
                                >
                                    {item.icon && <item.icon className="h-5 w-5" />}
                                    {item.label}
                                </Link>
                            ))}
                            
                            {/* Mobile Actions */}
                            <div className="pt-4 border-t border-gray-200 dark:border-gray-800 mt-2 space-y-2">
                                {!isCoach && (
                                    <div className="px-4">
                                        <StreakBadge />
                                    </div>
                                )}
                                {user && (
                                    <div className="px-4">
                                        <NotificationsBell />
                                    </div>
                                )}
                                {isCoach && (
                                    <button
                                        onClick={() => {
                                            setInviteModalOpen(true);
                                            setMobileMenuOpen(false);
                                        }}
                                        className="w-full px-4 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors text-base font-medium flex items-center gap-3"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                        Invitar Cliente
                                    </button>
                                )}
                                <div className="px-4 py-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-600 dark:text-gray-400">Usuario:</span>
                                        <span className="text-sm text-gray-900 dark:text-white font-medium truncate">{userEmail}</span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        logout(navigate);
                                        setMobileMenuOpen(false);
                                    }}
                                    className="w-full px-4 py-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors text-base font-medium flex items-center gap-3"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                    </svg>
                                    Cerrar Sesión
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            <InviteClientModal open={inviteModalOpen} onOpenChange={setInviteModalOpen} />
        </nav>
    );
});

ModernNavbar.displayName = 'ModernNavbar';

export default ModernNavbar;
