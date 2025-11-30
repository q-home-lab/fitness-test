import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ErrorMessage from '../ErrorMessage';

describe('ErrorMessage', () => {
  it('debe renderizar el mensaje de error', () => {
    render(<ErrorMessage message="Error de prueba" />);
    expect(screen.getByText('Error de prueba')).toBeInTheDocument();
  });

  it('debe tener role="alert" para accesibilidad', () => {
    render(<ErrorMessage message="Error" />);
    const alert = screen.getByRole('alert');
    expect(alert).toBeInTheDocument();
  });

  it('debe mostrar botón de reintentar cuando se proporciona onRetry', () => {
    const onRetry = vi.fn();
    render(<ErrorMessage message="Error" onRetry={onRetry} />);
    
    const retryButton = screen.getByText('Reintentar');
    expect(retryButton).toBeInTheDocument();
    
    // Simular click
    retryButton.click();
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('debe aplicar variante inline correctamente', () => {
    const { container } = render(<ErrorMessage message="Error" variant="inline" />);
    expect(container.querySelector('.text-sm')).toBeInTheDocument();
  });

  it('debe aplicar variante banner correctamente', () => {
    render(<ErrorMessage message="Error" variant="banner" />);
    const alert = screen.getByRole('alert');
    expect(alert).toBeInTheDocument();
  });
});

