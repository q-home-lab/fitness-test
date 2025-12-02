/**
 * Rate Limiting Middleware
 * Protege las rutas contra ataques de fuerza bruta y abuso
 */

const rateLimit = require('express-rate-limit');

// Rate limiter para autenticación (más restrictivo)
// En modo test, aumentar el límite para evitar bloqueos durante las pruebas
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: process.env.NODE_ENV === 'test' ? 1000 : 5, // Muchos más intentos en modo test
  message: {
    error: 'Demasiados intentos de autenticación. Por favor, intenta de nuevo en 15 minutos.',
  },
  standardHeaders: true, // Retorna rate limit info en headers `RateLimit-*`
  legacyHeaders: false, // Desactiva headers `X-RateLimit-*`
  skipSuccessfulRequests: false, // Contar todos los requests, incluso los exitosos
  skipFailedRequests: false, // Contar también los requests fallidos
});

// Rate limiter general (menos restrictivo)
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // 100 requests por ventana de tiempo
  message: {
    error: 'Demasiadas solicitudes. Por favor, intenta de nuevo más tarde.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter para recuperación de contraseña (muy restrictivo)
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 3, // Solo 3 intentos por hora
  message: {
    error: 'Demasiados intentos de recuperación de contraseña. Por favor, intenta de nuevo en 1 hora.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter para creación de recursos (moderado)
const createLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 20, // 20 creaciones por ventana de tiempo
  message: {
    error: 'Demasiadas creaciones. Por favor, intenta de nuevo más tarde.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter para rutas de administración (muy restrictivo)
const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 50, // 50 requests por ventana de tiempo
  message: {
    error: 'Demasiadas solicitudes de administración. Por favor, intenta de nuevo más tarde.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter para rutas de coach (moderado)
const coachLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // 100 requests por ventana de tiempo
  message: {
    error: 'Demasiadas solicitudes. Por favor, intenta de nuevo más tarde.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter para mensajes (prevenir spam)
const messagesLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 10, // 10 mensajes por minuto
  message: {
    error: 'Demasiados mensajes. Por favor, espera un momento antes de enviar otro.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  authLimiter,
  generalLimiter,
  passwordResetLimiter,
  createLimiter,
  adminLimiter,
  coachLimiter,
  messagesLimiter,
};

