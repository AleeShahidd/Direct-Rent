'use client';

import { useEffect, useRef, useState } from 'react';
import { Property, MapLocation } from '@/types/enhanced';
import { LoadingSpinner as Loader } from '@/components/ui/loading-spinner';

interface PropertyMapProps {
  property: Property;
  height?: string;
  className?: string;
  zoom?: number;
  showInfoWindow?: boolean;
}

const PropertyMap = ({
  property,
  height = '300px',
  className = '',
  zoom = 15,
  showInfoWindow = true
}: PropertyMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [mapLoaded, setMapLoaded] = useState(false);
  
  // Load Google Maps API script
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      console.error('Google Maps API key is not defined');
      setLoading(false);
      return;
    }
    
    // Check if Google Maps API is already loaded
    if (window.google && window.google.maps) {
      setMapLoaded(true);
      setLoading(false);
      return;
    }
    
    // Load Google Maps API script with necessary libraries
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&v=weekly`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      console.log('Google Maps API loaded successfully');
      setMapLoaded(true);
      setLoading(false);
    };
    script.onerror = () => {
      console.error('Failed to load Google Maps API');
      setLoading(false);
    };
    
    document.head.appendChild(script);
    
    return () => {
      // Cleanup script if component unmounts before script loads
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);
  
  // Initialize map when API is loaded and property data is available
  useEffect(() => {
    if (!mapLoaded || !mapRef.current || !property.latitude || !property.longitude) {
      return;
    }
    
    const position = {
      lat: property.latitude,
      lng: property.longitude
    };

    // Custom map style for a cleaner look
    const mapStyles = [
      {
        featureType: 'poi',
        elementType: 'labels',
        stylers: [{ visibility: 'off' }]
      },
      {
        featureType: 'transit',
        elementType: 'labels',
        stylers: [{ visibility: 'off' }]
      },
      {
        featureType: 'water',
        elementType: 'geometry',
        stylers: [{ color: '#e9e9e9' }]
      },
      {
        featureType: 'landscape',
        elementType: 'geometry',
        stylers: [{ color: '#f5f5f5' }]
      },
      {
        featureType: 'road',
        elementType: 'geometry',
        stylers: [{ color: '#ffffff' }]
      },
      {
        featureType: 'road.arterial',
        elementType: 'labels.text.fill',
        stylers: [{ color: '#757575' }]
      },
      {
        featureType: 'road.highway',
        elementType: 'geometry',
        stylers: [{ color: '#dadada' }]
      }
    ];
    
    // @ts-ignore - Using any to bypass TypeScript errors with Google Maps API
    const map = new google.maps.Map(mapRef.current, {
      center: position,
      zoom: zoom,
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      mapTypeControl: false,
      streetViewControl: true,
      fullscreenControl: true,
      zoomControl: true,
      gestureHandling: 'cooperative',
      styles: mapStyles
    });
    
    // Create marker with custom color
    const marker = new google.maps.Marker({
      position,
      map,
      title: property.title || 'Property',
      // @ts-ignore
      animation: google.maps.Animation.DROP,
    });
    
    // Format price for display
    const formatPrice = (price: number) => {
      return new Intl.NumberFormat('en-GB', {
        style: 'currency',
        currency: 'GBP',
        minimumFractionDigits: 0,
      }).format(price);
    };
    
      // Create info window if enabled
      if (showInfoWindow) {
        const price = property.rent_amount || 0;
        const formattedPrice = formatPrice(price);
        
        const infoWindowContent = `
          <div style="padding: 12px; max-width: 250px; font-family: Arial, sans-serif;">
            <h3 style="margin: 0 0 8px; font-size: 16px; font-weight: bold; color: #1f2937;">${property.title || 'Property'}</h3>
            <div style="margin: 0 0 8px; font-size: 14px; color: #4b5563;">
              ${property.bedrooms} bed, ${property.bathrooms} bath ${property.property_type}
            </div>
            <div style="margin: 0 0 8px; font-size: 14px; color: #4b5563;">
              ${property.address_line_1 || ''}, ${property.postcode}
            </div>
            <div style="margin: 0; font-size: 16px; font-weight: bold; color: #4f46e5;">
              ${formattedPrice}/month
            </div>
          </div>
        `;
        
        // @ts-ignore - Using any to bypass TypeScript errors with Google Maps API
        const infoWindow = new google.maps.InfoWindow({
          content: infoWindowContent
        });      // Open info window on marker click
      marker.addListener('click', () => {
        infoWindow.open(map, marker);
      });
      
      // Show info window by default
      infoWindow.open(map, marker);
    }
    
    // Add nearby points of interest if location coordinates are available
    if (property.latitude && property.longitude && window.google.maps.places) {
      try {
        // @ts-ignore
        const service = new google.maps.places.PlacesService(map);
        
        // Search for nearby points of interest
        const searchNearby = (type: string, icon: string) => {
          const request = {
            location: position,
            radius: 1000, // 1km radius
            type: type
          };
          
          service.nearbySearch(request, (results: any, status: any) => {
            // @ts-ignore
            if (status === google.maps.places.PlacesServiceStatus.OK && results) {
              // Limit to first 3 results
              results.slice(0, 3).forEach((place: any) => {
                if (place.geometry && place.geometry.location) {
                  // Create a marker for each nearby place
                  const poiMarker = new google.maps.Marker({
                    map,
                    position: place.geometry.location,
                    title: place.name,
                    icon: {
                      url: `https://maps.google.com/mapfiles/ms/icons/${icon}.png`,
                      // @ts-ignore
                      scaledSize: new google.maps.Size(20, 20)
                    }
                  });
                  
                  // Add info window for the POI
                  const poiInfoWindow = new google.maps.InfoWindow({
                    content: `
                      <div style="padding: 8px; max-width: 200px; font-family: Arial, sans-serif;">
                        <h4 style="margin: 0 0 4px; font-size: 14px; font-weight: bold;">${place.name}</h4>
                        <p style="margin: 0; font-size: 12px; color: #4b5563;">${place.vicinity}</p>
                      </div>
                    `
                  });
                  
                  poiMarker.addListener('click', () => {
                    poiInfoWindow.open(map, poiMarker);
                  });
                }
              });
            }
          });
        };
        
        // Search for different types of places
        searchNearby('supermarket', 'yellow');
        searchNearby('restaurant', 'red');
        searchNearby('train_station', 'blue');
        searchNearby('bus_station', 'green');
      } catch (error) {
        console.error('Error loading places:', error);
      }
    }
    
    // Add transit layer to show public transport routes
    try {
      // @ts-ignore
      const transitLayer = new google.maps.TransitLayer();
      transitLayer.setMap(map);
    } catch (error) {
      console.error('Error loading transit layer:', error);
    }
    
    // Add resize listener to ensure map renders correctly
    const resizeListener = window.addEventListener('resize', () => {
      // @ts-ignore
      const center = map.getCenter();
      // @ts-ignore
      google.maps.event.trigger(map, 'resize');
      map.setCenter(center);
    });
    
    return () => {
      window.removeEventListener('resize', resizeListener as any);
    };
  }, [mapLoaded, property, zoom, showInfoWindow]);
  
  const [isGeocoding, setIsGeocoding] = useState(false);
  
  // Try to geocode the address if coordinates are not available
  useEffect(() => {
    if (!property.latitude || !property.longitude) {
      const geocodeAddress = async () => {
        if (property.address_line_1 && property.postcode) {
          setIsGeocoding(true);
          
          try {
            const { googleMapsService } = await import('@/lib/google-maps');
            const address = `${property.address_line_1}, ${property.city || ''}, ${property.postcode}, UK`;
            
            const results = await googleMapsService.geocodeAddress(address);
            
            if (results && results.length > 0) {
              // Update property with coordinates directly in the component state
              property.latitude = results[0].position.lat;
              property.longitude = results[0].position.lng;
              setMapLoaded(false); // Reset map loaded state to trigger a re-render
              setTimeout(() => setMapLoaded(true), 100);
            }
          } catch (error) {
            console.error('Error geocoding in PropertyMap:', error);
          } finally {
            setIsGeocoding(false);
          }
        }
      };
      
      geocodeAddress();
    }
  }, [property]);
  
  if (isGeocoding) {
    return (
      <div 
        className={`bg-gray-100 flex items-center justify-center rounded-lg ${className}`}
        style={{ height }}
      >
        <div className="flex flex-col items-center">
          <Loader />
          <p className="text-gray-500 mt-2">Finding location...</p>
        </div>
      </div>
    );
  }
  
  if (!property.latitude || !property.longitude) {
    return (
      <div 
        className={`bg-gray-100 flex items-center justify-center rounded-lg ${className}`}
        style={{ height }}
      >
        <p className="text-gray-500">Location not available</p>
      </div>
    );
  }
  
  return (
    <div className={className} style={{ height, width: '100%', position: 'relative' }}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
          <Loader />
        </div>
      )}
      <div 
        ref={mapRef} 
        className="rounded-lg w-full h-full"
        style={{ display: loading ? 'none' : 'block' }}
      />
    </div>
  );
};

export default PropertyMap;
