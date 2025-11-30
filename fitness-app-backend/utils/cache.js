/**
 * Sistema de Cache para Consultas Frecuentes
 * Usa node-cache para cachear resultados de consultas comunes
 */

const NodeCache = require('node-cache');

// Crear instancia de cache con configuración por defecto
// stdTTL: tiempo de vida por defecto en segundos (10 minutos)
// checkperiod: intervalo para verificar expiración (1 minuto)
const cache = new NodeCache({
  stdTTL: 600, // 10 minutos por defecto
  checkperiod: 60, // Verificar cada minuto
  useClones: false, // No clonar objetos (mejor performance)
});

/**
 * Wrapper para cachear resultados de funciones async
 * @param {string} key - Clave única para el cache
 * @param {Function} fn - Función async a ejecutar
 * @param {number} ttl - Tiempo de vida en segundos (opcional)
 * @returns {Promise} - Resultado de la función o del cache
 */
async function getOrSetCache(key, fn, ttl = null) {
  // Intentar obtener del cache
  const cached = cache.get(key);
  if (cached !== undefined) {
    return cached;
  }

  // Si no está en cache, ejecutar la función
  const result = await fn();
  
  // Guardar en cache con TTL personalizado o por defecto
  if (ttl) {
    cache.set(key, result, ttl);
  } else {
    cache.set(key, result);
  }

  return result;
}

/**
 * Invalidar una clave específica del cache
 * @param {string} key - Clave a invalidar
 */
function invalidateCache(key) {
  cache.del(key);
}

/**
 * Invalidar múltiples claves que coincidan con un patrón
 * @param {string} pattern - Patrón a buscar (ej: 'exercises:*')
 */
function invalidateCachePattern(pattern) {
  const keys = cache.keys();
  const regex = new RegExp(pattern.replace('*', '.*'));
  keys.forEach(key => {
    if (regex.test(key)) {
      cache.del(key);
    }
  });
}

/**
 * Limpiar todo el cache
 */
function clearCache() {
  cache.flushAll();
}

/**
 * Obtener estadísticas del cache
 */
function getCacheStats() {
  return cache.getStats();
}

module.exports = {
  getOrSetCache,
  invalidateCache,
  invalidateCachePattern,
  clearCache,
  getCacheStats,
  cache, // Exportar la instancia para uso directo si es necesario
};

