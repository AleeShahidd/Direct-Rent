import { useState, useEffect, useRef, useCallback } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { GOOGLE_MAPS_CONFIG } from '@/lib/google-maps';
import { MapLocation, MapMarker, MapBounds } from '@/types/enhanced';

interface GoogleMapProps {
  center?: { lat: number; lng: number };
  zoom?: number;
  markers?: MapMarker[];
  height?: string;
  width?: string;
  className?: string;
  clickable?: boolean;
  draggable?: boolean;
  onMapClick?: (location: { lat: number; lng: number }) => void;
  onMarkerClick?: (marker: MapMarker) => void;
  onBoundsChange?: (bounds: MapBounds) => void;
  onZoomChange?: (zoom: number) => void;
  onLoad?: (map: google.maps.Map) => void;
}

export default function GoogleMap({
  center = { lat: 51.509865, lng: -0.118092 }, // London center as default
  zoom = 10,
  markers = [],
  height = '400px',
  width = '100%',
  className = '',
  clickable = false,
  draggable = true,
  onMapClick,
  onMarkerClick,
  onBoundsChange,
  onZoomChange,
  onLoad,
}: GoogleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Initialize Google Maps
  useEffect(() => {
    if (!mapRef.current || mapLoaded) return;
    
    const loader = new Loader({
      apiKey: GOOGLE_MAPS_CONFIG.apiKey,
      version: 'weekly',
      libraries: ['places']
    });

    loader.load()
      .then(() => {
        if (!mapRef.current) return;
        
        const mapInstance = new google.maps.Map(mapRef.current, {
          center,
          zoom,
          mapTypeControl: true,
          streetViewControl: true,
          fullscreenControl: true,
          zoomControl: true,
          mapTypeId: google.maps.MapTypeId.ROADMAP,
          gestureHandling: draggable ? 'greedy' : 'none',
          styles: [
            {
              featureType: 'poi',
              elementType: 'labels',
              stylers: [{ visibility: 'off' }]
            }
          ]
        });

        googleMapRef.current = mapInstance;
        setMapLoaded(true);
        
        if (onLoad) {
          onLoad(mapInstance);
        }

        // Add event listeners
        if (clickable && onMapClick) {
          mapInstance.addListener('click', (e: google.maps.MapMouseEvent) => {
            if (e.latLng) {
              onMapClick({
                lat: e.latLng.lat(),
                lng: e.latLng.lng()
              });
            }
          });
        }

        if (onBoundsChange) {
          mapInstance.addListener('bounds_changed', () => {
            const bounds = mapInstance.getBounds();
            if (bounds) {
              const ne = bounds.getNorthEast();
              const sw = bounds.getSouthWest();
              onBoundsChange({
                north: ne.lat(),
                east: ne.lng(),
                south: sw.lat(),
                west: sw.lng()
              });
            }
          });
        }

        if (onZoomChange) {
          mapInstance.addListener('zoom_changed', () => {
            onZoomChange(mapInstance.getZoom() || zoom);
          });
        }
      })
      .catch(err => {
        console.error('Error loading Google Maps:', err);
      });

    return () => {
      // Clean up markers when component unmounts
      if (markersRef.current.length > 0) {
        markersRef.current.forEach(marker => marker.setMap(null));
        markersRef.current = [];
      }
    };
  }, [center, zoom, clickable, draggable, onMapClick, onBoundsChange, onZoomChange, onLoad, mapLoaded]);

  // Update markers when they change
  useEffect(() => {
    if (!googleMapRef.current || !mapLoaded || markers.length === 0) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // Add new markers
    markers.forEach(markerData => {
      if (!markerData.location.latitude || !markerData.location.longitude) return;
      
      const position = {
        lat: markerData.location.latitude,
        lng: markerData.location.longitude
      };

      const marker = new google.maps.Marker({
        position,
        map: googleMapRef.current,
        title: markerData.property?.title || '',
        animation: google.maps.Animation.DROP,
        icon: markerData.property?.featured 
          ? { 
              url: '/images/featured-marker.png',
              scaledSize: new google.maps.Size(40, 40)
            }
          : undefined
      });

      // Add click event
      if (onMarkerClick) {
        marker.addListener('click', () => {
          onMarkerClick(markerData);
        });
      }

      // Add info window if popup content is provided
      if (markerData.popup_content) {
        const infoWindow = new google.maps.InfoWindow({
          content: markerData.popup_content
        });

        marker.addListener('click', () => {
          infoWindow.open(googleMapRef.current, marker);
        });
      }

      markersRef.current.push(marker);
    });

    // Fit bounds to markers if there are any
    if (markersRef.current.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      markersRef.current.forEach(marker => {
        if (marker.getPosition()) {
          bounds.extend(marker.getPosition()!);
        }
      });
      googleMapRef.current.fitBounds(bounds);
      
      // Don't zoom in too far
      if (googleMapRef.current.getZoom()! > 15) {
        googleMapRef.current.setZoom(15);
      }
    }
  }, [markers, mapLoaded, onMarkerClick]);

  // Update center and zoom when they change
  useEffect(() => {
    if (!googleMapRef.current || !mapLoaded) return;
    
    googleMapRef.current.setCenter(center);
    googleMapRef.current.setZoom(zoom);
  }, [center, zoom, mapLoaded]);

  return (
    <div 
      ref={mapRef} 
      style={{ height, width }} 
      className={`relative rounded-lg overflow-hidden shadow-md ${className}`}
      aria-label="Google Map"
    />
  );
}
