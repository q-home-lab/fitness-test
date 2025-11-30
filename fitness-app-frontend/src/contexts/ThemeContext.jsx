import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

// Paleta de colores personalizada
const COLOR_PALETTE = {
  light: {
    text: '#222222',
    background: '#FAF3E1',
    primary: '#FF6D1F',
    secondary: '#F5E7C6',
    accent: '#86c4c2',
    surface: '#FFFFFF', // Blanco para cards
    border: '#E5D9C8', // Borde suave
  },
  dark: {
    text: '#f9fafb',
    background: '#000000',
    primary: '#3b82f6',
    secondary: '#111827',
    accent: '#10b981',
    surface: '#111827',
    border: '#374151',
  }
};

export const ThemeProvider = ({ children }) => {
  // Inicializar tema desde localStorage o default 'light'
  const [theme, setTheme] = useState(() => {
    if (typeof window === 'undefined') return 'light';
    
    const saved = localStorage.getItem('theme');
    if (saved === 'dark' || saved === 'light') {
      return saved;
    }
    return 'light';
  });

  // Aplicar tema al DOM
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const root = document.documentElement;
    const body = document.body;
    const rootElement = document.getElementById('root');
    const colors = COLOR_PALETTE[theme];
    
    // CRÍTICO: Remover la clase dark primero para asegurar que se limpia
    root.classList.remove('dark');
    
    if (theme === 'dark') {
      root.classList.add('dark');
      // Aplicar estilos con !important para asegurar que se apliquen
      body.style.setProperty('background-color', colors.background, 'important');
      body.style.setProperty('color', colors.text, 'important');
      if (rootElement) {
        rootElement.style.setProperty('background-color', colors.background, 'important');
        rootElement.style.setProperty('color', colors.text, 'important');
      }
    } else {
      // Asegurarse de que NO hay clase dark
      root.classList.remove('dark');
      // Aplicar estilos de modo claro con !important
      body.style.setProperty('background-color', colors.background, 'important');
      body.style.setProperty('color', colors.text, 'important');
      if (rootElement) {
        rootElement.style.setProperty('background-color', colors.background, 'important');
        rootElement.style.setProperty('color', colors.text, 'important');
      }
    }
    
    // Aplicar variables CSS para uso en componentes
    root.style.setProperty('--color-text', colors.text);
    root.style.setProperty('--color-background', colors.background);
    root.style.setProperty('--color-primary', colors.primary);
    root.style.setProperty('--color-secondary', colors.secondary);
    root.style.setProperty('--color-accent', colors.accent);
    root.style.setProperty('--color-surface', colors.surface);
    root.style.setProperty('--color-border', colors.border);
    
    // Guardar en localStorage
    localStorage.setItem('theme', theme);
    
    // Forzar reflow para asegurar que los cambios se apliquen
    void root.offsetHeight;
    void body.offsetHeight;
    if (rootElement) void rootElement.offsetHeight;
    
    // Disparar evento para que otros componentes puedan reaccionar
    window.dispatchEvent(new CustomEvent('themechange', { 
      detail: { theme } 
    }));
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
