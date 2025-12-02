/**
 * Sistema de logging para el frontend
 * Reemplaza console.log con un sistema más robusto
 * En producción, solo muestra warnings y errores
 */

const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
};

class Logger {
  constructor() {
    // En producción solo mostrar warnings y errores
    this.level = import.meta.env.PROD ? LOG_LEVELS.WARN : LOG_LEVELS.DEBUG;
    this.enableRemoteLogging = 
      import.meta.env.PROD && 
      import.meta.env.VITE_ENABLE_REMOTE_LOGGING === 'true';
  }

  shouldLog(level) {
    return level >= this.level;
  }

  formatMessage(level, message, ...args) {
    const timestamp = new Date().toISOString();
    const levelName = Object.keys(LOG_LEVELS).find(
      key => LOG_LEVELS[key] === level
    );
    return `[${timestamp}] [${levelName}] ${message}`;
  }

  sendToRemote(level, message, ...args) {
    if (!this.enableRemoteLogging) return;

    // Enviar a servicio de logging remoto (Sentry, LogRocket, etc.)
    try {
      // Ejemplo con fetch (ajustar según tu servicio)
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
      fetch(`${apiUrl}/logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          level,
          message,
          args: args.length > 0 ? JSON.stringify(args) : undefined,
          timestamp: new Date().toISOString(),
          url: typeof window !== 'undefined' ? window.location.href : '',
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
        }),
      }).catch(() => {
        // Silenciar errores de logging remoto
      });
    } catch (error) {
      // Silenciar errores
    }
  }

  debug(message, ...args) {
    if (!this.shouldLog(LOG_LEVELS.DEBUG)) return;
    const formatted = this.formatMessage(LOG_LEVELS.DEBUG, message);
    console.debug(formatted, ...args);
    this.sendToRemote(LOG_LEVELS.DEBUG, message, ...args);
  }

  info(message, ...args) {
    if (!this.shouldLog(LOG_LEVELS.INFO)) return;
    const formatted = this.formatMessage(LOG_LEVELS.INFO, message);
    console.info(formatted, ...args);
    this.sendToRemote(LOG_LEVELS.INFO, message, ...args);
  }

  warn(message, ...args) {
    if (!this.shouldLog(LOG_LEVELS.WARN)) return;
    const formatted = this.formatMessage(LOG_LEVELS.WARN, message);
    console.warn(formatted, ...args);
    this.sendToRemote(LOG_LEVELS.WARN, message, ...args);
  }

  error(message, ...args) {
    if (!this.shouldLog(LOG_LEVELS.ERROR)) return;
    const formatted = this.formatMessage(LOG_LEVELS.ERROR, message);
    console.error(formatted, ...args);
    this.sendToRemote(LOG_LEVELS.ERROR, message, ...args);

    // Enviar a Sentry si está configurado
    if (typeof window !== 'undefined' && window.Sentry) {
      window.Sentry.captureException(new Error(message), {
        extra: args,
      });
    }
  }
}

// Exportar instancia singleton
const logger = new Logger();

// Exportar también funciones individuales para compatibilidad
export const log = {
  debug: (...args) => logger.debug(...args),
  info: (...args) => logger.info(...args),
  warn: (...args) => logger.warn(...args),
  error: (...args) => logger.error(...args),
};

export default logger;

