import { useState, useEffect, useCallback } from 'react';
import GoogleMap from '../ui/GoogleMap';
import { Property, MapBounds } from '@/types/enhanced';
import { googleMapsService } from '@/lib/google-maps';

interface SearchMapProps {
  properties: Property[];
  height?: string;
  width?: string;
  className?: string;
  onPropertySelect?: (propertyId: string) => void;
  onBoundsChange?: (bounds: MapBounds) => void;
  initialCenter?: { lat: number; lng: number };
  initialZoom?: number;
}

export default function SearchMap({
  properties,
  height = '600px',
  width = '100%',
  className = '',
  onPropertySelect,
  onBoundsChange,
  initialCenter,
  initialZoom = 12
}: SearchMapProps) {
  const [center, setCenter] = useState(initialCenter || { lat: 51.509865, lng: -0.118092 }); // Default London
  const [zoom, setZoom] = useState(initialZoom);
  
  const markers = properties
    .filter(p => p.latitude && p.longitude)
    .map(property => ({
      id: property.id,
      location: {
        latitude: property.latitude || 0,
        longitude: property.longitude || 0,
        address: `${property.address_line_1}, ${property.city}, ${property.postcode}`,
        postcode: property.postcode
      },
      property: property,
      popup_content: `
        <div class="p-3">
          <h3 class="font-semibold">${property.title}</h3>
          <p class="text-sm">${property.property_type} - £${property.rent_amount}/${property.price_frequency}</p>
          <p class="text-sm">${property.bedrooms} bed, ${property.bathrooms} bath</p>
          <p class="text-xs">${property.address_line_1}, ${property.city}, ${property.postcode}</p>
          <button class="view-property-btn mt-2 text-blue-600 text-sm font-medium" data-property-id="${property.id}">
            View Property
          </button>
        </div>
      `
    }));

  // Get initial bounds based on properties
  useEffect(() => {
    if (properties.length > 0 && !initialCenter) {
      const bounds = googleMapsService.getMapBounds(properties);
      if (bounds) {
        // Calculate center from bounds
        const centerLat = (bounds.north + bounds.south) / 2;
        const centerLng = (bounds.east + bounds.west) / 2;
        setCenter({ lat: centerLat, lng: centerLng });
      }
    }
  }, [properties, initialCenter]);

  const handleMarkerClick = useCallback((marker: any) => {
    if (onPropertySelect && marker.property) {
      onPropertySelect(marker.property.id);
    }
  }, [onPropertySelect]);

  const handleBoundsChange = useCallback((bounds: MapBounds) => {
    if (onBoundsChange) {
      onBoundsChange(bounds);
    }
  }, [onBoundsChange]);

  const handleMapLoad = useCallback((map: google.maps.Map) => {
    // Add click listener for the custom buttons in InfoWindows
    map.addListener('click', (e: any) => {
      if (e.domEvent && e.domEvent.target) {
        const target = e.domEvent.target as HTMLElement;
        if (target.classList.contains('view-property-btn')) {
          const propertyId = target.getAttribute('data-property-id');
          if (propertyId && onPropertySelect) {
            onPropertySelect(propertyId);
          }
        }
      }
    });
  }, [onPropertySelect]);

  return (
    <div className={`rounded-lg overflow-hidden ${className}`}>
      <GoogleMap
        center={center}
        zoom={zoom}
        markers={markers}
        height={height}
        width={width}
        onMarkerClick={handleMarkerClick}
        onBoundsChange={handleBoundsChange}
        onZoomChange={setZoom}
        onLoad={handleMapLoad}
      />
    </div>
  );
}
