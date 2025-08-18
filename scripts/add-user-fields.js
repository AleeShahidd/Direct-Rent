const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log('Missing Supabase credentials. Check your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function addUserFields() {
  console.log('Adding new fields to users table...');

  try {
    // Add new columns to users table
    const alterQueries = [
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name TEXT',
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name TEXT',
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS date_of_birth DATE',
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected'))",
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS account_status TEXT DEFAULT 'active' CHECK (account_status IN ('active', 'suspended', 'pending', 'deactivated'))",
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE',
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS registration_ip INET'
    ];

    for (const query of alterQueries) {
      console.log(`Executing: ${query}`);
      const { error } = await supabase.rpc('exec_sql', { query });
      
      if (error) {
        console.log(`Error executing query: ${query}`, error);
        continue;
      }
      console.log('✓ Query executed successfully');
    }

    // Update existing users with default values
    console.log('\nUpdating existing users with default values...');
    
    const { data: existingUsers, error: fetchError } = await supabase
      .from('users')
      .select('id, full_name')
      .is('first_name', null);

    if (fetchError) {
      console.log('Error fetching existing users:', fetchError);
      return;
    }

    console.log(`Found ${existingUsers.length} users to update`);

    for (const user of existingUsers) {
      const nameParts = user.full_name.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      const { error: updateError } = await supabase
        .from('users')
        .update({
          first_name: firstName,
          last_name: lastName,
          verification_status: 'pending',
          account_status: 'active'
        })
        .eq('id', user.id);

      if (updateError) {
        console.log(`Error updating user ${user.id}:`, updateError);
      } else {
        console.log(`✓ Updated user: ${user.full_name}`);
      }
    }

    console.log('\n✅ Successfully added user fields and updated existing data!');

  } catch (error) {
    console.log('❌ Error adding user fields:', error);
  }
}

// Alternative approach using raw SQL if RPC doesn't work
async function addUserFieldsRawSQL() {
  console.log('Adding new fields to users table using raw SQL...');

  const sqlCommands = [
    'ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name TEXT;',
    'ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name TEXT;',
    'ALTER TABLE users ADD COLUMN IF NOT EXISTS date_of_birth DATE;',
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'pending';`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS account_status TEXT DEFAULT 'active';`,
    'ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE;',
    'ALTER TABLE users ADD COLUMN IF NOT EXISTS registration_ip INET;'
  ];

  // Note: This would need to be run directly in the Supabase SQL editor
  console.log('Run these SQL commands in your Supabase SQL editor:');
  console.log('=====================================');
  sqlCommands.forEach(cmd => console.log(cmd));
  console.log('=====================================');
}

if (require.main === module) {
  addUserFields().catch(console.log);
  // If the above doesn't work, uncomment the line below:
  // addUserFieldsRawSQL();
}

module.exports = { addUserFields };
