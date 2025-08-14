# Fixing User Registration Issues in Direct-Rent

This document outlines the steps to fix the user registration issues in the Direct-Rent application, specifically the "Database error saving new user" error.

## Understanding the Issue

The error occurs during the user registration process when Supabase Auth tries to create a new user. The specific error "Database error saving new user" with a 500 Internal Server Error indicates that while the authentication part may be working, there's an issue with saving the user's profile data in the `users` table.

The main causes are:

1. **Schema Mismatch**: The database schema and the data you're trying to insert don't match
2. **RLS (Row Level Security) Policies**: The policies may be preventing insertion of new records
3. **Auth Hooks**: The triggers or functions that synchronize auth.users with your public.users table may be failing

## Solution Steps

### 1. Update the Registration Code

The primary fix is to include user metadata directly in the `signUp` call rather than creating the user profile separately after the authentication step. This ensures that all user data is available to any database triggers that might run during the signup process.

The key change is in `handleRegister` function:

```javascript
// IMPORTANT: Include the user data directly in the signUp call
const { data: authData, error: authError } = await supabase.auth.signUp({
  email: formData.email,
  password: formData.password,
  options: {
    data: {
      full_name: formData.fullName,
      name: formData.fullName,
      first_name: formData.firstName,
      last_name: formData.lastName,
      phone: formattedPhone,
      role: formData.role,
      date_of_birth: formData.dateOfBirth
    }
  }
});
```

### 2. Fix the Database Schema and RLS Policies

The SQL migration script (`fix_registration_final.sql`) addresses several issues:

1. Recreates the users table with the correct schema
2. Creates a trigger to sync auth.users metadata with your public.users table
3. Simplifies RLS policies to allow user registration
4. Grants the necessary permissions

To apply these changes:

1. Go to the Supabase dashboard
2. Navigate to the SQL Editor
3. Copy the contents of `fix_registration_final.sql`
4. Paste and run the SQL in the editor

Alternatively, you can use the provided script:

```bash
node scripts/fix_user_registration.js
```

### 3. Update the Supabase Client Configuration

The updated Supabase client configuration adds important options that help with authentication:

```javascript
export const createBrowserSupabaseClient = () => 
  createBrowserClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      },
      db: {
        schema: 'public'
      },
      global: {
        fetch: fetch
      }
    }
  );
```

## Testing the Fix

After implementing these changes:

1. Try registering a new user
2. Check the browser console for any errors
3. Verify in Supabase dashboard that both the auth.users and public.users tables have the new user

## Common Issues and Troubleshooting

1. **"Column does not exist" errors**: Ensure your form data field names match exactly with the database column names
2. **Permission denied errors**: Check RLS policies and ensure they allow new user registration
3. **Constraint violation errors**: Make sure you're not violating any constraints like unique email

If problems persist, check:

1. The Supabase logs in the dashboard
2. The browser console for detailed error messages
3. The Network tab in browser developer tools to see the exact response from Supabase

## Further Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [RLS Policies Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Database Triggers in Supabase](https://supabase.com/docs/guides/database/triggers)
