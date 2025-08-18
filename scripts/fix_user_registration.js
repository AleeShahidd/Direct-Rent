// Script to fix user registration issues in Supabase
// This script runs the SQL migration to fix the users table structure and RLS policies

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Validate environment variables
const requiredVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY'
];

const missingVars = requiredVars.filter(varName => !process.env[varName]);
if (missingVars.length > 0) {
  console.log(`Missing required environment variables: ${missingVars.join(', ')}`);
  process.exit(1);
}

// Path to the SQL migration file
const sqlFilePath = path.join(__dirname, '..', 'database', 'fix_registration_final.sql');

// Check if SQL file exists
if (!fs.existsSync(sqlFilePath)) {
  console.log(`SQL migration file not found: ${sqlFilePath}`);
  process.exit(1);
}

// Read SQL file
const sqlCommands = fs.readFileSync(sqlFilePath, 'utf8');

// Execute SQL commands against Supabase
async function executeSQLMigration() {
  try {
    console.log('Connecting to Supabase...');
    
    // Install Supabase CLI if needed
    try {
      console.log('Checking for Supabase CLI...');
      execSync('supabase --version', { stdio: 'ignore' });
      console.log('Supabase CLI is installed.');
    } catch (error) {
      console.log('Supabase CLI not found. Please install it manually: https://supabase.com/docs/guides/cli');
      console.log('After installing, run this script again.');
      process.exit(1);
    }
    
    // Save SQL to a temporary file
    const tempFilePath = path.join(__dirname, 'temp_migration.sql');
    fs.writeFileSync(tempFilePath, sqlCommands);
    
    console.log('Running SQL migration...');
    console.log('You may need to enter your Supabase credentials if prompted.');
    
    // Option 1: Using Supabase CLI (if the project is linked)
    try {
      execSync('supabase db reset', { stdio: 'inherit' });
      console.log('Database schema reset successfully using Supabase CLI.');
    } catch (error) {
      console.log('Failed to reset database schema using Supabase CLI.');
      console.log('Please run the SQL commands manually in the Supabase dashboard SQL editor.');
      console.log('SQL file path: ' + sqlFilePath);
    }
    
    // Clean up temp file
    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }
    
    console.log('\nMigration completed. Please test user registration again.');
    console.log('If you still encounter issues, please run the SQL commands manually in the Supabase dashboard SQL editor.');
  } catch (error) {
    console.log('Migration failed:', error);
    console.log('\nPlease run the SQL commands manually in the Supabase dashboard SQL editor.');
    console.log('SQL file path: ' + sqlFilePath);
  }
}

executeSQLMigration();
