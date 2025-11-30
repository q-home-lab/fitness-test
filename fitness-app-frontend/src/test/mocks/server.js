import { setupServer } from 'msw/node';
import { handlers } from './handlers';

// Configurar servidor MSW para tests
export const server = setupServer(...handlers);

