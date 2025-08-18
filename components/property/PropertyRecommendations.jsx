/**
 * Property Recommendations Component
 * Displays personalized property recommendations for users
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Image from 'next/image';

export default function PropertyRecommendations({ userId, userPreferences, className = '' }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const router = useRouter();
  
  useEffect(() => {
    // Only fetch recommendations if we have user data
    if (userId && userPreferences) {
      fetchRecommendations();
    }
  }, [userId, JSON.stringify(userPreferences)]);
  
  const fetchRecommendations = async () => {
    setLoading(true);
    
    try {
      const response = await axios.post('/api/ml/getRecommendations', {
        user_id: userId,
        preferences: userPreferences,
        limit: 6
      });
      
      if (response.data && response.data.properties) {
        // Combine properties with scores and reasons
        const recommendedProperties = response.data.properties.map((property, index) => ({
          ...property,
          score: response.data.scores[index] || 0,
          reason: response.data.reasoning[index] || 'Recommended for you'
        }));
        
        setRecommendations(recommendedProperties);
      }
    } catch (err) {
      console.log('Error getting recommendations:', err);
      setError('Failed to load recommendations');
    } finally {
      setLoading(false);
    }
  };
  
  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-GB', { 
      style: 'currency', 
      currency: 'GBP',
      maximumFractionDigits: 0
    }).format(amount);
  };
  
  // Handle clicking on a property
  const handlePropertyClick = (propertyId) => {
    router.push(`/properties/${propertyId}`);
  };
  
  // Get confidence badge based on score
  const getScoreBadge = (score) => {
    if (score >= 0.8) return { text: 'Strong match', color: 'bg-green-100 text-green-800' };
    if (score >= 0.6) return { text: 'Good match', color: 'bg-blue-100 text-blue-800' };
    return { text: 'Potential match', color: 'bg-gray-100 text-gray-800' };
  };
  
  // Get placeholder image if no images
  const getPropertyImage = (property) => {
    if (property.images && property.images.length > 0) {
      return property.images[0];
    }
    
    const placeholders = {
      'Flat': '/sample-flat-1.jpg',
      'House': '/sample-house-1.jpg',
      'Studio': '/sample-studio-1.jpg'
    };
    
    return placeholders[property.property_type] || '/placeholder-property.jpg';
  };
  
  // If no user or preferences, show a message
  if (!userId || !userPreferences) {
    return null;
  }
  
  return (
    <div className={`${className}`}>
      <h2 className="text-xl font-bold mb-4">Recommended for You</h2>
      
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse bg-white rounded-lg shadow-md overflow-hidden">
              <div className="h-48 bg-gray-200"></div>
              <div className="p-4">
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-3"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-full"></div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {error && (
        <div className="bg-red-50 text-red-500 p-4 rounded-lg">
          {error}
        </div>
      )}
      
      {!loading && recommendations.length === 0 && !error && (
        <div className="bg-gray-50 p-4 rounded-lg text-gray-500">
          No recommendations available. Try adjusting your preferences.
        </div>
      )}
      
      {!loading && recommendations.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recommendations.map((property) => {
            const scoreBadge = getScoreBadge(property.score);
            
            return (
              <div 
                key={property.id} 
                className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer transition-transform hover:scale-[1.02]"
                onClick={() => handlePropertyClick(property.id)}
              >
                <div className="relative h-48 w-full">
                  <Image
                    src={getPropertyImage(property)}
                    alt={property.title || `${property.property_type} in ${property.city}`}
                    fill
                    style={{ objectFit: 'cover' }}
                  />
                  <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium ${scoreBadge.color}`}>
                    {scoreBadge.text}
                  </div>
                </div>
                
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-1 truncate">
                    {property.title || `${property.bedrooms} bed ${property.property_type.toLowerCase()} in ${property.city}`}
                  </h3>
                  
                  <p className="text-indigo-600 font-bold mb-2">
                    {formatCurrency(property.price_per_month)} <span className="text-gray-500 font-normal">per month</span>
                  </p>
                  
                  <div className="flex flex-wrap gap-2 mb-2">
                    <span className="bg-gray-100 px-2 py-1 rounded text-xs">
                      {property.bedrooms} {property.bedrooms === 1 ? 'bed' : 'beds'}
                    </span>
                    <span className="bg-gray-100 px-2 py-1 rounded text-xs">
                      {property.bathrooms} {property.bathrooms === 1 ? 'bath' : 'baths'}
                    </span>
                    <span className="bg-gray-100 px-2 py-1 rounded text-xs">
                      {property.property_type}
                    </span>
                  </div>
                  
                  <p className="text-xs text-gray-500 mt-2 italic">
                    {property.reason}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
