import { describe, it, expect } from 'vitest';
import {
  isValidEmail,
  isValidNumber,
  isNotEmpty,
  isValidWeight,
  isValidCalories,
  isValidDate,
  isNotFutureDate,
  isValidPassword,
  isValidUrl,
} from '../validators';

describe('validators', () => {
  describe('isValidEmail', () => {
    it('debe validar emails correctos', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name@domain.co.uk')).toBe(true);
    });

    it('debe rechazar emails inválidos', () => {
      expect(isValidEmail('invalid')).toBe(false);
      expect(isValidEmail('invalid@')).toBe(false);
      expect(isValidEmail('@domain.com')).toBe(false);
      expect(isValidEmail(null)).toBe(false);
      expect(isValidEmail('')).toBe(false);
    });
  });

  describe('isValidNumber', () => {
    it('debe validar números correctos', () => {
      expect(isValidNumber(10)).toBe(true);
      expect(isValidNumber(10, 0, 20)).toBe(true);
      expect(isValidNumber(10, 5, 15)).toBe(true);
    });

    it('debe rechazar números fuera de rango', () => {
      expect(isValidNumber(10, 20, 30)).toBe(false);
      expect(isValidNumber(40, 20, 30)).toBe(false);
    });

    it('debe rechazar valores no numéricos', () => {
      expect(isValidNumber('abc')).toBe(false);
      expect(isValidNumber(null)).toBe(false);
    });
  });

  describe('isNotEmpty', () => {
    it('debe validar valores no vacíos', () => {
      expect(isNotEmpty('text')).toBe(true);
      expect(isNotEmpty([1, 2, 3])).toBe(true);
      expect(isNotEmpty(0)).toBe(true);
    });

    it('debe rechazar valores vacíos', () => {
      expect(isNotEmpty('')).toBe(false);
      expect(isNotEmpty([])).toBe(false);
      expect(isNotEmpty(null)).toBe(false);
      expect(isNotEmpty(undefined)).toBe(false);
    });
  });

  describe('isValidWeight', () => {
    it('debe validar pesos en rango', () => {
      expect(isValidWeight(75)).toBe(true);
      expect(isValidWeight(20)).toBe(true);
      expect(isValidWeight(300)).toBe(true);
    });

    it('debe rechazar pesos fuera de rango', () => {
      expect(isValidWeight(10)).toBe(false);
      expect(isValidWeight(400)).toBe(false);
    });
  });

  describe('isValidCalories', () => {
    it('debe validar calorías en rango', () => {
      expect(isValidCalories(2000)).toBe(true);
      expect(isValidCalories(0)).toBe(true);
      expect(isValidCalories(10000)).toBe(true);
    });

    it('debe rechazar calorías fuera de rango', () => {
      expect(isValidCalories(-100)).toBe(false);
      expect(isValidCalories(20000)).toBe(false);
    });
  });

  describe('isValidDate', () => {
    it('debe validar fechas correctas', () => {
      expect(isValidDate(new Date())).toBe(true);
      expect(isValidDate('2024-01-15')).toBe(true);
    });

    it('debe rechazar fechas inválidas', () => {
      expect(isValidDate('invalid')).toBe(false);
      expect(isValidDate(null)).toBe(false);
    });
  });

  describe('isNotFutureDate', () => {
    it('debe validar fechas pasadas', () => {
      const pastDate = new Date('2020-01-01');
      expect(isNotFutureDate(pastDate)).toBe(true);
    });

    it('debe rechazar fechas futuras', () => {
      const futureDate = new Date('2100-01-01');
      expect(isNotFutureDate(futureDate)).toBe(false);
    });
  });

  describe('isValidPassword', () => {
    it('debe validar contraseñas fuertes', () => {
      expect(isValidPassword('Password123')).toBe(true);
      expect(isValidPassword('StrongP@ss1')).toBe(true);
    });

    it('debe rechazar contraseñas débiles', () => {
      expect(isValidPassword('short')).toBe(false);
      expect(isValidPassword('nouppercase123')).toBe(false);
      expect(isValidPassword('NOLOWERCASE123')).toBe(false);
      expect(isValidPassword('NoNumbers')).toBe(false);
    });
  });

  describe('isValidUrl', () => {
    it('debe validar URLs correctas', () => {
      expect(isValidUrl('https://example.com')).toBe(true);
      expect(isValidUrl('http://test.com/path')).toBe(true);
    });

    it('debe rechazar URLs inválidas', () => {
      expect(isValidUrl('not-a-url')).toBe(false);
      expect(isValidUrl(null)).toBe(false);
    });
  });
});

