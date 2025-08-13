-- First drop all existing policies
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

-- Simplified policies without any recursion
CREATE POLICY "allow_insert_with_auth" ON users FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "allow_select_own_and_landlords" ON users FOR SELECT 
USING (
    auth.uid() = id OR -- Can read own profile
    role = 'landlord'  -- Can read landlord profiles
);

CREATE POLICY "allow_update_own" ON users FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "allow_delete_own" ON users FOR DELETE 
USING (auth.uid() = id);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Reset permission for public role
GRANT ALL ON users TO authenticated;
