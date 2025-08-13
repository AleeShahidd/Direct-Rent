-- Drop existing policies
DROP POLICY IF EXISTS "Users can read their own profiles" ON users;
DROP POLICY IF EXISTS "Users can update their own profiles" ON users;
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON users;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON users;
DROP POLICY IF EXISTS "Enable update for users based on id" ON users;

-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to insert their own profile
CREATE POLICY "Allow insert for authenticated users"
ON users
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Allow users to read their own profile and admins to read all profiles
CREATE POLICY "Enable read access for authenticated users"
ON users
FOR SELECT
TO authenticated
USING (
  auth.uid() = id 
  OR 
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);

-- Allow users to update their own profile
CREATE POLICY "Enable update for users based on id"
ON users
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Allow service role to bypass RLS
ALTER TABLE users FORCE ROW LEVEL SECURITY;
GRANT ALL ON users TO service_role;

-- Create a function to handle user profile creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO users (
    id,
    email,
    full_name,
    role,
    email_verified,
    created_at,
    updated_at
  ) VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'role', 'tenant'),
    COALESCE(new.email_confirmed_at IS NOT NULL, false),
    now(),
    now()
  );
  RETURN new;
END;
$$ language plpgsql security definer;

-- Create trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE handle_new_user();
