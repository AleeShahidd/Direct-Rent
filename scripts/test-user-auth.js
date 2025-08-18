const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log('Missing Supabase credentials. Check your .env.local file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testUserTable() {
  console.log('Testing users table structure...');

  try {
    // Test selecting from users table with new fields
    const { data, error } = await supabase
      .from('users')
      .select(`
        id,
        full_name,
        first_name,
        last_name,
        email,
        phone,
        role,
        avatar_url,
        email_verified,
        phone_verified,
        date_of_birth,
        verification_status,
        account_status,
        last_login,
        registration_ip,
        created_at,
        updated_at
      `)
      .limit(1);

    if (error) {
      console.log('❌ Error querying users table:', error.message);
      
      // Check if specific columns are missing
      if (error.message.includes('column')) {
        console.log('\n📝 Missing columns detected. Please run the migration:');
        console.log('1. Go to Supabase SQL Editor');
        console.log('2. Run: database/create_migrations_table.sql');
        console.log('3. Run: database/migration_add_user_fields.sql');
      }
      return;
    }

    console.log('✅ Users table structure is correct!');
    
    if (data && data.length > 0) {
      console.log('\n📊 Sample user data:');
      const user = data[0];
      console.log(`- ID: ${user.id}`);
      console.log(`- Name: ${user.first_name} ${user.last_name} (${user.full_name})`);
      console.log(`- Email: ${user.email}`);
      console.log(`- Role: ${user.role}`);
      console.log(`- Verification Status: ${user.verification_status}`);
      console.log(`- Account Status: ${user.account_status}`);
      console.log(`- Last Login: ${user.last_login || 'Never'}`);
      console.log(`- Registration IP: ${user.registration_ip || 'Not recorded'}`);
    } else {
      console.log('\n📊 No users found in database');
    }

    // Test auth user creation
    console.log('\n🔐 Testing auth integration...');
    const { data: authData } = await supabase.auth.getUser();
    if (authData.user) {
      console.log('✅ Auth user detected');
      
      const { data: userProfile } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .single();
        
      if (userProfile) {
        console.log('✅ User profile found in database');
      } else {
        console.log('⚠️  Auth user exists but no profile in users table');
      }
    } else {
      console.log('ℹ️  No authenticated user (this is normal for test script)');
    }

  } catch (error) {
    console.log('❌ Unexpected error:', error);
  }
}

async function testGoogleOAuth() {
  console.log('\n🔍 Testing Google OAuth flow...');
  
  // This would normally be called from the callback route
  console.log('Google OAuth test would need to be done manually by:');
  console.log('1. Going to /auth/register');
  console.log('2. Clicking "Sign up with Google"');
  console.log('3. Completing OAuth flow');
  console.log('4. Checking if user data is saved in users table');
}

if (require.main === module) {
  testUserTable()
    .then(() => testGoogleOAuth())
    .catch(console.log);
}

module.exports = { testUserTable };
