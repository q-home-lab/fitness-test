import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import DietPage from '../../pages/DietPage';
import useUserStore from '../../stores/useUserStore';
import useTodayLogStore from '../../stores/useTodayLogStore';

// Mock de useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('Food Integration Tests', () => {
  beforeEach(() => {
    // Configurar usuario autenticado y log
    useUserStore.getState().setUser({
      id: 1,
      email: 'test@example.com',
      isAdmin: false,
    });
    useTodayLogStore.getState().setLog({
      log_id: 1,
      user_id: 1,
      date: '2024-01-01',
      weight_kg: 70.5,
    });
    localStorage.setItem('userToken', 'mock-token');
  });

  it('debe cargar la página de dieta y mostrar el componente de búsqueda de alimentos', async () => {
    render(
      <BrowserRouter>
        <DietPage />
      </BrowserRouter>
    );

    // Esperar a que cargue el componente - buscar el heading específico
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /dieta/i })).toBeInTheDocument();
    }, { timeout: 3000 });

    // Esperar a que FoodSearchAndAdd se cargue (lazy load) y buscar el input
    await waitFor(() => {
      const searchInput = screen.queryByPlaceholderText(/buscar alimento/i);
      expect(searchInput).toBeInTheDocument();
    }, { timeout: 10000 });

    const searchInput = screen.getByPlaceholderText(/buscar alimento/i);
    expect(searchInput).toBeInTheDocument();
    
    // Verificar que el componente está interactivo
    expect(searchInput).not.toBeDisabled();
    
    // Verificar que hay un log configurado (necesario para añadir alimentos)
    const logState = useTodayLogStore.getState();
    expect(logState.log).toBeTruthy();
    expect(logState.log.log_id).toBe(1);
  });
});

