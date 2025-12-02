import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { AppLayout } from '@/app/layout/AppLayout';
import { PageContainer } from '@/shared/components/layout/PageContainer';
import WeightForm from '../components/WeightForm';
import GoalManager from '../components/GoalManager';
import api from '../services/api';
import logger from '@/utils/logger';

// Lazy load de componentes pesados
const WeightLineChart = lazy(() => import('../components/WeightLineChart'));

// Skeleton para WeightLineChart
const WeightChartSkeleton = () => (
  <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm animate-pulse">
    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
    <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
  </div>
);

const WeightTrackingPage = () => {
    const [currentDate] = useState(new Date()); // Fecha fija para esta página
    const [log, setLog] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchDailyLog = useCallback(async () => {
        try {
            const formattedDate = new Date(currentDate).toISOString().split('T')[0];
            const response = await api.get(`/logs/${formattedDate}`);
            setLog(response.data.log);
        } catch (error) {
            logger.error('Error al cargar log:', error);
            setLog(null);
        } finally {
            setLoading(false);
        }
    }, [currentDate]);

    useEffect(() => {
        setLoading(true);
        fetchDailyLog();
    }, [fetchDailyLog]);

    const handleLogUpdated = (newLog) => {
        setLog(newLog);
        fetchDailyLog();
    };

    return (
        <AppLayout>
            <PageContainer
                title="Peso y Objetivos"
                description="Registra tu peso y gestiona tus objetivos"
            >
                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="w-8 h-8 border-2 border-[#D45A0F] dark:border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Gráfica de Evolución */}
                        <Suspense fallback={<WeightChartSkeleton />}>
                            <WeightLineChart />
                        </Suspense>

                        {/* Grid de Formularios */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Registro de Peso */}
                            <WeightForm 
                                currentDate={currentDate}
                                currentWeight={log ? log.weight : null}
                                onLogUpdated={handleLogUpdated}
                            />

                            {/* Gestor de Objetivos */}
                            <GoalManager 
                                currentWeight={log ? parseFloat(log.weight) : null}
                            />
                        </div>
                    </div>
                )}
            </PageContainer>
        </AppLayout>
    );
};

export default WeightTrackingPage;
