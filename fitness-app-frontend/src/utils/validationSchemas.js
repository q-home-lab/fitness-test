/**
 * Esquemas de validación con Zod
 * Reutilizables en toda la aplicación
 */

import { z } from 'zod';

// Esquema de email
export const emailSchema = z.string().email('Debe ser un email válido').trim();

// Esquema de contraseña
export const passwordSchema = z
  .string()
  .min(8, 'La contraseña debe tener al menos 8 caracteres')
  .max(128, 'La contraseña no puede tener más de 128 caracteres')
  .regex(/[A-Z]/, 'La contraseña debe contener al menos una letra mayúscula')
  .regex(/[a-z]/, 'La contraseña debe contener al menos una letra minúscula')
  .regex(/\d/, 'La contraseña debe contener al menos un número')
  .regex(/[@$!%*?&]/, 'La contraseña debe contener al menos un carácter especial (@$!%*?&)');

// Esquema de registro
export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  recaptchaToken: z.string().optional(),
  invitationToken: z.string().optional(),
});

// Esquema de login
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'La contraseña es requerida'),
});

// Esquema de peso
export const weightSchema = z
  .number()
  .min(20, 'El peso debe ser al menos 20 kg')
  .max(300, 'El peso no puede exceder 300 kg');

// Esquema de objetivo
export const goalSchema = z.object({
  target_weight: weightSchema,
  current_weight: weightSchema,
  weekly_weight_change_goal: z
    .number()
    .min(-2, 'El cambio semanal no puede ser menor a -2 kg')
    .max(2, 'El cambio semanal no puede ser mayor a 2 kg')
    .optional(),
  goal_type: z.enum(['weight_loss', 'weight_gain', 'maintain']).optional(),
  activity_level: z
    .enum(['sedentary', 'light', 'moderate', 'active', 'very_active'])
    .optional(),
});

// Esquema de rutina
export const routineSchema = z.object({
  name: z
    .string()
    .min(1, 'El nombre es requerido')
    .max(100, 'El nombre no puede tener más de 100 caracteres')
    .trim(),
  description: z
    .string()
    .max(500, 'La descripción no puede tener más de 500 caracteres')
    .trim()
    .optional(),
});

// Esquema de ejercicio en rutina
export const routineExerciseSchema = z.object({
  exercise_id: z.number().int().positive('El ID del ejercicio es requerido'),
  sets: z.number().int().min(1).max(20).optional(),
  reps: z.number().int().min(1).max(1000).optional(),
  duration_minutes: z.number().min(1).max(300).optional(),
  weight_kg: z.number().min(0).max(500).optional(),
  order_index: z.number().int().min(1).optional(),
  day_of_week: z.number().int().min(0).max(6).nullable().optional(),
});

// Esquema de alimento
export const foodSchema = z.object({
  name: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede tener más de 100 caracteres')
    .trim(),
  calories_base: z
    .number()
    .min(0, 'Las calorías deben ser un número positivo')
    .max(10000, 'Las calorías no pueden exceder 10000'),
  protein_g: z.number().min(0).max(1000).optional(),
  carbs_g: z.number().min(0).max(1000).optional(),
  fat_g: z.number().min(0).max(1000).optional(),
});

// Esquema de meal item
export const mealItemSchema = z.object({
  food_id: z.number().int().positive('El ID del alimento es requerido'),
  quantity_grams: z
    .number()
    .min(1, 'La cantidad debe ser al menos 1 gramo')
    .max(10000, 'La cantidad no puede exceder 10000 gramos'),
  meal_type: z
    .enum(['breakfast', 'lunch', 'dinner', 'snack'])
    .optional(),
});

// Esquema de onboarding
export const onboardingSchema = z.object({
  gender: z.enum(['male', 'female', 'other']).optional(),
  age: z
    .number()
    .int()
    .min(13, 'Debes tener al menos 13 años')
    .max(120, 'La edad no puede exceder 120 años')
    .optional(),
  height: z
    .number()
    .min(100, 'La altura debe ser al menos 100 cm')
    .max(250, 'La altura no puede exceder 250 cm')
    .optional(),
  initial_weight: weightSchema.optional(),
  target_weight: weightSchema.optional(),
});

// Esquema de mensaje
export const messageSchema = z.object({
  receiver_id: z.number().int().positive('El ID del receptor es requerido'),
  content: z
    .string()
    .min(1, 'El mensaje no puede estar vacío')
    .max(2000, 'El mensaje no puede tener más de 2000 caracteres')
    .trim(),
});

// Esquema de check-in
export const checkInSchema = z.object({
  week_of: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha debe estar en formato YYYY-MM-DD'),
  weight: weightSchema.optional(),
  feeling: z
    .enum(['excellent', 'good', 'ok', 'bad', 'terrible'])
    .optional(),
  notes: z.string().max(2000, 'Las notas no pueden tener más de 2000 caracteres').optional(),
  photo_front: z.string().url('Debe ser una URL válida').optional(),
  photo_side: z.string().url('Debe ser una URL válida').optional(),
  photo_back: z.string().url('Debe ser una URL válida').optional(),
});

// Helper para obtener mensajes de error en español
export const getZodErrorMessage = (error) => {
  if (error.errors && error.errors.length > 0) {
    return error.errors[0].message;
  }
  return 'Error de validación';
};

