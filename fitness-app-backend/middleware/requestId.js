/**
 * Middleware para agregar Request ID a cada request
 * Útil para tracking y debugging en logs
 */

const crypto = require('crypto');

/**
 * Genera un UUID v4
 */
function generateUUID() {
  return crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex');
}

/**
 * Agrega un request ID único a cada request
 * El ID se incluye en los headers de respuesta y en los logs
 */
const requestIdMiddleware = (req, res, next) => {
  // Generar o usar request ID existente (útil para request chains)
  const requestId = req.headers['x-request-id'] || generateUUID();
  
  // Agregar al request para uso en otros middlewares
  req.id = requestId;
  
  // Agregar a los headers de respuesta
  res.setHeader('X-Request-ID', requestId);
  
  // Agregar al logger context si está disponible
  if (req.logger) {
    req.logger.defaultMeta = { ...req.logger.defaultMeta, requestId };
  }
  
  next();
};

module.exports = requestIdMiddleware;

