-- First drop all existing policies on the users table
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Users can create their own profile" ON users;
DROP POLICY IF EXISTS "Users can view their own profile and public profiles" ON users;
DROP POLICY IF EXISTS "Only admins can delete user profiles" ON users;

-- Basic insert policy - Allow users to create their profile during signup
CREATE POLICY "Can create own profile" ON users
    FOR INSERT 
    WITH CHECK (auth.uid() = id);

-- Basic read policy - Allow users to read their own profile and others based on role
CREATE POLICY "Can read profiles" ON users
    FOR SELECT USING (
        auth.uid() = id OR  -- Can read own profile
        role = 'landlord'   -- Can read landlord profiles (public)
    );

-- Basic update policy - Allow users to update their own profile
CREATE POLICY "Can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Basic delete policy - Only allow self-deletion
CREATE POLICY "Can delete own profile" ON users
    FOR DELETE USING (auth.uid() = id);

-- Special admin policy - Admin override for all operations
CREATE POLICY "Admin full access" ON users
    USING (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id = auth.uid() 
            AND u.role = 'admin'
            AND u.id != users.id  -- Prevent recursion
        )
    );

-- Drop existing triggers that may conflict
DROP TRIGGER IF EXISTS prevent_role_change_trigger ON users;

-- Simple trigger to prevent role changes except by admin
CREATE OR REPLACE FUNCTION check_role_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Allow initial role setting
    IF TG_OP = 'INSERT' THEN 
        RETURN NEW;
    END IF;
    
    -- Block role changes unless admin
    IF OLD.role != NEW.role AND NOT (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'admin'
            AND id != NEW.id
        )
    ) THEN
        RAISE EXCEPTION 'Only admins can change user roles';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_role_change
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION check_role_change();
