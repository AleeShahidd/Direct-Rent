import { useState, useEffect, useCallback, useRef } from 'react';
import GoogleMap from '../ui/GoogleMap';
import { Property, MapBounds } from '@/types/enhanced';
import { googleMapsService } from '@/lib/google-maps';
import { Button } from '../ui/button';
import { MapIcon, ListBulletIcon, AdjustmentsHorizontalIcon, ArrowsPointingOutIcon } from '@heroicons/react/24/outline';

interface SearchMapProps {
  properties: Property[];
  height?: string;
  width?: string;
  className?: string;
  onPropertySelect?: (propertyId: string) => void;
  onBoundsChange?: (bounds: MapBounds) => void;
  initialCenter?: { lat: number; lng: number };
  initialZoom?: number;
  isFullScreen?: boolean;
  onToggleFullScreen?: () => void;
}

export default function SearchMap({
  properties,
  height = '600px',
  width = '100%',
  className = '',
  onPropertySelect,
  onBoundsChange,
  initialCenter,
  initialZoom = 12,
  isFullScreen = false,
  onToggleFullScreen
}: SearchMapProps) {
  const [center, setCenter] = useState(initialCenter || { lat: 51.509865, lng: -0.118092 }); // Default London
  const [zoom, setZoom] = useState(initialZoom);
  const [showPropertyList, setShowPropertyList] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  
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
        <div class="p-3 max-w-[250px]">
          <h3 class="font-semibold">${property.title}</h3>
          <p class="text-sm">${property.property_type} - £${property.rent_amount || 0}/month</p>
          <p class="text-sm">${property.bedrooms} bed, ${property.bathrooms} bath</p>
          <p class="text-xs">${property.address_line_1}, ${property.city}, ${property.postcode}</p>
          <button class="view-property-btn mt-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded" data-property-id="${property.id}">
            View Details
          </button>
        </div>
      `
    }));

  // Get initial bounds based on properties
  useEffect(() => {
    if (properties.length > 0 && !initialCenter) {
      const validProperties = properties.filter(p => p.latitude && p.longitude);
      
      if (validProperties.length === 0) {
        // Default to London if no properties have coordinates
        setCenter({ lat: 51.509865, lng: -0.118092 });
        setZoom(10);
        return;
      }
      
      const bounds = googleMapsService.getMapBounds(validProperties);
      if (bounds) {
        // Calculate center from bounds
        const centerLat = (bounds.north + bounds.south) / 2;
        const centerLng = (bounds.east + bounds.west) / 2;
        setCenter({ lat: centerLat, lng: centerLng });
        
        // Adjust zoom based on the area size
        const latSpread = Math.abs(bounds.north - bounds.south);
        const lngSpread = Math.abs(bounds.east - bounds.west);
        
        // Simple algorithm to estimate appropriate zoom level based on coordinate spread
        if (latSpread < 0.01 && lngSpread < 0.01) {
          setZoom(15); // Very close properties
        } else if (latSpread < 0.05 && lngSpread < 0.05) {
          setZoom(14); // Neighborhood level
        } else if (latSpread < 0.1 && lngSpread < 0.1) {
          setZoom(13); // Small district
        } else if (latSpread < 0.3 && lngSpread < 0.3) {
          setZoom(11); // City area
        } else {
          setZoom(9); // Wider region
        }
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
    <div className={`rounded-lg overflow-hidden ${className} relative`} ref={mapContainerRef}>
      {markers.length > 0 ? (
        <>
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
            clusterMarkers={true}
          />
          
          {/* Property count badge */}
          <div className="absolute top-4 left-4 z-10 bg-white rounded-full px-3 py-1 shadow-md text-sm font-medium">
            {markers.length} {markers.length === 1 ? 'property' : 'properties'} found
          </div>
          
          {/* Controls */}
          <div className="absolute bottom-4 right-4 z-10 flex flex-col space-y-2">
            {onToggleFullScreen && (
              <Button 
                variant="secondary" 
                size="sm" 
                className="rounded-full p-2 w-10 h-10 flex items-center justify-center"
                onClick={onToggleFullScreen}
                title={isFullScreen ? "Exit full screen" : "Full screen"}
              >
                <ArrowsPointingOutIcon className="w-5 h-5" />
              </Button>
            )}
            
            <Button 
              variant="secondary" 
              size="sm" 
              className="rounded-full p-2 w-10 h-10 flex items-center justify-center"
              onClick={() => setShowPropertyList(prev => !prev)}
              title="Toggle property list"
            >
              {showPropertyList ? <MapIcon className="w-5 h-5" /> : <ListBulletIcon className="w-5 h-5" />}
            </Button>
          </div>
          
          {/* Property list sidebar */}
          {showPropertyList && (
            <div className="absolute top-0 left-0 bottom-0 w-80 bg-white shadow-lg z-10 overflow-y-auto">
              <div className="p-4 bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
                <h3 className="font-medium text-gray-900">Properties</h3>
                <p className="text-sm text-gray-500">{markers.length} results</p>
              </div>
              <div className="divide-y divide-gray-200">
                {properties.filter(p => p.latitude && p.longitude).map((property) => (
                  <div 
                    key={property.id}
                    className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => onPropertySelect && onPropertySelect(property.id)}
                  >
                    <h4 className="font-medium text-gray-900">{property.title}</h4>
                    <p className="text-sm text-gray-500">
                      {property.property_type} - £{property.rent_amount}/month
                    </p>
                    <p className="text-sm text-gray-500">
                      {property.bedrooms} bed, {property.bathrooms} bath
                    </p>
                    <p className="text-xs text-gray-400 truncate">
                      {property.address_line_1}, {property.city}, {property.postcode}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div 
          className="bg-white flex flex-col items-center justify-center" 
          style={{ height, width }}
        >
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6-3l5.553 2.276A1 1 0 0121 7.618v10.764a1 1 0 01-.553.894L15 17m0 0l-6 3m6-3V7" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No properties with coordinates</h3>
          <p className="text-gray-600 text-center px-6 mb-4">
            We couldn't display these properties on the map. Try switching to list view.
          </p>
        </div>
      )}
    </div>
  );
}
