import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useUserStore from '../stores/useUserStore';
import useBrandStore from '../stores/useBrandStore';
import api from '../services/api';
import { useReCaptcha } from '../components/ReCaptcha';

const InvitePage = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const register = useUserStore((state) => state.register);
    const isAuthenticated = useUserStore((state) => state.isAuthenticated());
    const brandSettings = useBrandStore((state) => state.brandSettings);
    
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [validating, setValidating] = useState(true);
    const [inviteData, setInviteData] = useState(null);

    const recaptchaSiteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY || '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI';
    const { execute: executeRecaptcha } = useReCaptcha(recaptchaSiteKey);

    useEffect(() => {
        if (isAuthenticated) {
            navigate('/dashboard', { replace: true });
            return;
        }

        // Validar el token de invitación
        const validateToken = async () => {
            try {
                const response = await api.get(`/invite/${token}`);
                setInviteData(response.data);
                setEmail(response.data.email); // Pre-llenar el email
                setValidating(false);
            } catch (error) {
                setError(error.response?.data?.error || 'Token de invitación inválido o expirado.');
                setValidating(false);
            }
        };

        if (token) {
            validateToken();
        } else {
            setError('Token de invitación no proporcionado.');
            setValidating(false);
        }
    }, [token, navigate, isAuthenticated]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        if (password !== confirmPassword) {
            setError('Las contraseñas no coinciden.');
            return;
        }

        if (password.length < 8) {
            setError('La contraseña debe tener al menos 8 caracteres.');
            return;
        }

        setLoading(true);

        try {
            const recaptchaToken = await executeRecaptcha('register');
            
            const result = await register(email, password, recaptchaToken, navigate, token);
            
            if (!result.success) {
                setError(result.error);
                setLoading(false);
                return;
            }
        } catch (err) {
            setError(err.error || 'Ocurrió un error al procesar el registro.');
        } finally {
            setLoading(false);
        }
    };

    const brandFirstLetter = brandSettings.brand_name?.charAt(0).toUpperCase() || 'F';

    if (validating) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#FAF3E1] dark:bg-black">
                <div className="text-center">
                    <div className="w-8 h-8 border-4 border-gray-300 dark:border-gray-700 border-t-primary-500 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">Validando invitación...</p>
                </div>
            </div>
        );
    }

    if (error && !inviteData) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#FAF3E1] dark:bg-black p-4">
                <div className="w-full max-w-md text-center">
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
                        <svg className="w-12 h-12 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <h2 className="text-xl font-semibold text-red-800 dark:text-red-200 mb-2">Invitación Inválida</h2>
                        <p className="text-red-600 dark:text-red-300 mb-4">{error}</p>
                        <button
                            onClick={() => navigate('/login')}
                            className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                        >
                            Ir al Login
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#FAF3E1] dark:bg-black p-4 transition-colors duration-300">
            <div className="w-full max-w-md">
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
                        ¡Has sido invitado!
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Completa tu registro para unirte como cliente
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {error && (
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                            <p className="text-red-600 dark:text-red-300 text-sm">{error}</p>
                        </div>
                    )}

                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Email
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            disabled
                            className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-500 dark:text-gray-400 cursor-not-allowed"
                        />
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Este email fue proporcionado en la invitación</p>
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Contraseña
                        </label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={8}
                            className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                        />
                    </div>

                    <div>
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Confirmar Contraseña
                        </label>
                        <input
                            id="confirmPassword"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            minLength={8}
                            className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {loading ? 'Registrando...' : 'Aceptar Invitación'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default InvitePage;

