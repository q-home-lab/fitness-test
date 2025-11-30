// Este middleware verifica el token JWT y protege las rutas privadas.

const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

// Asegúrate de que tu JWT_SECRET está configurado en el archivo .env
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    throw new Error('JWT_SECRET no está definido en el archivo .env. Es necesario para la autenticación.');
} 

/**
 * Función middleware para verificar el token JWT en cada solicitud protegida.
 */
const authenticateToken = (req, res, next) => {
    // 1. Obtener el encabezado de autorización (Authorization: Bearer <token>)
    const authHeader = req.headers['authorization'];
    
    // Extraer el token de la cadena 'Bearer <token>'
    const token = authHeader && authHeader.split(' ')[1]; 

    // 2. Verificar si el token está presente
    if (token == null) {
        // 401 Unauthorized: La solicitud requiere autenticación
        return res.status(401).json({ 
            error: 'Acceso denegado. No se proporcionó un token de autenticación.',
            statusCode: 401
        });
    }

    // 3. Verificar el token usando la clave secreta
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        // 4. Si hay un error (token inválido o expirado)
        if (err) {
            // Log detallado del error
            const errorDetails = {
                error: err.message,
                errorName: err.name,
                ip: req.ip,
                path: req.path,
                method: req.method,
                // Solo incluir parte del token para debugging (no el token completo por seguridad)
                tokenPreview: token ? `${token.substring(0, 20)}...` : 'no token'
            };
            
            // Diferentes niveles de log según el tipo de error
            const errorMessage = err.name === 'TokenExpiredError' 
                ? `Token JWT expirado - ${err.message}`
                : err.name === 'JsonWebTokenError'
                ? `Token JWT inválido - ${err.message}`
                : `Error de verificación JWT - ${err.message}`;
            
            logger.warn(errorMessage, errorDetails);
            
            // 403 Forbidden: Token inválido o expirado
            return res.status(403).json({ 
                error: 'Token inválido o expirado.',
                statusCode: 403,
                // En desarrollo, incluir más detalles
                ...(process.env.NODE_ENV === 'development' && {
                    details: {
                        errorType: err.name,
                        message: err.message
                    }
                })
            });
        }

        // 5. Token válido: Adjuntar la información del usuario al objeto req
        // El token fue generado con { id, email, isAdmin, role } en routes/auth.js
        req.user = { 
            id: decoded.id, 
            email: decoded.email, 
            isAdmin: !!decoded.isAdmin,
            role: decoded.role || (decoded.isAdmin ? 'ADMIN' : 'CLIENT') // Compatibilidad con tokens antiguos
        }; 
        
        // 6. Continuar con la ejecución de la ruta
        next();
    });
};

module.exports = authenticateToken;