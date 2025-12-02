/**
 * Monitor de Performance
 * Tracking de métricas de rendimiento del backend
 */

const logger = require('./logger');

class PerformanceMonitor {
  constructor() {
    this.metrics = {
      requests: 0,
      errors: 0,
      slowRequests: [],
      averageResponseTime: 0,
      responseTimes: [],
    };
    
    this.startTime = Date.now();
  }

  /**
   * Registrar una request
   */
  recordRequest(responseTime, statusCode) {
    this.metrics.requests++;
    this.metrics.responseTimes.push(responseTime);
    
    // Mantener solo los últimos 1000 tiempos
    if (this.metrics.responseTimes.length > 1000) {
      this.metrics.responseTimes.shift();
    }
    
    // Calcular promedio
    const sum = this.metrics.responseTimes.reduce((a, b) => a + b, 0);
    this.metrics.averageResponseTime = sum / this.metrics.responseTimes.length;
    
    // Registrar requests lentas (>1s)
    if (responseTime > 1000) {
      this.metrics.slowRequests.push({
        responseTime,
        statusCode,
        timestamp: new Date(),
      });
      
      // Mantener solo las últimas 100 requests lentas
      if (this.metrics.slowRequests.length > 100) {
        this.metrics.slowRequests.shift();
      }
      
      logger.warn(`Slow request detected: ${responseTime}ms`, {
        responseTime,
        statusCode,
      });
    }
    
    // Registrar errores
    if (statusCode >= 400) {
      this.metrics.errors++;
    }
  }

  /**
   * Obtener métricas actuales
   */
  getMetrics() {
    const uptime = Date.now() - this.startTime;
    
    return {
      ...this.metrics,
      uptime: Math.floor(uptime / 1000), // en segundos
      errorRate: this.metrics.requests > 0 
        ? (this.metrics.errors / this.metrics.requests * 100).toFixed(2) + '%'
        : '0%',
      requestsPerSecond: this.metrics.requests > 0
        ? (this.metrics.requests / (uptime / 1000)).toFixed(2)
        : '0',
    };
  }

  /**
   * Resetear métricas
   */
  reset() {
    this.metrics = {
      requests: 0,
      errors: 0,
      slowRequests: [],
      averageResponseTime: 0,
      responseTimes: [],
    };
    this.startTime = Date.now();
  }
}

// Singleton
const performanceMonitor = new PerformanceMonitor();

module.exports = performanceMonitor;

