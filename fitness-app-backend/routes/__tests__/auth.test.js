const request = require('supertest');
const express = require('express');
const authRoutes = require('../auth');
const { db } = require('../../db/db_config');

// Mock de la base de datos
jest.mock('../../db/db_config', () => ({
  db: {
    select: jest.fn(),
    insert: jest.fn(),
  },
}));

// Mock de verifyRecaptcha
jest.mock('../../utils/recaptcha', () => ({
  verifyRecaptcha: jest.fn().mockResolvedValue({ success: true, score: 0.9 }),
}));

// Mock de bcrypt
jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed_password'),
  compare: jest.fn().mockResolvedValue(true),
}));

// Mock de jwt
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockReturnValue('mock_jwt_token'),
}));

// Mock de passwordValidator
jest.mock('../../utils/passwordValidator', () => ({
  validatePasswordStrength: jest.fn().mockReturnValue({ valid: true, errors: [] }),
  formatPasswordErrors: jest.fn().mockReturnValue('Error de contraseña'),
}));

// Mock de logger
jest.mock('../../utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

// Mock de middleware de validación
jest.mock('../../middleware/validation', () => ({
  routeValidations: {
    register: (req, res, next) => next(), // Pasa la validación
    login: (req, res, next) => next(), // Pasa la validación
    forgotPassword: (req, res, next) => next(), // Pasa la validación
    resetPassword: (req, res, next) => next(), // Pasa la validación
  },
  handleValidationErrors: (req, res, next) => next(), // No hay errores de validación
}));


const app = express();
app.use(express.json());
app.use('/auth', authRoutes);

describe('Auth Routes', () => {
  const bcrypt = require('bcrypt');
  const jwt = require('jsonwebtoken');
  const { validatePasswordStrength } = require('../../utils/passwordValidator');

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.RECAPTCHA_SECRET_KEY = 'test_secret';
    // Resetear mocks por defecto
    bcrypt.hash.mockResolvedValue('hashed_password');
    bcrypt.compare.mockResolvedValue(true);
    jwt.sign.mockReturnValue('mock_jwt_token');
    validatePasswordStrength.mockReturnValue({ valid: true, errors: [] });
  });

  describe('POST /auth/register', () => {
    it('debe registrar un nuevo usuario correctamente', async () => {
      // Mock: usuario no existe
      db.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValueOnce({
          where: jest.fn().mockResolvedValueOnce([]),
        }),
      });

      // Mock: inserción exitosa
      // El código usa .returning({ id: users.user_id, email: users.email })
      db.insert.mockReturnValueOnce({
        values: jest.fn().mockReturnValueOnce({
          returning: jest.fn().mockResolvedValueOnce([{
            id: 1,
            email: 'test@example.com',
          }]),
        }),
      });

      const response = await request(app)
        .post('/auth/register')
        .send({
          email: 'test@example.com',
          password: 'Password123',
          recaptchaToken: 'test_token',
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
    });

    it('debe rechazar registro con email existente', async () => {
      jest.clearAllMocks();
      db.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValueOnce({
          where: jest.fn().mockResolvedValueOnce([{
            user_id: 1,
            email: 'test@example.com',
          }]),
        }),
      });

      const response = await request(app)
        .post('/auth/register')
        .send({
          email: 'test@example.com',
          password: 'Password123',
          recaptchaToken: 'test_token',
        });

      expect(response.status).toBe(409);
      expect(response.body).toHaveProperty('error');
    });

    it('debe validar fortaleza de contraseña', async () => {
      // Mock: validación de contraseña falla
      validatePasswordStrength.mockReturnValueOnce({ 
        valid: false, 
        errors: ['La contraseña debe tener al menos 8 caracteres'] 
      });

      const response = await request(app)
        .post('/auth/register')
        .send({
          email: 'test@example.com',
          password: 'weak',
          recaptchaToken: 'test_token',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /auth/login', () => {
    it('debe hacer login correctamente con credenciales válidas', async () => {
      jest.clearAllMocks();
      // Configurar mocks
      bcrypt.compare.mockResolvedValueOnce(true);
      jwt.sign.mockReturnValueOnce('mock_access_token');
      jwt.sign.mockReturnValueOnce('mock_refresh_token');
      
      db.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValueOnce({
          where: jest.fn().mockReturnValueOnce({
            limit: jest.fn().mockResolvedValueOnce([{
              user_id: 1,
              email: 'test@example.com',
              password_hash: 'hashed_Password123',
              is_admin: false,
              onboarding_completed: false,
              onboarding_step: 0,
            }]),
          }),
        }),
      });

      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Password123',
          recaptchaToken: 'test_token',
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
    });

    it('debe rechazar login con credenciales inválidas', async () => {
      jest.clearAllMocks();
      // Mock: usuario no encontrado (array vacío)
      db.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValueOnce({
          where: jest.fn().mockReturnValueOnce({
            limit: jest.fn().mockResolvedValueOnce([]),
          }),
        }),
      });

      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'WrongPassword',
          recaptchaToken: 'test_token',
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });
  });
});

