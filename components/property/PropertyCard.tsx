"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Property } from "@/types/enhanced";
import { formatPrice, getRandomHouseImage } from "@/lib/utils";
import { MapPin, Bed, Bath, Heart, Camera } from "lucide-react";
import { get } from "http";

interface PropertyCardProps {
  property: Property;
  showSaveButton?: boolean;
  showDistance?: boolean;
  onSave?: (propertyId: string) => void;
  onUnsave?: (propertyId: string) => void;
  className?: string;
}

export function PropertyCard({
  property,
  showSaveButton = true,
  showDistance = false,
  onSave,
  onUnsave,
  className = "",
}: PropertyCardProps) {
  const [isSaved, setIsSaved] = useState(false);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [img, setImg] = useState<string>("/placeholder-property.jpg");

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

  useEffect(() => {
    getRandomHouseImage(property.id)
      .then(imageUrl => {
        if (imageUrl && imageUrl.trim() !== '') {
          setImg(imageUrl);
        }
      })
      .catch(() => {
        // Keep the default placeholder if there's an error
      });
  }, [property.id]);

  // ✅ Fallback to random UK house image if no DB image
  const mainImage = (() => {
    // If there are images in the property
    if (property.images && property.images.length > 0) {
      const firstImage = property.images[0];
      
      // Check if image is a string
      if (typeof firstImage === 'string') {
        return firstImage.trim() !== '' ? firstImage : '/placeholder-property.jpg';
      }
      
      // Check if image is an object with url property
      if (typeof firstImage === 'object' && firstImage !== null && firstImage !== "") {
        // @ts-ignore - TypeScript doesn't know the structure
        const url = firstImage.url;
        return url && typeof url === 'string' && url.trim() !== '' 
          ? url 
          : '/placeholder-property.jpg';
      }
      
      return '/placeholder-property.jpg';
    }
    
    // If no property images, use the random image or fallback
    return img && img.trim() !== '' ? img : '/placeholder-property.jpg';
  })();

  const price = property.rent_amount;

  return (
    <div
      className={`bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 ${className}`}
    >
      <Link href={`/properties/${property.id}`}>
        <div className="relative">
          {/* Property Image */}
          <div className="relative h-48 bg-gray-200 overflow-hidden">
            {mainImage && (
              <img
                src={mainImage}
                alt={property.title || "Property Image"}
                className={`object-cover w-full h-full transition-opacity duration-300 ${
                  isImageLoaded ? "opacity-100" : "opacity-0"
                }`}
                onLoad={() => setIsImageLoaded(true)}
              />
            )}
            {!isImageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Camera className="w-12 h-12 text-gray-400" />
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

          {/* Image Count */}
          {property.images && property.images.length > 1 && (
            <div className="absolute bottom-3 right-3">
              <span className="bg-black/70 text-white px-2 py-1 rounded text-xs">
                +{property.images.length - 1} more
              </span>
            </div>
          )}
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

          {/* EPC Rating */}
          {property.epc_rating && (
            <div className="mt-2">
              <span
                className={`inline-block px-2 py-1 rounded text-xs font-bold text-white ${
                  property.epc_rating === "A"
                    ? "bg-green-600"
                    : property.epc_rating === "B"
                    ? "bg-green-500"
                    : property.epc_rating === "C"
                    ? "bg-yellow-500"
                    : property.epc_rating === "D"
                    ? "bg-orange-500"
                    : property.epc_rating === "E"
                    ? "bg-red-500"
                    : property.epc_rating === "F"
                    ? "bg-red-600"
                    : "bg-red-700"
                }`}
              >
                EPC {property.epc_rating}
              </span>
            </div>
          )}
        </div>
      </Link>
    </div>
  );
}
