/**
 * Validador de Variables de Entorno
 * Valida que todas las variables críticas estén definidas al iniciar la aplicación
 */

require('dotenv').config();

const requiredEnvVars = {
  // Variables críticas que deben estar siempre definidas
  critical: [
    'DATABASE_URL',
    'JWT_SECRET',
  ],
  // Variables opcionales pero recomendadas
  recommended: [
    'PORT',
    'FRONTEND_URL',
    'NODE_ENV',
  ],
};

/**
 * Valida que las variables de entorno requeridas estén definidas
 * @throws {Error} Si alguna variable crítica falta
 */
function validateEnvVars() {
  const missing = [];
  const warnings = [];

  // Validar variables críticas
  requiredEnvVars.critical.forEach(varName => {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  });

  // Validar variables recomendadas
  requiredEnvVars.recommended.forEach(varName => {
    if (!process.env[varName]) {
      warnings.push(varName);
    }
  });

  // Lanzar error si faltan variables críticas
  if (missing.length > 0) {
    throw new Error(
      `❌ Variables de entorno críticas faltantes: ${missing.join(', ')}\n` +
      `Por favor, configura estas variables en tu archivo .env`
    );
  }

  // Mostrar advertencias para variables recomendadas
  if (warnings.length > 0 && process.env.NODE_ENV !== 'test') {
    console.warn(
      `⚠️  Variables de entorno recomendadas no definidas: ${warnings.join(', ')}\n` +
      `La aplicación funcionará con valores por defecto, pero se recomienda configurarlas.`
    );
  }

  // Validaciones específicas
  validateJWTSecret();
  validateDatabaseURL();
  validatePort();

  if (missing.length === 0 && warnings.length === 0) {
    console.log('✅ Todas las variables de entorno validadas correctamente');
  }
}

/**
 * Valida que JWT_SECRET tenga una longitud mínima segura
 */
function validateJWTSecret() {
  const jwtSecret = process.env.JWT_SECRET;
  if (jwtSecret && jwtSecret.length < 32) {
    console.warn(
      '⚠️  JWT_SECRET es demasiado corto. Se recomienda al menos 32 caracteres para mayor seguridad.'
    );
  }
}

/**
 * Valida el formato básico de DATABASE_URL
 */
function validateDatabaseURL() {
  const dbUrl = process.env.DATABASE_URL;
  if (dbUrl && !dbUrl.startsWith('postgresql://') && !dbUrl.startsWith('postgres://')) {
    console.warn(
      '⚠️  DATABASE_URL no parece tener el formato correcto. Debe comenzar con postgresql:// o postgres://'
    );
  }
}

/**
 * Valida que PORT sea un número válido
 */
function validatePort() {
  const port = process.env.PORT;
  if (port && (isNaN(parseInt(port)) || parseInt(port) < 1 || parseInt(port) > 65535)) {
    throw new Error('PORT debe ser un número entre 1 y 65535');
  }
}

module.exports = {
  validateEnvVars,
};

