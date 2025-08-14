/**
 * Recommendation Hook
 * Custom hook for using the recommendation engine in React components
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

export interface PropertyData {
  id?: string;
  property_id?: string;
  property_type?: string;
  bedrooms?: number;
  bathrooms?: number;
  city?: string;
  price_per_month?: number;
  [key: string]: any;
}

export interface UserPreferences {
  property_type?: string | string[];
  min_bedrooms?: number;
  max_bedrooms?: number;
  min_bathrooms?: number;
  city?: string | string[];
  price_min?: number;
  price_max?: number;
  [key: string]: any;
}

export interface RecommendationResult {
  property_id: string;
  property: PropertyData;
  score: number;
  reason: string;
}

interface UseRecommendationsOptions {
  limit?: number;
  includeSimilarProperties?: boolean;
  onError?: (error: any) => void;
}

/**
 * Custom hook for getting property recommendations
 * @param userId - User ID for personalized recommendations
 * @param options - Configuration options
 */
export function useRecommendations(
  userId: string,
  options: UseRecommendationsOptions = {}
) {
  const [recommendations, setRecommendations] = useState<RecommendationResult[]>([]);
  const [similarProperties, setSimilarProperties] = useState<RecommendationResult[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [userPreferences, setUserPreferences] = useState<UserPreferences>({});
  const [activeProperty, setActiveProperty] = useState<PropertyData | null>(null);
  
  const { 
    limit = 10, 
    includeSimilarProperties = true,
    onError 
  } = options;
  
  /**
   * Fetch personalized recommendations for the user
   */
  const fetchRecommendations = useCallback(async (
    preferences: UserPreferences = userPreferences
  ) => {
    if (!userId) {
      setError('User ID is required for recommendations');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.get('/api/ml/recommendations', {
        params: {
          user_id: userId,
          limit,
          ...preferences
        }
      });
      
      setRecommendations(response.data.data?.properties || []);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'Error fetching recommendations';
      setError(errorMessage);
      if (onError) onError(err);
    } finally {
      setIsLoading(false);
    }
  }, [userId, limit, userPreferences, onError]);
  
  /**
   * Fetch similar properties to a specific property
   */
  const fetchSimilarProperties = useCallback(async (property: PropertyData) => {
    if (!property || (!property.id && !property.property_id)) {
      setSimilarProperties([]);
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await axios.get('/api/ml/recommendations/similar', {
        params: {
          property_id: property.id || property.property_id,
          limit
        }
      });
      
      setSimilarProperties(response.data.data?.similar_properties || []);
    } catch (err: any) {
      // Don't set main error state for similar properties
      if (onError) onError(err);
    } finally {
      setIsLoading(false);
    }
  }, [limit, onError]);
  
  /**
   * Update user preferences and fetch new recommendations
   */
  const updatePreferences = useCallback((preferences: UserPreferences) => {
    setUserPreferences(prev => {
      const newPreferences = { ...prev, ...preferences };
      fetchRecommendations(newPreferences);
      return newPreferences;
    });
  }, [fetchRecommendations]);
  
  /**
   * Set active property and fetch similar properties
   */
  const setPropertyContext = useCallback((property: PropertyData | null) => {
    setActiveProperty(property);
    
    if (property && includeSimilarProperties) {
      fetchSimilarProperties(property);
    } else {
      setSimilarProperties([]);
    }
  }, [includeSimilarProperties, fetchSimilarProperties]);
  
  /**
   * Track user interaction with a property to improve recommendations
   */
  const trackInteraction = useCallback(async (
    propertyId: string, 
    interactionType: 'view' | 'save' | 'contact' | 'apply'
  ) => {
    if (!userId || !propertyId) return;
    
    try {
      await axios.post('/api/ml/recommendations/track', {
        user_id: userId,
        property_id: propertyId,
        interaction_type: interactionType
      });
    } catch (err) {
      console.error('Failed to track interaction:', err);
    }
  }, [userId]);
  
  // Fetch recommendations on initial render
  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);
  
  return {
    recommendations,
    similarProperties,
    isLoading,
    error,
    userPreferences,
    activeProperty,
    updatePreferences,
    setPropertyContext,
    fetchRecommendations,
    fetchSimilarProperties,
    trackInteraction
  };
}
