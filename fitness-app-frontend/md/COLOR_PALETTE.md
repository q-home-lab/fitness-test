# Paleta de Colores - Fitness App

## Modo Claro (Light Mode)

### Colores Principales
- **Background Principal**: `#fafafa` (Gris muy claro, casi blanco)
  - Usado en: App.jsx, Dashboard, LandingPage, AuthForm
  - Clase Tailwind: `bg-[#fafafa]`

- **Surface/Cards**: `#ffffff` (Blanco puro)
  - Usado en: Cards, modales, inputs
  - Clase Tailwind: `bg-white`

- **Texto Principal**: `#1a1a1a` (Casi negro)
  - Usado en: Títulos, texto principal
  - Clase Tailwind: `text-gray-900` o `text-[#1a1a1a]`

- **Texto Secundario**: `#6b7280` (Gris medio)
  - Usado en: Subtítulos, descripciones
  - Clase Tailwind: `text-gray-600`

- **Bordes**: `#e5e7eb` (Gris claro)
  - Usado en: Bordes de cards, inputs
  - Clase Tailwind: `border-gray-200`

### Colores de Acento
- **Primary (Azul)**: `#2563eb`
  - Usado en: Botones principales, links activos
  - Clase Tailwind: `bg-blue-600` o `text-blue-600`

- **Primary Light (Azul claro)**: `#dbeafe`
  - Usado en: Fondos de iconos, badges
  - Clase Tailwind: `bg-blue-100`

## Modo Oscuro (Dark Mode)

### Colores Principales
- **Background Principal**: `#000000` (Negro puro)
  - Usado en: App.jsx, Dashboard, LandingPage, AuthForm
  - Clase Tailwind: `dark:bg-black`

- **Surface/Cards**: `#111827` (Gris muy oscuro)
  - Usado en: Cards, modales, inputs
  - Clase Tailwind: `dark:bg-gray-900`

- **Texto Principal**: `#f9fafb` (Casi blanco)
  - Usado en: Títulos, texto principal
  - Clase Tailwind: `dark:text-white` o `dark:text-gray-50`

- **Texto Secundario**: `#9ca3af` (Gris claro)
  - Usado en: Subtítulos, descripciones
  - Clase Tailwind: `dark:text-gray-400`

- **Bordes**: `#374151` (Gris oscuro)
  - Usado en: Bordes de cards, inputs
  - Clase Tailwind: `dark:border-gray-800`

### Colores de Acento
- **Primary (Azul)**: `#3b82f6`
  - Usado en: Botones principales, links activos
  - Clase Tailwind: `dark:bg-blue-500` o `dark:text-blue-400`

- **Primary Light (Azul oscuro)**: `#1e3a8a`
  - Usado en: Fondos de iconos, badges
  - Clase Tailwind: `dark:bg-blue-900/30`

## Uso en Componentes

### Ejemplo de Card
```jsx
<div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-6 transition-colors duration-300">
  <h2 className="text-gray-900 dark:text-white">Título</h2>
  <p className="text-gray-600 dark:text-gray-400">Descripción</p>
</div>
```

### Ejemplo de Botón
```jsx
<button className="bg-blue-600 dark:bg-blue-500 text-white rounded-full px-6 py-2.5 hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors duration-300">
  Click me
</button>
```

### Ejemplo de Input
```jsx
<input className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-2xl px-4 py-3 focus:border-blue-600 dark:focus:border-blue-400 transition-colors duration-300" />
```

## Transiciones

Todas las transiciones de color deben usar:
- `transition-colors duration-300` para cambios suaves

## Variables CSS

El ThemeContext aplica variables CSS personalizadas:
- `--theme-bg`: Background principal
- `--theme-surface`: Superficie de cards
- `--theme-text`: Texto principal
- `--theme-text-secondary`: Texto secundario
- `--theme-border`: Bordes
- `--theme-primary`: Color primario
- `--theme-primary-light`: Color primario claro

Estas variables se actualizan automáticamente cuando cambia el tema.

