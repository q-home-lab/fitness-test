// drizzle.config.js

/** @type { import("drizzle-kit").Config } */
module.exports = {
  // 1. ¡IMPORTANTE! Se añade el dialecto, que era el error principal.
  dialect: 'postgresql', 

  // Ruta a tu archivo de esquema (donde defines las tablas)
  schema: "./db/schema.js",
  
  // Carpeta donde Drizzle-Kit guardará los archivos SQL de migración
  out: "./drizzle", 
  
  // 3. (OPCIONAL): Se elimina la línea 'driver: 'pg'' que causaba el error secundario.
  // driver: 'pg', 
  
  // Drizzle-Kit usará tu DATABASE_URL del .env
  dbCredentials: {
    // 2. Se usa 'url' en lugar de 'connectionString' para la configuración de Drizzle-Kit.
    url: process.env.DATABASE_URL,
  }
};