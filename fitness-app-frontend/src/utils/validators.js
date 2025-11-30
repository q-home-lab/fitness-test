// Utilidades de validación centralizadas

/**
 * Valida un email
 */
export const isValidEmail = (email) => {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Valida que un valor sea un número válido
 */
export const isValidNumber = (value, min = null, max = null) => {
  const num = parseFloat(value);
  if (isNaN(num)) return false;
  if (min !== null && num < min) return false;
  if (max !== null && num > max) return false;
  return true;
};

/**
 * Valida que un valor no esté vacío
 */
export const isNotEmpty = (value) => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return true;
};

/**
 * Valida un peso (kg)
 */
export const isValidWeight = (weight) => {
  return isValidNumber(weight, 20, 300); // Rango razonable: 20-300 kg
};

/**
 * Valida calorías
 */
export const isValidCalories = (calories) => {
  return isValidNumber(calories, 0, 10000); // Rango razonable: 0-10000 kcal
};

/**
 * Valida una fecha
 */
export const isValidDate = (date) => {
  if (!date) return false;
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return !isNaN(dateObj.getTime());
};

/**
 * Valida que una fecha no sea futura
 */
export const isNotFutureDate = (date) => {
  if (!isValidDate(date)) return false;
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj <= new Date();
};

/**
 * Valida una contraseña (mínimo 8 caracteres, al menos una mayúscula, una minúscula y un número)
 */
export const isValidPassword = (password) => {
  if (!password || password.length < 8) return false;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  return hasUpperCase && hasLowerCase && hasNumber;
};

/**
 * Valida una URL
 */
export const isValidUrl = (url) => {
  if (!url) return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

