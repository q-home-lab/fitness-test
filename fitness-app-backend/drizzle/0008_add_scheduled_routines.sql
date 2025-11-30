-- Migration: Add scheduled_routines table for calendar functionality
-- This allows users to schedule routines for specific dates

CREATE TABLE IF NOT EXISTS scheduled_routines (
    scheduled_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    routine_id INTEGER NOT NULL REFERENCES routines(routine_id) ON DELETE CASCADE,
    scheduled_date DATE NOT NULL,
    is_completed BOOLEAN NOT NULL DEFAULT FALSE,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT scheduled_routine_unique UNIQUE (user_id, routine_id, scheduled_date)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_scheduled_routines_user_date 
ON scheduled_routines(user_id, scheduled_date);

CREATE INDEX IF NOT EXISTS idx_scheduled_routines_date 
ON scheduled_routines(scheduled_date);

CREATE INDEX IF NOT EXISTS idx_scheduled_routines_completed 
ON scheduled_routines(user_id, is_completed, scheduled_date);

-- Add comment to explain the table
COMMENT ON TABLE scheduled_routines IS 'Rutinas planificadas por los usuarios para fechas específicas en el calendario';

COMMENT ON COLUMN scheduled_routines.is_completed IS 'Indica si la rutina fue completada en la fecha planificada';
COMMENT ON COLUMN scheduled_routines.completed_at IS 'Timestamp de cuando se marcó como completada la rutina';

