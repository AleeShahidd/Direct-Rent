// Fix for the name field discrepancy in the database schema
// This script adds either 'name' or 'full_name' column to the users table depending on which one is missing

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase admin client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.log('Error: Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  }
});

async function main() {
  console.log('Starting database schema fix for name fields...');

  try {
    // First, let's check the current schema
    console.log('Checking current schema...');
    
    // Get first user to check schema
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .limit(1)
      .single();
      
    if (userError) {
      if (userError.code === 'PGRST116') {
        console.log('Error: Row Level Security preventing access to users table.');
        console.log('Try running this script with the service role key or disabling RLS temporarily.');
        process.exit(1);
      }
      
      console.log('Error fetching user data:', userError);
      process.exit(1);
    }
    
    const columnNames = Object.keys(userData);
    const hasFullName = columnNames.includes('full_name');
    const hasName = columnNames.includes('name');
    
    console.log('Current schema check:');
    console.log(`- 'full_name' column exists: ${hasFullName}`);
    console.log(`- 'name' column exists: ${hasName}`);
    
    if (hasFullName && hasName) {
      console.log('Both columns already exist. No schema changes needed.');
      
      // Check if values are synchronized
      console.log('Checking if values are synchronized...');
      
      const { data: usersWithMismatch, error: mismatchError } = await supabase
        .from('users')
        .select('id, name, full_name')
        .or('name.neq.full_name,and(name.is.null,full_name.is.not.null),and(name.is.not.null,full_name.is.null)')
        .limit(100);
        
      if (mismatchError) {
        console.log('Error checking for mismatched values:', mismatchError);
      } else if (usersWithMismatch && usersWithMismatch.length > 0) {
        console.log(`Found ${usersWithMismatch.length} users with mismatched name values. Synchronizing...`);
        
        // Fix mismatches by synchronizing values
        for (const user of usersWithMismatch) {
          const updateValue = user.name || user.full_name;
          const { error: updateError } = await supabase
            .from('users')
            .update({
              name: updateValue,
              full_name: updateValue
            })
            .eq('id', user.id);
            
          if (updateError) {
            console.log(`Error updating user ${user.id}:`, updateError);
          }
        }
        
        console.log('Synchronization complete.');
      } else {
        console.log('All values are properly synchronized.');
      }
      
      // Create synchronization trigger if it doesn't exist
      console.log('Ensuring synchronization trigger exists...');
      
      const { error: triggerError } = await supabase.rpc('execute_sql', {
        sql_query: `
          CREATE OR REPLACE FUNCTION sync_name_columns()
          RETURNS TRIGGER AS $$
          BEGIN
            IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
              IF NEW.name IS NOT NULL AND NEW.full_name IS NULL THEN
                NEW.full_name := NEW.name;
              ELSIF NEW.full_name IS NOT NULL AND NEW.name IS NULL THEN
                NEW.name := NEW.full_name;
              END IF;
            END IF;
            RETURN NEW;
          END;
          $$ LANGUAGE plpgsql;

          DROP TRIGGER IF EXISTS sync_name_columns_trigger ON users;
          CREATE TRIGGER sync_name_columns_trigger
          BEFORE INSERT OR UPDATE ON users
          FOR EACH ROW EXECUTE FUNCTION sync_name_columns();
        `
      });
      
      if (triggerError) {
        console.log('Error creating sync trigger:', triggerError);
      } else {
        console.log('Synchronization trigger created/updated successfully.');
      }
      
      process.exit(0);
    }
    
    // Add missing column
    if (!hasFullName) {
      console.log("The 'full_name' column is missing. Adding it...");
      
      const { error: addColumnError } = await supabase.rpc('execute_sql', {
        sql_query: `
          ALTER TABLE users ADD COLUMN full_name TEXT;
          UPDATE users SET full_name = name WHERE full_name IS NULL;
        `
      });
      
      if (addColumnError) {
        console.log('Error adding full_name column:', addColumnError);
        process.exit(1);
      }
      
      console.log("Added 'full_name' column and copied values from 'name'.");
    }
    
    if (!hasName) {
      console.log("The 'name' column is missing. Adding it...");
      
      const { error: addColumnError } = await supabase.rpc('execute_sql', {
        sql_query: `
          ALTER TABLE users ADD COLUMN name TEXT;
          UPDATE users SET name = full_name WHERE name IS NULL;
        `
      });
      
      if (addColumnError) {
        console.log('Error adding name column:', addColumnError);
        process.exit(1);
      }
      
      console.log("Added 'name' column and copied values from 'full_name'.");
    }
    
    // Create synchronization trigger
    console.log('Creating synchronization trigger...');
    
    const { error: triggerError } = await supabase.rpc('execute_sql', {
      sql_query: `
        CREATE OR REPLACE FUNCTION sync_name_columns()
        RETURNS TRIGGER AS $$
        BEGIN
          IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
            IF NEW.name IS NOT NULL AND NEW.full_name IS NULL THEN
              NEW.full_name := NEW.name;
            ELSIF NEW.full_name IS NOT NULL AND NEW.name IS NULL THEN
              NEW.name := NEW.full_name;
            END IF;
          END IF;
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;

        DROP TRIGGER IF EXISTS sync_name_columns_trigger ON users;
        CREATE TRIGGER sync_name_columns_trigger
        BEFORE INSERT OR UPDATE ON users
        FOR EACH ROW EXECUTE FUNCTION sync_name_columns();
      `
    });
    
    if (triggerError) {
      console.log('Error creating sync trigger:', triggerError);
      process.exit(1);
    }
    
    console.log('Synchronization trigger created successfully.');
    
    // Verify fix was successful
    console.log('Verifying schema fix...');
    
    const { data: verifyData, error: verifyError } = await supabase
      .from('users')
      .select('name, full_name')
      .limit(1)
      .single();
      
    if (verifyError) {
      console.log('Error verifying schema fix:', verifyError);
      process.exit(1);
    }
    
    const verifyColumnNames = Object.keys(verifyData);
    const verifyHasFullName = verifyColumnNames.includes('full_name');
    const verifyHasName = verifyColumnNames.includes('name');
    
    if (verifyHasFullName && verifyHasName) {
      console.log('✅ Schema fix successful! Both name and full_name columns now exist.');
    } else {
      console.log('❌ Schema fix verification failed. Not all columns were created.');
      process.exit(1);
    }
    
    console.log('Database schema has been fixed successfully!');
    
  } catch (error) {
    console.log('Unexpected error:', error);
    process.exit(1);
  }
}

main();
