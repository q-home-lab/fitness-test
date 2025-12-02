import axios from 'axios';

// URL del backend - Configurable mediante variable de entorno para producción
// En desarrollo usa localhost, en producción usa la variable de entorno
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'; 

// Crear una instancia de Axios
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adjuntar el token JWT a todas las solicitudes (rutas protegidas)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('userToken');
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`; 
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Interceptor para manejar errores 401/403 y refrescar token automáticamente
// También implementa retry automático para errores de red y 5xx
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const isAuthError = error.response?.status === 401 || error.response?.status === 403;
    const isProfileEndpoint = originalRequest?.url?.includes('/profile');
    const isNotificationsEndpoint = originalRequest?.url?.includes('/notifications');
    const isNetworkError = !error.response; // Error de red
    const isServerError = error.response?.status >= 500 && error.response?.status < 600;

    // Retry automático para errores de red o del servidor (máximo 3 intentos)
    if ((isNetworkError || isServerError) && !originalRequest._retryCount) {
      originalRequest._retryCount = 0;
    }

    if ((isNetworkError || isServerError) && originalRequest._retryCount < 3) {
      originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;
      
      // Exponential backoff: esperar 1s, 2s, 4s
      const delay = Math.pow(2, originalRequest._retryCount - 1) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
      
      return api(originalRequest);
    }

    // Si el error es 401 o 403 (token inválido/expirado) y no hemos intentado refrescar el token
    if (isAuthError && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const currentRefreshToken = localStorage.getItem('refreshToken');
        if (!currentRefreshToken) {
          // Si no hay refreshToken y es una llamada a /profile o /notifications, silenciar el error
          // ya que es parte del flujo normal de verificación de autenticación
          if (isProfileEndpoint || isNotificationsEndpoint) {
            // Limpiar tokens y dejar que el componente maneje el estado
            localStorage.removeItem('userToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('userId');
            // Rechazar silenciosamente para que el componente pueda manejar el estado
            return Promise.reject(error);
          }
          throw new Error('No refresh token');
        }

        // Intentar refrescar el token
        const response = await axios.post(
          `${import.meta.env.VITE_API_URL || 'http://localhost:4000/api'}/auth/refresh`,
          { refreshToken: currentRefreshToken }
        );

        const { token, refreshToken: newRefreshToken } = response.data;
        localStorage.setItem('userToken', token);
        
        // Si el backend devuelve un nuevo refreshToken, actualizarlo también
        if (newRefreshToken) {
          localStorage.setItem('refreshToken', newRefreshToken);
        }

        // Reintentar la solicitud original con el nuevo token
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Si el refresh falla, limpiar y redirigir a login
        localStorage.removeItem('userToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('userId');
        
        // Solo redirigir si estamos en el navegador y no es una llamada a /profile o /notifications
        // (estas llamadas ya manejan el estado de autenticación silenciosamente)
        if (typeof window !== 'undefined' && !isProfileEndpoint && !isNotificationsEndpoint) {
          window.location.href = '/login';
        }
        
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;