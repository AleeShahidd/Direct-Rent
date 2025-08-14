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
    
    // Load Google Maps API script
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
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
    
    // Create map instance
    const map = new google.maps.Map(mapRef.current, {
      center: position,
      zoom: zoom,
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
      zoomControl: true,
      gestureHandling: 'cooperative'
    });
    
    // Create marker
    const marker = new google.maps.Marker({
      position,
      map,
      title: property.title || 'Property',
      animation: google.maps.Animation.DROP
    });
    
    // Create info window if enabled
    if (showInfoWindow) {
      const infoWindowContent = `
        <div style="padding: 8px; max-width: 200px;">
          <h3 style="margin: 0 0 8px; font-size: 16px; font-weight: bold;">${property.title || 'Property'}</h3>
          <p style="margin: 0 0 8px; font-size: 14px;">
            ${property.bedrooms} bed, ${property.bathrooms} bath ${property.property_type}
          </p>
          <p style="margin: 0; font-size: 14px; font-weight: bold;">
            £${property.price || 0}/month
          </p>
        </div>
      `;
      
      const infoWindow = new google.maps.InfoWindow({
        content: infoWindowContent
      });
      
      // Open info window on marker click
      marker.addListener('click', () => {
        infoWindow.open(map, marker);
      });
      
      // Optionally show info window by default
      // infoWindow.open(map, marker);
    }
    
    // Add resize listener to ensure map renders correctly
    const resizeListener = window.addEventListener('resize', () => {
      // Get the center (using any as a workaround)
      const center = (map as any).getCenter();
      // Manually trigger resize (using any as a workaround)
      if (google.maps.event) {
        (google.maps.event as any).trigger(map, 'resize');
      }
      map.setCenter(center);
    });
    
    return () => {
      window.removeEventListener('resize', resizeListener as any);
    };
  }, [mapLoaded, property, zoom, showInfoWindow]);
  
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
