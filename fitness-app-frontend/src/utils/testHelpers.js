/**
 * Helpers para testing
 * Utilidades reutilizables para tests
 */

import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';

/**
 * Renderizar componente con providers necesarios
 */
export const renderWithProviders = (ui, options = {}) => {
  const { route = '/', ...renderOptions } = options;
  
  window.history.pushState({}, 'Test page', route);
  
  const Wrapper = ({ children }) => {
    return (
      <BrowserRouter>
        {children}
      </BrowserRouter>
    );
  };

  return render(ui, { wrapper: Wrapper, ...renderOptions });
};

/**
 * Mock de API
 */
export const mockApiResponse = (data, status = 200) => {
  return Promise.resolve({
    data,
    status,
    statusText: 'OK',
    headers: {},
    config: {},
  });
};

export const mockApiError = (message, status = 400) => {
  return Promise.reject({
    response: {
      data: { error: message },
      status,
      statusText: 'Bad Request',
    },
  });
};

/**
 * Mock de localStorage
 */
export const mockLocalStorage = () => {
  const store = {};
  return {
    getItem: vi.fn((key) => store[key] || null),
    setItem: vi.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: vi.fn((key) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      Object.keys(store).forEach(key => delete store[key]);
    }),
  };
};

/**
 * Esperar a que un elemento aparezca
 */
export const waitForElement = async (queryFn, options = {}) => {
  const { timeout = 5000, interval = 100 } = options;
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    const element = queryFn();
    if (element) return element;
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  
  throw new Error('Element not found within timeout');
};

/**
 * Mock de useNavigate
 */
export const mockNavigate = () => {
  const navigate = vi.fn();
  return navigate;
};

/**
 * Mock de useParams
 */
export const mockParams = (params) => {
  return params;
};

