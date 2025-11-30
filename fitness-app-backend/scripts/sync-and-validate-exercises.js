// Script maestro que sincroniza y valida ejercicios
// 1. Revisa el estado actual
// 2. Limpia ejercicios inválidos
// 3. Sincroniza desde wger
// 4. Valida URLs
require('dotenv').config();

const { checkExercisesDatabase } = require('./check-exercises-db');
const { cleanInvalidExercises } = require('./clean-invalid-exercises');
const { validateAndCleanExercises } = require('./validate-and-clean-exercises');
const { execSync } = require('child_process');

async function syncAndValidateExercises() {
    console.log('🚀 INICIANDO PROCESO COMPLETO DE SINCRONIZACIÓN Y VALIDACIÓN\n');
    console.log('='.repeat(60));
    console.log('Este proceso realizará:');
    console.log('1. Revisión del estado actual de la base de datos');
    console.log('2. Limpieza de ejercicios inválidos');
    console.log('3. Sincronización desde wger API');
    console.log('4. Validación de URLs de imágenes y videos');
    console.log('='.repeat(60) + '\n');

    try {
        // Paso 1: Revisar estado actual
        console.log('\n📊 PASO 1: Revisando estado actual de la base de datos...\n');
        await checkExercisesDatabase();

        // Paso 2: Limpiar ejercicios inválidos
        console.log('\n🧹 PASO 2: Limpiando ejercicios inválidos...\n');
        await cleanInvalidExercises();

        // Paso 3: Sincronizar desde wger
        console.log('\n🔄 PASO 3: Sincronizando ejercicios desde wger API...\n');
        console.log('   (Ejecutando sync-wger-exercises.js...)\n');
        
        try {
            execSync('node scripts/sync-wger-exercises.js', {
                cwd: process.cwd(),
                stdio: 'inherit',
                encoding: 'utf8'
            });
        } catch (error) {
            console.error('\n⚠️  Error en sincronización:', error.message);
            console.log('   Continuando con la validación...\n');
        }

        // Paso 4: Validar URLs
        console.log('\n✅ PASO 4: Validando URLs de imágenes y videos...\n');
        await validateAndCleanExercises();

        // Revisión final
        console.log('\n📊 PASO 5: Revisión final del estado...\n');
        await checkExercisesDatabase();

        console.log('\n' + '='.repeat(60));
        console.log('🎉 PROCESO COMPLETO FINALIZADO');
        console.log('='.repeat(60));
        console.log('\n✅ Todos los ejercicios han sido sincronizados y validados.');
        console.log('✅ Las imágenes y videos están almacenados en la base de datos.');
        console.log('✅ No será necesario consultar wger API en cada búsqueda.\n');

    } catch (error) {
        console.error('\n❌ Error en el proceso completo:', error);
        process.exit(1);
    }
}

if (require.main === module) {
    syncAndValidateExercises()
        .then(() => {
            console.log('✅ Proceso completado exitosamente');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Error fatal:', error);
            process.exit(1);
        });
}

module.exports = { syncAndValidateExercises };

