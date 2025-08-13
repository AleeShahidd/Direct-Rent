'use client';

import React, { useState, useEffect } from 'react';
import { PropertyCard } from '@/components/property/PropertyCard';

interface RecommendedProperty {
  id: string;
  title: string;
  price_per_month: number;
  postcode: string;
  property_type: string;
  bedrooms: number;
  score: number;
  images?: string[];
  reasoning?: string;
}

interface PropertyRecommendationsProps {
  userId: string;
  userPreferences?: {
    preferred_postcode?: string;
    price_min?: number;
    price_max?: number;
    property_type?: string;
    min_bedrooms?: number;
    max_bedrooms?: number;
    furnishing_status?: string;
    city?: string;
  };
  limit?: number;
  className?: string;
}

export function PropertyRecommendations({ 
  userId, 
  userPreferences = {}, 
  limit = 6,
  className = '' 
}: PropertyRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<RecommendedProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userId) {
      fetchRecommendations();
    }
  }, [userId, userPreferences]);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      setError(null);

      const requestBody = {
        user_id: userId,
        preferences: userPreferences,
        limit
      };

      const response = await fetch('/api/ml/recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch recommendations');
      }

      setRecommendations(result.data.properties || []);

    } catch (err) {
      console.error('Recommendations error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load recommendations');
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshRecommendations = () => {
    fetchRecommendations();
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
        <div className="flex items-center mb-6">
          <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
            <span className="text-purple-600">🎯</span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Recommended for You</h3>
            <p className="text-sm text-gray-600">AI-powered property recommendations</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, index) => (
            <div key={index} className="animate-pulse">
              <div className="bg-gray-200 rounded-lg h-48 mb-4"></div>
              <div className="space-y-2">
                <div className="bg-gray-200 rounded h-4 w-3/4"></div>
                <div className="bg-gray-200 rounded h-4 w-1/2"></div>
                <div className="bg-gray-200 rounded h-4 w-1/4"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
        <div className="flex items-center mb-6">
          <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
            <span className="text-purple-600">🎯</span>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">Recommended for You</h3>
            <p className="text-sm text-gray-600">AI-powered property recommendations</p>
          </div>
          <button
            onClick={handleRefreshRecommendations}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700"
          >
            Retry
          </button>
        </div>

        <div className="text-center py-8">
          <div className="text-red-500 mb-2">⚠️</div>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
            <span className="text-purple-600">🎯</span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Recommended for You</h3>
            <p className="text-sm text-gray-600">
              {recommendations.length} AI-powered recommendations based on your preferences
            </p>
          </div>
        </div>
        
        <button
          onClick={handleRefreshRecommendations}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 flex items-center"
        >
          <span className="mr-2">🔄</span>
          Refresh
        </button>
      </div>

      {recommendations.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-400 mb-2">🏠</div>
          <h4 className="text-lg font-medium text-gray-900 mb-2">No Recommendations Yet</h4>
          <p className="text-gray-600 mb-4">
            Update your preferences to get personalized property recommendations
          </p>
          <button
            onClick={handleRefreshRecommendations}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Get Recommendations
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recommendations.map((property, index) => (
            <div key={property.id} className="relative">
              {/* Recommendation Score Badge */}
              <div className="absolute top-2 right-2 z-10 bg-purple-600 text-white px-2 py-1 rounded-full text-xs font-semibold">
                {(property.score * 100).toFixed(0)}% match
              </div>

              {/* Property Card */}
              <div className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                {/* Property Image */}
                <div className="h-48 bg-gray-200 relative">
                  {property.images && property.images.length > 0 ? (
                    <img
                      src={property.images[0]}
                      alt={property.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <span className="text-4xl">🏠</span>
                    </div>
                  )}
                </div>

                {/* Property Details */}
                <div className="p-4">
                  <h4 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                    {property.title}
                  </h4>
                  
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl font-bold text-blue-600">
                      £{property.price_per_month.toLocaleString()}/mo
                    </span>
                    <span className="text-sm text-gray-500">
                      {property.postcode}
                    </span>
                  </div>

                  <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                    <span>{property.bedrooms} bed</span>
                    <span>{property.property_type}</span>
                  </div>

                  {property.reasoning && (
                    <div className="bg-purple-50 border border-purple-200 rounded-md p-3 mb-3">
                      <p className="text-sm text-purple-700">
                        <span className="font-medium">Why recommended:</span> {property.reasoning}
                      </p>
                    </div>
                  )}

                  <div className="flex space-x-2">
                    <button className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md text-sm hover:bg-blue-700">
                      View Details
                    </button>
                    <button className="bg-gray-100 text-gray-600 py-2 px-4 rounded-md text-sm hover:bg-gray-200">
                      💖 Save
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* View More Link */}
      {recommendations.length > 0 && (
        <div className="text-center mt-6">
          <button className="text-blue-600 hover:text-blue-700 font-medium">
            View All Recommendations →
          </button>
        </div>
      )}
    </div>
  );
}
