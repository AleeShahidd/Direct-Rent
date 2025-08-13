-- Migration: Add enhanced user fields
-- Run this in Supabase SQL Editor

-- Add new columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'pending';
ALTER TABLE users ADD COLUMN IF NOT EXISTS account_status TEXT DEFAULT 'active';
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS registration_ip INET;

-- Add constraints
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_verification_status_check') THEN
        ALTER TABLE users ADD CONSTRAINT users_verification_status_check 
        CHECK (verification_status IN ('pending', 'verified', 'rejected'));
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_account_status_check') THEN
        ALTER TABLE users ADD CONSTRAINT users_account_status_check 
        CHECK (account_status IN ('active', 'suspended', 'pending', 'deactivated'));
    END IF;
END $$;

-- Update existing users with default values (split full_name into first_name and last_name)
UPDATE users 
SET 
    first_name = CASE 
        WHEN position(' ' in full_name) > 0 
        THEN substring(full_name from 1 for position(' ' in full_name) - 1)
        ELSE full_name
    END,
    last_name = CASE 
        WHEN position(' ' in full_name) > 0 
        THEN substring(full_name from position(' ' in full_name) + 1)
        ELSE ''
    END,
    verification_status = COALESCE(verification_status, 'pending'),
    account_status = COALESCE(account_status, 'active')
WHERE first_name IS NULL OR last_name IS NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_users_verification_status ON users(verification_status);
CREATE INDEX IF NOT EXISTS idx_users_account_status ON users(account_status);
CREATE INDEX IF NOT EXISTS idx_users_last_login ON users(last_login);

-- Update the updated_at trigger to include new fields
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Log the migration
INSERT INTO migrations (name, executed_at) VALUES ('add_enhanced_user_fields', NOW())
ON CONFLICT (name) DO NOTHING;
