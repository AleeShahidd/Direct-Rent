// Run the database fixes for the property API
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Path to the SQL migration file
const sqlFilePath = path.join(__dirname, '..', 'database', 'fix_property_api.sql');

console.log('Starting the database fix for Property API and relationships...');
console.log(`Using SQL file: ${sqlFilePath}`);

// Check if SQL file exists
if (!fs.existsSync(sqlFilePath)) {
  console.error(`SQL file not found: ${sqlFilePath}`);
  process.exit(1);
}

// Read the SQL file
const sqlCommands = fs.readFileSync(sqlFilePath, 'utf8');

console.log('SQL commands loaded. Please run these commands in your Supabase SQL editor.');
console.log('\n================ SQL COMMANDS ================\n');
console.log(sqlCommands);
console.log('\n=============================================\n');

console.log('Instructions:');
console.log('1. Go to your Supabase project dashboard');
console.log('2. Navigate to the SQL Editor');
console.log('3. Create a new query');
console.log('4. Paste the SQL commands shown above');
console.log('5. Run the commands');

console.log('\nAfter running the SQL commands, the following issues will be fixed:');
console.log('- Relationship between properties and users tables');
console.log('- Missing name/full_name fields in the users table');
console.log('- User preferences table for settings page');
