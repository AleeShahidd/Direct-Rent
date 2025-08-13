// Google Maps configuration and utilities
import { MapLocation, MapMarker, MapBounds } from '@/types/enhanced';

export interface GoogleMapsConfig {
  apiKey: string;
  language: string;
  region: string;
}

export const GOOGLE_MAPS_CONFIG: GoogleMapsConfig = {
  apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  language: 'en',
  region: 'GB'
};

// Google Maps API endpoints
export const GOOGLE_MAPS_ENDPOINTS = {
  geocode: 'https://maps.googleapis.com/maps/api/geocode/json',
  places: 'https://maps.googleapis.com/maps/api/place/autocomplete/json',
  placeDetails: 'https://maps.googleapis.com/maps/api/place/details/json'
};

export interface SearchAddressParams {
  query: string;
  region?: string;
  bounds?: string;
  components?: string;
  language?: string;
}

export interface GeocodeResult {
  address: string;
  position: {
    lat: number;
    lng: number;
  };
  types: string[];
  place_id: string;
  formatted_address: string;
}

export interface PlaceAutocompleteResult {
  description: string;
  place_id: string;
  types: string[];
  terms: Array<{
    offset: number;
    value: string;
  }>;
}

// Google Maps Service
export class GoogleMapsService {
  private static instance: GoogleMapsService;
  private config: GoogleMapsConfig;

  private constructor() {
    this.config = GOOGLE_MAPS_CONFIG;
  }

  public static getInstance(): GoogleMapsService {
    if (!GoogleMapsService.instance) {
      GoogleMapsService.instance = new GoogleMapsService();
    }
    return GoogleMapsService.instance;
  }

  // Geocode address to coordinates
  async geocodeAddress(address: string): Promise<GeocodeResult[]> {
    const url = new URL(GOOGLE_MAPS_ENDPOINTS.geocode);
    url.searchParams.append('address', address);
    url.searchParams.append('key', this.config.apiKey);
    url.searchParams.append('language', this.config.language);
    url.searchParams.append('region', this.config.region);

    try {
      const response = await fetch(url.toString());
      const data = await response.json();
      
      if (data.status === 'OK') {
        return data.results?.map((result: any) => ({
          address: result.formatted_address || '',
          position: {
            lat: result.geometry?.location?.lat || 0,
            lng: result.geometry?.location?.lng || 0
          },
          types: result.types || [],
          place_id: result.place_id || '',
          formatted_address: result.formatted_address || ''
        })) || [];
      } else {
        console.error('Google Maps geocoding error:', data.status, data.error_message);
        return [];
      }
    } catch (error) {
      console.error('Google Maps geocoding request error:', error);
      return [];
    }
  }

  // Reverse geocode coordinates to address
  async reverseGeocode(lat: number, lng: number): Promise<string | null> {
    const url = new URL(GOOGLE_MAPS_ENDPOINTS.geocode);
    url.searchParams.append('latlng', `${lat},${lng}`);
    url.searchParams.append('key', this.config.apiKey);
    url.searchParams.append('language', this.config.language);

    try {
      const response = await fetch(url.toString());
      const data = await response.json();
      
      if (data.status === 'OK' && data.results?.length > 0) {
        return data.results[0].formatted_address || null;
      } else {
        console.error('Google Maps reverse geocoding error:', data.status, data.error_message);
        return null;
      }
    } catch (error) {
      console.error('Google Maps reverse geocoding request error:', error);
      return null;
    }
  }

  // Geocode a UK postcode
  async geocodePostcode(postcode: string): Promise<MapLocation | null> {
    // Format postcode for UK
    const formattedPostcode = postcode.toUpperCase().replace(/\s+/g, ' ').trim();
    const query = `${formattedPostcode}, United Kingdom`;
    
    const results = await this.geocodeAddress(query);

    if (results.length > 0) {
      const result = results[0];
      return {
        latitude: result.position.lat,
        longitude: result.position.lng,
        address: result.formatted_address,
        postcode: formattedPostcode
      };
    }

    return null;
  }

  // Search for UK locations using Places Autocomplete
  async searchUKLocations(query: string): Promise<PlaceAutocompleteResult[]> {
    const url = new URL(GOOGLE_MAPS_ENDPOINTS.places);
    url.searchParams.append('input', query);
    url.searchParams.append('key', this.config.apiKey);
    url.searchParams.append('language', this.config.language);
    url.searchParams.append('components', 'country:gb'); // Restrict to UK
    url.searchParams.append('types', '(cities)'); // Focus on cities and localities

    try {
      const response = await fetch(url.toString());
      const data = await response.json();
      
      if (data.status === 'OK') {
        return data.predictions?.map((prediction: any) => ({
          description: prediction.description || '',
          place_id: prediction.place_id || '',
          types: prediction.types || [],
          terms: prediction.terms || []
        })) || [];
      } else {
        console.error('Google Places autocomplete error:', data.status, data.error_message);
        return [];
      }
    } catch (error) {
      console.error('Google Places autocomplete request error:', error);
      return [];
    }
  }

  // Get place details by place_id
  async getPlaceDetails(placeId: string): Promise<GeocodeResult | null> {
    const url = new URL(GOOGLE_MAPS_ENDPOINTS.placeDetails);
    url.searchParams.append('place_id', placeId);
    url.searchParams.append('key', this.config.apiKey);
    url.searchParams.append('language', this.config.language);
    url.searchParams.append('fields', 'formatted_address,geometry,types');

    try {
      const response = await fetch(url.toString());
      const data = await response.json();
      
      if (data.status === 'OK' && data.result) {
        const result = data.result;
        return {
          address: result.formatted_address || '',
          position: {
            lat: result.geometry?.location?.lat || 0,
            lng: result.geometry?.location?.lng || 0
          },
          types: result.types || [],
          place_id: placeId,
          formatted_address: result.formatted_address || ''
        };
      } else {
        console.error('Google Place details error:', data.status, data.error_message);
        return null;
      }
    } catch (error) {
      console.error('Google Place details request error:', error);
      return null;
    }
  }

  // Calculate distance between two points (in miles)
  calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 3959; // Earth's radius in miles
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  // Get properties within radius
  async getPropertiesWithinRadius(
    centerLat: number,
    centerLng: number,
    radiusMiles: number,
    properties: any[]
  ): Promise<any[]> {
    return properties.filter(property => {
      if (!property.latitude || !property.longitude) return false;
      
      const distance = this.calculateDistance(
        centerLat,
        centerLng,
        property.latitude,
        property.longitude
      );
      
      return distance <= radiusMiles;
    }).map(property => ({
      ...property,
      distance: this.calculateDistance(
        centerLat,
        centerLng,
        property.latitude,
        property.longitude
      )
    }));
  }

  // Get map bounds for a set of properties
  getMapBounds(properties: any[]): MapBounds | null {
    const locations = properties
      .filter(p => p.latitude && p.longitude)
      .map(p => ({ lat: p.latitude, lng: p.longitude }));

    if (locations.length === 0) return null;

    const lats = locations.map(l => l.lat);
    const lngs = locations.map(l => l.lng);

    return {
      north: Math.max(...lats),
      south: Math.min(...lats),
      east: Math.max(...lngs),
      west: Math.min(...lngs)
    };
  }

  // Format UK address
  formatUKAddress(address: {
    line1: string;
    line2?: string;
    city: string;
    county?: string;
    postcode: string;
  }): string {
    const parts = [
      address.line1,
      address.line2,
      address.city,
      address.county,
      address.postcode
    ].filter(Boolean);

    return parts.join(', ');
  }

  // Validate UK postcode format
  validateUKPostcode(postcode: string): boolean {
    const ukPostcodeRegex = /^[A-Z]{1,2}[0-9R][0-9A-Z]? [0-9][ABD-HJLNP-UW-Z]{2}$/i;
    return ukPostcodeRegex.test(postcode.replace(/\s/g, '').toUpperCase());
  }

  // Get popular UK cities
  getPopularUKCities(): string[] {
    return [
      'London',
      'Birmingham',
      'Manchester',
      'Liverpool',
      'Leeds',
      'Sheffield',
      'Bristol',
      'Leicester',
      'Coventry',
      'Bradford',
      'Nottingham',
      'Newcastle upon Tyne',
      'Brighton',
      'Wolverhampton',
      'Southampton',
      'Reading',
      'Derby',
      'Plymouth',
      'Luton',
      'Blackpool'
    ];
  }

  // Search for addresses with autocomplete
  async searchAddresses(params: SearchAddressParams): Promise<PlaceAutocompleteResult[]> {
    const url = new URL(GOOGLE_MAPS_ENDPOINTS.places);
    url.searchParams.append('input', params.query);
    url.searchParams.append('key', this.config.apiKey);
    url.searchParams.append('language', params.language || this.config.language);
    
    if (params.components) {
      url.searchParams.append('components', params.components);
    } else {
      url.searchParams.append('components', 'country:gb'); // Default to UK
    }

    try {
      const response = await fetch(url.toString());
      const data = await response.json();
      
      if (data.status === 'OK') {
        return data.predictions?.map((prediction: any) => ({
          description: prediction.description || '',
          place_id: prediction.place_id || '',
          types: prediction.types || [],
          terms: prediction.terms || []
        })) || [];
      } else {
        console.error('Google Places search error:', data.status, data.error_message);
        return [];
      }
    } catch (error) {
      console.error('Google Places search request error:', error);
      return [];
    }
  }
}

// Export singleton instance
export const googleMapsService = GoogleMapsService.getInstance();
