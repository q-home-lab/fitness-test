const express = require('express');
const router = express.Router();

const authenticateToken = require('./authMiddleware');
const { db } = require('../db/db_config');
const schema = require('../db/schema');
const { brandSettings } = schema;
const { eq } = require('drizzle-orm');
const logger = require('../utils/logger');

// ---------------------------------------------------------------------------
// RUTA PÚBLICA: Obtener configuración de marca (para landing page)
// GET /api/brand
// ---------------------------------------------------------------------------
router.get('/', async (req, res) => {
    try {
        const settings = await db
            .select()
            .from(brandSettings)
            .limit(1);

        // Si no hay configuración, devolver valores por defecto
        if (settings.length === 0) {
            res.status(200).json({
                brand_name: 'FitnessApp',
                tagline: 'Transforma tu cuerpo, transforma tu vida',
                logo_url: null,
                instagram_url: null,
                facebook_url: null,
                twitter_url: null,
                linkedin_url: null,
                youtube_url: null,
                tiktok_url: null,
                website_url: null,
            });
            return;
        }

        const setting = settings[0];
        res.status(200).json({
            brand_name: setting.brand_name,
            tagline: setting.tagline,
            logo_url: setting.logo_url,
            instagram_url: setting.instagram_url,
            facebook_url: setting.facebook_url,
            twitter_url: setting.twitter_url,
            linkedin_url: setting.linkedin_url,
            youtube_url: setting.youtube_url,
            tiktok_url: setting.tiktok_url,
            website_url: setting.website_url,
        });
    } catch (error) {
        logger.error('Error al obtener configuración de marca:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Error interno del servidor al obtener configuración de marca.' });
        }
    }
});

// Middleware para asegurar que el usuario autenticado es admin
function ensureAdmin(req, res, next) {
    if (!req.user || !req.user.isAdmin) {
        return res.status(403).json({ error: 'Solo los administradores pueden acceder a esta ruta.' });
    }
    next();
}

// ---------------------------------------------------------------------------
// RUTA ADMIN: Obtener configuración de marca (admin)
// GET /api/brand/admin
// ---------------------------------------------------------------------------
router.get('/admin', authenticateToken, ensureAdmin, async (req, res) => {
    try {
        const settings = await db
            .select()
            .from(brandSettings)
            .limit(1);

        if (settings.length === 0) {
            // Si no existe, crear una configuración por defecto
            const defaultSettings = await db
                .insert(brandSettings)
                .values({
                    brand_name: 'FitnessApp',
                    tagline: 'Transforma tu cuerpo, transforma tu vida',
                })
                .returning();

            return res.status(200).json({
                message: 'Configuración de marca cargada (creada por defecto).',
                settings: defaultSettings[0],
            });
        }

        return res.status(200).json({
            message: 'Configuración de marca cargada correctamente.',
            settings: settings[0],
        });
    } catch (error) {
        logger.error('Error al obtener configuración de marca (admin):', error);
        return res.status(500).json({ error: 'Error interno del servidor al obtener configuración de marca.' });
    }
});

// ---------------------------------------------------------------------------
// RUTA ADMIN: Actualizar configuración de marca
// PUT /api/brand/admin
// body: { brand_name, tagline, logo_url, instagram_url, facebook_url, twitter_url, linkedin_url, youtube_url, tiktok_url, website_url }
// ---------------------------------------------------------------------------
router.put('/admin', authenticateToken, ensureAdmin, async (req, res) => {
    const {
        brand_name,
        tagline,
        logo_url,
        instagram_url,
        facebook_url,
        twitter_url,
        linkedin_url,
        youtube_url,
        tiktok_url,
        website_url,
    } = req.body;

    try {
        // Verificar si existe configuración
        const existing = await db
            .select()
            .from(brandSettings)
            .limit(1);

        if (existing.length === 0) {
            // Crear nueva configuración
            const newSettings = await db
                .insert(brandSettings)
                .values({
                    brand_name: brand_name || 'FitnessApp',
                    tagline: tagline || null,
                    logo_url: logo_url || null,
                    instagram_url: instagram_url || null,
                    facebook_url: facebook_url || null,
                    twitter_url: twitter_url || null,
                    linkedin_url: linkedin_url || null,
                    youtube_url: youtube_url || null,
                    tiktok_url: tiktok_url || null,
                    website_url: website_url || null,
                })
                .returning();

            logger.info(`Configuración de marca creada por admin: ${req.user.email}`);
            return res.status(201).json({
                message: 'Configuración de marca creada correctamente.',
                settings: newSettings[0],
            });
        }

        // Actualizar configuración existente
        const updated = await db
            .update(brandSettings)
            .set({
                brand_name: brand_name !== undefined ? brand_name : existing[0].brand_name,
                tagline: tagline !== undefined ? tagline : existing[0].tagline,
                logo_url: logo_url !== undefined ? logo_url : existing[0].logo_url,
                instagram_url: instagram_url !== undefined ? instagram_url : existing[0].instagram_url,
                facebook_url: facebook_url !== undefined ? facebook_url : existing[0].facebook_url,
                twitter_url: twitter_url !== undefined ? twitter_url : existing[0].twitter_url,
                linkedin_url: linkedin_url !== undefined ? linkedin_url : existing[0].linkedin_url,
                youtube_url: youtube_url !== undefined ? youtube_url : existing[0].youtube_url,
                tiktok_url: tiktok_url !== undefined ? tiktok_url : existing[0].tiktok_url,
                website_url: website_url !== undefined ? website_url : existing[0].website_url,
                updated_at: new Date(),
            })
            .where(eq(brandSettings.setting_id, existing[0].setting_id))
            .returning();

        logger.info(`Configuración de marca actualizada por admin: ${req.user.email}`);
        return res.status(200).json({
            message: 'Configuración de marca actualizada correctamente.',
            settings: updated[0],
        });
    } catch (error) {
        logger.error('Error al actualizar configuración de marca:', error);
        return res.status(500).json({ error: 'Error interno del servidor al actualizar configuración de marca.' });
    }
});

module.exports = router;

