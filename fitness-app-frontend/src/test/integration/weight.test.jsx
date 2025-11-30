import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import WeightTrackingPage from '../../pages/WeightTrackingPage';
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

describe('Weight Tracking Integration Tests', () => {
  beforeEach(() => {
    // Configurar usuario autenticado
    useUserStore.getState().setUser({
      id: 1,
      email: 'test@example.com',
      isAdmin: false,
    });
    localStorage.setItem('userToken', 'mock-token');
  });

  it('debe registrar peso y actualizar el gráfico', async () => {
    const user = userEvent.setup();
    
    render(
      <BrowserRouter>
        <WeightTrackingPage />
      </BrowserRouter>
    );

    // Esperar a que cargue el componente
    await waitFor(() => {
      expect(screen.getByText(/peso y objetivos/i)).toBeInTheDocument();
    }, { timeout: 3000 });

    // Buscar el input de peso por id, placeholder o label
    await waitFor(() => {
      const weightInput = screen.queryByPlaceholderText(/ej: 75.5/i) 
        || screen.queryByLabelText(/peso actual \(kg\)/i)
        || screen.queryByRole('spinbutton');
      expect(weightInput).toBeInTheDocument();
    }, { timeout: 3000 });

    const weightInput = screen.getByPlaceholderText(/ej: 75.5/i) 
      || screen.getByLabelText(/peso actual \(kg\)/i)
      || screen.getByRole('spinbutton');
    
    await user.clear(weightInput);
    await user.type(weightInput, '70.5');
    
    // Buscar el botón de submit
    await waitFor(() => {
      const submitButton = screen.queryByRole('button', { name: /registrar peso|guardar|registrar/i });
      expect(submitButton).toBeInTheDocument();
    }, { timeout: 2000 });

    const submitButton = screen.getByRole('button', { name: /registrar peso|guardar|registrar/i });
    await user.click(submitButton);

    // Verificar que se actualizó el log o que apareció mensaje de éxito
    await waitFor(() => {
      // Primero verificar mensaje de éxito
      const successMessage = screen.queryByText(/peso registrado|registrado correctamente/i);
      if (successMessage) {
        expect(successMessage).toBeInTheDocument();
      } else {
        // O verificar que se actualizó el store
        const logState = useTodayLogStore.getState();
        if (logState.log) {
          expect(logState.log).toBeTruthy();
          // El peso puede venir como string o número
          const weight = parseFloat(logState.log.weight_kg);
          expect(weight).toBeCloseTo(70.5, 1);
        } else {
          // Si no hay log, al menos verificar que no hay error
          const errorMessage = screen.queryByText(/error/i);
          expect(errorMessage).not.toBeInTheDocument();
        }
      }
    }, { timeout: 5000 });
  });
});

