// Utilidad para validar tokens de reCAPTCHA v3

const axios = require('axios');
const logger = require('./logger');

const RECAPTCHA_VERIFY_URL = 'https://www.google.com/recaptcha/api/siteverify';

/**
 * Verifica un token de reCAPTCHA v3
 * @param {string} token - Token de reCAPTCHA recibido del frontend
 * @param {string} action - Acción esperada (ej: 'login', 'register')
 * @param {number} minScore - Puntuación mínima aceptada (0.0 a 1.0, default 0.5)
 * @returns {Promise<{success: boolean, score?: number, error?: string}>}
 */
const verifyRecaptcha = async (token, action = null, minScore = 0.5) => {
    // Si no hay token, rechazar (verificar primero antes de permitir en desarrollo)
    if (!token) {
        return { success: false, error: 'Token de reCAPTCHA no proporcionado' };
    }

    // Leer la clave secreta cada vez para permitir cambios en tests
    const RECAPTCHA_SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY;
    
    // Si no hay clave secreta configurada, permitir en desarrollo
    if (!RECAPTCHA_SECRET_KEY) {
        console.warn('[reCAPTCHA] RECAPTCHA_SECRET_KEY no configurada. Saltando validación en desarrollo.');
        return { success: true, score: 1.0, development: true };
    }

    try {
        // reCAPTCHA API espera los parámetros en el body (form data) o como query params
        // Usamos query params para mayor compatibilidad
        const response = await axios.post(RECAPTCHA_VERIFY_URL, {}, {
            params: {
                secret: RECAPTCHA_SECRET_KEY,
                response: token
            },
            timeout: 10000, // 10 segundos timeout
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        const { success, score, action: returnedAction, 'error-codes': errorCodes } = response.data;

        // Verificar éxito general
        if (!success) {
            const errors = errorCodes?.join(', ') || 'Error desconocido';
            return { success: false, error: `reCAPTCHA falló: ${errors}` };
        }

        // Verificar acción si se especificó
        if (action && returnedAction !== action) {
            return { success: false, error: `Acción no coincide. Esperada: ${action}, Recibida: ${returnedAction}` };
        }

        // Verificar puntuación (score)
        // reCAPTCHA v3 devuelve un score de 0.0 a 1.0
        // 1.0 = muy probablemente humano, 0.0 = muy probablemente bot
        if (score < minScore) {
            return { 
                success: false, 
                error: `Puntuación de reCAPTCHA demasiado baja: ${score}. Mínimo requerido: ${minScore}`,
                score 
            };
        }

        return { success: true, score, action: returnedAction };
    } catch (error) {
        // Manejar diferentes tipos de errores
        if (error.code === 'ECONNABORTED') {
            logger.error('Timeout al verificar reCAPTCHA con Google');
        } else if (error.response) {
            // El servidor respondió con un código de estado fuera del rango 2xx
            logger.error(`Error HTTP ${error.response.status} al verificar reCAPTCHA:`, { 
                error: error.message,
                status: error.response.status,
                data: error.response.data 
            });
        } else if (error.request) {
            // La solicitud se hizo pero no se recibió respuesta
            logger.error('Error de red al verificar reCAPTCHA (sin respuesta):', { error: error.message });
        } else {
            logger.error('Error al verificar reCAPTCHA:', { error: error.message });
        }
        
        // En caso de error de red, permitir en desarrollo pero rechazar en producción
        if (process.env.NODE_ENV === 'development') {
            console.warn('[reCAPTCHA] Error de red, permitiendo en desarrollo');
            return { success: true, score: 1.0, development: true };
        }
        return { success: false, error: 'Error al verificar reCAPTCHA con Google' };
    }
};

module.exports = { verifyRecaptcha };

