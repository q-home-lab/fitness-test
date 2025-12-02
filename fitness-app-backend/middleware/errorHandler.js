/**
 * Middleware centralizado para manejo de errores
 * Captura todos los errores no manejados y devuelve respuestas consistentes
 */

const logger = require('../utils/logger');

/**
 * Middleware de manejo de errores
 * Debe ser el último middleware en la cadena
 */
const errorHandler = (err, req, res, next) => {
  // Log del error con contexto completo
  logger.error('Error en la aplicación:', {
    error: err.message,
    stack: err.stack,
    requestId: req.id, // Request ID para tracking
    url: req.url,
    method: req.method,
    userId: req.user?.id,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    body: process.env.NODE_ENV === 'development' ? req.body : undefined,
  });

  // Errores de validación (express-validator)
  if (err.name === 'ValidationError' || err.errors) {
    return res.status(400).json({
      error: 'Error de validación',
      details: err.errors || err.details || err.message,
    });
  }

  // Errores de autenticación/autorización
  if (err.name === 'UnauthorizedError' || err.status === 401) {
    return res.status(401).json({
      error: 'No autorizado',
      message: err.message || 'Token inválido o expirado',
    });
  }

  if (err.status === 403) {
    return res.status(403).json({
      error: 'Acceso denegado',
      message: err.message || 'No tienes permisos para realizar esta acción',
    });
  }

  // Errores de base de datos PostgreSQL
  if (err.code && err.code.startsWith('23')) {
    // 23505: unique_violation
    if (err.code === '23505') {
      return res.status(409).json({
        error: 'Conflicto',
        message: 'El recurso ya existe',
        details: process.env.NODE_ENV === 'development' ? err.detail : undefined,
      });
    }
    // 23503: foreign_key_violation
    if (err.code === '23503') {
      return res.status(400).json({
        error: 'Referencia inválida',
        message: 'La referencia especificada no existe',
        details: process.env.NODE_ENV === 'development' ? err.detail : undefined,
      });
    }
    // 23502: not_null_violation
    if (err.code === '23502') {
      return res.status(400).json({
        error: 'Campo requerido',
        message: 'Un campo requerido no puede ser nulo',
        details: process.env.NODE_ENV === 'development' ? err.detail : undefined,
      });
    }
  }

  // Errores de sintaxis SQL
  if (err.code === '42601' || err.code === '42P01') {
    return res.status(500).json({
      error: 'Error de base de datos',
      message: process.env.NODE_ENV === 'development' 
        ? err.message 
        : 'Error interno de la base de datos',
    });
  }

  // Errores de rate limiting
  if (err.status === 429) {
    return res.status(429).json({
      error: 'Demasiadas solicitudes',
      message: err.message || 'Has excedido el límite de solicitudes. Por favor, intenta más tarde.',
    });
  }

  // Error por defecto
  const statusCode = err.statusCode || err.status || 500;
  res.status(statusCode).json({
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'production' 
      ? 'Ha ocurrido un error. Por favor, intenta más tarde.'
      : err.message,
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
      details: {
        code: err.code,
        detail: err.detail,
        constraint: err.constraint,
      },
    }),
  });
};

module.exports = errorHandler;

