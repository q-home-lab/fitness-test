import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import useUserStore from '../stores/useUserStore';
import api from '../services/api';
import logger from '../utils/logger';

// Componente que verifica si el usuario necesita completar el onboarding
const OnboardingGuard = ({ children }) => {
    const user = useUserStore((state) => state.user);
    const authLoading = useUserStore((state) => state.loading);
    const location = useLocation();
    const [onboardingStatus, setOnboardingStatus] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkOnboarding = async () => {
            if (!user) {
                setLoading(false);
                return;
            }

            try {
                const response = await api.get('/onboarding/status');
                setOnboardingStatus(response.data);
            } catch (error) {
                logger.error('Error al verificar estado de onboarding:', error);
            } finally {
                setLoading(false);
            }
        };

        if (!authLoading) {
            checkOnboarding();
        }
    }, [user, authLoading]);

    // Si está cargando, mostrar spinner
    if (authLoading || loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-[#FAF3E1] dark:bg-black transition-colors duration-300">
                <div className="w-8 h-8 border-2 border-blue-600 dark:border-blue-400 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    // Los coaches no necesitan completar onboarding
    const isCoach = user?.role === 'COACH' || user?.role === 'ADMIN';
    
    // Derivar un estado de "onboarding completado" más robusto
    // Consideramos completado si:
    // - Es coach/admin (no necesitan onboarding), O
    // - El backend marca onboarding_completed = true, O
    // - El usuario ya tiene peso y objetivo configurados (has_weight && has_goal)
    const isOnboardingCompleted =
        isCoach ||
        (onboardingStatus &&
            (onboardingStatus.onboarding_completed ||
                (onboardingStatus.has_weight && onboardingStatus.has_goal)));

    // Si no hay usuario, redirigir a login
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // Si el usuario no ha completado el onboarding y no está en /welcome, redirigir
    // Solo redirigir si tenemos el estado de onboarding cargado
    if (
        onboardingStatus !== null &&
        !isOnboardingCompleted &&
        location.pathname !== '/welcome' &&
        location.pathname !== '/select-role'
    ) {
        return <Navigate to="/welcome" replace />;
    }

    // Si el usuario ha completado el onboarding y está en /welcome, redirigir a dashboard
    if (
        onboardingStatus !== null &&
        isOnboardingCompleted &&
        location.pathname === '/welcome'
    ) {
        return <Navigate to="/dashboard" replace />;
    }

    return children;
};

export default OnboardingGuard;
