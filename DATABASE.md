# Direct-Rent UK Database Documentation

This document provides comprehensive documentation for the Direct-Rent UK database structure, including the evolution of schema changes, RLS policies, and migration strategies.

## Table of Contents

1. [Database Overview](#database-overview)
2. [Schema Evolution](#schema-evolution)
3. [Table Definitions](#table-definitions)
4. [Row Level Security Policies](#row-level-security-policies)
5. [Indexes and Performance](#indexes-and-performance)
6. [Database Migration Strategy](#database-migration-strategy)
7. [Future Database Improvements](#future-database-improvements)

## Database Overview

The Direct-Rent UK platform uses Supabase (PostgreSQL) as its primary database. The schema has evolved over time from a basic structure to an enhanced schema with ML integration and improved authentication mechanisms.

### Core Database Concepts:

- **Users**: Authenticated users with role-based access (tenant, landlord, admin)
- **Properties**: Real estate listings with detailed attributes
- **Bookings**: Property viewing appointments between tenants and landlords
- **Reviews**: User-generated reviews for properties and users
- **ML Integration**: Tables for fraud detection, price prediction, and recommendations

## Schema Evolution

The database schema has evolved through multiple phases:

### 1. Basic Schema (schema.sql)

Initial database structure with core tables:
- users
- profiles
- properties
- bookings
- messages

### 2. Enhanced Schema (enhanced_schema.sql)

Added:
- More property attributes
- Location data
- Improved search capabilities
- Expanded user profiles

### 3. ML Enhancement (ml_enhanced_schema.sql)

Added:
- Fraud detection scoring
- Price prediction data
- Recommendation engine tables
- User preference tracking

### 4. Authentication Fixes (fix_auth_final.sql)

Addressed:
- User registration issues
- Authentication flow improvements
- Session management

### 5. RLS Policy Refinements (fix_rls_recursion_v3.sql)

Fixed:
- Recursive RLS policy issues
- Permission boundaries
- Security enhancements

## Table Definitions

### Users Table

The foundation of the authentication system:

```sql
CREATE TABLE auth.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  encrypted_password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  role VARCHAR(50) DEFAULT 'tenant',
  email_confirmed_at TIMESTAMP WITH TIME ZONE,
  confirmation_token VARCHAR(255),
  confirmation_sent_at TIMESTAMP WITH TIME ZONE,
  recovery_token VARCHAR(255),
  recovery_sent_at TIMESTAMP WITH TIME ZONE,
  last_sign_in_at TIMESTAMP WITH TIME ZONE
);
```

### Profiles Table

Extended user information:

```sql
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  avatar_url TEXT,
  phone VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_landlord BOOLEAN DEFAULT false,
  is_tenant BOOLEAN DEFAULT false,
  is_admin BOOLEAN DEFAULT false,
  company_name VARCHAR(255),
  verification_status VARCHAR(50) DEFAULT 'pending',
  verification_documents JSONB,
  preferences JSONB,
  landlord_rating NUMERIC(3,2),
  tenant_rating NUMERIC(3,2)
);
```

### Properties Table

Real estate listings:

```sql
CREATE TABLE public.properties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID REFERENCES auth.users(id) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  property_type VARCHAR(50) NOT NULL,
  bedrooms SMALLINT NOT NULL,
  bathrooms SMALLINT NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  price_frequency VARCHAR(20) DEFAULT 'monthly',
  size_sqm NUMERIC(8,2),
  is_furnished BOOLEAN DEFAULT false,
  has_garden BOOLEAN DEFAULT false,
  has_parking BOOLEAN DEFAULT false,
  pets_allowed BOOLEAN DEFAULT false,
  bills_included BOOLEAN DEFAULT false,
  available_from DATE,
  min_lease_months SMALLINT,
  max_lease_months SMALLINT,
  address_line1 VARCHAR(255) NOT NULL,
  address_line2 VARCHAR(255),
  city VARCHAR(100) NOT NULL,
  postal_code VARCHAR(20) NOT NULL,
  county VARCHAR(100),
  country VARCHAR(100) DEFAULT 'United Kingdom',
  latitude NUMERIC(10,6),
  longitude NUMERIC(10,6),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  status VARCHAR(50) DEFAULT 'pending_approval',
  images JSONB DEFAULT '[]'::jsonb,
  amenities JSONB DEFAULT '[]'::jsonb,
  energy_rating VARCHAR(10),
  council_tax_band VARCHAR(5),
  fraud_score NUMERIC(5,2) DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  views_count INTEGER DEFAULT 0,
  saves_count INTEGER DEFAULT 0
);
```

### Bookings Table

Property viewing appointments:

```sql
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID REFERENCES public.properties(id) NOT NULL,
  tenant_id UUID REFERENCES auth.users(id) NOT NULL,
  landlord_id UUID REFERENCES auth.users(id) NOT NULL,
  requested_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  cancellation_reason TEXT,
  feedback TEXT,
  is_virtual_viewing BOOLEAN DEFAULT false
);
```

### Reviews Table

User and property reviews:

```sql
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reviewer_id UUID REFERENCES auth.users(id) NOT NULL,
  property_id UUID REFERENCES public.properties(id),
  landlord_id UUID REFERENCES auth.users(id),
  tenant_id UUID REFERENCES auth.users(id),
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_approved BOOLEAN DEFAULT false,
  CONSTRAINT review_target_check CHECK (
    (property_id IS NOT NULL AND landlord_id IS NULL AND tenant_id IS NULL) OR
    (property_id IS NULL AND landlord_id IS NOT NULL AND tenant_id IS NULL) OR
    (property_id IS NULL AND landlord_id IS NULL AND tenant_id IS NOT NULL)
  )
);
```

### ML-Related Tables

```sql
CREATE TABLE public.property_predictions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID REFERENCES public.properties(id) NOT NULL,
  predicted_price NUMERIC(10,2) NOT NULL,
  confidence_score NUMERIC(5,2) NOT NULL,
  prediction_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  model_version VARCHAR(50),
  features_used JSONB
);

CREATE TABLE public.fraud_detection_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID REFERENCES public.properties(id) NOT NULL,
  fraud_score NUMERIC(5,2) NOT NULL,
  fraud_indicators JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  reviewed_by UUID REFERENCES auth.users(id),
  review_notes TEXT,
  status VARCHAR(50) DEFAULT 'pending_review'
);

CREATE TABLE public.user_recommendations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  property_id UUID REFERENCES public.properties(id) NOT NULL,
  score NUMERIC(5,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  features_used JSONB,
  is_viewed BOOLEAN DEFAULT false,
  is_saved BOOLEAN DEFAULT false
);
```

## Row Level Security Policies

The database implements Row Level Security (RLS) policies to enforce access control at the database level. These policies ensure users can only access and modify data they are authorized to interact with.

### User Profile RLS

```sql
-- Users can read their own profiles
CREATE POLICY read_own_profile ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profiles
CREATE POLICY update_own_profile ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Admins can read all profiles
CREATE POLICY admin_read_all_profiles ON public.profiles
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_admin = true
  ));

-- Admins can update all profiles
CREATE POLICY admin_update_all_profiles ON public.profiles
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_admin = true
  ));

-- Landlords can read tenant profiles who booked their properties
CREATE POLICY landlord_read_tenant_profiles ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.is_landlord = true
    ) AND
    EXISTS (
      SELECT 1 FROM public.bookings b
      JOIN public.properties prop ON b.property_id = prop.id
      WHERE prop.owner_id = auth.uid() AND b.tenant_id = profiles.id
    )
  );
```

### Property RLS

```sql
-- Anyone can read active properties
CREATE POLICY read_active_properties ON public.properties
  FOR SELECT USING (status = 'active');

-- Property owners can read their own properties regardless of status
CREATE POLICY owners_read_own_properties ON public.properties
  FOR SELECT USING (owner_id = auth.uid());

-- Property owners can update their own properties
CREATE POLICY owners_update_own_properties ON public.properties
  FOR UPDATE USING (owner_id = auth.uid());

-- Only landlords can create properties
CREATE POLICY landlords_create_properties ON public.properties
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_landlord = true
    )
  );

-- Admins can read all properties
CREATE POLICY admin_read_all_properties ON public.properties
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Admins can update all properties
CREATE POLICY admin_update_all_properties ON public.properties
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );
```

### Booking RLS

```sql
-- Tenants can read their own bookings
CREATE POLICY tenant_read_own_bookings ON public.bookings
  FOR SELECT USING (tenant_id = auth.uid());

-- Tenants can create bookings
CREATE POLICY tenant_create_bookings ON public.bookings
  FOR INSERT WITH CHECK (
    tenant_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_tenant = true
    )
  );

-- Landlords can read bookings for their properties
CREATE POLICY landlord_read_property_bookings ON public.bookings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.properties
      WHERE id = bookings.property_id AND owner_id = auth.uid()
    )
  );

-- Landlords can update bookings for their properties
CREATE POLICY landlord_update_property_bookings ON public.bookings
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.properties
      WHERE id = bookings.property_id AND owner_id = auth.uid()
    )
  );

-- Admins can read all bookings
CREATE POLICY admin_read_all_bookings ON public.bookings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );
```

## Indexes and Performance

The database includes several indexes to optimize query performance:

```sql
-- Property search indexes
CREATE INDEX properties_city_idx ON public.properties(city);
CREATE INDEX properties_postal_code_idx ON public.properties(postal_code);
CREATE INDEX properties_price_idx ON public.properties(price);
CREATE INDEX properties_bedrooms_idx ON public.properties(bedrooms);
CREATE INDEX properties_property_type_idx ON public.properties(property_type);
CREATE INDEX properties_status_idx ON public.properties(status);
CREATE INDEX properties_created_at_idx ON public.properties(created_at);
CREATE INDEX properties_location_idx ON public.properties USING GIST(
  ll_to_earth(latitude, longitude)
);

-- User related indexes
CREATE INDEX profiles_is_landlord_idx ON public.profiles(is_landlord);
CREATE INDEX profiles_is_tenant_idx ON public.profiles(is_tenant);
CREATE INDEX profiles_is_admin_idx ON public.profiles(is_admin);

-- Booking related indexes
CREATE INDEX bookings_property_id_idx ON public.bookings(property_id);
CREATE INDEX bookings_tenant_id_idx ON public.bookings(tenant_id);
CREATE INDEX bookings_landlord_id_idx ON public.bookings(landlord_id);
CREATE INDEX bookings_status_idx ON public.bookings(status);
CREATE INDEX bookings_requested_date_idx ON public.bookings(requested_date);
```

## Database Migration Strategy

The database uses a migrations table to track schema changes:

```sql
CREATE TABLE IF NOT EXISTS public.migrations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

Migration scripts are stored in the `database` directory and follow this naming convention:
- `schema.sql` - Initial schema
- `enhanced_schema.sql` - Enhanced schema with additional fields
- `ml_enhanced_schema.sql` - ML-related schema additions
- `fix_*.sql` - Various fixes for auth, RLS, etc.

To apply migrations, use the provided scripts:

```bash
# Check current schema against expected
npm run check-db-schema

# Apply specific migration
node scripts/apply-migration.js migration_name.sql
```

## Future Database Improvements

The following database improvements are planned for future releases:

1. **Performance Optimizations**:
   - Add partial indexes for common queries
   - Implement materialized views for complex reports
   - Add database-level caching for frequent lookups

2. **Schema Enhancements**:
   - Add support for property sub-leases
   - Expand property amenities taxonomy
   - Add geographical area boundaries

3. **Data Integrity**:
   - Implement stronger constraints on price ranges
   - Add referential integrity checks for ML tables
   - Implement data archiving strategy

4. **Security Improvements**:
   - Refine RLS policies to prevent edge case exploits
   - Implement row-level encryption for sensitive data
   - Add audit logging for security-sensitive operations

5. **Analytics Support**:
   - Add time-series tables for market trend analysis
   - Implement aggregation tables for reporting
   - Add user activity tracking

---

*Last updated: August 14, 2025*
