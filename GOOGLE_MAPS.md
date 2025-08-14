# Google Maps Integration

This document provides an overview of the Google Maps integration in the Direct-Rent UK platform.

## Components Created

1. **GoogleMap** - Base Google Maps component
   - Location: `components/ui/GoogleMap.tsx`
   - Features: 
     - Displays interactive Google Maps
     - Supports markers with customizable icons
     - Handles map events (click, bounds change, zoom)
     - Custom info windows for properties
   
2. **PropertyMap** - Map for property details page
   - Location: `components/property/PropertyMap.tsx`
   - Features:
     - Shows property location
     - Optionally displays nearby properties
     - Custom styling for featured properties
   
3. **SearchMap** - Map for property search results
   - Location: `components/search/SearchMap.tsx`
   - Features:
     - Displays multiple property search results
     - Interactive markers with property details
     - Handles property selection

4. **AddressAutocomplete** - Address search component
   - Location: `components/ui/AddressAutocomplete.tsx`
   - Features:
     - Google Places autocomplete integration
     - UK-specific address search
     - Returns geocoded coordinates

## Supporting Files

1. **Type Definitions**
   - Location: `types/google-maps.d.ts`
   - Purpose: TypeScript definitions for Google Maps API

2. **Google Maps Service**
   - Location: `lib/google-maps.ts`
   - Features:
     - Geocoding services
     - Places API integration
     - Distance calculations
     - UK-specific address formatting

3. **Custom Hook**
   - Location: `hooks/useGoogleMaps.ts`
   - Purpose: React hook for loading Google Maps scripts

## Integration Points

The Google Maps integration is used in several key areas:

1. **Property Details Page**
   - Shows property location
   - Helps users understand the neighborhood

2. **Property Search Page**
   - Map view of search results
   - Visual representation of property locations

3. **Property Creation Form**
   - Address lookup and validation
   - Automatic geocoding of addresses

4. **Admin Dashboard**
   - Property distribution visualization
   - Geographical analytics

## Configuration

The Google Maps API key is stored in the environment variable:
```
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
```

## Usage Examples

### Basic Map
```jsx
<GoogleMap 
  center={{ lat: 51.509865, lng: -0.118092 }}
  zoom={12}
  height="400px"
/>
```

### Property Map
```jsx
<PropertyMap 
  property={property}
  showNearbyProperties={true}
  nearbyProperties={otherProperties}
/>
```

### Search Map
```jsx
<SearchMap
  properties={searchResults}
  onPropertySelect={handlePropertySelect}
  onBoundsChange={handleBoundsChange}
/>
```

### Address Autocomplete
```jsx
<AddressAutocomplete
  value={address}
  onChange={setAddress}
  onSelect={handleAddressSelect}
  restrictToUK={true}
/>
```

## Future Improvements

1. **Clustering for Large Result Sets**
   - Implement marker clustering for better visualization when many properties are shown

2. **Draw Tools**
   - Allow users to draw areas on the map to search within custom boundaries

3. **Street View Integration**
   - Add direct Street View access from property maps

4. **Transit Information**
   - Show nearby transit options and walking distances

5. **Mobile Optimization**
   - Further optimize map interactions for mobile devices

## API Usage Limits

The Google Maps API has usage limits:
- Standard Plan: 28,500 map loads per month
- Consider implementing caching strategies for static map data
- Monitor usage through Google Cloud Console

---

Last updated: August 14, 2025
