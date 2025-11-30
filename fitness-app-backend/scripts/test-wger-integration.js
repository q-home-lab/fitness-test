// Script para probar la integración con wger API
require('dotenv').config();
const axios = require('axios');

const WGER_API_BASE = 'https://wger.de/api/v2';

async function testWgerIntegration() {
    console.log('🧪 Iniciando pruebas de integración con wger API...\n');

    // Test 1: Verificar que la API responde
    console.log('1️⃣  Probando conexión con wger API...');
    try {
        const response = await axios.get(`${WGER_API_BASE}/exercise/?language=2&limit=1`);
        console.log('✅ API responde correctamente');
        console.log(`   Total de ejercicios disponibles: ${response.data.count || 'N/A'}\n`);
    } catch (error) {
        console.error('❌ Error al conectar con wger API:', error.message);
        return;
    }

    // Test 2: Buscar ejercicios
    console.log('2️⃣  Probando búsqueda de ejercicios con término "push"...');
    try {
        const response = await axios.get(`${WGER_API_BASE}/exercise/`, {
            params: {
                language: 2, // Español
                term: 'push',
                limit: 3
            }
        });

        console.log(`✅ Búsqueda funciona. Encontrados: ${response.data.results?.length || 0} ejercicios`);
        
        if (response.data.results && response.data.results.length > 0) {
            const firstExercise = response.data.results[0];
            console.log(`   Primer ejercicio ID: ${firstExercise.id}`);
            console.log(`   Categoría: ${firstExercise.category}`);
            
            // Intentar obtener traducción
            try {
                const translationResponse = await axios.get(`${WGER_API_BASE}/exercise/${firstExercise.id}/`, {
                    params: { language: 2 }
                });
                
                // Buscar en las traducciones
                if (translationResponse.data && typeof translationResponse.data === 'object') {
                    console.log(`   Estructura disponible en /exercise/:`, Object.keys(translationResponse.data).slice(0, 5).join(', '));
                }
            } catch (e) {
                console.log(`   ⚠️  No se pudo obtener traducción directa`);
            }
        }
        console.log();
    } catch (error) {
        console.error('❌ Error en búsqueda:', error.message);
    }

    // Test 3: Probar obtención de imágenes
    console.log('3️⃣  Probando obtención de imágenes de ejercicio (ID: 345)...');
    try {
        // Probar con diferentes formatos de parámetros
        const testParams = [
            { exercise: 345, is_main: true },
            { exercise: 345, is_main: 'True' },
            { exercise: 345 }
        ];

        let success = false;
        for (const params of testParams) {
            try {
                const response = await axios.get(`${WGER_API_BASE}/exerciseimage/`, { params });
                if (response.data && response.data.results && response.data.results.length > 0) {
                    console.log(`✅ Imágenes funcionan con parámetros:`, params);
                    const img = response.data.results[0];
                    console.log(`   Imágenes encontradas: ${response.data.results.length}`);
                    console.log(`   URL imagen: ${img.image || img.image_thumbnail || 'No disponible'}`);
                    console.log(`   Es principal: ${img.is_main}`);
                    success = true;
                    break;
                }
            } catch (e) {
                // Continuar con siguiente formato
            }
        }

        if (!success) {
            console.log('⚠️  No se pudieron obtener imágenes con los parámetros probados');
            console.log('   Esto puede ser normal si el ejercicio no tiene imágenes');
        }
        console.log();
    } catch (error) {
        console.error('❌ Error al obtener imágenes:', error.message);
    }

    // Test 4: Probar diferentes IDs de ejercicios
    console.log('4️⃣  Probando diferentes IDs de ejercicios comunes...');
    const testIds = [9, 345, 100, 200];
    for (const id of testIds) {
        try {
            const response = await axios.get(`${WGER_API_BASE}/exerciseimage/`, {
                params: { exercise: id, is_main: true }
            });
            if (response.data && response.data.results && response.data.results.length > 0) {
                console.log(`✅ Ejercicio ${id}: ${response.data.results.length} imagen(es) disponible(s)`);
            }
        } catch (e) {
            // Ignorar errores de ejercicios que no existen
        }
    }
    console.log();

    // Test 5: Verificar estructura de respuesta completa
    console.log('5️⃣  Analizando estructura de respuesta de ejercicio...');
    try {
        const response = await axios.get(`${WGER_API_BASE}/exercise/?language=2&limit=1`);
        if (response.data.results && response.data.results.length > 0) {
            const exercise = response.data.results[0];
            console.log('✅ Estructura del ejercicio:');
            console.log(`   Campos: ${Object.keys(exercise).join(', ')}`);
            
            // Intentar acceder al ejercicio directamente
            try {
                const detailResponse = await axios.get(`${WGER_API_BASE}/exercise/${exercise.id}/`);
                console.log(`   ✅ Endpoint /exercise/${exercise.id}/ funciona`);
                
                // Buscar traducciones
                if (detailResponse.data.translations) {
                    console.log(`   Traducciones disponibles: ${detailResponse.data.translations.length}`);
                }
            } catch (e) {
                console.log(`   ⚠️  Endpoint detallado no disponible o requiere formato diferente`);
            }
        }
    } catch (error) {
        console.error('❌ Error:', error.message);
    }

    console.log('\n✅ Pruebas completadas!');
}

testWgerIntegration().catch(console.error);

