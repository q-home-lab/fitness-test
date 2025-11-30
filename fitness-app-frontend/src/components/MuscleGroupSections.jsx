import React, { useState, useEffect } from 'react';
import api from '../services/api';
import OptimizedImage from './OptimizedImage';
import VirtualizedList from './VirtualizedList';

const MUSCLE_GROUPS = [
    { id: 'pecho', name: 'Pecho', icon: '💪', color: 'from-red-500/20 to-pink-500/20' },
    { id: 'pierna', name: 'Piernas', icon: '🦵', color: 'from-purple-500/20 to-indigo-500/20' },
    { id: 'espalda', name: 'Espalda', icon: '🏋️', color: 'from-blue-500/20 to-cyan-500/20' },
    { id: 'brazos', name: 'Brazos', icon: '💪', color: 'from-orange-500/20 to-yellow-500/20' },
    { id: 'hombros', name: 'Hombros', icon: '🤸', color: 'from-green-500/20 to-emerald-500/20' },
];

const MuscleGroupSections = ({ onExerciseSelect, selectedExercise = null }) => {
    const [expandedGroups, setExpandedGroups] = useState({});
    const [groupExercises, setGroupExercises] = useState({});
    const [loadingGroups, setLoadingGroups] = useState({});

    const toggleGroup = async (groupId) => {
        const isExpanded = expandedGroups[groupId];
        
        if (isExpanded) {
            // Colapsar
            setExpandedGroups(prev => ({ ...prev, [groupId]: false }));
        } else {
            // Expandir y cargar ejercicios si no están cargados
            setExpandedGroups(prev => ({ ...prev, [groupId]: true }));
            
            if (!groupExercises[groupId]) {
                await loadExercisesForGroup(groupId);
            }
        }
    };

    const loadExercisesForGroup = async (groupId) => {
        setLoadingGroups(prev => ({ ...prev, [groupId]: true }));
        
        try {
            const response = await api.get(`/exercises/by-muscle-group?group=${groupId}`);
            const exercises = response.data.exercises || [];
            
            // Agregar thumbnails si están disponibles
            const exercisesWithThumbnails = exercises.map(exercise => ({
                ...exercise,
                thumbnail: exercise.gif_url || exercise.video_url || null
            }));
            
            setGroupExercises(prev => ({
                ...prev,
                [groupId]: exercisesWithThumbnails
            }));
        } catch (error) {
            console.error(`Error al cargar ejercicios para ${groupId}:`, error);
            setGroupExercises(prev => ({
                ...prev,
                [groupId]: []
            }));
        } finally {
            setLoadingGroups(prev => ({ ...prev, [groupId]: false }));
        }
    };

    const handleExerciseClick = (exercise) => {
        if (onExerciseSelect) {
            onExerciseSelect(exercise);
        }
    };

    return (
        <div className="space-y-3">
            {MUSCLE_GROUPS.map((group) => {
                const isExpanded = expandedGroups[group.id];
                const exercises = groupExercises[group.id] || [];
                const isLoading = loadingGroups[group.id];

                return (
                    <div
                        key={group.id}
                        className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden transition-all duration-300 shadow-sm hover:shadow-md"
                    >
                        {/* Botón de grupo muscular */}
                        <button
                            type="button"
                            onClick={() => toggleGroup(group.id)}
                            className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${group.color} flex items-center justify-center text-xl border border-gray-200 dark:border-gray-700`}>
                                    {group.icon}
                                </div>
                                <div className="text-left">
                                    <div className="font-semibold text-gray-900 dark:text-white">
                                        {group.name}
                                    </div>
                                    {isExpanded && exercises.length > 0 && (
                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                            {exercises.length} ejercicio{exercises.length !== 1 ? 's' : ''}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {isLoading && (
                                    <div className="w-4 h-4 border-2 border-blue-600 dark:border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                                )}
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className={`h-5 w-5 text-gray-400 dark:text-gray-500 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </button>

                        {/* Lista de ejercicios (colapsable) */}
                        {isExpanded && (
                            <div className="border-t border-gray-200 dark:border-gray-800 max-h-96 overflow-hidden">
                                {isLoading ? (
                                    <div className="p-8 flex items-center justify-center">
                                        <div className="w-8 h-8 border-2 border-blue-600 dark:border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                                    </div>
                                ) : exercises.length > 0 ? (
                                    <VirtualizedList
                                        items={exercises}
                                        itemHeight={80}
                                        className="max-h-96"
                                        renderItem={(exercise) => (
                                            <button
                                                key={`${exercise.exercise_id || exercise.id}-${exercise.source || 'local'}`}
                                                type="button"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    handleExerciseClick(exercise);
                                                }}
                                                className={`w-full p-3 flex items-center gap-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border-b border-gray-200 dark:border-gray-800 last:border-b-0 ${
                                                    selectedExercise?.exercise_id === exercise.exercise_id || 
                                                    selectedExercise?.id === exercise.id
                                                        ? 'bg-blue-50 dark:bg-blue-900/20' 
                                                        : ''
                                                }`}
                                            >
                                                {/* Miniatura */}
                                                <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-blue-500/20 to-pink-500/20 dark:from-blue-600/30 dark:to-pink-600/30 flex-shrink-0 overflow-hidden relative border border-gray-200 dark:border-gray-700">
                                                    {exercise.thumbnail || exercise.gif_url || exercise.video_url ? (
                                                        <OptimizedImage
                                                            src={exercise.thumbnail || exercise.gif_url || exercise.video_url}
                                                            alt={exercise.name}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 dark:text-gray-400 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                            </svg>
                                                            <span className="text-[8px] font-semibold text-center px-1 leading-tight">
                                                                {exercise.name.substring(0, 8)}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                                
                                                {/* Info del ejercicio */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-semibold truncate text-gray-900 dark:text-white">
                                                        {exercise.name}
                                                    </div>
                                                    <div className="text-xs text-gray-600 dark:text-gray-400">
                                                        {exercise.category}
                                                    </div>
                                                </div>
                                            </button>
                                        )}
                                    />
                                ) : (
                                    <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                                        No se encontraron ejercicios para este grupo muscular
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default MuscleGroupSections;

