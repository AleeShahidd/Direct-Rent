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

async function addSampleImages() {
  try {
    console.log('🖼️  Adding sample images to properties...\n');
    
    // Get some properties to add images to
    const { data: properties, error } = await supabase
      .from('properties')
      .select('id, property_type, title')
      .limit(20);
    
    if (error) {
      console.error('❌ Error fetching properties:', error.message);
      return;
    }

    if (!properties || properties.length === 0) {
      console.log('❌ No properties found');
      return;
    }

    console.log(`📊 Found ${properties.length} properties to update\n`);

    // Define image mappings
    const imageMapping = {
      'flat': ['/sample-flat-1.jpg', '/placeholder-property.jpg'],
      'house': ['/sample-house-1.jpg', '/placeholder-property.jpg'],
      'studio': ['/sample-studio-1.jpg', '/placeholder-property.jpg']
    };

    let updateCount = 0;

    // Update each property with appropriate images
    for (const property of properties) {
      const propertyType = property.property_type.toLowerCase();
      let images = [];

      // Assign images based on property type
      if (propertyType === 'flat') {
        images = imageMapping.flat;
      } else if (propertyType === 'house') {
        images = imageMapping.house;
      } else if (propertyType === 'studio') {
        images = imageMapping.studio;
      } else {
        // Default for other types
        images = ['/placeholder-property.jpg'];
      }

      // Update the property with images
      const { error: updateError } = await supabase
        .from('properties')
        .update({ 
          images: images 
        })
        .eq('id', property.id);

      if (updateError) {
        console.error(`❌ Error updating property ${property.id}:`, updateError.message);
      } else {
        console.log(`✅ Updated ${property.property_type}: ${property.title.substring(0, 50)}...`);
        updateCount++;
      }
    }

    console.log(`\n🎉 Successfully updated ${updateCount} properties with images!`);

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

addSampleImages().catch(console.error);
