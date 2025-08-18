"use client";

import { useState, useEffect } from 'react';
import { Tab } from '@headlessui/react';
import { Property } from '@/types/enhanced';
import { PropertyCard } from '@/components/property/PropertyCard';
import { PropertyLocationCard } from '@/components/property/PropertyLocationCard';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { MapIcon, HomeIcon, TrendingUpIcon, ClockIcon } from 'lucide-react';

// Helper function to check if a property is in a trending area
const isTrendingArea = (property: Property): boolean => {
  // Example trending areas - you can customize this list based on your data
  const trendingAreas = [
    'London', 'Manchester', 'Birmingham', 'Bristol', 'Leeds', 
    'Edinburgh', 'Glasgow', 'Liverpool', 'Oxford', 'Cambridge'
  ];
  
  return trendingAreas.some(area => 
    property.city?.toLowerCase().includes(area.toLowerCase()) ||
    property.address_line_1?.toLowerCase().includes(area.toLowerCase())
  );
};

export function PropertiesTab() {
  const [selectedTab, setSelectedTab] = useState(0);
  const [properties, setProperties] = useState<Property[]>([]);
  const [trending, setTrending] = useState<Property[]>([]);
  const [recent, setRecent] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        setLoading(true);
        
        // Featured properties
        const { data: featuredData, error: featuredError } = await supabase
          .from('properties')
          .select('*')
          .eq('status', 'active')
          .eq('featured', true)
          .order('created_at', { ascending: false })
          .limit(6);
          
        if (featuredError) throw featuredError;
        
        // Recent properties
        const { data: recentData, error: recentError } = await supabase
          .from('properties')
          .select('*')
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(6);
          
        if (recentError) throw recentError;
        
        // Get all properties for trending filtering
        const { data: allData, error: allError } = await supabase
          .from('properties')
          .select('*')
          .eq('status', 'active')
          .limit(50);
          
        if (allError) throw allError;
        
        // Filter trending properties by area
        const trendingProperties = allData
          .filter(isTrendingArea)
          .sort(() => 0.5 - Math.random()) // Shuffle
          .slice(0, 6); // Take 6 random trending properties
        
        setProperties(featuredData || []);
        setRecent(recentData || []);
        setTrending(trendingProperties);
        
      } catch (err) {
        console.log('Error fetching properties:', err);
        setError('Failed to load properties. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchProperties();
  }, []);

  const categories = [
    { name: 'Featured', icon: <HomeIcon className="w-5 h-5" /> },
    { name: 'Trending Areas', icon: <TrendingUpIcon className="w-5 h-5" /> },
    { name: 'Recently Added', icon: <ClockIcon className="w-5 h-5" /> },
  ];

  return (
    <div className="w-full">
      <Tab.Group selectedIndex={selectedTab} onChange={setSelectedTab}>
        <Tab.List className="flex space-x-1 rounded-xl bg-blue-100 p-1 mb-6">
          {categories.map((category, index) => (
            <Tab
              key={index}
              className={({ selected }) =>
                cn(
                  'w-full py-3 text-sm font-medium leading-5 rounded-lg',
                  'flex items-center justify-center',
                  selected
                    ? 'bg-white text-blue-700 shadow'
                    : 'text-blue-700 hover:bg-white/[0.5] hover:text-blue-700'
                )
              }
            >
              <span className="mr-2">{category.icon}</span>
              {category.name}
            </Tab>
          ))}
        </Tab.List>
        
        <Tab.Panels>
          {/* Featured Properties */}
          <Tab.Panel>
            {loading ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner />
              </div>
            ) : error ? (
              <div className="text-center py-12 text-red-500">{error}</div>
            ) : properties.length === 0 ? (
              <div className="text-center py-12 text-gray-500">No featured properties available.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {properties.map((property) => (
                  <PropertyCard key={property.id} property={property} />
                ))}
              </div>
            )}
          </Tab.Panel>
          
          {/* Trending Areas */}
          <Tab.Panel>
            {loading ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner />
              </div>
            ) : error ? (
              <div className="text-center py-12 text-red-500">{error}</div>
            ) : trending.length === 0 ? (
              <div className="text-center py-12 text-gray-500">No trending properties available.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {trending.map((property) => (
                  <PropertyLocationCard 
                    key={property.id} 
                    property={property}
                    mapType="roadmap"
                    zoom={14}
                  />
                ))}
              </div>
            )}
          </Tab.Panel>
          
          {/* Recently Added */}
          <Tab.Panel>
            {loading ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner />
              </div>
            ) : error ? (
              <div className="text-center py-12 text-red-500">{error}</div>
            ) : recent.length === 0 ? (
              <div className="text-center py-12 text-gray-500">No recent properties available.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {recent.map((property) => (
                  <PropertyCard key={property.id} property={property} />
                ))}
              </div>
            )}
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>
    </div>
  );
}
