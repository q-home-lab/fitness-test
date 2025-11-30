# Tests Backend

## Configuración

Los tests están configurados con Jest y Supertest.

## Ejecutar Tests

```bash
# Ejecutar todos los tests
npm test

# Ejecutar en modo watch
npm run test:watch

# Ejecutar solo tests de rutas
npm run test:routes

# Ejecutar solo tests de utilidades
npm run test:utils
```

## Estructura

- `routes/__tests__/` - Tests de rutas
- `utils/__tests__/` - Tests de utilidades
- `jest.setup.js` - Configuración global

## Escribir Nuevos Tests

```javascript
const request = require('supertest');
const express = require('express');

// Mock de dependencias
jest.mock('../../db/db_config');
jest.mock('../authMiddleware', () => (req, res, next) => {
  req.user = { id: 1 };
  next();
});

const app = express();
app.use(express.json());
app.use('/my-route', myRoutes);

describe('My Routes', () => {
  it('debe hacer algo', async () => {
    const response = await request(app)
      .get('/my-route')
      .expect(200);
    
    expect(response.body).toHaveProperty('data');
  });
});
```

