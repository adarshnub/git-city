-- Run this in Supabase SQL Editor to add user roles and edition numbers

-- Add user_role column: 'master' (only adarshnub), 'member' (everyone else)
ALTER TABLE users ADD COLUMN IF NOT EXISTS user_role text DEFAULT 'member';

-- Add edition_number column: 1-10 for the first 10 users (by signup order)
ALTER TABLE users ADD COLUMN IF NOT EXISTS edition_number integer;

-- Set adarshnub as master (run after the user has logged in at least once)
UPDATE users SET user_role = 'master' WHERE username = 'adarshnub';

-- Auto-assign edition numbers to the first 10 users (by created_at)
-- This uses a CTE to rank users and assign edition 1-10
WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC) AS rn
  FROM users
)
UPDATE users
SET edition_number = ranked.rn
FROM ranked
WHERE users.id = ranked.id AND ranked.rn <= 10;

-- Create a trigger to auto-assign edition numbers for new users
-- (only if fewer than 10 users have editions)
CREATE OR REPLACE FUNCTION assign_edition_number()
RETURNS TRIGGER AS $$
DECLARE
  current_count integer;
BEGIN
  -- Set master role for adarshnub
  IF NEW.username = 'adarshnub' THEN
    NEW.user_role := 'master';
  END IF;

  -- Count how many users already have edition numbers
  SELECT COUNT(*) INTO current_count FROM users WHERE edition_number IS NOT NULL;

  -- If fewer than 10, assign the next number
  IF current_count < 10 THEN
    NEW.edition_number := current_count + 1;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop if exists and recreate
DROP TRIGGER IF EXISTS trg_assign_edition ON users;
CREATE TRIGGER trg_assign_edition
  BEFORE INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION assign_edition_number();
