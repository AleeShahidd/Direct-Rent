# Fix Properties-Landlord Relationship

This document explains how to fix the foreign key relationship issue between the `properties` and `users` tables, which is causing the error:

```
Properties query error: {
  code: 'PGRST200',
  details: "Searched for a foreign key relationship between 'properties' and 'users' using the hint 'landlord_id' in the schema 'public', but no matches were found.",
  hint: null,
  message: "Could not find a relationship between 'properties' and 'users' in the schema cache"
}
```

## Problem

The API is trying to use a foreign key relationship between `properties.landlord_id` and `users.id` to join the tables, but this relationship is either missing or not properly defined in the database schema.

## Solution

### How to Fix (Using Supabase SQL Editor)

1. **Log in to your Supabase Dashboard**
   - Go to https://app.supabase.com/ and select your project

2. **Open the SQL Editor**
   - In the left sidebar, click on "SQL Editor"
   - Create a new query or use an existing one

3. **Run the following SQL commands**
   - Copy and paste the entire SQL block below
   - Execute the query

```sql
-- Fix Properties-Landlord Relationship
-- This will fix the foreign key relationship between properties and users tables

-- 1. Check if landlord_id column exists, add it if it doesn't
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'properties' 
        AND column_name = 'landlord_id'
    ) THEN
        ALTER TABLE properties ADD COLUMN landlord_id UUID;
    END IF;
END $$;

-- 2. Clean up any invalid landlord_id values (that don't have matching user IDs)
UPDATE properties 
SET landlord_id = NULL 
WHERE landlord_id IS NOT NULL 
AND NOT EXISTS (SELECT 1 FROM users WHERE users.id = properties.landlord_id);

-- 3. Drop the existing foreign key constraint if it exists but is incorrectly defined
DO $$
DECLARE
    constraint_name text;
BEGIN
    SELECT tc.constraint_name INTO constraint_name
    FROM information_schema.table_constraints tc
    WHERE tc.constraint_schema = 'public'
    AND tc.table_name = 'properties'
    AND tc.constraint_name LIKE '%landlord%'
    AND tc.constraint_type = 'FOREIGN KEY'
    LIMIT 1;
    
    IF FOUND THEN
        EXECUTE 'ALTER TABLE properties DROP CONSTRAINT ' || constraint_name;
        RAISE NOTICE 'Dropped constraint: %', constraint_name;
    END IF;
END $$;

-- 4. Add the foreign key constraint
ALTER TABLE properties
ADD CONSTRAINT fk_properties_landlord
FOREIGN KEY (landlord_id) REFERENCES users(id);

-- 5. Add an index on landlord_id for better performance
CREATE INDEX IF NOT EXISTS idx_properties_landlord_id ON properties(landlord_id);

-- 6. Add a comment to help PostgREST recognize the relationship
COMMENT ON CONSTRAINT fk_properties_landlord ON properties IS 'A property belongs to a landlord user';

-- 7. Verify the fix worked
SELECT EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_schema = 'public'
    AND table_name = 'properties'
    AND constraint_name = 'fk_properties_landlord'
    AND constraint_type = 'FOREIGN KEY'
) AS foreign_key_exists;
```

4. **Restart the Supabase PostgREST Instance**
   - Go to the "Database" section in your Supabase dashboard
   - Click on "Settings" and then "Restart PostgREST"
   - This is important to refresh the schema cache for PostgREST

## Verification

After applying the fix and restarting PostgREST, test that the relationship works by running:

```sql
-- Test the relationship works
SELECT p.id, p.title, u.full_name as landlord_name 
FROM properties p
JOIN users u ON p.landlord_id = u.id
LIMIT 5;
```

You should also test that the API endpoint works correctly:
```
GET /api/properties?limit=6&sort_by=newest
```

## Explanation

The fix adds or corrects the foreign key constraint between `properties.landlord_id` and `users.id`, which:

1. Ensures data integrity (properties can only reference valid users)
2. Allows PostgREST (used by Supabase) to recognize the relationship for API joins
3. Enables efficient querying between the tables

After applying this fix and restarting the PostgREST service, your API should be able to successfully join properties with their landlord information.

## Troubleshooting

If you still encounter the error after running the SQL and restarting PostgREST:

1. **Check the Constraint Exists**:
   ```sql
   SELECT * FROM information_schema.table_constraints 
   WHERE constraint_schema = 'public'
   AND table_name = 'properties'
   AND constraint_type = 'FOREIGN KEY';
   ```

2. **Refresh Database Cache**:
   - Try restarting all Supabase services from the dashboard

3. **Check API Code**:
   - Ensure the join syntax in your API code matches the column names exactly
   - The API should use `landlord:users!landlord_id(...)` format for the join
