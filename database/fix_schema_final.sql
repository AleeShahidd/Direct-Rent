-- First drop all existing tables and recreate with correct schema
DROP TABLE IF EXISTS users CASCADE;

-- Create the users table with all required columns
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    name TEXT NOT NULL, -- Changed from full_name to name
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    phone TEXT,
    role TEXT NOT NULL DEFAULT 'tenant' CHECK (role IN ('tenant', 'landlord', 'admin')),
    avatar_url TEXT,
    email_verified BOOLEAN DEFAULT FALSE,
    phone_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    date_of_birth DATE NOT NULL,
    verification_status TEXT NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
    account_status TEXT NOT NULL DEFAULT 'active' CHECK (account_status IN ('active', 'suspended', 'pending', 'deactivated')),
    last_login TIMESTAMP WITH TIME ZONE DEFAULT now(),
    registration_ip INET,
    CONSTRAINT users_email_unique UNIQUE (email)
);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_users_updated_at();

-- Drop all existing policies
DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- Drop all policies on the users table
    FOR r IN (
        SELECT policyname FROM pg_policies WHERE tablename = 'users'
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON users', r.policyname);
    END LOOP;
END $$;

-- Simple RLS policies
CREATE POLICY "enable_insert_for_auth" ON users
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "enable_select_for_auth" ON users
    FOR SELECT USING (
        auth.uid() = id OR  -- Can read own profile
        role = 'landlord'   -- Can read landlord profiles
    );

CREATE POLICY "enable_update_for_auth" ON users
    FOR UPDATE USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

CREATE POLICY "enable_delete_for_auth" ON users
    FOR DELETE USING (auth.uid() = id);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT ALL ON users TO authenticated;
GRANT ALL ON users TO service_role;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS users_id_idx ON users(id);
CREATE INDEX IF NOT EXISTS users_email_idx ON users(email);
CREATE INDEX IF NOT EXISTS users_role_idx ON users(role);
