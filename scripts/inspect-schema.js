#!/usr/bin/env node

/**
 * Database Schema Inspector
 * This script checks the actual database schema to see what columns exist
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

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

// Load environment variables
loadEnvFile();

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectSchema() {
  try {
    console.log('🔍 Inspecting database schema...\n');
    
    // Check if properties table exists and what columns it has
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('❌ Error querying properties table:', error.message);
      console.log('\nTrying to get table info directly...\n');
      
      // Try to get schema info
      const { data: schemaData, error: schemaError } = await supabase.rpc('get_table_columns', {
        table_name: 'properties'
      });
      
      if (schemaError) {
        console.log('❌ Cannot get schema info:', schemaError.message);
      } else {
        console.log('📋 Schema info:', schemaData);
      }
      
      return;
    }
    
    if (data && data.length > 0) {
      console.log('✅ Properties table found with the following structure:');
      console.log('📋 Available columns:');
      
      const sampleProperty = data[0];
      const columns = Object.keys(sampleProperty).sort();
      
      columns.forEach((column, index) => {
        const value = sampleProperty[column];
        const type = typeof value;
        const sample = value !== null ? String(value).substring(0, 30) : 'null';
        console.log(`   ${index + 1}. ${column} (${type}): ${sample}${String(value).length > 30 ? '...' : ''}`);
      });
      
      console.log(`\n📊 Total columns: ${columns.length}`);
      
      // Check for specific columns we need
      const requiredColumns = [
        'address_line1', 'address_line2', 'city', 'postcode',
        'price_per_month', 'bedrooms', 'bathrooms', 'property_type',
        'furnishing_status', 'title', 'description', 'landlord_id'
      ];
      
      console.log('\n🔍 Checking required columns:');
      const missing = [];
      const present = [];
      
      requiredColumns.forEach(column => {
        if (columns.includes(column)) {
          present.push(column);
          console.log(`   ✅ ${column}`);
        } else {
          missing.push(column);
          console.log(`   ❌ ${column}`);
        }
      });
      
      console.log(`\n📊 Summary:`);
      console.log(`✅ Present: ${present.length}/${requiredColumns.length}`);
      console.log(`❌ Missing: ${missing.length}/${requiredColumns.length}`);
      
      if (missing.length > 0) {
        console.log('\n🚨 Missing columns for data import:');
        missing.forEach(column => {
          console.log(`   - ${column}`);
        });
        
        // Look for similar columns
        console.log('\n🔍 Looking for similar columns:');
        missing.forEach(missingCol => {
          const similar = columns.filter(col => 
            col.toLowerCase().includes(missingCol.toLowerCase().split('_')[0]) ||
            missingCol.toLowerCase().includes(col.toLowerCase().split('_')[0])
          );
          if (similar.length > 0) {
            console.log(`   ${missingCol} → might be: ${similar.join(', ')}`);
          }
        });
      } else {
        console.log('\n🎉 All required columns are present! Ready for data import.');
      }
      
    } else {
      console.log('⚠️ Properties table is empty');
    }
    
  } catch (error) {
    console.log('❌ Error inspecting schema:', error);
  }
}

if (require.main === module) {
  inspectSchema().then(() => {
    console.log('\n🏁 Schema inspection finished');
    process.exit(0);
  }).catch(error => {
    console.log('💥 Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { inspectSchema };
