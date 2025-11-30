import { describe, it, expect, beforeEach, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../mocks/server';
import useUserStore from '../../stores/useUserStore';
import api from '../../services/api';

describe('Refresh Token Integration Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    useUserStore.getState().logout();
  });

  it('debe refrescar token automáticamente cuando expira', async () => {
    // Configurar token inicial
    localStorage.setItem('userToken', 'expired-token');
    localStorage.setItem('refreshToken', 'valid-refresh-token');

    // Mock de respuesta 401 seguida de refresh exitoso
    let requestCount = 0;
    server.use(
      http.get('http://localhost:4000/api/profile', () => {
        requestCount++;
        if (requestCount === 1) {
          // Primera llamada falla con 401
          return HttpResponse.json(
            { error: 'Token expirado' },
            { status: 401 }
          );
        }
        // Segunda llamada después del refresh
        return HttpResponse.json({
          profile: { id: 1, email: 'test@example.com' },
        });
      }),
      http.post('http://localhost:4000/api/auth/refresh', () => {
        return HttpResponse.json({
          token: 'new-access-token',
        });
      })
    );

    // Intentar cargar usuario
    await useUserStore.getState().loadUser();

    // Verificar que se guardó el nuevo token
    await new Promise(resolve => setTimeout(resolve, 100));
    expect(localStorage.getItem('userToken')).toBe('new-access-token');
  });

  it('debe hacer logout si el refresh token es inválido', async () => {
    localStorage.setItem('userToken', 'expired-token');
    localStorage.setItem('refreshToken', 'invalid-token');

    server.use(
      http.get('http://localhost:4000/api/profile', () => {
        return HttpResponse.json(
          { error: 'Token expirado' },
          { status: 401 }
        );
      }),
      http.post('http://localhost:4000/api/auth/refresh', () => {
        return HttpResponse.json(
          { error: 'Token inválido o expirado.' },
          { status: 401 }
        );
      })
    );

    await useUserStore.getState().loadUser();

    // Verificar que se limpió el localStorage
    await new Promise(resolve => setTimeout(resolve, 100));
    expect(localStorage.getItem('userToken')).toBeNull();
    expect(localStorage.getItem('refreshToken')).toBeNull();
    expect(useUserStore.getState().user).toBeNull();
  });
});

