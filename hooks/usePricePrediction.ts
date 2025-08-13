/**
 * Price Prediction Hook
 * Custom hook for using the price prediction model in React components
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

export interface PropertyData {
  postcode?: string;
  property_type?: string;
  bedrooms?: number;
  bathrooms?: number;
  furnishing_status?: string;
  square_feet?: number;
  reception_rooms?: number;
  city?: string;
  region?: string;
  [key: string]: any;
}

export interface PricePredictionResult {
  estimated_price: number;
  confidence: number;
  price_range: {
    min: number;
    max: number;
  };
  comparable_properties?: any[];
}

interface UsePricePredictionOptions {
  autoPredict?: boolean;
  debounceMs?: number;
  onError?: (error: any) => void;
}

/**
 * Custom hook for predicting property prices
 * @param initialProperty - Initial property data
 * @param options - Configuration options
 */
export function usePricePrediction(
  initialProperty: PropertyData = {},
  options: UsePricePredictionOptions = {}
) {
  const [property, setProperty] = useState<PropertyData>(initialProperty);
  const [prediction, setPrediction] = useState<PricePredictionResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  const { 
    autoPredict = true, 
    debounceMs = 500, 
    onError 
  } = options;
  
  // Debounced predict function
  const debouncedPredict = useCallback(
    debounce(async (propertyData: PropertyData) => {
      if (!hasMinimumRequiredFields(propertyData)) {
        setError('Insufficient property data for prediction');
        setPrediction(null);
        return;
      }
      
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await axios.post('/api/ml/predictPrice', propertyData);
        setPrediction(response.data);
        setLastUpdated(new Date());
      } catch (err: any) {
        const errorMessage = err.response?.data?.error || err.message || 'Error predicting price';
        setError(errorMessage);
        if (onError) onError(err);
      } finally {
        setIsLoading(false);
      }
    }, debounceMs),
    [debounceMs, onError]
  );
  
  // Update property data
  const updateProperty = useCallback((updates: Partial<PropertyData>) => {
    setProperty(prev => ({ ...prev, ...updates }));
  }, []);
  
  // Run prediction manually
  const predictPrice = useCallback(async (propertyData: PropertyData = property) => {
    debouncedPredict(propertyData);
  }, [property, debouncedPredict]);
  
  // Auto-predict when property changes if enabled
  useEffect(() => {
    if (autoPredict) {
      debouncedPredict(property);
    }
  }, [property, autoPredict, debouncedPredict]);
  
  // Reset prediction
  const resetPrediction = useCallback(() => {
    setPrediction(null);
    setError(null);
    setLastUpdated(null);
  }, []);
  
  return {
    property,
    updateProperty,
    prediction,
    isLoading,
    error,
    lastUpdated,
    predictPrice,
    resetPrediction
  };
}

/**
 * Check if property has minimum required fields for prediction
 */
function hasMinimumRequiredFields(property: PropertyData): boolean {
  // These are the absolute minimum fields needed for a meaningful prediction
  return !!(
    property.property_type && 
    property.bedrooms && 
    (property.postcode || property.city)
  );
}

/**
 * Simple debounce function
 */
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function(...args: Parameters<T>): void {
    if (timeout) clearTimeout(timeout);
    
    timeout = setTimeout(() => {
      func(...args);
    }, wait);
  };
}
