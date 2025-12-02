/**
 * Helpers para testing del backend
 * Utilidades reutilizables para tests
 */

const jwt = require('jsonwebtoken');

/**
 * Crear un token JWT de prueba
 */
const createTestToken = (userId = 1, role = 'CLIENT') => {
  return jwt.sign(
    { id: userId, role, isAdmin: role === 'ADMIN' },
    process.env.JWT_SECRET || 'test-secret',
    { expiresIn: '1h' }
  );
};

/**
 * Crear headers de autenticación para tests
 */
const createAuthHeaders = (userId = 1, role = 'CLIENT') => {
  const token = createTestToken(userId, role);
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

/**
 * Mock de request con usuario autenticado
 */
const createMockRequest = (userId = 1, role = 'CLIENT', body = {}) => {
  return {
    user: { id: userId, role },
    body,
    params: {},
    query: {},
    headers: createAuthHeaders(userId, role),
  };
};

/**
 * Mock de response
 */
const createMockResponse = () => {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    setHeader: jest.fn().mockReturnThis(),
  };
  return res;
};

/**
 * Mock de next function
 */
const createMockNext = () => {
  return jest.fn();
};

module.exports = {
  createTestToken,
  createAuthHeaders,
  createMockRequest,
  createMockResponse,
  createMockNext,
};

