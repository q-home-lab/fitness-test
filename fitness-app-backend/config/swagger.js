/**
 * Configuración de Swagger/OpenAPI
 * Documentación automática de la API
 */

const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Fitness App API',
      version: '1.0.0',
      description: 'API REST para la aplicación de fitness y seguimiento de ejercicios',
      contact: {
        name: 'API Support',
        email: 'support@fitnessapp.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: process.env.API_URL || 'http://localhost:4000/api',
        description: 'Servidor de desarrollo',
      },
      {
        url: process.env.PRODUCTION_API_URL || 'https://api.fitnessapp.com/api',
        description: 'Servidor de producción',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Token JWT obtenido del endpoint /auth/login',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Mensaje de error',
            },
            details: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: { type: 'string' },
                  message: { type: 'string' },
                  value: { type: 'string' },
                },
              },
            },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            email: { type: 'string', format: 'email' },
            role: { type: 'string', enum: ['CLIENT', 'COACH', 'ADMIN'] },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
        Goal: {
          type: 'object',
          properties: {
            goal_id: { type: 'integer' },
            user_id: { type: 'integer' },
            target_weight: { type: 'number' },
            current_weight: { type: 'number' },
            daily_calorie_goal: { type: 'number' },
            goal_type: { type: 'string', enum: ['weight_loss', 'weight_gain', 'maintain'] },
            is_active: { type: 'boolean' },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
        Routine: {
          type: 'object',
          properties: {
            routine_id: { type: 'integer' },
            user_id: { type: 'integer' },
            name: { type: 'string' },
            description: { type: 'string' },
            is_active: { type: 'boolean' },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
        Exercise: {
          type: 'object',
          properties: {
            exercise_id: { type: 'integer' },
            name: { type: 'string' },
            category: { type: 'string' },
            default_calories_per_minute: { type: 'number' },
            gif_url: { type: 'string', format: 'uri' },
            video_url: { type: 'string', format: 'uri' },
            is_public: { type: 'boolean' },
          },
        },
        Food: {
          type: 'object',
          properties: {
            food_id: { type: 'integer' },
            name: { type: 'string' },
            calories_base: { type: 'number' },
            protein_g: { type: 'number' },
            carbs_g: { type: 'number' },
            fat_g: { type: 'number' },
          },
        },
        DailyLog: {
          type: 'object',
          properties: {
            log_id: { type: 'integer' },
            user_id: { type: 'integer' },
            date: { type: 'string', format: 'date' },
            weight: { type: 'number' },
            consumed_calories: { type: 'number' },
            burned_calories: { type: 'number' },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: [
    './routes/*.js', // Rutas de la API
    './index.js', // Archivo principal
  ],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;

