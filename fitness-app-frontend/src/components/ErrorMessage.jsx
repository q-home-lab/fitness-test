import React from 'react';

/**
 * Componente de mensaje de error reutilizable
 */
const ErrorMessage = ({ 
  message, 
  onRetry = null,
  className = '',
  variant = 'default' // 'default' | 'inline' | 'banner'
}) => {
  const baseClasses = 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-4 text-red-600 dark:text-red-400';

  if (variant === 'inline') {
    return (
      <div className={`text-sm ${baseClasses} ${className}`}>
        {message}
      </div>
    );
  }

  if (variant === 'banner') {
    return (
      <div className={`${baseClasses} ${className}`} role="alert">
        <div className="flex items-center justify-between">
          <p className="font-medium">{message}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="ml-4 px-4 py-2 bg-red-600 dark:bg-red-500 text-white rounded-lg text-sm font-semibold hover:bg-red-700 dark:hover:bg-red-600 transition-colors"
            >
              Reintentar
            </button>
          )}
        </div>
      </div>
    );
  }

  // Default variant
  return (
    <div className={`${baseClasses} ${className}`} role="alert">
      <div className="flex items-start gap-3">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 flex-shrink-0 mt-0.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <div className="flex-1">
          <p className="font-medium">{message}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-2 text-sm underline hover:no-underline"
            >
              Reintentar
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ErrorMessage;

