-- Drop existing RLS policies
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

-- Modify table to make some fields nullable
ALTER TABLE users 
    ALTER COLUMN role DROP NOT NULL,
    ALTER COLUMN first_name DROP NOT NULL,
    ALTER COLUMN last_name DROP NOT NULL,
    ALTER COLUMN full_name DROP NOT NULL;

-- Add trigger to set default role
CREATE OR REPLACE FUNCTION set_default_role()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.role IS NULL THEN
        NEW.role := 'tenant';
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER ensure_role_is_set
    BEFORE INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION set_default_role();

-- Add basic RLS policies
CREATE POLICY "enable_all_for_auth_users" ON users
    FOR ALL
    USING (auth.uid() IS NOT NULL)
    WITH CHECK (auth.uid() = id);

-- Disable RLS temporarily to allow initial setup
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Reset table permissions
GRANT ALL ON users TO authenticated;
GRANT ALL ON users TO service_role;

-- Re-enable RLS after initial setup
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
