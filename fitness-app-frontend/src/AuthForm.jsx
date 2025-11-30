import React, { useState, useEffect } from 'react';
import useUserStore from './stores/useUserStore';
import useBrandStore from './stores/useBrandStore';
import { useLocation, useNavigate } from 'react-router-dom';
import { useReCaptcha } from './components/ReCaptcha'; 

const AuthForm = () => {
    const location = useLocation();
    const isLogin = location.pathname === '/login';
    const navigate = useNavigate();
    
    const login = useUserStore((state) => state.login);
    const register = useUserStore((state) => state.register);
    const isAuthenticated = useUserStore((state) => state.isAuthenticated());
    const brandSettings = useBrandStore((state) => state.brandSettings);
    
    // Obtener la primera letra del nombre de la marca para el logo
    const brandFirstLetter = brandSettings.brand_name?.charAt(0).toUpperCase() || 'F';

    useEffect(() => {
        if (isAuthenticated) {
            navigate('/dashboard', { replace: true });
        }
    }, [isAuthenticated, navigate]);
    
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    
    // reCAPTCHA v3 - usar variable de entorno o clave pública de prueba
    const recaptchaSiteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY || '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI'; // Clave de prueba de Google
    const { execute: executeRecaptcha } = useReCaptcha(recaptchaSiteKey);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            // Ejecutar reCAPTCHA v3
            const recaptchaToken = await executeRecaptcha(isLogin ? 'login' : 'register');
            
            if (!recaptchaToken && import.meta.env.VITE_RECAPTCHA_SITE_KEY) {
                // Solo mostrar error si reCAPTCHA está configurado (no en modo desarrollo sin clave)
                setError('Error de verificación. Por favor, intenta de nuevo.');
                setLoading(false);
                return;
            }

            if (isLogin) {
                const result = await login(email, password, recaptchaToken, navigate);
                if (!result.success) {
                    setError(result.error);
                    setLoading(false);
                    return;
                }
            } else {
                const result = await register(email, password, recaptchaToken, navigate);
                if (!result.success) {
                    // Manejar errores de validación con detalles
                    const errorMsg = result.error || 'Error al registrarse';
                    const details = result.details;
                    if (details && Array.isArray(details) && details.length > 0) {
                        setError(details.map(d => d.message).join(', '));
                    } else {
                        setError(errorMsg);
                    }
                    setLoading(false);
                    return;
                }
            }
        } catch (err) {
            setError(err.error || 'Ocurrió un error al procesar la solicitud.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#FAF3E1] dark:bg-black p-4 transition-colors duration-300">
            <div className="w-full max-w-md">
                {/* Logo y Header */}
                <div className="text-center mb-10">
                    <div className="relative w-20 h-20 mx-auto mb-6">
                        {brandSettings.logo_url ? (
                            <img 
                                src={brandSettings.logo_url} 
                                alt={brandSettings.brand_name}
                                className="w-20 h-20 rounded-3xl object-cover shadow-xl shadow-[#D45A0F]/20 dark:shadow-blue-600/20"
                                onError={(e) => {
                                    // Si la imagen falla al cargar, ocultar y mostrar el fallback
                                    e.target.style.display = 'none';
                                    const fallback = e.target.parentElement.querySelector('.logo-fallback');
                                    if (fallback) fallback.style.display = 'flex';
                                }}
                            />
                        ) : null}
                        <div 
                            className={`logo-fallback w-20 h-20 bg-gradient-to-br from-[#D45A0F] to-[#86c4c2] dark:from-blue-600 dark:to-pink-500 rounded-3xl flex items-center justify-center shadow-xl shadow-[#D45A0F]/20 dark:shadow-blue-600/20 ${brandSettings.logo_url ? 'hidden absolute inset-0' : ''}`}
                        >
                            <span className="text-white font-bold text-3xl">{brandFirstLetter}</span>
                        </div>
                    </div>
                    <h1 className="text-5xl font-semibold text-gray-900 dark:text-white mb-3 tracking-tight">
                        {isLogin ? 'Bienvenido' : 'Crea tu cuenta'}
                    </h1>
                    <p className="text-xl text-gray-600 dark:text-gray-400 font-light">
                        {isLogin ? 'Continúa tu progreso' : 'Comienza tu transformación'}
                    </p>
                </div>

                {/* Formulario */}
                <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-xl p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Correo electrónico
                            </label>
                            <input 
                                type="email" 
                                placeholder="tu@email.com" 
                                className="w-full px-4 py-3.5 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 dark:focus:border-blue-400 transition-all text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500" 
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Contraseña
                            </label>
                            <input 
                                type="password" 
                                placeholder="••••••••" 
                                className="w-full px-4 py-3.5 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 dark:focus:border-blue-400 transition-all text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500" 
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={8}
                            />
                            {!isLogin && (
                                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                                    Mínimo 8 caracteres, incluyendo mayúscula, minúscula, número y carácter especial (@$!%*?&)
                                </p>
                            )}
                        </div>

                        {isLogin && (
                            <div className="flex justify-end -mt-2">
                                <button
                                    type="button"
                                    className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:opacity-80 transition-opacity"
                                    onClick={() => navigate('/forgot-password')}
                                >
                                    ¿Olvidaste tu contraseña?
                                </button>
                            </div>
                        )}

                        {error && (
                            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-4 text-red-600 dark:text-red-400 text-sm">
                                {error}
                            </div>
                        )}
                        
                        <button 
                            type="submit" 
                            className="w-full py-3.5 bg-blue-600 dark:bg-blue-500 text-white rounded-2xl font-semibold hover:bg-blue-700 dark:hover:bg-blue-600 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    Procesando...
                                </>
                            ) : (
                                isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'
                            )}
                        </button>
                    </form>

                    {/* Enlace de cambio */}
                    <div className="text-center mt-8 pt-8 border-t border-gray-200 dark:border-gray-800">
                        <span className="text-sm text-gray-600 dark:text-gray-400 font-light">
                            {isLogin ? '¿No tienes cuenta? ' : '¿Ya tienes cuenta? '}
                        </span>
                        <button
                            type="button"
                            className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:opacity-80 transition-opacity ml-1"
                            onClick={() => navigate(isLogin ? '/register' : '/login')}
                        >
                            {isLogin ? 'Regístrate' : 'Inicia Sesión'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuthForm;
