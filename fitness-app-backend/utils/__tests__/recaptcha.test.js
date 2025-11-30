const axios = require('axios');
const { verifyRecaptcha } = require('../recaptcha');

jest.mock('axios');
jest.mock('../logger', () => ({
  error: jest.fn(),
}));

describe('recaptcha utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.RECAPTCHA_SECRET_KEY = 'test_secret_key';
  });

  afterEach(() => {
    delete process.env.RECAPTCHA_SECRET_KEY;
  });

  describe('verifyRecaptcha', () => {
    it('debe verificar un token válido', async () => {
      axios.post.mockResolvedValueOnce({
        data: {
          success: true,
          score: 0.9,
          action: 'login',
        },
      });

      const result = await verifyRecaptcha('valid_token', 'login', 0.5);

      expect(result.success).toBe(true);
      expect(result.score).toBe(0.9);
      expect(axios.post).toHaveBeenCalledWith(
        'https://www.google.com/recaptcha/api/siteverify',
        null,
        {
          params: {
            secret: 'test_secret_key',
            response: 'valid_token',
          },
        }
      );
    });

    it('debe rechazar un token con score bajo', async () => {
      axios.post.mockResolvedValueOnce({
        data: {
          success: true,
          score: 0.3,
          action: 'login',
        },
      });

      const result = await verifyRecaptcha('low_score_token', 'login', 0.5);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Puntuación');
    });

    it('debe rechazar cuando Google rechaza el token', async () => {
      axios.post.mockResolvedValueOnce({
        data: {
          success: false,
          'error-codes': ['invalid-input-response'],
        },
      });

      const result = await verifyRecaptcha('invalid_token', 'login');

      expect(result.success).toBe(false);
      expect(result.error).toContain('reCAPTCHA falló');
    });

    it('debe validar que la acción coincida', async () => {
      axios.post.mockResolvedValueOnce({
        data: {
          success: true,
          score: 0.9,
          action: 'register',
        },
      });

      const result = await verifyRecaptcha('token', 'login', 0.5);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Acción no coincide');
    });

    it('debe permitir en desarrollo sin clave secreta', async () => {
      delete process.env.RECAPTCHA_SECRET_KEY;

      const result = await verifyRecaptcha('token', 'login');

      expect(result.success).toBe(true);
      expect(result.development).toBe(true);
      expect(axios.post).not.toHaveBeenCalled();
    });

    it('debe rechazar cuando no hay token', async () => {
      const result = await verifyRecaptcha(null, 'login');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Token de reCAPTCHA no proporcionado');
    });
  });
});

