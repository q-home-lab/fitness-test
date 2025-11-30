import React from 'react';

/**
 * Componente de spinner de carga reutilizable
 */
const LoadingSpinner = ({ 
  size = 'md', 
  color = 'blue',
  className = '',
  text = null 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  const colorClasses = {
    blue: 'border-blue-600 dark:border-blue-400',
    gray: 'border-gray-600 dark:border-gray-400',
    white: 'border-white',
    primary: 'border-[#D45A0F] dark:border-blue-400',
  };

  return (
    <div className={`flex flex-col items-center justify-center gap-2 ${className}`}>
      <div
        className={`${sizeClasses[size]} border-4 ${colorClasses[color]} border-t-transparent rounded-full animate-spin`}
        role="status"
        aria-label="Cargando"
      >
        <span className="sr-only">Cargando...</span>
      </div>
      {text && (
        <p className="text-sm text-gray-600 dark:text-gray-400">{text}</p>
      )}
    </div>
  );
};

export default LoadingSpinner;

