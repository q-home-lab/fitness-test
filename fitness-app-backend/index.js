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
const inviteRoutes = require('./routes/invite'); // <-- Rutas de invitaciones (públicas)
const templatesRoutes = require('./routes/templates'); // <-- Rutas de plantillas
const checkinsRoutes = require('./routes/checkins'); // <-- Rutas de check-ins
const messagesRoutes = require('./routes/messages'); // <-- Rutas de mensajes

const app = express();
const PORT = process.env.PORT || 4000;

// --- 2. MIDDLEWARE GLOBAL ---
// Permite que Express lea JSON en el cuerpo de las peticiones
app.use(express.json());
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


// --- 3. RUTAS PÚBLICAS Y DE AUTENTICACIÓN ---
// Ruta de prueba
app.get('/', (req, res) => {
    res.send('Servidor de Fitness App corriendo con Express y Drizzle!');
});

// Rutas de Registro y Login
app.use('/api/auth', authRoutes);

// Rutas de Invitaciones (públicas)
app.use('/api/invite', inviteRoutes);

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


// --- 6. INICIO DEL SERVIDOR ---
// Solo inicia el servidor si no estamos en modo test
if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => {
        logger.info(`🚀 Servidor Express escuchando en http://localhost:${PORT}`);
    });
}

// Exportar la app para tests
module.exports = app;