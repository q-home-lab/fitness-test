// 1. IMPORTS Y CONFIGURACIÓN BÁSICA
require('dotenv').config();

// Validar variables de entorno críticas antes de continuar
const { validateEnvVars } = require('./config/envValidator');
const logger = require('./utils/logger');

try {
  validateEnvVars();
} catch (error) {
  logger.error(error.message);
  process.exit(1);
}

const express = require('express');
const cors = require('cors');
const compression = require('compression');
const helmet = require('helmet');

// Importamos librerías de seguridad (aunque se usan principalmente en auth.js)
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// ----------------------------------------------------------------------------------
// Importamos la conexión a Drizzle y las tablas
const { db } = require('./db/db_config');
const schema = require('./db/schema');
const { users, dailyLogs, dailyExercises } = schema;
const { eq, and, gte, desc } = require('drizzle-orm');
const { sql } = require('drizzle-orm');
// ----------------------------------------------------------------------------------

// Importamos el Router de Autenticación
const authRoutes = require('./routes/auth');

// Importamos el middleware de seguridad
const authenticateToken = require('./routes/authMiddleware');

// NUEVAS IMPORTACIONES PARA LAS RUTAS DE LOGS Y NUTRICIÓN
const logsRoutes = require('./routes/logs');
const foodsRoutes = require('./routes/foods'); // <-- Rutas de Alimentos
const mealItemsRoutes = require('./routes/mealItems'); // <-- Rutas de Meal Items
const routinesRoutes = require('./routes/routines');
const exercisesRoutes = require('./routes/exercises'); //
const workoutsRoutes = require('./routes/workouts'); // <-- Rutas de Entrenamientos
const goalsRoutes = require('./routes/goals'); // <-- Rutas de Objetivos
const calendarRoutes = require('./routes/calendar'); // <-- Rutas de Calendario
const onboardingRoutes = require('./routes/onboarding'); // <-- Rutas de Onboarding
const adminRoutes = require('./routes/admin'); // <-- Rutas de administración
const brandRoutes = require('./routes/brand'); // <-- Rutas de configuración de marca
const notificationsRoutes = require('./routes/notifications'); // <-- Rutas de notificaciones
const achievementsRoutes = require('./routes/achievements'); // <-- Rutas de logros
const coachRoutes = require('./routes/coach'); // <-- Rutas de coach
const clientRoutes = require('./routes/client'); // <-- Rutas de cliente
const inviteRoutes = require('./routes/invite'); // <-- Rutas de invitaciones (públicas)
const templatesRoutes = require('./routes/templates'); // <-- Rutas de plantillas
const checkinsRoutes = require('./routes/checkins'); // <-- Rutas de check-ins
const messagesRoutes = require('./routes/messages'); // <-- Rutas de mensajes
const healthRoutes = require('./routes/health'); // <-- Rutas de health check

// Importar middlewares de manejo de errores
const errorHandler = require('./middleware/errorHandler');
const requestIdMiddleware = require('./middleware/requestId');
const responseTimeMiddleware = require('./middleware/responseTime');
const payloadSize = require('./middleware/payloadSize');
const sanitize = require('./middleware/sanitize');

const app = express();
const PORT = process.env.PORT || 4000;

// --- 2. MIDDLEWARE GLOBAL ---
// Request ID para tracking (debe ir primero)
app.use(requestIdMiddleware);

// Response time tracking (después de request ID)
app.use(responseTimeMiddleware);

// Helmet para headers de seguridad
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://api.fontshare.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "https://api.fontshare.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // unsafe-eval necesario para Vite en desarrollo
      imgSrc: ["'self'", "data:", "https:", "http:"],
      connectSrc: ["'self'", process.env.FRONTEND_URL, process.env.VITE_API_URL].filter(Boolean),
    },
  },
  crossOriginEmbedderPolicy: false, // Necesario para algunas integraciones
  crossOriginResourcePolicy: { policy: "cross-origin" }, // Permitir recursos cross-origin
}));

// Compresión de respuestas (gzip/brotli) - debe ir antes de otras rutas
app.use(compression({
    level: 6, // Nivel de compresión (1-9, 6 es un buen balance)
    filter: (req, res) => {
        // No comprimir si el cliente no lo soporta o si es muy pequeño
        if (req.headers['x-no-compression']) {
            return false;
        }
        // Usar compresión para todas las respuestas JSON y texto
        return compression.filter(req, res);
    }
}));

// Validar tamaño de payloads (1MB máximo)
app.use(payloadSize(1024 * 1024)); // 1MB

// Sanitizar inputs
app.use(sanitize);

// Permite que Express lea JSON en el cuerpo de las peticiones
app.use(express.json({ limit: '1mb' })); // Limitar tamaño de JSON también
// Habilita CORS para permitir que el frontend de React se conecte
// En desarrollo permite todos los orígenes, en producción permite orígenes específicos
const corsOptions = {
    origin: function (origin, callback) {
        // Permitir requests sin origen (móviles, Postman, etc.)
        if (!origin) return callback(null, true);
        
        // En desarrollo, permitir todos
        if (process.env.NODE_ENV !== 'production') {
            return callback(null, true);
        }
        
        // En producción, verificar orígenes permitidos
        const allowedOrigins = [
            process.env.FRONTEND_URL,
            /^https:\/\/.*\.vercel\.app$/,
            /^https:\/\/.*\.netlify\.app$/,
            /^https:\/\/.*\.onrender\.com$/,  // Render.com domains
            'http://localhost:5173',
            'http://localhost:3000'
        ].filter(Boolean);
        
        // Verificar si el origen está permitido
        const isAllowed = allowedOrigins.some(allowed => {
            if (typeof allowed === 'string') {
                return origin === allowed;
            } else if (allowed instanceof RegExp) {
                return allowed.test(origin);
            }
            return false;
        });
        
        if (isAllowed) {
            callback(null, true);
        } else {
            callback(new Error('No permitido por CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));


// Importar rate limiters
const { generalLimiter } = require('./middleware/rateLimiter');

// --- 3. RUTAS PÚBLICAS Y DE AUTENTICACIÓN ---
// Ruta de prueba (con rate limiting)
app.get('/', generalLimiter, (req, res) => {
    res.send('Servidor de Fitness App corriendo con Express y Drizzle!');
});

// Swagger/OpenAPI Documentation
if (process.env.NODE_ENV !== 'production' || process.env.ENABLE_SWAGGER === 'true') {
    const swaggerUi = require('swagger-ui-express');
    const swaggerSpec = require('./config/swagger');
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
        customCss: '.swagger-ui .topbar { display: none }',
        customSiteTitle: 'Fitness App API Documentation',
    }));
    logger.info('Swagger UI disponible en /api-docs');
}

// Health check (debe ir antes de otras rutas para monitoreo rápido)
// Health check sin rate limiting para monitoreo
app.use('/api/health', healthRoutes);

// Rutas de Registro y Login (ya tienen rate limiting en authRoutes)
app.use('/api/auth', authRoutes);

// Rutas de Invitaciones (públicas) - aplicar rate limiting
app.use('/api/invite', generalLimiter, inviteRoutes);

// --- 4. RUTAS PROTEGIDAS CON DATOS ---
// Todas estas rutas usarán el middleware authenticateToken (implementado en sus archivos de router)
app.use('/api/logs', logsRoutes);
app.use('/api/foods', foodsRoutes); // Conexión de la ruta de alimentos
app.use('/api/meal-items', mealItemsRoutes); // <-- Conexión de la ruta de meal items
app.use('/api/routines', routinesRoutes); // <-- NUEVA CONEXIÓN DE LA RUTA DE RUTINAS
app.use('/api/exercises', exercisesRoutes);
app.use('/api/workouts', workoutsRoutes); // <-- NUEVA CONEXIÓN DE LA RUTA DE ENTRENAMIENTOS
app.use('/api/goals', goalsRoutes); // <-- RUTAS DE OBJETIVOS
app.use('/api/calendar', calendarRoutes); // <-- RUTAS DE CALENDARIO
app.use('/api/onboarding', onboardingRoutes); // <-- RUTAS DE ONBOARDING
app.use('/api/admin', adminRoutes); // <-- RUTAS DE ADMINISTRACIÓN
app.use('/api/brand', brandRoutes); // <-- RUTAS DE CONFIGURACIÓN DE MARCA
app.use('/api/notifications', notificationsRoutes); // <-- RUTAS DE NOTIFICACIONES
app.use('/api/achievements', achievementsRoutes); // <-- RUTAS DE LOGROS
app.use('/api/coach', coachRoutes); // <-- RUTAS DE COACH
app.use('/api/client', clientRoutes); // <-- RUTAS DE CLIENTE
app.use('/api/templates', templatesRoutes); // <-- RUTAS DE PLANTILLAS
app.use('/api/checkin', checkinsRoutes); // <-- RUTAS DE CHECK-INS
app.use('/api/messages', messagesRoutes); // <-- RUTAS DE MENSAJES

// --- 5. RUTA DE EJEMPLO PROTEGIDA (Demostración de Autorización) ---

// Al usar el middleware 'authenticateToken', esta ruta solo se ejecuta si hay un JWT válido.
app.get('/api/profile', authenticateToken, async (req, res) => {
    // La clave de la seguridad: el middleware adjuntó req.user.id
    const user_id = req.user.id;

    try {
        // Consultamos la DB para obtener los datos del usuario logeado
        const profile = await db.select({
            id: users.user_id,
            email: users.email,
            role: users.role,
            coach_id: users.coach_id,
            createdAt: users.created_at
        })
            .from(users)
            .where(eq(users.user_id, user_id))
            .limit(1);

        if (profile.length === 0) {
            return res.status(404).json({ error: 'Perfil de usuario no encontrado.' });
        }

        const baseProfile = profile[0];

        return res.status(200).json({
            message: 'Datos de perfil cargados con éxito (Ruta Protegida)',
            profile: {
                ...baseProfile,
                // El rol de admin se determina a partir del token actual
                isAdmin: !!req.user.isAdmin || baseProfile.role === 'ADMIN',
            }
        });

    } catch (error) {
        logger.error('Error al cargar perfil:', { error: error.message, stack: error.stack, userId: user_id });
        return res.status(500).json({ error: 'Error interno del servidor.' });
    }
});

// Actualizar rol del usuario
app.patch('/api/profile/role', authenticateToken, async (req, res) => {
    const user_id = req.user.id;
    const { role } = req.body;

    // Validar que el rol sea válido
    if (!role || !['CLIENT', 'COACH', 'ADMIN'].includes(role)) {
        return res.status(400).json({ error: 'Rol inválido. Debe ser CLIENT, COACH o ADMIN.' });
    }

    // Solo permitir actualizar a CLIENT o COACH (no ADMIN por seguridad)
    if (role === 'ADMIN' && !req.user.isAdmin) {
        return res.status(403).json({ error: 'No tienes permisos para asignar el rol ADMIN.' });
    }

    try {
        // Actualizar el rol del usuario
        const updated = await db
            .update(users)
            .set({ role: role })
            .where(eq(users.user_id, user_id))
            .returning({
                id: users.user_id,
                email: users.email,
                role: users.role
            });

        if (updated.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado.' });
        }

        logger.info(`Rol actualizado para usuario ${user_id}: ${role}`);

        return res.status(200).json({
            message: 'Rol actualizado exitosamente.',
            user: updated[0]
        });

    } catch (error) {
        logger.error('Error al actualizar rol:', { error: error.message, stack: error.stack, userId: user_id });
        return res.status(500).json({ error: 'Error interno del servidor.' });
    }
});

// GET /api/profile/streak - Obtener streak de días consecutivos entrenando
app.get('/api/profile/streak', authenticateToken, async (req, res) => {
    const user_id = req.user.id;

    try {
        // Obtener días con ejercicios completados, ordenados por fecha descendente
        const exerciseDays = await db
            .select({ date: dailyLogs.date })
            .from(dailyLogs)
            .innerJoin(dailyExercises, eq(dailyLogs.log_id, dailyExercises.log_id))
            .where(eq(dailyLogs.user_id, user_id))
            .groupBy(dailyLogs.date)
            .orderBy(desc(dailyLogs.date));

        // Calcular streak
        let streak = 0;
        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        // Verificar si entrenó hoy o ayer
        const dates = exerciseDays.map(d => d.date);
        if (dates.includes(today) || dates.includes(yesterdayStr)) {
            streak = 1;
            let currentDate = dates.includes(today) ? today : yesterdayStr;
            
            for (let i = 0; i < dates.length; i++) {
                if (dates[i] === currentDate) {
                    streak++;
                    const nextDate = new Date(currentDate);
                    nextDate.setDate(nextDate.getDate() - 1);
                    currentDate = nextDate.toISOString().split('T')[0];
                } else {
                    break;
                }
            }
        }

        return res.status(200).json({
            message: 'Streak obtenido exitosamente.',
            streak,
        });
    } catch (error) {
        logger.error('Error calculando streak:', { error: error.message, stack: error.stack, userId: user_id });
        return res.status(500).json({ error: 'Error interno del servidor.' });
    }
});

// --- 6. MANEJO DE ERRORES Y RUTAS NO ENCONTRADAS ---
// Manejar rutas no encontradas (debe ir antes del error handler)
app.use((req, res) => {
    res.status(404).json({
        error: 'Ruta no encontrada',
        path: req.path,
        method: req.method,
    });
});

// Error handler debe ser el último middleware
// Captura todos los errores no manejados
app.use(errorHandler);

// --- 7. INICIO DEL SERVIDOR ---
// Solo inicia el servidor si no estamos en modo test
if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => {
        logger.info(`🚀 Servidor Express escuchando en http://localhost:${PORT}`);
    });
}

// Exportar la app para tests
module.exports = app;