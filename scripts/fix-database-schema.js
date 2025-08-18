// Script to fix the users table schema issues
require('dotenv').config({path:'.env.local'});
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.log('Missing environment variables. Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
  process.exit(1);
}

// Create Supabase admin client
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

async function fixUserSchema() {
  console.log('🔧 Fixing users table schema...');
  
  try {
    // Check if the schema already exists
    const { data: { exists } } = await supabase.rpc('check_schema_exists', {
      schema_name: 'public',
      table_name: 'users'
    }).catch(() => ({ data: { exists: false } }));
    
    if (exists) {
      console.log('✅ Users table already exists. Checking its structure...');
      
      // Get columns to see if we need fixes
      // We'll execute a query to check if our target columns exist
      const { error: describeError } = await supabase
        .from('users')
        .select('name')
        .limit(1)
        .single();
      
      if (describeError && describeError.message.includes('column "name" does not exist')) {
        console.log('🚨 Detected missing "name" column. Adding it...');
        
        // Execute SQL to modify table
        const { error: alterError } = await supabase.rpc('execute_sql', {
          sql_query: `
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS name TEXT,
            DROP COLUMN IF EXISTS full_name
          `
        }).catch(e => ({ error: e }));
        
        if (alterError) {
          console.log('❌ Failed to alter users table:', alterError);
          return false;
        }
        
        console.log('✅ Added "name" column to users table');
      } else {
        console.log('✅ Users table structure looks good');
      }
    } else {
      console.log('🚨 Users table does not exist. Creating it...');
      
      // Create the users table with correct schema
      const { error: createError } = await supabase.rpc('execute_sql', {
        sql_query: `
          CREATE TABLE IF NOT EXISTS users (
            id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
            email TEXT,
            name TEXT,
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
        `
      }).catch(e => ({ error: e }));
      
      if (createError) {
        console.log('❌ Failed to create users table:', createError);
        return false;
      }
      
      console.log('✅ Created users table with correct schema');
    }

    return true;
  } catch (error) {
    console.log('❌ Unexpected error:', error);
    return false;
  }
}

async function main() {
  console.log('🔍 Starting database schema fix process...');
  
  const success = await fixUserSchema();
  
  if (success) {
    console.log('✅ Database schema fix completed successfully');
  } else {
    console.log('❌ Database schema fix failed');
    process.exit(1);
  }
}

main();
