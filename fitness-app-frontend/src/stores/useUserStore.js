import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../services/api';

const useUserStore = create(
  persist(
    (set, get) => ({
      // Estado
      user: null,
      loading: true,
      token: null,
      refreshToken: null,

      // Acciones
      setUser: (user) => set({ user }),
      
      setLoading: (loading) => set({ loading }),

      setTokens: (token, refreshToken) => {
        set({ token, refreshToken });
        if (token) {
          localStorage.setItem('userToken', token);
        }
        if (refreshToken) {
          localStorage.setItem('refreshToken', refreshToken);
        }
        if (get().user?.id) {
          localStorage.setItem('userId', get().user.id);
        }
      },

      // Cargar usuario desde token
      loadUser: async () => {
        const token = localStorage.getItem('userToken');
        if (!token) {
          set({ user: null, loading: false, token: null });
          return;
        }

        try {
          const response = await api.get('/profile');
          set({ 
            user: response.data.profile,
            token,
            loading: false 
          });
        } catch (error) {
          console.error('Token inválido/expirado, forzando logout:', error);
          localStorage.removeItem('userToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('userId');
          set({ user: null, loading: false, token: null, refreshToken: null });
        }
      },

      // Login
      login: async (email, password, recaptchaToken = null, navigate) => {
        try {
          const response = await api.post('/auth/login', {
            email,
            password,
            recaptchaToken,
          });

          const { token, refreshToken, user } = response.data;
          set({ user, token, refreshToken });
          
          localStorage.setItem('userToken', token);
          if (refreshToken) {
            localStorage.setItem('refreshToken', refreshToken);
          }
          localStorage.setItem('userId', user.id);

          // Verificar si el usuario necesita seleccionar un rol
          if (navigate) {
            if (!user.role || user.role === null) {
              navigate('/select-role', { replace: true });
            } else {
              navigate('/dashboard', { replace: true });
            }
          }

          return { success: true };
        } catch (error) {
          return {
            success: false,
            error: error.response?.data?.error || 'Error al iniciar sesión',
          };
        }
      },

      // Registro
      register: async (email, password, recaptchaToken = null, navigate, invitationToken = null) => {
        try {
          const response = await api.post('/auth/register', {
            email,
            password,
            recaptchaToken,
            invitationToken,
          });

          const { token, refreshToken, user } = response.data;
          set({ user, token, refreshToken });

          localStorage.setItem('userToken', token);
          if (refreshToken) {
            localStorage.setItem('refreshToken', refreshToken);
          }
          localStorage.setItem('userId', user.id);

          // Verificar si el usuario necesita seleccionar un rol
          if (navigate) {
            if (!user.role || user.role === null) {
              navigate('/select-role', { replace: true });
            } else {
              // Si tiene rol, verificar onboarding
              // El OnboardingGuard se encargará de redirigir según el estado
              navigate('/welcome', { replace: true });
            }
          }

          return { success: true };
        } catch (error) {
          // Extraer el mensaje de error de manera más robusta
          let errorMessage = 'Error al registrarse';
          
          if (error.response?.data) {
            const errorData = error.response.data;
            if (errorData.error) {
              errorMessage = errorData.error;
            } else if (errorData.details && Array.isArray(errorData.details) && errorData.details.length > 0) {
              errorMessage = errorData.details.map(d => d.message || d.msg).join(', ');
            } else if (errorData.message) {
              errorMessage = errorData.message;
            }
          } else if (error.message) {
            errorMessage = error.message;
          }
          
          return {
            success: false,
            error: errorMessage,
            details: error.response?.data?.details,
          };
        }
      },

      // Refresh token
      refreshAccessToken: async () => {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        try {
          const response = await api.post('/auth/refresh', { refreshToken });
          const { token, refreshToken: newRefreshToken } = response.data;
          set({ token, refreshToken: newRefreshToken || refreshToken });
          localStorage.setItem('userToken', token);
          
          // Si el backend devuelve un nuevo refreshToken, actualizarlo también
          if (newRefreshToken) {
            localStorage.setItem('refreshToken', newRefreshToken);
          }
          
          return token;
        } catch (error) {
          // Si el refresh falla, hacer logout
          get().logout();
          throw error;
        }
      },

      // Logout
      logout: (navigate) => {
        localStorage.removeItem('userToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('userId');
        set({ user: null, token: null, refreshToken: null });

        if (navigate) {
          navigate('/login', { replace: true });
        }
      },

      // Getters computados
      isAuthenticated: () => !!get().user,
      isAdmin: () => !!get().user?.isAdmin || get().user?.role === 'ADMIN',
      isCoach: () => get().user?.role === 'COACH',
      isClient: () => get().user?.role === 'CLIENT' || !get().user?.role,
      getUserRole: () => get().user?.role || 'CLIENT',
    }),
    {
      name: 'user-storage',
      partialize: (state) => ({
        // Solo persistir el token, no el usuario completo (se carga desde API)
        token: state.token,
        refreshToken: state.refreshToken,
      }),
    }
  )
);

export default useUserStore;

