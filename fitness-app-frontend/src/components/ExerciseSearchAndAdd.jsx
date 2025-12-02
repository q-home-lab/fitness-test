import React, { useState, useEffect } from 'react';
import api from '../services/api';
import VirtualizedList from './VirtualizedList';
import OptimizedImage from './OptimizedImage';
import useToastStore from '../stores/useToastStore';
import { useDebounce } from '../hooks/useDebounce';
import { useRateLimit } from '../hooks/useRateLimit';
import MuscleGroupSections from './MuscleGroupSections';
import logger from '../utils/logger';

const ExerciseSearchAndAdd = ({ onLogUpdated, onExerciseSelect, selectedExercise }) => {
    // Estados para búsqueda y selección
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [gifUrl, setGifUrl] = useState(null);
    const [videoUrl, setVideoUrl] = useState(null);
    const [loadingGif, setLoadingGif] = useState(false);
    const [localSelectedExercise, setLocalSelectedExercise] = useState(selectedExercise || null);
    const [showForm, setShowForm] = useState(false);
    const [localExerciseForm, setLocalExerciseForm] = useState({
        sets: '',
        reps: '',
        duration_minutes: '',
        weight_kg: '',
        burned_calories: ''
    });
    const toast = useToastStore();
    
    // Debounce del query de búsqueda
    const debouncedSearchQuery = useDebounce(searchQuery, 300);
    
    // Rate limiting para búsquedas
    const rateLimitedSearch = useRateLimit(async (query) => {
        if (query.length < 2) {
            setSearchResults([]);
            setLoading(false);
            return;
        }
        
        try {
            setLoading(true);
            const response = await api.get(`/exercises/search?name=${encodeURIComponent(query)}`);
            const exercises = response.data?.exercises || [];
            
            const queryLower = query.toLowerCase().trim();
            const queryWords = queryLower.split(/\s+/).filter(w => w.length > 0);
            
            const filteredExercises = exercises.filter(exercise => {
                const exerciseNameLower = exercise.name.toLowerCase();
                return queryWords.every(word => exerciseNameLower.includes(word));
            });
            
            const exercisesWithThumbnails = filteredExercises.map(exercise => ({
                ...exercise,
                thumbnail: exercise.gif_url || exercise.video_url || null
            }));
            
            setSearchResults(exercisesWithThumbnails);
        } catch (error) {
            logger.error('Error en la búsqueda de ejercicios:', {
                message: error.message,
                status: error.response?.status,
                data: error.response?.data
            });
            // Si es un error de autenticación, no mostrar resultados vacíos sin más
            if (error.response?.status === 401 || error.response?.status === 403) {
                logger.error('Error de autenticación al buscar ejercicios');
            }
            setSearchResults([]);
        } finally {
            setLoading(false);
        }
    }, 10, 1000);

    // Sincronizar con prop selectedExercise si cambia desde fuera
    useEffect(() => {
        if (selectedExercise) {
            setLocalSelectedExercise(selectedExercise);
            setShowForm(true);
        }
    }, [selectedExercise]);


    // Búsqueda de ejercicios con debounce y rate limiting
    useEffect(() => {
        if (localSelectedExercise) {
            setSearchResults([]);
            return;
        }
        
        if (debouncedSearchQuery.length >= 2) {
            rateLimitedSearch(debouncedSearchQuery);
        } else {
            setSearchResults([]);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedSearchQuery, localSelectedExercise]);

    // Cargar GIF/video cuando se selecciona un ejercicio
    useEffect(() => {
        if (localSelectedExercise && localSelectedExercise.name) {
            if (localSelectedExercise.gif_url || localSelectedExercise.video_url) {
                setGifUrl(localSelectedExercise.gif_url || null);
                setVideoUrl(localSelectedExercise.video_url || null);
                setLoadingGif(false);
            } else {
                const wgerId = localSelectedExercise.wger_id || localSelectedExercise.exercise_id;
                loadExerciseMedia(localSelectedExercise.name, wgerId);
            }
        } else {
            setGifUrl(null);
            setVideoUrl(null);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [localSelectedExercise?.exercise_id, localSelectedExercise?.wger_id]);

    const loadExerciseMedia = async (exerciseName, wgerId) => {
        if (!exerciseName) {
            setGifUrl(null);
            setVideoUrl(null);
            return;
        }
        
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
        setSearchResults([]);
        setSearchQuery(exercise.name);
        setLocalSelectedExercise(exercise);
        setShowForm(true);
        
        if (onExerciseSelect) {
            onExerciseSelect(exercise);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!localSelectedExercise) {
            toast.error('Por favor selecciona un ejercicio primero');
            return;
        }

        const sets = parseInt(localExerciseForm.sets) || 0;
        const duration = parseFloat(localExerciseForm.duration_minutes) || 0;
        const weight = parseFloat(localExerciseForm.weight_kg) || 0;
        
        if (sets === 0 && duration === 0) {
            toast.error('Por favor introduce al menos sets o duración');
            return;
        }

        // Calcular calorías quemadas
        let burnedCalories = 0;
        if (duration > 0 && localSelectedExercise.default_calories_per_minute) {
            burnedCalories = duration * parseFloat(localSelectedExercise.default_calories_per_minute);
        } else if (sets > 0) {
            // Estimación básica: 5 kcal por set
            burnedCalories = sets * 5;
        } else {
            burnedCalories = 10; // Mínimo
        }

        try {
            await api.post('/workouts/log', {
                exercise_id: localSelectedExercise.exercise_id || localSelectedExercise.id,
                sets_done: sets || 1,
                reps_done: localExerciseForm.reps ? parseInt(localExerciseForm.reps) : null,
                duration_minutes: duration || null,
                weight_kg: weight,
                burned_calories: burnedCalories,
            });

            // Limpiar formulario
            setLocalSelectedExercise(null);
            setShowForm(false);
            setSearchQuery('');
            setLocalExerciseForm({
                sets: '',
                reps: '',
                duration_minutes: '',
                weight_kg: '',
                burned_calories: ''
            });

            toast.success('Ejercicio registrado correctamente');
            if (onLogUpdated) {
                onLogUpdated();
            }
        } catch (error) {
            logger.error('Error al registrar ejercicio:', error);
            toast.error(error.response?.data?.error || 'Error al registrar el ejercicio');
        }
    };

    return (
        <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm transition-colors duration-300">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
                Añadir Ejercicio
            </h2>

            {/* Sección de grupos musculares - Solo mostrar si no hay ejercicio seleccionado */}
            {!localSelectedExercise && (
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                        O busca por grupo muscular
                    </label>
                    <MuscleGroupSections 
                        onExerciseSelect={handleExerciseSelect}
                        selectedExercise={localSelectedExercise}
                    />
                </div>
            )}

            {/* Búsqueda de Ejercicio */}
            <div className="relative mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Buscar Ejercicio *
                </label>
                <input
                    type="text"
                    placeholder="Buscar ejercicio (ej: Push up, Squat, Bench press)"
                    className="w-full px-4 py-3.5 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-2xl text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 dark:focus:border-blue-400 transition-all"
                    value={searchQuery}
                    onChange={(e) => {
                        const newQuery = e.target.value;
                        setSearchQuery(newQuery);
                        if (localSelectedExercise && newQuery !== localSelectedExercise.name) {
                            setLocalSelectedExercise(null);
                            setShowForm(false);
                            setSearchResults([]);
                            if (onExerciseSelect) {
                                onExerciseSelect(null);
                            }
                        }
                    }}
                    disabled={!!localSelectedExercise}
                />
                
                {/* Dropdown de resultados con miniaturas */}
                {searchResults.length > 0 && searchQuery.length >= 2 && !localSelectedExercise && (
                    <div className="absolute top-full mt-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-xl w-full z-[100] transition-colors duration-300">
                        <VirtualizedList
                            items={searchResults.filter((exercise, index, self) => 
                                index === self.findIndex(e => 
                                    e.name.toLowerCase().trim() === exercise.name.toLowerCase().trim()
                                )
                            )}
                            itemHeight={80}
                            className="max-h-80"
                            renderItem={(exercise) => (
                                <button
                                    key={`${exercise.exercise_id || exercise.id}-${exercise.source || 'local'}`}
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
                                        <div className="font-semibold truncate text-gray-900 dark:text-white">{exercise.name}</div>
                                        <div className="text-xs text-gray-600 dark:text-gray-400">{exercise.category}</div>
                                    </div>
                                </button>
                            )}
                        />
                    </div>
                )}
                
                {loading && (
                    <div className="absolute right-3 top-12">
                        <div className="w-5 h-5 border-2 border-blue-600 dark:border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                )}
            </div>

            {/* Ejercicio Seleccionado y Formulario */}
            {localSelectedExercise && showForm && (
                <form onSubmit={handleSubmit} className="space-y-4">
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
                                onError={(e) => {
                                    if (gifUrl) e.target.style.display = 'none';
                                }}
                            >
                                Tu navegador no soporta la reproducción de videos.
                            </video>
                        </div>
                    ) : gifUrl ? (
                        <div className="w-full flex justify-center bg-gray-100 dark:bg-gray-800 rounded-xl p-4">
                            <OptimizedImage
                                src={gifUrl}
                                alt={`Cómo hacer ${localSelectedExercise.name}`}
                                className="rounded-lg max-w-full h-auto max-h-64 object-contain"
                            />
                        </div>
                    ) : null}

                    {/* Información del ejercicio */}
                    <div className="bg-gray-100 dark:bg-gray-800 rounded-xl p-4 transition-colors duration-300">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                            {localSelectedExercise.name}
                        </h3>
                        <div className="flex items-center gap-2">
                            <span className="px-2 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-xs font-medium border border-gray-300 dark:border-gray-600">
                                {localSelectedExercise.category}
                            </span>
                            {localSelectedExercise.default_calories_per_minute && (
                                <span className="text-xs text-gray-600 dark:text-gray-400">
                                    ~{localSelectedExercise.default_calories_per_minute} kcal/min
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Formulario */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Sets *
                            </label>
                            <input
                                type="number"
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 dark:focus:border-blue-400 transition-all"
                                value={localExerciseForm.sets}
                                onChange={(e) => setLocalExerciseForm({ ...localExerciseForm, sets: e.target.value })}
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
                                value={localExerciseForm.reps}
                                onChange={(e) => setLocalExerciseForm({ ...localExerciseForm, reps: e.target.value })}
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
                                value={localExerciseForm.weight_kg}
                                onChange={(e) => setLocalExerciseForm({ ...localExerciseForm, weight_kg: e.target.value })}
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
                                value={localExerciseForm.duration_minutes}
                                onChange={(e) => setLocalExerciseForm({ ...localExerciseForm, duration_minutes: e.target.value })}
                                min="1"
                                step="0.5"
                            />
                        </div>
                    </div>

                    {/* Botones */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={() => {
                                setLocalSelectedExercise(null);
                                setShowForm(false);
                                setSearchQuery('');
                                if (onExerciseSelect) {
                                    onExerciseSelect(null);
                                }
                            }}
                            className="flex-1 px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-3 bg-blue-600 dark:bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
                        >
                            Registrar Ejercicio
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
};

export default ExerciseSearchAndAdd;
