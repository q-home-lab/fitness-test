import React from 'react';

const ModernExerciseCard = ({ exercise, index, onViewGif, onRemove, showActions = true }) => {
    // Estado reservado para expansión futura del card
    // const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-6 hover:border-gray-300 dark:hover:border-gray-700 hover:shadow-md transition-all duration-300 shadow-sm">
            <div className="flex items-start justify-between gap-4">
                {/* Número y nombre */}
                <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-600 to-pink-500 rounded-2xl flex items-center justify-center text-white font-semibold text-lg shadow-lg shadow-blue-600/20">
                        {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 truncate">
                            {exercise.name}
                        </h3>
                        <div className="flex items-center gap-2 flex-wrap mb-3">
                            <span className="inline-block px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full text-xs font-medium border border-gray-200 dark:border-gray-800">
                                {exercise.category}
                            </span>
                        </div>
                        {/* Mostrar parámetros en una línea separada con mejor formato */}
                        <div className="flex items-center gap-4 flex-wrap">
                            {exercise.sets && (
                                <div className="flex items-center gap-1.5">
                                    <span className="text-xs text-gray-500 dark:text-gray-500">Sets:</span>
                                    <span className="text-sm font-semibold text-gray-900 dark:text-white">{exercise.sets}</span>
                                </div>
                            )}
                            {exercise.reps && (
                                <div className="flex items-center gap-1.5">
                                    <span className="text-xs text-gray-500 dark:text-gray-500">Reps:</span>
                                    <span className="text-sm font-semibold text-gray-900 dark:text-white">{exercise.reps}</span>
                                </div>
                            )}
                            {exercise.weight_kg > 0 && (
                                <div className="flex items-center gap-1.5">
                                    <span className="text-xs text-gray-500 dark:text-gray-500">Peso:</span>
                                    <span className="text-sm font-semibold text-gray-900 dark:text-white">{exercise.weight_kg}kg</span>
                                </div>
                            )}
                            {exercise.duration_minutes && (
                                <div className="flex items-center gap-1.5">
                                    <span className="text-xs text-gray-500 dark:text-gray-500">Duración:</span>
                                    <span className="text-sm font-semibold text-gray-900 dark:text-white">{exercise.duration_minutes}min</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Botón Ver GIF si hay */}
                {(exercise.gif_url || exercise.video_url) && showActions && (
                    <button
                        onClick={() => onViewGif(exercise.name, exercise)}
                        className="flex-shrink-0 w-11 h-11 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-blue-600 dark:hover:bg-blue-500 hover:text-white transition-all active:scale-95 flex items-center justify-center border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300"
                        title="Ver demostración"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                    </button>
                )}
            </div>

            {/* Acciones */}
            {showActions && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800 flex justify-end">
                    <button
                        onClick={() => onRemove(exercise.routine_exercise_id || exercise.exercise_id, exercise.name)}
                        className="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all duration-200 active:scale-95"
                    >
                        Eliminar
                    </button>
                </div>
            )}
        </div>
    );
};

export default ModernExerciseCard;
