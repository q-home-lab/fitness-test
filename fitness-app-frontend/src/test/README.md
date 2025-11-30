# Tests Frontend

## Configuración

Los tests están configurados con Vitest y React Testing Library.

## Ejecutar Tests

```bash
# Ejecutar todos los tests
npm test

# Ejecutar con UI interactiva
npm run test:ui

# Ejecutar con cobertura
npm run test:coverage
```

## Estructura

- `setup.js` - Configuración global de tests
- `utils/testUtils.jsx` - Utilidades de testing (renderWithProviders, mocks)
- `utils/__tests__/` - Tests de utilidades
- `components/__tests__/` - Tests de componentes

## Escribir Nuevos Tests

```javascript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { renderWithProviders } from '../utils/testUtils';
import MyComponent from '../components/MyComponent';

describe('MyComponent', () => {
  it('debe renderizar correctamente', () => {
    renderWithProviders(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

