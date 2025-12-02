import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Flame } from 'lucide-react';
import logger from '../utils/logger';

const StreakBadge = () => {
    const [streak, setStreak] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStreak();
    }, []);

    const loadStreak = async () => {
        try {
            const response = await api.get('/profile/streak');
            setStreak(response.data.streak || 0);
        } catch (error) {
            logger.error('Error cargando streak:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading || streak === 0) return null;

    return (
        <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg shadow-lg">
            <Flame className="w-5 h-5 fill-current" />
            <span className="font-bold text-sm">{streak}</span>
            <span className="text-xs">días</span>
        </div>
    );
};

export default StreakBadge;

