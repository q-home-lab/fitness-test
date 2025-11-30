/**
 * Script para poblar la base de datos con alimentos comunes
 * Ejecutar: npm run seed:foods
 */

require('dotenv').config();
const { db } = require('../db/db_config');
const { foods } = require('../db/schema');
const { eq } = require('drizzle-orm');

// Lista de alimentos comunes con sus valores nutricionales (por 100g)
const commonFoods = [
    // Proteínas
    { name: 'Pollo (pechuga sin piel)', calories_base: 165, protein_g: 31, carbs_g: 0, fat_g: 3.6 },
    { name: 'Ternera (lomo)', calories_base: 250, protein_g: 26, carbs_g: 0, fat_g: 17 },
    { name: 'Cerdo (lomo)', calories_base: 242, protein_g: 27, carbs_g: 0, fat_g: 14 },
    { name: 'Pavo (pechuga)', calories_base: 135, protein_g: 30, carbs_g: 0, fat_g: 1 },
    { name: 'Salmón', calories_base: 208, protein_g: 20, carbs_g: 0, fat_g: 13 },
    { name: 'Atún (fresco)', calories_base: 184, protein_g: 30, carbs_g: 0, fat_g: 6 },
    { name: 'Atún en lata (agua)', calories_base: 116, protein_g: 26, carbs_g: 0, fat_g: 1 },
    { name: 'Huevos (enteros)', calories_base: 155, protein_g: 13, carbs_g: 1.1, fat_g: 11 },
    { name: 'Huevos (claras)', calories_base: 52, protein_g: 11, carbs_g: 0.7, fat_g: 0.2 },
    { name: 'Yogur griego natural', calories_base: 59, protein_g: 10, carbs_g: 3.6, fat_g: 0.4 },
    { name: 'Queso cottage', calories_base: 98, protein_g: 11, carbs_g: 3.4, fat_g: 4.3 },
    { name: 'Pechuga de pollo a la plancha', calories_base: 165, protein_g: 31, carbs_g: 0, fat_g: 3.6 },
    
    // Carbohidratos
    { name: 'Arroz blanco (cocido)', calories_base: 130, protein_g: 2.7, carbs_g: 28, fat_g: 0.3 },
    { name: 'Arroz integral (cocido)', calories_base: 111, protein_g: 2.6, carbs_g: 23, fat_g: 0.9 },
    { name: 'Pasta (cocida)', calories_base: 131, protein_g: 5, carbs_g: 25, fat_g: 1.1 },
    { name: 'Pasta integral (cocida)', calories_base: 124, protein_g: 5, carbs_g: 25, fat_g: 1.1 },
    { name: 'Pan integral', calories_base: 247, protein_g: 13, carbs_g: 41, fat_g: 4.2 },
    { name: 'Pan blanco', calories_base: 265, protein_g: 9, carbs_g: 49, fat_g: 3.2 },
    { name: 'Avena (cocida)', calories_base: 68, protein_g: 2.4, carbs_g: 12, fat_g: 1.4 },
    { name: 'Quinoa (cocida)', calories_base: 120, protein_g: 4.4, carbs_g: 22, fat_g: 1.9 },
    { name: 'Patata (cocida)', calories_base: 87, protein_g: 2, carbs_g: 20, fat_g: 0.1 },
    { name: 'Batata (cocida)', calories_base: 86, protein_g: 1.6, carbs_g: 20, fat_g: 0.1 },
    { name: 'Plátano', calories_base: 89, protein_g: 1.1, carbs_g: 23, fat_g: 0.3 },
    
    // Verduras
    { name: 'Brócoli (cocido)', calories_base: 35, protein_g: 2.8, carbs_g: 7, fat_g: 0.4 },
    { name: 'Espinacas (cocidas)', calories_base: 23, protein_g: 3, carbs_g: 3.8, fat_g: 0.3 },
    { name: 'Tomate', calories_base: 18, protein_g: 0.9, carbs_g: 3.9, fat_g: 0.2 },
    { name: 'Lechuga', calories_base: 15, protein_g: 1.4, carbs_g: 2.9, fat_g: 0.2 },
    { name: 'Zanahoria', calories_base: 41, protein_g: 0.9, carbs_g: 10, fat_g: 0.2 },
    { name: 'Pepino', calories_base: 16, protein_g: 0.7, carbs_g: 4, fat_g: 0.1 },
    { name: 'Cebolla', calories_base: 40, protein_g: 1.1, carbs_g: 9.3, fat_g: 0.1 },
    { name: 'Pimiento rojo', calories_base: 31, protein_g: 1, carbs_g: 7, fat_g: 0.3 },
    
    // Frutas
    { name: 'Manzana', calories_base: 52, protein_g: 0.3, carbs_g: 14, fat_g: 0.2 },
    { name: 'Naranja', calories_base: 47, protein_g: 0.9, carbs_g: 12, fat_g: 0.1 },
    { name: 'Fresa', calories_base: 32, protein_g: 0.7, carbs_g: 7.7, fat_g: 0.3 },
    { name: 'Uvas', calories_base: 69, protein_g: 0.7, carbs_g: 18, fat_g: 0.2 },
    { name: 'Pera', calories_base: 57, protein_g: 0.4, carbs_g: 15, fat_g: 0.1 },
    
    // Legumbres
    { name: 'Lentejas (cocidas)', calories_base: 116, protein_g: 9, carbs_g: 20, fat_g: 0.4 },
    { name: 'Garbanzos (cocidos)', calories_base: 164, protein_g: 8.9, carbs_g: 27, fat_g: 2.6 },
    { name: 'Judías negras (cocidas)', calories_base: 132, protein_g: 8.9, carbs_g: 24, fat_g: 0.5 },
    
    // Frutos secos y semillas
    { name: 'Almendras', calories_base: 579, protein_g: 21, carbs_g: 22, fat_g: 50 },
    { name: 'Nueces', calories_base: 654, protein_g: 15, carbs_g: 14, fat_g: 65 },
    { name: 'Avellanas', calories_base: 628, protein_g: 15, carbs_g: 17, fat_g: 61 },
    { name: 'Aguacate', calories_base: 160, protein_g: 2, carbs_g: 9, fat_g: 15 },
    
    // Lácteos
    { name: 'Leche entera', calories_base: 61, protein_g: 3.3, carbs_g: 4.8, fat_g: 3.3 },
    { name: 'Leche desnatada', calories_base: 34, protein_g: 3.4, carbs_g: 5, fat_g: 0.1 },
    { name: 'Queso mozzarella', calories_base: 300, protein_g: 22, carbs_g: 2.2, fat_g: 22 },
    { name: 'Queso cheddar', calories_base: 402, protein_g: 25, carbs_g: 1.3, fat_g: 33 },
    
    // Otros
    { name: 'Aceite de oliva', calories_base: 884, protein_g: 0, carbs_g: 0, fat_g: 100 },
    { name: 'Miel', calories_base: 304, protein_g: 0.3, carbs_g: 82, fat_g: 0 },
    { name: 'Mantequilla de cacahuete', calories_base: 588, protein_g: 25, carbs_g: 20, fat_g: 50 },
    { name: 'Chocolate negro (70%)', calories_base: 598, protein_g: 7.8, carbs_g: 46, fat_g: 43 },
    { name: 'Aceitunas verdes', calories_base: 145, protein_g: 1, carbs_g: 6, fat_g: 15 },
];

async function seedCommonFoods() {
    console.log('🌱 Iniciando poblamiento de alimentos comunes...\n');
    
    let totalInserted = 0;
    let totalUpdated = 0;
    let totalSkipped = 0;
    let totalErrors = 0;

    for (const food of commonFoods) {
        try {
            // Verificar si ya existe
            const existing = await db.select()
                .from(foods)
                .where(eq(foods.name, food.name))
                .limit(1);

            if (existing.length > 0) {
                // Actualizar si existe pero con valores diferentes
                const existingFood = existing[0];
                const needsUpdate = 
                    parseFloat(existingFood.calories_base) !== food.calories_base ||
                    parseFloat(existingFood.protein_g || 0) !== food.protein_g ||
                    parseFloat(existingFood.carbs_g || 0) !== food.carbs_g ||
                    parseFloat(existingFood.fat_g || 0) !== food.fat_g;

                if (needsUpdate) {
                    await db.update(foods)
                        .set({
                            calories_base: food.calories_base.toFixed(2),
                            protein_g: food.protein_g.toFixed(2),
                            carbs_g: food.carbs_g.toFixed(2),
                            fat_g: food.fat_g.toFixed(2),
                        })
                        .where(eq(foods.food_id, existingFood.food_id));
                    totalUpdated++;
                    console.log(`✏️  Actualizado: ${food.name}`);
                } else {
                    totalSkipped++;
                }
            } else {
                // Insertar nuevo
                await db.insert(foods).values({
                    name: food.name,
                    calories_base: food.calories_base.toFixed(2),
                    protein_g: food.protein_g.toFixed(2),
                    carbs_g: food.carbs_g.toFixed(2),
                    fat_g: food.fat_g.toFixed(2),
                });
                totalInserted++;
                console.log(`✅ Agregado: ${food.name}`);
            }
        } catch (error) {
            const errorCode = error.code || error.cause?.code;
            if (errorCode === '23505') {
                totalSkipped++;
            } else {
                console.error(`❌ Error con ${food.name}:`, error.message);
                totalErrors++;
            }
        }
    }

    console.log('\n✅ Poblamiento completado!');
    console.log(`📊 Resumen:`);
    console.log(`   - Nuevos alimentos: ${totalInserted}`);
    console.log(`   - Alimentos actualizados: ${totalUpdated}`);
    console.log(`   - Alimentos omitidos: ${totalSkipped}`);
    console.log(`   - Errores: ${totalErrors}`);
    console.log(`   - Total procesado: ${totalInserted + totalUpdated + totalSkipped} de ${commonFoods.length}`);
    
    process.exit(0);
}

seedCommonFoods().catch(error => {
    console.error('❌ Error fatal:', error);
    process.exit(1);
});

