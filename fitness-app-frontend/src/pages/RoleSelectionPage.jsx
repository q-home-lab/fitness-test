import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useUserStore from '../stores/useUserStore';
import useBrandStore from '../stores/useBrandStore';
import api from '../services/api';

const RoleSelectionPage = () => {
    const navigate = useNavigate();
    const user = useUserStore((state) => state.user);
    const setUser = useUserStore((state) => state.setUser);
    const brandSettings = useBrandStore((state) => state.brandSettings);
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Si el usuario ya tiene un rol, redirigir según el rol
        if (user?.role && user.role !== null) {
            if (user.role === 'COACH' || user.role === 'ADMIN') {
                navigate('/coach/dashboard', { replace: true });
            } else {
                navigate('/dashboard', { replace: true });
            }
        }
    }, [user, navigate]);

    const handleRoleSelection = async (role) => {
        if (!user) {
            navigate('/login');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // Actualizar el rol del usuario en el backend
            const response = await api.patch('/profile/role', { role });
            
            // Actualizar el usuario en el store
            setUser({ ...user, role: role });
            
            // Redirigir según el rol
            // Los coaches van directo a su dashboard
            // Los clients van a welcome para completar onboarding si es necesario
            if (role === 'COACH') {
                navigate('/coach/dashboard', { replace: true });
            } else {
                // El OnboardingGuard se encargará de verificar si necesita onboarding
                navigate('/welcome', { replace: true });
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Error al actualizar el rol. Por favor, intenta de nuevo.');
            setLoading(false);
        }
    };

    const brandFirstLetter = brandSettings.brand_name?.charAt(0).toUpperCase() || 'F';

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#FAF3E1] dark:bg-black p-4 transition-colors duration-300">
            <div className="w-full max-w-2xl">
                <div className="text-center mb-10">
                    <div className="relative w-20 h-20 mx-auto mb-6">
                        {brandSettings.logo_url ? (
                            <img 
                                src={brandSettings.logo_url} 
                                alt={brandSettings.brand_name}
                                className="w-20 h-20 rounded-3xl object-cover shadow-xl"
                                onError={(e) => {
                                    e.target.style.display = 'none';
                                    const fallback = e.target.parentElement.querySelector('.logo-fallback');
                                    if (fallback) fallback.style.display = 'flex';
                                }}
                            />
                        ) : null}
                        <div 
                            className={`logo-fallback w-20 h-20 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-3xl flex items-center justify-center shadow-xl ${brandSettings.logo_url ? 'hidden absolute inset-0' : ''}`}
                        >
                            <span className="text-white font-bold text-3xl">{brandFirstLetter}</span>
                        </div>
                    </div>
                    <h1 className="text-5xl font-semibold text-gray-900 dark:text-white mb-3 tracking-tight">
                        ¿Eres entrenador o cliente?
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Selecciona tu rol para continuar
                    </p>
                </div>

                {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
                        <p className="text-red-600 dark:text-red-300 text-sm">{error}</p>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Opción Cliente */}
                    <button
                        onClick={() => handleRoleSelection('CLIENT')}
                        disabled={loading}
                        className="group relative p-8 bg-white dark:bg-gray-800 rounded-2xl border-2 border-gray-200 dark:border-gray-700 hover:border-primary-500 dark:hover:border-primary-500 transition-all duration-300 hover:shadow-xl text-left disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <div className="flex flex-col items-center text-center">
                            <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mb-4 group-hover:bg-primary-200 dark:group-hover:bg-primary-900/50 transition-colors">
                                <svg className="w-8 h-8 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            </div>
                            <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                                Cliente
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400">
                                Quiero seguir mi progreso, rutinas y dieta asignadas por mi entrenador
                            </p>
                        </div>
                    </button>

                    {/* Opción Entrenador */}
                    <button
                        onClick={() => handleRoleSelection('COACH')}
                        disabled={loading}
                        className="group relative p-8 bg-white dark:bg-gray-800 rounded-2xl border-2 border-gray-200 dark:border-gray-700 hover:border-secondary-500 dark:hover:border-secondary-500 transition-all duration-300 hover:shadow-xl text-left disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <div className="flex flex-col items-center text-center">
                            <div className="w-16 h-16 bg-secondary-100 dark:bg-secondary-900/30 rounded-full flex items-center justify-center mb-4 group-hover:bg-secondary-200 dark:group-hover:bg-secondary-900/50 transition-colors">
                                <svg className="w-8 h-8 text-secondary-600 dark:text-secondary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                                Entrenador
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400">
                                Quiero gestionar clientes, crear rutinas y planes de dieta
                            </p>
                        </div>
                    </button>
                </div>

                {loading && (
                    <div className="text-center mt-6">
                        <div className="w-8 h-8 border-4 border-gray-300 dark:border-gray-700 border-t-primary-500 rounded-full animate-spin mx-auto"></div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RoleSelectionPage;

