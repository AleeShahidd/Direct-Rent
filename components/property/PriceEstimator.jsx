/**
 * Price Estimator Component
 * Provides AI-based price estimation for property listings
 */

'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';

export default function PriceEstimator({ propertyData, className = '', onChange }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [prediction, setPrediction] = useState(null);
  
  // Generate price prediction when property data changes
  useEffect(() => {
    // Only predict if we have the minimum required data
    if (
      !propertyData || 
      !propertyData.postcode || 
      !propertyData.property_type || 
      !propertyData.bedrooms || 
      !propertyData.bathrooms || 
      !propertyData.furnishing_status
    ) {
      return;
    }

    // Set prediction to null while waiting for new prediction
    setPrediction(null);
    setError(null);
    
    // Debounce API calls to avoid too many requests
    const timer = setTimeout(() => {
      getPrediction();
    }, 500);
    
    return () => clearTimeout(timer);
  }, [
    propertyData?.postcode,
    propertyData?.property_type,
    propertyData?.bedrooms,
    propertyData?.bathrooms,
    propertyData?.furnishing_status
  ]);
  
  // Call API to get price prediction
  const getPrediction = async () => {
    setLoading(true);
    
    try {
      const response = await axios.post('/api/ml/predictPrice', {
        postcode: propertyData.postcode,
        property_type: propertyData.property_type,
        bedrooms: Number(propertyData.bedrooms),
        bathrooms: Number(propertyData.bathrooms),
        furnishing_status: propertyData.furnishing_status
      });
      
      setPrediction(response.data);
      
      // Call onChange callback if provided
      if (onChange && typeof onChange === 'function') {
        onChange(response.data);
      }
      
    } catch (err) {
      console.error('Error getting price prediction:', err);
      setError('Failed to estimate price. Please try again.');
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
  
  // Calculate confidence label and color
  const getConfidenceLabel = (confidence) => {
    if (confidence >= 0.9) return { label: 'Very High', color: 'text-green-600' };
    if (confidence >= 0.8) return { label: 'High', color: 'text-green-500' };
    if (confidence >= 0.7) return { label: 'Good', color: 'text-yellow-500' };
    if (confidence >= 0.6) return { label: 'Moderate', color: 'text-yellow-600' };
    return { label: 'Low', color: 'text-orange-500' };
  };
  
  // If we don't have enough data, show a message
  if (
    !propertyData || 
    !propertyData.postcode || 
    !propertyData.property_type || 
    !propertyData.bedrooms || 
    !propertyData.bathrooms || 
    !propertyData.furnishing_status
  ) {
    return (
      <div className={`bg-gray-50 p-4 rounded-lg shadow-sm ${className}`}>
        <h3 className="text-lg font-medium mb-2">AI Price Estimation</h3>
        <p className="text-gray-500 text-sm">
          Complete property details to get an AI-powered price estimate.
        </p>
      </div>
    );
  }
  
  return (
    <div className={`bg-gray-50 p-4 rounded-lg shadow-sm ${className}`}>
      <h3 className="text-lg font-medium mb-2">AI Price Estimation</h3>
      
      {loading && (
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-2/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      )}
      
      {error && (
        <div className="text-red-500 text-sm mb-2">
          {error}
        </div>
      )}
      
      {prediction && !loading && (
        <div>
          <div className="flex items-baseline mb-4">
            <span className="text-2xl font-bold text-indigo-600">
              {formatCurrency(prediction.estimated_price)}
            </span>
            <span className="text-gray-500 text-sm ml-2">per month</span>
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Price range</span>
              <span className="font-medium">
                {formatCurrency(prediction.price_range.min)} - {formatCurrency(prediction.price_range.max)}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Confidence</span>
              <span className={`font-medium ${getConfidenceLabel(prediction.confidence).color}`}>
                {getConfidenceLabel(prediction.confidence).label} ({Math.round(prediction.confidence * 100)}%)
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Market average</span>
              <span className="font-medium">
                {formatCurrency(prediction.market_insights.average_price)}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Similar properties</span>
              <span className="font-medium">
                {prediction.market_insights.comparable_properties}
              </span>
            </div>
          </div>
          
          <div className="mt-4 text-xs text-gray-500">
            Based on current market data and property features.
          </div>
        </div>
      )}
    </div>
  );
}
