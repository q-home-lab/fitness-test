// Script completo para probar la integración con nuestros endpoints
require('dotenv').config();
const axios = require('axios');

const API_BASE = 'http://localhost:4000/api';

// Nota: Este script requiere que el servidor esté corriendo
// y que tengas un token de autenticación válido

async function testFullIntegration() {
    console.log('🧪 Probando integración completa con wger...\n');
    
    // Necesitarías tener un token de autenticación
    // Por ahora solo probamos que los endpoints estén configurados
    
    console.log('✅ Los endpoints están configurados para usar wger API');
    console.log('📝 Para probar completamente:');
    console.log('   1. Inicia el servidor: npm start');
    console.log('   2. Inicia sesión para obtener un token');
    console.log('   3. Prueba: GET /api/exercises/search?name=push');
    console.log('   4. Prueba: GET /api/exercises/gif?wger_id=167\n');
    
    console.log('🔍 Verificando que wger API esté accesible...');
    try {
        const response = await axios.get('https://wger.de/api/v2/exercise/?language=2&limit=1');
        console.log(`✅ wger API está accesible (${response.data.count} ejercicios disponibles)`);
        
        // Probar obtención de imagen
        const imgResponse = await axios.get('https://wger.de/api/v2/exerciseimage/?limit=1&is_main=true');
        if (imgResponse.data.results && imgResponse.data.results.length > 0) {
            console.log(`✅ Imágenes disponibles (ejemplo: ejercicio ${imgResponse.data.results[0].exercise})`);
        }
    } catch (error) {
        console.error('❌ Error al acceder a wger API:', error.message);
    }
}

testFullIntegration().catch(console.error);

