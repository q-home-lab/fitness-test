/**
 * Middleware de Validación Centralizada
 * Usa express-validator para validar requests
 */

const { body, param, query, validationResult } = require('express-validator');

/**
 * Middleware que ejecuta las validaciones y retorna errores si hay
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    // Formatear errores de manera más amigable
    const errorMessages = errors.array().map(err => err.msg);
    const firstError = errorMessages[0] || 'Error de validación';
    
    return res.status(400).json({
      error: firstError,
      details: errors.array().map(err => ({
        field: err.path || err.param,
        message: err.msg,
        value: err.value,
      })),
    });
  }
  
  next();
};

// Validaciones comunes reutilizables
const commonValidations = {
  email: body('email')
    .trim()
    .isEmail()
    .withMessage('Debe ser un email válido')
    .normalizeEmail(),
  
  password: body('password')
    .isLength({ min: 8, max: 128 })
    .withMessage('La contraseña debe tener entre 8 y 128 caracteres')
    .matches(/[A-Z]/)
    .withMessage('La contraseña debe contener al menos una letra mayúscula')
    .matches(/[a-z]/)
    .withMessage('La contraseña debe contener al menos una letra minúscula')
    .matches(/\d/)
    .withMessage('La contraseña debe contener al menos un número')
    .matches(/[@$!%*?&]/)
    .withMessage('La contraseña debe contener al menos un carácter especial (@$!%*?&)')
    .not()
    .matches(/\s/)
    .withMessage('La contraseña no puede contener espacios'),
  
  positiveNumber: (fieldName) => body(fieldName)
    .optional()
    .isFloat({ min: 0 })
    .withMessage(`${fieldName} debe ser un número positivo`),
  
  requiredString: (fieldName, minLength = 1, maxLength = 255) => body(fieldName)
    .trim()
    .notEmpty()
    .withMessage(`${fieldName} es requerido`)
    .isLength({ min: minLength, max: maxLength })
    .withMessage(`${fieldName} debe tener entre ${minLength} y ${maxLength} caracteres`),
  
  optionalString: (fieldName, maxLength = 255) => body(fieldName)
    .optional()
    .trim()
    .isLength({ max: maxLength })
    .withMessage(`${fieldName} no puede tener más de ${maxLength} caracteres`),
  
  integerId: (paramName) => param(paramName)
    .isInt({ min: 1 })
    .withMessage(`${paramName} debe ser un número entero positivo`),
  
  date: (fieldName) => body(fieldName)
    .isISO8601()
    .withMessage(`${fieldName} debe ser una fecha válida en formato ISO (YYYY-MM-DD)`),
  
  pagination: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('page debe ser un número entero mayor a 0'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('limit debe ser un número entre 1 y 100'),
  ],
};

// Validaciones específicas para rutas
const routeValidations = {
  register: [
    commonValidations.email,
    commonValidations.password,
  ],
  
  login: [
    commonValidations.email,
    body('password').notEmpty().withMessage('La contraseña es requerida'),
  ],
  
  forgotPassword: [
    commonValidations.email,
  ],
  
  resetPassword: [
    commonValidations.email,
    body('token').trim().notEmpty().withMessage('El token es requerido'),
    commonValidations.password,
  ],
  
  createFood: [
    commonValidations.requiredString('name', 2, 100),
    body('calories_base')
      .isFloat({ min: 0 })
      .withMessage('calories_base debe ser un número positivo'),
    commonValidations.positiveNumber('protein_g'),
    commonValidations.positiveNumber('carbs_g'),
    commonValidations.positiveNumber('fat_g'),
  ],
  
  createExercise: [
    commonValidations.requiredString('name', 2, 100),
    body('category')
      .isIn(['Cardio', 'Fuerza', 'Híbrido'])
      .withMessage('category debe ser uno de: Cardio, Fuerza, Híbrido'),
    commonValidations.positiveNumber('default_calories_per_minute'),
    commonValidations.optionalString('gif_url', 500),
    commonValidations.optionalString('video_url', 500),
  ],
  
  createRoutine: [
    commonValidations.requiredString('name', 1, 100),
    commonValidations.optionalString('description', 255),
  ],
  
  createGoal: [
    body('target_weight')
      .isFloat({ min: 20, max: 300 })
      .withMessage('target_weight debe ser un número entre 20 y 300 kg'),
    body('current_weight')
      .isFloat({ min: 20, max: 300 })
      .withMessage('current_weight debe ser un número entre 20 y 300 kg'),
    body('goal_type')
      .optional()
      .isIn(['weight_loss', 'weight_gain', 'maintain'])
      .withMessage('goal_type debe ser uno de: weight_loss, weight_gain, maintain'),
  ],
  
  logWeight: [
    commonValidations.date('date'),
    body('weight')
      .isFloat({ min: 20, max: 300 })
      .withMessage('weight debe ser un número entre 20 y 300 kg'),
  ],
};

module.exports = {
  handleValidationErrors,
  commonValidations,
  routeValidations,
};

