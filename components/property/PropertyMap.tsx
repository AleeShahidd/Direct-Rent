import { useMemo } from 'react';
import GoogleMap from '../ui/GoogleMap';
import { Property } from '@/types';

interface PropertyMapProps {
  property: Property;
  height?: string;
  width?: string;
  className?: string;
  showNearbyProperties?: boolean;
  nearbyProperties?: Property[];
}

export default function PropertyMap({ 
  property, 
  height = '400px',
  width = '100%',
  className = '',
  showNearbyProperties = false,
  nearbyProperties = []
}: PropertyMapProps) {
  const center = useMemo(() => {
    if (!property.latitude || !property.longitude) {
      return { lat: 51.509865, lng: -0.118092 }; // Default London
    }
    return { lat: property.latitude, lng: property.longitude };
  }, [property]);

  const markers = useMemo(() => {
    const mainMarker = {
      id: property.id,
      location: {
        latitude: property.latitude || 51.509865,
        longitude: property.longitude || -0.118092,
        address: `${property.address_line_1}, ${property.city}, ${property.postcode}`,
        postcode: property.postcode
      },
      property: property,
      popup_content: `
        <div class="p-2">
          <h3 class="font-semibold">${property.title}</h3>
          <p class="text-sm">${property.property_type} - £${property.price || property.rent_amount}/month</p>
          <p class="text-xs">${property.address_line_1}, ${property.city}, ${property.postcode}</p>
        </div>
      `
    };

    if (!showNearbyProperties || nearbyProperties.length === 0) {
      return [mainMarker];
    }

    // Add nearby properties if enabled
    const nearbyMarkers = nearbyProperties
      .filter(p => p.id !== property.id && p.latitude && p.longitude)
      .map(p => ({
        id: p.id,
        location: {
          latitude: p.latitude || 0,
          longitude: p.longitude || 0,
          address: `${p.address_line_1}, ${p.city}, ${p.postcode}`,
          postcode: p.postcode
        },
        property: p,
        popup_content: `
          <div class="p-2">
            <h3 class="font-semibold">${p.title}</h3>
            <p class="text-sm">${p.property_type} - £${p.rent_amount}/${p.price_frequency}</p>
            <p class="text-xs">${p.address_line_1}, ${p.city}, ${p.postcode}</p>
          </div>
        `
      }));

    return [mainMarker, ...nearbyMarkers];
  }, [property, showNearbyProperties, nearbyProperties]);

  return (
    <div className={`rounded-lg overflow-hidden ${className}`}>
      <GoogleMap 
        center={center}
        zoom={15}
        markers={markers}
        height={height}
        width={width}
        draggable={true}
      />
    </div>
  );
}
