-- Fix the properties API relationships error by updating the users table with correct fields

-- Check if the users table has 'name' or 'full_name' field
DO $$
DECLARE 
    has_name BOOLEAN;
    has_full_name BOOLEAN;
BEGIN
    -- Check if 'name' column exists
    SELECT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'name'
    ) INTO has_name;
    
    -- Check if 'full_name' column exists
    SELECT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'full_name'
    ) INTO has_full_name;
    
    -- If neither column exists, add the 'name' column (should never happen)
    IF NOT has_name AND NOT has_full_name THEN
        ALTER TABLE users ADD COLUMN name TEXT;
        RAISE NOTICE 'Added name column to users table';
    END IF;
    
    -- If only full_name exists, add name column and copy data
    IF NOT has_name AND has_full_name THEN
        ALTER TABLE users ADD COLUMN name TEXT;
        UPDATE users SET name = full_name;
        RAISE NOTICE 'Added name column and copied data from full_name';
    END IF;
    
    -- If only name exists, add full_name column and copy data
    IF has_name AND NOT has_full_name THEN
        ALTER TABLE users ADD COLUMN full_name TEXT;
        UPDATE users SET full_name = name;
        RAISE NOTICE 'Added full_name column and copied data from name';
    END IF;
    
    -- Ensure both columns have data by copying between them
    IF has_name AND has_full_name THEN
        -- Copy name to full_name where full_name is null
        UPDATE users SET full_name = name WHERE full_name IS NULL AND name IS NOT NULL;
        -- Copy full_name to name where name is null
        UPDATE users SET name = full_name WHERE name IS NULL AND full_name IS NOT NULL;
        RAISE NOTICE 'Synchronized data between name and full_name columns';
    END IF;
END $$;

-- Create user preferences table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    
    -- Location preferences
    preferred_postcode TEXT,
    preferred_cities TEXT[] DEFAULT '{}',
    max_distance_miles INTEGER DEFAULT 10,
    
    -- Property preferences
    price_min NUMERIC(10,2),
    price_max NUMERIC(10,2),
    property_type TEXT CHECK (property_type IN ('Flat','House','Studio','Bungalow','Maisonette')),
    min_bedrooms INTEGER,
    max_bedrooms INTEGER,
    furnishing_status TEXT CHECK (furnishing_status IN ('Furnished','Unfurnished','Part-Furnished')),
    
    -- Requirements
    parking_required BOOLEAN DEFAULT FALSE,
    garden_required BOOLEAN DEFAULT FALSE,
    pets_allowed_required BOOLEAN DEFAULT FALSE,
    
    -- Notifications
    email_notifications BOOLEAN DEFAULT TRUE,
    sms_notifications BOOLEAN DEFAULT FALSE,
    push_notifications BOOLEAN DEFAULT FALSE,
    instant_alerts BOOLEAN DEFAULT FALSE,
    daily_digest BOOLEAN DEFAULT FALSE,
    weekly_summary BOOLEAN DEFAULT FALSE,
    
    -- Privacy
    profile_visible BOOLEAN DEFAULT TRUE,
    contact_visible BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Check and fix the properties table landlord_id foreign key
DO $$
DECLARE
    constraint_exists BOOLEAN;
BEGIN
    -- Check if the landlord_id foreign key constraint exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.table_constraints tc
        JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY' 
        AND tc.table_name = 'properties' 
        AND ccu.column_name = 'landlord_id'
    ) INTO constraint_exists;
    
    -- If the constraint doesn't exist, add it
    IF NOT constraint_exists THEN
        -- First ensure landlord_id is not null where needed
        UPDATE properties SET landlord_id = (SELECT id FROM users WHERE role = 'landlord' LIMIT 1)
        WHERE landlord_id IS NULL;
        
        -- Add the foreign key constraint
        ALTER TABLE properties 
        ADD CONSTRAINT properties_landlord_id_fkey 
        FOREIGN KEY (landlord_id) REFERENCES users(id) ON DELETE CASCADE;
        
        RAISE NOTICE 'Added foreign key constraint for landlord_id in properties table';
    ELSE
        RAISE NOTICE 'Foreign key constraint for landlord_id already exists';
    END IF;
END $$;

-- Update properties API query fields
COMMENT ON TABLE properties IS 'Property listings with integrated user relationships';
COMMENT ON COLUMN properties.landlord_id IS 'Foreign key to users table (landlord)';
