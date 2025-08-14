/**
 * Fraud Detection Hook
 * Custom hook for using the fraud detection model in React components
 */

'use client';

import { useState, useCallback } from 'react';
import axios from 'axios';

export interface PropertyData {
  id?: string;
  property_id?: string;
  title?: string;
  description?: string;
  property_type?: string;
  bedrooms?: number;
  bathrooms?: number;
  price_per_month?: number;
  city?: string;
  postcode?: string;
  landlord_id?: string;
  created_at?: string;
  images?: string[];
  [key: string]: any;
}

export interface FraudDetectionResult {
  property_id: string;
  risk_score: number;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  risk_factors: string[];
  flagged: boolean;
  confidence: number;
  details: {
    price_anomaly?: {
      score: number;
      reason: string;
    };
    content_analysis?: {
      score: number;
      flagged_terms: string[];
    };
    landlord_history?: {
      score: number;
      reason: string;
    };
    [key: string]: any;
  };
}

interface UseFraudDetectionOptions {
  autoDetect?: boolean;
  threshold?: number;
  onDetectFraud?: (result: FraudDetectionResult) => void;
  onError?: (error: any) => void;
}

/**
 * Custom hook for detecting fraudulent property listings
 * @param initialProperty - Initial property data
 * @param options - Configuration options
 */
export function useFraudDetection(
  initialProperty: PropertyData = {},
  options: UseFraudDetectionOptions = {}
) {
  const [property, setProperty] = useState<PropertyData>(initialProperty);
  const [result, setResult] = useState<FraudDetectionResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const { 
    autoDetect = false, 
    threshold = 0.6, 
    onDetectFraud,
    onError 
  } = options;
  
  /**
   * Detect fraud for a property
   */
  const detectFraud = useCallback(async (propertyData: PropertyData = property) => {
    if (!hasMinimumRequiredFields(propertyData)) {
      setError('Insufficient property data for fraud detection');
      setResult(null);
      return null;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.post('/api/ml/fraud-check', {
        property: propertyData,
        landlord_id: propertyData.landlord_id
      });
      
      const fraudResult = response.data.data as FraudDetectionResult;
      
      setResult(fraudResult);
      
      // Call callback if risk score is above threshold
      if (fraudResult.risk_score >= threshold && onDetectFraud) {
        onDetectFraud(fraudResult);
      }
      
      return fraudResult;
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'Error detecting fraud';
      setError(errorMessage);
      if (onError) onError(err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [property, threshold, onDetectFraud, onError]);
  
  /**
   * Update property data and optionally detect fraud
   */
  const updateProperty = useCallback((updates: Partial<PropertyData>) => {
    setProperty(prev => {
      const updatedProperty = { ...prev, ...updates };
      
      // Auto-detect fraud if enabled and property has minimum required fields
      if (autoDetect && hasMinimumRequiredFields(updatedProperty)) {
        detectFraud(updatedProperty);
      }
      
      return updatedProperty;
    });
  }, [autoDetect, detectFraud]);
  
  /**
   * Report a property as fraudulent
   */
  const reportFraud = useCallback(async (
    propertyId: string, 
    reason: string, 
    details: string = ''
  ) => {
    setIsLoading(true);
    
    try {
      const response = await axios.post('/api/ml/fraud-check/report', {
        property_id: propertyId,
        reason,
        details
      });
      
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'Error reporting fraud';
      setError(errorMessage);
      if (onError) onError(err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [onError]);
  
  /**
   * Validate a property listing in bulk before posting
   */
  const validatePropertyBatch = useCallback(async (properties: PropertyData[]) => {
    setIsLoading(true);
    
    try {
      const response = await axios.post('/api/ml/fraud-check/batch', {
        properties
      });
      
      return response.data.results;
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'Error validating properties';
      setError(errorMessage);
      if (onError) onError(err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [onError]);
  
  return {
    property,
    updateProperty,
    result,
    isLoading,
    error,
    detectFraud,
    reportFraud,
    validatePropertyBatch
  };
}

/**
 * Check if property has minimum required fields for fraud detection
 */
function hasMinimumRequiredFields(property: PropertyData): boolean {
  return !!(
    property.property_type && 
    property.price_per_month && 
    (property.description || property.title)
  );
}
