-- Migration: Add day_of_week column to routine_exercises table
-- This allows exercises to be organized by days of the week

-- First, drop the old unique constraint that didn't include day_of_week
ALTER TABLE routine_exercises 
DROP CONSTRAINT IF EXISTS routine_exercise_unique;

-- Add the new day_of_week column (nullable, allowing exercises without a specific day)
ALTER TABLE routine_exercises 
ADD COLUMN IF NOT EXISTS day_of_week INTEGER;

-- Add comment to explain the column
COMMENT ON COLUMN routine_exercises.day_of_week IS 'Day of the week: 0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday. NULL means all days or no specific day assigned.';

-- Create a new unique constraint that includes day_of_week
-- This allows the same exercise to be added multiple times to a routine, but on different days
ALTER TABLE routine_exercises 
ADD CONSTRAINT routine_exercise_unique 
UNIQUE (routine_id, exercise_id, day_of_week);

-- Create an index for better query performance when filtering by day
CREATE INDEX IF NOT EXISTS idx_routine_exercises_day_of_week 
ON routine_exercises(routine_id, day_of_week);

