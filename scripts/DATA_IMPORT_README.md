# UK Housing Rental Data Import

This document explains how to import the UK housing rental data from the CSV file into the DirectRent application.

## Overview

The CSV file (`dataset/uk_housing_rentals.csv`) contains UK housing rental data with the following columns:
- Description: Property description and details
- Location: City and county information
- Number of Rooms: Bedroom count
- Price: Monthly rental price

## Import Process

### Prerequisites

1. **Environment Variables**: Ensure you have the following environment variables set:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

2. **Database Setup**: Make sure your Supabase database has the correct schema with a sample landlord user.

### Running the Import

You can import the data using either of these commands:

```bash
npm run import-data
# or
npm run db:seed
```

### What the Import Does

The import script (`scripts/import-csv-data.js`) performs the following operations:

1. **Data Parsing**: Reads the CSV file and parses each row
2. **Data Cleaning**: 
   - Removes invalid price entries
   - Extracts location information (city, county)
   - Parses bedroom/bathroom counts
   - Determines property type from description
3. **Data Enhancement**:
   - Generates realistic UK postcodes
   - Adds property features (parking, garden, etc.)
   - Creates detailed descriptions
   - Sets random availability dates
4. **Database Insertion**: Inserts properties in batches to avoid overwhelming the database

### Data Transformations

| CSV Field | Database Fields | Transformation |
|-----------|----------------|----------------|
| Description | `title`, `description` | Truncated title, enhanced description |
| Location | `city`, `address_line1`, `postcode` | Parsed city, generated postcode |
| Number of Rooms | `bedrooms`, `bathrooms` | Extracted bedrooms, estimated bathrooms |
| Price | `price_per_month`, `deposit_amount` | Cleaned price, calculated deposit |

### Generated Data

The script also generates realistic UK-specific data:
- **Postcodes**: Based on city (London: SW1A 1AA, etc.)
- **Property Types**: Flat, House, Studio, Bungalow, Maisonette
- **Features**: Parking, garden, balcony, pets allowed, etc.
- **EPC Ratings**: A-G energy efficiency ratings
- **Council Tax Bands**: A-H council tax classifications

### Output

The import script provides detailed feedback:
- Progress updates during import
- Error reporting for failed insertions
- Summary statistics including:
  - Number of properties imported
  - Average rental price
  - Cities covered
  - Property types distribution

## Viewing Imported Data

After import, you can view the data in several ways:

1. **Homepage**: Featured properties section will show the latest imports
2. **Search Page**: Full property search with filters
3. **Admin Dashboard**: Complete property management interface

## Configuration

### Limiting Import Size

By default, the script imports up to 100 properties. You can modify this in the script:

```javascript
if (properties.length >= 100) break; // Change this number
```

### Batch Size

The script inserts properties in batches of 5. You can adjust this:

```javascript
const batchSize = 5; // Change this number
```

### Sample Landlord

All imported properties are assigned to a sample landlord with ID:
```javascript
const SAMPLE_LANDLORD_ID = '550e8400-e29b-41d4-a716-446655440001';
```

Make sure this user exists in your database before running the import.

## Troubleshooting

### Common Issues

1. **Missing Environment Variables**
   ```
   Error: Missing Supabase credentials
   ```
   Solution: Set `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`

2. **CSV File Not Found**
   ```
   Error: CSV file not found
   ```
   Solution: Ensure `dataset/uk_housing_rentals.csv` exists in your project

3. **Database Connection Issues**
   ```
   Error: Failed to connect to Supabase
   ```
   Solution: Check your Supabase credentials and network connection

4. **Duplicate Data**
   The script automatically handles duplicates by creating unique keys for each property.

### Viewing Logs

The script provides detailed logging:
- 🚀 Starting process
- 📊 Record counting
- ✅ Successful operations
- ❌ Errors and warnings
- 🎉 Completion summary

## Data Quality

The imported data includes:
- Realistic UK postcodes for major cities
- Property types based on description analysis
- Sensible bedroom/bathroom ratios
- Market-appropriate rental prices
- UK-specific features (EPC ratings, council tax bands)

## Next Steps

After importing the data:
1. Test the property search functionality
2. Verify the data appears correctly in the UI
3. Check that filtering and sorting work properly
4. Consider adding property images for better presentation

## API Integration

The imported properties will be available through the existing API endpoints:
- `GET /api/properties` - List all properties with filtering
- `GET /api/properties/[id]` - Get individual property details

The data structure matches the existing Property interface, ensuring seamless integration with the frontend components.
