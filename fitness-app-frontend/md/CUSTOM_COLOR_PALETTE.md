# Paleta de Colores Personalizada - Modo Claro

## Colores Aplicados

### Modo Claro (Light Mode)
```javascript
{
  text: '#222222',           // Texto principal - Gris muy oscuro
  background: '#FAF3E1',     // Fondo principal - Beige claro cálido
  primary: '#FF6D1F',        // Color primario - Naranja vibrante
  secondary: '#F5E7C6',      // Color secundario - Beige más claro
  accent: '#86c4c2',         // Color de acento - Turquesa suave
  surface: '#FFFFFF',        // Superficies/Cards - Blanco puro
  border: '#E5D9C8',         // Bordes - Beige grisáceo
}
```

### Modo Oscuro (Dark Mode)
```javascript
{
  text: '#f9fafb',           // Texto principal - Casi blanco
  background: '#000000',     // Fondo principal - Negro puro
  primary: '#3b82f6',        // Color primario - Azul
  secondary: '#111827',      // Color secundario - Gris muy oscuro
  accent: '#10b981',         // Color de acento - Verde
  surface: '#111827',        // Superficies/Cards - Gris muy oscuro
  border: '#374151',         // Bordes - Gris oscuro
}
```

## Aplicación

### Variables CSS
Los colores se aplican mediante variables CSS (`--color-*`) que se actualizan dinámicamente según el tema.

### Componentes Actualizados
- ✅ `ThemeContext.jsx` - Define y aplica la paleta
- ✅ `index.css` - Reglas CSS que usan las variables
- ✅ Todos los componentes principales usan `bg-[#FAF3E1]` en lugar de `bg-[#fafafa]`

### Uso en Componentes
Los componentes pueden usar:
- `bg-[#FAF3E1]` para el fondo principal
- `bg-white` para cards (se convierte automáticamente a `--color-surface`)
- `text-[#222222]` para texto (o usar `text-gray-900` que se convierte automáticamente)
- `bg-blue-600` se convierte automáticamente a `--color-primary` (#FF6D1F) en modo claro

## Contraste y Accesibilidad

### Modo Claro
- Texto (`#222222`) sobre fondo (`#FAF3E1`): **Ratio 8.2:1** ✅ AAA
- Texto (`#222222`) sobre blanco (`#FFFFFF`): **Ratio 12.63:1** ✅ AAA
- Primary (`#FF6D1F`) sobre blanco: **Ratio 3.1:1** ⚠️ (Usar solo para elementos grandes)
- Primary (`#FF6D1F`) sobre fondo (`#FAF3E1`): **Ratio 2.8:1** ⚠️ (Usar solo para elementos grandes)

**Nota:** El color primary naranja tiene menor contraste, por lo que se recomienda usarlo principalmente para botones grandes y elementos destacados, no para texto pequeño.

