import React from 'react';
import { Link } from 'react-router-dom';

const ModernRoutineCard = ({ routine, onDelete }) => {
    const exerciseCount = routine.exercises?.length || 0;
    const isActive = routine.is_active;

    return (
        <Link to={`/routines/${routine.routine_id}`} className="block group">
            <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-6 hover:border-gray-300 dark:hover:border-gray-700 hover:shadow-md transition-all duration-300 h-full flex flex-col shadow-sm">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                            {routine.name}
                        </h3>
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                isActive 
                                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800' 
                                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-800'
                            }`}>
                                {isActive ? 'Activa' : 'Inactiva'}
                            </span>
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                                {exerciseCount} {exerciseCount === 1 ? 'ejercicio' : 'ejercicios'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Descripción */}
                {routine.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-5 line-clamp-2 font-light leading-relaxed">
                        {routine.description}
                    </p>
                )}

                {/* Footer */}
                <div className="mt-auto pt-4 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between">
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (window.confirm(`¿Estás seguro de eliminar la rutina "${routine.name}"?`)) {
                                onDelete(routine.routine_id);
                            }
                        }}
                        className="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all duration-200 active:scale-95"
                    >
                        Eliminar
                    </button>
                    <div className="flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400">
                        Ver detalles
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                    </div>
                </div>
            </div>
        </Link>
    );
};

export default ModernRoutineCard;
