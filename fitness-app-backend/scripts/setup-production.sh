#!/bin/bash
# Script de configuración para producción
# Se ejecuta automáticamente en Render antes del build

echo "🔧 Configurando entorno de producción..."

# Verificar que DATABASE_URL esté configurada
if [ -z "$DATABASE_URL" ]; then
    echo "⚠️  ADVERTENCIA: DATABASE_URL no está configurada"
fi

# Instalar dependencias
echo "📦 Instalando dependencias..."
npm install

# Ejecutar migraciones (opcional, descomentar si quieres que se ejecuten automáticamente)
# echo "🗄️  Ejecutando migraciones..."
# node db/migrate.js

echo "✅ Configuración completada"

