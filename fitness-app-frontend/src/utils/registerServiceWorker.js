// Utilidad para registrar el Service Worker
export const registerServiceWorker = () => {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('[SW] Service Worker registrado:', registration.scope);

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
                  console.log('[SW] Nueva versión disponible');
                  // Opcional: mostrar notificación al usuario
                  if (window.confirm('Hay una nueva versión disponible. ¿Deseas actualizar?')) {
                    newWorker.postMessage({ type: 'SKIP_WAITING' });
                    window.location.reload();
                  }
                }
              });
            }
          });
        })
        .catch((error) => {
          console.error('[SW] Error al registrar Service Worker:', error);
        });

      // Escuchar mensajes del service worker
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('[SW] Nuevo Service Worker activo');
        window.location.reload();
      });
    });
  }
};

// Función para solicitar permisos de notificaciones
export const requestNotificationPermission = async () => {
  if ('Notification' in window && 'serviceWorker' in navigator) {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      console.log('[SW] Permiso de notificaciones concedido');
      return true;
    } else {
      console.log('[SW] Permiso de notificaciones denegado');
      return false;
    }
  }
  return false;
};

// Función para mostrar notificación local
export const showLocalNotification = (title, options = {}) => {
  if ('Notification' in window && Notification.permission === 'granted') {
    const notification = new Notification(title, {
      icon: '/icon-192.png',
      badge: '/icon-192.png',
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

