-- Migration: Add user profile fields (gender, age, height) to users table
-- These fields are used for personalized health calculations

ALTER TABLE users
ADD COLUMN IF NOT EXISTS gender varchar(20);

ALTER TABLE users
ADD COLUMN IF NOT EXISTS age integer;

ALTER TABLE users
ADD COLUMN IF NOT EXISTS height numeric;

-- Add comments to explain the columns
COMMENT ON COLUMN users.gender IS 'Género del usuario: male, female, other';
COMMENT ON COLUMN users.age IS 'Edad del usuario en años';
COMMENT ON COLUMN users.height IS 'Altura del usuario en centímetros';

