import { useState, useEffect } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { GOOGLE_MAPS_CONFIG } from '@/lib/google-maps';

interface UseGoogleMapsOptions {
  libraries?: string[];
}

export function useGoogleMaps({ 
  libraries = ['places'] 
}: UseGoogleMapsOptions = {}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState<Error | null>(null);

  useEffect(() => {
    const loader = new Loader({
      apiKey: GOOGLE_MAPS_CONFIG.apiKey,
      version: 'weekly',
      libraries: libraries as any
    });

    loader.load()
      .then(() => {
        setIsLoaded(true);
      })
      .catch(error => {
        setLoadError(error);
        console.log('Error loading Google Maps:', error);
      });
  }, [libraries]);

  return { isLoaded, loadError };
}

export default useGoogleMaps;
