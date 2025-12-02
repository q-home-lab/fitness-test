import React from 'react';

/**
 * Contenedor de página estandarizado
 * Proporciona estructura consistente para todas las páginas
 * 
 * @param {string} title - Título de la página
 * @param {string} description - Descripción opcional
 * @param {React.ReactNode} children - Contenido de la página
 * @param {string} className - Clases CSS adicionales
 */
export const PageContainer = ({ 
  title, 
  description, 
  children, 
  className = '' 
}) => {
  return (
    <div className={`max-w-7xl mx-auto px-6 py-8 md:py-12 ${className}`}>
      {/* Header */}
      {(title || description) && (
        <div className="mb-10 md:mb-12 scroll-mt-24 lg:scroll-mt-28">
          {title && (
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-light tracking-tight text-gray-900 dark:text-white mb-3 leading-[1.1]">
              {title}
            </h1>
          )}
          {description && (
            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 font-light leading-relaxed">
              {description}
            </p>
          )}
        </div>
      )}
      
      {/* Contenido */}
      {children}
    </div>
  );
};

export default PageContainer;

