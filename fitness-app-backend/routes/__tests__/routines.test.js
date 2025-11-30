const request = require('supertest');
const express = require('express');
const routinesRoutes = require('../routines');
const authenticateToken = require('../authMiddleware');

// Mock del middleware de autenticación
jest.mock('../authMiddleware', () => (req, res, next) => {
  req.user = { id: 1 };
  next();
});

// Mock de la base de datos
jest.mock('../../db/db_config', () => ({
  db: {
    select: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}));

// Mock de logger
jest.mock('../../utils/logger', () => ({
  error: jest.fn(),
}));

const { db } = require('../../db/db_config');
const app = express();
app.use(express.json());
app.use('/routines', routinesRoutes);

describe('Routines Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /routines', () => {
    it('debe listar rutinas del usuario con paginación', async () => {
      jest.clearAllMocks();
      
      // Mock: contar total
      db.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValueOnce({
          where: jest.fn().mockResolvedValueOnce([{ count: '5' }]),
        }),
      });

      // Mock: obtener rutinas
      db.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValueOnce({
          where: jest.fn().mockReturnValueOnce({
            orderBy: jest.fn().mockReturnValueOnce({
              limit: jest.fn().mockReturnValueOnce({
                offset: jest.fn().mockResolvedValueOnce([
                  { routine_id: 1, name: 'Rutina 1' },
                  { routine_id: 2, name: 'Rutina 2' },
                ]),
              }),
            }),
          }),
        }),
      });

      const response = await request(app)
        .get('/routines?page=1&limit=20');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('routines');
      expect(response.body).toHaveProperty('pagination');
      expect(response.body.pagination).toHaveProperty('page', 1);
      expect(response.body.pagination).toHaveProperty('limit', 20);
    });
  });

  describe('POST /routines', () => {
    it('debe crear una nueva rutina', async () => {
      jest.clearAllMocks();
      db.insert.mockReturnValueOnce({
        values: jest.fn().mockReturnValueOnce({
          returning: jest.fn().mockResolvedValueOnce([{
            routine_id: 1,
            name: 'Nueva Rutina',
            description: 'Descripción',
            user_id: 1,
            is_active: true,
            created_at: new Date(),
          }]),
        }),
      });

      const response = await request(app)
        .post('/routines')
        .send({
          name: 'Nueva Rutina',
          description: 'Descripción',
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('routine');
      expect(response.body.routine.name).toBe('Nueva Rutina');
    });

    it('debe validar que el nombre sea requerido', async () => {
      const response = await request(app)
        .post('/routines')
        .send({
          description: 'Sin nombre',
        });

      expect(response.status).toBe(400);
    });
  });
});

