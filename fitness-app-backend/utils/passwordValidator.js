/**
 * Validador de Fortaleza de Contraseñas
 * Valida que las contraseñas cumplan con requisitos de seguridad
 */

/**
 * Valida la fortaleza de una contraseña
 * @param {string} password - Contraseña a validar
 * @returns {Object} - { valid: boolean, errors: string[] }
 */
function validatePasswordStrength(password) {
  const errors = [];
  
  if (!password) {
    return { valid: false, errors: ['La contraseña es requerida'] };
  }

  // Longitud mínima
  if (password.length < 8) {
    errors.push('La contraseña debe tener al menos 8 caracteres');
  }

  // Longitud máxima razonable
  if (password.length > 128) {
    errors.push('La contraseña no puede tener más de 128 caracteres');
  }

  // Al menos una letra mayúscula
  if (!/[A-Z]/.test(password)) {
    errors.push('La contraseña debe contener al menos una letra mayúscula');
  }

  // Al menos una letra minúscula
  if (!/[a-z]/.test(password)) {
    errors.push('La contraseña debe contener al menos una letra minúscula');
  }

  // Al menos un número
  if (!/\d/.test(password)) {
    errors.push('La contraseña debe contener al menos un número');
  }

  // Al menos un carácter especial
  if (!/[@$!%*?&]/.test(password)) {
    errors.push('La contraseña debe contener al menos un carácter especial (@$!%*?&)');
  }

  // No debe contener espacios
  if (/\s/.test(password)) {
    errors.push('La contraseña no puede contener espacios');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Genera un mensaje de error amigable para el usuario
 * @param {string[]} errors - Array de errores
 * @returns {string} - Mensaje formateado
 */
function formatPasswordErrors(errors) {
  if (errors.length === 0) return '';
  
  if (errors.length === 1) {
    return errors[0];
  }
  
  return `La contraseña no cumple con los requisitos: ${errors.join(', ')}`;
}

module.exports = {
  validatePasswordStrength,
  formatPasswordErrors,
};

