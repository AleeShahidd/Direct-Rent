-- Fix Properties to Users Relationship
-- This migration adds/fixes the foreign key relationship between properties.landlord_id and users.id

-- First, check if the landlord_id column exists in properties table
DO $$
BEGIN
    -- Check if landlord_id column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'properties' 
        AND column_name = 'landlord_id'
    ) THEN
        -- Add landlord_id column if it doesn't exist
        ALTER TABLE properties ADD COLUMN landlord_id UUID REFERENCES users(id);
    END IF;

    -- Check if the foreign key constraint exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
            ON tc.constraint_catalog = kcu.constraint_catalog
            AND tc.constraint_schema = kcu.constraint_schema
            AND tc.constraint_name = kcu.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
            AND tc.table_schema = 'public'
            AND tc.table_name = 'properties'
            AND kcu.column_name = 'landlord_id'
    ) THEN
        -- If the foreign key constraint doesn't exist, add it
        BEGIN
            ALTER TABLE properties
            ADD CONSTRAINT fk_properties_landlord
            FOREIGN KEY (landlord_id) REFERENCES users(id);
            
            RAISE NOTICE 'Foreign key constraint added successfully';
        EXCEPTION WHEN OTHERS THEN
            -- If adding the constraint fails, we may need to fix invalid data first
            RAISE NOTICE 'Error adding foreign key constraint: %, %', SQLERRM, SQLSTATE;
            
            -- Check for invalid landlord_id values and set them to NULL
            UPDATE properties 
            SET landlord_id = NULL 
            WHERE landlord_id IS NOT NULL 
            AND NOT EXISTS (SELECT 1 FROM users WHERE users.id = properties.landlord_id);
            
            -- Try adding the constraint again
            ALTER TABLE properties
            ADD CONSTRAINT fk_properties_landlord
            FOREIGN KEY (landlord_id) REFERENCES users(id);
            
            RAISE NOTICE 'Foreign key constraint added after fixing invalid data';
        END;
    ELSE
        RAISE NOTICE 'Foreign key constraint already exists';
    END IF;
END $$;

-- Ensure we have the correct index for better performance
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE schemaname = 'public' 
        AND tablename = 'properties' 
        AND indexname = 'idx_properties_landlord_id'
    ) THEN
        CREATE INDEX idx_properties_landlord_id ON properties(landlord_id);
    END IF;
END $$;

-- Fix the API query by ensuring the relationship is properly defined in PostgREST
COMMENT ON CONSTRAINT fk_properties_landlord ON properties IS 'A property belongs to a landlord user';
