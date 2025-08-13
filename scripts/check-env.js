#!/usr/bin/env node

/**
 * Environment Setup Check for Data Import
 * This script verifies that all required environment variables are set
 */

const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local if it exists
function loadEnvFile() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    const lines = envContent.split('\n');
    
    lines.forEach(line => {
      line = line.trim();
      if (line && !line.startsWith('#')) {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').replace(/^["']|["']$/g, ''); // Remove quotes
          process.env[key] = value;
        }
      }
    });
  }
}

async function checkEnvironment() {
  console.log('🔍 Checking environment setup for data import...\n');
  
  // Load .env.local first
  loadEnvFile();
  
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY'
  ];
  
  const missing = [];
  const present = [];
  
  requiredVars.forEach(varName => {
    if (process.env[varName]) {
      present.push(varName);
      console.log(`✅ ${varName}: ${process.env[varName].substring(0, 20)}...`);
    } else {
      missing.push(varName);
      console.log(`❌ ${varName}: Not set`);
    }
  });
  
  console.log('\n📋 Summary:');
  console.log(`✅ Present: ${present.length}/${requiredVars.length}`);
  console.log(`❌ Missing: ${missing.length}/${requiredVars.length}`);
  
  if (missing.length > 0) {
    console.log('\n🚨 Missing environment variables:');
    missing.forEach(varName => {
      console.log(`   - ${varName}`);
    });
    
    console.log('\n💡 To fix this:');
    console.log('1. Create a .env.local file in your project root');
    console.log('2. Add the missing variables:');
    missing.forEach(varName => {
      console.log(`   ${varName}=your_${varName.toLowerCase()}_here`);
    });
    console.log('3. Restart your development server');
    
    return false;
  }
  
  // Test Supabase connection (only if all environment variables are present)
  try {
    const { createClient } = require('@supabase/supabase-js');
    
    // Test public client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    console.log('\n🔌 Testing Supabase connection...');
    
    // Attempt a basic query
    const { error: publicError } = await supabase
      .from('properties')
      .select('id')
      .limit(1);

    if (publicError) {
      console.log('❌ Public client connection failed:', publicError.message);
      return false;
    }

    console.log('✅ Public client connection successful');

    // Test service role client
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const { error: adminError } = await supabaseAdmin
      .from('users')
      .select('id')
      .limit(1);

    if (adminError) {
      console.log('❌ Admin client connection failed:', adminError.message);
      return false;
    }

    console.log('✅ Admin client connection successful');
    
  } catch (error) {
    console.error('❌ Error testing Supabase connection:', error.message);
    return false;
  }

  // Check if CSV file exists (optional)
  const csvPath = path.join(process.cwd(), 'dataset', 'uk_housing_rentals.csv');
  if (fs.existsSync(csvPath)) {
    console.log('\n✅ CSV file found at dataset/uk_housing_rentals.csv');
  } else {
    console.log('\n⚠️ CSV file not found at dataset/uk_housing_rentals.csv (optional)');
  }
  
  console.log('\n🎉 Environment is fully configured and ready!');
  console.log('\nAvailable commands:');
  console.log('   npm run dev     - Start development server');
  console.log('   npm run build   - Build for production');
  console.log('   npm run import-data - Import sample data (if CSV exists)');
  
  return true;
}

if (require.main === module) {
  checkEnvironment()
    .then(isReady => process.exit(isReady ? 0 : 1))
    .catch(error => {
      console.error('Error:', error);
      process.exit(1);
    });
}

module.exports = { checkEnvironment };
