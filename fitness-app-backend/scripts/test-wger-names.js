// Script para probar cómo obtener nombres de ejercicios de wger
require('dotenv').config();
const axios = require('axios');

const WGER_API_BASE = 'https://wger.de/api/v2';

async function testExerciseNames() {
    console.log('🔍 Probando obtención de nombres de ejercicios...\n');

    // Obtener un ejercicio con imagen
    try {
        const imgResponse = await axios.get(`${WGER_API_BASE}/exerciseimage/?limit=1&is_main=true`);
        if (imgResponse.data.results && imgResponse.data.results.length > 0) {
            const exerciseId = imgResponse.data.results[0].exercise;
            console.log(`📸 Ejercicio con imagen encontrado: ID ${exerciseId}\n`);

            // Probar diferentes formas de obtener el nombre
            console.log('1️⃣  Probando endpoint /exercise/{id}/...');
            try {
                const exResponse = await axios.get(`${WGER_API_BASE}/exercise/${exerciseId}/`);
                console.log('✅ Endpoint funciona');
                console.log('   Campos:', Object.keys(exResponse.data).join(', '));
                
                // Buscar traducciones o nombres
                if (exResponse.data.translations) {
                    console.log('   Traducciones encontradas:', exResponse.data.translations.length);
                    const esTranslation = exResponse.data.translations.find(t => t.language === 2);
                    if (esTranslation) {
                        console.log(`   Nombre en español: "${esTranslation.name}"`);
                    }
                }
            } catch (e) {
                console.log('❌ Error:', e.response?.status || e.message);
            }

            console.log('\n2️⃣  Probando endpoint /exercisebase/{id}/...');
            try {
                // Primero obtener el base_id
                const exDetail = await axios.get(`${WGER_API_BASE}/exercise/${exerciseId}/`);
                if (exDetail.data.exercise_base) {
                    const baseId = exDetail.data.exercise_base;
                    const baseResponse = await axios.get(`${WGER_API_BASE}/exercisebase/${baseId}/`);
                    console.log('✅ Exercisebase funciona');
                    console.log('   Campos:', Object.keys(baseResponse.data).join(', '));
                    
                    if (baseResponse.data.exercises) {
                        const esExercise = baseResponse.data.exercises.find(e => e.language === 2);
                        if (esExercise) {
                            console.log(`   Nombre en español: "${esExercise.name}"`);
                        }
                    }
                }
            } catch (e) {
                console.log('❌ Error:', e.response?.status || e.message);
            }

            console.log('\n3️⃣  Probando búsqueda con term y verificando nombres...');
            try {
                const searchResponse = await axios.get(`${WGER_API_BASE}/exercise/`, {
                    params: {
                        language: 2,
                        term: 'crunch',
                        limit: 1
                    }
                });
                
                if (searchResponse.data.results && searchResponse.data.results.length > 0) {
                    const foundId = searchResponse.data.results[0].id;
                    console.log(`✅ Búsqueda funciona, ID encontrado: ${foundId}`);
                    
                    // Intentar obtener detalles
                    const detailResponse = await axios.get(`${WGER_API_BASE}/exercise/${foundId}/`);
                    console.log('   Estructura completa:', JSON.stringify(detailResponse.data, null, 2).substring(0, 500));
                }
            } catch (e) {
                console.log('❌ Error:', e.message);
            }
        }
    } catch (e) {
        console.error('Error inicial:', e.message);
    }
}

testExerciseNames().catch(console.error);

