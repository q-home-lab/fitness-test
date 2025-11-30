/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
// NOTA: Debes instalar react-router-dom para que 'useNavigate' funcione: npm install react-router-dom
import { useNavigate } from 'react-router-dom'; 

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // Datos del usuario (email, id, isAdmin)
  const [loading, setLoading] = useState(true); // Estado de carga inicial
  const navigate = useNavigate();

  // Función para cargar/verificar el usuario al iniciar la aplicación o después del login
  const loadUser = async () => {
    const token = localStorage.getItem('userToken');
    if (token) {
      try {
        // Usamos la ruta protegida /api/profile para verificar si el token es válido
        const response = await api.get('/profile'); 
        // El backend devuelve el perfil en response.data.profile
        setUser(response.data.profile); 
      } catch (error) {
        console.error('Token inválido/expirado, forzando logout:', error);
        localStorage.removeItem('userToken'); 
        localStorage.removeItem('userId'); 
        setUser(null);
      }
    }
    // Usar setTimeout para evitar setState sincrónico en efecto
    setTimeout(() => {
      setLoading(false);
    }, 0);
  };

  useEffect(() => {
    loadUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  // Funciones de Autenticación
  const login = async (email, password, recaptchaToken = null) => {
    const response = await api.post('/auth/login', { 
      email, 
      password,
      recaptchaToken 
    });
    
    const { token, refreshToken, user } = response.data;
    localStorage.setItem('userToken', token);
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken);
    }
    localStorage.setItem('userId', user.id);
    setUser(user);
    navigate('/dashboard', { replace: true });
  };

  const register = async (email, password, recaptchaToken = null) => {
    const response = await api.post('/auth/register', { 
      email, 
      password,
      recaptchaToken 
    });
    
    // El registro también devuelve token e inicia sesión
    const { token, refreshToken, user } = response.data;
    localStorage.setItem('userToken', token);
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken);
    }
    localStorage.setItem('userId', user.id);
    setUser(user); 
    // Redirigir a welcome para onboarding
    navigate('/welcome', { replace: true });
  };

  // Función para refrescar el token de acceso
  const refreshAccessToken = async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }
    
    try {
      const response = await api.post('/auth/refresh', { refreshToken });
      const { token, refreshToken: newRefreshToken } = response.data;
      localStorage.setItem('userToken', token);
      
      // Si el backend devuelve un nuevo refreshToken, actualizarlo también
      if (newRefreshToken) {
        localStorage.setItem('refreshToken', newRefreshToken);
      }
      
      return token;
    } catch (error) {
      // Si el refresh falla, hacer logout
      logout();
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('userToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userId');
    setUser(null);
    navigate('/login', { replace: true });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        refreshAccessToken,
        isAuthenticated: !!user,
        isAdmin: !!user?.isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};