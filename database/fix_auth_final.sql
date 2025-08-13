-- Drop all existing policies and triggers
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Users can create their own profile" ON users;
DROP POLICY IF EXISTS "Users can view their own profile and public profiles" ON users;
DROP POLICY IF EXISTS "Only admins can delete user profiles" ON users;
DROP POLICY IF EXISTS "Can create own profile" ON users;
DROP POLICY IF EXISTS "Can read profiles" ON users;
DROP POLICY IF EXISTS "Can update own profile" ON users;
DROP POLICY IF EXISTS "Can delete own profile" ON users;
DROP POLICY IF EXISTS "Admin full access" ON users;
DROP POLICY IF EXISTS "enable_insert_for_registration" ON users;
DROP POLICY IF EXISTS "enable_select_for_users" ON users;
DROP POLICY IF EXISTS "enable_update_for_users" ON users;
DROP POLICY IF EXISTS "enable_delete_for_users" ON users;
DROP POLICY IF EXISTS "allow_insert_with_auth" ON users;
DROP POLICY IF EXISTS "allow_select_own_and_landlords" ON users;
DROP POLICY IF EXISTS "allow_update_own" ON users;
DROP POLICY IF EXISTS "allow_delete_own" ON users;
DROP POLICY IF EXISTS "enable_all_for_auth_users" ON users;

-- Drop existing triggers
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
DROP TRIGGER IF EXISTS ensure_role_is_set ON users;

-- Drop existing functions
DROP FUNCTION IF EXISTS update_updated_at_column();
DROP FUNCTION IF EXISTS set_default_role();

-- Temporarily disable RLS
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Recreate the users table with proper constraints
DROP TABLE IF EXISTS users CASCADE;
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    full_name TEXT,
    first_name TEXT,
    last_name TEXT,
    phone TEXT,
    role TEXT DEFAULT 'tenant',
    avatar_url TEXT,
    email_verified BOOLEAN DEFAULT FALSE,
    phone_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    date_of_birth DATE,
    verification_status TEXT DEFAULT 'pending',
    account_status TEXT DEFAULT 'active',
    last_login TIMESTAMP WITH TIME ZONE DEFAULT now(),
    registration_ip INET
);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
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
    EXECUTE FUNCTION update_updated_at_column();

-- Simple RLS policies that work
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

-- Create index for performance
CREATE INDEX IF NOT EXISTS users_id_idx ON users(id);
CREATE INDEX IF NOT EXISTS users_email_idx ON users(email);
CREATE INDEX IF NOT EXISTS users_role_idx ON users(role);
