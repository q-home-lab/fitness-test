const express = require('express');
const router = express.Router();

const authenticateToken = require('./authMiddleware');
const { db } = require('../db/db_config');
const { foods } = require('../db/schema');
const { eq, ilike } = require('drizzle-orm');
const logger = require('../utils/logger');
const { getOrSetCache, invalidateCache } = require('../utils/cache');
const { generalLimiter, createLimiter } = require('../middleware/rateLimiter');
const { routeValidations, handleValidationErrors } = require('../middleware/validation');

// =================================================================
// 1. GET /api/foods/search?name=...
// BUSCAR alimentos por nombre (usando LIKE/ILIKE)
// No requiere autenticación para mejor UX
// =================================================================
router.get('/search', 
    generalLimiter,
    async (req, res) => {
        const { name } = req.query;

        if (!name || name.length < 2) {
            return res.status(400).json({ error: 'El nombre de búsqueda debe tener al menos 2 caracteres.' });
        }

        try {
            const searchTerm = name.trim().toLowerCase();
            const cacheKey = `foods:search:${searchTerm}`;

            // Cache por 5 minutos
            const result = await getOrSetCache(cacheKey, async () => {
                const searchResults = await db.select()
                    .from(foods)
                    .where(ilike(foods.name, `%${searchTerm}%`))
                    .limit(20);

                return {
                    foods: searchResults,
                    count: searchResults.length,
                };
            }, 300);

            return res.status(200).json(result);

        } catch (error) {
            logger.error('Error al buscar alimentos:', { error: error.message, stack: error.stack, searchTerm: name });
            return res.status(500).json({ error: 'Error interno del servidor.' });
        }
    }
);

// =================================================================
// 2. POST /api/foods/
// CREAR un nuevo alimento personalizado
// Requiere autenticación
// =================================================================
router.post('/', 
    authenticateToken,
    createLimiter,
    routeValidations.createFood,
    handleValidationErrors,
    async (req, res) => {
    // No usamos req.user.id porque los alimentos son compartidos o preexistentes.
    const { name, calories_base, protein_g = 0, carbs_g = 0, fat_g = 0 } = req.body;

    if (!name || !calories_base || isNaN(calories_base) || parseFloat(calories_base) < 0) {
        return res.status(400).json({ error: 'Faltan campos requeridos o son inválidos: name y calories_base.' });
    }

    try {
        // Opcional: Verificar si el alimento ya existe (por el nombre)
        const existingFood = await db.select()
            .from(foods)
            .where(eq(foods.name, name.trim()))
            .limit(1);

        if (existingFood.length > 0) {
            // Si existe, devolver el alimento existente en lugar de error 409
            return res.status(200).json({
                message: 'Alimento ya existe.',
                food: existingFood[0]
            });
        }
        
        // Insertar el nuevo alimento
        const newFood = await db.insert(foods)
            .values({
                name: name.trim(),
                calories_base: parseFloat(calories_base).toFixed(2),
                protein_g: parseFloat(protein_g).toFixed(2),
                carbs_g: parseFloat(carbs_g).toFixed(2),
                fat_g: parseFloat(fat_g).toFixed(2),
            })
            .returning();

        // Invalidar cache de búsquedas
        invalidateCache('foods:search:*');

        logger.info(`Alimento creado exitosamente: ${name.trim()}`);

        return res.status(201).json({
            message: 'Alimento creado con éxito.',
            food: newFood[0]
        });

    } catch (error) {
        logger.error('Error al crear alimento:', { error: error.message, stack: error.stack, name });
        // Si es un error de duplicado, intentar obtener el alimento existente
        if (error.code === '23505' || error.cause?.code === '23505') {
            try {
                const existingFood = await db.select()
                    .from(foods)
                    .where(eq(foods.name, name.trim()))
                    .limit(1);
                
                if (existingFood.length > 0) {
                    return res.status(200).json({
                        message: 'Alimento ya existe.',
                        food: existingFood[0]
                    });
                }
            } catch (e) {
                // Si no podemos obtenerlo, devolver error
            }
        }
        return res.status(500).json({ error: 'Error interno del servidor.' });
    }
});

module.exports = router;
