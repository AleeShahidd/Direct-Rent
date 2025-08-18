const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('Supabase URL:', supabaseUrl ? 'Set' : 'Not set')
console.log('Supabase Key:', supabaseKey ? 'Set' : 'Not set')

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkSchema() {
  try {
    console.log('Checking database schema...')
    
    // Check users table structure
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(1)
    
    if (usersError) {
      console.log('Users table error:', usersError)
    } else if (users && users.length > 0) {
      console.log('Users table columns:', Object.keys(users[0]))
    } else {
      console.log('Users table is empty')
    }
    
    // Check properties table structure
    const { data: properties, error: propertiesError } = await supabase
      .from('properties')
      .select('*')
      .limit(1)
    
    if (propertiesError) {
      console.log('Properties table error:', propertiesError)
    } else if (properties && properties.length > 0) {
      console.log('Properties table columns:', Object.keys(properties[0]))
    } else {
      console.log('Properties table is empty')
    }
    
  } catch (error) {
    console.log('Error:', error)
  }
}

checkSchema()
