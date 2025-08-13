/**
 * ML Integration Test Component
 * This component showcases all ML features working together
 */

'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import PriceEstimator from '../property/PriceEstimator';
import PropertyRecommendations from '../property/PropertyRecommendations';
import MLModelMonitoring from '../admin/MLModelMonitoring';

export default function MLIntegrationDemo() {
  const [activeTab, setActiveTab] = useState('price');
  const [property, setProperty] = useState({
    postcode: 'SW1A 1AA',
    property_type: 'Flat',
    bedrooms: 2,
    bathrooms: 1,
    furnishing_status: 'Furnished',
    description: 'Modern 2 bedroom flat in central London with great amenities',
    price: 2500
  });
  const [userId, setUserId] = useState('demo-user-123');
  const [isLoading, setIsLoading] = useState(false);
  const [mlSystemStatus, setMlSystemStatus] = useState(null);
  
  // Check ML system health on component mount
  useEffect(() => {
    checkMLSystemHealth();
  }, []);
  
  // Check ML system health
  const checkMLSystemHealth = async () => {
    try {
      const response = await axios.get('/api/ml/health');
      setMlSystemStatus(response.data);
    } catch (error) {
      console.error('Error checking ML system health:', error);
    }
  };
  
  // Handle property changes
  const handlePropertyChange = (field, value) => {
    setProperty({
      ...property,
      [field]: value
    });
  };
  
  // Get system health status color
  const getHealthStatusColor = (status) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-500';
      case 'warning':
        return 'bg-yellow-500';
      case 'degraded':
        return 'bg-orange-500';
      case 'critical':
        return 'bg-red-600';
      default:
        return 'bg-gray-500';
    }
  };
  
  // Demo fraud check
  const checkForFraud = async () => {
    setIsLoading(true);
    
    try {
      const response = await axios.post('/api/ml/detectFraud', {
        property: property
      });
      
      alert(`Fraud Analysis Results:
Risk Score: ${(response.data.risk_score * 100).toFixed(1)}%
Primary Factors: ${response.data.risk_factors.join(', ')}
Recommendation: ${response.data.risk_score > 0.6 ? 'Review Required' : 'Approved'}`);
    } catch (error) {
      console.error('Error running fraud check:', error);
      alert('Error running fraud detection');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-6">ML Features Integration Demo</h2>
        
        {/* System health indicator */}
        {mlSystemStatus && (
          <div className="mb-6 flex items-center">
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full mr-2 ${getHealthStatusColor(mlSystemStatus.status)}`}></div>
              <span className="font-medium capitalize">
                ML System: {mlSystemStatus.status}
              </span>
            </div>
            <button
              onClick={checkMLSystemHealth}
              className="ml-4 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
            >
              Refresh
            </button>
          </div>
        )}
        
        {/* Property editor */}
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <h3 className="font-semibold mb-4">Test Property Details</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Postcode
              </label>
              <input
                type="text"
                value={property.postcode}
                onChange={(e) => handlePropertyChange('postcode', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Property Type
              </label>
              <select
                value={property.property_type}
                onChange={(e) => handlePropertyChange('property_type', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="Flat">Flat</option>
                <option value="House">House</option>
                <option value="Studio">Studio</option>
                <option value="Maisonette">Maisonette</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bedrooms
              </label>
              <input
                type="number"
                value={property.bedrooms}
                onChange={(e) => handlePropertyChange('bedrooms', parseInt(e.target.value))}
                min="0"
                max="10"
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bathrooms
              </label>
              <input
                type="number"
                value={property.bathrooms}
                onChange={(e) => handlePropertyChange('bathrooms', parseInt(e.target.value))}
                min="0"
                max="10"
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Furnishing Status
              </label>
              <select
                value={property.furnishing_status}
                onChange={(e) => handlePropertyChange('furnishing_status', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="Furnished">Furnished</option>
                <option value="Unfurnished">Unfurnished</option>
                <option value="Part-Furnished">Part-Furnished</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Current Price (£)
              </label>
              <input
                type="number"
                value={property.price}
                onChange={(e) => handlePropertyChange('price', parseInt(e.target.value))}
                min="0"
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={property.description}
                onChange={(e) => handlePropertyChange('description', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
                rows="2"
              ></textarea>
            </div>
          </div>
          
          <div className="mt-4">
            <button
              onClick={checkForFraud}
              disabled={isLoading}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
            >
              {isLoading ? 'Running...' : 'Run Fraud Check'}
            </button>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="mb-6 border-b">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('price')}
              className={`py-2 px-4 text-center border-b-2 font-medium text-sm ${
                activeTab === 'price'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Price Prediction
            </button>
            <button
              onClick={() => setActiveTab('recommendations')}
              className={`py-2 px-4 text-center border-b-2 font-medium text-sm ${
                activeTab === 'recommendations'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Recommendations
            </button>
            <button
              onClick={() => setActiveTab('monitoring')}
              className={`py-2 px-4 text-center border-b-2 font-medium text-sm ${
                activeTab === 'monitoring'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Model Monitoring
            </button>
          </nav>
        </div>
        
        {/* Tab content */}
        <div className="mt-6">
          {activeTab === 'price' && (
            <div>
              <h3 className="font-semibold mb-4">AI Price Estimation</h3>
              <PriceEstimator property={property} />
            </div>
          )}
          
          {activeTab === 'recommendations' && (
            <div>
              <h3 className="font-semibold mb-4">Property Recommendations</h3>
              <PropertyRecommendations userId={userId} property={property} />
            </div>
          )}
          
          {activeTab === 'monitoring' && (
            <div>
              <h3 className="font-semibold mb-4">ML Model Monitoring</h3>
              <MLModelMonitoring />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
