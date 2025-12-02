/**
 * Hook para manejar focus trap en modales
 * Asegura que el foco se mantenga dentro del modal
 */
import { useEffect, useRef } from 'react';
import { handleFocusTrap } from '../utils/accessibility';

export const useFocusTrap = (isOpen) => {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!isOpen || !containerRef.current) return;

    const container = containerRef.current;
    const handleKeyDown = (event) => {
      handleFocusTrap(container, event);
    };

    container.addEventListener('keydown', handleKeyDown);

    // Focus en el primer elemento focusable al abrir
    const focusableElements = container.querySelectorAll(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    
    if (focusableElements.length > 0) {
      const firstElement = focusableElements[0];
      // Pequeño delay para asegurar que el modal esté completamente renderizado
      setTimeout(() => {
        firstElement.focus();
      }, 100);
    }

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return containerRef;
};

