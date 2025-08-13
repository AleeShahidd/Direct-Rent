#!/usr/bin/env node

/**
 * Import UK Housing Rental Data from CSV
 * This script processes the CSV data and inserts it into the properties table
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
  console.error('Missing Supabase credentials');
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Sample landlord ID - this should exist in your database
const SAMPLE_LANDLORD_ID = '550e8400-e29b-41d4-a716-446655440001';

function parsePrice(priceString) {
  if (!priceString) return null;
  
  // Remove currency symbols, commas, and whitespace
  const cleanPrice = priceString.replace(/[£,\s]/g, '');
  const price = parseFloat(cleanPrice);
  
  // Handle invalid prices
  if (isNaN(price) || price <= 0) return null;
  
  return price;
}

function parseLocation(locationString) {
  if (!locationString) return { city: 'Unknown', county: 'Unknown' };
  
  // Clean up the location string
  const cleaned = locationString.trim();
  
  // Split by comma and get the last part as the main location
  const parts = cleaned.split(',').map(part => part.trim());
  
  if (parts.length >= 2) {
    const city = parts[0];
    const county = parts[parts.length - 1];
    return { city, county };
  }
  
  return { city: cleaned, county: 'Unknown' };
}

function parseRooms(roomString) {
  if (!roomString) return { bedrooms: 1, bathrooms: 1 };
  
  // Extract number of bedrooms
  const bedroomMatch = roomString.match(/(\d+)\s*bedroom/i);
  const bedrooms = bedroomMatch ? parseInt(bedroomMatch[1]) : 1;
  
  // Estimate bathrooms (typically 1 for 1-2 beds, 2 for 3+ beds)
  const bathrooms = bedrooms <= 2 ? 1 : 2;
  
  return { bedrooms, bathrooms };
}

function determinePropertyType(description, rooms) {
  const desc = description.toLowerCase();
  
  if (desc.includes('flat') || desc.includes('apartment')) return 'flat';
  if (desc.includes('house') || desc.includes('terraced') || desc.includes('detached') || desc.includes('semi')) return 'house';
  if (desc.includes('studio')) return 'studio';
  if (desc.includes('bungalow')) return 'bungalow';
  if (desc.includes('maisonette')) return 'maisonette';
  
  // Default based on bedrooms
  return rooms.bedrooms === 1 ? 'flat' : 'house';
}

function generatePostcode(city, county) {
  // Generate realistic UK postcodes based on location
  const postcodes = {
    'London': ['SW1A 1AA', 'W1A 0AX', 'EC1A 1BB', 'N1 9GU', 'SE1 9RT', 'E1 6AN', 'NW1 2DB', 'SW7 2AZ'],
    'Birmingham': ['B1 1AA', 'B2 4QA', 'B3 1JJ', 'B15 2TT', 'B21 9LB'],
    'Manchester': ['M1 1AA', 'M2 3WQ', 'M3 4LZ', 'M15 6BH', 'M20 2LN'],
    'Liverpool': ['L1 1AA', 'L2 2DZ', 'L3 9AG', 'L7 8XY', 'L15 4LP'],
    'Leeds': ['LS1 1AA', 'LS2 9JT', 'LS6 1AN', 'LS11 5DF'],
    'Glasgow': ['G1 1AA', 'G2 3BZ', 'G12 8QQ', 'G31 4EB'],
    'Edinburgh': ['EH1 1AA', 'EH3 6SS', 'EH8 9YL', 'EH16 5PB'],
    'Bristol': ['BS1 1AA', 'BS2 0QQ', 'BS8 1LN', 'BS16 3JP'],
    'Sheffield': ['S1 1AA', 'S2 4HG', 'S6 2BR', 'S11 8NT'],
    'Newcastle': ['NE1 1AA', 'NE2 1AB', 'NE6 5SS', 'NE15 8NY']
  };
  
  const cityPostcodes = postcodes[city] || postcodes['London'];
  return cityPostcodes[Math.floor(Math.random() * cityPostcodes.length)];
}

function generateFeatures() {
  const furnishingOptions = ['furnished', 'unfurnished', 'part_furnished'];
  const propertyTypeMap = {
    'Flat': 'flat',
    'House': 'house', 
    'Studio': 'studio',
    'Bungalow': 'bungalow',
    'Maisonette': 'maisonette'
  };
  
  return {
    parking: Math.random() > 0.6,
    garden: Math.random() > 0.7,
    balcony: Math.random() > 0.8,
    pets_allowed: Math.random() > 0.7,
    smoking_allowed: Math.random() > 0.9,
    furnishing_status: furnishingOptions[Math.floor(Math.random() * furnishingOptions.length)],
    council_tax_band: ['A', 'B', 'C', 'D', 'E', 'F', 'G'][Math.floor(Math.random() * 7)],
    epc_rating: ['A', 'B', 'C', 'D', 'E', 'F', 'G'][Math.floor(Math.random() * 7)]
  };
}

async function processCSVData() {
  try {
    console.log('🚀 Starting CSV data import...');
    
    // Read CSV file
    const csvPath = path.join(process.cwd(), 'dataset', 'uk_housing_rentals.csv');
    
    if (!fs.existsSync(csvPath)) {
      console.error('❌ CSV file not found:', csvPath);
      return;
    }
    
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const lines = csvContent.split('\n');
    
    console.log(`📊 Found ${lines.length - 1} records in CSV`);
    
    // Process each row
    const properties = [];
    const processedRecords = new Set(); // To avoid duplicates
    
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      
      try {
        // Parse CSV row (handle commas in quoted fields)
        const row = [];
        let current = '';
        let inQuotes = false;
        
        for (let j = 0; j < lines[i].length; j++) {
          const char = lines[i][j];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            row.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        row.push(current.trim());
        
        if (row.length < 4) continue;
        
        const description = row[1]?.replace(/"/g, '').trim();
        const location = row[2]?.replace(/"/g, '').trim();
        const rooms = row[3]?.replace(/"/g, '').trim();
        const price = row[4]?.replace(/"/g, '').trim();
        
        if (!description || !location || !rooms || !price) continue;
        
        // Create a unique key to avoid duplicates
        const uniqueKey = `${description}-${location}-${rooms}-${price}`;
        if (processedRecords.has(uniqueKey)) continue;
        processedRecords.add(uniqueKey);
        
        // Parse the data
        const parsedPrice = parsePrice(price);
        if (!parsedPrice || parsedPrice < 100 || parsedPrice > 50000) continue; // Filter invalid prices
        
        const { city, county } = parseLocation(location);
        const roomInfo = parseRooms(rooms);
        const propertyType = determinePropertyType(description, roomInfo);
        const features = generateFeatures();
        const postcode = generatePostcode(city, county);
        
        // Extract address from description
        const addressMatch = description.match(/(.+?),/);
        const address1 = addressMatch ? addressMatch[1].trim() : `Property in ${city}`;
        
        const property = {
          title: description.length > 100 ? description.substring(0, 97) + '...' : description,
          description: `${description}\n\nThis property is located in ${city}, ${county} and offers excellent value for money. The property features ${roomInfo.bedrooms} bedroom${roomInfo.bedrooms > 1 ? 's' : ''} and ${roomInfo.bathrooms} bathroom${roomInfo.bathrooms > 1 ? 's' : ''}.`,
          rent_amount: parsedPrice,
          deposit_amount: Math.round(parsedPrice * 1.5), // 1.5x monthly rent
          postcode: postcode,
          address_line_1: address1,
          address_line_2: '',
          city: city,
          county: county,
          council_tax_band: features.council_tax_band,
          epc_rating: features.epc_rating,
          furnishing_status: features.furnishing_status,
          bedrooms: roomInfo.bedrooms,
          bathrooms: roomInfo.bathrooms,
          property_type: propertyType,
          available_from: new Date(Date.now() + Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Random date within 90 days
          minimum_tenancy_months: 6 + Math.floor(Math.random() * 6), // 6-12 months
          parking_spaces: features.parking ? 1 : 0,
          has_garden: features.garden,
          has_balcony: features.balcony,
          pets_allowed: features.pets_allowed,
          smoking_allowed: features.smoking_allowed,
          couples_allowed: true,
          students_allowed: Math.random() > 0.5,
          dss_accepted: Math.random() > 0.7,
          professionals_only: Math.random() > 0.8,
          bills_included: Math.random() > 0.6,
          council_tax_included: Math.random() > 0.7,
          service_charges: Math.round(parsedPrice * 0.1), // 10% of rent
          landlord_id: SAMPLE_LANDLORD_ID,
          status: 'active',
          verification_status: Math.random() > 0.3 ? 'verified' : 'pending' // 70% verified
        };
        
        properties.push(property);
        
        if (properties.length >= 100) break; // Limit to 100 properties for demo
        
      } catch (rowError) {
        console.warn(`⚠️ Error processing row ${i}:`, rowError.message);
        continue;
      }
    }
    
    console.log(`✅ Processed ${properties.length} valid properties`);
    
    if (properties.length === 0) {
      console.log('❌ No valid properties to insert');
      return;
    }
    
    // Insert properties in batches
    const batchSize = 5;
    let insertedCount = 0;
    
    for (let i = 0; i < properties.length; i += batchSize) {
      const batch = properties.slice(i, i + batchSize);
      
      console.log(`📝 Inserting batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(properties.length / batchSize)} (${batch.length} properties)...`);
      
      const { data, error } = await supabase
        .from('properties')
        .insert(batch)
        .select('id, title');
      
      if (error) {
        console.error('❌ Error inserting batch:', error.message);
        console.error('Error details:', error);
        continue;
      }
      
      insertedCount += batch.length;
      console.log(`✅ Successfully inserted ${batch.length} properties`);
      
      // Small delay between batches
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log(`🎉 Import completed! Inserted ${insertedCount} properties out of ${properties.length} processed.`);
    
    // Display summary
    const summary = properties.reduce((acc, prop) => {
      acc.totalValue += prop.rent_amount;
      acc.cities.add(prop.city);
      acc.propertyTypes.add(prop.property_type);
      return acc;
    }, { 
      totalValue: 0, 
      cities: new Set(), 
      propertyTypes: new Set() 
    });
    
    console.log('\n📊 Import Summary:');
    console.log(`💰 Average rent: £${Math.round(summary.totalValue / properties.length)}/month`);
    console.log(`🏙️ Cities: ${Array.from(summary.cities).join(', ')}`);
    console.log(`🏠 Property types: ${Array.from(summary.propertyTypes).join(', ')}`);
    
  } catch (error) {
    console.error('❌ Error processing CSV data:', error);
  }
}

// Run the import
if (require.main === module) {
  processCSVData().then(() => {
    console.log('🏁 Import process finished');
    process.exit(0);
  }).catch(error => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { processCSVData };
