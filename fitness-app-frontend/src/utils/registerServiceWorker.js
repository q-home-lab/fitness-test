// Utilidad para registrar el Service Worker
export const registerServiceWorker = () => {
  // Solo registrar en producción y si el service worker está disponible
  if (import.meta.env.PROD && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          // Log solo en desarrollo
          if (import.meta.env.DEV) {
            console.log('[SW] Service Worker registrado:', registration.scope);
          }

          // Verificar actualizaciones cada hora
          setInterval(() => {
            registration.update();
          }, 60 * 60 * 1000);

          // Manejar actualizaciones del service worker
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // Hay una nueva versión disponible
                  // Opcional: mostrar notificación al usuario (mejor usar toast)
                  // Por ahora, actualizar automáticamente en background
                  newWorker.postMessage({ type: 'SKIP_WAITING' });
                }
              });
            }
          });
        })
        .catch((error) => {
          // Silenciar errores en producción (no crítico)
          if (import.meta.env.DEV) {
            if (error.message && error.message.includes('404')) {
              console.warn('[SW] Service Worker no disponible');
            } else {
              console.error('[SW] Error al registrar Service Worker:', error);
            }
          }
        });

      // Escuchar mensajes del service worker
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        // Recargar cuando hay un nuevo service worker
        window.location.reload();
      });
    });
  }
};

// Función para solicitar permisos de notificaciones
export const requestNotificationPermission = async () => {
  if ('Notification' in window && 'serviceWorker' in navigator) {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  return false;
};

// Función para mostrar notificación local
export const showLocalNotification = (title, options = {}) => {
  if ('Notification' in window && Notification.permission === 'granted') {
    const notification = new Notification(title, {
      icon: '/vite.svg',
      badge: '/vite.svg',
      ...options
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    return notification;
  }
  return null;
};

