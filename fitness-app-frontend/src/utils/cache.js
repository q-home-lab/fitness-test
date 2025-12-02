// Sistema de caché mejorado para API calls
// Implementa stale-while-revalidate pattern
// Usa localStorage para persistencia y Map para caché en memoria

class ApiCache {
  constructor() {
    this.memoryCache = new Map();
    this.maxMemorySize = 50; // Máximo de items en memoria
    this.defaultTTL = 5 * 60 * 1000; // 5 minutos por defecto
    this.staleTTL = 10 * 60 * 1000; // 10 minutos para considerar stale (stale-while-revalidate)
  }

  /**
   * Genera una clave de caché a partir de la URL y parámetros
   */
  generateKey(url, params = {}) {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}=${params[key]}`)
      .join('&');
    return `${url}${sortedParams ? `?${sortedParams}` : ''}`;
  }

  /**
   * Obtiene datos del caché
   * @param {string} key - Clave del caché
   * @returns {object | null} - Datos cacheados o null
   */
  get(key) {
    // Intentar desde memoria primero
    const memoryItem = this.memoryCache.get(key);
    if (memoryItem && this.isValid(memoryItem)) {
      return memoryItem.data;
    }

    // Intentar desde localStorage
    try {
      const stored = localStorage.getItem(`cache_${key}`);
      if (stored) {
        const item = JSON.parse(stored);
        if (this.isValid(item)) {
          // Mover a memoria para acceso más rápido
          this.setMemory(key, item.data, item.expires);
          return item.data;
        } else if (this.isStale(item)) {
          // Si está stale pero no expirado, devolverlo de todos modos (stale-while-revalidate)
          return item.data;
        } else {
          // Eliminar si expiró completamente
          localStorage.removeItem(`cache_${key}`);
        }
      }
    } catch (error) {
      // Usar logger si está disponible, sino console.warn
      if (typeof window !== 'undefined' && window.logger) {
        window.logger.warn('Error al leer del caché:', error);
      }
    }

    return null;
  }

  /**
   * Verifica si un item está stale (pasado el TTL pero dentro del staleTTL)
   * @param {object} item - Item del caché
   * @returns {boolean} - True si está stale
   */
  isStale(item) {
    if (!item || !item.expires) return false;
    const now = Date.now();
    const staleThreshold = item.expires + (this.staleTTL - this.defaultTTL);
    return now > item.expires && now < staleThreshold;
  }

  /**
   * Guarda datos en el caché
   * @param {string} key - Clave del caché
   * @param {any} data - Datos a cachear
   * @param {number} ttl - Tiempo de vida en milisegundos
   */
  set(key, data, ttl = this.defaultTTL) {
    const expires = Date.now() + ttl;
    const item = { data, expires };

    // Guardar en memoria
    this.setMemory(key, data, expires);

    // Guardar en localStorage
    try {
      localStorage.setItem(`cache_${key}`, JSON.stringify(item));
    } catch (error) {
      // Si localStorage está lleno, limpiar items antiguos
      if (error.name === 'QuotaExceededError') {
        this.cleanup();
        try {
          localStorage.setItem(`cache_${key}`, JSON.stringify(item));
        } catch (e) {
          console.warn('No se pudo guardar en caché:', e);
        }
      }
    }
  }

  /**
   * Guarda en memoria con límite de tamaño
   */
  setMemory(key, data, expires) {
    // Si el caché está lleno, eliminar el más antiguo
    if (this.memoryCache.size >= this.maxMemorySize) {
      const firstKey = this.memoryCache.keys().next().value;
      this.memoryCache.delete(firstKey);
    }
    this.memoryCache.set(key, { data, expires });
  }

  /**
   * Verifica si un item del caché es válido (no expirado)
   */
  isValid(item) {
    return item && item.expires > Date.now();
  }

  /**
   * Elimina un item del caché
   */
  delete(key) {
    this.memoryCache.delete(key);
    try {
      localStorage.removeItem(`cache_${key}`);
    } catch (error) {
      console.warn('Error al eliminar del caché:', error);
    }
  }

  /**
   * Limpia items expirados
   */
  cleanup() {
    // Limpiar memoria (isValid ya verifica la fecha de expiración)
    for (const [key, item] of this.memoryCache.entries()) {
      if (!this.isValid(item)) {
        this.memoryCache.delete(key);
      }
    }

    // Limpiar localStorage
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('cache_')) {
          try {
            const item = JSON.parse(localStorage.getItem(key));
            if (!this.isValid(item)) {
              localStorage.removeItem(key);
            }
          } catch {
            // Si hay error al parsear, eliminar (no necesitamos el error)
            localStorage.removeItem(key);
          }
        }
      });
    } catch (error) {
      console.warn('Error al limpiar caché:', error);
    }
  }

  /**
   * Limpia todo el caché
   */
  clear() {
    this.memoryCache.clear();
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('cache_')) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn('Error al limpiar caché:', error);
    }
  }

  /**
   * Invalida caché por patrón (útil para invalidar cuando se actualiza un recurso)
   */
  invalidatePattern(pattern) {
    const regex = new RegExp(pattern);

    // Limpiar memoria
    for (const key of this.memoryCache.keys()) {
      if (regex.test(key)) {
        this.memoryCache.delete(key);
      }
    }

    // Limpiar localStorage
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('cache_')) {
          const cacheKey = key.replace('cache_', '');
          if (regex.test(cacheKey)) {
            localStorage.removeItem(key);
          }
        }
      });
    } catch (error) {
      console.warn('Error al invalidar caché:', error);
    }
  }
}

// Instancia singleton
const apiCache = new ApiCache();

// Limpiar caché expirado cada 10 minutos
if (typeof window !== 'undefined') {
  setInterval(() => {
    apiCache.cleanup();
  }, 10 * 60 * 1000);
}

export default apiCache;

