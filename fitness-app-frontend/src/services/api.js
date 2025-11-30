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
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Si el error es 401 o 403 (token inválido/expirado) y no hemos intentado refrescar el token
    if ((error.response?.status === 401 || error.response?.status === 403) && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const currentRefreshToken = localStorage.getItem('refreshToken');
        if (!currentRefreshToken) {
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
        
        // Solo redirigir si estamos en el navegador
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;