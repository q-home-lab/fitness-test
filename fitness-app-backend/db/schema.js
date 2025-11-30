const { pgTable, serial, varchar, timestamp, date, numeric, integer, boolean, unique, uuid, text, jsonb } = require('drizzle-orm/pg-core');

// =================================================================
// 1. DEFINICIÓN DE LA TABLA USERS (Tu tabla de Autenticación)
// =================================================================
const users = pgTable('users', {
    user_id: serial('user_id').primaryKey(),
    email: varchar('email', { length: 255 }).unique().notNull(),
    password_hash: varchar('password_hash', { length: 255 }).notNull(),
    // Campos para flujo de recuperación de contraseña
    reset_password_token: varchar('reset_password_token', { length: 255 }),
    reset_password_expires: timestamp('reset_password_expires'),
    onboarding_completed: boolean('onboarding_completed').default(false).notNull(),
    onboarding_step: integer('onboarding_step').default(0).notNull(), // 0=no empezado, 1-4=pasos completados
    // Datos personales para cálculos personalizados
    gender: varchar('gender', { length: 20 }), // 'male', 'female', 'other'
    age: integer('age'), // Edad en años
    height: numeric('height'), // Altura en cm
    // Campos para sistema de roles y coach mode
    role: varchar('role', { length: 20 }).default('CLIENT').notNull(), // 'CLIENT', 'COACH', 'ADMIN'
    coach_id: integer('coach_id').references(() => users.user_id), // Referencia al entrenador (nullable)
    created_at: timestamp('created_at').defaultNow(),
    updated_at: timestamp('updated_at').defaultNow(),
});


// =================================================================
// 2. Definición de la tabla Daily_Logs (Registro Diario de Métricas)
// =================================================================
const dailyLogs = pgTable('daily_logs', {
    log_id: serial('log_id').primaryKey(),
    user_id: integer('user_id').references(() => users.user_id).notNull(), 
    date: date('date').notNull(),
    weight: numeric('weight').notNull(),
    consumed_calories: numeric('consumed_calories').default(0).notNull(),
    burned_calories: numeric('burned_calories').default(0).notNull(),
    created_at: timestamp('created_at').defaultNow(),
    updated_at: timestamp('updated_at').defaultNow(),
}, (table) => {
    return {
        // Asegura que solo hay un log por usuario por día
        dailyLogUnique: unique('daily_log_unique').on(table.user_id, table.date),
    };
});


// =================================================================
// 3. Definición de la tabla Foods (Catálogo de Alimentos)
// =================================================================
const foods = pgTable('foods', {
    food_id: serial('food_id').primaryKey(),
    name: varchar('name', { length: 100 }).unique().notNull(),
    calories_base: numeric('calories_base').notNull(), // Kcal por 100g
    protein_g: numeric('protein_g').default(0).notNull(), // Gramos por 100g
    carbs_g: numeric('carbs_g').default(0).notNull(), 
    fat_g: numeric('fat_g').default(0).notNull(),
    created_at: timestamp('created_at').defaultNow(),
});


// =================================================================
// 4. Definición de la tabla Meal_Items (Registro de Consumo Diario)
// =================================================================
const mealItems = pgTable('meal_items', {
    meal_item_id: serial('meal_item_id').primaryKey(),
    log_id: integer('log_id').references(() => dailyLogs.log_id).notNull(),
    food_id: integer('food_id').references(() => foods.food_id).notNull(),
    quantity_grams: numeric('quantity_grams').notNull(),
    meal_type: varchar('meal_type', { length: 50 }).notNull(), // Ej: 'Desayuno', 'Almuerzo'
    consumed_calories: numeric('consumed_calories').notNull(),
    created_at: timestamp('created_at').defaultNow(),
});


// =================================================================
// 11. Definición de la tabla Exercises (Catálogo de Ejercicios)
// =================================================================
const exercises = pgTable('exercises', {
    exercise_id: serial('exercise_id').primaryKey(),
    name: varchar('name', { length: 100 }).unique().notNull(),
    category: varchar('category', { length: 50 }).notNull(), // Ej: 'Cardio', 'Fuerza', 'Híbrido'
    // Calorías quemadas por minuto (por kg de peso del usuario en un caso real, aquí simplificado a una base)
    default_calories_per_minute: numeric('default_calories_per_minute').default(5).notNull(), 
    gif_url: varchar('gif_url', { length: 500 }), // URL del GIF/imagen que muestra cómo hacer el ejercicio
    video_url: varchar('video_url', { length: 500 }), // URL del video de demostración del ejercicio
    wger_id: integer('wger_id'), // ID del ejercicio en wger API para referencia
    is_public: boolean('is_public').default(true).notNull(), 
    created_at: timestamp('created_at').defaultNow(),
});


// =================================================================
// 12. Definición de la tabla Routines (Rutinas del Usuario)
// =================================================================
const routines = pgTable('routines', {
    routine_id: serial('routine_id').primaryKey(),
    user_id: integer('user_id').references(() => users.user_id).notNull(),
    name: varchar('name', { length: 100 }).notNull(),
    description: varchar('description', { length: 255 }),
    is_active: boolean('is_active').default(true).notNull(),
    created_at: timestamp('created_at').defaultNow(),
    updated_at: timestamp('updated_at').defaultNow(),
});


// =================================================================
// 13. Definición de la tabla Routine_Exercises (Plantilla: Ejercicios en una Rutina)
// =================================================================
const routineExercises = pgTable('routine_exercises', {
    routine_exercise_id: serial('routine_exercise_id').primaryKey(),
    routine_id: integer('routine_id').references(() => routines.routine_id).notNull(),
    exercise_id: integer('exercise_id').references(() => exercises.exercise_id).notNull(),
    sets: integer('sets').notNull(),
    reps: integer('reps'), // Nulo si es cardio
    duration_minutes: numeric('duration_minutes'), // Nulo si es sets/reps
    weight_kg: numeric('weight_kg').default(0),
    order_index: integer('order_index').notNull(),
    day_of_week: integer('day_of_week'), // 0 = Domingo, 1 = Lunes, ..., 6 = Sábado. Null = todos los días
}, (table) => {
    return {
        routineExerciseUnique: unique('routine_exercise_unique').on(table.routine_id, table.exercise_id, table.day_of_week),
    };
});

// =================================================================
// 14. Definición de la tabla Daily_Exercises (Registro Diario de un Ejercicio Completado)
// =================================================================
const dailyExercises = pgTable('daily_exercises', {
    daily_exercise_id: serial('daily_exercise_id').primaryKey(),
    log_id: integer('log_id').references(() => dailyLogs.log_id).notNull(),
    exercise_id: integer('exercise_id').references(() => exercises.exercise_id).notNull(),
    
    // Datos de la sesión completada (lo que realmente hizo el usuario)
    sets_done: integer('sets_done').notNull(),
    reps_done: integer('reps_done'), 
    duration_minutes: numeric('duration_minutes'), 
    weight_kg: numeric('weight_kg').default(0),
    
    burned_calories: numeric('burned_calories').notNull(),
    created_at: timestamp('created_at').defaultNow(),
});


// =================================================================
// 15. Definición de la tabla User_Goals (Objetivos del Usuario)
// =================================================================
const userGoals = pgTable('user_goals', {
    goal_id: serial('goal_id').primaryKey(),
    user_id: integer('user_id').references(() => users.user_id).notNull(),
    target_weight: numeric('target_weight').notNull(), // Peso objetivo en kg
    current_weight: numeric('current_weight').notNull(), // Peso actual al establecer el objetivo
    daily_calorie_goal: numeric('daily_calorie_goal'), // Calorías diarias objetivo (calculadas)
    weekly_weight_change_goal: numeric('weekly_weight_change_goal').default(-0.5).notNull(), // Cambio de peso semanal objetivo (kg/semana, negativo = pérdida)
    goal_type: varchar('goal_type', { length: 50 }).default('weight_loss').notNull(), // 'weight_loss', 'weight_gain', 'maintain'
    is_active: boolean('is_active').default(true).notNull(),
    created_at: timestamp('created_at').defaultNow(),
    updated_at: timestamp('updated_at').defaultNow(),
});

// =================================================================
// 16. Definición de la tabla Scheduled_Routines (Rutinas Planificadas)
// =================================================================
const scheduledRoutines = pgTable('scheduled_routines', {
    scheduled_id: serial('scheduled_id').primaryKey(),
    user_id: integer('user_id').references(() => users.user_id).notNull(),
    routine_id: integer('routine_id').references(() => routines.routine_id).notNull(),
    scheduled_date: date('scheduled_date').notNull(), // Fecha para la cual está planificada la rutina
    is_completed: boolean('is_completed').default(false).notNull(), // Si la rutina fue completada
    completed_at: timestamp('completed_at'), // Timestamp de cuando se completó
    created_at: timestamp('created_at').defaultNow(),
    updated_at: timestamp('updated_at').defaultNow(),
}, (table) => {
    return {
        // Asegura que solo hay una rutina planificada por usuario por fecha (o permite múltiples, pero con unique por rutina-fecha)
        scheduledRoutineUnique: unique('scheduled_routine_unique').on(table.user_id, table.routine_id, table.scheduled_date),
    };
});

// =================================================================
// 17. Definición de la tabla User_Daily_Meal_Plans (Planes de comida por día)
// =================================================================
const userDailyMealPlans = pgTable('user_daily_meal_plans', {
    plan_id: serial('plan_id').primaryKey(),
    user_id: integer('user_id').references(() => users.user_id).notNull(),
    // 0 = Domingo, 1 = Lunes, ..., 6 = Sábado
    day_of_week: integer('day_of_week').notNull(),
    // Texto libre para indicar qué debe comer el usuario en cada comida
    breakfast: varchar('breakfast', { length: 1000 }),
    lunch: varchar('lunch', { length: 1000 }),
    dinner: varchar('dinner', { length: 1000 }),
    snacks: varchar('snacks', { length: 1000 }),
}, (table) => {
    return {
        userDayUnique: unique('user_day_unique').on(table.user_id, table.day_of_week),
    };
});

// =================================================================
// 18. Definición de la tabla Notifications (Sistema de Notificaciones)
// =================================================================
const notifications = pgTable('notifications', {
    notification_id: serial('notification_id').primaryKey(),
    user_id: integer('user_id').references(() => users.user_id).notNull(),
    title: varchar('title', { length: 255 }).notNull(),
    message: varchar('message', { length: 1000 }).notNull(),
    type: varchar('type', { length: 50 }).default('info').notNull(), // 'info', 'success', 'warning', 'achievement', 'reminder'
    is_read: boolean('is_read').default(false).notNull(),
    link_url: varchar('link_url', { length: 500 }), // URL opcional para navegar al hacer click
    created_at: timestamp('created_at').defaultNow(),
});

// =================================================================
// 19. Definición de la tabla Achievements (Sistema de Logros)
// =================================================================
const achievements = pgTable('achievements', {
    achievement_id: serial('achievement_id').primaryKey(),
    name: varchar('name', { length: 100 }).unique().notNull(),
    description: varchar('description', { length: 500 }),
    icon: varchar('icon', { length: 50 }), // Emoji o código de icono
    category: varchar('category', { length: 50 }), // 'weight', 'exercise', 'nutrition', 'streak', 'milestone'
    condition_type: varchar('condition_type', { length: 50 }).notNull(), // 'weight_loss', 'weight_gain', 'days_streak', 'exercises_completed', etc.
    condition_value: numeric('condition_value').notNull(), // Valor necesario para desbloquear
    rarity: varchar('rarity', { length: 20 }).default('common').notNull(), // 'common', 'rare', 'epic', 'legendary'
    created_at: timestamp('created_at').defaultNow(),
});

// =================================================================
// 20. Definición de la tabla User_Achievements (Logros Desbloqueados por Usuario)
// =================================================================
const userAchievements = pgTable('user_achievements', {
    user_achievement_id: serial('user_achievement_id').primaryKey(),
    user_id: integer('user_id').references(() => users.user_id).notNull(),
    achievement_id: integer('achievement_id').references(() => achievements.achievement_id).notNull(),
    unlocked_at: timestamp('unlocked_at').defaultNow(),
}, (table) => {
    return {
        userAchievementUnique: unique('user_achievement_unique').on(table.user_id, table.achievement_id),
    };
});

// =================================================================
// 21. Definición de la tabla Brand_Settings (Configuración de Marca/Organización)
// =================================================================
const brandSettings = pgTable('brand_settings', {
    setting_id: serial('setting_id').primaryKey(),
    brand_name: varchar('brand_name', { length: 100 }).default('FitnessApp').notNull(),
    tagline: varchar('tagline', { length: 255 }), // Slogan o tagline de la marca
    logo_url: varchar('logo_url', { length: 500 }), // URL del logo
    // Redes sociales
    instagram_url: varchar('instagram_url', { length: 255 }),
    facebook_url: varchar('facebook_url', { length: 255 }),
    twitter_url: varchar('twitter_url', { length: 255 }),
    linkedin_url: varchar('linkedin_url', { length: 255 }),
    youtube_url: varchar('youtube_url', { length: 255 }),
    tiktok_url: varchar('tiktok_url', { length: 255 }),
    website_url: varchar('website_url', { length: 255 }),
    created_at: timestamp('created_at').defaultNow(),
    updated_at: timestamp('updated_at').defaultNow(),
});

// =================================================================
// 22. Definición de la tabla Invite_Tokens (Sistema de Invitaciones)
// =================================================================
const inviteTokens = pgTable('invite_tokens', {
    id: serial('id').primaryKey(),
    coach_id: integer('coach_id').references(() => users.user_id).notNull(),
    email: varchar('email', { length: 255 }).notNull(),
    token: varchar('token', { length: 255 }).unique().notNull(),
    expires_at: timestamp('expires_at').notNull(),
    used: boolean('used').default(false).notNull(),
    created_at: timestamp('created_at').defaultNow(),
});

// =================================================================
// 23. Definición de la tabla Routine_Templates (Plantillas de Rutinas)
// =================================================================
const routineTemplates = pgTable('routine_templates', {
    template_id: serial('template_id').primaryKey(),
    coach_id: integer('coach_id').references(() => users.user_id).notNull(),
    name: varchar('name', { length: 100 }).notNull(),
    description: varchar('description', { length: 500 }),
    exercises: jsonb('exercises').notNull(), // Array de ejercicios con sets, reps, etc.
    created_at: timestamp('created_at').defaultNow(),
    updated_at: timestamp('updated_at').defaultNow(),
});

// =================================================================
// 24. Definición de la tabla Diet_Templates (Plantillas de Dietas)
// =================================================================
const dietTemplates = pgTable('diet_templates', {
    template_id: serial('template_id').primaryKey(),
    coach_id: integer('coach_id').references(() => users.user_id).notNull(),
    name: varchar('name', { length: 100 }).notNull(),
    description: varchar('description', { length: 500 }),
    meals: jsonb('meals').notNull(), // Array de comidas con alimentos y cantidades
    target_macros: jsonb('target_macros'), // {protein, carbs, fat, calories}
    created_at: timestamp('created_at').defaultNow(),
    updated_at: timestamp('updated_at').defaultNow(),
});

// =================================================================
// 25. Definición de la tabla Client_Routine_Assignments (Asignaciones de Rutinas)
// =================================================================
const clientRoutineAssignments = pgTable('client_routine_assignments', {
    assignment_id: serial('assignment_id').primaryKey(),
    client_id: integer('client_id').references(() => users.user_id).notNull(),
    template_id: integer('template_id').references(() => routineTemplates.template_id).notNull(),
    assigned_date: date('assigned_date').notNull(),
    is_recurring: boolean('is_recurring').default(false).notNull(),
    recurring_day: integer('recurring_day'), // 0-6 (Domingo-Sábado), null si no es recurrente
    created_at: timestamp('created_at').defaultNow(),
}, (table) => {
    return {
        assignmentUnique: unique('assignment_unique').on(table.client_id, table.template_id, table.assigned_date),
    };
});

// =================================================================
// 26. Definición de la tabla Check_Ins (Check-ins Semanales)
// =================================================================
const checkIns = pgTable('check_ins', {
    check_in_id: serial('check_in_id').primaryKey(),
    client_id: integer('client_id').references(() => users.user_id).notNull(),
    week_of: date('week_of').notNull(), // Lunes de la semana
    weight: numeric('weight'), // Peso en kg
    feeling: integer('feeling'), // 1-5 (escala de sentimiento)
    notes: text('notes'),
    photo_front: varchar('photo_front', { length: 500 }), // URL de la foto frontal
    photo_side: varchar('photo_side', { length: 500 }), // URL de la foto lateral
    photo_back: varchar('photo_back', { length: 500 }), // URL de la foto trasera
    created_at: timestamp('created_at').defaultNow(),
    updated_at: timestamp('updated_at').defaultNow(),
}, (table) => {
    return {
        checkInUnique: unique('check_in_unique').on(table.client_id, table.week_of),
    };
});

// =================================================================
// 27. Definición de la tabla Messages (Sistema de Chat)
// =================================================================
const messages = pgTable('messages', {
    message_id: serial('message_id').primaryKey(),
    sender_id: integer('sender_id').references(() => users.user_id).notNull(),
    receiver_id: integer('receiver_id').references(() => users.user_id).notNull(),
    content: text('content').notNull(),
    is_read: boolean('is_read').default(false).notNull(),
    created_at: timestamp('created_at').defaultNow(),
});

// =================================================================
// EXPORTACIÓN FINAL (Exportar todas las tablas a la vez)
// =================================================================
module.exports = {
    users,
    dailyLogs,
    foods,
    mealItems,
    exercises,       // <-- NUEVO
    routines,        // <-- NUEVO
    routineExercises, // <-- NUEVO
    dailyExercises,  // <-- NUEVO
    userGoals,       // <-- NUEVO: Objetivos del usuario
    scheduledRoutines, // <-- NUEVO: Rutinas planificadas en el calendario
    userDailyMealPlans, // <-- NUEVO: Planes de comidas por día definidos por el entrenador
    brandSettings,   // <-- NUEVO: Configuración de marca/organización
    notifications,  // <-- NUEVO: Sistema de notificaciones
    achievements,   // <-- NUEVO: Sistema de logros
    userAchievements, // <-- NUEVO: Logros desbloqueados por usuario
    inviteTokens,   // <-- NUEVO: Sistema de invitaciones para coach mode
    routineTemplates, // <-- NUEVO: Plantillas de rutinas
    dietTemplates,    // <-- NUEVO: Plantillas de dietas
    clientRoutineAssignments, // <-- NUEVO: Asignaciones de rutinas a clientes
    checkIns,        // <-- NUEVO: Check-ins semanales
    messages,        // <-- NUEVO: Sistema de chat
};