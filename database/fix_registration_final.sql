-- Drop and recreate the users table to fix any schema issues
DROP TABLE IF EXISTS users CASCADE;

-- Create the users table with a structure compatible with Supabase Auth
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    first_name TEXT,
    last_name TEXT,
    phone TEXT,
    role TEXT DEFAULT 'tenant' CHECK (role IN ('tenant', 'landlord', 'admin')),
    avatar_url TEXT,
    email_verified BOOLEAN DEFAULT FALSE,
    phone_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    date_of_birth DATE,
    verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
    account_status TEXT DEFAULT 'active' CHECK (account_status IN ('active', 'suspended', 'pending', 'deactivated')),
    last_login TIMESTAMP WITH TIME ZONE DEFAULT now(),
    registration_ip INET
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

-- Create trigger to sync auth.users metadata with users table
CREATE OR REPLACE FUNCTION sync_user_metadata()
RETURNS TRIGGER AS $$
BEGIN
    -- For inserts and updates to auth.users
    IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
        -- Insert or update record in users table based on metadata
        INSERT INTO public.users (
            id, 
            email,
            name,
            first_name,
            last_name,
            phone,
            role,
            date_of_birth
        ) 
        VALUES (
            NEW.id, 
            NEW.email,
            NEW.raw_user_meta_data->>'name',
            NEW.raw_user_meta_data->>'first_name',
            NEW.raw_user_meta_data->>'last_name',
            NEW.raw_user_meta_data->>'phone',
            COALESCE(NEW.raw_user_meta_data->>'role', 'tenant'),
            (NEW.raw_user_meta_data->>'date_of_birth')::date
        )
        ON CONFLICT (id) DO UPDATE SET
            email = NEW.email,
            name = NEW.raw_user_meta_data->>'name',
            first_name = NEW.raw_user_meta_data->>'first_name',
            last_name = NEW.raw_user_meta_data->>'last_name',
            phone = NEW.raw_user_meta_data->>'phone',
            role = COALESCE(NEW.raw_user_meta_data->>'role', users.role),
            date_of_birth = COALESCE((NEW.raw_user_meta_data->>'date_of_birth')::date, users.date_of_birth),
            updated_at = now();
        
        RETURN NEW;
    -- For deletes to auth.users (will cascade delete in users table)
    ELSIF (TG_OP = 'DELETE') THEN
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Create trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT OR UPDATE ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION sync_user_metadata();

-- Clear all existing RLS policies
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

-- Create simplified RLS policies
CREATE POLICY "anyone can sign up" ON users
    FOR INSERT
    WITH CHECK (auth.uid() = id);

CREATE POLICY "authenticated users can select" ON users
    FOR SELECT
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "users can update their own profile" ON users
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

CREATE POLICY "authenticated users can delete their own profile" ON users
    FOR DELETE
    USING (auth.uid() = id);

-- Grant appropriate privileges
GRANT ALL PRIVILEGES ON TABLE users TO postgres;
GRANT ALL PRIVILEGES ON TABLE users TO anon;
GRANT ALL PRIVILEGES ON TABLE users TO authenticated;
GRANT ALL PRIVILEGES ON TABLE users TO service_role;

-- Enable row level security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
