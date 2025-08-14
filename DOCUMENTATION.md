# Direct-Rent UK Documentation

## Table of Contents

1. [Project Overview](#project-overview)
2. [System Architecture](#system-architecture)
3. [Database Schema](#database-schema)
4. [Database Update Guide](#database-update-guide)
5. [Testing Guide](#testing-guide)
6. [Completion Status](#completion-status)
7. [Future Improvements](#future-improvements)
8. [Troubleshooting](#troubleshooting)

## Project Overview

Direct-Rent UK is a comprehensive property rental platform designed specifically for the UK market. It connects landlords and tenants directly, incorporates machine learning for fraud detection and property recommendations, and provides a streamlined booking process.

### Core Features

- User registration and role-based access (tenant, landlord, admin)
- Property listings with UK-specific details
- Advanced search and filtering
- Booking/viewing requests management
- Reviews and ratings
- ML-powered fraud detection
- ML-powered price prediction
- ML-powered property recommendations
- Admin dashboard for oversight

## System Architecture

The Direct-Rent platform is built using a modern tech stack:

- **Frontend**: Next.js 15 with React 19
- **Backend**: Serverless API routes via Next.js
- **Database**: PostgreSQL via Supabase
- **Authentication**: Supabase Auth
- **File Storage**: Supabase Storage
- **Machine Learning**: External ML API (FastAPI)
- **Deployment**: Vercel (frontend), Railway/Render (ML API)

### Architecture Diagram

```
┌─────────────┐     ┌───────────────┐     ┌────────────────┐
│   Client    │────►│  Next.js App  │────►│  Supabase DB   │
│  Browser    │◄────│  (Vercel)     │◄────│  & Auth        │
└─────────────┘     └───────┬───────┘     └────────────────┘
                            │                     ▲
                            ▼                     │
                    ┌───────────────┐     ┌───────────────┐
                    │   ML API      │────►│  ML Models    │
                    │ (Railway)     │◄────│ & Datasets    │
                    └───────────────┘     └───────────────┘
```

## Database Schema

The database uses PostgreSQL with Supabase and consists of the following primary tables:

1. **users**: Stores user account information
2. **properties**: Property listings with UK-specific fields
3. **bookings**: Property enquiries and viewing requests
4. **reviews**: Property and landlord reviews
5. **user_preferences**: User search and notification preferences
6. **saved_properties**: Properties saved by users
7. **property_views**: Tracking property page views
8. **fraud_reports**: User-reported suspicious listings and ML fraud detection results
9. **ml_model_metrics**: ML model performance tracking

### Key Relationships

- Users can have multiple properties (landlords)
- Users can make multiple bookings (tenants)
- Users can save multiple properties
- Properties can have multiple bookings
- Properties can have multiple reviews

### Schema Evolution

The database schema has undergone several evolutions:

1. **Initial schema**: Basic tables for core functionality
2. **Enhanced schema**: Added detailed fields for UK-specific features
3. **ML schema enhancements**: Added tables for ML model integration
4. **Auth fixes**: Fixed Row Level Security (RLS) issues with authentication
5. **Final schema**: Consolidated changes with proper RLS policies

## Database Update Guide

This section provides instructions for updating the database schema and migrating data.

### How to Run Migrations

1. Connect to your Supabase instance via SQL Editor
2. Run the migration scripts in the correct order:

```bash
# 1. Run base schema (for new instances)
psql -h YOUR_SUPABASE_HOST -d postgres -U postgres -f database/schema.sql

# 2. Apply enhancements
psql -h YOUR_SUPABASE_HOST -d postgres -U postgres -f database/enhanced_schema.sql

# 3. Apply ML enhancements
psql -h YOUR_SUPABASE_HOST -d postgres -U postgres -f database/ml_enhanced_schema.sql

# 4. Fix any auth issues if necessary
psql -h YOUR_SUPABASE_HOST -d postgres -U postgres -f database/fix_auth_final.sql
```

### Key SQL Files

- `schema.sql`: Base schema definition
- `enhanced_schema.sql`: Enhanced schema with additional features
- `ml_enhanced_schema.sql`: ML-specific schema additions
- `fix_auth_final.sql`: Authentication fixes for Supabase
- `fix_rls_recursion_v3.sql`: Fixes for RLS policy recursion issues
- `fix_user_registration.sql`: Fixes for user registration issues

### Common Database Updates

#### Adding a New Field to Properties

```sql
-- Add new field
ALTER TABLE properties 
ADD COLUMN price_frequency TEXT CHECK (price_frequency IN ('weekly', 'monthly', 'quarterly', 'yearly'));

-- Add index for performance
CREATE INDEX idx_properties_price_frequency ON properties(price_frequency);

-- Set default value for existing records
UPDATE properties SET price_frequency = 'monthly' WHERE price_frequency IS NULL;
```

#### Updating RLS Policies

```sql
-- Drop existing policy
DROP POLICY IF EXISTS "existing_policy_name" ON table_name;

-- Create new policy
CREATE POLICY "new_policy_name" ON table_name
  FOR operation
  USING (condition)
  WITH CHECK (condition);
```

#### Updating Indexes

```sql
-- Create new index
CREATE INDEX IF NOT EXISTS index_name ON table_name(column_name);

-- Drop index
DROP INDEX IF EXISTS index_name;

-- Reindex
REINDEX INDEX index_name;
```

## Testing Guide

This section provides guidance on how to thoroughly test the Direct-Rent platform.

### Local Development Testing

#### Prerequisites

1. Node.js 18+ and npm/bun
2. Supabase account with project setup
3. PostgreSQL knowledge for database inspection
4. Google Maps API key (optional)

#### Setup Test Environment

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   # or
   bun install
   ```
3. Set up environment variables (create `.env.local`):
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_key
   ```
4. Start the development server:
   ```bash
   npm run dev
   # or
   bun dev
   ```

#### Frontend Testing

1. **User Journey Testing**:
   - Registration and login flows
   - User profile creation and editing
   - Role selection (tenant/landlord)
   - Searching for properties
   - Saving properties
   - Making booking requests
   - Landlord property management
   - Admin dashboards

2. **Component Testing**:
   - Form validation
   - UI responsiveness on different devices
   - Navigation and routing
   - Error handling and feedback
   - Image uploading and display

3. **Performance Testing**:
   - Page load times
   - Search response times
   - Image optimization
   - Lazy loading behavior
   - API response times

#### Backend Testing

1. **API Testing**:
   - Property API endpoints (GET, POST, PUT, DELETE)
   - Booking API endpoints
   - User API endpoints
   - Authentication endpoints
   - ML integration endpoints

2. **Database Testing**:
   - Data insertion and retrieval
   - RLS policy effectiveness
   - Transaction integrity
   - Query performance

3. **ML API Testing**:
   - Fraud detection accuracy
   - Price prediction accuracy
   - Recommendation relevance
   - API response times

### Automated Testing Scripts

The project includes several testing scripts:

```bash
# Check environment variables
npm run check-env

# Inspect database schema
npm run inspect-schema

# Test database insertion
npm run test-insert

# Run TypeScript type checking
npm run type-check

# Train ML models
npm run train:price     # Train price prediction model
npm run train:fraud     # Train fraud detection model
npm run train:all       # Train all models
```

### Test Data Importation

You can import test data using the provided script:

```bash
npm run import-data
# or
npm run db:seed
```

This will load property data from `dataset/uk_housing_rentals.csv`.

### Testing User Roles

#### Testing as Tenant

1. Register new account
2. Select "tenant" role
3. Search for properties
4. Save properties to favorites
5. Make booking requests
6. Leave reviews

#### Testing as Landlord

1. Register new account
2. Select "landlord" role
3. Create property listings
4. Upload property images
5. Manage booking requests
6. Respond to tenant enquiries

#### Testing as Admin

1. Login with admin credentials
2. Access admin dashboard
3. Manage users (view, edit, delete)
4. Manage properties (approve, reject, edit)
5. Review fraud reports
6. Access analytics

### End-to-End Testing Checklist

- [ ] User registration works with email verification
- [ ] User login works with proper session management
- [ ] Password reset functionality works
- [ ] Property search returns relevant results
- [ ] Property filtering narrows results correctly
- [ ] Property detail page shows all information
- [ ] Image upload and display works for properties
- [ ] Booking requests can be created by tenants
- [ ] Booking requests can be managed by landlords
- [ ] Admin dashboard shows all required information
- [ ] ML recommendations appear for properties
- [ ] Fraud detection flags suspicious properties
- [ ] Price estimates are reasonable for properties

## Completion Status

### Current Status

Direct-Rent UK is approximately 85% complete. Here's a breakdown of the completion status for major features:

#### Core Features

| Feature | Status | Notes |
|---------|--------|-------|
| User Authentication | ✅ Complete | Includes registration, login, password reset |
| User Profile Management | ✅ Complete | Profile creation, editing, role selection |
| Property Listings | ✅ Complete | Creation, editing, deletion |
| Property Search | ✅ Complete | Full text search with filtering |
| Property Booking | ✅ Complete | Booking requests, approval flow |
| Reviews System | ✅ Complete | Rating and commenting system |
| Admin Dashboard | ⚠️ Partial | User management complete, analytics incomplete |
| ML Fraud Detection | ⚠️ Partial | Basic integration complete, advanced features pending |
| ML Price Prediction | ⚠️ Partial | Integration complete, accuracy needs improvement |
| ML Recommendations | ⚠️ Partial | Basic recommendations working, personalization pending |

#### Frontend

| Feature | Status | Notes |
|---------|--------|-------|
| Responsive Design | ✅ Complete | Works on mobile, tablet, desktop |
| Core Pages | ✅ Complete | Home, search, property details, profile |
| Property Management | ✅ Complete | Creation, editing, viewing requests |
| Booking Management | ✅ Complete | Request creation, approval, rejection |
| Admin Panels | ⚠️ Partial | User, property, booking management complete |
| Analytics Dashboards | ❌ Incomplete | Landlord and admin analytics dashboards |
| Notifications | ❌ Incomplete | In-app notifications system |

#### Backend

| Feature | Status | Notes |
|---------|--------|-------|
| API Routes | ✅ Complete | Core CRUD operations for all entities |
| Database Schema | ✅ Complete | All tables and relationships defined |
| Authentication | ✅ Complete | Supabase Auth integration |
| File Storage | ✅ Complete | Property image upload and storage |
| RLS Policies | ✅ Complete | Proper security for all tables |
| ML API Integration | ⚠️ Partial | Basic integration complete |
| Email Notifications | ❌ Incomplete | Transactional emails for key actions |

### Known Issues

1. **Authentication Issues**:
   - Occasional RLS policy recursion errors
   - Email verification flow can be inconsistent

2. **UI/UX Issues**:
   - Some responsive layout issues on very small screens
   - Form validation errors sometimes unclear
   - Image upload modal occasionally fails silently

3. **Performance Issues**:
   - Property search can be slow with many filters
   - Large image uploads sometimes timeout
   - ML API calls can slow down property listing creation

4. **Database Issues**:
   - Some database queries not optimized for scale
   - Missing indexes on frequently filtered fields
   - RLS policies occasionally too restrictive

## Future Improvements

### Short-term Improvements (1-3 months)

1. **Authentication Fixes**:
   - Resolve remaining RLS policy issues
   - Improve email verification flow
   - Add social login options (Google, Facebook)

2. **UI/UX Enhancements**:
   - Fix responsive layout issues
   - Improve form validation feedback
   - Add loading states for all actions
   - Enhance image upload with preview and progress

3. **Performance Optimization**:
   - Optimize database queries
   - Add caching for frequent searches
   - Implement image compression
   - Add pagination to all list views

4. **Testing Improvements**:
   - Add unit tests for core components
   - Add integration tests for critical flows
   - Implement end-to-end testing with Playwright

### Medium-term Improvements (3-6 months)

1. **Feature Additions**:
   - In-app messaging between users
   - Calendar integration for viewings
   - Document upload and verification
   - Advanced search with saved searches

2. **ML Enhancements**:
   - Improve fraud detection accuracy
   - Enhance price prediction with local market data
   - Personalized recommendations based on user behavior

3. **Analytics Dashboard**:
   - Landlord analytics (property performance, inquiry rates)
   - Admin analytics (platform usage, conversion rates)
   - Market trend reports

4. **Monetization Features**:
   - Featured property listings
   - Premium landlord profiles
   - Subscription tiers for landlords

### Long-term Vision (6+ months)

1. **Platform Expansion**:
   - Mobile app development
   - Integration with property management software
   - Virtual viewings with 3D tours
   - Tenant verification and referencing

2. **Advanced Features**:
   - Smart contracts for rental agreements
   - Rent payment processing
   - Maintenance request system
   - Insurance and deposit protection integration

3. **Integration Ecosystem**:
   - API for third-party integrations
   - Partner network for services (cleaning, moving, etc.)
   - Integration with property portals

4. **Geographical Expansion**:
   - Support for additional UK regions with local data
   - Potential expansion to similar markets (Ireland, Australia)

## Troubleshooting

### Common Issues and Solutions

#### Authentication Issues

**Issue**: User cannot register or login
**Solution**:
1. Check Supabase configuration
2. Verify environment variables are set correctly
3. Check RLS policies in `fix_auth_final.sql`
4. Clear browser cookies and try again

**Issue**: "RLS policy error" during queries
**Solution**:
1. Check user session is valid
2. Review RLS policies in `fix_rls_recursion_v3.sql`
3. Ensure user has appropriate role set

#### Database Issues

**Issue**: "duplicate key value violates unique constraint"
**Solution**:
1. Check for existing records before insertion
2. Use upsert (`ON CONFLICT`) operations
3. Verify unique constraint definitions

**Issue**: Slow database queries
**Solution**:
1. Review query execution plan with `EXPLAIN ANALYZE`
2. Add appropriate indexes as needed
3. Optimize JOIN conditions
4. Consider adding materialized views for complex queries

#### ML API Issues

**Issue**: ML API not responding
**Solution**:
1. Check API service is running
2. Verify environment variables for API URL
3. Check network connectivity
4. Review API logs for errors

**Issue**: Inaccurate ML predictions
**Solution**:
1. Retrain models with `npm run train:all`
2. Check input data quality
3. Verify model features match production data

#### Image Upload Issues

**Issue**: Images fail to upload
**Solution**:
1. Check Supabase storage bucket configuration
2. Verify file size limits (max 2MB recommended)
3. Check for CORS issues
4. Use image compression before upload

### Getting Help

For additional help with Direct-Rent issues:

1. Check existing documentation in the `/docs` folder
2. Review code comments for implementation details
3. Check Supabase documentation for database/auth issues
4. Review Next.js documentation for frontend issues
5. Contact the development team at [support@direct-rent.uk](mailto:support@direct-rent.uk)

---

## Contributing to Documentation

This documentation is a living document. To contribute:

1. Fork the repository
2. Make your changes to DOCUMENTATION.md
3. Submit a pull request with clear description of changes
4. Ensure any code examples are tested and working

## License

Direct-Rent UK is proprietary software. All rights reserved.

---

Last updated: August 14, 2025
