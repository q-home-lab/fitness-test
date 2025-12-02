import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { AppLayout } from '@/app/layout/AppLayout';
import { PageContainer } from '@/shared/components/layout/PageContainer';
import InviteClientModal from '../components/InviteClientModal';
import AssignTemplateModal from '../components/AssignTemplateModal';
import { Users, AlertCircle, TrendingUp, Target, Calendar, UserPlus, FileText, Dumbbell, Utensils, Eye } from 'lucide-react';
import useToastStore from '../stores/useToastStore';
import logger from '@/utils/logger';

const CoachDashboard = () => {
    const navigate = useNavigate();
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [viewMode, setViewMode] = useState('carousel'); // 'carousel' or 'table'
    const [filter, setFilter] = useState('all'); // 'all', 'active', 'inactive'
    const [inviteModalOpen, setInviteModalOpen] = useState(false);
    const [assignModalOpen, setAssignModalOpen] = useState(false);
    const [selectedClient, setSelectedClient] = useState(null);
    const [assignType, setAssignType] = useState('routine'); // 'routine' or 'diet'
    const toast = useToastStore();

    useEffect(() => {
        loadClients();
    }, []);

    const loadClients = async () => {
        try {
            setLoading(true);
            const response = await api.get('/coach/clients');
            setClients(response.data.clients || []);
        } catch (err) {
            setError(err.response?.data?.error || 'Error al cargar clientes');
        } finally {
            setLoading(false);
        }
    };

    const filteredClients = clients.filter(client => {
        if (filter === 'active') return !client.needsAttention;
        if (filter === 'inactive') return client.needsAttention;
        return true;
    });

    const activeClients = clients.filter(c => !c.needsAttention).length;
    const inactiveClients = clients.filter(c => c.needsAttention).length;

    // Debug: Verificar que el componente se renderiza
    useEffect(() => {
        logger.info('[CoachDashboard] Renderizado:', {
            clientsCount: clients.length,
            loading,
            error,
            location: window.location.pathname
        });
    }, [clients.length, loading, error]);

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

    if (error) {
        return (
            <AppLayout>
                <PageContainer>
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                        <p className="text-red-600 dark:text-red-300">{error}</p>
                    </div>
                </PageContainer>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <PageContainer>
                    {/* Header */}
                    <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h1 className="text-4xl md:text-5xl font-light tracking-tight text-gray-900 dark:text-white mb-2">
                                Dashboard del Entrenador
                            </h1>
                            <p className="text-lg text-gray-600 dark:text-gray-400 font-light">
                                Gestiona y supervisa el progreso de tus clientes
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            <button
                                onClick={() => setInviteModalOpen(true)}
                                className="flex items-center gap-2 px-4 py-2.5 backdrop-blur-xl bg-blue-600 dark:bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-700 dark:hover:bg-blue-600 transition-all shadow-lg hover:shadow-xl active:scale-95"
                            >
                                <UserPlus className="w-5 h-5" />
                                Invitar Cliente
                            </button>
                            <button
                                onClick={() => navigate('/coach/templates')}
                                className="flex items-center gap-2 px-4 py-2.5 backdrop-blur-xl bg-white/60 dark:bg-black/60 text-gray-900 dark:text-white rounded-xl border border-gray-200/50 dark:border-gray-800/50 font-medium hover:bg-white/80 dark:hover:bg-black/80 hover:border-gray-300/50 dark:hover:border-gray-700/50 transition-all shadow-sm hover:shadow-md active:scale-95"
                            >
                                <FileText className="w-5 h-5" />
                                Mis Plantillas
                            </button>
                        </div>
                    </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <div className="backdrop-blur-xl bg-white/60 dark:bg-black/60 rounded-3xl p-6 border border-gray-200/50 dark:border-gray-800/50 shadow-sm hover:shadow-lg hover:border-gray-300/50 dark:hover:border-gray-700/50 transition-all duration-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400 font-medium mb-1">Total Clientes</p>
                                <p className="text-3xl font-light tracking-tight text-gray-900 dark:text-white">
                                    {clients.length}
                                </p>
                            </div>
                            <div className="w-12 h-12 backdrop-blur-sm bg-blue-100/60 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center border border-blue-200/50 dark:border-blue-800/50">
                                <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                            </div>
                        </div>
                    </div>

                    <div className="backdrop-blur-xl bg-white/60 dark:bg-black/60 rounded-3xl p-6 border border-gray-200/50 dark:border-gray-800/50 shadow-sm hover:shadow-lg hover:border-gray-300/50 dark:hover:border-gray-700/50 transition-all duration-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400 font-medium mb-1">Activos</p>
                                <p className="text-3xl font-light tracking-tight text-green-600 dark:text-green-400">
                                    {activeClients}
                                </p>
                            </div>
                            <div className="w-12 h-12 backdrop-blur-sm bg-green-100/60 dark:bg-green-900/30 rounded-2xl flex items-center justify-center border border-green-200/50 dark:border-green-800/50">
                                <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
                            </div>
                        </div>
                    </div>

                    <div className="backdrop-blur-xl bg-white/60 dark:bg-black/60 rounded-3xl p-6 border border-gray-200/50 dark:border-gray-800/50 shadow-sm hover:shadow-lg hover:border-gray-300/50 dark:hover:border-gray-700/50 transition-all duration-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400 font-medium mb-1">Necesitan Atención</p>
                                <p className="text-3xl font-light tracking-tight text-red-600 dark:text-red-400">
                                    {inactiveClients}
                                </p>
                            </div>
                            <div className="w-12 h-12 backdrop-blur-sm bg-red-100/60 dark:bg-red-900/30 rounded-2xl flex items-center justify-center border border-red-200/50 dark:border-red-800/50">
                                <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                            </div>
                        </div>
                    </div>

                    <div className="backdrop-blur-xl bg-white/60 dark:bg-black/60 rounded-3xl p-6 border border-gray-200/50 dark:border-gray-800/50 shadow-sm hover:shadow-lg hover:border-gray-300/50 dark:hover:border-gray-700/50 transition-all duration-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400 font-medium mb-1">Promedio Cumplimiento</p>
                                <p className="text-3xl font-light tracking-tight text-purple-600 dark:text-purple-400">
                                    {clients.length > 0
                                        ? Math.round(clients.reduce((sum, c) => sum + c.completionRate, 0) / clients.length)
                                        : 0}%
                                </p>
                            </div>
                            <div className="w-12 h-12 backdrop-blur-sm bg-purple-100/60 dark:bg-purple-900/30 rounded-2xl flex items-center justify-center border border-purple-200/50 dark:border-purple-800/50">
                                <Target className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Banner de Alertas */}
                {inactiveClients > 0 && (
                    <div className="backdrop-blur-xl bg-red-50/60 dark:bg-red-900/20 border-l-4 border-red-500/50 dark:border-red-500 rounded-3xl p-6 mb-6 shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 backdrop-blur-sm bg-red-100/60 dark:bg-red-900/30 rounded-2xl flex items-center justify-center border border-red-200/50 dark:border-red-800/50">
                                <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-red-900 dark:text-red-200 text-lg">
                                    {inactiveClients} cliente{inactiveClients > 1 ? 's' : ''} necesita{inactiveClients > 1 ? 'n' : ''} atención
                                </h3>
                                <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                                    {inactiveClients > 1 ? 'Tienen' : 'Tiene'} más de 4 días sin actividad
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Empty State con botón de invitar */}
                {clients.length === 0 && !loading && (
                    <div className="backdrop-blur-xl bg-white/60 dark:bg-black/60 rounded-3xl border border-gray-200/50 dark:border-gray-800/50 p-12 text-center shadow-sm">
                        <div className="w-20 h-20 backdrop-blur-sm bg-gray-100/60 dark:bg-gray-800/60 rounded-full flex items-center justify-center mx-auto mb-6 border border-gray-200/50 dark:border-gray-700/50">
                            <Users className="w-10 h-10 text-gray-400 dark:text-gray-600" />
                        </div>
                        <h3 className="text-2xl font-light tracking-tight text-gray-900 dark:text-white mb-2">
                            Aún no tienes clientes
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-8 font-light">
                            Comienza invitando a tus primeros clientes para gestionar su progreso
                        </p>
                        <button
                            onClick={() => setInviteModalOpen(true)}
                            className="inline-flex items-center gap-2 px-6 py-3.5 backdrop-blur-xl bg-blue-600 dark:bg-blue-500 text-white rounded-xl hover:bg-blue-700 dark:hover:bg-blue-600 transition-all font-medium shadow-lg hover:shadow-xl active:scale-95"
                        >
                            <UserPlus className="w-5 h-5" />
                            Invitar Primer Cliente
                        </button>
                    </div>
                )}

                {/* View Mode Toggle */}
                {clients.length > 0 && (
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => setFilter('all')}
                                className={`px-4 py-2.5 rounded-xl font-medium transition-all ${
                                    filter === 'all'
                                        ? 'backdrop-blur-xl bg-blue-600 dark:bg-blue-500 text-white shadow-lg'
                                        : 'backdrop-blur-xl bg-white/60 dark:bg-black/60 text-gray-700 dark:text-gray-300 border border-gray-200/50 dark:border-gray-800/50 hover:bg-white/80 dark:hover:bg-black/80 shadow-sm hover:shadow-md'
                                }`}
                            >
                                Todos ({clients.length})
                            </button>
                            <button
                                onClick={() => setFilter('active')}
                                className={`px-4 py-2.5 rounded-xl font-medium transition-all ${
                                    filter === 'active'
                                        ? 'backdrop-blur-xl bg-green-600 dark:bg-green-500 text-white shadow-lg'
                                        : 'backdrop-blur-xl bg-white/60 dark:bg-black/60 text-gray-700 dark:text-gray-300 border border-gray-200/50 dark:border-gray-800/50 hover:bg-white/80 dark:hover:bg-black/80 shadow-sm hover:shadow-md'
                                }`}
                            >
                                Activos ({activeClients})
                            </button>
                            <button
                                onClick={() => setFilter('inactive')}
                                className={`px-4 py-2.5 rounded-xl font-medium transition-all ${
                                    filter === 'inactive'
                                        ? 'backdrop-blur-xl bg-red-600 dark:bg-red-500 text-white shadow-lg'
                                        : 'backdrop-blur-xl bg-white/60 dark:bg-black/60 text-gray-700 dark:text-gray-300 border border-gray-200/50 dark:border-gray-800/50 hover:bg-white/80 dark:hover:bg-black/80 shadow-sm hover:shadow-md'
                                }`}
                            >
                                Inactivos ({inactiveClients})
                            </button>
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={() => setViewMode('carousel')}
                                className={`p-2.5 rounded-xl transition-all ${
                                    viewMode === 'carousel'
                                        ? 'backdrop-blur-xl bg-blue-600 dark:bg-blue-500 text-white shadow-lg'
                                        : 'backdrop-blur-xl bg-white/60 dark:bg-black/60 text-gray-700 dark:text-gray-300 border border-gray-200/50 dark:border-gray-800/50 hover:bg-white/80 dark:hover:bg-black/80 shadow-sm hover:shadow-md'
                                }`}
                                title="Vista de tarjetas"
                            >
                                <Users className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => setViewMode('table')}
                                className={`p-2.5 rounded-xl transition-all ${
                                    viewMode === 'table'
                                        ? 'backdrop-blur-xl bg-blue-600 dark:bg-blue-500 text-white shadow-lg'
                                        : 'backdrop-blur-xl bg-white/60 dark:bg-black/60 text-gray-700 dark:text-gray-300 border border-gray-200/50 dark:border-gray-800/50 hover:bg-white/80 dark:hover:bg-black/80 shadow-sm hover:shadow-md'
                                }`}
                                title="Vista de tabla"
                            >
                                <Calendar className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                )}

                {/* Content */}
                {viewMode === 'carousel' ? (
                    <div className="overflow-x-auto pb-4">
                        <div className="flex gap-4 min-w-max">
                            {filteredClients.length === 0 ? (
                                <div className="w-full text-center py-12 backdrop-blur-xl bg-white/60 dark:bg-black/60 rounded-3xl border border-gray-200/50 dark:border-gray-800/50 shadow-sm">
                                    <p className="text-gray-600 dark:text-gray-400">No hay clientes para mostrar</p>
                                </div>
                            ) : (
                                filteredClients.map((client) => (
                                    <ClientCard
                                        key={client.id}
                                        client={client}
                                        navigate={navigate}
                                        onClick={() => navigate(`/coach/client/${client.id}`)}
                                        onAssignRoutine={(client) => {
                                            setSelectedClient(client);
                                            setAssignType('routine');
                                            setAssignModalOpen(true);
                                        }}
                                        onAssignDiet={(client) => {
                                            setSelectedClient(client);
                                            setAssignType('diet');
                                            setAssignModalOpen(true);
                                        }}
                                    />
                                ))
                            )}
                        </div>
                    </div>
                ) : (
                    <ClientTable clients={filteredClients} onClientClick={(id) => navigate(`/coach/client/${id}`)} />
                )}
                <InviteClientModal 
                    open={inviteModalOpen} 
                    onOpenChange={setInviteModalOpen}
                    onSuccess={loadClients}
                />
                {selectedClient && (
                    <AssignTemplateModal
                        open={assignModalOpen}
                        onOpenChange={setAssignModalOpen}
                        clientId={selectedClient.id}
                        clientEmail={selectedClient.email}
                        type={assignType}
                        onSuccess={() => {
                            loadClients();
                            setSelectedClient(null);
                        }}
                    />
                )}
            </PageContainer>
        </AppLayout>
    );
};

const ClientCard = ({ client, onClick, navigate, onAssignRoutine, onAssignDiet }) => {
    const [showActions, setShowActions] = useState(false);

    const getInitials = (email) => {
        return email.charAt(0).toUpperCase();
    };

    const handleAssignRoutine = (e) => {
        e.stopPropagation();
        if (onAssignRoutine) {
            onAssignRoutine(client);
        }
    };

    const handleAssignDiet = (e) => {
        e.stopPropagation();
        if (onAssignDiet) {
            onAssignDiet(client);
        }
    };

    return (
        <div
            className={`min-w-[320px] backdrop-blur-xl bg-white/60 dark:bg-black/60 rounded-3xl p-6 border-2 transition-all duration-500 hover:shadow-xl hover:scale-[1.02] ${
                client.needsAttention
                    ? 'border-red-300/50 dark:border-red-700/50'
                    : 'border-gray-200/50 dark:border-gray-800/50 hover:border-blue-500/50 dark:hover:border-blue-400/50'
            }`}
            onMouseEnter={() => setShowActions(true)}
            onMouseLeave={() => setShowActions(false)}
        >
            <div className="flex items-start justify-between mb-4">
                <div 
                    className="flex items-center gap-3 flex-1 cursor-pointer"
                    onClick={onClick}
                >
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-pink-500 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-blue-600/20">
                        {getInitials(client.email)}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                            {client.email}
                        </h3>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                            {client.daysSinceActivity === 0
                                ? 'Activo hoy'
                                : `${client.daysSinceActivity} día${client.daysSinceActivity > 1 ? 's' : ''} sin actividad`}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {client.needsAttention && (
                        <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                    )}
                    {showActions && (
                        <div className="flex gap-1">
                            <button
                                onClick={handleAssignRoutine}
                                className="p-1.5 backdrop-blur-sm bg-blue-100/60 dark:bg-blue-900/30 rounded-lg border border-blue-200/50 dark:border-blue-800/50 hover:bg-blue-200/60 dark:hover:bg-blue-800/40 transition-all text-blue-600 dark:text-blue-400"
                                title="Asignar rutina"
                            >
                                <Dumbbell className="w-4 h-4" />
                            </button>
                            <button
                                onClick={handleAssignDiet}
                                className="p-1.5 backdrop-blur-sm bg-green-100/60 dark:bg-green-900/30 rounded-lg border border-green-200/50 dark:border-green-800/50 hover:bg-green-200/60 dark:hover:bg-green-800/40 transition-all text-green-600 dark:text-green-400"
                                title="Asignar dieta"
                            >
                                <Utensils className="w-4 h-4" />
                            </button>
                            <button
                                onClick={onClick}
                                className="p-1.5 backdrop-blur-sm bg-gray-100/60 dark:bg-gray-800/60 rounded-lg border border-gray-200/50 dark:border-gray-800/50 hover:bg-gray-200/60 dark:hover:bg-gray-700/60 transition-all text-gray-600 dark:text-gray-400"
                                title="Ver detalles"
                            >
                                <Eye className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="space-y-3 pt-2 border-t border-gray-200/50 dark:border-gray-800/50">
                <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">Peso Actual</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                        {client.currentWeight ? `${client.currentWeight} kg` : 'N/A'}
                    </span>
                </div>

                {client.targetWeight && (
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">Objetivo</span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                            {client.targetWeight} kg
                        </span>
                    </div>
                )}

                <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">Cumplimiento</span>
                    <div className="flex items-center gap-2">
                        <div className="w-24 h-2 backdrop-blur-sm bg-gray-200/60 dark:bg-gray-700/60 rounded-full overflow-hidden border border-gray-300/50 dark:border-gray-600/50">
                            <div
                                className="h-full bg-gradient-to-r from-blue-500 to-pink-500 transition-all"
                                style={{ width: `${client.completionRate}%` }}
                            />
                        </div>
                        <span className="text-sm font-semibold text-gray-900 dark:text-white w-10 text-right">
                            {client.completionRate}%
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ClientTable = ({ clients, onClientClick }) => {
    const [sortBy, setSortBy] = useState('name');
    const [sortOrder, setSortOrder] = useState('asc');

    const sortedClients = [...clients].sort((a, b) => {
        let aVal, bVal;
        switch (sortBy) {
            case 'name':
                aVal = a.email;
                bVal = b.email;
                break;
            case 'weight':
                aVal = a.currentWeight || 0;
                bVal = b.currentWeight || 0;
                break;
            case 'completion':
                aVal = a.completionRate;
                bVal = b.completionRate;
                break;
            case 'activity':
                aVal = a.daysSinceActivity;
                bVal = b.daysSinceActivity;
                break;
            default:
                return 0;
        }

        if (sortOrder === 'asc') {
            return aVal > bVal ? 1 : -1;
        } else {
            return aVal < bVal ? 1 : -1;
        }
    });

    const handleSort = (column) => {
        if (sortBy === column) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(column);
            setSortOrder('asc');
        }
    };

    return (
        <div className="backdrop-blur-xl bg-white/60 dark:bg-black/60 rounded-3xl shadow-sm border border-gray-200/50 dark:border-gray-800/50 overflow-hidden">
            <table className="w-full">
                <thead className="backdrop-blur-sm bg-gray-100/60 dark:bg-gray-900/60 border-b border-gray-200/50 dark:border-gray-800/50">
                    <tr>
                        <th
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                            onClick={() => handleSort('name')}
                        >
                            Cliente
                            {sortBy === 'name' && (sortOrder === 'asc' ? ' ↑' : ' ↓')}
                        </th>
                        <th
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                            onClick={() => handleSort('weight')}
                        >
                            Peso Actual
                            {sortBy === 'weight' && (sortOrder === 'asc' ? ' ↑' : ' ↓')}
                        </th>
                        <th
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                            onClick={() => handleSort('completion')}
                        >
                            Cumplimiento
                            {sortBy === 'completion' && (sortOrder === 'asc' ? ' ↑' : ' ↓')}
                        </th>
                        <th
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                            onClick={() => handleSort('activity')}
                        >
                            Última Actividad
                            {sortBy === 'activity' && (sortOrder === 'asc' ? ' ↑' : ' ↓')}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Estado
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {sortedClients.map((client) => (
                        <tr
                            key={client.id}
                            onClick={() => onClientClick(client.id)}
                            className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                        >
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white font-bold">
                                        {client.email.charAt(0).toUpperCase()}
                                    </div>
                                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                                        {client.email}
                                    </span>
                                </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                {client.currentWeight ? `${client.currentWeight} kg` : 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center gap-2">
                                    <div className="w-20 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-primary-500"
                                            style={{ width: `${client.completionRate}%` }}
                                        />
                                    </div>
                                    <span className="text-sm text-gray-900 dark:text-white w-10">
                                        {client.completionRate}%
                                    </span>
                                </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                {client.daysSinceActivity === 0
                                    ? 'Hoy'
                                    : `${client.daysSinceActivity} día${client.daysSinceActivity > 1 ? 's' : ''}`}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                {client.needsAttention ? (
                                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200">
                                        Inactivo
                                    </span>
                                ) : (
                                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200">
                                        Activo
                                    </span>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default CoachDashboard;

