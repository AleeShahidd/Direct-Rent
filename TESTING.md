# Direct-Rent UK Testing Guide

This document provides comprehensive testing procedures for the Direct-Rent UK platform. It covers manual testing, automated testing, and identifies areas for improvement.

## Table of Contents

1. [Testing Prerequisites](#testing-prerequisites)
2. [Database Testing](#database-testing)
3. [Authentication Testing](#authentication-testing)
4. [Property Management Testing](#property-management-testing)
5. [Booking System Testing](#booking-system-testing)
6. [Admin Dashboard Testing](#admin-dashboard-testing)
7. [ML Features Testing](#ml-features-testing)
8. [Performance Testing](#performance-testing)
9. [Mobile Responsiveness Testing](#mobile-responsiveness-testing)
10. [Test Data Generation](#test-data-generation)
11. [Test Automation](#test-automation)
12. [Known Issues](#known-issues)

## Testing Prerequisites

Before beginning testing, ensure you have:

1. **Local Development Environment**:
   - Node.js v18+ installed
   - Access to Supabase project
   - Environment variables configured
   - All dependencies installed

2. **Test Accounts**:
   - Tenant user account
   - Landlord user account
   - Admin user account

3. **Testing Tools**:
   - Browser developer tools
   - API testing tool (Postman, Insomnia)
   - Database query tool (Supabase Dashboard)

## Database Testing

### Schema Validation

Run the following script to validate the database schema:

```bash
npm run inspect-schema
```

This will verify table structures, relationships, and constraints.

### Data Insertion Testing

1. Run the test insertion script:
   ```bash
   npm run test-insert
   ```

2. Verify records appear in the Supabase dashboard

3. Test database constraints:
   - Try inserting a property without required fields
   - Try inserting a duplicate email in users table
   - Try inserting a booking without a valid property reference

### RLS Policy Testing

Test Row Level Security policies for each user type:

#### As Tenant:
- Should be able to read own profile
- Should be able to update own profile
- Should be able to read landlord profiles
- Should NOT be able to read other tenant profiles
- Should be able to read active properties
- Should NOT be able to update properties
- Should be able to create bookings for properties
- Should be able to read own bookings
- Should NOT be able to read other users' bookings

#### As Landlord:
- Should be able to read own profile
- Should be able to update own profile
- Should NOT be able to read tenant profiles except those who booked
- Should be able to create properties
- Should be able to update own properties
- Should NOT be able to update others' properties
- Should be able to read bookings for own properties
- Should NOT be able to read bookings for others' properties

#### As Admin:
- Should be able to read all user profiles
- Should be able to update all user profiles
- Should be able to read all properties
- Should be able to update all properties
- Should be able to read all bookings

## Authentication Testing

### Registration Flow

1. **Tenant Registration**:
   - Navigate to `/auth/register`
   - Fill out registration form with test data
   - Submit form
   - Verify email verification is sent
   - Complete email verification
   - Verify redirection to role selection
   - Select "Tenant" role
   - Verify user is created in database with correct role

2. **Landlord Registration**:
   - Repeat same steps but select "Landlord" role
   - Verify extra profile fields appear for landlords
   - Verify user is created with correct role

### Login Flow

1. **Valid Credentials**:
   - Navigate to `/auth/login`
   - Enter valid email/password
   - Verify successful login
   - Verify correct redirection based on role

2. **Invalid Credentials**:
   - Enter invalid email/password
   - Verify appropriate error message
   - Verify form validation

3. **Password Reset**:
   - Test "Forgot Password" flow
   - Verify reset email is sent
   - Complete reset process
   - Verify new password works

### Session Management

1. **Session Persistence**:
   - Login and close browser
   - Reopen and verify session persists

2. **Session Expiry**:
   - Modify session timeout (if possible)
   - Verify session expires correctly
   - Verify proper redirection on expired session

3. **Logout**:
   - Test logout functionality
   - Verify proper session cleanup
   - Verify redirect to login page

## Property Management Testing

### Property Creation

1. **As Landlord**:
   - Navigate to property creation form
   - Fill out all required fields
   - Upload test images
   - Submit the form
   - Verify property appears in database
   - Verify property status is set to "pending_approval"

2. **Form Validation**:
   - Test with missing required fields
   - Test with invalid data (e.g., negative price)
   - Verify appropriate error messages

3. **Image Upload**:
   - Test single image upload
   - Test multiple image upload
   - Test with oversized images
   - Test with invalid file types
   - Verify images are stored correctly

### Property Editing

1. **As Property Owner**:
   - Navigate to own property details
   - Edit various fields
   - Save changes
   - Verify changes reflect in database

2. **As Non-Owner**:
   - Try to edit another user's property
   - Verify access is denied

### Property Search

1. **Basic Search**:
   - Use search box with various keywords
   - Verify results match search terms

2. **Advanced Filtering**:
   - Test each filter parameter individually
   - Test combinations of filters
   - Verify filter persistence across page navigation

3. **Pagination**:
   - Navigate through multiple pages of results
   - Verify correct items per page
   - Verify total count is accurate

## Booking System Testing

### Booking Creation

1. **As Tenant**:
   - Navigate to property details
   - Click "Book Viewing" button
   - Fill out booking form
   - Submit request
   - Verify booking appears in database
   - Verify booking status is "pending"

2. **Validation**:
   - Test with missing required fields
   - Test with invalid dates
   - Verify appropriate error messages

### Booking Management

1. **As Landlord**:
   - Navigate to booking management
   - View pending bookings
   - Approve a booking
   - Reject a booking
   - Verify status changes in database

2. **As Tenant**:
   - View own bookings
   - Cancel a booking
   - Verify status changes

3. **Notifications**:
   - Verify landlord receives notification of new booking
   - Verify tenant receives notification of booking status change

## Admin Dashboard Testing

### User Management

1. **View Users**:
   - Navigate to admin user management
   - Verify all users are displayed
   - Test search and filtering

2. **Edit Users**:
   - Edit a user's details
   - Change a user's role
   - Verify changes in database

3. **Delete Users**:
   - Delete a test user
   - Verify user is removed from database
   - Verify associated data handling (cascade or prevent)

### Property Management

1. **Property Approval**:
   - Navigate to admin property management
   - View pending properties
   - Approve a property
   - Reject a property with reason
   - Verify status changes

2. **Property Editing**:
   - Edit any property as admin
   - Verify changes are saved

3. **Property Removal**:
   - Remove a test property
   - Verify property is removed or deactivated

### Booking Management

1. **View All Bookings**:
   - Navigate to admin booking management
   - Verify all bookings are displayed
   - Test search and filtering

2. **Booking Intervention**:
   - Change status of a booking
   - Add admin note to booking
   - Verify changes are saved

## ML Features Testing

### Fraud Detection

1. **Test with Clean Listing**:
   - Create a normal property listing
   - Verify fraud score is low
   - Verify property passes automatic approval

2. **Test with Suspicious Listing**:
   - Create a property with suspiciously low price
   - Use duplicate images from another property
   - Verify fraud score is high
   - Verify property is flagged for review

3. **Admin Review**:
   - Review flagged property as admin
   - Accept or reject based on review
   - Verify status changes

### Price Prediction

1. **Accuracy Testing**:
   - Enter property details with known market value
   - Compare prediction with expected value
   - Verify prediction is within reasonable range

2. **Edge Cases**:
   - Test with unusual property configurations
   - Test with extreme values (very high/low)
   - Verify predictions handle edge cases gracefully

### Recommendations

1. **New User Testing**:
   - Create new tenant account with no history
   - Verify initial recommendations are reasonable
   - Verify recommendations use default preferences

2. **Personalized Recommendations**:
   - Search for specific property types
   - Save several properties
   - Verify recommendations adjust to preferences
   - Verify saved properties affect recommendations

## Performance Testing

### Page Load Performance

1. **Initial Load**:
   - Measure time to first contentful paint
   - Measure time to interactive
   - Test on various connection speeds

2. **Search Performance**:
   - Measure time to load search results
   - Test with various filter combinations
   - Verify performance with large result sets

3. **Image Loading**:
   - Verify lazy loading of images
   - Measure image load times
   - Test with multiple images per property

### API Performance

1. **Response Times**:
   - Measure typical API response times
   - Test under load with concurrent requests
   - Identify slow endpoints

2. **Error Handling**:
   - Test API with invalid inputs
   - Verify proper error responses
   - Test recovery from service failures

### Database Performance

1. **Query Performance**:
   - Identify slow queries using Supabase dashboard
   - Test with larger datasets
   - Verify index usage for common queries

2. **Connection Management**:
   - Verify proper connection pooling
   - Test with concurrent users
   - Check for connection leaks

## Mobile Responsiveness Testing

### Device Testing

Test the application on:
- iPhone (small screen)
- Android tablet (medium screen)
- Desktop (large screen)

### Responsive Layout

For each key page, verify:
- All content is accessible on mobile
- Navigation works on small screens
- Forms are usable on touch devices
- Images resize appropriately
- Text is readable at all sizes

### Touch Interaction

Verify:
- Touch targets are large enough
- Swipe gestures work where implemented
- No hover-dependent functionality

## Test Data Generation

### Sample Data Scripts

Use the provided scripts to generate test data:

```bash
# Import sample property data
npm run import-data

# Generate test users
node scripts/generate-test-users.js
```

### Manual Test Data

Create the following test scenarios manually:

1. **Landlord with multiple properties**:
   - Various property types
   - Different price ranges
   - Different locations

2. **Tenant with booking history**:
   - Pending bookings
   - Approved bookings
   - Rejected bookings

3. **Properties with reviews**:
   - High-rated properties
   - Low-rated properties
   - Properties with multiple reviews

## Test Automation

### Current Automated Tests

The project includes:
- TypeScript type checking (`npm run type-check`)
- Environment validation (`npm run check-env`)
- Schema validation (`npm run inspect-schema`)

### Recommended Additional Tests

1. **Unit Tests**:
   - Component rendering tests
   - Utility function tests
   - Form validation tests

2. **Integration Tests**:
   - API endpoint tests
   - Authentication flow tests
   - Booking flow tests

3. **End-to-End Tests**:
   - User registration to booking
   - Property creation to approval
   - Search to booking completion

## Known Issues

### Authentication Issues

1. **Issue**: Occasional RLS policy recursion errors
   **Reproduction**: Rapidly switch between users in different tabs
   **Workaround**: Clear browser session and login again

2. **Issue**: Email verification flow inconsistency
   **Reproduction**: Register new user and check email flow
   **Workaround**: Use magic link login instead

### UI/UX Issues

1. **Issue**: Form validation errors sometimes unclear
   **Reproduction**: Submit forms with various invalid inputs
   **Workaround**: Check each field individually

2. **Issue**: Image upload modal occasionally fails
   **Reproduction**: Upload multiple large images quickly
   **Workaround**: Upload one image at a time

### Performance Issues

1. **Issue**: Property search slow with many filters
   **Reproduction**: Apply all filters simultaneously
   **Workaround**: Use fewer filters or more specific location

2. **Issue**: ML API calls slow during peak times
   **Reproduction**: Create properties during high traffic
   **Workaround**: Retry submission

### Database Issues

1. **Issue**: Some RLS policies too restrictive
   **Reproduction**: Try accessing permitted resources
   **Workaround**: Use admin access when needed

---

## Test Reporting

When reporting test results or bugs, include:

1. **Environment details**:
   - Browser and version
   - Device/screen size
   - Network conditions

2. **Steps to reproduce**:
   - Precise steps that lead to the issue
   - Test account used
   - Any relevant data

3. **Expected vs. actual behavior**:
   - What should have happened
   - What actually happened
   - Any error messages

4. **Screenshots/recordings**:
   - Visual evidence of the issue
   - Console logs if applicable

---

Last updated: August 14, 2025
