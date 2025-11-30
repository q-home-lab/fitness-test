/**
 * Script para poblar la base de datos con alimentos desde Open Food Facts API
 * Open Food Facts es una base de datos colaborativa y open source
 * API Documentation: https://world.openfoodfacts.org/data
 * 
 * Ejecutar: npm run seed:foods:openfoodfacts
 */

require('dotenv').config();
const axios = require('axios');
const { db } = require('../db/db_config');
const { foods } = require('../db/schema');
const { eq, ilike } = require('drizzle-orm');

const OPENFOODFACTS_API_BASE = 'https://world.openfoodfacts.org/cgi/search.pl';

// Categorías comunes de alimentos genéricos para buscar
const FOOD_CATEGORIES = [
    'frutas', 'verduras', 'carnes', 'pescados', 'lacteos', 'cereales',
    'legumbres', 'frutos-secos', 'aceites', 'huevos', 'pan', 'pasta'
];

// Términos de búsqueda comunes en español
const SEARCH_TERMS = [
    'pollo', 'ternera', 'cerdo', 'salmón', 'atún', 'huevos', 'yogur', 'queso',
    'arroz', 'pasta', 'pan', 'avena', 'plátano', 'manzana', 'naranja', 'tomate',
    'lechuga', 'brócoli', 'espinacas', 'zanahoria', 'garbanzos', 'lentejas',
    'almendras', 'nueces', 'aceite de oliva', 'miel', 'chocolate'
];

/**
 * Buscar productos en Open Food Facts
 */
async function searchOpenFoodFacts(searchTerm, page = 1, pageSize = 20) {
    try {
        const response = await axios.get(OPENFOODFACTS_API_BASE, {
            params: {
                action: 'process',
                tagtype_0: 'countries',
                tag_contains_0: 'contains',
                tag_0: 'spain', // Buscar productos disponibles en España
                tagtype_1: 'categories',
                tag_contains_1: 'contains',
                tag_1: searchTerm,
                page_size: pageSize,
                page: page,
                json: true,
                fields: 'product_name,product_name_es,nutriments,generic_name,generic_name_es'
            },
            timeout: 10000
        });

        if (response.data && response.data.products) {
            return response.data.products.filter(product => {
                // Filtrar productos que tienen información nutricional válida
                return product.nutriments && 
                       product.nutriments['energy-kcal_100g'] &&
                       product.product_name;
            });
        }
        return [];
    } catch (error) {
        console.error(`   ❌ Error buscando "${searchTerm}":`, error.message);
        return [];
    }
}

/**
 * Normalizar nombre del producto
 */
function normalizeProductName(name) {
    if (!name) return null;
    
    // Limpiar el nombre
    let normalized = name.trim();
    
    // Eliminar información adicional entre paréntesis que no sea útil
    normalized = normalized.replace(/\s*\([^)]*marca[^)]*\)/gi, '');
    normalized = normalized.replace(/\s*\([^)]*pack[^)]*\)/gi, '');
    
    // Capitalizar primera letra
    normalized = normalized.charAt(0).toUpperCase() + normalized.slice(1).toLowerCase();
    
    // Limitar longitud
    if (normalized.length > 100) {
        normalized = normalized.substring(0, 97) + '...';
    }
    
    return normalized;
}

/**
 * Extraer información nutricional del producto
 */
function extractNutritionData(product) {
    const nutriments = product.nutriments || {};
    
    // Calorías por 100g
    const calories = nutriments['energy-kcal_100g'] || 
                     (nutriments['energy_100g'] ? nutriments['energy_100g'] / 4.184 : null); // Convertir kJ a kcal
    
    // Proteína (g por 100g)
    const protein = nutriments['proteins_100g'] || 0;
    
    // Carbohidratos (g por 100g)
    const carbs = nutriments['carbohydrates_100g'] || 0;
    
    // Grasa (g por 100g)
    const fat = nutriments['fat_100g'] || 0;
    
    if (!calories || calories <= 0) {
        return null;
    }
    
    return {
        calories_base: Math.round(calories),
        protein_g: Math.max(0, parseFloat((protein || 0).toFixed(2))),
        carbs_g: Math.max(0, parseFloat((carbs || 0).toFixed(2))),
        fat_g: Math.max(0, parseFloat((fat || 0).toFixed(2)))
    };
}

/**
 * Convertir producto de Open Food Facts a formato de nuestra base de datos
 */
function convertProductToFood(product) {
    const name = normalizeProductName(product.product_name_es || product.product_name || product.generic_name_es || product.generic_name);
    
    if (!name) {
        return null;
    }
    
    const nutrition = extractNutritionData(product);
    
    if (!nutrition) {
        return null;
    }
    
    return {
        name: name,
        calories_base: nutrition.calories_base,
        protein_g: nutrition.protein_g,
        carbs_g: nutrition.carbs_g,
        fat_g: nutrition.fat_g
    };
}

/**
 * Verificar si un alimento ya existe en la base de datos (por nombre similar)
 */
async function foodExists(name) {
    const existing = await db.select()
        .from(foods)
        .where(ilike(foods.name, `%${name.substring(0, 20)}%`))
        .limit(5);
    
    // Verificar si algún alimento existente es muy similar
    const nameLower = name.toLowerCase();
    for (const food of existing) {
        const existingNameLower = food.name.toLowerCase();
        // Si el nombre es muy similar (90% de similitud), considerar que existe
        if (nameLower.length > 10 && existingNameLower.length > 10) {
            const similarity = calculateSimilarity(nameLower, existingNameLower);
            if (similarity > 0.85) {
                return true;
            }
        }
    }
    
    return false;
}

/**
 * Calcular similitud entre dos strings (simple)
 */
function calculateSimilarity(str1, str2) {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) {
        return 1.0;
    }
    
    const distance = levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
}

/**
 * Distancia de Levenshtein (simplificada)
 */
function levenshteinDistance(str1, str2) {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
        matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
        matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
        for (let j = 1; j <= str1.length; j++) {
            if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1
                );
            }
        }
    }
    
    return matrix[str2.length][str1.length];
}

/**
 * Sincronizar alimentos desde Open Food Facts
 */
async function syncOpenFoodFacts() {
    console.log('🌐 Iniciando sincronización desde Open Food Facts...\n');
    console.log('📋 Buscando productos genéricos comunes...\n');
    
    let totalInserted = 0;
    let totalSkipped = 0;
    let totalErrors = 0;
    const processedNames = new Set();
    
    // Buscar productos por términos comunes
    for (const searchTerm of SEARCH_TERMS) {
        try {
            console.log(`🔍 Buscando: "${searchTerm}"...`);
            const products = await searchOpenFoodFacts(searchTerm, 1, 10); // Solo primera página
            
            for (const product of products) {
                const food = convertProductToFood(product);
                
                if (!food) {
                    continue;
                }
                
                // Evitar duplicados en esta ejecución
                const foodKey = food.name.toLowerCase().trim();
                if (processedNames.has(foodKey)) {
                    totalSkipped++;
                    continue;
                }
                processedNames.add(foodKey);
                
                // Verificar si ya existe en la base de datos
                const existing = await db.select()
                    .from(foods)
                    .where(eq(foods.name, food.name))
                    .limit(1);
                
                if (existing.length > 0) {
                    totalSkipped++;
                    continue;
                }
                
                // Verificar similitud
                if (await foodExists(food.name)) {
                    totalSkipped++;
                    continue;
                }
                
                // Insertar nuevo alimento
                try {
                    await db.insert(foods).values({
                        name: food.name,
                        calories_base: food.calories_base.toFixed(2),
                        protein_g: food.protein_g.toFixed(2),
                        carbs_g: food.carbs_g.toFixed(2),
                        fat_g: food.fat_g.toFixed(2),
                    });
                    totalInserted++;
                    console.log(`   ✅ Agregado: ${food.name} (${food.calories_base} kcal)`);
                } catch (error) {
                    const errorCode = error.code || error.cause?.code;
                    if (errorCode === '23505') {
                        totalSkipped++;
                    } else {
                        console.error(`   ❌ Error insertando ${food.name}:`, error.message);
                        totalErrors++;
                    }
                }
            }
            
            // Pausa entre búsquedas para no sobrecargar la API
            await new Promise(resolve => setTimeout(resolve, 1000));
            
        } catch (error) {
            console.error(`   ❌ Error procesando "${searchTerm}":`, error.message);
            totalErrors++;
        }
    }
    
    console.log('\n✅ Sincronización completada!');
    console.log(`📊 Resumen:`);
    console.log(`   - Nuevos alimentos: ${totalInserted}`);
    console.log(`   - Alimentos omitidos: ${totalSkipped}`);
    console.log(`   - Errores: ${totalErrors}`);
    console.log(`\n💡 Nota: Open Food Facts contiene productos envasados principalmente.`);
    console.log(`   Para alimentos genéricos frescos, usa: npm run seed:foods:extended`);
    
    process.exit(0);
}

syncOpenFoodFacts().catch(error => {
    console.error('❌ Error fatal:', error);
    process.exit(1);
});

