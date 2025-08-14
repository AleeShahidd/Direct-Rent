'use client';

import React from 'react';
import { PropertySearchProvider } from './PropertySearchProvider';
import PropertyFilters from './PropertyFilters';
import PropertyGrid from './PropertyGrid';

const PropertySearchPage = () => {
  return (
    <PropertySearchProvider>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Find Your Next Home</h1>
        
        <PropertyFilters />
        
        <PropertyGrid />
      </div>
    </PropertySearchProvider>
  );
};

export default PropertySearchPage;
