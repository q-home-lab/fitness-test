// /routes/exercises.js

const express = require('express');
const router = express.Router();
// Reusa el middleware de seguridad para todas las rutas
const authenticateToken = require('./authMiddleware'); 

const { db } = require('../db/db_config'); // Conexión a DB
const { exercises, users } = require('../db/schema'); // Tablas a usar
const { eq, ilike, asc, sql, or } = require('drizzle-orm');
const axios = require('axios');
const logger = require('../utils/logger');
const { getOrSetCache, invalidateCache } = require('../utils/cache');
const { generalLimiter } = require('../middleware/rateLimiter');
const { routeValidations, handleValidationErrors, commonValidations } = require('../middleware/validation');

// URL base de la API de wger (pública, no requiere autenticación)
const WGER_API_BASE = 'https://wger.de/api/v2';

// --- 1. POST /api/exercises ---
// Crear un nuevo ejercicio en el catálogo.
// Se asume que los ejercicios creados por el usuario no son "públicos" por defecto
// a menos que se implemente una lógica más compleja de aprobación. Aquí lo guardamos como público.
router.post('/', 
    authenticateToken,
    routeValidations.createExercise,
    handleValidationErrors,
    async (req, res) => {
    // Solo necesitamos el user_id para autenticar que es un usuario válido
    const user_id = req.user.id; 
    const { name, category, default_calories_per_minute, gif_url } = req.body;

    if (!name || !category) {
        return res.status(400).json({ error: 'El nombre y la categoría del ejercicio son obligatorios.' });
    }

    try {
        // 1. Insertar el nuevo ejercicio.
        const newExercise = await db.insert(exercises).values({
            name: name,
            category: category,
            default_calories_per_minute: default_calories_per_minute || 5, // Usar un valor por defecto si no se proporciona
            gif_url: gif_url || null, // URL del GIF (opcional)
            is_public: true, // Asumimos que todos los creados por el usuario son públicos en este contexto simple
        }).returning(); // Devolver el ejercicio completo

        // Invalidar cache de ejercicios
        invalidateCache('exercises:public:*');

        logger.info(`Ejercicio creado exitosamente: ${name} por usuario ${user_id}`);

        // 2. Respuesta de éxito
        return res.status(201).json({
            message: 'Ejercicio creado y añadido al catálogo.',
            exercise: newExercise[0]
        });

    } catch (error) {
        // Manejar error de unicidad (si el ejercicio ya existe)
        // El error puede estar en error.code o error.cause.code dependiendo de cómo Drizzle lo envuelve
        const errorCode = error.code || error.cause?.code;
        if (errorCode === '23505') { // Código de error de Drizzle/Postgres para 'unique_violation'
            return res.status(409).json({ error: 'Ya existe un ejercicio con este nombre.' });
        }
        logger.error('Error al crear ejercicio:', { error: error.message, stack: error.stack, user_id });
        return res.status(500).json({ error: 'Error interno del servidor al crear el ejercicio.' });
    }
});


// --- 2. GET /api/exercises ---
// Listar todos los ejercicios disponibles (públicos) con paginación y cache.
router.get('/', 
    authenticateToken,
    generalLimiter,
    commonValidations.pagination,
    handleValidationErrors,
    async (req, res) => {
        // El user_id solo se usa para autenticar, no para filtrar ejercicios
        // ya que estamos listando los "públicos"
        
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            const offset = (page - 1) * limit;

            // Cache key basado en página y límite
            const cacheKey = `exercises:public:page:${page}:limit:${limit}`;

            // Obtener o establecer cache
            const result = await getOrSetCache(cacheKey, async () => {
                // Consultar ejercicios con paginación
                const allExercises = await db.select()
                    .from(exercises)
                    .where(eq(exercises.is_public, true))
                    .orderBy(asc(exercises.name))
                    .limit(limit)
                    .offset(offset);

                // Obtener total de ejercicios
                const totalResult = await db.select({
                    count: sql`count(*)`.as('count')
                })
                .from(exercises)
                .where(eq(exercises.is_public, true));

                const total = parseInt(totalResult[0].count);

                return {
                    exercises: allExercises,
                    pagination: {
                        page,
                        limit,
                        total,
                        totalPages: Math.ceil(total / limit),
                        hasNext: page < Math.ceil(total / limit),
                        hasPrev: page > 1
                    }
                };
            }, 300); // Cache por 5 minutos

            return res.status(200).json({
                message: 'Catálogo de ejercicios cargado con éxito.',
                ...result
            });

        } catch (error) {
            logger.error('Error al obtener ejercicios:', { error: error.message, stack: error.stack });
            return res.status(500).json({ error: 'Error interno del servidor al obtener el catálogo.' });
        }
    }
);

// Función helper para obtener información completa de un ejercicio de wger
async function getExerciseInfoFromWger(exerciseId, language = 2) {
    try {
        // Obtener el ejercicio completo
        const response = await axios.get(`${WGER_API_BASE}/exercise/${exerciseId}/`, {
            timeout: 5000
        });
        
        const exerciseData = response.data;
        
        // Buscar traducción en español si está disponible
        if (exerciseData.translations && Array.isArray(exerciseData.translations)) {
            const esTranslation = exerciseData.translations.find(t => t.language === language || t.language === 2);
            if (esTranslation) {
                return {
                    name: esTranslation.name,
                    description: esTranslation.description || ''
                };
            }
        }
        
        // Si no hay traducciones, buscar en exercise_base
        if (exerciseData.exercise_base) {
            try {
                const baseResponse = await axios.get(`${WGER_API_BASE}/exercisebase/${exerciseData.exercise_base}/`, {
                    timeout: 5000
                });
                
                if (baseResponse.data.exercises && Array.isArray(baseResponse.data.exercises)) {
                    const esExercise = baseResponse.data.exercises.find(e => e.language === language || e.language === 2);
                    if (esExercise) {
                        return {
                            name: esExercise.name,
                            description: esExercise.description || ''
                        };
                    }
                }
            } catch (baseError) {
                logger.error(`Error al obtener exercise_base: ${baseError.message}`);
            }
        }
        
        return null;
    } catch (error) {
        // Manejar diferentes tipos de errores
        if (error.code === 'ECONNABORTED') {
            logger.warn(`Timeout al obtener info del ejercicio ${exerciseId} de wger`);
        } else if (error.response) {
            logger.error(`Error HTTP ${error.response.status} al obtener info del ejercicio ${exerciseId}:`, { 
                error: error.message,
                status: error.response.status 
            });
        } else if (error.request) {
            logger.error(`Error de red al obtener info del ejercicio ${exerciseId} (sin respuesta):`, { error: error.message });
        } else {
            logger.error(`Error al obtener info del ejercicio ${exerciseId}:`, { error: error.message });
        }
        return null;
    }
}

// Función helper para buscar ejercicios en wger API
async function searchExercisesInWger(searchTerm, language = 2) {
    try {
        // wger API: usar 'term' o 'search' para búsqueda, language es el ID del idioma (2=español)
        const response = await axios.get(`${WGER_API_BASE}/exercise/`, {
            params: {
                language: language, // 2 = español
                term: searchTerm.trim(), // Usar 'term' para búsqueda por texto
                limit: 20
            },
            timeout: 5000
        });

        if (response.data && response.data.results) {
            // wger filtra por nombre pero no lo devuelve directamente
            // Vamos a obtener los nombres de las traducciones
            const exercisesWithInfo = await Promise.all(
                response.data.results.map(async (exercise) => {
                    // Intentar obtener el nombre desde las traducciones
                    let exerciseName = `Ejercicio ${exercise.id}`;
                    let description = '';
                    
                    try {
                        const exerciseInfo = await getExerciseInfoFromWger(exercise.id, language);
                        if (exerciseInfo) {
                            exerciseName = exerciseInfo.name || exerciseName;
                            description = exerciseInfo.description || description;
                        }
                    } catch (error) {
                        // Si falla, usar ID como nombre temporal
                        logger.warn(`No se pudo obtener nombre para ejercicio ${exercise.id}`);
                    }
                    
                    return {
                        exercise_id: exercise.id,
                        wger_id: exercise.id,
                        name: exerciseName,
                        category: mapWgerCategoryToLocal(exercise.category),
                        description: description,
                        muscles: exercise.muscles || [],
                        equipment: exercise.equipment || [],
                        default_calories_per_minute: '5',
                        gif_url: null,
                        is_public: true,
                        source: 'wger'
                    };
                })
            );
            
            return exercisesWithInfo;
        }
        return [];
    } catch (error) {
        // Manejar diferentes tipos de errores
        if (error.code === 'ECONNABORTED') {
            logger.warn(`Timeout al buscar ejercicios "${searchTerm}" en wger API`);
        } else if (error.response) {
            logger.error(`Error HTTP ${error.response.status} al buscar en wger API:`, { 
                error: error.message,
                searchTerm,
                status: error.response.status 
            });
        } else if (error.request) {
            logger.error('Error de red al buscar en wger API (sin respuesta):', { error: error.message });
        } else {
            logger.error('Error al buscar en wger API:', { error: error.message });
        }
        return [];
    }
}

// Función helper para mapear categorías de wger a categorías locales
function mapWgerCategoryToLocal(wgerCategoryId) {
    // Mapeo básico de categorías de wger
    // wger usa IDs numéricos para categorías: 10 (Abs), 8 (Arms), 11 (Back), etc.
    // Por ahora, mapeamos a categorías simples
    if (!wgerCategoryId) return 'Fuerza';
    
    // Mapeo simple - puedes expandir esto consultando la API de categorías de wger
    const categoryMap = {
        8: 'Fuerza',   // Arms
        10: 'Fuerza',  // Abs
        11: 'Fuerza',  // Back
        12: 'Cardio',  // Calves
        13: 'Fuerza',  // Chest
        14: 'Fuerza',  // Legs
        15: 'Cardio',  // Shoulders
    };
    
    return categoryMap[wgerCategoryId] || 'Fuerza';
}

// Función helper para mapear grupos musculares a categorías de wger
function mapMuscleGroupToWgerCategory(muscleGroup) {
    // Mapeo de grupos musculares en español a IDs de categorías de wger
    const groupMap = {
        'pecho': 13,      // Chest
        'pierna': 14,     // Legs
        'piernas': 14,    // Legs (plural)
        'espalda': 11,    // Back
        'brazos': 8,      // Arms
        'brazo': 8,       // Arms (singular)
        'hombros': 15,    // Shoulders
        'hombro': 15,     // Shoulders (singular)
    };
    
    return groupMap[muscleGroup?.toLowerCase()] || null;
}

// Función helper para buscar ejercicios por grupo muscular en wger
async function searchExercisesByMuscleGroup(muscleGroup, language = 2) {
    try {
        const categoryId = mapMuscleGroupToWgerCategory(muscleGroup);
        
        if (!categoryId) {
            return [];
        }
        
        const response = await axios.get(`${WGER_API_BASE}/exercise/`, {
            params: {
                language: language,
                category: categoryId,
                limit: 50
            },
            timeout: 5000
        });

        if (response.data && response.data.results) {
            const exercisesWithInfo = await Promise.all(
                response.data.results.map(async (exercise) => {
                    let exerciseName = `Ejercicio ${exercise.id}`;
                    let description = '';
                    
                    try {
                        const exerciseInfo = await getExerciseInfoFromWger(exercise.id, language);
                        if (exerciseInfo) {
                            exerciseName = exerciseInfo.name || exerciseName;
                            description = exerciseInfo.description || description;
                        }
                    } catch (error) {
                        logger.warn(`No se pudo obtener nombre para ejercicio ${exercise.id}`);
                    }
                    
                    return {
                        exercise_id: exercise.id,
                        wger_id: exercise.id,
                        name: exerciseName,
                        category: mapWgerCategoryToLocal(exercise.category),
                        description: description,
                        muscles: exercise.muscles || [],
                        equipment: exercise.equipment || [],
                        default_calories_per_minute: '5',
                        gif_url: null,
                        is_public: true,
                        source: 'wger',
                        muscle_group: muscleGroup
                    };
                })
            );
            
            return exercisesWithInfo;
        }
        return [];
    } catch (error) {
        // Manejar diferentes tipos de errores
        if (error.code === 'ECONNABORTED') {
            logger.warn(`Timeout al buscar ejercicios por grupo muscular "${muscleGroup}" en wger`);
        } else if (error.response) {
            logger.error(`Error HTTP ${error.response.status} al buscar ejercicios por grupo muscular en wger:`, { 
                error: error.message,
                muscleGroup,
                status: error.response.status 
            });
        } else if (error.request) {
            logger.error('Error de red al buscar ejercicios por grupo muscular en wger (sin respuesta):', { error: error.message });
        } else {
            logger.error('Error al buscar ejercicios por grupo muscular en wger:', { error: error.message });
        }
        return [];
    }
}

// --- 3. GET /api/exercises/search?name=... ---
// Buscar ejercicios por nombre (autocompletar) usando wger API.
router.get('/search', authenticateToken, async (req, res) => {
    const { name } = req.query;

    if (!name || name.length < 2) {
        return res.status(400).json({ error: 'El nombre de búsqueda debe tener al menos 2 caracteres.' });
    }

    try {
        // Primero buscar en la base de datos local (prioridad)
        const localResults = await db.select()
            .from(exercises)
            .where(ilike(exercises.name, `%${name.trim()}%`))
            .orderBy(asc(exercises.name))
            .limit(20); // Aumentar límite para priorizar resultados locales
        
        // Deshabilitado: búsqueda en wger API para evitar timeouts
        // Solo retornar resultados locales
        return res.status(200).json({
            exercises: localResults.map(ex => ({ ...ex, source: 'local' })),
            count: localResults.length,
        });

    } catch (error) {
        logger.error('Error al buscar ejercicios:', { error: error.message, stack: error.stack });
        return res.status(500).json({ error: 'Error interno del servidor.' });
    }
});

// Función helper para obtener imágenes de un ejercicio desde wger
async function getExerciseImagesFromWger(wgerExerciseId) {
    try {
        const response = await axios.get(`${WGER_API_BASE}/exerciseimage/`, {
            params: {
                exercise: wgerExerciseId,
                is_main: true // wger acepta booleanos
            },
            timeout: 5000
        });

        if (response.data && response.data.results && response.data.results.length > 0) {
            // Ordenar por is_main=true primero, luego tomar la primera
            const mainImages = response.data.results.filter(img => img.is_main);
            const imageToUse = mainImages.length > 0 ? mainImages[0] : response.data.results[0];
            
            // wger proporciona URLs completas o relativas, construir la URL completa
            if (imageToUse.image) {
                // Si la URL ya es completa, usarla directamente
                if (imageToUse.image.startsWith('http')) {
                    return imageToUse.image;
                }
                // Si es relativa, construir la URL completa
                return `https://wger.de${imageToUse.image}`;
            }
            
            // Fallback a thumbnail si existe
            if (imageToUse.image_thumbnail) {
                if (imageToUse.image_thumbnail.startsWith('http')) {
                    return imageToUse.image_thumbnail;
                }
                return `https://wger.de${imageToUse.image_thumbnail}`;
            }
        }
        return null;
    } catch (error) {
        // Manejar diferentes tipos de errores
        if (error.code === 'ECONNABORTED') {
            logger.warn(`Timeout al obtener imágenes de wger para ejercicio ${wgerExerciseId}`);
        } else if (error.response) {
            // El servidor respondió con un código de estado fuera del rango 2xx
            logger.error(`Error HTTP ${error.response.status} al obtener imágenes de wger:`, { 
                error: error.message,
                status: error.response.status,
                data: error.response.data 
            });
        } else if (error.request) {
            // La solicitud se hizo pero no se recibió respuesta
            logger.error('Error de red al obtener imágenes de wger (sin respuesta):', { error: error.message });
        } else {
            logger.error('Error al obtener imágenes de wger:', { error: error.message });
        }
        return null;
    }
}

// Función helper para obtener videos de un ejercicio desde wger
async function getExerciseVideosFromWger(wgerExerciseId) {
    try {
        const response = await axios.get(`${WGER_API_BASE}/video/`, {
            params: {
                exercise: wgerExerciseId
            },
            timeout: 5000
        });

        if (response.data && response.data.results && response.data.results.length > 0) {
            const videoToUse = response.data.results[0];
            
            if (videoToUse.video) {
                // Si la URL ya es completa, usarla directamente
                if (videoToUse.video.startsWith('http')) {
                    return videoToUse.video;
                }
                // Si es relativa, construir la URL completa
                return `https://wger.de${videoToUse.video}`;
            }
        }
        return null;
    } catch (error) {
        // Manejar diferentes tipos de errores
        if (error.code === 'ECONNABORTED') {
            logger.warn(`Timeout al obtener videos de wger para ejercicio ${wgerExerciseId}`);
        } else if (error.response) {
            logger.error(`Error HTTP ${error.response.status} al obtener videos de wger:`, { 
                error: error.message,
                status: error.response.status 
            });
        } else if (error.request) {
            logger.error('Error de red al obtener videos de wger (sin respuesta):', { error: error.message });
        } else {
            logger.error('Error al obtener videos de wger:', { error: error.message });
        }
        return null;
    }
}

// Función helper para buscar un ejercicio por nombre en wger y obtener su ID
async function findWgerExerciseIdByName(exerciseName) {
    try {
        const response = await axios.get(`${WGER_API_BASE}/exercise/`, {
            params: {
                language: 2, // 2 = español
                term: exerciseName.trim()
            },
            timeout: 5000
        });

        if (response.data && response.data.results && response.data.results.length > 0) {
            // Obtener información de cada ejercicio para comparar nombres
            for (const exercise of response.data.results) {
                const exerciseInfo = await getExerciseInfoFromWger(exercise.id, 2);
                const name = exerciseInfo?.name || '';
                
                // Buscar coincidencia exacta
                if (name.toLowerCase() === exerciseName.trim().toLowerCase()) {
                    return exercise.id;
                }
                
                // Buscar coincidencia que empiece con el término
                if (name.toLowerCase().startsWith(exerciseName.trim().toLowerCase())) {
                    return exercise.id;
                }
            }
            
            // Si no hay coincidencia, retornar el primero
            return response.data.results[0].id;
        }
        return null;
    } catch (error) {
        // Manejar diferentes tipos de errores
        if (error.code === 'ECONNABORTED') {
            logger.warn(`Timeout al buscar ejercicio "${exerciseName}" en wger`);
        } else if (error.response) {
            logger.error(`Error HTTP ${error.response.status} al buscar ejercicio en wger:`, { 
                error: error.message,
                exerciseName 
            });
        } else if (error.request) {
            logger.error('Error de red al buscar ejercicio en wger (sin respuesta):', { error: error.message });
        } else {
            logger.error('Error al buscar ejercicio en wger:', { error: error.message });
        }
        return null;
    }
}

// --- 4. GET /api/exercises/gif?name=... o ?wger_id=... ---
// Obtener GIF/imagen de un ejercicio desde la base de datos local
// Nota: Endpoint público, no requiere autenticación ya que solo obtiene información de ejercicios públicos
router.get('/gif', async (req, res) => {
    const { name, wger_id } = req.query;

    if (!name && !wger_id) {
        return res.status(400).json({ error: 'El nombre del ejercicio o wger_id es requerido.' });
    }

    try {
        let exerciseWgerId = wger_id;
        let exerciseName = name;

        // Si solo tenemos el nombre, buscar en la base de datos local primero
        if (!exerciseWgerId && exerciseName) {
            const localExercise = await db.select()
                .from(exercises)
                .where(ilike(exercises.name, exerciseName.trim()))
                .limit(1);

            // Si tenemos el ejercicio en la base de datos local
            if (localExercise.length > 0) {
                // Si ya tiene GIF URL o video URL, devolverlos directamente
                if (localExercise[0].gif_url || localExercise[0].video_url) {
                    return res.status(200).json({
                        gif_url: localExercise[0].gif_url || null,
                        video_url: localExercise[0].video_url || null,
                        source: 'database',
                        wger_id: localExercise[0].wger_id || null
                    });
                }
                
                // Si tiene wger_id pero no gif_url ni video_url, usarlo para buscar
                if (localExercise[0].wger_id) {
                    exerciseWgerId = localExercise[0].wger_id;
                }
            }
            
            // Deshabilitado: búsqueda en wger API para evitar timeouts
            // Si no encontramos wger_id, no buscar en wger
        }

        // Deshabilitado: búsqueda en wger API para evitar timeouts
        // Si tenemos el ID de wger y el ejercicio local tiene imagen, retornarla
        if (exerciseWgerId) {
            const localExercise = await db.select()
                .from(exercises)
                .where(ilike(exercises.name, exerciseName.trim()))
                .limit(1);
            
            if (localExercise.length > 0 && (localExercise[0].gif_url || localExercise[0].video_url)) {
                return res.status(200).json({
                    gif_url: localExercise[0].gif_url || null,
                    video_url: localExercise[0].video_url || null,
                    source: 'local',
                    wger_id: exerciseWgerId
                });
            }
        }

        // Si no se encuentra imagen local, retornar placeholder
        return res.status(200).json({
            gif_url: 'https://via.placeholder.com/300x200/4a5568/ffffff?text=Exercise+Demonstration',
            video_url: null,
            source: 'placeholder',
            message: 'Imagen no encontrada localmente, mostrando placeholder'
        });

    } catch (error) {
        logger.error('Error al obtener GIF del ejercicio:', { error: error.message, stack: error.stack });
        return res.status(500).json({ error: 'Error interno del servidor.' });
    }
});

// --- 5. GET /api/exercises/by-muscle-group?group=... ---
// Obtener ejercicios filtrados por grupo muscular (pecho, pierna, espalda, brazos, hombros)
router.get('/by-muscle-group', authenticateToken, async (req, res) => {
    const { group } = req.query;

    if (!group) {
        return res.status(400).json({ error: 'El grupo muscular es requerido. Valores válidos: pecho, pierna, espalda, brazos, hombros' });
    }

    const validGroups = ['pecho', 'pierna', 'piernas', 'espalda', 'brazos', 'brazo', 'hombros', 'hombro'];
    const normalizedGroup = group.toLowerCase();
    
    if (!validGroups.includes(normalizedGroup)) {
        return res.status(400).json({ 
            error: 'Grupo muscular no válido. Valores válidos: pecho, pierna, espalda, brazos, hombros' 
        });
    }

    try {
        // Buscar en la base de datos local primero
        // Para esto, necesitamos buscar por nombre que contenga palabras clave del grupo muscular
        const muscleGroupKeywords = {
            'pecho': ['pecho', 'chest', 'press banca', 'press pecho', 'pectoral'],
            'pierna': ['pierna', 'leg', 'squat', 'sentadilla', 'prensa', 'extensión'],
            'piernas': ['pierna', 'leg', 'squat', 'sentadilla', 'prensa', 'extensión'],
            'espalda': ['espalda', 'back', 'remo', 'pull', 'jalón', 'dominada'],
            'brazos': ['brazo', 'arm', 'curl', 'tríceps', 'bíceps', 'press'],
            'brazo': ['brazo', 'arm', 'curl', 'tríceps', 'bíceps', 'press'],
            'hombros': ['hombro', 'shoulder', 'press militar', 'elevación', 'lateral'],
            'hombro': ['hombro', 'shoulder', 'press militar', 'elevación', 'lateral']
        };
        
        const keywords = muscleGroupKeywords[normalizedGroup] || [];
        let localResults = [];
        
        // Buscar ejercicios locales que coincidan con las palabras clave
        if (keywords.length > 0) {
            const searchConditions = keywords.map(keyword => 
                ilike(exercises.name, `%${keyword}%`)
            );
            
            // Usar OR para buscar cualquier palabra clave
            localResults = await db.select()
                .from(exercises)
                .where(or(...searchConditions))
                .orderBy(asc(exercises.name))
                .limit(30);
        }
        
        // Deshabilitado: búsqueda en wger API para evitar timeouts
        // Solo retornar resultados locales
        return res.status(200).json({
            exercises: localResults.map(ex => ({ ...ex, source: 'local', muscle_group: normalizedGroup })),
            count: localResults.length,
            muscle_group: normalizedGroup
        });

    } catch (error) {
        logger.error('Error al obtener ejercicios por grupo muscular:', { error: error.message, stack: error.stack });
        return res.status(500).json({ error: 'Error interno del servidor.' });
    }
});



module.exports = router;