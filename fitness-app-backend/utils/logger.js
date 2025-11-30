/**
 * Logger estructurado usando Winston
 * Reemplaza console.log/error/warn con logging estructurado
 */

const winston = require('winston');
const path = require('path');

// Definir niveles de log personalizados
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Colores para los logs en consola
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

winston.addColors(colors);

// Formato para logs en desarrollo (más legible)
const developmentFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize({ all: true }),
  winston.format.errors({ stack: true }),
  winston.format.splat(), // Permite interpolación de strings y objetos
  winston.format.printf((info) => {
    // Construir el mensaje base
    let message = `${info.timestamp} [${info.level}]: ${info.message}`;
    
    // Si hay metadata adicional (pasada como segundo parámetro), mostrarla
    if (info[Symbol.for('splat')] && info[Symbol.for('splat')].length > 0) {
      const meta = info[Symbol.for('splat')][0];
      if (meta && typeof meta === 'object') {
        message += '\n' + JSON.stringify(meta, null, 2);
      }
    }
    
    // Si hay stack trace, mostrarlo
    if (info.stack) {
      message += '\n' + info.stack;
    }
    
    return message;
  })
);

// Formato para logs en producción (JSON estructurado)
const productionFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Determinar qué formato usar según el entorno
const format = process.env.NODE_ENV === 'production' 
  ? productionFormat 
  : developmentFormat;

// Configurar transports (dónde se guardan los logs)
const transports = [
  // Logs de error en archivo separado
  new winston.transports.File({
    filename: path.join(__dirname, '../logs/error.log'),
    level: 'error',
    format: productionFormat,
  }),
  // Todos los logs en un archivo
  new winston.transports.File({
    filename: path.join(__dirname, '../logs/combined.log'),
    format: productionFormat,
  }),
];

// En desarrollo, también mostrar logs en consola
if (process.env.NODE_ENV !== 'production') {
  transports.push(
    new winston.transports.Console({
      format: developmentFormat,
    })
  );
}

// Crear el logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  levels,
  format,
  transports,
  // No salir del proceso si hay error al escribir logs
  exitOnError: false,
});

// Stream para usar con middleware de Express (morgan, etc.)
logger.stream = {
  write: (message) => {
    logger.http(message.trim());
  },
};

module.exports = logger;

