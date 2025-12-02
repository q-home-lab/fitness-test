/**
 * Middleware para medir y registrar tiempo de respuesta
 * Útil para monitoreo de performance
 */

const logger = require('../utils/logger');
const performanceMonitor = require('../utils/performanceMonitor');

/**
 * Middleware que mide el tiempo de respuesta de cada request
 * Agrega el tiempo en el header X-Response-Time
 */
const responseTimeMiddleware = (req, res, next) => {
  const startTime = Date.now();

  // Interceptar el método end para medir tiempo
  const originalEnd = res.end;
  res.end = function(...args) {
    const duration = Date.now() - startTime;
    
    // Solo agregar header si los headers aún no se han enviado
    if (!res.headersSent) {
      res.setHeader('X-Response-Time', `${duration}ms`);
    }
    
    // Registrar en el monitor de performance
    performanceMonitor.recordRequest(duration, res.statusCode);
    
    // Log tiempos lentos (más de 1 segundo)
    if (duration > 1000) {
      logger.warn('Request lento detectado:', {
        requestId: req.id || req.requestId,
        url: req.url,
        method: req.method,
        duration: `${duration}ms`,
        userId: req.user?.id,
      });
    }
    
    // Llamar al método original
    originalEnd.apply(this, args);
  };

  next();
};

module.exports = responseTimeMiddleware;

