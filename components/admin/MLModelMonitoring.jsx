/**
 * ML Model Monitoring Component
 * Admin dashboard component for monitoring ML model performance
 */

'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';

export default function MLModelMonitoring() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [healthData, setHealthData] = useState(null);
  const [metricsData, setMetricsData] = useState([]);
  
  useEffect(() => {
    fetchMLHealth();
    fetchModelMetrics();
    
    // Poll health every 5 minutes
    const interval = setInterval(() => {
      fetchMLHealth();
    }, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Fetch ML system health
  const fetchMLHealth = async () => {
    setLoading(true);
    
    try {
      const response = await axios.get('/api/ml/health');
      setHealthData(response.data);
    } catch (err) {
      console.log('Error fetching ML health:', err);
      setError('Failed to load ML system health data');
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch model metrics from database
  const fetchModelMetrics = async () => {
    try {
      // In a real application, this would come from the database
      // We'll mock some data for demonstration
      const mockMetrics = generateMockMetrics();
      setMetricsData(mockMetrics);
    } catch (err) {
      console.log('Error fetching model metrics:', err);
    }
  };
  
  // Generate mock metrics data for demonstration
  const generateMockMetrics = () => {
    const now = new Date();
    const metrics = [];
    
    // Generate data for the last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      metrics.push({
        date: dateStr,
        price_accuracy: 0.92 + (Math.random() * 0.04),
        recommendation_precision: 0.72 + (Math.random() * 0.08),
        fraud_precision: 0.94 + (Math.random() * 0.03),
        latency_ms: 45 + (Math.random() * 30)
      });
    }
    
    return metrics;
  };
  
  // Get health status color
  const getHealthStatusColor = (status) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600';
      case 'warning':
        return 'text-yellow-500';
      case 'degraded':
        return 'text-orange-500';
      case 'critical':
        return 'text-red-600';
      default:
        return 'text-gray-500';
    }
  };
  
  // Get model status indicator
  const getModelStatusIndicator = (status) => {
    switch (status) {
      case 'active':
        return { color: 'bg-green-500', text: 'Active' };
      case 'partial':
        return { color: 'bg-yellow-500', text: 'Partial' };
      case 'not_found':
        return { color: 'bg-red-500', text: 'Not Found' };
      default:
        return { color: 'bg-gray-500', text: 'Unknown' };
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold mb-6">ML Model Monitoring</h2>
      
      {loading && !healthData && (
        <div className="animate-pulse">
          <div className="h-32 bg-gray-200 rounded mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      )}
      
      {error && (
        <div className="bg-red-50 text-red-500 p-4 rounded-lg">
          {error}
        </div>
      )}
      
      {healthData && (
        <div className="space-y-6">
          {/* Overall health status */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">System Health</h3>
              <span className={`font-medium ${getHealthStatusColor(healthData.status)}`}>
                {healthData.status.toUpperCase()}
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Model statuses */}
              {Object.entries(healthData.models).map(([modelName, modelData]) => {
                const status = getModelStatusIndicator(modelData.status);
                
                return (
                  <div key={modelName} className="bg-white p-3 rounded shadow-sm">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium capitalize">{modelName.replace(/_/g, ' ')}</h4>
                      <div className="flex items-center">
                        <div className={`w-2 h-2 rounded-full ${status.color} mr-1`}></div>
                        <span className="text-xs">{status.text}</span>
                      </div>
                    </div>
                    
                    {modelData.metrics && (
                      <div className="mt-2 text-xs text-gray-500">
                        {Object.entries(modelData.metrics).map(([key, value]) => {
                          if (key === 'timestamp' || key === 'created_at') return null;
                          
                          return (
                            <div key={key} className="flex justify-between">
                              <span className="capitalize">{key.replace(/_/g, ' ')}</span>
                              <span className="font-medium">
                                {typeof value === 'number' ? 
                                  (key.includes('score') || key.includes('accuracy') ? 
                                    `${(value * 100).toFixed(1)}%` : value.toFixed(3)) : 
                                  value}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            
            <div className="text-xs text-gray-500 mt-4">
              Last updated: {new Date(healthData.timestamp).toLocaleString()}
            </div>
          </div>
          
          {/* Performance metrics over time */}
          <div>
            <h3 className="font-semibold mb-4">Performance Metrics</h3>
            
            <div className="space-y-6">
              {/* Accuracy metrics */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium mb-3">Model Accuracy</h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={metricsData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis domain={[0.6, 1]} tickFormatter={tick => `${(tick * 100).toFixed(0)}%`} />
                      <Tooltip formatter={(value) => `${(value * 100).toFixed(1)}%`} />
                      <Legend />
                      <Line type="monotone" dataKey="price_accuracy" name="Price Prediction" stroke="#8884d8" />
                      <Line type="monotone" dataKey="recommendation_precision" name="Recommendations" stroke="#82ca9d" />
                      <Line type="monotone" dataKey="fraud_precision" name="Fraud Detection" stroke="#ff7300" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              {/* Latency metrics */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium mb-3">API Response Time</h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={metricsData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis label={{ value: 'ms', angle: -90, position: 'insideLeft' }} />
                      <Tooltip formatter={(value) => `${value.toFixed(1)} ms`} />
                      <Bar dataKey="latency_ms" name="Avg Response Time" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
          
          {/* Model management actions */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-4">Model Management</h3>
            <div className="flex flex-wrap gap-3">
              <button 
                className="px-3 py-2 bg-indigo-600 text-white text-sm font-medium rounded hover:bg-indigo-700"
                onClick={() => alert('This would trigger model retraining in production')}
              >
                Retrain All Models
              </button>
              <button 
                className="px-3 py-2 bg-gray-200 text-gray-800 text-sm font-medium rounded hover:bg-gray-300"
                onClick={() => fetchMLHealth()}
              >
                Refresh Health Status
              </button>
              <button 
                className="px-3 py-2 bg-gray-200 text-gray-800 text-sm font-medium rounded hover:bg-gray-300"
                onClick={() => alert('This would export model metrics in production')}
              >
                Export Metrics
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
