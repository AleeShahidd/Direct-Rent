-- First drop all existing policies on the users table
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

-- Basic policies without recursive checks
CREATE POLICY "enable_insert_for_registration" ON users
    FOR INSERT 
    WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "enable_select_for_users" ON users
    FOR SELECT
    USING (
        auth.uid() = id OR  -- User can read their own profile
        role = 'landlord' OR  -- Anyone can read landlord profiles
        EXISTS (
            SELECT 1 
            FROM auth.users au 
            WHERE au.id = auth.uid() 
            AND au.raw_app_meta_data->>'role' = 'admin'
        )
    );

CREATE POLICY "enable_update_for_users" ON users
    FOR UPDATE
    USING (
        -- Users can update their own profiles
        auth.uid() = id OR 
        -- Admins can update any profile except other admins
        (
            EXISTS (
                SELECT 1 
                FROM auth.users au 
                WHERE au.id = auth.uid() 
                AND au.raw_app_meta_data->>'role' = 'admin'
            ) AND
            NOT (SELECT role = 'admin' FROM users WHERE id = auth.uid())
        )
    )
    WITH CHECK (
        -- Same conditions as USING clause
        auth.uid() = id OR 
        (
            EXISTS (
                SELECT 1 
                FROM auth.users au 
                WHERE au.id = auth.uid() 
                AND au.raw_app_meta_data->>'role' = 'admin'
            ) AND
            NOT (SELECT role = 'admin' FROM users WHERE id = auth.uid())
        )
    );

CREATE POLICY "enable_delete_for_users" ON users
    FOR DELETE
    USING (
        -- Users can delete their own profiles
        auth.uid() = id OR 
        -- Admins can delete any profile except other admins
        (
            EXISTS (
                SELECT 1 
                FROM auth.users au 
                WHERE au.id = auth.uid() 
                AND au.raw_app_meta_data->>'role' = 'admin'
            ) AND
            NOT (SELECT role = 'admin' FROM users WHERE id = auth.uid())
        )
    );

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
