#!/usr/bin/env node

/**
 * Test Property Insert
 * This script tries to insert a single test property to check the schema
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

// Sample landlord ID
const SAMPLE_LANDLORD_ID = '550e8400-e29b-41d4-a716-446655440001';

async function testInsert() {
  try {
    console.log('🧪 Testing property insert...\n');
    
    // First, let's check if the landlord exists
    const { data: landlord, error: landlordError } = await supabase
      .from('users')
      .select('id, full_name, role')
      .eq('id', SAMPLE_LANDLORD_ID)
      .single();
    
    if (landlordError) {
      console.log('⚠️ Landlord check failed:', landlordError.message);
      console.log('Creating a test landlord...\n');
      
      const { data: newLandlord, error: createError } = await supabase
        .from('users')
        .insert({
          id: SAMPLE_LANDLORD_ID,
          full_name: 'Test Landlord',
          email: 'test.landlord@example.com',
          role: 'landlord',
          email_verified: true
        })
        .select()
        .single();
      
      if (createError) {
        console.log('❌ Failed to create test landlord:', createError.message);
        return;
      }
      
      console.log('✅ Created test landlord:', newLandlord.full_name);
    } else {
      console.log('✅ Found landlord:', landlord.full_name, '(' + landlord.role + ')');
    }
    
    console.log('\n🏠 Attempting to insert test property...\n');
    
    // Try different variations of property data to see what works
    const testProperties = [
      // Test 1: Using schema.sql field names
      {
        test: "Schema.sql field names",
        data: {
          title: 'Test Property 1',
          description: 'A test property for schema validation',
          price_per_month: 1000,
          deposit_amount: 1500,
          postcode: 'SW1A 1AA',
          address_line1: '123 Test Street',
          address_line2: '',
          city: 'London',
          country: 'United Kingdom',
          council_tax_band: 'D',
          epc_rating: 'C',
          furnishing_status: 'Furnished',
          bedrooms: 2,
          bathrooms: 1,
          property_type: 'Flat',
          available_from: '2024-02-01',
          minimum_tenancy_months: 6,
          parking: false,
          garden: false,
          balcony: false,
          pets_allowed: false,
          smoking_allowed: false,
          landlord_id: SAMPLE_LANDLORD_ID,
          is_verified: true,
          is_active: true,
          fraud_score: 0.1,
          is_flagged: false,
          images: []
        }
      },
      // Test 2: Using actual API field names from route.ts
      {
        test: "Actual API field names",
        data: {
          title: 'Test Property 2',
          description: 'A test property for actual schema validation',
          rent_amount: 1000,
          deposit_amount: 1500,
          postcode: 'SW1A 1AA',
          address_line_1: '123 Test Street',
          address_line_2: '',
          city: 'London',
          county: 'Greater London',
          council_tax_band: 'D',
          epc_rating: 'C',
          furnishing_status: 'furnished', // Try lowercase
          bedrooms: 2,
          bathrooms: 1,
          property_type: 'flat', // Try lowercase
          available_from: '2024-02-01',
          minimum_tenancy_months: 6,
          parking_spaces: 0,
          has_garden: false,
          has_balcony: false,
          pets_allowed: false,
          smoking_allowed: false,
          couples_allowed: true,
          students_allowed: true,
          dss_accepted: false,
          professionals_only: false,
          bills_included: false,
          council_tax_included: false,
          service_charges: 100,
          landlord_id: SAMPLE_LANDLORD_ID,
          status: 'active',
          verification_status: 'verified'
        }
      },
      // Test 3: Try different property and furnishing values
      {
        test: "Different enum values",
        data: {
          title: 'Test Property 3',
          description: 'A test property with different enum values',
          rent_amount: 1000,
          deposit_amount: 1500,
          postcode: 'SW1A 1AA',
          address_line_1: '123 Test Street',
          address_line_2: '',
          city: 'London',
          county: 'Greater London',
          council_tax_band: 'D',
          epc_rating: 'C',
          furnishing_status: 'unfurnished',
          bedrooms: 2,
          bathrooms: 1,
          property_type: 'house',
          available_from: '2024-02-01',
          minimum_tenancy_months: 6,
          parking_spaces: 0,
          has_garden: false,
          has_balcony: false,
          pets_allowed: false,
          smoking_allowed: false,
          couples_allowed: true,
          students_allowed: true,
          dss_accepted: false,
          professionals_only: false,
          bills_included: false,
          council_tax_included: false,
          service_charges: 100,
          landlord_id: SAMPLE_LANDLORD_ID,
          status: 'active',
          verification_status: 'verified'
        }
      }
    ];
    
    for (const testCase of testProperties) {
      console.log(`🧪 Testing: ${testCase.test}`);
      
      const { data, error } = await supabase
        .from('properties')
        .insert(testCase.data)
        .select()
        .single();
      
      if (error) {
        console.log(`❌ Failed: ${error.message}`);
        if (error.details) {
          console.log(`   Details: ${error.details}`);
        }
        if (error.hint) {
          console.log(`   Hint: ${error.hint}`);
        }
        console.log('');
      } else {
        console.log(`✅ Success! Inserted property:`, data.title);
        console.log(`   ID: ${data.id}`);
        console.log('');
        
        // Clean up - delete the test property
        await supabase.from('properties').delete().eq('id', data.id);
        console.log('🧹 Cleaned up test property\n');
        break;
      }
    }
    
  } catch (error) {
    console.log('💥 Unexpected error:', error);
  }
}

if (require.main === module) {
  testInsert().then(() => {
    console.log('🏁 Test insert finished');
    process.exit(0);
  }).catch(error => {
    console.log('💥 Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { testInsert };
