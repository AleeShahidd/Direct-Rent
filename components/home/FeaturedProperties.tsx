'use client';

import { useState, useEffect } from 'react';
import { Property } from '@/types';
import { PropertyCard } from '@/components/property/PropertyCard';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export function FeaturedProperties() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeaturedProperties = async () => {
      try {
        const response = await fetch('/api/properties?limit=6&sort_by=newest');
        if (response.ok) {
          const data = await response.json();
          setProperties(data.data || []);
        }
      } catch (error) {
        console.error('Error fetching featured properties:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedProperties();
  }, []);

  if (loading) {
    return (
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Featured Properties</h2>
            <p className="text-lg text-gray-600">Discover our handpicked selection of premium rental properties</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-300 h-48 rounded-lg mb-4"></div>
                <div className="h-4 bg-gray-300 rounded mb-2"></div>
                <div className="h-4 bg-gray-300 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Featured Properties</h2>
          <p className="text-lg text-gray-600">Discover our handpicked selection of premium rental properties</p>
        </div>
        
        {properties.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
              {properties.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
            <div className="text-center">
              <Link href="/search">
                <Button size="lg">
                  View All Properties
                </Button>
              </Link>
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">No featured properties available at the moment.</p>
            <Link href="/search">
              <Button>
                Browse All Properties
              </Button>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

export default FeaturedProperties;
