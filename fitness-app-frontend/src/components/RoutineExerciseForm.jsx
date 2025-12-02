import React, { useState, useEffect } from 'react';
import api from '../services/api';
import MuscleGroupSections from './MuscleGroupSections';
import logger from '../utils/logger';

const RoutineExerciseForm = ({ selectedExercise, onExerciseSelect, exerciseForm, setExerciseForm }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [gifUrl, setGifUrl] = useState(null);
    const [videoUrl, setVideoUrl] = useState(null);
    const [loadingGif, setLoadingGif] = useState(false);

    // Búsqueda de ejercicios
    useEffect(() => {
        if (selectedExercise) {
            setSearchResults([]);
            return;
        }
        
        if (searchQuery.length < 2) {
            setSearchResults([]);
            return;
        }
        
        const timeoutId = setTimeout(async () => {
            try {
                setLoading(true);
                const response = await api.get(`/exercises/search?name=${encodeURIComponent(searchQuery)}`);
                const exercises = response.data.exercises || [];
                
                const queryLower = searchQuery.toLowerCase().trim();
                const queryWords = queryLower.split(/\s+/).filter(w => w.length > 0);
                
                const filteredExercises = exercises.filter(exercise => {
                    const exerciseNameLower = exercise.name.toLowerCase();
                    return queryWords.every(word => exerciseNameLower.includes(word));
                });
                
                setSearchResults(filteredExercises.slice(0, 10));
            } catch (error) {
                logger.error('Error en la búsqueda:', error);
                setSearchResults([]);
            } finally {
                setLoading(false);
            }
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [searchQuery, selectedExercise]);

    // Cargar GIF/video cuando se selecciona un ejercicio
    useEffect(() => {
        if (selectedExercise) {
            if (selectedExercise.gif_url || selectedExercise.video_url) {
                setGifUrl(selectedExercise.gif_url || null);
                setVideoUrl(selectedExercise.video_url || null);
                setLoadingGif(false);
            } else {
                loadExerciseMedia(selectedExercise.name, selectedExercise.wger_id);
            }
        } else {
            setGifUrl(null);
            setVideoUrl(null);
        }
    }, [selectedExercise]);

    const loadExerciseMedia = async (exerciseName, wgerId) => {
        if (!exerciseName) return;
        
        setLoadingGif(true);
        try {
            const queryParam = wgerId 
                ? `wger_id=${encodeURIComponent(wgerId)}` 
                : `name=${encodeURIComponent(exerciseName)}`;
            
            const response = await api.get(`/exercises/gif?${queryParam}`);
            if (response.data) {
                setGifUrl(response.data.gif_url || null);
                setVideoUrl(response.data.video_url || null);
            }
        } catch (error) {
            logger.error('Error al cargar GIF/video:', error);
        } finally {
            setLoadingGif(false);
        }
    };

    const handleExerciseSelect = (exercise) => {
        setSearchQuery(exercise.name);
        setSearchResults([]);
        if (onExerciseSelect) {
            onExerciseSelect(exercise);
        }
    };

    return (
        <div className="space-y-6">
            {/* Sección de grupos musculares - Solo mostrar si no hay ejercicio seleccionado */}
            {!selectedExercise && (
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                        O busca por grupo muscular
                    </label>
                    <MuscleGroupSections 
                        onExerciseSelect={handleExerciseSelect}
                        selectedExercise={selectedExercise}
                    />
                </div>
            )}

            {/* Búsqueda de Ejercicio */}
            <div className="relative">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Buscar Ejercicio *
                </label>
                <input
                    type="text"
                    placeholder="Buscar ejercicio (ej: Push up, Squat, Bench press)"
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-2xl text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 dark:focus:border-blue-400 transition-all"
                    value={searchQuery}
                    onChange={(e) => {
                        const newQuery = e.target.value;
                        setSearchQuery(newQuery);
                        if (selectedExercise && newQuery !== selectedExercise.name) {
                            if (onExerciseSelect) {
                                onExerciseSelect(null);
                            }
                        }
                    }}
                    disabled={!!selectedExercise}
                />
                
                {/* Dropdown de resultados con miniaturas */}
                {searchResults.length > 0 && searchQuery.length >= 2 && !selectedExercise && (
                    <ul className="absolute top-full mt-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-xl w-full z-[100] max-h-80 overflow-y-auto transition-colors duration-300">
                        {searchResults
                            .filter((exercise, index, self) => 
                                index === self.findIndex(e => 
                                    e.name.toLowerCase().trim() === exercise.name.toLowerCase().trim()
                                )
                            )
                            .map((exercise) => (
                            <li key={`${exercise.exercise_id || exercise.id}-${exercise.source || 'local'}`}>
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleExerciseSelect(exercise);
                                    }}
                                    className="w-full p-3 flex items-center gap-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border-b border-gray-200 dark:border-gray-800 last:border-b-0"
                                >
                                    {/* Miniatura */}
                                    <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-blue-500/20 to-pink-500/20 dark:from-blue-600/30 dark:to-pink-600/30 flex-shrink-0 overflow-hidden relative border border-gray-200 dark:border-gray-700">
                                        {exercise.thumbnail || exercise.gif_url || exercise.video_url ? (
                                            <img 
                                                src={exercise.thumbnail || exercise.gif_url || exercise.video_url} 
                                                alt={exercise.name}
                                                className="w-full h-full object-cover"
                                                loading="lazy"
                                                onError={(e) => {
                                                    e.target.style.display = 'none';
                                                }}
                                            />
                                        ) : null}
                                        {/* Placeholder mejorado cuando no hay imagen */}
                                        {!(exercise.thumbnail || exercise.gif_url || exercise.video_url) && (
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
                                        <div className="font-semibold truncate text-gray-900 dark:text-white">{exercise.name}</div>
                                        <div className="text-xs text-gray-600 dark:text-gray-400">{exercise.category}</div>
                                    </div>
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
                
                {loading && (
                    <div className="absolute right-3 top-12">
                        <div className="w-5 h-5 border-2 border-blue-600 dark:border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                )}
            </div>

            {/* Ejercicio Seleccionado */}
            {selectedExercise && (
                <div className="space-y-4">
                    {/* Mostrar GIF/video del ejercicio */}
                    {loadingGif ? (
                        <div className="flex justify-center items-center h-48 bg-gray-100 dark:bg-gray-800 rounded-xl">
                            <div className="w-8 h-8 border-2 border-blue-600 dark:border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : videoUrl ? (
                        <div className="w-full flex justify-center bg-gray-100 dark:bg-gray-800 rounded-xl p-4">
                            <video 
                                src={videoUrl} 
                                controls
                                className="rounded-lg max-w-full h-auto max-h-64 object-contain"
                            >
                                Tu navegador no soporta la reproducción de videos.
                            </video>
                        </div>
                    ) : gifUrl ? (
                        <div className="w-full flex justify-center bg-gray-100 dark:bg-gray-800 rounded-xl p-4">
                            <img 
                                src={gifUrl} 
                                alt={`Cómo hacer ${selectedExercise.name}`}
                                className="rounded-lg max-w-full h-auto max-h-64 object-contain"
                            />
                        </div>
                    ) : null}

                    {/* Información del ejercicio */}
                    <div className="bg-gray-100 dark:bg-gray-800 rounded-xl p-4 transition-colors duration-300">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                            {selectedExercise.name}
                        </h3>
                        <span className="px-2 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-xs font-medium border border-gray-300 dark:border-gray-600">
                            {selectedExercise.category}
                        </span>
                    </div>

                    {/* Formulario de parámetros */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Sets *
                            </label>
                            <input
                                type="number"
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 dark:focus:border-blue-400 transition-all"
                                value={exerciseForm.sets || ''}
                                onChange={(e) => setExerciseForm({ 
                                    ...exerciseForm, 
                                    sets: parseInt(e.target.value) || 0 
                                })}
                                min="1"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Repeticiones
                            </label>
                            <input
                                type="number"
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 dark:focus:border-blue-400 transition-all"
                                value={exerciseForm.reps || ''}
                                onChange={(e) => setExerciseForm({ 
                                    ...exerciseForm, 
                                    reps: e.target.value ? parseInt(e.target.value) : null 
                                })}
                                min="1"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Peso (kg)
                            </label>
                            <input
                                type="number"
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 dark:focus:border-blue-400 transition-all"
                                value={exerciseForm.weight_kg || ''}
                                onChange={(e) => setExerciseForm({ 
                                    ...exerciseForm, 
                                    weight_kg: parseFloat(e.target.value) || 0 
                                })}
                                min="0"
                                step="0.5"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Duración (min)
                            </label>
                            <input
                                type="number"
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 dark:focus:border-blue-400 transition-all"
                                value={exerciseForm.duration_minutes || ''}
                                onChange={(e) => setExerciseForm({ 
                                    ...exerciseForm, 
                                    duration_minutes: e.target.value ? parseFloat(e.target.value) : null 
                                })}
                                min="0"
                                step="0.5"
                            />
                        </div>
                    </div>

                    {/* Selector de día de la semana - Solo mostrar si no viene preseleccionado */}
                    {exerciseForm.day_of_week === null || exerciseForm.day_of_week === undefined ? (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Día de la semana (opcional)
                            </label>
                            <select
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 dark:focus:border-blue-400 transition-all"
                                value=""
                                onChange={(e) => setExerciseForm({
                                    ...exerciseForm,
                                    day_of_week: e.target.value === '' ? null : parseInt(e.target.value)
                                })}
                            >
                                <option value="">Todos los días</option>
                                <option value="0">Domingo</option>
                                <option value="1">Lunes</option>
                                <option value="2">Martes</option>
                                <option value="3">Miércoles</option>
                                <option value="4">Jueves</option>
                                <option value="5">Viernes</option>
                                <option value="6">Sábado</option>
                            </select>
                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                Selecciona un día específico para organizar mejor tu rutina
                            </p>
                        </div>
                    ) : (
                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-4 transition-colors duration-300">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-1">Día seleccionado</div>
                                    <div className="text-lg font-semibold text-gray-900 dark:text-white">
                                        {['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][exerciseForm.day_of_week]}
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setExerciseForm({ ...exerciseForm, day_of_week: null })}
                                    className="px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                                >
                                    Cambiar
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default RoutineExerciseForm;
