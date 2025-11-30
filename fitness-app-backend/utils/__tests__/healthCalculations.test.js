const {
  calculateBMI,
  calculateBMR,
  calculateTDEE,
  calculateBodyFatPercentage,
  calculateRecommendedCalories,
  calculateRecommendedWeight,
} = require('../healthCalculations');

// Nota: calculateBodyFatPercentage tiene una firma diferente en el código real
// Ajustamos los tests para que coincidan

describe('healthCalculations', () => {
  describe('calculateBMI', () => {
    it('debe calcular BMI correctamente', () => {
      const bmi = calculateBMI(75, 175); // 75kg, 175cm
      // BMI esperado: 75 / (1.75 * 1.75) = 24.49... pero se redondea a 1 decimal
      expect(bmi).toBeGreaterThan(24.4);
      expect(bmi).toBeLessThan(24.6);
    });

    it('debe manejar valores edge', () => {
      expect(calculateBMI(0, 175)).toBe(null);
      expect(calculateBMI(75, 0)).toBe(null);
    });
  });

  describe('calculateBMR', () => {
    it('debe calcular BMR para hombres (Mifflin-St Jeor)', () => {
      const bmr = calculateBMR(75, 175, 30, 'male');
      expect(bmr).toBeGreaterThan(1500);
      expect(bmr).toBeLessThan(2000);
    });

    it('debe calcular BMR para mujeres (Mifflin-St Jeor)', () => {
      const bmr = calculateBMR(65, 165, 25, 'female');
      expect(bmr).toBeGreaterThan(1200);
      expect(bmr).toBeLessThan(1700);
    });
  });

  describe('calculateTDEE', () => {
    it('debe calcular TDEE con diferentes niveles de actividad', () => {
      const bmr = 1500;
      
      // calculateTDEE redondea el resultado, así que verificamos que esté cerca
      expect(calculateTDEE(bmr, 'sedentary')).toBe(Math.round(bmr * 1.2));
      expect(calculateTDEE(bmr, 'light')).toBe(Math.round(bmr * 1.375));
      expect(calculateTDEE(bmr, 'moderate')).toBe(Math.round(bmr * 1.55));
      expect(calculateTDEE(bmr, 'active')).toBe(Math.round(bmr * 1.725));
      expect(calculateTDEE(bmr, 'very_active')).toBe(Math.round(bmr * 1.9));
    });
  });

  describe('calculateBodyFatPercentage', () => {
    it('debe calcular porcentaje de grasa para hombres', () => {
      const bmi = calculateBMI(75, 175);
      const bf = calculateBodyFatPercentage(bmi, 30, 'male');
      expect(bf).toBeGreaterThan(0);
      expect(bf).toBeLessThan(50);
    });

    it('debe calcular porcentaje de grasa para mujeres', () => {
      const bmi = calculateBMI(65, 165);
      const bf = calculateBodyFatPercentage(bmi, 25, 'female');
      expect(bf).toBeGreaterThan(0);
      expect(bf).toBeLessThan(50);
    });
  });

  describe('calculateRecommendedCalories', () => {
    it('debe calcular calorías para pérdida de peso', () => {
      const tdee = 2000;
      const calories = calculateRecommendedCalories(tdee, 'weight_loss');
      expect(calories).toBeLessThan(tdee);
      expect(calories).toBe(tdee - 500); // Déficit de 500 kcal
    });

    it('debe calcular calorías para ganancia de peso', () => {
      const tdee = 2000;
      const calories = calculateRecommendedCalories(tdee, 'weight_gain');
      expect(calories).toBeGreaterThan(tdee);
      expect(calories).toBe(tdee + 500); // Superávit de 500 kcal
    });

    it('debe calcular calorías para mantenimiento', () => {
      const tdee = 2000;
      const calories = calculateRecommendedCalories(tdee, 'maintenance');
      expect(calories).toBe(tdee);
    });
  });

  describe('calculateRecommendedWeight', () => {
    it('debe calcular peso recomendado basado en altura', () => {
      const weight = calculateRecommendedWeight(175, 'male');
      expect(weight).toBeGreaterThan(60);
      expect(weight).toBeLessThan(90);
    });
  });
});

