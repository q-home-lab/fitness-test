const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
// ----------------------------------------------------------------------
// Importamos solo la conexión DB (ahora db_config.js SÍ exporta 'db')
const { db } = require('../db/db_config'); 
// Importamos la definición del esquema
const schema = require('../db/schema'); 
const { users, inviteTokens } = schema; 
// ----------------------------------------------------------------------
const { eq, and, gt } = require('drizzle-orm');

// Importar mejoras
const logger = require('../utils/logger');
const { authLimiter, passwordResetLimiter } = require('../middleware/rateLimiter');
const { routeValidations, handleValidationErrors } = require('../middleware/validation');
const { validatePasswordStrength, formatPasswordErrors } = require('../utils/passwordValidator');
const { verifyRecaptcha } = require('../utils/recaptcha');

const FRONTEND_BASE_URL = process.env.FRONTEND_BASE_URL || 'http://localhost:5173';

// ----------------------------------------------------------------------
// Helper para determinar si un email pertenece a un administrador
// ----------------------------------------------------------------------
// Puedes configurar ADMIN_EMAILS en el .env como lista separada por comas:
// ADMIN_EMAILS=admin@tudominio.com,coach@tudominio.com
function isAdminEmail(email) {
    const raw = process.env.ADMIN_EMAILS;
    if (!raw || !email) return false;
    const list = raw
        .split(',')
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean);
    return list.includes(email.toLowerCase());
}


// ----------------------------------------------------------------------
// Helper para envío de correos (recuperación de contraseña)
// ----------------------------------------------------------------------

function createEmailTransport() {
    // En entorno de test, usamos un transport "falso" que no envía nada
    if (process.env.NODE_ENV === 'test') {
        return {
            sendMail: async () => {
                return;
            },
        };
    }

    const host = process.env.SMTP_HOST;
    const port = process.env.SMTP_PORT;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    const isConfigured = host && port && user && pass;

    // Crear un wrapper que muestre el warning solo cuando se intente enviar un email
    const transport = nodemailer.createTransport({
        host,
        port: Number(port) || 587,
        secure: false,
        auth: user && pass ? { user, pass } : undefined,
    });

    // Interceptar sendMail para mostrar el warning solo cuando se use
    const originalSendMail = transport.sendMail.bind(transport);
    let warningShown = false;

    transport.sendMail = async function(...args) {
        if (!isConfigured && !warningShown) {
            logger.warn('SMTP no está completamente configurado. No se podrán enviar emails reales.');
            warningShown = true;
        }
        return originalSendMail(...args);
    };

    return transport;
}

const mailTransport = createEmailTransport();

// Usamos el Router de Express
const router = express.Router();

// 1. RUTA DE REGISTRO
router.post('/register', 
    authLimiter, // Rate limiting
    routeValidations.register, // Validación de campos
    handleValidationErrors,
    async (req, res) => {
        const { email, password, recaptchaToken, invitationToken } = req.body;

        // Validar reCAPTCHA si está configurado
        if (process.env.RECAPTCHA_SECRET_KEY) {
            const recaptchaResult = await verifyRecaptcha(recaptchaToken, 'register', 0.5);
            if (!recaptchaResult.success) {
                logger.warn('Intento de registro bloqueado por reCAPTCHA:', { email, error: recaptchaResult.error });
                return res.status(400).json({ 
                    error: 'Verificación de seguridad fallida. Por favor, intenta de nuevo.' 
                });
            }
        }

        // Validar fortaleza de contraseña
        const passwordValidation = validatePasswordStrength(password);
        if (!passwordValidation.valid) {
            return res.status(400).json({ 
                error: formatPasswordErrors(passwordValidation.errors) 
            });
        }

        try {
            const isAdmin = isAdminEmail(email);
            let coachId = null;
            let userRole = 'CLIENT'; // Por defecto es CLIENT

            // Si hay un token de invitación, validarlo
            if (invitationToken) {
                const tokens = await db
                    .select()
                    .from(inviteTokens)
                    .where(
                        and(
                            eq(inviteTokens.token, invitationToken),
                            eq(inviteTokens.used, false),
                            gt(inviteTokens.expires_at, new Date())
                        )
                    )
                    .limit(1);

                if (tokens.length === 0) {
                    return res.status(400).json({ 
                        error: 'Token de invitación inválido, ya utilizado o expirado.' 
                    });
                }

                const inviteToken = tokens[0];

                // Verificar que el email coincida con el del token
                if (inviteToken.email.toLowerCase() !== email.toLowerCase()) {
                    return res.status(400).json({ 
                        error: 'El email no coincide con el de la invitación.' 
                    });
                }

                coachId = inviteToken.coach_id;
                userRole = 'CLIENT'; // Los invitados siempre son CLIENT

                // Marcar el token como usado
                await db
                    .update(inviteTokens)
                    .set({ used: true })
                    .where(eq(inviteTokens.id, inviteToken.id));
            }

            // 1. Verificar si el usuario ya existe
            const existingUsers = await db.select().from(users).where(eq(users.email, email));
            if (existingUsers.length > 0) {
                logger.warn(`Intento de registro con email existente: ${email}`);
                return res.status(409).json({ error: 'El email ya está registrado.' });
            }
            
            // 2. Hashear la contraseña
            const saltRounds = 10;
            const password_hash = await bcrypt.hash(password, saltRounds);

            // 3. Insertar nuevo usuario con rol y coach_id si aplica
            const newUser = await db.insert(users).values({
                email: email,
                password_hash: password_hash,
                role: isAdmin ? 'ADMIN' : userRole,
                coach_id: coachId,
            }).returning({ 
                id: users.user_id, 
                email: users.email,
                role: users.role 
            }); 

            // 4. Generar tokens JWT (access y refresh) con rol
            const tokenPayload = {
                id: newUser[0].id,
                email: newUser[0].email,
                isAdmin: isAdmin || newUser[0].role === 'ADMIN',
                role: newUser[0].role,
            };

            const accessToken = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
                expiresIn: '1h', // Token de acceso: 1 hora (más razonable que 15 minutos)
            });

            const refreshToken = jwt.sign(tokenPayload, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET, {
                expiresIn: '30d', // Refresh token: 30 días (más tiempo para mejor UX)
            });

            logger.info(`Usuario registrado exitosamente: ${email} (rol: ${newUser[0].role})`);

            return res.status(201).json({
                message: 'Registro exitoso.',
                token: accessToken,
                refreshToken: refreshToken,
                user: { 
                    id: newUser[0].id, 
                    email: newUser[0].email, 
                    role: newUser[0].role,
                    isAdmin: isAdmin || newUser[0].role === 'ADMIN' 
                }
            });

        } catch (error) {
            logger.error('Error en el registro:', { 
                error: error.message, 
                stack: error.stack, 
                email,
                code: error.code,
                detail: error.detail,
                constraint: error.constraint
            });
            
            // Proporcionar más detalles del error en desarrollo
            let errorMessage = 'Error interno del servidor. Por favor, intenta de nuevo.';
            
            if (process.env.NODE_ENV === 'development') {
                errorMessage = `Error interno del servidor: ${error.message}`;
                if (error.code) {
                    errorMessage += ` (Código: ${error.code})`;
                }
                if (error.detail) {
                    errorMessage += ` - ${error.detail}`;
                }
            }
            
            // Errores específicos de base de datos
            if (error.code === '42703') {
                errorMessage = 'Error: La base de datos no tiene las columnas necesarias. Ejecuta las migraciones.';
            } else if (error.code === '23505') {
                errorMessage = 'El email ya está registrado.';
            } else if (error.code === '23503') {
                errorMessage = 'Error de referencia: El coach_id no es válido.';
            }
            
            return res.status(500).json({ 
                error: errorMessage,
                ...(process.env.NODE_ENV === 'development' && {
                    details: {
                        message: error.message,
                        code: error.code,
                        detail: error.detail
                    }
                })
            });
        }
    }
);


// 2. RUTA DE LOGIN
router.post('/login',
    authLimiter, // Rate limiting
    routeValidations.login, // Validación de campos
    handleValidationErrors,
    async (req, res) => {
        const { email, password, recaptchaToken } = req.body;

        // Validar reCAPTCHA si está configurado
        if (process.env.RECAPTCHA_SECRET_KEY) {
            const recaptchaResult = await verifyRecaptcha(recaptchaToken, 'login', 0.5);
            if (!recaptchaResult.success) {
                logger.warn('Intento de login bloqueado por reCAPTCHA:', { email, error: recaptchaResult.error });
                return res.status(400).json({ 
                    error: 'Verificación de seguridad fallida. Por favor, intenta de nuevo.' 
                });
            }
        }

        try {
            const isAdmin = isAdminEmail(email);

            // 1. Buscar usuario
            const userArray = await db.select().from(users).where(eq(users.email, email)).limit(1);
            const user = userArray[0];

            if (!user) {
                logger.warn(`Intento de login con email no existente: ${email}`);
                return res.status(401).json({ error: 'Credenciales inválidas.' });
            }

            // 2. Comparar contraseña
            const isMatch = await bcrypt.compare(password, user.password_hash);

            if (!isMatch) {
                logger.warn(`Intento de login con contraseña incorrecta para: ${email}`);
                return res.status(401).json({ error: 'Credenciales inválidas.' });
            }

            // 3. Obtener el rol del usuario desde la base de datos
            const userRole = user.role || (isAdmin ? 'ADMIN' : 'CLIENT');

            // 4. Generar tokens JWT (access y refresh) con rol
            const tokenPayload = {
                id: user.user_id,
                email: user.email,
                isAdmin: isAdmin || userRole === 'ADMIN',
                role: userRole,
            };

            const accessToken = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
                expiresIn: '1h', // Token de acceso: 1 hora (más razonable que 15 minutos)
            });

            const refreshToken = jwt.sign(tokenPayload, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET, {
                expiresIn: '30d', // Refresh token: 30 días (más tiempo para mejor UX)
            });

            logger.info(`Usuario logueado exitosamente: ${email}`);

            return res.status(200).json({
                message: 'Login exitoso.',
                token: accessToken,
                refreshToken: refreshToken,
                user: { 
                    id: user.user_id, 
                    email: user.email, 
                    role: userRole,
                    isAdmin: isAdmin || userRole === 'ADMIN' 
                }
            });

        } catch (error) {
            logger.error('Error en el login:', { error: error.message, stack: error.stack, email });
            return res.status(500).json({ error: 'Error interno del servidor.' });
        }
    }
);

// 3. RUTA: SOLICITUD DE RECUPERACIÓN DE CONTRASEÑA (envía email con enlace)
router.post('/forgot-password',
    passwordResetLimiter, // Rate limiting más restrictivo
    routeValidations.forgotPassword,
    handleValidationErrors,
    async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ error: 'El email es obligatorio.' });
    }

    try {
        const userArray = await db.select().from(users).where(eq(users.email, email)).limit(1);
        const user = userArray[0];

        // Siempre respondemos 200 para no filtrar si un email existe o no
        if (!user) {
            return res.status(200).json({
                message: 'Si el correo existe en nuestra base de datos, recibirás un enlace para restablecer tu contraseña.',
            });
        }

        const token = crypto.randomBytes(32).toString('hex');
        const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

        await db
            .update(users)
            .set({
                reset_password_token: token,
                reset_password_expires: expires,
            })
            .where(eq(users.user_id, user.user_id));

        const resetLink = `${FRONTEND_BASE_URL}/reset-password?token=${encodeURIComponent(
            token
        )}&email=${encodeURIComponent(email)}`;

        try {
            await mailTransport.sendMail({
                from: process.env.SMTP_FROM || 'no-reply@fitness-app.local',
                to: email,
                subject: 'Restablece tu contraseña',
                text: `Has solicitado restablecer tu contraseña.\n\nHaz clic en el siguiente enlace (o cópialo en tu navegador):\n\n${resetLink}\n\nEste enlace expirará en 1 hora.`,
            });
        } catch (emailError) {
            logger.error('Error enviando email de recuperación de contraseña:', { 
                error: emailError.message, 
                email 
            });
            // No revelamos detalles al usuario final
        }

        return res.status(200).json({
            message: 'Si el correo existe en nuestra base de datos, recibirás un enlace para restablecer tu contraseña.',
        });
    } catch (error) {
        logger.error('Error en forgot-password:', { error: error.message, stack: error.stack });
        return res.status(500).json({ error: 'Error interno del servidor.' });
    }
});

// 4. RUTA: RESTABLECER CONTRASEÑA (a partir del enlace)
router.post('/reset-password',
    passwordResetLimiter,
    routeValidations.resetPassword,
    handleValidationErrors,
    async (req, res) => {
        const { email, token, newPassword } = req.body;

        // Validar fortaleza de la nueva contraseña
        const passwordValidation = validatePasswordStrength(newPassword);
        if (!passwordValidation.valid) {
            return res.status(400).json({ 
                error: formatPasswordErrors(passwordValidation.errors) 
            });
        }

        try {
            const userArray = await db.select().from(users).where(eq(users.email, email)).limit(1);
            const user = userArray[0];

            if (!user || !user.reset_password_token || !user.reset_password_expires) {
                logger.warn(`Intento de reset password con token inválido para: ${email}`);
                return res.status(400).json({ error: 'Token de restablecimiento inválido o expirado.' });
            }

            const now = new Date();
            if (
                user.reset_password_token !== token ||
                new Date(user.reset_password_expires).getTime() < now.getTime()
            ) {
                logger.warn(`Intento de reset password con token expirado para: ${email}`);
                return res.status(400).json({ error: 'Token de restablecimiento inválido o expirado.' });
            }

            const saltRounds = 10;
            const newHash = await bcrypt.hash(newPassword, saltRounds);

            await db
                .update(users)
                .set({
                    password_hash: newHash,
                    reset_password_token: null,
                    reset_password_expires: null,
                })
                .where(eq(users.user_id, user.user_id));

            logger.info(`Contraseña restablecida exitosamente para: ${email}`);

            return res.status(200).json({ message: 'Contraseña restablecida correctamente.' });
        } catch (error) {
            logger.error('Error en reset-password:', { error: error.message, stack: error.stack, email });
            return res.status(500).json({ error: 'Error interno del servidor.' });
        }
    }
);

// 5. RUTA: REFRESH TOKEN
router.post('/refresh', async (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return res.status(400).json({ error: 'Refresh token es requerido.' });
    }

    try {
        const refreshSecret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;
        const decoded = jwt.verify(refreshToken, refreshSecret);

        // Verificar que el usuario aún existe
        const userArray = await db.select()
            .from(users)
            .where(eq(users.user_id, decoded.id))
            .limit(1);
        
        if (userArray.length === 0) {
            return res.status(401).json({ error: 'Token inválido.' });
        }

        const user = userArray[0];
        const isAdmin = isAdminEmail(user.email);
        const userRole = user.role || (isAdmin ? 'ADMIN' : 'CLIENT');

        // Generar nuevo access token
        const tokenPayload = {
            id: user.user_id,
            email: user.email,
            isAdmin: isAdmin || userRole === 'ADMIN',
            role: userRole,
        };

        const newAccessToken = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
            expiresIn: '1h', // Access token: 1 hora
        });

        // IMPORTANTE: También generar un nuevo refreshToken (refresh token rotation)
        // Esto extiende la sesión del usuario y mejora la seguridad
        const newRefreshToken = jwt.sign(tokenPayload, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET, {
            expiresIn: '30d', // Refresh token: 30 días
        });

        logger.debug(`Token refrescado para usuario: ${user.email}`);

        return res.status(200).json({
            token: newAccessToken,
            refreshToken: newRefreshToken, // Devolver nuevo refreshToken para extender la sesión
        });

    } catch (error) {
        if (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError') {
            logger.warn('Intento de refresh con token inválido o expirado');
            return res.status(401).json({ error: 'Token inválido o expirado.' });
        }
        
        logger.error('Error en refresh token:', { error: error.message, stack: error.stack });
        return res.status(500).json({ error: 'Error interno del servidor.' });
    }
});

module.exports = router;