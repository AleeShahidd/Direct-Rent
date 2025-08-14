// Test script to verify user auth and registration
require('dotenv').config({path:'.env.local'});
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables. Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
  process.exit(1);
}

// Create Supabase admin client
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

async function testUserSystem() {
  console.log('🔍 Testing user auth system...');
  
  // Test email - use a unique email for testing
  const testEmail = `test-user-${Date.now()}@example.com`;
  const testPassword = 'Test123456!';
  
  try {
    // 1. Create a test user
    console.log(`Creating test user: ${testEmail}`);
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true,
      user_metadata: {
        full_name: 'Test User',
        first_name: 'Test',
        last_name: 'User',
        role: 'tenant'
      }
    });
    
    if (authError) {
      console.error('❌ Failed to create test user:', authError);
      return false;
    }
    
    console.log('✅ Auth user created successfully', authData.user.id);
    
    // 2. Check if user record was created in the users table
    console.log('Checking if user profile was created automatically...');
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .maybeSingle();
    
    if (profileError) {
      console.error('❌ Error checking user profile:', profileError);
    }
    
    if (!userProfile) {
      console.log('⚠️ User profile not found. Creating manually...');
      
      // Create user profile manually
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: testEmail,
          name: 'Test User',
          first_name: 'Test',
          last_name: 'User',
          role: 'tenant',
          email_verified: true,
          verification_status: 'pending',
          account_status: 'active',
          last_login: new Date().toISOString()
        });
      
      if (insertError) {
        console.error('❌ Failed to create user profile:', insertError);
        return false;
      }
      
      console.log('✅ User profile created manually');
    } else {
      console.log('✅ User profile exists:', userProfile);
    }
    
    // 3. Test user sign-in
    console.log('Testing user sign-in...');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });
    
    if (signInError) {
      console.error('❌ User sign-in failed:', signInError);
      return false;
    }
    
    console.log('✅ User sign-in successful');
    
    // 4. Clean up the test user
    console.log('Cleaning up test user...');
    const { error: deleteError } = await supabase.auth.admin.deleteUser(authData.user.id);
    
    if (deleteError) {
      console.error('⚠️ Failed to delete test user:', deleteError);
    } else {
      console.log('✅ Test user deleted successfully');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Unexpected error during user testing:', error);
    return false;
  }
}

async function main() {
  console.log('🧪 Starting user auth system test...');
  
  const success = await testUserSystem();
  
  if (success) {
    console.log('🎉 User auth system is working correctly!');
  } else {
    console.error('❌ User auth system test failed');
    process.exit(1);
  }
}

main();
