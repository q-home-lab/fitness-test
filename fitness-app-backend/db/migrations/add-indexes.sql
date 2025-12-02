-- Script de migración para agregar índices a la base de datos
-- Mejora el rendimiento de consultas frecuentes

-- Índices en foreign keys (mejoran JOINs)
CREATE INDEX IF NOT EXISTS idx_daily_logs_user_id ON daily_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_logs_date ON daily_logs(date);
CREATE INDEX IF NOT EXISTS idx_daily_logs_user_date ON daily_logs(user_id, date);

CREATE INDEX IF NOT EXISTS idx_meal_items_log_id ON meal_items(log_id);
CREATE INDEX IF NOT EXISTS idx_meal_items_food_id ON meal_items(food_id);

CREATE INDEX IF NOT EXISTS idx_daily_exercises_log_id ON daily_exercises(log_id);
CREATE INDEX IF NOT EXISTS idx_daily_exercises_exercise_id ON daily_exercises(exercise_id);

CREATE INDEX IF NOT EXISTS idx_routines_user_id ON routines(user_id);
CREATE INDEX IF NOT EXISTS idx_routines_user_active ON routines(user_id, is_active);

CREATE INDEX IF NOT EXISTS idx_routine_exercises_routine_id ON routine_exercises(routine_id);
CREATE INDEX IF NOT EXISTS idx_routine_exercises_exercise_id ON routine_exercises(exercise_id);

CREATE INDEX IF NOT EXISTS idx_user_goals_user_id ON user_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_user_goals_active ON user_goals(user_id, is_active);

CREATE INDEX IF NOT EXISTS idx_scheduled_routines_user_id ON scheduled_routines(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_routines_date ON scheduled_routines(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_scheduled_routines_user_date ON scheduled_routines(user_id, scheduled_date);

CREATE INDEX IF NOT EXISTS idx_user_daily_meal_plans_user_id ON user_daily_meal_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_user_daily_meal_plans_day ON user_daily_meal_plans(user_id, day_of_week);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement_id ON user_achievements(achievement_id);

CREATE INDEX IF NOT EXISTS idx_invite_tokens_coach_id ON invite_tokens(coach_id);
CREATE INDEX IF NOT EXISTS idx_invite_tokens_token ON invite_tokens(token);
CREATE INDEX IF NOT EXISTS idx_invite_tokens_expires ON invite_tokens(expires_at);

CREATE INDEX IF NOT EXISTS idx_routine_templates_coach_id ON routine_templates(coach_id);
CREATE INDEX IF NOT EXISTS idx_diet_templates_coach_id ON diet_templates(coach_id);

CREATE INDEX IF NOT EXISTS idx_client_routine_assignments_client_id ON client_routine_assignments(client_id);
CREATE INDEX IF NOT EXISTS idx_client_routine_assignments_template_id ON client_routine_assignments(template_id);

CREATE INDEX IF NOT EXISTS idx_check_ins_client_id ON check_ins(client_id);
CREATE INDEX IF NOT EXISTS idx_check_ins_week ON check_ins(client_id, week_of);

CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(receiver_id, created_at DESC);

-- Índices en columnas de búsqueda frecuente
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_coach_id ON users(coach_id);

CREATE INDEX IF NOT EXISTS idx_foods_name ON foods(name);
CREATE INDEX IF NOT EXISTS idx_foods_name_lower ON foods(LOWER(name));

CREATE INDEX IF NOT EXISTS idx_exercises_name ON exercises(name);
CREATE INDEX IF NOT EXISTS idx_exercises_category ON exercises(category);
CREATE INDEX IF NOT EXISTS idx_exercises_public ON exercises(is_public);

-- Índices compuestos para queries comunes
CREATE INDEX IF NOT EXISTS idx_users_role_coach ON users(role, coach_id) WHERE role = 'CLIENT';
CREATE INDEX IF NOT EXISTS idx_daily_logs_user_date_weight ON daily_logs(user_id, date, weight);

