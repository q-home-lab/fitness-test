// Script para ejecutar después del despliegue
// Ejecuta las migraciones automáticamente

require('dotenv').config();
const { exec } = require('child_process');

console.log('🚀 Ejecutando migraciones post-despliegue...');

// Ejecutar migraciones
exec('node db/migrate.js', (error, stdout, stderr) => {
    if (error) {
        console.error('❌ Error al ejecutar migraciones:', error);
        console.error('stderr:', stderr);
        // No salir con error para que el servicio siga iniciando
        // Las migraciones se pueden ejecutar manualmente si fallan
    } else {
        console.log('✅ Migraciones ejecutadas exitosamente');
        console.log(stdout);
    }
});

