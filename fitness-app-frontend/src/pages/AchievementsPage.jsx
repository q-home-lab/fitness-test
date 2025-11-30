import React, { useState, useEffect } from 'react';
import Icon from '../components/Icons';
import ModernNavbar from '../components/ModernNavbar';
import BottomNavigation from '../components/BottomNavigation';
import api from '../services/api';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const AchievementsPage = () => {
    const [allAchievements, setAllAchievements] = useState([]);
    // const [userAchievements, setUserAchievements] = useState([]); // Reservado para uso futuro
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // 'all', 'unlocked', 'locked'

    useEffect(() => {
        fetchAchievements();
    }, []);

    const fetchAchievements = async () => {
        try {
            setLoading(true);
            const response = await api.get('/achievements/user');
            setAllAchievements(response.data.allAchievements || []);
            // setUserAchievements(response.data.userAchievements || []); // Reservado para uso futuro
        } catch (error) {
            console.error('Error al cargar logros:', error);
        } finally {
            setLoading(false);
        }
    };

    const getRarityColor = (rarity) => {
        switch (rarity) {
            case 'legendary': return 'from-yellow-400 to-orange-500 border-yellow-300 dark:border-yellow-600';
            case 'epic': return 'from-purple-400 to-pink-500 border-purple-300 dark:border-purple-600';
            case 'rare': return 'from-blue-400 to-cyan-500 border-blue-300 dark:border-blue-600';
            default: return 'from-gray-400 to-gray-500 border-gray-300 dark:border-gray-600';
        }
    };

    const getRarityLabel = (rarity) => {
        switch (rarity) {
            case 'legendary': return 'Legendario';
            case 'epic': return 'Épico';
            case 'rare': return 'Raro';
            default: return 'Común';
        }
    };

    const filteredAchievements = allAchievements.filter(ach => {
        if (filter === 'unlocked') return ach.unlocked;
        if (filter === 'locked') return !ach.unlocked;
        return true;
    });

    const unlockedCount = allAchievements.filter(a => a.unlocked).length;
    const totalCount = allAchievements.length;
    const progress = totalCount > 0 ? (unlockedCount / totalCount) * 100 : 0;

    if (loading) {
        return (
            <>
                <ModernNavbar />
                <main className="min-h-screen bg-[#FAF3E1] dark:bg-black pb-24 md:pb-8 transition-colors duration-300">
                    <div className="max-w-7xl mx-auto px-6 py-8">
                        <div className="flex justify-center py-20">
                            <div className="w-8 h-8 border-2 border-blue-600 dark:border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    </div>
                </main>
                <BottomNavigation />
            </>
        );
    }

    return (
        <>
            <ModernNavbar />
            <main className="min-h-screen bg-[#FAF3E1] dark:bg-black pb-24 md:pb-8 transition-colors duration-300">
                <div className="max-w-7xl mx-auto px-6 py-8">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-4xl md:text-5xl font-semibold text-gray-900 dark:text-white mb-2 tracking-tight">
                            Logros
                        </h1>
                        <p className="text-lg text-gray-600 dark:text-gray-400">
                            Tus conquistas y metas alcanzadas
                        </p>
                    </div>

                    {/* Progreso General */}
                    <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-6 mb-6 shadow-sm transition-colors duration-300">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                                Progreso Total
                            </h2>
                            <span className="text-2xl font-bold text-gray-900 dark:text-white">
                                {unlockedCount} / {totalCount}
                            </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
                            <div
                                className="bg-gradient-to-r from-blue-600 to-purple-600 h-4 rounded-full transition-all duration-500"
                                style={{ width: `${progress}%` }}
                            ></div>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                            {progress.toFixed(0)}% de logros desbloqueados
                        </p>
                    </div>

                    {/* Filtros */}
                    <div className="flex gap-2 mb-6">
                        <button
                            onClick={() => setFilter('all')}
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                                filter === 'all'
                                    ? 'bg-blue-600 dark:bg-blue-500 text-white'
                                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700'
                            }`}
                        >
                            Todos ({totalCount})
                        </button>
                        <button
                            onClick={() => setFilter('unlocked')}
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                                filter === 'unlocked'
                                    ? 'bg-green-600 dark:bg-green-500 text-white'
                                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700'
                            }`}
                        >
                            Desbloqueados ({unlockedCount})
                        </button>
                        <button
                            onClick={() => setFilter('locked')}
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                                filter === 'locked'
                                    ? 'bg-gray-600 dark:bg-gray-500 text-white'
                                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700'
                            }`}
                        >
                            Bloqueados ({totalCount - unlockedCount})
                        </button>
                    </div>

                    {/* Grid de Logros */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filteredAchievements.map((achievement) => (
                            <div
                                key={achievement.achievement_id}
                                className={`bg-white dark:bg-gray-900 rounded-3xl border-2 p-6 transition-all duration-300 ${
                                    achievement.unlocked
                                        ? `border-gradient-to-r ${getRarityColor(achievement.rarity)} shadow-lg`
                                        : 'border-gray-200 dark:border-gray-800 opacity-60'
                                }`}
                            >
                                <div className="text-center">
                                    <div className={`w-20 h-20 mx-auto mb-4 rounded-2xl flex items-center justify-center text-4xl ${
                                        achievement.unlocked
                                            ? `bg-gradient-to-br ${getRarityColor(achievement.rarity)}`
                                            : 'bg-gray-200 dark:bg-gray-800'
                                    }`}>
                                        {achievement.icon ? (
                                            <span className="text-2xl">{achievement.icon}</span>
                                        ) : (
                                            <Icon name="achievement" className="w-8 h-8 text-gray-700 dark:text-gray-300" />
                                        )}
                                    </div>
                                    
                                    <h3 className={`font-bold text-lg mb-2 ${
                                        achievement.unlocked
                                            ? 'text-gray-900 dark:text-white'
                                            : 'text-gray-500 dark:text-gray-500'
                                    }`}>
                                        {achievement.name}
                                    </h3>
                                    
                                    <p className={`text-sm mb-3 ${
                                        achievement.unlocked
                                            ? 'text-gray-600 dark:text-gray-400'
                                            : 'text-gray-400 dark:text-gray-600'
                                    }`}>
                                        {achievement.description}
                                    </p>

                                    <div className="flex items-center justify-center gap-2 mb-2">
                                        <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                                            achievement.rarity === 'legendary'
                                                ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                                            : achievement.rarity === 'epic'
                                                ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                                            : achievement.rarity === 'rare'
                                                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                                            : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                                        }`}>
                                            {getRarityLabel(achievement.rarity)}
                                        </span>
                                    </div>

                                    {achievement.unlocked && achievement.unlocked_at && (
                                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                                            Desbloqueado: {format(new Date(achievement.unlocked_at), 'dd MMM yyyy', { locale: es })}
                                        </p>
                                    )}

                                    {!achievement.unlocked && (
                                        <div className="mt-2">
                                            <div className="w-6 h-6 mx-auto rounded-full border-2 border-gray-300 dark:border-gray-600 flex items-center justify-center">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                                </svg>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {filteredAchievements.length === 0 && (
                        <div className="text-center py-12">
                            <div className="text-6xl mb-4">🔒</div>
                            <p className="text-gray-600 dark:text-gray-400">
                                No hay logros en esta categoría
                            </p>
                        </div>
                    )}
                </div>
            </main>
            <BottomNavigation />
        </>
    );
};

export default AchievementsPage;

