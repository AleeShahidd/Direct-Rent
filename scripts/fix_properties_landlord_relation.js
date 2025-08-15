// Script to apply the properties-landlord relationship fix
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Supabase client with admin privileges
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Missing Supabase credentials in environment variables.');
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  try {
    console.log('Starting migration: Fix properties-landlord relationship...');
    
    // Define our SQL commands directly
    const sqlCommands = [
      // 1. Check if landlord_id column exists, add it if it doesn't
      `
      DO $$
      BEGIN
          IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_schema = 'public' 
              AND table_name = 'properties' 
              AND column_name = 'landlord_id'
          ) THEN
              ALTER TABLE properties ADD COLUMN landlord_id UUID;
          END IF;
      END $$;
      `,
      
      // 2. Clean up any invalid landlord_id values (that don't have matching user IDs)
      `
      UPDATE properties 
      SET landlord_id = NULL 
      WHERE landlord_id IS NOT NULL 
      AND NOT EXISTS (SELECT 1 FROM users WHERE users.id = properties.landlord_id);
      `,
      
      // 3. Drop the existing foreign key constraint if it exists but is incorrectly defined
      `
      DO $$
      BEGIN
          IF EXISTS (
              SELECT 1 FROM information_schema.table_constraints
              WHERE constraint_schema = 'public'
              AND table_name = 'properties'
              AND constraint_name LIKE '%landlord%'
              AND constraint_type = 'FOREIGN KEY'
          ) THEN
              EXECUTE (
                  SELECT 'ALTER TABLE properties DROP CONSTRAINT ' || constraint_name
                  FROM information_schema.table_constraints
                  WHERE constraint_schema = 'public'
                  AND table_name = 'properties'
                  AND constraint_name LIKE '%landlord%'
                  AND constraint_type = 'FOREIGN KEY'
                  LIMIT 1
              );
          END IF;
      END $$;
      `,
      
      // 4. Add the foreign key constraint
      `
      ALTER TABLE properties
      ADD CONSTRAINT fk_properties_landlord
      FOREIGN KEY (landlord_id) REFERENCES users(id);
      `,
      
      // 5. Add an index on landlord_id for better performance
      `
      CREATE INDEX IF NOT EXISTS idx_properties_landlord_id ON properties(landlord_id);
      `,
      
      // 6. Add a comment to help PostgREST recognize the relationship
      `
      COMMENT ON CONSTRAINT fk_properties_landlord ON properties IS 'A property belongs to a landlord user';
      `
    ];
    
    // Execute each SQL command separately
    for (const sql of sqlCommands) {
      const { error } = await supabase.rpc('exec_sql', { sql });
      
      // If the RPC doesn't exist, we'll need to use a different approach
      if (error && error.message.includes('function "exec_sql" does not exist')) {
        console.log('The exec_sql RPC function does not exist.');
        console.log('Please run these SQL commands directly in the Supabase SQL editor:');
        console.log('-----------------------------------');
        console.log(sqlCommands.join('\n\n'));
        console.log('-----------------------------------');
        break;
      } else if (error) {
        console.error('Error executing SQL:', error);
        console.error('SQL command that failed:', sql);
      }
    }
    
    // Verify the relationship by testing a query
    const { data, error: queryError } = await supabase
      .from('properties')
      .select(`
        *,
        landlord:users!landlord_id(id, full_name, email)
      `)
      .limit(1);
    
    if (queryError) {
      console.error('Error testing the relationship after migration:', queryError);
      console.log('You may need to restart the Supabase instance or refresh the schema cache.');
    } else {
      console.log('Relationship verified successfully!');
      console.log('Sample query result:', data);
    }
    
  } catch (err) {
    console.error('Unexpected error during migration:', err);
  }
}

// Run the migration
applyMigration();
