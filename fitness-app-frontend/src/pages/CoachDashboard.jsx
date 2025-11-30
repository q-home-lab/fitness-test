import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import ModernNavbar from '../components/ModernNavbar';
import InviteClientModal from '../components/InviteClientModal';
import { Users, AlertCircle, TrendingUp, Target, Calendar, UserPlus, FileText } from 'lucide-react';

const CoachDashboard = () => {
    const navigate = useNavigate();
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [viewMode, setViewMode] = useState('carousel'); // 'carousel' or 'table'
    const [filter, setFilter] = useState('all'); // 'all', 'active', 'inactive'
    const [inviteModalOpen, setInviteModalOpen] = useState(false);

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
        console.log('[CoachDashboard] Renderizado:', {
            clientsCount: clients.length,
            loading,
            error,
            location: window.location.pathname
        });
    }, [clients.length, loading, error]);

    if (loading) {
        return (
            <>
                <ModernNavbar />
                <div className="flex items-center justify-center h-screen pt-24">
                    <div className="w-8 h-8 border-4 border-gray-300 dark:border-gray-700 border-t-primary-500 rounded-full animate-spin"></div>
                </div>
            </>
        );
    }

    if (error) {
        return (
            <>
                <ModernNavbar />
                <div className="min-h-screen bg-background dark:bg-gray-900 p-6 pt-24">
                    <div className="max-w-7xl mx-auto">
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                            <p className="text-red-600 dark:text-red-300">{error}</p>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <ModernNavbar />
            <div className="min-h-screen bg-background dark:bg-gray-900 p-6 pt-24">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="mb-8 flex items-center justify-between">
                        <div>
                            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                                Dashboard del Entrenador
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400">
                                Gestiona y supervisa el progreso de tus clientes
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => navigate('/coach/templates')}
                                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            >
                                <FileText className="w-5 h-5" />
                                Mis Plantillas
                            </button>
                        </div>
                    </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Total Clientes</p>
                                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                                    {clients.length}
                                </p>
                            </div>
                            <Users className="w-10 h-10 text-primary-500" />
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Activos</p>
                                <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-1">
                                    {activeClients}
                                </p>
                            </div>
                            <TrendingUp className="w-10 h-10 text-green-500" />
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Necesitan Atención</p>
                                <p className="text-3xl font-bold text-red-600 dark:text-red-400 mt-1">
                                    {inactiveClients}
                                </p>
                            </div>
                            <AlertCircle className="w-10 h-10 text-red-500" />
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Promedio Cumplimiento</p>
                                <p className="text-3xl font-bold text-secondary-600 dark:text-secondary-400 mt-1">
                                    {clients.length > 0
                                        ? Math.round(clients.reduce((sum, c) => sum + c.completionRate, 0) / clients.length)
                                        : 0}%
                                </p>
                            </div>
                            <Target className="w-10 h-10 text-secondary-500" />
                        </div>
                    </div>
                </div>

                {/* Banner de Alertas */}
                {inactiveClients > 0 && (
                    <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded-lg p-4 mb-6">
                        <div className="flex items-center gap-3">
                            <AlertCircle className="w-6 h-6 text-red-500" />
                            <div>
                                <h3 className="font-semibold text-red-800 dark:text-red-200">
                                    {inactiveClients} cliente{inactiveClients > 1 ? 's' : ''} necesita{inactiveClients > 1 ? 'n' : ''} atención
                                </h3>
                                <p className="text-sm text-red-600 dark:text-red-300">
                                    {inactiveClients > 1 ? 'Tienen' : 'Tiene'} más de 4 días sin actividad
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Empty State con botón de invitar */}
                {clients.length === 0 && !loading && (
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center mb-6">
                        <Users className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                            Aún no tienes clientes
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            Comienza invitando a tus primeros clientes para gestionar su progreso
                        </p>
                        <button
                            onClick={() => setInviteModalOpen(true)}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-medium"
                        >
                            <UserPlus className="w-5 h-5" />
                            Invitar Primer Cliente
                        </button>
                    </div>
                )}

                {/* View Mode Toggle */}
                {clients.length > 0 && (
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex gap-2">
                        <button
                            onClick={() => setFilter('all')}
                            className={`px-4 py-2 rounded-lg transition-colors ${
                                filter === 'all'
                                    ? 'bg-primary-500 text-white'
                                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700'
                            }`}
                        >
                            Todos ({clients.length})
                        </button>
                        <button
                            onClick={() => setFilter('active')}
                            className={`px-4 py-2 rounded-lg transition-colors ${
                                filter === 'active'
                                    ? 'bg-green-500 text-white'
                                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700'
                            }`}
                        >
                            Activos ({activeClients})
                        </button>
                        <button
                            onClick={() => setFilter('inactive')}
                            className={`px-4 py-2 rounded-lg transition-colors ${
                                filter === 'inactive'
                                    ? 'bg-red-500 text-white'
                                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700'
                            }`}
                        >
                            Inactivos ({inactiveClients})
                        </button>
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={() => setViewMode('carousel')}
                            className={`p-2 rounded-lg transition-colors ${
                                viewMode === 'carousel'
                                    ? 'bg-primary-500 text-white'
                                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700'
                            }`}
                        >
                            <Users className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => setViewMode('table')}
                            className={`p-2 rounded-lg transition-colors ${
                                viewMode === 'table'
                                    ? 'bg-primary-500 text-white'
                                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700'
                            }`}
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
                                <div className="w-full text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                                    <p className="text-gray-500 dark:text-gray-400">No hay clientes para mostrar</p>
                                </div>
                            ) : (
                                filteredClients.map((client) => (
                                    <ClientCard
                                        key={client.id}
                                        client={client}
                                        onClick={() => navigate(`/coach/client/${client.id}`)}
                                    />
                                ))
                            )}
                        </div>
                    </div>
                ) : (
                    <ClientTable clients={filteredClients} onClientClick={(id) => navigate(`/coach/client/${id}`)} />
                )}
                </div>
            </div>
            <InviteClientModal open={inviteModalOpen} onOpenChange={setInviteModalOpen} />
        </>
    );
};

const ClientCard = ({ client, onClick }) => {
    const getInitials = (email) => {
        return email.charAt(0).toUpperCase();
    };

    return (
        <div
            onClick={onClick}
            className={`min-w-[300px] bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border-2 cursor-pointer transition-all hover:shadow-lg ${
                client.needsAttention
                    ? 'border-red-300 dark:border-red-700'
                    : 'border-gray-200 dark:border-gray-700 hover:border-primary-500'
            }`}
        >
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white font-bold text-lg">
                        {getInitials(client.email)}
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white truncate max-w-[200px]">
                            {client.email}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            {client.daysSinceActivity === 0
                                ? 'Activo hoy'
                                : `${client.daysSinceActivity} día${client.daysSinceActivity > 1 ? 's' : ''} sin actividad`}
                        </p>
                    </div>
                </div>
                {client.needsAttention && (
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                )}
            </div>

            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Peso Actual</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                        {client.currentWeight ? `${client.currentWeight} kg` : 'N/A'}
                    </span>
                </div>

                {client.targetWeight && (
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Objetivo</span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                            {client.targetWeight} kg
                        </span>
                    </div>
                )}

                <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Cumplimiento</span>
                    <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-primary-500 transition-all"
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
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900">
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

