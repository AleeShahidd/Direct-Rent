import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Property } from '@/types/enhanced';
import { getLocationMapImage } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';
import { MapIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

interface PropertyLocationMapProps {
  property: Property;
  className?: string;
  width?: number;
  height?: number;
  withLink?: boolean;
  mapType?: 'roadmap' | 'satellite' | 'hybrid' | 'terrain';
  zoom?: number;
}

export default function PropertyLocationMap({
  property,
  className,
  width = 600,
  height = 400,
  withLink = true,
  mapType = 'roadmap',
  zoom = 15
}: PropertyLocationMapProps) {
  const [mapUrl, setMapUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      // Generate a location map image URL
      if (property.latitude && property.longitude) {
        const url = getLocationMapImage(
          property.latitude,
          property.longitude,
          null,
          {
            zoom,
            size: `${width}x${height}`,
            mapType
          }
        );
        setMapUrl(url);
      } else if (property.address_line_1 && property.city && property.postcode) {
        // If no coordinates, use address
        const address = `${property.address_line_1}, ${property.city}, ${property.postcode}, UK`;
        const url = getLocationMapImage(
          null,
          null,
          address,
          {
            zoom,
            size: `${width}x${height}`,
            mapType
          }
        );
        setMapUrl(url);
      } else {
        throw new Error('No location data available');
      }
      
      setIsLoading(false);
    } catch (err) {
      console.error('Error generating map image:', err);
      setError('Could not load location map');
      setIsLoading(false);
    }
  }, [property, width, height, mapType, zoom]);

  // Fetch the actual image URL from our API
  useEffect(() => {
    if (!mapUrl) return;
    
    const fetchMapImageUrl = async () => {
      try {
        const response = await fetch(mapUrl);
        if (!response.ok) throw new Error('Failed to get map image URL');
        
        const data = await response.json();
        setMapUrl(data.url);
      } catch (err) {
        console.error('Error fetching map image URL:', err);
        setError('Could not load location map');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchMapImageUrl();
  }, [mapUrl]);

  const fullAddress = `${property.address_line_1}, ${property.city}, ${property.postcode}`;
  
  // Google Maps directions URL
  const getDirectionsUrl = () => {
    if (property.latitude && property.longitude) {
      return `https://www.google.com/maps/dir/?api=1&destination=${property.latitude},${property.longitude}`;
    }
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(fullAddress)}`;
  };

  // Google Maps view location URL
  const getViewLocationUrl = () => {
    if (property.latitude && property.longitude) {
      return `https://www.google.com/maps/search/?api=1&query=${property.latitude},${property.longitude}`;
    }
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`;
  };

  if (isLoading) {
    return (
      <div 
        className={cn(
          "relative rounded-lg bg-gray-100 animate-pulse flex items-center justify-center", 
          className
        )}
        style={{ width, height }}
      >
        <MapIcon className="w-12 h-12 text-gray-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div 
        className={cn(
          "relative rounded-lg bg-gray-100 flex flex-col items-center justify-center", 
          className
        )}
        style={{ width, height }}
      >
        <MapIcon className="w-12 h-12 text-gray-400 mb-2" />
        <p className="text-gray-500 text-sm">{error}</p>
        <Link 
          href={getViewLocationUrl()} 
          target="_blank" 
          rel="noopener noreferrer"
          className="mt-2 text-blue-600 hover:underline text-sm"
        >
          View on Google Maps
        </Link>
      </div>
    );
  }

  return (
    <div className={cn("relative rounded-lg overflow-hidden", className)} style={{ width, height }}>
      {/* Map Image */}
      <Image
        src={mapUrl}
        alt={`Map of ${property.address_line_1}, ${property.city}`}
        width={width}
        height={height}
        className="object-cover w-full h-full"
      />
      
      {/* Map Controls */}
      {withLink && (
        <div className="absolute bottom-3 right-3 flex flex-col space-y-2">
          <Link 
            href={getViewLocationUrl()} 
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button size="sm" variant="secondary" className="shadow-md w-full">
              <MapIcon className="w-4 h-4 mr-1" />
              View on Maps
            </Button>
          </Link>
          
          <Link 
            href={getDirectionsUrl()} 
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button size="sm" variant="secondary" className="shadow-md w-full">
              Get Directions
            </Button>
          </Link>
        </div>
      )}
      
      {/* Location Badge */}
      <div className="absolute top-3 left-3 bg-white/90 px-3 py-1 rounded-full text-sm font-medium shadow-sm">
        {property.city}, {property.postcode}
      </div>
    </div>
  );
}
