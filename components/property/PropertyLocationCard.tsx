"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Property } from "@/types/enhanced";
import { formatPrice, getLocationMapImage } from "@/lib/utils";
import { MapPin, Bed, Bath, Heart, Map } from "lucide-react";

interface PropertyLocationCardProps {
  property: Property;
  showSaveButton?: boolean;
  showDistance?: boolean;
  onSave?: (propertyId: string) => void;
  onUnsave?: (propertyId: string) => void;
  className?: string;
  mapType?: 'roadmap' | 'satellite' | 'hybrid' | 'terrain';
  zoom?: number;
}

export function PropertyLocationCard({
  property,
  showSaveButton = true,
  showDistance = false,
  onSave,
  onUnsave,
  className = "",
  mapType = "roadmap",
  zoom = 14
}: PropertyLocationCardProps) {
  const [isSaved, setIsSaved] = useState(false);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [mapUrl, setMapUrl] = useState<string>('');

  const handleSaveToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isSaved) {
      onUnsave?.(property.id);
      setIsSaved(false);
    } else {
      onSave?.(property.id);
      setIsSaved(true);
    }
  };

  // Generate map image URL
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
            size: `600x300`,
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
            size: `600x300`,
            mapType
          }
        );
        setMapUrl(url);
      } else {
        throw new Error('No location data available');
      }
    } catch (err) {
      console.error('Error generating map image:', err);
    }
  }, [property, mapType, zoom]);

  // Fetch the actual image URL from our API
  useEffect(() => {
    if (!mapUrl) return;
    
    const fetchMapImageUrl = async () => {
      try {
        const response = await fetch(mapUrl);
        if (!response.ok) throw new Error('Failed to get map image URL');
        
        const data = await response.json();
        setMapUrl(data.url);
        setIsImageLoaded(true);
      } catch (err) {
        console.error('Error fetching map image URL:', err);
      }
    };
    
    fetchMapImageUrl();
  }, [mapUrl]);

  const price = property.rent_amount;

  return (
    <div
      className={`bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 ${className}`}
    >
      <Link href={`/properties/${property.id}`}>
        <div className="relative">
          {/* Property Map Image */}
          <div className="relative h-48 bg-gray-200 overflow-hidden">
            {isImageLoaded ? (
              <Image
                src={mapUrl}
                alt={`Map of ${property.address_line_1}, ${property.city}`}
                fill
                className="object-cover w-full h-full"
                onLoad={() => setIsImageLoaded(true)}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <Map className="w-12 h-12 text-gray-400" />
              </div>
            )}
          </div>

          {/* Save Button */}
          {showSaveButton && (
            <button
              onClick={handleSaveToggle}
              className="absolute top-3 right-3 p-2 bg-white/90 rounded-full hover:bg-white transition-colors duration-200"
              aria-label={isSaved ? "Remove from saved" : "Save property"}
            >
              {isSaved ? (
                <Heart className="w-5 h-5 text-red-500 fill-current" />
              ) : (
                <Heart className="w-5 h-5 text-gray-600" />
              )}
            </button>
          )}

          {/* Property Type Badge */}
          <div className="absolute top-3 left-3">
            <span className="bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium capitalize">
              {property.property_type}
            </span>
          </div>

          {/* Location Badge */}
          <div className="absolute bottom-3 left-3 bg-white/90 px-2 py-1 rounded text-xs font-medium">
            {property.city}, {property.postcode}
          </div>
        </div>

        {/* Property Details */}
        <div className="p-4">
          {/* Price */}
          <div className="flex items-center justify-between mb-2">
            <div className="text-2xl font-bold text-blue-600">
              {formatPrice(price)}
            </div>
            <div className="text-sm text-gray-600">per month</div>
          </div>

          {/* Title */}
          <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
            {property.title}
          </h3>

          {/* Location */}
          <div className="flex items-start text-gray-600 mb-3">
            <MapPin className="w-4 h-4 mr-1 flex-shrink-0 mt-0.5" />
            <span className="text-sm line-clamp-2">
              {property.address_line_1}, {property.city}
            </span>
          </div>

          {/* Property Features */}
          <div className="flex items-center space-x-4 text-gray-600 mb-3">
            <div className="flex items-center">
              <Bed className="w-4 h-4 mr-1" />
              <span className="text-sm">{property.bedrooms}</span>
            </div>
            <div className="flex items-center">
              <Bath className="w-4 h-4 mr-1" />
              <span className="text-sm">{property.bathrooms}</span>
            </div>
          </div>

          {/* Furnishing Status */}
          <div className="flex items-center justify-between">
            <span className="text-sm bg-gray-100 text-gray-700 px-2 py-1 rounded capitalize">
              {property.furnishing_status?.replace("_", " ")}
            </span>
            {showDistance && (
              <span className="text-sm text-gray-500">2.1 miles away</span>
            )}
          </div>

          {/* Available From */}
          {property.available_from && (
            <div className="mt-2 text-sm text-gray-600">
              Available from{" "}
              {new Date(property.available_from).toLocaleDateString()}
            </div>
          )}
        </div>
      </Link>
    </div>
  );
}
