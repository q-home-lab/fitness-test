import { useState } from 'react';

/**
 * Componente de imagen optimizada con placeholder y lazy loading
 */
const OptimizedImage = ({ 
  src, 
  alt, 
  className = '', 
  placeholder = null,
  onError = null,
  ...props 
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const handleLoad = () => {
    setLoading(false);
  };

  const handleError = (e) => {
    setLoading(false);
    setError(true);
    if (onError) {
      onError(e);
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Placeholder/Skeleton mientras carga */}
      {loading && !error && (
        <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse flex items-center justify-center">
          {placeholder || (
            <svg 
              className="w-8 h-8 text-gray-400 dark:text-gray-600" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          )}
        </div>
      )}
      
      {/* Imagen */}
      {!error && (
        <img
          src={src}
          alt={alt}
          className={`${className} ${loading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
          loading="lazy"
          onLoad={handleLoad}
          onError={handleError}
          {...props}
        />
      )}
      
      {/* Fallback si hay error */}
      {error && (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 flex flex-col items-center justify-center">
          <svg 
            className="w-6 h-6 mb-1 text-gray-400 dark:text-gray-500" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {alt && typeof alt === 'string' && alt.length > 0 && (
            <span className="text-[8px] font-semibold text-center px-1 leading-tight text-gray-500 dark:text-gray-400 max-w-full truncate">
              {alt.substring(0, 10)}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default OptimizedImage;

