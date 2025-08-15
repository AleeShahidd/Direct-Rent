"use client"
import { useEffect, useState } from 'react';
import { Property } from '@/types';
import { Button } from '@/components/ui/button';
import { PropertyCard } from '@/components/property/PropertyCard';
import { 
  Heart,
  Search,
  Trash2,
  Eye,
  MapPin,
  DollarSign
} from 'lucide-react';
import { getRandomHouseImage } from '@/lib/utils';

interface SavedPropertiesTabProps {
  savedProperties: Property[];
  onRemoveSaved: (propertyId: string) => void;
  onViewProperty: (id: string) => void;
}

export default function SavedPropertiesTab({
  savedProperties,
  onRemoveSaved,
  onViewProperty
}: SavedPropertiesTabProps) {
  const [img, setImg] = useState<string>('');

  useEffect(() => {
    getRandomHouseImage().then(setImg);
  }, []);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Saved Properties</h2>
          <p className="text-gray-600 mt-1">
            {savedProperties.length} {savedProperties.length === 1 ? 'property' : 'properties'} saved
          </p>
        </div>
        <Button onClick={() => window.location.href = '/search'}>
          <Search className="h-4 w-4 mr-2" />
          Find More Properties
        </Button>
      </div>

      {/* Saved Properties Grid */}
      {savedProperties.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {savedProperties.map((property) => (
            <div key={property.id} className="relative group">
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
                {/* Property Image */}
                <div className="h-48 relative">
                  <img
                    src={property.images && property.images.length > 0 ? property.images[0] : img}
                    alt={property.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-white shadow-sm text-red-600 border-red-200 hover:bg-red-50"
                      onClick={() => onRemoveSaved(property.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="absolute top-3 left-3">
                    <div className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium flex items-center">
                      <Heart className="h-3 w-3 mr-1 fill-current" />
                      Saved
                    </div>
                  </div>
                </div>
                
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                    {property.title}
                  </h3>
                  
                  <div className="flex items-center text-sm text-gray-600 mb-3">
                    <MapPin className="h-4 w-4 mr-1" />
                    <span className="line-clamp-1">
                      {property.address || property.address_line_1}, {property.city}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span>{property.bedrooms} bed</span>
                      <span>{property.bathrooms} bath</span>
                      <span className="capitalize">{property.property_type}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <DollarSign className="h-4 w-4 text-gray-400 mr-1" />
                      <span className="text-lg font-bold text-blue-600">
                        {formatPrice(property.price || property.price_per_month)}
                      </span>
                      <span className="text-sm text-gray-500 ml-1">/month</span>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2 mt-4">
                    <Button
                      className="flex-1"
                      onClick={() => onViewProperty(property.id)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => onRemoveSaved(property.id)}
                      className="text-red-600 border-red-200 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl p-12 text-center">
          <Heart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No saved properties</h3>
          <p className="text-gray-500 mb-6">
            Start browsing properties and save your favorites to keep track of them
          </p>
          <Button onClick={() => window.location.href = '/search'}>
            <Search className="h-4 w-4 mr-2" />
            Browse Properties
          </Button>
        </div>
      )}

      {/* Quick Stats */}
      {savedProperties.length > 0 && (
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Saved Properties</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {savedProperties.length}
              </div>
              <div className="text-sm text-gray-600">Total Saved</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {formatPrice(
                  savedProperties.reduce((avg, p) => avg + (p.price || p.price_per_month || 0), 0) / savedProperties.length
                )}
              </div>
              <div className="text-sm text-gray-600">Average Price</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {Math.round(
                  savedProperties.reduce((avg, p) => avg + p.bedrooms, 0) / savedProperties.length * 10
                ) / 10}
              </div>
              <div className="text-sm text-gray-600">Avg Bedrooms</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
