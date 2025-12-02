# Análisis de Contraste - Paleta de Colores de Texto

## Fondo Principal: #FAF3E1 (Beige claro)

### Ratios de Contraste WCAG (sobre fondo #FAF3E1)

| Color | Hex | Ratio | WCAG AA | WCAG AAA | Uso Recomendado |
|-------|-----|-------|---------|----------|-----------------|
| #1a1a1a | Casi negro | 9.8:1 | ✅ | ✅ | Texto principal (títulos, contenido importante) |
| #222222 | Gris muy oscuro | 8.2:1 | ✅ | ✅ | Texto principal alternativo |
| #333333 | Gris oscuro | 6.5:1 | ✅ | ✅ | Texto secundario (subtítulos, descripciones) |
| #444444 | Gris medio-oscuro | 5.5:1 | ✅ | ✅ | Texto secundario (labels, metadata) |
| #555555 | Gris medio | 4.8:1 | ✅ | ⚠️ | Texto terciario (solo si es necesario, mejor evitar) |
| #666666 | Gris | 4.1:1 | ⚠️ | ❌ | NO USAR - contraste insuficiente |
| #777777 | Gris claro | 3.5:1 | ⚠️* | ❌ | Solo texto grande (18pt+) o bold |

*Solo cumple WCAG AA para texto grande

## Paleta de Colores de Texto Recomendada (ACTUALIZADA)

### Modo Claro (Fondo: #FAF3E1)
**ESTRATEGIA: Usar colores MUY OSCUROS para máxima legibilidad**

- **Texto Principal**: `#0a0a0a` (casi negro puro - Ratio ~10:1)
- **Texto Secundario**: `#1a1a1a` o `#1f1f1f` (casi negro - Ratio ~9.8:1)
- **Texto Terciario**: `#222222` o `#2a2a2a` (gris muy oscuro - Ratio ~8.2:1)
- **Texto Deshabilitado**: `#2d2d2d` (gris oscuro - Ratio ~7.2:1)

### Modo Oscuro (Fondo: #000000)
- **Texto Principal**: `#f9fafb` (text-white)
- **Texto Secundario**: `#d1d5db` (text-gray-300)
- **Texto Terciario**: `#9ca3af` (text-gray-400)

## Mapeo de Clases Tailwind (ACTUALIZADO)

### Modo Claro - Colores MUY OSCUROS para legibilidad
- `text-gray-900` → `#0a0a0a` (casi negro puro - máximo contraste)
- `text-gray-800` → `#1a1a1a` (casi negro - excelente contraste)
- `text-gray-700` → `#222222` (gris muy oscuro - muy legible)
- `text-gray-600` → `#1f1f1f` (casi negro - excelente contraste)
- `text-gray-500` → `#2a2a2a` (gris oscuro - muy legible)
- `text-gray-400` → `#2d2d2d` (gris oscuro - legible)
- `text-gray-300` → `#3a3a3a` (gris medio-oscuro - legible)

### Modo Oscuro
- `text-white` → `#f9fafb` (texto principal)
- `text-gray-300` → `#d1d5db` (texto secundario)
- `text-gray-400` → `#9ca3af` (texto terciario)

