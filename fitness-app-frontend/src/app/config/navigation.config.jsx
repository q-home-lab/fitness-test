/**
 * Configuración centralizada de navegación
 * Define todos los items de navegación para diferentes roles
 */

import React from 'react';

// Iconos SVG como componentes React
export const HomeIcon = ({ className = "h-5 w-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

export const WeightIcon = ({ className = "h-5 w-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

export const DietIcon = ({ className = "h-5 w-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
  </svg>
);

export const RoutinesIcon = ({ className = "h-5 w-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
  </svg>
);

export const CalendarIcon = ({ className = "h-5 w-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

export const AchievementsIcon = ({ className = "h-5 w-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
  </svg>
);

export const CoachDashboardIcon = ({ className = "h-5 w-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

export const TemplatesIcon = ({ className = "h-5 w-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

export const AdminIcon = ({ className = "h-3.5 w-3.5" }) => (
  <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700 flex items-center justify-center">
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={`${className} text-blue-600 dark:text-blue-400`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 11c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 20c0-2.761 3.134-5 7-5s7 2.239 7 5"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M5 7l1.5-1.5M19 7L17.5 5.5"
      />
    </svg>
  </div>
);

// Configuración de navegación por rol
export const navigationItems = {
  user: [
    {
      path: '/dashboard',
      label: 'Inicio',
      icon: HomeIcon,
      bottomNav: true, // Aparece en bottom navigation
    },
    {
      path: '/weight',
      label: 'Peso',
      icon: WeightIcon,
      bottomNav: true,
    },
    {
      path: '/diet',
      label: 'Dieta',
      icon: DietIcon,
      bottomNav: true,
    },
    {
      path: '/routines',
      label: 'Rutinas',
      icon: RoutinesIcon,
      bottomNav: true,
    },
    {
      path: '/calendar',
      label: 'Calendario',
      icon: CalendarIcon,
      bottomNav: true,
    },
    {
      path: '/achievements',
      label: 'Logros',
      icon: AchievementsIcon,
      bottomNav: false, // Solo en navbar desktop
    },
  ],
  coach: [
    {
      path: '/coach/dashboard',
      label: 'Dashboard',
      icon: CoachDashboardIcon,
      bottomNav: true, // Visible en navegación móvil
    },
    {
      path: '/coach/templates',
      label: 'Plantillas',
      icon: TemplatesIcon,
      bottomNav: false,
    },
  ],
  admin: [
    {
      path: '/admin',
      label: 'Admin',
      icon: AdminIcon,
      bottomNav: false,
    },
  ],
};

/**
 * Obtiene los items de navegación para un rol específico
 * @param {string} role - Rol del usuario ('user', 'coach', 'admin')
 * @param {boolean} forBottomNav - Si es true, solo devuelve items con bottomNav: true
 * @returns {Array} Array de items de navegación
 */
export const getNavigationItems = (role, forBottomNav = false) => {
  const items = [];
  
  // Normalizar el rol a mayúsculas para comparación consistente
  const normalizedRole = role?.toUpperCase() || 'CLIENT';
  
  // Si es coach o admin, poner primero los items del coach
  if (normalizedRole === 'COACH' || normalizedRole === 'ADMIN') {
    items.push(...navigationItems.coach);
  }
  
  // Siempre incluir items de usuario después
  if (navigationItems.user) {
    items.push(...navigationItems.user);
  }
  
  // Agregar items de admin si aplica
  if (normalizedRole === 'ADMIN') {
    items.push(...navigationItems.admin);
  }
  
  // Filtrar por bottomNav si es necesario
  if (forBottomNav) {
    return items.filter(item => item.bottomNav === true);
  }
  
  return items;
};

/**
 * Verifica si una ruta está activa
 * @param {string} pathname - Ruta actual
 * @param {string} path - Ruta a verificar
 * @returns {boolean}
 */
export const isActiveRoute = (pathname, path) => {
  if (path === '/dashboard') {
    return pathname === '/dashboard' || pathname === '/';
  }
  return pathname.startsWith(path);
};

