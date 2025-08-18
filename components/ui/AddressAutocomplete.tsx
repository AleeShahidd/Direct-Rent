import { useState, useEffect, useRef } from 'react';
import useGoogleMaps from '@/hooks/useGoogleMaps';

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (place: {
    address: string;
    latitude: number;
    longitude: number;
    components: Record<string, string>;
  }) => void;
  placeholder?: string;
  className?: string;
  restrictToUK?: boolean;
  disabled?: boolean;
}

export default function AddressAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = 'Enter an address',
  className = '',
  restrictToUK = true,
  disabled = false
}: AddressAutocompleteProps) {
  const { isLoaded } = useGoogleMaps();
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  // Initialize autocomplete when Google Maps is loaded
  useEffect(() => {
    if (!isLoaded || !inputRef.current) return;

    const options: google.maps.places.AutocompleteOptions = {
      fields: ['address_components', 'formatted_address', 'geometry', 'name'],
    };

    if (restrictToUK) {
      options.componentRestrictions = { country: 'gb' };
    }

    autocompleteRef.current = new google.maps.places.Autocomplete(
      inputRef.current,
      options
    );

    // Listen for place selection
    autocompleteRef.current.addListener('place_changed', () => {
      if (!autocompleteRef.current) return;

      const place = autocompleteRef.current.getPlace();
      
      if (!place.geometry || !place.geometry.location) {
        console.log('No location data for this place');
        return;
      }

      // Extract address components
      const components: Record<string, string> = {};
      if (place.address_components) {
        place.address_components.forEach(component => {
          const type = component.types[0];
          components[type] = component.long_name;
        });
      }

      // Format and call onSelect callback
      if (onSelect) {
        onSelect({
          address: place.formatted_address || '',
          latitude: place.geometry.location.lat(),
          longitude: place.geometry.location.lng(),
          components
        });
      }

      // Update input value
      onChange(place.formatted_address || '');
    });

    return () => {
      // Clean up
      if (autocompleteRef.current && google.maps && google.maps.event) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [isLoaded, onSelect, onChange, restrictToUK]);

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  return (
    <input
      ref={inputRef}
      type="text"
      value={value}
      onChange={handleInputChange}
      placeholder={placeholder}
      className={`w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
      disabled={disabled || !isLoaded}
    />
  );
}
