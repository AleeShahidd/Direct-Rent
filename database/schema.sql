-- DirectRent UK Database Schema
-- UK-specific property rental platform

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    role TEXT NOT NULL CHECK (role IN ('landlord', 'tenant', 'admin')),
    avatar_url TEXT,
    email_verified BOOLEAN DEFAULT FALSE,
    phone_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    first_name TEXT,
    last_name TEXT,
    date_of_birth DATE,
    verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
    account_status TEXT DEFAULT 'active' CHECK (account_status IN ('active', 'suspended', 'pending', 'deactivated')),
    last_login TIMESTAMP WITH TIME ZONE,
    registration_ip INET
);

-- Properties table with UK-specific fields
CREATE TABLE properties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    price_per_month NUMERIC(10,2) NOT NULL,
    deposit_amount NUMERIC(10,2),
    postcode TEXT NOT NULL,
    address_line1 TEXT NOT NULL,
    address_line2 TEXT,
    city TEXT NOT NULL,
    country TEXT DEFAULT 'United Kingdom',
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    
    -- UK-specific fields
    council_tax_band TEXT CHECK (council_tax_band IN ('A','B','C','D','E','F','G','H')),
    epc_rating TEXT CHECK (epc_rating IN ('A','B','C','D','E','F','G')),
    furnishing_status TEXT NOT NULL CHECK (furnishing_status IN ('Furnished','Unfurnished','Part-Furnished')),
    
    -- Property details
    bedrooms INTEGER NOT NULL,
    bathrooms INTEGER NOT NULL,
    property_type TEXT NOT NULL CHECK (property_type IN ('Flat','House','Studio','Bungalow','Maisonette')),
    
    -- Availability
    available_from DATE,
    minimum_tenancy_months INTEGER DEFAULT 6,
    
    -- Features and amenities
    parking BOOLEAN DEFAULT FALSE,
    garden BOOLEAN DEFAULT FALSE,
    balcony BOOLEAN DEFAULT FALSE,
    pets_allowed BOOLEAN DEFAULT FALSE,
    smoking_allowed BOOLEAN DEFAULT FALSE,
    
    -- Landlord and verification
    landlord_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_verified BOOLEAN DEFAULT FALSE,
    verification_date TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Media
    images TEXT[] DEFAULT '{}', -- array of image URLs
    virtual_tour_url TEXT,
    
    -- Fraud detection
    fraud_score DECIMAL(3,2) DEFAULT 0.00,
    is_flagged BOOLEAN DEFAULT FALSE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Bookings/Enquiries table
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'withdrawn')),
    landlord_response TEXT,
    
    -- Viewing details
    preferred_viewing_date DATE,
    preferred_viewing_time TIME,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Reviews table
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    
    -- Review categories (UK rental specific)
    condition_rating INTEGER CHECK (condition_rating BETWEEN 1 AND 5),
    location_rating INTEGER CHECK (location_rating BETWEEN 1 AND 5),
    landlord_rating INTEGER CHECK (landlord_rating BETWEEN 1 AND 5),
    value_for_money_rating INTEGER CHECK (value_for_money_rating BETWEEN 1 AND 5),
    
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    -- Ensure one review per user per property
    UNIQUE(property_id, user_id)
);

-- User preferences for recommendations
CREATE TABLE user_preferences (
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
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Saved properties (watchlist)
CREATE TABLE saved_properties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    -- Ensure one save per user per property
    UNIQUE(user_id, property_id)
);

-- Property views tracking
CREATE TABLE property_views (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- Allow anonymous views
    ip_address INET,
    user_agent TEXT,
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Fraud reports
CREATE TABLE fraud_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    reported_by UUID REFERENCES users(id) ON DELETE SET NULL,
    reason TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'investigating', 'resolved', 'dismissed')),
    admin_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better performance
CREATE INDEX idx_properties_postcode ON properties(postcode);
CREATE INDEX idx_properties_price ON properties(price_per_month);
CREATE INDEX idx_properties_property_type ON properties(property_type);
CREATE INDEX idx_properties_bedrooms ON properties(bedrooms);
CREATE INDEX idx_properties_landlord ON properties(landlord_id);
CREATE INDEX idx_properties_created_at ON properties(created_at);
CREATE INDEX idx_properties_location ON properties(latitude, longitude);
CREATE INDEX idx_bookings_property ON bookings(property_id);
CREATE INDEX idx_bookings_user ON bookings(user_id);
CREATE INDEX idx_reviews_property ON reviews(property_id);
CREATE INDEX idx_property_views_property ON property_views(property_id);
CREATE INDEX idx_property_views_date ON property_views(viewed_at);

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE fraud_reports ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "Users can view their own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Properties table policies
CREATE POLICY "Anyone can view active properties" ON properties
    FOR SELECT USING (is_active = true);

CREATE POLICY "Landlords can insert their own properties" ON properties
    FOR INSERT WITH CHECK (auth.uid() = landlord_id);

CREATE POLICY "Landlords can update their own properties" ON properties
    FOR UPDATE USING (auth.uid() = landlord_id);

CREATE POLICY "Landlords can delete their own properties" ON properties
    FOR DELETE USING (auth.uid() = landlord_id);

-- Admin can see all properties
CREATE POLICY "Admins can view all properties" ON properties
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() AND users.role = 'admin'
        )
    );

-- Bookings table policies
CREATE POLICY "Users can view their own bookings" ON bookings
    FOR SELECT USING (
        auth.uid() = user_id OR 
        auth.uid() IN (SELECT landlord_id FROM properties WHERE properties.id = property_id)
    );

CREATE POLICY "Tenants can create bookings" ON bookings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bookings" ON bookings
    FOR UPDATE USING (
        auth.uid() = user_id OR 
        auth.uid() IN (SELECT landlord_id FROM properties WHERE properties.id = property_id)
    );

-- Reviews table policies
CREATE POLICY "Anyone can view reviews" ON reviews
    FOR SELECT USING (true);

CREATE POLICY "Users can create reviews" ON reviews
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews" ON reviews
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reviews" ON reviews
    FOR DELETE USING (auth.uid() = user_id);

-- User preferences policies
CREATE POLICY "Users can manage their own preferences" ON user_preferences
    FOR ALL USING (auth.uid() = user_id);

-- Saved properties policies
CREATE POLICY "Users can manage their own saved properties" ON saved_properties
    FOR ALL USING (auth.uid() = user_id);

-- Property views policies (allow anonymous views)
CREATE POLICY "Anyone can insert property views" ON property_views
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view their own property views" ON property_views
    FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

-- Fraud reports policies
CREATE POLICY "Users can create fraud reports" ON fraud_reports
    FOR INSERT WITH CHECK (auth.uid() = reported_by);

CREATE POLICY "Users can view their own fraud reports" ON fraud_reports
    FOR SELECT USING (auth.uid() = reported_by);

-- Admins can manage fraud reports
CREATE POLICY "Admins can manage fraud reports" ON fraud_reports
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() AND users.role = 'admin'
        )
    );

-- Functions and triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON properties
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Sample data for development (optional)
-- Insert sample admin user
INSERT INTO users (id, full_name, email, role, email_verified) VALUES
    ('550e8400-e29b-41d4-a716-446655440000', 'Admin User', 'admin@directrent.uk', 'admin', true);

-- Insert sample landlord
INSERT INTO users (id, full_name, email, phone, role, email_verified) VALUES
    ('550e8400-e29b-41d4-a716-446655440001', 'John Smith', 'john.smith@example.com', '+44 7700 900123', 'landlord', true);

-- Insert sample tenant
INSERT INTO users (id, full_name, email, phone, role, email_verified) VALUES
    ('550e8400-e29b-41d4-a716-446655440002', 'Emma Wilson', 'emma.wilson@example.com', '+44 7700 900124', 'tenant', true);

-- Insert sample properties
INSERT INTO properties (
    title, description, price_per_month, deposit_amount, postcode, address_line1, city,
    council_tax_band, epc_rating, furnishing_status, bedrooms, bathrooms, property_type,
    available_from, parking, garden, landlord_id, is_verified, is_active
) VALUES
    (
        'Modern 2-Bed Flat in Central London',
        'Stunning modern apartment in the heart of London with excellent transport links. Recently refurbished with high-end finishes throughout.',
        2500.00, 5000.00, 'SW1A 1AA', '123 Westminster Road', 'London',
        'D', 'B', 'Furnished', 2, 1, 'Flat',
        '2024-02-01', false, false, '550e8400-e29b-41d4-a716-446655440001', true, true
    ),
    (
        'Charming Victorian House in Manchester',
        'Beautiful 3-bedroom Victorian terrace house with original features, modern kitchen, and lovely garden.',
        1200.00, 2400.00, 'M1 1AA', '456 Oxford Street', 'Manchester',
        'C', 'C', 'Unfurnished', 3, 2, 'House',
        '2024-03-01', true, true, '550e8400-e29b-41d4-a716-446655440001', true, true
    );

COMMENT ON TABLE users IS 'User accounts for landlords, tenants, and admins';
COMMENT ON TABLE properties IS 'Property listings with UK-specific fields';
COMMENT ON TABLE bookings IS 'Property enquiries and viewing requests';
COMMENT ON TABLE reviews IS 'Property and landlord reviews';
COMMENT ON TABLE user_preferences IS 'User search and notification preferences';
COMMENT ON TABLE saved_properties IS 'Properties saved by users';
COMMENT ON TABLE property_views IS 'Tracking property page views';
COMMENT ON TABLE fraud_reports IS 'User-reported suspicious listings';
