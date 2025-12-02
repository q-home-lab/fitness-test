/**
 * Wrapper para manejar errores async en rutas
 * Evita tener que usar try-catch en cada ruta
 * Los errores se capturan automáticamente y se pasan al errorHandler
 */

/**
 * Envuelve una función async para capturar errores automáticamente
 * @param {Function} fn - Función async a envolver
 * @returns {Function} - Función middleware que captura errores
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    // Ejecutar la función y capturar cualquier error
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = asyncHandler;

