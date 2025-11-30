import React from 'react';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { AuthProvider } from '../../contexts/AuthContext';
import { ThemeProvider } from '../../contexts/ThemeContext';
import { BrandProvider } from '../../contexts/BrandContext';

/**
 * Renderiza un componente con todos los providers necesarios
 */
export const renderWithProviders = (
  ui,
  {
    initialAuthState = { user: null, isAuthenticated: false },
    initialTheme = 'light',
    initialBrand = { brand_name: 'Fitness App' },
    ...renderOptions
  } = {}
) => {
  const Wrapper = ({ children }) => {
    return (
      <BrowserRouter>
        <ThemeProvider initialTheme={initialTheme}>
          <AuthProvider initialAuthState={initialAuthState}>
            <BrandProvider initialBrand={initialBrand}>
              {children}
            </BrandProvider>
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    );
  };

  return render(ui, { wrapper: Wrapper, ...renderOptions });
};

/**
 * Mock de API (usar vi.fn() de vitest)
 */
export const createMockApi = () => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
});

/**
 * Crea un mock de usuario
 */
export const createMockUser = (overrides = {}) => ({
  id: 1,
  email: 'test@example.com',
  isAdmin: false,
  ...overrides,
});

/**
 * Crea un mock de rutina
 */
export const createMockRoutine = (overrides = {}) => ({
  routine_id: 1,
  name: 'Rutina de Prueba',
  description: 'Descripción de prueba',
  is_active: true,
  exercises: [],
  ...overrides,
});

/**
 * Crea un mock de ejercicio
 */
export const createMockExercise = (overrides = {}) => ({
  exercise_id: 1,
  name: 'Ejercicio de Prueba',
  category: 'Fuerza',
  is_public: true,
  ...overrides,
});

/**
 * Espera a que se complete una operación asíncrona
 */
export const waitForAsync = () => new Promise(resolve => setTimeout(resolve, 0));

