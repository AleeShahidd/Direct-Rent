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
        // Remove surrounding quotes if present
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

async function checkUsers() {
  try {
    console.log('🔍 Checking users table...\n');
    
    const { data, error, count } = await supabase
      .from('users')
      .select('id, email, full_name, role', { count: 'exact' });
    
    if (error) {
      console.error('❌ Error fetching users:', error.message);
      return;
    }

    console.log(`📊 Total users: ${count}`);
    
    if (data && data.length > 0) {
      console.log('\n👥 Users in database:');
      data.forEach((user, index) => {
        console.log(`${index + 1}. ID: ${user.id}`);
        console.log(`   Email: ${user.email || 'N/A'}`);
        console.log(`   Name: ${user.full_name || 'N/A'}`);
        console.log(`   Role: ${user.role || 'N/A'}`);
        console.log('');
      });
    } else {
      console.log('\n📝 No users found in database');
    }

    // Check for duplicate emails
    if (data && data.length > 0) {
      const emailCounts = {};
      data.forEach(user => {
        if (user.email) {
          emailCounts[user.email] = (emailCounts[user.email] || 0) + 1;
        }
      });

      const duplicates = Object.entries(emailCounts).filter(([email, count]) => count > 1);
      if (duplicates.length > 0) {
        console.log('⚠️  Duplicate emails found:');
        duplicates.forEach(([email, count]) => {
          console.log(`   ${email}: ${count} users`);
        });
      } else {
        console.log('✅ No duplicate emails found');
      }
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkUsers().catch(console.error);
