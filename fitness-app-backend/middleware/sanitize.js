/**
 * Middleware para sanitizar inputs
 * Previene XSS y otros ataques de inyección
 */

const sanitize = (req, res, next) => {
    // Función recursiva para sanitizar objetos
    const sanitizeValue = (value) => {
        if (typeof value === 'string') {
            // Remover caracteres peligrosos pero mantener el contenido útil
            return value
                .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remover scripts
                .replace(/javascript:/gi, '') // Remover javascript: protocol
                .replace(/on\w+\s*=/gi, '') // Remover event handlers
                .trim();
        } else if (Array.isArray(value)) {
            return value.map(sanitizeValue);
        } else if (value && typeof value === 'object') {
            const sanitized = {};
            for (const key in value) {
                sanitized[key] = sanitizeValue(value[key]);
            }
            return sanitized;
        }
        return value;
    };

    // Sanitizar body, query y params
    if (req.body) {
        req.body = sanitizeValue(req.body);
    }
    if (req.query) {
        req.query = sanitizeValue(req.query);
    }
    if (req.params) {
        req.params = sanitizeValue(req.params);
    }

    next();
};

module.exports = sanitize;

