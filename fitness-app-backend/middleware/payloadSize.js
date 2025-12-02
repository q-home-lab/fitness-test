/**
 * Middleware para validar el tamaño de payloads
 * Previene ataques de DoS por payloads muy grandes
 */

const payloadSize = (maxSize = 1024 * 1024) => { // 1MB por defecto
    return (req, res, next) => {
        const contentLength = req.get('content-length');
        
        if (contentLength && parseInt(contentLength) > maxSize) {
            return res.status(413).json({
                error: `El tamaño del payload excede el límite permitido de ${maxSize / 1024 / 1024}MB`,
            });
        }
        
        next();
    };
};

module.exports = payloadSize;

