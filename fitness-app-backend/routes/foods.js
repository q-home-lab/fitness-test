const express = require('express');
const router = express.Router();

const authenticateToken = require('./authMiddleware');
const { db } = require('../db/db_config');
const { foods } = require('../db/schema');
const { eq, ilike, count } = require('drizzle-orm');
const logger = require('../utils/logger');
const { getOrSetCache, invalidateCache } = require('../utils/cache');
const { generalLimiter, createLimiter } = require('../middleware/rateLimiter');
const { routeValidations, handleValidationErrors } = require('../middleware/validation');
const asyncHandler = require('../middleware/asyncHandler');

// =================================================================
// 1. GET /api/foods/search?name=...&page=1&limit=20
// BUSCAR alimentos por nombre (usando LIKE/ILIKE) con paginación
// No requiere autenticación para mejor UX
// =================================================================
router.get('/search', 
    generalLimiter,
    asyncHandler(async (req, res) => {
        const { name, page = 1, limit = 20 } = req.query;

        if (!name || name.length < 2) {
            return res.status(400).json({ error: 'El nombre de búsqueda debe tener al menos 2 caracteres.' });
        }

        const pageNum = Math.max(1, parseInt(page) || 1);
        const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20)); // Máximo 100 por página
        const offset = (pageNum - 1) * limitNum;

        const searchTerm = name.trim().toLowerCase();
        const cacheKey = `foods:search:${searchTerm}:page:${pageNum}:limit:${limitNum}`;

        // Cache por 5 minutos
        const result = await getOrSetCache(cacheKey, async () => {
            // Obtener alimentos con paginación
            const searchResults = await db.select()
                .from(foods)
                .where(ilike(foods.name, `%${searchTerm}%`))
                .limit(limitNum)
                .offset(offset);

            // Obtener total para metadata
            const totalResult = await db.select({ count: count() })
                .from(foods)
                .where(ilike(foods.name, `%${searchTerm}%`));
            
            const total = totalResult[0]?.count || 0;

            return {
                foods: searchResults,
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    total,
                    totalPages: Math.ceil(total / limitNum),
                    hasMore: offset + limitNum < total,
                },
            };
        }, 300);

        return res.status(200).json(result);
    })
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
    asyncHandler(async (req, res) => {
        // No usamos req.user.id porque los alimentos son compartidos o preexistentes.
        const { name, calories_base, protein_g = 0, carbs_g = 0, fat_g = 0 } = req.body;

        if (!name || !calories_base || isNaN(calories_base) || parseFloat(calories_base) < 0) {
            return res.status(400).json({ error: 'Faltan campos requeridos o son inválidos: name y calories_base.' });
        }

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
    })
);

module.exports = router;
