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

async function addImagesColumn() {
  try {
    console.log('🔧 Adding images column to properties table...\n');
    
    // Using SQL to add the column directly 
    const { error } = await supabase.rpc('exec_sql', {
      sql: `ALTER TABLE properties ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}';`
    });

    if (error) {
      // If RPC function doesn't exist, try another approach
      console.log('⚠️  RPC method failed, trying direct SQL execution...');
      
      // Let's try using a manual SQL approach via a temporary function
      const { error: sqlError } = await supabase
        .from('properties')
        .select('images')
        .limit(1);
      
      if (sqlError && sqlError.message.includes('column "images" does not exist')) {
        console.log('❌ Images column does not exist and cannot be added via Supabase client');
        console.log('💡 Manual database schema update required');
        console.log('\n📋 SQL to run manually in Supabase dashboard:');
        console.log('ALTER TABLE properties ADD COLUMN images TEXT[] DEFAULT \'{}\';');
        return;
      }
    }

    console.log('✅ Images column check completed');
    
    // Test if we can now query the images column
    const { data, error: testError } = await supabase
      .from('properties')
      .select('images')
      .limit(1);
    
    if (testError) {
      console.error('❌ Still cannot access images column:', testError.message);
    } else {
      console.log('✅ Images column is now accessible');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    console.log('\n💡 Please add the images column manually in Supabase dashboard:');
    console.log('ALTER TABLE properties ADD COLUMN images TEXT[] DEFAULT \'{}\';');
  }
}

addImagesColumn().catch(console.error);
