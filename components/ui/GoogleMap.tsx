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
  clusterMarkers?: boolean;
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
  clusterMarkers = true
}: GoogleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<Array<google.maps.marker.AdvancedMarkerElement>>([]);
  const markerClustererRef = useRef<any>(null);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Initialize Google Maps
  useEffect(() => {
    if (!mapRef.current || mapLoaded) return;
    
    const loader = new Loader({
      apiKey: GOOGLE_MAPS_CONFIG.apiKey,
      version: 'weekly',
      libraries: ['places', 'marker']
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
        
        // Create a shared info window instance
        infoWindowRef.current = new google.maps.InfoWindow();
        
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
        
        // Add click listener for the custom buttons in InfoWindows
        mapInstance.addListener('click', (e: any) => {
          if (e.domEvent && e.domEvent.target) {
            const target = e.domEvent.target as HTMLElement;
            if (target.classList.contains('view-property-btn')) {
              const propertyId = target.getAttribute('data-property-id');
              if (propertyId && onMarkerClick) {
                // Find the original marker data
                const markerData = markers.find(m => m.id === propertyId);
                if (markerData) {
                  onMarkerClick(markerData);
                }
              }
            }
          }
        });
      })
      .catch(err => {
        console.error('Error loading Google Maps:', err);
      });

    return () => {
      // Clean up markers when component unmounts
      if (markersRef.current.length > 0) {
        markersRef.current.forEach(marker => marker.map = null);
        markersRef.current = [];
      }
      
      // Clean up clusterer if it exists
      if (markerClustererRef.current) {
        markerClustererRef.current.clearMarkers();
        markerClustererRef.current = null;
      }
    };
  }, [center, zoom, clickable, draggable, onMapClick, onBoundsChange, onZoomChange, onLoad, mapLoaded, markers]);

  // Update markers when they change
  useEffect(() => {
    if (!googleMapRef.current || !mapLoaded || markers.length === 0) return;

    // Load marker clusterer dynamically
    const loadMarkerClusterer = async () => {
      // Import the MarkerClusterer class
      if (clusterMarkers && markers.length > 1) {
        try {
          const { MarkerClusterer } = await import('@googlemaps/markerclusterer');
          return MarkerClusterer;
        } catch (error) {
          console.error('Error loading MarkerClusterer:', error);
          return null;
        }
      }
      return null;
    };

    const setupMarkers = async () => {
      // Clear existing markers
      markersRef.current.forEach(marker => marker.map = null);
      markersRef.current = [];
      
      // Clear existing clusterer
      if (markerClustererRef.current) {
        markerClustererRef.current.clearMarkers();
        markerClustererRef.current = null;
      }

      const MarkerClusterer = await loadMarkerClusterer();
      const newAdvancedMarkers: google.maps.marker.AdvancedMarkerElement[] = [];
      
      // Create markers with the new AdvancedMarkerElement
      for (const markerData of markers) {
        if (!markerData.location.latitude || !markerData.location.longitude) continue;
        
        const position = {
          lat: markerData.location.latitude,
          lng: markerData.location.longitude
        };

        // Create pin element
        const pinElement = document.createElement('div');
        pinElement.className = 'property-marker';
        
        // Create different styles for featured properties
        if (markerData.property?.featured) {
          pinElement.innerHTML = `
            <div class="flex items-center justify-center w-10 h-10 bg-blue-600 text-white rounded-full shadow-lg border-2 border-white hover:bg-blue-700 transition-all transform hover:scale-110" 
                 data-marker-id="${markerData.id}">
              <span class="text-xs font-bold">£${markerData.property.rent_amount}</span>
            </div>
          `;
        } else {
          pinElement.innerHTML = `
            <div class="flex items-center justify-center w-8 h-8 bg-red-500 text-white rounded-full shadow-md border-2 border-white hover:bg-red-600 transition-all transform hover:scale-110" 
                 data-marker-id="${markerData.id}">
              <span class="text-xs font-bold">£${markerData.property?.rent_amount}</span>
            </div>
          `;
        }
        
        // Create the advanced marker
        const advancedMarker = new google.maps.marker.AdvancedMarkerElement({
          map: googleMapRef.current,
          position,
          content: pinElement,
          title: markerData.property?.title || '',
        });
        
        // Store the original marker data with the advanced marker
        advancedMarker.dataset = { ...markerData };
        
        // Add click event for info window
        advancedMarker.addListener('click', () => {
          if (infoWindowRef.current && markerData.popup_content) {
            infoWindowRef.current.setContent(markerData.popup_content);
            infoWindowRef.current.open(googleMapRef.current, advancedMarker);
          }
          
          if (onMarkerClick) {
            onMarkerClick(markerData);
          }
        });
        
        newAdvancedMarkers.push(advancedMarker);
      }
      
      // Add markers to reference
      markersRef.current = newAdvancedMarkers;
      
      // Apply clustering if needed and available
      if (MarkerClusterer && clusterMarkers && newAdvancedMarkers.length > 1) {
        markerClustererRef.current = new MarkerClusterer({
          markers: newAdvancedMarkers,
          map: googleMapRef.current,
          renderer: {
            render: ({ count, position }) => {
              const cluster = document.createElement("div");
              cluster.className = "marker-cluster";
              cluster.innerHTML = `
                <div class="flex items-center justify-center w-12 h-12 bg-blue-800 text-white rounded-full shadow-lg border-2 border-white">
                  <span class="text-sm font-bold">${count}</span>
                </div>
              `;
              
              return new google.maps.marker.AdvancedMarkerElement({
                map: googleMapRef.current,
                position,
                content: cluster,
                zIndex: 1000,
              });
            },
          },
        });
      }

      // Fit bounds to markers if there are any
      if (newAdvancedMarkers.length > 0) {
        const bounds = new google.maps.LatLngBounds();
        newAdvancedMarkers.forEach(marker => {
          if (marker.position) {
            bounds.extend(marker.position);
          }
        });
        googleMapRef.current.fitBounds(bounds);
        
        // Don't zoom in too far
        if (googleMapRef.current.getZoom()! > 15) {
          googleMapRef.current.setZoom(15);
        }
      }
    };
    
    setupMarkers();
  }, [markers, mapLoaded, onMarkerClick, clusterMarkers]);

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
    >
      {/* Map control panel */}
      {mapLoaded && (
        <div className="absolute top-3 right-3 z-10 bg-white rounded-md shadow-md p-2 flex flex-col space-y-2">
          <button 
            className="w-8 h-8 flex items-center justify-center bg-white rounded-full shadow-sm hover:bg-gray-100"
            onClick={() => {
              if (googleMapRef.current) {
                googleMapRef.current.setZoom((googleMapRef.current.getZoom() || zoom) + 1);
              }
            }}
            aria-label="Zoom in"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
          </button>
          <button 
            className="w-8 h-8 flex items-center justify-center bg-white rounded-full shadow-sm hover:bg-gray-100"
            onClick={() => {
              if (googleMapRef.current) {
                googleMapRef.current.setZoom((googleMapRef.current.getZoom() || zoom) - 1);
              }
            }}
            aria-label="Zoom out"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
          </button>
          
          {/* Fit to markers button */}
          {markers.length > 1 && (
            <button 
              className="w-8 h-8 flex items-center justify-center bg-white rounded-full shadow-sm hover:bg-gray-100"
              onClick={() => {
                if (googleMapRef.current && markersRef.current.length > 0) {
                  const bounds = new google.maps.LatLngBounds();
                  markersRef.current.forEach(marker => {
                    if (marker.position) {
                      bounds.extend(marker.position);
                    }
                  });
                  googleMapRef.current.fitBounds(bounds);
                  // Don't zoom in too far
                  if (googleMapRef.current.getZoom()! > 15) {
                    googleMapRef.current.setZoom(15);
                  }
                }
              }}
              aria-label="Fit all markers"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 01-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12zm-9 7a1 1 0 012 0v1.586l2.293-2.293a1 1 0 011.414 1.414L6.414 15H8a1 1 0 010 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 010-2h1.586l-2.293-2.293a1 1 0 011.414-1.414L15 13.586V12a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
