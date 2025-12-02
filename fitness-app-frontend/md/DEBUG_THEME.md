# Debug del Sistema de Temas

## Verificación Paso a Paso

### 1. Verificar que la clase `dark` se remueve correctamente

En la consola del navegador, ejecuta:
```javascript
console.log('HTML classes:', document.documentElement.className);
console.log('Has dark class?', document.documentElement.classList.contains('dark'));
```

**Resultado esperado en modo claro:**
- `HTML classes:` debería estar vacío o no contener `dark`
- `Has dark class?` debería ser `false`

### 2. Verificar estilos del body y root

En la consola del navegador, ejecuta:
```javascript
console.log('Body background:', getComputedStyle(document.body).backgroundColor);
console.log('Body color:', getComputedStyle(document.body).color);
console.log('Root background:', getComputedStyle(document.getElementById('root')).backgroundColor);
```

**Resultado esperado en modo claro:**
- `Body background:` debería ser `rgb(250, 250, 250)` o `#fafafa`
- `Body color:` debería ser `rgb(26, 26, 26)` o `#1a1a1a`
- `Root background:` debería ser `rgb(250, 250, 250)` o `#fafafa`

### 3. Verificar un componente específico

En DevTools, inspecciona un elemento con clase `bg-white dark:bg-gray-900` y verifica:
- En modo claro: debería tener `background-color: rgb(255, 255, 255)` o `#ffffff`
- En modo oscuro: debería tener `background-color: rgb(17, 24, 39)` o `#111827`

### 4. Limpiar localStorage y recargar

Si el problema persiste, ejecuta en la consola:
```javascript
localStorage.removeItem('theme');
location.reload();
```

### 5. Verificar si hay CSS que sobrescribe

En DevTools, en la pestaña "Styles", verifica si hay:
- Reglas con `!important` que estén sobrescribiendo
- Media queries `@media (prefers-color-scheme: dark)` que puedan estar interfiriendo
- Estilos inline que estén forzando colores oscuros

## Solución Temporal

Si nada funciona, puedes forzar el modo claro temporalmente añadiendo esto al inicio de `index.css`:

```css
html:not(.dark) * {
  background-color: #fafafa !important;
  color: #1a1a1a !important;
}

html:not(.dark) .bg-white,
html:not(.dark) [class*="bg-white"] {
  background-color: #ffffff !important;
}
```

**NOTA:** Esto es una solución temporal y puede romper algunos componentes. Úsala solo para debugging.

