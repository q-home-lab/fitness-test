import React from 'react';
import useUserStore from '../stores/useUserStore';
import useBrandStore from '../stores/useBrandStore';
import { Link, useNavigate } from 'react-router-dom';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';

const Navbar = () => {
    const navigate = useNavigate();
    const user = useUserStore((state) => state.user);
    const logout = useUserStore((state) => state.logout);
    const brandSettings = useBrandStore((state) => state.brandSettings);
    // Manejo seguro del email y la inicial
    const userEmail = user?.email || 'Usuario';
    const firstLetter = userEmail.charAt(0).toUpperCase();

    return (
        <div className="navbar bg-white dark:bg-gray-900 shadow-lg border-b border-gray-200 dark:border-gray-800 transition-colors duration-300">
            
            {/* Sección de Logo y Links Principales */}
            <div className="flex-1">
                <Link to="/" className="px-4 py-2 text-xl font-bold text-blue-600 dark:text-blue-400 hover:opacity-80 transition-opacity flex items-center gap-2">
                    {brandSettings.logo_url && (
                        <img 
                            src={brandSettings.logo_url} 
                            alt={brandSettings.brand_name}
                            className="w-8 h-8 rounded-lg object-cover"
                            onError={(e) => {
                                e.target.style.display = 'none';
                            }}
                        />
                    )}
                    {brandSettings.brand_name || 'Fitness Tracker'}
                </Link>
                
                {/* Enlace a Rutinas, visible solo si el usuario está logeado */}
                {user && (
                    <Link to="/routines" className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                        Rutinas
                    </Link>
                )}
            </div>
            
            {/* Sección de Perfil y Logout */}
            <div className="flex-none">
                {user && (
                    <DropdownMenu.Root>
                        <DropdownMenu.Trigger asChild>
                            <button className="w-10 h-10 bg-blue-600 dark:bg-blue-500 text-white flex items-center justify-center rounded-full text-lg font-semibold hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors">
                                {firstLetter}
                            </button>
                        </DropdownMenu.Trigger>
                        <DropdownMenu.Portal>
                            <DropdownMenu.Content className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-xl p-2 min-w-[200px] z-50 transition-colors duration-300">
                                <DropdownMenu.Label className="px-3 py-2 text-sm font-semibold text-gray-900 dark:text-white">
                                    Sesión: {userEmail}
                                </DropdownMenu.Label>
                                <DropdownMenu.Separator className="h-px bg-gray-200 dark:bg-gray-800 my-1" />
                                <DropdownMenu.Item asChild>
                                    <button 
                                        onClick={() => logout(navigate)} 
                                        className="w-full text-left px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                    >
                                        Cerrar Sesión
                                    </button>
                                </DropdownMenu.Item>
                            </DropdownMenu.Content>
                        </DropdownMenu.Portal>
                    </DropdownMenu.Root>
                )}
            </div>
        </div>
    );
};

export default Navbar;
