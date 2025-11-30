// Utilidades para formatear datos (centralizadas para evitar duplicación)

import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Formatea un número de forma segura
 * @param {number|string|null|undefined} value - Valor a formatear
 * @param {number} decimals - Número de decimales (default: 1)
 * @param {number} defaultValue - Valor por defecto si es null/undefined (default: 0)
 * @returns {string} - Número formateado
 */
export const formatNumber = (value, decimals = 1, defaultValue = 0) => {
  const num = parseFloat(value);
  if (isNaN(num)) return defaultValue.toFixed(decimals);
  return num.toFixed(decimals);
};

/**
 * Formatea un número como entero
 */
export const formatInteger = (value, defaultValue = 0) => {
  const num = parseFloat(value);
  if (isNaN(num)) return defaultValue.toString();
  return Math.round(num).toString();
};

/**
 * Formatea un peso (kg)
 */
export const formatWeight = (weight, defaultValue = 0) => {
  return `${formatNumber(weight, 1, defaultValue)} kg`;
};

/**
 * Formatea calorías
 */
export const formatCalories = (calories, defaultValue = 0) => {
  return formatInteger(calories, defaultValue);
};

/**
 * Formatea una fecha
 * @param {string|Date} date - Fecha a formatear
 * @param {string} formatString - Formato (default: 'dd/MM/yyyy')
 * @returns {string} - Fecha formateada
 */
export const formatDate = (date, formatString = 'dd/MM/yyyy') => {
  if (!date) return '';
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    if (isNaN(dateObj.getTime())) return '';
    return format(dateObj, formatString, { locale: es });
  } catch (error) {
    console.warn('Error al formatear fecha:', error);
    return '';
  }
};

/**
 * Formatea una fecha con hora
 */
export const formatDateTime = (date) => {
  return formatDate(date, 'dd/MM/yyyy HH:mm');
};

/**
 * Formatea una fecha relativa (hace X tiempo)
 */
export const formatRelativeDate = (date) => {
  if (!date) return '';
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    if (isNaN(dateObj.getTime())) return '';
    
    const now = new Date();
    const diffMs = now - dateObj;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Hace un momento';
    if (diffMins < 60) return `Hace ${diffMins} ${diffMins === 1 ? 'minuto' : 'minutos'}`;
    if (diffHours < 24) return `Hace ${diffHours} ${diffHours === 1 ? 'hora' : 'horas'}`;
    if (diffDays < 7) return `Hace ${diffDays} ${diffDays === 1 ? 'día' : 'días'}`;
    
    return formatDate(dateObj);
  } catch (error) {
    console.warn('Error al formatear fecha relativa:', error);
    return '';
  }
};

/**
 * Formatea macronutrientes (gramos)
 */
export const formatMacros = (grams, defaultValue = 0) => {
  return `${formatNumber(grams, 1, defaultValue)}g`;
};

/**
 * Formatea porcentaje
 */
export const formatPercentage = (value, decimals = 0, defaultValue = 0) => {
  return `${formatNumber(value, decimals, defaultValue)}%`;
};

/**
 * Formatea duración (minutos a formato legible)
 */
export const formatDuration = (minutes) => {
  if (!minutes || minutes === 0) return '0 min';
  const hours = Math.floor(minutes / 60);
  const mins = Math.floor(minutes % 60);
  
  if (hours > 0 && mins > 0) {
    return `${hours}h ${mins}min`;
  } else if (hours > 0) {
    return `${hours}h`;
  } else {
    return `${mins}min`;
  }
};

/**
 * Formatea tiempo (segundos a MM:SS)
 */
export const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

