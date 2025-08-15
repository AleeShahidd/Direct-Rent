"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import { Property, PropertySearchFilters } from "../../types/enhanced";
import { PropertyCard } from "../../components/property/PropertyCard";
import { SearchFilters } from "../../components/search/SearchFilters";
import { LoadingSpinner } from "../../components/ui/loading-spinner";
import { Button } from "../../components/ui/button";
import { MapIcon, ListBulletIcon } from "@heroicons/react/24/outline";
import SearchMap from "@/components/search/SearchMap";

function SearchPageContent() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [geocodingProperties, setGeocodingProperties] = useState(false);
  const [error, setError] = useState("");
  const [totalResults, setTotalResults] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [filters, setFilters] = useState<PropertySearchFilters>({
    page: 1,
    limit: 12,
  });

  const searchParams = useSearchParams();
  const router = useRouter();

  // Initialize filters from URL params
  useEffect(() => {
    const urlFilters: PropertySearchFilters = {
      page: 1,
      limit: 12,
    };

    if (searchParams.get("location")) {
      urlFilters.postcode = searchParams.get("location") || undefined;
      urlFilters.city = searchParams.get("location") || undefined;
    }
    if (searchParams.get("property_type")) {
      urlFilters.property_type = [searchParams.get("property_type")!];
    }
    if (searchParams.get("min_price")) {
      urlFilters.min_price = parseInt(searchParams.get("min_price")!);
    }
    if (searchParams.get("max_price")) {
      urlFilters.max_price = parseInt(searchParams.get("max_price")!);
    }
    if (searchParams.get("min_bedrooms")) {
      urlFilters.min_bedrooms = parseInt(searchParams.get("min_bedrooms")!);
    }
    if (searchParams.get("max_bedrooms")) {
      urlFilters.max_bedrooms = parseInt(searchParams.get("max_bedrooms")!);
    }

    setFilters(urlFilters);
  }, [searchParams]);

  const searchProperties = useCallback(
    async (searchFilters: PropertySearchFilters) => {
      setLoading(true);
      setError("");

      try {
        let query = supabase
          .from("properties")
          .select(
            `
          *        `
          )
          .eq("status", "active");

        // Apply filters
        if (searchFilters.postcode) {
          query = query.ilike("postcode", `%${searchFilters.postcode}%`);
        }
        if (searchFilters.city) {
          query = query.ilike("city", `%${searchFilters.city}%`);
        }
        if (
          searchFilters.property_type &&
          searchFilters.property_type.length > 0
        ) {
          query = query.in("property_type", searchFilters.property_type);
        }
        if (searchFilters.min_price) {
          query = query.gte("rent_amount", searchFilters.min_price);
        }
        if (searchFilters.max_price) {
          query = query.lte("rent_amount", searchFilters.max_price);
        }
        if (searchFilters.min_bedrooms) {
          query = query.gte("bedrooms", searchFilters.min_bedrooms);
        }
        if (searchFilters.max_bedrooms) {
          query = query.lte("bedrooms", searchFilters.max_bedrooms);
        }
        if (
          searchFilters.furnishing_status &&
          searchFilters.furnishing_status.length > 0
        ) {
          query = query.in(
            "furnishing_status",
            searchFilters.furnishing_status
          );
        }
        if (
          searchFilters.council_tax_band &&
          searchFilters.council_tax_band.length > 0
        ) {
          query = query.in("council_tax_band", searchFilters.council_tax_band);
        }
        if (searchFilters.epc_rating && searchFilters.epc_rating.length > 0) {
          query = query.in("epc_rating", searchFilters.epc_rating);
        }
        if (searchFilters.parking) {
          query = query.gt("parking_spaces", 0);
        }
        if (searchFilters.garden) {
          query = query.eq("has_garden", true);
        }
        if (searchFilters.pets_allowed) {
          query = query.eq("pets_allowed", true);
        }

        // Apply sorting
        switch (searchFilters.sort_by) {
          case "price_asc":
            query = query.order("rent_amount", { ascending: true });
            break;
          case "price_desc":
            query = query.order("rent_amount", { ascending: false });
            break;
          case "newest":
            query = query.order("created_at", { ascending: false });
            break;
          case "oldest":
            query = query.order("created_at", { ascending: true });
            break;
          default:
            query = query.order("created_at", { ascending: false });
        }

        // Apply pagination
        const from =
          ((searchFilters.page || 1) - 1) * (searchFilters.limit || 12);
        const to = from + (searchFilters.limit || 12) - 1;
        query = query.range(from, to);

        const { data, error: searchError, count } = await query;

        if (searchError) {
          console.error("Supabase search error details:", searchError);
          throw searchError;
        }

        setProperties(data || []);
        setTotalResults(count || 0);
      } catch (err) {
        console.error("Search error:", err);
        setError("Failed to search properties. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    searchProperties(filters);
  }, [filters, searchProperties]);
  
  // Geocode properties without coordinates when map view is selected
  useEffect(() => {
    const geocodePropertiesWithoutCoordinates = async () => {
      if (viewMode === "map" && properties.length > 0) {
        const propertiesNeedingGeocoding = properties.filter(
          p => !p.latitude || !p.longitude
        );
        
        if (propertiesNeedingGeocoding.length > 0) {
          setGeocodingProperties(true);
          
          const geocodedProperties = [...properties];
          
          try {
            const { googleMapsService } = await import('@/lib/google-maps');
            
            for (let i = 0; i < propertiesNeedingGeocoding.length; i++) {
              const property = propertiesNeedingGeocoding[i];
              const address = `${property.address_line_1}, ${property.city}, ${property.postcode}, UK`;
              
              const results = await googleMapsService.geocodeAddress(address);
              
              if (results && results.length > 0) {
                const index = geocodedProperties.findIndex(p => p.id === property.id);
                if (index !== -1) {
                  geocodedProperties[index] = {
                    ...geocodedProperties[index],
                    latitude: results[0].position.lat,
                    longitude: results[0].position.lng
                  };
                  
                  // Update the property in the database with the new coordinates
                  await supabase
                    .from('properties')
                    .update({
                      latitude: results[0].position.lat,
                      longitude: results[0].position.lng
                    })
                    .eq('id', property.id);
                }
              }
            }
            
            setProperties(geocodedProperties);
          } catch (err) {
            console.error('Error geocoding properties:', err);
          } finally {
            setGeocodingProperties(false);
          }
        }
      }
    };
    
    geocodePropertiesWithoutCoordinates();
  }, [viewMode, properties]);

  const handleFiltersChange = (newFilters: PropertySearchFilters) => {
    const updatedFilters = { ...newFilters, page: 1 };
    setFilters(updatedFilters);
    setCurrentPage(1);

    // Update URL params
    const params = new URLSearchParams();
    if (updatedFilters.postcode)
      params.set("location", updatedFilters.postcode);
    if (updatedFilters.city && !updatedFilters.postcode)
      params.set("location", updatedFilters.city);
    if (updatedFilters.property_type?.length)
      params.set("property_type", updatedFilters.property_type[0]);
    if (updatedFilters.min_price)
      params.set("min_price", updatedFilters.min_price.toString());
    if (updatedFilters.max_price)
      params.set("max_price", updatedFilters.max_price.toString());
    if (updatedFilters.min_bedrooms)
      params.set("min_bedrooms", updatedFilters.min_bedrooms.toString());
    if (updatedFilters.max_bedrooms)
      params.set("max_bedrooms", updatedFilters.max_bedrooms.toString());

    router.push(`/search?${params.toString()}`);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setFilters((prev) => ({ ...prev, page }));
  };

  const clearFilters = () => {
    const clearedFilters: PropertySearchFilters = {
      page: 1,
      limit: 12,
    };
    setFilters(clearedFilters);
    setCurrentPage(1);
    router.push("/search");
  };

  const totalPages = Math.ceil(totalResults / (filters.limit || 12));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Property Search
              </h1>
              <p className="text-gray-600 mt-1">
                {loading ? "Searching..." : `${totalResults} properties found`}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("list")}
              >
                <ListBulletIcon className="w-4 h-4 mr-1" />
                List
              </Button>
              <Button
                variant={viewMode === "map" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("map")}
              >
                <MapIcon className="w-4 h-4 mr-1" />
                Map
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="lg:grid lg:grid-cols-4 lg:gap-8">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1 mb-8 lg:mb-0">
            <SearchFilters
              filters={filters}
              onFiltersChange={handleFiltersChange}
              onClearFilters={clearFilters}
            />
          </div>

          {/* Results */}
          <div className="lg:col-span-3">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
                {error}
              </div>
            )}

            {loading ? (
              <div className="flex justify-center items-center h-64">
                <LoadingSpinner size="lg" />
              </div>
            ) : viewMode === "list" ? (
              <>
                {properties.length > 0 ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                      {properties.map((property) => (
                        <PropertyCard
                          key={property.id}
                          property={property}
                          showSaveButton
                        />
                      ))}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="flex justify-center items-center space-x-2 mt-8">
                        <Button
                          variant="outline"
                          disabled={currentPage === 1}
                          onClick={() => handlePageChange(currentPage - 1)}
                        >
                          Previous
                        </Button>

                        {Array.from(
                          { length: Math.min(5, totalPages) },
                          (_, i) => {
                            const page = i + 1;
                            return (
                              <Button
                                key={page}
                                variant={
                                  currentPage === page ? "default" : "outline"
                                }
                                onClick={() => handlePageChange(page)}
                              >
                                {page}
                              </Button>
                            );
                          }
                        )}

                        {totalPages > 5 && (
                          <>
                            <span className="text-gray-500">...</span>
                            <Button
                              variant={
                                currentPage === totalPages
                                  ? "default"
                                  : "outline"
                              }
                              onClick={() => handlePageChange(totalPages)}
                            >
                              {totalPages}
                            </Button>
                          </>
                        )}

                        <Button
                          variant="outline"
                          disabled={currentPage === totalPages}
                          onClick={() => handlePageChange(currentPage + 1)}
                        >
                          Next
                        </Button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-24 h-24 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <svg
                        className="w-12 h-12 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                        />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No properties found
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Try adjusting your search criteria or explore different
                      areas.
                    </p>
                    <Button onClick={clearFilters}>Clear all filters</Button>
                  </div>
                )}
              </>
            ) : (
              // Map View
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                {geocodingProperties ? (
                  <div className="h-[600px] flex flex-col items-center justify-center">
                    <LoadingSpinner size="lg" />
                    <p className="text-gray-600 mt-4">Preparing map view...</p>
                  </div>
                ) : properties.length > 0 ? (
                  <div className="h-[600px]">
                    <SearchMap
                      properties={properties.filter(p => p.latitude && p.longitude)}
                      height="100%"
                      onPropertySelect={(propertyId) => {
                        router.push(`/properties/${propertyId}`);
                      }}
                    />
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-24 h-24 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <MapIcon className="w-12 h-12 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No properties to display on map
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Try adjusting your search criteria or explore different
                      areas.
                    </p>
                    <Button onClick={clearFilters}>Clear all filters</Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <SearchPageContent />
    </Suspense>
  );
}
