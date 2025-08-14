'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { 
  Home, 
  Bed, 
  Bath, 
  Sofa, 
  Car, 
  Calendar, 
  MapPin, 
  Heart,
  ExternalLink,
  Eye,
  Users
} from 'lucide-react';
import { Property } from '@/types/enhanced';
import { formatDistance } from 'date-fns';

interface PropertyCardProps {
  property: Property;
  onFavorite?: (id: string) => void;
  isFavorite?: boolean;
}

const PropertyCard = ({ property, onFavorite, isFavorite = false }: PropertyCardProps) => {
  const {
    id,
    title,
    description,
    property_type,
    bedrooms,
    bathrooms,
    price_per_month,
    rent_amount,
    city,
    postcode,
    furnishing_status,
    available_from,
    parking, // Using parking from the database schema
    garden, // Using garden from the database schema
    pets_allowed,
    bills_included,
    created_at,
    images, // Using images from the database schema
    view_count 
  } = property;

  // Format the created date
  const createdDate = new Date(created_at);
  const timeAgo = formatDistance(createdDate, new Date(), { addSuffix: true });
  
  // Format the available date
  const availableDate = available_from ? new Date(available_from) : null;
  const availableFormatted = availableDate ? 
    availableDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 
    'Available Now';

  // Get the main image or use a placeholder
  const imageArray = images || [];
  const mainImage = imageArray.length > 0 
    ? (typeof imageArray[0] === 'string' ? imageArray[0] : '') 
    : '/placeholder-property.jpg';

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
      <div className="relative">
        <div className="aspect-video relative overflow-hidden">
          <Image
            src={mainImage}
            alt={title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover hover:scale-105 transition-transform duration-500"
          />
        </div>
        
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          <Badge variant="secondary" className="bg-black bg-opacity-70 text-white">
            £{price_per_month || rent_amount}/month
          </Badge>
          
          {property_type && (
            <Badge variant="outline" className="bg-white">
              {property_type.charAt(0).toUpperCase() + property_type.slice(1)}
            </Badge>
          )}
        </div>
        
        <Button
          variant="ghost"
          size="icon"
          className={`absolute top-3 right-3 rounded-full bg-white ${
            isFavorite ? 'text-red-500' : 'text-gray-500'
          }`}
          onClick={() => onFavorite && onFavorite(id)}
        >
          <Heart className={`h-5 w-5 ${isFavorite ? 'fill-current' : ''}`} />
        </Button>
      </div>

      <CardHeader className="p-4 pb-2">
        <div className="flex justify-between items-start">
          <h3 className="text-xl font-semibold line-clamp-1">{title}</h3>
          <div className="flex items-center text-gray-500 text-sm">
            <Eye className="h-4 w-4 mr-1" />
            <span>{view_count || 0}</span>
          </div>
        </div>
        <div className="flex items-center text-gray-500 mt-1">
          <MapPin className="h-4 w-4 mr-1" />
          <span className="text-sm">{city}{postcode ? `, ${postcode}` : ''}</span>
        </div>
      </CardHeader>
      
      <CardContent className="p-4 pt-2">
        <p className="text-gray-600 text-sm line-clamp-2 mb-3">{description}</p>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
          <div className="flex items-center text-sm text-gray-600">
            <Bed className="h-4 w-4 mr-1" />
            <span>{bedrooms} {bedrooms === 1 ? 'Bed' : 'Beds'}</span>
          </div>
          
          <div className="flex items-center text-sm text-gray-600">
            <Bath className="h-4 w-4 mr-1" />
            <span>{bathrooms} {bathrooms === 1 ? 'Bath' : 'Baths'}</span>
          </div>
          
          {furnishing_status && (
            <div className="flex items-center text-sm text-gray-600">
              <Sofa className="h-4 w-4 mr-1" />
              <span className="capitalize">{furnishing_status.replace('_', ' ')}</span>
            </div>
          )}
          
          <div className="flex items-center text-sm text-gray-600">
            <Calendar className="h-4 w-4 mr-1" />
            <span>{availableFormatted}</span>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {parking && (
            <Badge variant="outline" className="text-xs">
              <Car className="h-3 w-3 mr-1" /> Parking
            </Badge>
          )}
          
          {garden && (
            <Badge variant="outline" className="text-xs">
              Garden
            </Badge>
          )}
          
          {pets_allowed && (
            <Badge variant="outline" className="text-xs">
              Pets Allowed
            </Badge>
          )}
          
          {bills_included && (
            <Badge variant="outline" className="text-xs">
              Bills Included
            </Badge>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="p-4 pt-0 flex items-center justify-between">
        <span className="text-xs text-gray-500">Added {timeAgo}</span>
        <Link href={`/properties/${id}`} passHref>
          <Button size="sm" className="gap-1">
            View Details
            <ExternalLink className="h-4 w-4" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
};

export default PropertyCard;
