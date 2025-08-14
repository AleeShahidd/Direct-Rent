'use client';

import React, { useState } from 'react';
import PropertyCard from './PropertyCard';
import { Button } from '@/components/ui/button';
import { usePropertySearch } from './PropertySearchProvider';
import { Property } from '@/types/enhanced';
import { Loader2 } from 'lucide-react';

const PropertyGrid = () => {
  const { properties, loading, error, loadMore, hasMore } = usePropertySearch();
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const toggleFavorite = (id: string) => {
    setFavorites((prevFavorites) => {
      const newFavorites = new Set(prevFavorites);
      if (newFavorites.has(id)) {
        newFavorites.delete(id);
      } else {
        newFavorites.add(id);
      }
      return newFavorites;
    });
  };

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <h3 className="text-lg font-medium text-red-800 mb-2">Error Loading Properties</h3>
        <p className="text-red-600">{error}</p>
        <Button 
          variant="outline" 
          className="mt-4"
          onClick={() => window.location.reload()}
        >
          Try Again
        </Button>
      </div>
    );
  }

  if (loading && properties.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-lg text-gray-700">Loading properties...</span>
      </div>
    );
  }

  if (properties.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
        <h3 className="text-xl font-medium text-gray-800 mb-2">No Properties Found</h3>
        <p className="text-gray-600 mb-6">
          We couldn't find any properties matching your search criteria.
        </p>
        <Button 
          variant="outline" 
          onClick={() => window.location.href = '/properties'}
        >
          Clear All Filters
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {properties.map((property: Property) => (
          <PropertyCard
            key={property.id}
            property={property}
            onFavorite={toggleFavorite}
            isFavorite={favorites.has(property.id)}
          />
        ))}
      </div>

      {hasMore && (
        <div className="flex justify-center pb-8">
          <Button
            onClick={loadMore}
            disabled={loading}
            variant="outline"
            size="lg"
            className="min-w-[200px]"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              'Load More Properties'
            )}
          </Button>
        </div>
      )}
    </div>
  );
};

export default PropertyGrid;
