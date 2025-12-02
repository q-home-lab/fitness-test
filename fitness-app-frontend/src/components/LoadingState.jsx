import React from 'react';

/**
 * Componente de loading state reutilizable
 * @param {string} message - Mensaje a mostrar
 * @param {string} variant - Tipo de loading: 'spinner' | 'skeleton' | 'dots'
 * @param {string} size - Tamaño: 'sm' | 'md' | 'lg'
 * @param {boolean} fullScreen - Si debe ocupar toda la pantalla
 * @param {string} className - Clases CSS adicionales
 */
const LoadingState = ({ 
  message = 'Cargando...', 
  variant = 'spinner', // 'spinner' | 'skeleton' | 'dots'
  size = 'md', // 'sm' | 'md' | 'lg'
  fullScreen = false,
  className = '',
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  const containerClasses = fullScreen
    ? 'fixed inset-0 flex items-center justify-center bg-white/80 dark:bg-black/80 backdrop-blur-sm z-50'
    : 'flex items-center justify-center p-8';

  if (variant === 'skeleton') {
    return (
      <div className={`${containerClasses} ${className}`}>
        <div className="w-full space-y-4">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-5/6" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-4/6" />
        </div>
      </div>
    );
  }

  if (variant === 'dots') {
    return (
      <div className={`${containerClasses} ${className}`}>
        <div className="flex items-center space-x-4">
          <div className="flex space-x-2">
            <div 
              className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full animate-bounce" 
              style={{ animationDelay: '0ms' }} 
            />
            <div 
              className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full animate-bounce" 
              style={{ animationDelay: '150ms' }} 
            />
            <div 
              className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full animate-bounce" 
              style={{ animationDelay: '300ms' }} 
            />
          </div>
          {message && (
            <p className="text-gray-600 dark:text-gray-400 text-sm">{message}</p>
          )}
        </div>
      </div>
    );
  }

  // Default: spinner
  return (
    <div className={`${containerClasses} ${className}`} role="status" aria-live="polite" aria-busy="true">
      <div className="flex flex-col items-center space-y-4">
        <div
          className={`${sizeClasses[size]} border-4 border-gray-300 dark:border-gray-700 border-t-blue-600 dark:border-t-blue-400 rounded-full animate-spin`}
          aria-hidden="true"
        >
          <span className="sr-only">Cargando</span>
        </div>
        {message && (
          <p className="text-gray-600 dark:text-gray-400 text-sm" aria-live="polite">{message}</p>
        )}
      </div>
    </div>
  );
};

export default LoadingState;

