#!/bin/sh
set -e

echo "🚀 Iniciando aplicación..."

# Ejecutar migraciones
echo "📦 Ejecutando migraciones de base de datos..."
npm run db:migrate || {
    echo "⚠️  Advertencia: Las migraciones fallaron, pero continuando..."
}

# Iniciar el servidor
echo "✅ Iniciando servidor..."
exec node index.js

