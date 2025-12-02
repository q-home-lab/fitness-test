# Base de Datos de Alimentos - Actualización Completa

## ✅ Estado Actual

### Total de Alimentos: **203+ alimentos**

La base de datos ahora incluye una amplia variedad de alimentos con información nutricional completa.

## 📦 Fuentes de Datos

### 1. Script Básico (`seed:foods`)
- **52 alimentos comunes** básicos
- Incluye los alimentos más consumidos
- Ejecutar: `npm run seed:foods`

### 2. Script Extendido (`seed:foods:extended`) ⭐ **RECOMENDADO**
- **188 alimentos** adicionales
- **Total añadido: 151 nuevos alimentos** (37 ya existían)
- Categorías completas:
  - **Proteínas (40+ alimentos)**: Carnes, pescados, mariscos, huevos, lácteos
  - **Carbohidratos (30+ alimentos)**: Cereales, granos, tubérculos, panes, pastas
  - **Verduras (50+ alimentos)**: Hojas verdes, raíces, frutas vegetales
  - **Legumbres (10+ alimentos)**: Lentejas, garbanzos, judías, soja
  - **Frutas (25+ alimentos)**: Frutas frescas comunes
  - **Frutos secos (12+ alimentos)**: Almendras, nueces, semillas
  - **Aceites y grasas**: Aceites vegetales, mantequillas
  - **Endulzantes**: Miel, azúcares, siropes
  - **Especias y condimentos**: Especias comunes
- Ejecutar: `npm run seed:foods:extended`

### 3. Script Open Food Facts (`seed:foods:openfoodfacts`)
- Integración con Open Food Facts API
- Obtiene productos envasados con códigos de barras
- Útil para productos comerciales específicos
- Ejecutar: `npm run seed:foods:openfoodfacts`

## 🎯 Categorías Incluidas

### Proteínas (60+)
- Carnes: Pollo, ternera, cerdo, pavo, cordero, conejo
- Pescados: Salmón, atún, bacalao, merluza, dorada, trucha, sardinas
- Mariscos: Gambas, langostinos, calamares, mejillones, pulpo
- Huevos: Enteros, claras
- Lácteos: Leches, yogures, quesos variados

### Carbohidratos (40+)
- Cereales: Arroz (blanco, integral), pasta, panes
- Granos: Avena, quinoa, bulgur, couscous, cebada, mijo
- Tubérculos: Patatas, batatas, yuca

### Verduras (50+)
- Hojas verdes: Lechuga, espinacas, rúcula, kale, acelgas
- Raíces: Zanahorias, remolacha, nabos, rábanos
- Frutas vegetales: Tomates, pimientos, calabacines, berenjenas
- Leguminosas verdes: Judías verdes, guisantes, edamame

### Legumbres (10+)
- Lentejas, garbanzos, judías (blancas, negras, pintas), soja

### Frutas (25+)
- Frutas frescas comunes: Manzanas, plátanos, naranjas, fresas, uvas, etc.
- Frutas tropicales: Mango, papaya, piña

### Frutos Secos y Semillas (12+)
- Almendras, nueces, avellanas, pistachos, anacardos
- Semillas: Chía, lino, girasol, calabaza, sésamo

### Otros
- Aceites: Oliva, girasol, coco
- Endulzantes: Miel, azúcares, siropes
- Especias: Canela, cúrcuma, jengibre

## 📊 Valores Nutricionales

Cada alimento incluye:
- ✅ **Calorías** por 100g
- ✅ **Proteína** (gramos por 100g)
- ✅ **Carbohidratos** (gramos por 100g)
- ✅ **Grasa** (gramos por 100g)

Basados en:
- USDA Food Composition Databases
- BEDCA (Base de Datos Española de Composición de Alimentos)
- Valores nutricionales estándar reconocidos

## 🚀 Uso

### Para poblar la base de datos completa:

```bash
# 1. Alimentos básicos (52 alimentos)
npm run seed:foods

# 2. Alimentos extendidos (151 nuevos alimentos) ⭐ RECOMENDADO
npm run seed:foods:extended

# 3. Opcional: Productos desde Open Food Facts
npm run seed:foods:openfoodfacts
```

### Verificar estadísticas:

```bash
node ./scripts/check-food-stats.js
```

## 💡 Notas

- Los valores nutricionales están basados en datos científicos reconocidos
- Los alimentos se pueden buscar en español
- El sistema calcula automáticamente calorías y macronutrientes según la cantidad
- Los alimentos duplicados se omiten automáticamente
- La base de datos está lista para uso en producción

## 🔄 Actualizaciones Futuras

Para añadir más alimentos en el futuro:
1. Editar `scripts/seed-extended-foods.js` y añadir más alimentos al array
2. Ejecutar `npm run seed:foods:extended` nuevamente
3. O usar `seed-openfoodfacts.js` para obtener productos comerciales específicos

