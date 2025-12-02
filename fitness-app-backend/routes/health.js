/**
 * Rutas de Health Check
 * Endpoints para verificar el estado del servidor y servicios
 */

const express = require('express');
const router = express.Router();
const { checkDatabaseHealth } = require('../db/db_config');
const logger = require('../utils/logger');
const performanceMonitor = require('../utils/performanceMonitor');

/**
 * Formatea el uptime en formato legible
 */
function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);
  
  return parts.join(' ');
}

/**
 * GET /api/health
 * Health check completo con información detallada
 */
router.get('/', async (req, res) => {
  const startTime = Date.now();
  
  try {
    // Verificar base de datos
    const dbHealth = await checkDatabaseHealth();
    
    // Verificar memoria
    const memoryUsage = process.memoryUsage();
    const memoryMB = {
      rss: Math.round(memoryUsage.rss / 1024 / 1024),
      heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
      heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      external: Math.round(memoryUsage.external / 1024 / 1024),
    };
    
    // Verificar uptime
    const uptime = process.uptime();
    
    const responseTime = Date.now() - startTime;
    
    const health = {
      status: dbHealth.healthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: {
        seconds: Math.floor(uptime),
        human: formatUptime(uptime),
      },
      database: dbHealth,
      memory: memoryMB,
      responseTime: `${responseTime}ms`,
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      nodeVersion: process.version,
    };
    
    const statusCode = dbHealth.healthy ? 200 : 503;
    res.status(statusCode).json(health);
  } catch (error) {
    logger.error('Error en health check:', error);
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * GET /api/health/ready
 * Readiness probe - verifica si la aplicación está lista para recibir tráfico
 * Usado por orquestadores como Kubernetes
 */
router.get('/ready', async (req, res) => {
  try {
    const dbHealth = await checkDatabaseHealth();
    if (dbHealth.healthy) {
      res.status(200).json({ 
        ready: true,
        timestamp: new Date().toISOString(),
      });
    } else {
      res.status(503).json({ 
        ready: false, 
        reason: 'Database unavailable',
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    logger.error('Error en readiness check:', error);
    res.status(503).json({ 
      ready: false, 
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * GET /api/health/live
 * Liveness probe - verifica si la aplicación está viva
 * Usado por orquestadores como Kubernetes
 */
router.get('/live', (req, res) => {
  res.status(200).json({ 
    alive: true, 
    timestamp: new Date().toISOString(),
  });
});

/**
 * GET /api/health/metrics
 * Métricas de performance de la aplicación
 * Requiere autenticación de admin en producción
 */
router.get('/metrics', (req, res) => {
  // En producción, verificar que sea admin
  if (process.env.NODE_ENV === 'production' && req.user?.role !== 'ADMIN') {
    return res.status(403).json({ 
      error: 'Acceso denegado',
      timestamp: new Date().toISOString(),
    });
  }

  const metrics = performanceMonitor.getMetrics();
  res.status(200).json({
    ...metrics,
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;

