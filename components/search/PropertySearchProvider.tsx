'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Property, SearchFilters, PaginatedResponse } from '@/types/enhanced';

interface PropertySearchContextType {
  properties: Property[];
  loading: boolean;
  error: string | null;
  filters: SearchFilters;
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  setFilters: (filters: Partial<SearchFilters>) => void;
  nextPage: () => void;
  prevPage: () => void;
  goToPage: (page: number) => void;
  refreshProperties: () => Promise<void>;
  loadMore: () => void;
  hasMore: boolean;
}

const defaultPagination = {
  total: 0,
  page: 1,
  limit: 20,
  totalPages: 0,
  hasNext: false,
  hasPrev: false,
};

const defaultFilters: SearchFilters = {
  page: 1,
  limit: 20,
  sort_by: 'newest',
};

const PropertySearchContext = createContext<PropertySearchContextType | undefined>(undefined);

export function PropertySearchProvider({ children }: { children: ReactNode }) {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFiltersState] = useState<SearchFilters>(defaultFilters);
  const [pagination, setPagination] = useState(defaultPagination);

  const fetchProperties = async (currentFilters: SearchFilters) => {
    setLoading(true);
    setError(null);
    
    try {
      // Build query string from filters
      const queryParams = new URLSearchParams();
      
      // Add all non-undefined filters to query params
      Object.entries(currentFilters).forEach(([key, value]) => {
        if (value !== undefined) {
          if (Array.isArray(value)) {
            queryParams.append(key, value.join(','));
          } else {
            queryParams.append(key, String(value));
          }
        }
      });
      
      const response = await fetch(`/api/properties?${queryParams.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Error fetching properties: ${response.statusText}`);
      }
      
      const data: PaginatedResponse<Property> = await response.json();
      
      setProperties(data.data);
      setPagination(data.pagination);
    } catch (err) {
      console.error('Failed to fetch properties:', err);
      setError((err as Error).message || 'Failed to fetch properties');
      setProperties([]);
    } finally {
      setLoading(false);
    }
  };

  // Set filters and fetch properties
  const setFilters = (newFilters: Partial<SearchFilters>) => {
    // Reset to page 1 when filters change (except when explicitly changing page)
    const resetPage = !('page' in newFilters);
    
    setFiltersState(prevFilters => {
      const updatedFilters = {
        ...prevFilters,
        ...newFilters,
        ...(resetPage ? { page: 1 } : {})
      };
      return updatedFilters;
    });
  };

  // Pagination helpers
  const nextPage = () => {
    if (pagination.hasNext) {
      setFilters({ page: pagination.page + 1 });
    }
  };

  const prevPage = () => {
    if (pagination.hasPrev) {
      setFilters({ page: pagination.page - 1 });
    }
  };

  const goToPage = (page: number) => {
    if (page >= 1 && page <= pagination.totalPages) {
      setFilters({ page });
    }
  };

  // Refresh properties with current filters
  const refreshProperties = async () => {
    await fetchProperties(filters);
  };
  
  // Load more properties (for infinite scroll)
  const loadMore = () => {
    if (pagination.hasNext) {
      setFilters({ page: pagination.page + 1 });
    }
  };
  
  // Convenience property for checking if more properties are available
  const hasMore = pagination.hasNext;

  // Fetch properties when filters change
  useEffect(() => {
    fetchProperties(filters);
  }, [filters]);

  return (
    <PropertySearchContext.Provider
      value={{
        properties,
        loading,
        error,
        filters,
        pagination,
        setFilters,
        nextPage,
        prevPage,
        goToPage,
        refreshProperties,
        loadMore,
        hasMore,
      }}
    >
      {children}
    </PropertySearchContext.Provider>
  );
}

export function usePropertySearch() {
  const context = useContext(PropertySearchContext);
  
  if (context === undefined) {
    throw new Error('usePropertySearch must be used within a PropertySearchProvider');
  }
  
  return context;
}
