const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const envLines = envContent.split('\n');
  
  envLines.forEach(line => {
    if (line.trim() && !line.startsWith('#')) {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        let value = valueParts.join('=').trim();
        if ((value.startsWith('"') && value.endsWith('"')) || 
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        process.env[key.trim()] = value;
      }
    }
  });
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkPropertyData() {
  try {
    console.log('🔍 Checking property data structure...\n');
    
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .limit(3);
    
    if (error) {
      console.error('❌ Error:', error.message);
      return;
    }

    if (data && data.length > 0) {
      console.log(`📊 Found ${data.length} properties\n`);
      
      data.forEach((property, index) => {
        console.log(`🏠 Property ${index + 1}:`);
        console.log(`   ID: ${property.id}`);
        console.log(`   Title: ${property.title}`);
        console.log(`   Rent Amount: £${property.rent_amount}`);
        console.log(`   Property Type: ${property.property_type}`);
        console.log(`   City: ${property.city}`);
        console.log(`   Address: ${property.address_line_1}`);
        console.log(`   Furnishing: ${property.furnishing_status}`);
        console.log(`   Bedrooms: ${property.bedrooms}`);
        console.log(`   Bathrooms: ${property.bathrooms}`);
        console.log(`   EPC Rating: ${property.epc_rating}`);
        console.log(`   Images field: ${property.images || 'null'}`);
        console.log('');
      });

      // Check all available fields in first property
      console.log('📋 Available fields in properties table:');
      const fields = Object.keys(data[0]);
      fields.forEach((field, index) => {
        console.log(`${index + 1}. ${field}: ${typeof data[0][field]} ${data[0][field] === null ? '(null)' : ''}`);
      });

    } else {
      console.log('📝 No properties found');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkPropertyData().catch(console.error);
