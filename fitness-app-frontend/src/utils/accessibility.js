// Utilidades de accesibilidad

/**
 * Maneja la navegación por teclado en listas y grids
 * @param {KeyboardEvent} event - Evento de teclado
 * @param {string} direction - 'horizontal' | 'vertical' | 'grid'
 * @param {number} currentIndex - Índice actual
 * @param {number} totalItems - Total de items
 * @returns {number | null} - Nuevo índice o null si no hay cambio
 */
export const handleKeyboardNavigation = (event, direction, currentIndex, totalItems) => {
  let newIndex = currentIndex;

  switch (event.key) {
    case 'ArrowUp':
      if (direction === 'vertical' || direction === 'grid') {
        event.preventDefault();
        newIndex = currentIndex > 0 ? currentIndex - 1 : totalItems - 1;
      }
      break;
    case 'ArrowDown':
      if (direction === 'vertical' || direction === 'grid') {
        event.preventDefault();
        newIndex = currentIndex < totalItems - 1 ? currentIndex + 1 : 0;
      }
      break;
    case 'ArrowLeft':
      if (direction === 'horizontal' || direction === 'grid') {
        event.preventDefault();
        newIndex = currentIndex > 0 ? currentIndex - 1 : totalItems - 1;
      }
      break;
    case 'ArrowRight':
      if (direction === 'horizontal' || direction === 'grid') {
        event.preventDefault();
        newIndex = currentIndex < totalItems - 1 ? currentIndex + 1 : 0;
      }
      break;
    case 'Home':
      event.preventDefault();
      newIndex = 0;
      break;
    case 'End':
      event.preventDefault();
      newIndex = totalItems - 1;
      break;
    default:
      return null;
  }

  return newIndex !== currentIndex ? newIndex : null;
};

/**
 * Enfoca el primer elemento enfocable dentro de un contenedor
 * @param {HTMLElement} container - Contenedor a buscar
 */
export const focusFirstElement = (container) => {
  if (!container) return;

  const focusableSelectors = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(', ');

  const firstFocusable = container.querySelector(focusableSelectors);
  if (firstFocusable) {
    firstFocusable.focus();
  }
};

/**
 * Cierra un modal/dialog y devuelve el foco al elemento que lo abrió
 * @param {HTMLElement} triggerElement - Elemento que abrió el modal
 */
export const closeModalAndRestoreFocus = (triggerElement) => {
  if (triggerElement && typeof triggerElement.focus === 'function') {
    setTimeout(() => {
      triggerElement.focus();
    }, 100);
  }
};

/**
 * Anuncia un mensaje a los screen readers
 * @param {string} message - Mensaje a anunciar
 * @param {string} priority - 'polite' | 'assertive'
 */
export const announceToScreenReader = (message, priority = 'polite') => {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;

  document.body.appendChild(announcement);

  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
};

/**
 * Hook para manejar escape key (requiere importar React)
 */
// export const useEscapeKey = (callback) => {
//   React.useEffect(() => {
//     const handleEscape = (event) => {
//       if (event.key === 'Escape') {
//         callback();
//       }
//     };

//     document.addEventListener('keydown', handleEscape);
//     return () => document.removeEventListener('keydown', handleEscape);
//   }, [callback]);
// };

/**
 * Genera IDs únicos para ARIA relationships
 */
let idCounter = 0;
export const generateAriaId = (prefix = 'aria') => {
  return `${prefix}-${++idCounter}-${Date.now()}`;
};

/**
 * Valida que un elemento tenga las propiedades ARIA necesarias
 */
export const validateAriaAttributes = (element) => {
  const warnings = [];
  
  // Si tiene aria-labelledby, verificar que el elemento existe
  const labelledBy = element.getAttribute('aria-labelledby');
  if (labelledBy) {
    const labelElement = document.getElementById(labelledBy);
    if (!labelElement) {
      warnings.push(`aria-labelledby="${labelledBy}" apunta a un elemento que no existe`);
    }
  }

  // Si tiene aria-describedby, verificar que el elemento existe
  const describedBy = element.getAttribute('aria-describedby');
  if (describedBy) {
    const descElement = document.getElementById(describedBy);
    if (!descElement) {
      warnings.push(`aria-describedby="${describedBy}" apunta a un elemento que no existe`);
    }
  }

  return warnings;
};

