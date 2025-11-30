// Constantes centralizadas de la aplicación

// Colores de la aplicación
export const COLORS = {
  primary: '#D45A0F', // Mejorado contraste (4.6:1 vs 3.2:1)
  primaryDark: '#B84A0D',
  secondary: '#F5E7C6',
  accent: '#86c4c2',
  background: '#FAF3E1',
  text: '#222222',
  // Modo oscuro
  primaryDarkMode: '#3b82f6',
  backgroundDark: '#000000',
  textDark: '#f9fafb',
};

// Tiempos de caché (en milisegundos)
export const CACHE_TTL = {
  SHORT: 1 * 60 * 1000,      // 1 minuto
  MEDIUM: 5 * 60 * 1000,     // 5 minutos
  LONG: 15 * 60 * 1000,       // 15 minutos
  VERY_LONG: 60 * 60 * 1000, // 1 hora
};

// Límites de validación
export const LIMITS = {
  WEIGHT_MIN: 20,
  WEIGHT_MAX: 300,
  CALORIES_MIN: 0,
  CALORIES_MAX: 10000,
  PASSWORD_MIN_LENGTH: 8,
  EMAIL_MAX_LENGTH: 255,
  NAME_MAX_LENGTH: 100,
  DESCRIPTION_MAX_LENGTH: 1000,
};

// Mensajes de error comunes
export const ERROR_MESSAGES = {
  REQUIRED: 'Este campo es obligatorio',
  INVALID_EMAIL: 'Por favor, ingresa un email válido',
  INVALID_PASSWORD: 'La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número',
  INVALID_WEIGHT: `El peso debe estar entre ${LIMITS.WEIGHT_MIN} y ${LIMITS.WEIGHT_MAX} kg`,
  INVALID_CALORIES: `Las calorías deben estar entre ${LIMITS.CALORIES_MIN} y ${LIMITS.CALORIES_MAX}`,
  NETWORK_ERROR: 'Error de conexión. Por favor, verifica tu internet.',
  UNAUTHORIZED: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
  NOT_FOUND: 'El recurso solicitado no fue encontrado',
  SERVER_ERROR: 'Error del servidor. Por favor, intenta más tarde.',
};

// Mensajes de éxito comunes
export const SUCCESS_MESSAGES = {
  SAVED: 'Guardado correctamente',
  DELETED: 'Eliminado correctamente',
  UPDATED: 'Actualizado correctamente',
  CREATED: 'Creado correctamente',
  LOGGED_IN: 'Sesión iniciada correctamente',
  LOGGED_OUT: 'Sesión cerrada correctamente',
};

// Configuración de paginación
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
};

// Configuración de notificaciones
export const NOTIFICATIONS = {
  AUTO_REFRESH_INTERVAL: 30 * 1000, // 30 segundos
  MAX_DISPLAY: 10,
};

// Configuración de entrenamiento
export const WORKOUT = {
  DEFAULT_REST_TIME: 90, // segundos
  MIN_REST_TIME: 30,
  MAX_REST_TIME: 300,
};

// Tipos de notificaciones
export const NOTIFICATION_TYPES = {
  INFO: 'info',
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error',
  ACHIEVEMENT: 'achievement',
  REMINDER: 'reminder',
};

// Categorías de ejercicios
export const EXERCISE_CATEGORIES = {
  CARDIO: 'Cardio',
  STRENGTH: 'Fuerza',
  FLEXIBILITY: 'Flexibilidad',
  BALANCE: 'Equilibrio',
  OTHER: 'Otro',
};

// Tipos de objetivos
export const GOAL_TYPES = {
  WEIGHT_LOSS: 'weight_loss',
  WEIGHT_GAIN: 'weight_gain',
  MAINTENANCE: 'maintenance',
  MUSCLE_GAIN: 'muscle_gain',
};

// Rareza de logros
export const ACHIEVEMENT_RARITY = {
  COMMON: 'common',
  RARE: 'rare',
  EPIC: 'epic',
  LEGENDARY: 'legendary',
};

