'use client';

import React, { useState, useEffect } from 'react';
import { PriceEstimateRequest, PriceEstimateResponse } from '@/types';
import { Button } from '@/components/ui/button';

interface PriceEstimatorProps {
  initialData?: Partial<PriceEstimateRequest>;
  onPriceEstimated?: (estimate: PriceEstimateResponse) => void;
  className?: string;
}

export function PriceEstimator({ initialData, onPriceEstimated, className = '' }: PriceEstimatorProps) {
  const [formData, setFormData] = useState<PriceEstimateRequest>({
    postcode: initialData?.postcode || '',
    property_type: initialData?.property_type || 'Flat',
    bedrooms: initialData?.bedrooms || 1,
    bathrooms: initialData?.bathrooms || 1,
    furnishing_status: initialData?.furnishing_status || 'Unfurnished',
  });

  const [estimate, setEstimate] = useState<PriceEstimateResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({ ...prev, ...initialData }));
    }
  }, [initialData]);

  const handleInputChange = (field: keyof PriceEstimateRequest, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null); // Clear error when user makes changes
  };

  const handleEstimate = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/ml/price-estimate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        console.error('API response not OK:', response.status, response.statusText);
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();

      if (!result.success) {
        console.error('API reported failure:', result);
        throw new Error(result.error || result.details || 'Failed to estimate price');
      }

      if (!result.data || typeof result.data.estimated_price !== 'number') {
        console.error('Invalid price estimate data:', result.data);
        throw new Error('Received invalid price estimate data');
      }

      setEstimate(result.data);
      onPriceEstimated?.(result.data);

    } catch (err) {
      console.error('Price estimation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to estimate price');
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = formData.postcode && formData.property_type && formData.bedrooms && formData.bathrooms;

  return (
    <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
      <div className="flex items-center mb-6">
        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
          <span className="text-blue-600 font-semibold">💰</span>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">AI Price Estimator</h3>
          <p className="text-sm text-gray-600">Get an instant rental price estimate using our ML model</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label htmlFor="postcode" className="block text-sm font-medium text-gray-700 mb-2">
            Postcode
          </label>
          <input
            type="text"
            id="postcode"
            value={formData.postcode}
            onChange={(e) => handleInputChange('postcode', e.target.value)}
            placeholder="e.g., SW1A 1AA"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label htmlFor="property_type" className="block text-sm font-medium text-gray-700 mb-2">
            Property Type
          </label>
          <select
            id="property_type"
            value={formData.property_type}
            onChange={(e) => handleInputChange('property_type', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="Studio">Studio</option>
            <option value="Flat">Flat</option>
            <option value="House">House</option>
            <option value="Bungalow">Bungalow</option>
            <option value="Maisonette">Maisonette</option>
          </select>
        </div>

        <div>
          <label htmlFor="bedrooms" className="block text-sm font-medium text-gray-700 mb-2">
            Bedrooms
          </label>
          <select
            id="bedrooms"
            value={formData.bedrooms}
            onChange={(e) => handleInputChange('bedrooms', parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {[1, 2, 3, 4, 5, 6].map(num => (
              <option key={num} value={num}>{num}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="bathrooms" className="block text-sm font-medium text-gray-700 mb-2">
            Bathrooms
          </label>
          <select
            id="bathrooms"
            value={formData.bathrooms}
            onChange={(e) => handleInputChange('bathrooms', parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {[1, 2, 3, 4].map(num => (
              <option key={num} value={num}>{num}</option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2">
          <label htmlFor="furnishing_status" className="block text-sm font-medium text-gray-700 mb-2">
            Furnishing Status
          </label>
          <select
            id="furnishing_status"
            value={formData.furnishing_status}
            onChange={(e) => handleInputChange('furnishing_status', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="Unfurnished">Unfurnished</option>
            <option value="Part-Furnished">Part-Furnished</option>
            <option value="Furnished">Furnished</option>
          </select>
        </div>
      </div>

      <Button
        onClick={handleEstimate}
        disabled={!isFormValid || loading}
        className="w-full"
      >
        {loading ? (
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Estimating Price...
          </div>
        ) : (
          'Get Price Estimate'
        )}
      </Button>

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {estimate && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-md">
          <div className="text-center mb-4">
            <div className="text-3xl font-bold text-green-700">
              £{estimate.estimated_price.toLocaleString()}/month
            </div>
            <div className="text-sm text-green-600">
              Confidence: {(estimate.confidence * 100).toFixed(1)}%
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Price Range</h4>
              <p className="text-gray-600">
                £{estimate.price_range.min.toLocaleString()} - £{estimate.price_range.max.toLocaleString()}
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Market Insights</h4>
              <p className="text-gray-600">
                Market Avg: £{estimate.market_insights.average_price.toLocaleString()}
              </p>
              <p className="text-gray-600">
                {estimate.market_insights.comparable_properties} comparable properties
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
