import { useEffect } from 'react';

/**
 * Hook personalizado para manejar títulos de página
 * Actualiza el título del documento y opcionalmente el meta description
 */
export const usePageTitle = (title, description = null) => {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = title ? `${title} | Fitness App` : 'Fitness App';

    // Actualizar meta description si se proporciona
    if (description) {
      let metaDescription = document.querySelector('meta[name="description"]');
      if (!metaDescription) {
        metaDescription = document.createElement('meta');
        metaDescription.name = 'description';
        document.head.appendChild(metaDescription);
      }
      metaDescription.content = description;
    }

    // Cleanup: restaurar título anterior al desmontar
    return () => {
      document.title = previousTitle;
    };
  }, [title, description]);
};

export default usePageTitle;

