import { describe, it, expect } from 'vitest';
import {
  formatNumber,
  formatInteger,
  formatWeight,
  formatCalories,
  formatDate,
  // formatRelativeDate, // No se usa en los tests actuales
  formatMacros,
  formatPercentage,
  formatDuration,
  formatTime,
} from '../formatters';

describe('formatters', () => {
  describe('formatNumber', () => {
    it('debe formatear números correctamente', () => {
      expect(formatNumber(123.456)).toBe('123.5');
      expect(formatNumber(123.456, 2)).toBe('123.46');
      expect(formatNumber(0)).toBe('0.0');
    });

    it('debe manejar valores null/undefined', () => {
      expect(formatNumber(null)).toBe('0.0');
      expect(formatNumber(undefined)).toBe('0.0');
      expect(formatNumber(null, 1, 5)).toBe('5.0');
    });

    it('debe manejar strings numéricos', () => {
      expect(formatNumber('123.456')).toBe('123.5');
      expect(formatNumber('0')).toBe('0.0');
    });
  });

  describe('formatInteger', () => {
    it('debe formatear como entero', () => {
      expect(formatInteger(123.456)).toBe('123');
      expect(formatInteger(0)).toBe('0');
    });

    it('debe manejar valores null/undefined', () => {
      expect(formatInteger(null)).toBe('0');
      expect(formatInteger(undefined, 5)).toBe('5');
    });
  });

  describe('formatWeight', () => {
    it('debe formatear pesos correctamente', () => {
      expect(formatWeight(75.5)).toBe('75.5 kg');
      expect(formatWeight(0)).toBe('0.0 kg');
    });
  });

  describe('formatCalories', () => {
    it('debe formatear calorías correctamente', () => {
      expect(formatCalories(2000)).toBe('2000');
      expect(formatCalories(0)).toBe('0');
    });
  });

  describe('formatDate', () => {
    it('debe formatear fechas correctamente', () => {
      const date = new Date('2024-01-15');
      expect(formatDate(date)).toBe('15/01/2024');
    });

    it('debe manejar strings de fecha', () => {
      expect(formatDate('2024-01-15')).toBe('15/01/2024');
    });

    it('debe manejar valores null/undefined', () => {
      expect(formatDate(null)).toBe('');
      expect(formatDate(undefined)).toBe('');
    });
  });

  describe('formatDuration', () => {
    it('debe formatear duración correctamente', () => {
      expect(formatDuration(90)).toBe('1h 30min');
      expect(formatDuration(60)).toBe('1h');
      expect(formatDuration(30)).toBe('30min');
      expect(formatDuration(0)).toBe('0 min');
    });
  });

  describe('formatTime', () => {
    it('debe formatear tiempo correctamente', () => {
      expect(formatTime(125)).toBe('02:05');
      expect(formatTime(0)).toBe('00:00');
      expect(formatTime(3661)).toBe('61:01');
    });
  });

  describe('formatMacros', () => {
    it('debe formatear macronutrientes correctamente', () => {
      expect(formatMacros(150.5)).toBe('150.5g');
      expect(formatMacros(0)).toBe('0.0g');
    });
  });

  describe('formatPercentage', () => {
    it('debe formatear porcentajes correctamente', () => {
      expect(formatPercentage(75.5)).toBe('76%');
      expect(formatPercentage(75.5, 1)).toBe('75.5%');
    });
  });
});

