-- Migration: Add onboarding tracking fields to users table
-- This allows tracking if user has completed the initial setup

ALTER TABLE users
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE users
ADD COLUMN IF NOT EXISTS onboarding_step INTEGER NOT NULL DEFAULT 0;

-- Add comments to explain the columns
COMMENT ON COLUMN users.onboarding_completed IS 'Indica si el usuario ha completado el proceso de onboarding inicial';
COMMENT ON COLUMN users.onboarding_step IS 'Paso actual del onboarding: 0=no empezado, 1=peso inicial, 2=objetivos, 3=primera rutina, 4=completado';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_users_onboarding_completed 
ON users(onboarding_completed);

