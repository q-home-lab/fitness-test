import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { AppLayout } from '@/app/layout/AppLayout';
import { PageContainer } from '@/shared/components/layout/PageContainer';
import { ArrowLeft, TrendingUp, Target, Calendar, FileText, MessageSquare } from 'lucide-react';
import * as Tabs from '@radix-ui/react-tabs';
import logger from '@/utils/logger';

const CoachClientDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [client, setClient] = useState(null);
    const [weightHistory, setWeightHistory] = useState([]);
    const [goals, setGoals] = useState([]);
    const [recentLogs, setRecentLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('progress');

    useEffect(() => {
        loadClientDetail();
    }, [id]);

    const loadClientDetail = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/coach/clients/${id}`);
            setClient(response.data.client);
            setWeightHistory(response.data.weightHistory || []);
            setGoals(response.data.goals || []);
            setRecentLogs(response.data.recentLogs || []);
        } catch (err) {
            setError(err.response?.data?.error || 'Error al cargar el detalle del cliente');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <AppLayout>
                <PageContainer>
                    <div className="flex items-center justify-center py-20">
                        <div className="w-8 h-8 border-4 border-gray-300 dark:border-gray-700 border-t-primary-500 rounded-full animate-spin"></div>
                    </div>
                </PageContainer>
            </AppLayout>
        );
    }

    if (error || !client) {
        return (
            <AppLayout>
                <PageContainer>
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                        <p className="text-red-600 dark:text-red-300">{error || 'Cliente no encontrado'}</p>
                    </div>
                </PageContainer>
            </AppLayout>
        );
    }

    const getInitials = (email) => {
        return email.charAt(0).toUpperCase();
    };

    const currentWeight = weightHistory.length > 0 
        ? parseFloat(weightHistory[weightHistory.length - 1].weight) 
        : null;
    const activeGoal = goals.find(g => g.is_active) || null;

    return (
        <AppLayout>
            <PageContainer>
                {/* Header */}
                <button
                    onClick={() => navigate('/coach/dashboard')}
                    className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                    <span>Volver al Dashboard</span>
                </button>

                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white font-bold text-2xl">
                            {getInitials(client.email)}
                        </div>
                        <div className="flex-1">
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                                {client.email}
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400">
                                Cliente desde {new Date(client.created_at).toLocaleDateString()}
                            </p>
                        </div>
                        <div className="text-right">
                            {currentWeight && (
                                <div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Peso Actual</p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                        {currentWeight} kg
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <Tabs.Root value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <Tabs.List className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-700">
                        <Tabs.Trigger
                            value="progress"
                            className="px-6 py-3 text-sm font-medium text-gray-600 dark:text-gray-400 border-b-2 border-transparent data-[state=active]:border-primary-500 data-[state=active]:text-primary-600 dark:data-[state=active]:text-primary-400 transition-colors"
                        >
                            <div className="flex items-center gap-2">
                                <TrendingUp className="w-4 h-4" />
                                Progreso
                            </div>
                        </Tabs.Trigger>
                        <Tabs.Trigger
                            value="routines"
                            className="px-6 py-3 text-sm font-medium text-gray-600 dark:text-gray-400 border-b-2 border-transparent data-[state=active]:border-primary-500 data-[state=active]:text-primary-600 dark:data-[state=active]:text-primary-400 transition-colors"
                        >
                            <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                Rutinas
                            </div>
                        </Tabs.Trigger>
                        <Tabs.Trigger
                            value="diet"
                            className="px-6 py-3 text-sm font-medium text-gray-600 dark:text-gray-400 border-b-2 border-transparent data-[state=active]:border-primary-500 data-[state=active]:text-primary-600 dark:data-[state=active]:text-primary-400 transition-colors"
                        >
                            <div className="flex items-center gap-2">
                                <Target className="w-4 h-4" />
                                Dieta
                            </div>
                        </Tabs.Trigger>
                        <Tabs.Trigger
                            value="checkins"
                            className="px-6 py-3 text-sm font-medium text-gray-600 dark:text-gray-400 border-b-2 border-transparent data-[state=active]:border-primary-500 data-[state=active]:text-primary-600 dark:data-[state=active]:text-primary-400 transition-colors"
                        >
                            <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4" />
                                Check-ins
                            </div>
                        </Tabs.Trigger>
                        <Tabs.Trigger
                            value="notes"
                            className="px-6 py-3 text-sm font-medium text-gray-600 dark:text-gray-400 border-b-2 border-transparent data-[state=active]:border-primary-500 data-[state=active]:text-primary-600 dark:data-[state=active]:text-primary-400 transition-colors"
                        >
                            <div className="flex items-center gap-2">
                                <MessageSquare className="w-4 h-4" />
                                Notas
                            </div>
                        </Tabs.Trigger>
                    </Tabs.List>

                    <Tabs.Content value="progress" className="mt-6">
                        <ProgressTab weightHistory={weightHistory} activeGoal={activeGoal} />
                    </Tabs.Content>

                    <Tabs.Content value="routines" className="mt-6">
                        <RoutinesTab clientId={id} />
                    </Tabs.Content>

                    <Tabs.Content value="diet" className="mt-6">
                        <DietTab recentLogs={recentLogs} />
                    </Tabs.Content>

                    <Tabs.Content value="checkins" className="mt-6">
                        <CheckInsTab clientId={id} />
                    </Tabs.Content>

                    <Tabs.Content value="notes" className="mt-6">
                        <NotesTab clientId={id} />
                    </Tabs.Content>
                </Tabs.Root>
            </PageContainer>
        </AppLayout>
    );
};

const ProgressTab = ({ weightHistory, activeGoal }) => {
    if (weightHistory.length === 0) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center border border-gray-200 dark:border-gray-700">
                <p className="text-gray-500 dark:text-gray-400">No hay datos de peso registrados</p>
            </div>
        );
    }

    const weights = weightHistory.map(w => parseFloat(w.weight));
    const minWeight = Math.min(...weights);
    const maxWeight = Math.max(...weights);
    const currentWeight = weights[weights.length - 1];
    const firstWeight = weights[0];
    const totalChange = currentWeight - firstWeight;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Peso Actual</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{currentWeight} kg</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Cambio Total</p>
                    <p className={`text-3xl font-bold ${totalChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {totalChange >= 0 ? '+' : ''}{totalChange.toFixed(1)} kg
                    </p>
                </div>
                {activeGoal && (
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Objetivo</p>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white">
                            {parseFloat(activeGoal.target_weight)} kg
                        </p>
                    </div>
                )}
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Historial de Peso</h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                    {weightHistory.map((entry, index) => (
                        <div
                            key={index}
                            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                        >
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                                {new Date(entry.date).toLocaleDateString()}
                            </span>
                            <span className="font-semibold text-gray-900 dark:text-white">
                                {parseFloat(entry.weight)} kg
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const RoutinesTab = ({ clientId }) => {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center border border-gray-200 dark:border-gray-700">
            <p className="text-gray-500 dark:text-gray-400">
                Las rutinas asignadas se mostrarán aquí (Sprint 3)
            </p>
        </div>
    );
};

const DietTab = ({ recentLogs }) => {
    const logsWithMeals = recentLogs.filter(log => log.meals && log.meals.length > 0);

    if (logsWithMeals.length === 0) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center border border-gray-200 dark:border-gray-700">
                <p className="text-gray-500 dark:text-gray-400">No hay registros de dieta</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {logsWithMeals.slice(0, 10).map((log) => (
                <div
                    key={log.log_id}
                    className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"
                >
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
                        {new Date(log.date).toLocaleDateString()}
                    </h4>
                    <div className="space-y-2">
                        {log.meals.map((meal) => (
                            <div
                                key={meal.meal_item_id}
                                className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded"
                            >
                                <span className="text-sm text-gray-600 dark:text-gray-400">{meal.meal_type}</span>
                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                    {parseFloat(meal.consumed_calories).toFixed(0)} kcal
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

const CheckInsTab = ({ clientId }) => {
    const [checkIns, setCheckIns] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadCheckIns();
    }, [clientId]);

    const loadCheckIns = async () => {
        try {
            const response = await api.get(`/checkin/client/${clientId}`);
            setCheckIns(response.data.checkIns || []);
        } catch (error) {
            logger.error('Error cargando check-ins:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-4 border-gray-300 dark:border-gray-700 border-t-primary-500 rounded-full animate-spin"></div>
            </div>
        );
    }

    if (checkIns.length === 0) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center border border-gray-200 dark:border-gray-700">
                <p className="text-gray-500 dark:text-gray-400">No hay check-ins registrados</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {checkIns.map((checkIn) => (
                <div
                    key={checkIn.check_in_id}
                    className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"
                >
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
                        Semana del {new Date(checkIn.week_of).toLocaleDateString()}
                    </h4>
                    {checkIn.weight && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            Peso: <span className="font-semibold">{parseFloat(checkIn.weight)} kg</span>
                        </p>
                    )}
                    {checkIn.feeling && (
                        <div className="flex items-center gap-2 mb-4">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Sentimiento:</span>
                            <div className="flex gap-1">
                                {[1, 2, 3, 4, 5].map((num) => (
                                    <svg
                                        key={num}
                                        className={`w-4 h-4 ${num <= checkIn.feeling ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                    >
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                ))}
                            </div>
                        </div>
                    )}
                    {(checkIn.photo_front || checkIn.photo_side || checkIn.photo_back) && (
                        <div className="grid grid-cols-3 gap-2 mt-4">
                            {checkIn.photo_front && (
                                <img src={checkIn.photo_front} alt="Frontal" className="w-full h-24 object-cover rounded" />
                            )}
                            {checkIn.photo_side && (
                                <img src={checkIn.photo_side} alt="Lateral" className="w-full h-24 object-cover rounded" />
                            )}
                            {checkIn.photo_back && (
                                <img src={checkIn.photo_back} alt="Trasera" className="w-full h-24 object-cover rounded" />
                            )}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

const NotesTab = ({ clientId }) => {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center border border-gray-200 dark:border-gray-700">
            <p className="text-gray-500 dark:text-gray-400">
                Las notas y mensajes se mostrarán aquí (Sprint 5)
            </p>
        </div>
    );
};

export default CoachClientDetail;

