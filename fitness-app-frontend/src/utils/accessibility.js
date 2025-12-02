/**
 * Utilidades de accesibilidad
 * Funciones helper para mejorar la accesibilidad de la aplicación
 */

/**
 * Manejar navegación por teclado en listas
 * @param {KeyboardEvent} event - Evento de teclado
 * @param {string} currentId - ID del elemento actual
 * @param {string[]} itemIds - Array de IDs de elementos
 * @param {Function} onSelect - Callback cuando se selecciona un elemento
 */
export const handleKeyboardNavigation = (event, currentId, itemIds, onSelect) => {
  const currentIndex = itemIds.indexOf(currentId);
  
  switch (event.key) {
    case 'ArrowDown':
    case 'ArrowRight':
      event.preventDefault();
      const nextIndex = currentIndex < itemIds.length - 1 ? currentIndex + 1 : 0;
      onSelect(itemIds[nextIndex]);
      break;
    case 'ArrowUp':
    case 'ArrowLeft':
      event.preventDefault();
      const prevIndex = currentIndex > 0 ? currentIndex - 1 : itemIds.length - 1;
      onSelect(itemIds[prevIndex]);
      break;
    case 'Home':
      event.preventDefault();
      onSelect(itemIds[0]);
      break;
    case 'End':
      event.preventDefault();
      onSelect(itemIds[itemIds.length - 1]);
      break;
    case 'Enter':
    case ' ':
      event.preventDefault();
      onSelect(currentId);
      break;
    default:
      break;
  }
};

/**
 * Generar ID único para aria-describedby
 */
export const generateAriaId = (prefix) => {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Verificar si el usuario está usando un lector de pantalla
 * Nota: Esta es una aproximación, no es 100% precisa
 */
export const isScreenReaderActive = () => {
  if (typeof window === 'undefined') return false;
  
  // Detectar si hay un lector de pantalla activo
  // Esto es una aproximación basada en características comunes
  const hasAriaLive = document.querySelector('[aria-live]');
  const hasRole = document.querySelector('[role]');
  
  // Otra aproximación: verificar si el usuario navega solo con teclado
  let keyboardOnly = false;
  document.addEventListener('keydown', () => {
    keyboardOnly = true;
  }, { once: true });
  
  return hasAriaLive || hasRole || keyboardOnly;
};

/**
 * Anunciar cambios a lectores de pantalla
 * @param {string} message - Mensaje a anunciar
 * @param {string} priority - 'polite' o 'assertive'
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
 * Manejar focus trap en modales
 * @param {HTMLElement} container - Contenedor del modal
 * @param {KeyboardEvent} event - Evento de teclado
 */
export const handleFocusTrap = (container, event) => {
  if (event.key !== 'Tab') return;
  
  const focusableElements = container.querySelectorAll(
    'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
  );
  
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];
  
  if (event.shiftKey) {
    if (document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
    }
  } else {
    if (document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  }
};
