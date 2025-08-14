// Simple Auth Test Script for Direct-Rent
// This script tests basic authentication functionality

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Error: Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testSignUp() {
  console.log('Testing sign up...');
  
  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = 'Password123!';
  
  try {
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          full_name: 'Test User',
          first_name: 'Test',
          last_name: 'User',
          role: 'tenant'
        }
      }
    });
    
    if (error) {
      console.error('Sign up error:', error);
      return false;
    }
    
    console.log('Sign up successful!');
    console.log('User ID:', data.user?.id);
    return true;
  } catch (error) {
    console.error('Unexpected error during sign up:', error);
    return false;
  }
}

async function testSignIn() {
  console.log('Testing sign in...');
  
  // We'll use a known user for sign in test
  const email = 'test@example.com';
  const password = 'password123';
  
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) {
      console.error('Sign in error:', error);
      console.log('Please update the test email/password with valid credentials');
      return false;
    }
    
    console.log('Sign in successful!');
    console.log('User ID:', data.user?.id);
    
    // Sign out
    await supabase.auth.signOut();
    console.log('Sign out successful');
    
    return true;
  } catch (error) {
    console.error('Unexpected error during sign in:', error);
    return false;
  }
}

async function main() {
  console.log('Starting Direct-Rent auth tests...');
  
  const signUpResult = await testSignUp();
  console.log('Sign up test:', signUpResult ? 'PASSED' : 'FAILED');
  
  const signInResult = await testSignIn();
  console.log('Sign in test:', signInResult ? 'PASSED' : 'FAILED');
  
  console.log('Auth tests completed');
  
  if (!signUpResult || !signInResult) {
    console.log('Some tests failed. Please check the error messages above.');
    process.exit(1);
  }
  
  console.log('All tests passed!');
}

main().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});
