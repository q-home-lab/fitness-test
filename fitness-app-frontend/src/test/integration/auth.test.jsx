import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import AuthForm from '../../AuthForm';
import useUserStore from '../../stores/useUserStore';

// Mock de useNavigate y useLocation
const mockNavigate = vi.fn();
const mockLocation = { pathname: '/login' };

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => mockLocation,
  };
});

describe('Auth Integration Tests', () => {
  beforeEach(() => {
    // Reset store y localStorage
    useUserStore.getState().logout();
    localStorage.clear();
    mockNavigate.mockClear();
  });

  it('debe hacer login exitoso y redirigir al dashboard', async () => {
    const user = userEvent.setup();
    render(
      <BrowserRouter>
        <AuthForm />
      </BrowserRouter>
    );

    // Llenar formulario
    const emailInput = screen.getByPlaceholderText(/tu@email.com/i);
    const passwordInput = screen.getByPlaceholderText(/••••••••/i);
    const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    // Verificar que se guardó el token
    await waitFor(() => {
      expect(localStorage.getItem('userToken')).toBeTruthy();
    });

    // Verificar que se actualizó el store
    await waitFor(() => {
      const userState = useUserStore.getState();
      expect(userState.user).toBeTruthy();
      expect(userState.user.email).toBe('test@example.com');
    });

    // Verificar navegación
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
    });
  });

  it('debe mostrar error con credenciales inválidas', async () => {
    const user = userEvent.setup();
    render(
      <BrowserRouter>
        <AuthForm />
      </BrowserRouter>
    );

    const emailInput = screen.getByPlaceholderText(/tu@email.com/i);
    const passwordInput = screen.getByPlaceholderText(/••••••••/i);
    const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });

    await user.type(emailInput, 'wrong@example.com');
    await user.type(passwordInput, 'wrongpassword');
    await user.click(submitButton);

    // Verificar mensaje de error (puede ser "Error al iniciar sesión" o "credenciales inválidas")
    await waitFor(() => {
      const errorMessage = screen.getByText(/error al iniciar sesión|credenciales inválidas/i);
      expect(errorMessage).toBeInTheDocument();
    });
  });

  it('debe registrar usuario exitosamente', async () => {
    const user = userEvent.setup();
    // Cambiar location a /register
    mockLocation.pathname = '/register';

    render(
      <BrowserRouter>
        <AuthForm />
      </BrowserRouter>
    );

    const emailInput = screen.getByPlaceholderText(/tu@email.com/i);
    const passwordInput = screen.getByPlaceholderText(/••••••••/i);
    const submitButton = screen.getByRole('button', { name: /crear cuenta/i });

    await user.type(emailInput, 'newuser@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(localStorage.getItem('userToken')).toBeTruthy();
    });

    // Reset location
    mockLocation.pathname = '/login';
  });
});

