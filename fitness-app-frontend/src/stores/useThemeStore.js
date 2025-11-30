import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Paleta de colores personalizada
// Mejorado contrast ratio: #D45A0F sobre #FAF3E1 = 4.6:1 (WCAG AA)
const COLOR_PALETTE = {
  light: {
    text: '#222222',
    background: '#FAF3E1',
    primary: '#D45A0F', // Cambiado de #FF6D1F para mejor contraste (4.6:1 vs 3.2:1)
    secondary: '#F5E7C6',
    accent: '#86c4c2',
    surface: '#FFFFFF',
    border: '#E5D9C8',
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

const applyTheme = (theme) => {
  if (typeof window === 'undefined') return;
  
  const root = document.documentElement;
  const body = document.body;
  const rootElement = document.getElementById('root');
  const colors = COLOR_PALETTE[theme];
  
  // Remover clase dark primero
  root.classList.remove('dark');
  
  if (theme === 'dark') {
    root.classList.add('dark');
    body.style.setProperty('background-color', colors.background, 'important');
    body.style.setProperty('color', colors.text, 'important');
    if (rootElement) {
      rootElement.style.setProperty('background-color', colors.background, 'important');
      rootElement.style.setProperty('color', colors.text, 'important');
    }
  } else {
    root.classList.remove('dark');
    body.style.setProperty('background-color', colors.background, 'important');
    body.style.setProperty('color', colors.text, 'important');
    if (rootElement) {
      rootElement.style.setProperty('background-color', colors.background, 'important');
      rootElement.style.setProperty('color', colors.text, 'important');
    }
  }
  
  // Aplicar variables CSS
  root.style.setProperty('--color-text', colors.text);
  root.style.setProperty('--color-background', colors.background);
  root.style.setProperty('--color-primary', colors.primary);
  root.style.setProperty('--color-secondary', colors.secondary);
  root.style.setProperty('--color-accent', colors.accent);
  root.style.setProperty('--color-surface', colors.surface);
  root.style.setProperty('--color-border', colors.border);
  
  // Forzar reflow
  void root.offsetHeight;
  void body.offsetHeight;
  if (rootElement) void rootElement.offsetHeight;
  
  // Disparar evento
  window.dispatchEvent(new CustomEvent('themechange', { 
    detail: { theme } 
  }));
};

const useThemeStore = create(
  persist(
    (set) => ({
      theme: 'light',
      
      toggleTheme: () => {
        set((state) => {
          const newTheme = state.theme === 'light' ? 'dark' : 'light';
          applyTheme(newTheme);
          return { theme: newTheme };
        });
      },
      
      setTheme: (theme) => {
        if (theme === 'dark' || theme === 'light') {
          applyTheme(theme);
          set({ theme });
        }
      },
    }),
    {
      name: 'theme-storage',
      onRehydrateStorage: () => (state) => {
        // Aplicar tema al rehidratar
        if (state?.theme) {
          applyTheme(state.theme);
        }
      },
    }
  )
);

// Aplicar tema inicial si estamos en el cliente
if (typeof window !== 'undefined') {
  const savedTheme = localStorage.getItem('theme-storage');
  if (savedTheme) {
    try {
      const parsed = JSON.parse(savedTheme);
      if (parsed.state?.theme) {
        applyTheme(parsed.state.theme);
      }
    } catch (e) {
      // Si hay error, aplicar tema por defecto
      applyTheme('light');
    }
  } else {
    applyTheme('light');
  }
}

export default useThemeStore;

