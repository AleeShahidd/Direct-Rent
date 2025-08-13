-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;

-- Users table policies
CREATE POLICY "Users can create their own profile" ON users
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view their own profile and public profiles" ON users
    FOR SELECT USING (
        -- Users can view their own profile
        auth.uid() = id OR
        -- Admin can view all profiles
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin') OR
        -- Landlords can view tenant profiles who have made bookings on their properties
        (role = 'tenant' AND EXISTS (
            SELECT 1 FROM bookings b
            JOIN properties p ON b.property_id = p.id
            WHERE b.tenant_id = users.id AND p.landlord_id = auth.uid()
        )) OR
        -- Tenants can view landlord profiles of properties they're interested in
        (role = 'landlord' AND EXISTS (
            SELECT 1 FROM properties p
            WHERE p.landlord_id = users.id AND p.is_active = true
        ))
    );

CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (
        -- Users can update their own profile
        auth.uid() = id OR
        -- Admin can update any profile
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
    )
    WITH CHECK (
        -- Users can update their own profile
        auth.uid() = id OR
        -- Admin can update any profile
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Only admins can delete user profiles" ON users
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
    );

-- Update the trigger function to prevent role changes except by admin
CREATE OR REPLACE FUNCTION prevent_role_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if role is being changed
    IF OLD.role != NEW.role THEN
        -- Only allow if user is admin
        IF NOT EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin') THEN
            RAISE EXCEPTION 'Only administrators can change user roles';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to prevent role changes
DROP TRIGGER IF EXISTS prevent_role_change_trigger ON users;
CREATE TRIGGER prevent_role_change_trigger
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION prevent_role_change();

-- Add security definer function for admin operations
CREATE OR REPLACE FUNCTION admin_update_user_role(user_id UUID, new_role TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Check if the executing user is an admin
    IF NOT EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin') THEN
        RAISE EXCEPTION 'Only administrators can execute this function';
    END IF;

    -- Validate the new role
    IF new_role NOT IN ('tenant', 'landlord', 'admin') THEN
        RAISE EXCEPTION 'Invalid role specified';
    END IF;

    -- Update the user's role
    UPDATE users SET 
        role = new_role,
        updated_at = now()
    WHERE id = user_id;
END;
$$;
