-- Drop existing policies
DROP POLICY IF EXISTS "Users can create their own profile" ON users;
DROP POLICY IF EXISTS "Users can view their own profile and public profiles" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Only admins can delete user profiles" ON users;

-- Clear all existing policies
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;

-- Re-create policies with fixed recursion issue
-- 1. Create policy (during signup)
CREATE POLICY "Users can create their own profile" ON users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- 2. Read policy (simplify to avoid recursion)
CREATE POLICY "Users can view profiles" ON users
    FOR SELECT USING (
        CASE
            -- User can view their own profile
            WHEN auth.uid() = id THEN true
            -- Admin can view all profiles
            WHEN EXISTS (
                SELECT 1 FROM users 
                WHERE users.id = auth.uid() 
                AND users.role = 'admin'
                AND users.id != id  -- Prevent recursion
            ) THEN true
            -- Landlords can view public tenant profiles
            WHEN role = 'tenant' AND (
                EXISTS (
                    SELECT 1 FROM properties p
                    WHERE p.landlord_id = auth.uid()
                )
            ) THEN true
            -- Anyone can view active landlord profiles
            WHEN role = 'landlord' THEN true
            ELSE false
        END
    );

-- 3. Update policy (self or admin)
CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (
        -- Users can update their own profile
        auth.uid() = id OR
        -- Admins can update any profile except their own (to prevent recursion)
        (
            EXISTS (
                SELECT 1 FROM users
                WHERE users.id = auth.uid()
                AND users.role = 'admin'
                AND users.id != id  -- Prevent recursion
            )
        )
    )
    WITH CHECK (
        -- Same conditions as USING clause
        auth.uid() = id OR
        (
            EXISTS (
                SELECT 1 FROM users
                WHERE users.id = auth.uid()
                AND users.role = 'admin'
                AND users.id != id  -- Prevent recursion
            )
        )
    );

-- 4. Delete policy (admin only)
CREATE POLICY "Only admins can delete user profiles" ON users
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
            AND users.id != id  -- Prevent recursion
        )
    );

-- Remove the trigger that was causing issues
DROP TRIGGER IF EXISTS prevent_role_change_trigger ON users;

-- Create a new, simplified role change prevention trigger
CREATE OR REPLACE FUNCTION prevent_role_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Allow the initial role setting on insert
    IF TG_OP = 'INSERT' THEN
        RETURN NEW;
    END IF;

    -- Check if role is being changed
    IF OLD.role != NEW.role THEN
        -- Only allow if user is admin (but not changing their own role)
        IF EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid()
            AND role = 'admin'
            AND id != NEW.id  -- Prevent recursion
        ) THEN
            RETURN NEW;
        ELSE
            RAISE EXCEPTION 'Only administrators can change user roles';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Re-create trigger
CREATE TRIGGER prevent_role_change_trigger
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION prevent_role_change();

-- Create secure helper functions
CREATE OR REPLACE FUNCTION get_user_role(user_id UUID)
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT role FROM users WHERE id = user_id LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT role = 'admin' FROM users WHERE id = user_id LIMIT 1;
$$;
