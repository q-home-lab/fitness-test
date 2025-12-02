/**
 * Utilidades SEO
 * Funciones para mejorar el SEO de la aplicación
 */

/**
 * Actualizar el título de la página
 * @param {string} title - Título de la página
 */
export const updatePageTitle = (title) => {
  if (typeof document !== 'undefined') {
    document.title = title ? `${title} - Fitness App` : 'Fitness App';
  }
};

/**
 * Actualizar la descripción meta
 * @param {string} description - Descripción de la página
 */
export const updateMetaDescription = (description) => {
  if (typeof document === 'undefined') return;
  
  let metaDescription = document.querySelector('meta[name="description"]');
  
  if (!metaDescription) {
    metaDescription = document.createElement('meta');
    metaDescription.setAttribute('name', 'description');
    document.head.appendChild(metaDescription);
  }
  
  metaDescription.setAttribute('content', description);
};

/**
 * Actualizar Open Graph tags
 * @param {Object} ogData - Datos de Open Graph
 */
export const updateOpenGraph = (ogData) => {
  if (typeof document === 'undefined') return;
  
  const { title, description, image, url } = ogData;
  
  const updateOGTag = (property, content) => {
    let tag = document.querySelector(`meta[property="${property}"]`);
    if (!tag) {
      tag = document.createElement('meta');
      tag.setAttribute('property', property);
      document.head.appendChild(tag);
    }
    tag.setAttribute('content', content);
  };
  
  if (title) updateOGTag('og:title', title);
  if (description) updateOGTag('og:description', description);
  if (image) updateOGTag('og:image', image);
  if (url) updateOGTag('og:url', url);
};

/**
 * Hook para SEO (para usar en componentes)
 * @param {Object} seoData - Datos SEO
 */
export const useSEO = (seoData) => {
  if (typeof window === 'undefined') return;
  
  const { title, description, ogData } = seoData;
  
  if (title) {
    updatePageTitle(title);
  }
  
  if (description) {
    updateMetaDescription(description);
  }
  
  if (ogData) {
    updateOpenGraph(ogData);
  }
};

