'use client';

import React, { useState, useEffect } from 'react';

interface ModelMetrics {
  model_name: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  auc: number;
  inference_time_ms: number;
  requests_today: number;
  error_rate: number;
  last_updated: string;
  status: 'healthy' | 'warning' | 'error';
}

interface ModelPerformanceData {
  timestamp: string;
  accuracy: number;
  latency: number;
  error_rate: number;
}

export function MLModelMonitoring() {
  const [models, setModels] = useState<ModelMetrics[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('price_model');
  const [performanceData, setPerformanceData] = useState<ModelPerformanceData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchModelMetrics();
    fetchPerformanceData();
    
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchModelMetrics();
      fetchPerformanceData();
    }, 30000);

    return () => clearInterval(interval);
  }, [selectedModel]);

  const fetchModelMetrics = async () => {
    try {
      // In production, this would call the ML API health endpoint
      const response = await fetch('/api/ml/health');
      
      if (response.ok) {
        const data = await response.json();
        // Mock data for now
        setModels([
          {
            model_name: 'Price Prediction Model',
            accuracy: 0.94,
            precision: 0.92,
            recall: 0.89,
            f1_score: 0.90,
            auc: 0.96,
            inference_time_ms: 12,
            requests_today: 1247,
            error_rate: 0.02,
            last_updated: new Date().toISOString(),
            status: 'healthy'
          },
          {
            model_name: 'Fraud Detection Model',
            accuracy: 0.96,
            precision: 0.94,
            recall: 0.92,
            f1_score: 0.93,
            auc: 0.98,
            inference_time_ms: 35,
            requests_today: 453,
            error_rate: 0.01,
            last_updated: new Date().toISOString(),
            status: 'healthy'
          },
          {
            model_name: 'Recommendation Model',
            accuracy: 0.74,
            precision: 0.78,
            recall: 0.71,
            f1_score: 0.74,
            auc: 0.82,
            inference_time_ms: 28,
            requests_today: 891,
            error_rate: 0.03,
            last_updated: new Date().toISOString(),
            status: 'warning'
          }
        ]);
      } else {
        // Mock data if ML API is not available
        setModels([]);
      }
    } catch (error) {
      console.error('Failed to fetch model metrics:', error);
      // Use mock data as fallback
      setModels([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPerformanceData = async () => {
    // Mock performance data for the last 24 hours
    const now = new Date();
    const data: ModelPerformanceData[] = [];
    
    for (let i = 23; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000);
      data.push({
        timestamp: timestamp.toISOString(),
        accuracy: 0.85 + Math.random() * 0.1,
        latency: 20 + Math.random() * 20,
        error_rate: Math.random() * 0.05
      });
    }
    
    setPerformanceData(data);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-100 text-green-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return '✅';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      default: return '❓';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
            <span className="text-gray-600">Loading ML model metrics...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">ML Model Monitoring</h2>
          <p className="text-gray-600 mt-1">Monitor model performance, accuracy, and system health</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center text-sm text-gray-600">
            <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
            Last updated: {new Date().toLocaleTimeString()}
          </div>
          <button
            onClick={() => {
              fetchModelMetrics();
              fetchPerformanceData();
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Model Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {models.map((model, index) => (
          <div
            key={model.model_name}
            className={`bg-white rounded-lg shadow-sm border p-6 cursor-pointer transition-all ${
              selectedModel === model.model_name ? 'ring-2 ring-blue-500' : 'hover:shadow-md'
            }`}
            onClick={() => setSelectedModel(model.model_name)}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">{model.model_name}</h3>
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(model.status)}`}>
                {getStatusIcon(model.status)} {model.status}
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Accuracy</p>
                <p className="text-2xl font-bold text-gray-900">{(model.accuracy * 100).toFixed(1)}%</p>
              </div>
              <div>
                <p className="text-gray-600">Latency</p>
                <p className="text-2xl font-bold text-gray-900">{model.inference_time_ms}ms</p>
              </div>
              <div>
                <p className="text-gray-600">Requests Today</p>
                <p className="text-lg font-semibold text-gray-900">{model.requests_today.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-gray-600">Error Rate</p>
                <p className="text-lg font-semibold text-gray-900">{(model.error_rate * 100).toFixed(2)}%</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Detailed Metrics */}
      {models.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Performance Metrics */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h3>
            
            {models.map(model => (
              selectedModel === model.model_name && (
                <div key={model.model_name} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">Precision</p>
                      <p className="text-xl font-bold text-gray-900">{(model.precision * 100).toFixed(1)}%</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">Recall</p>
                      <p className="text-xl font-bold text-gray-900">{(model.recall * 100).toFixed(1)}%</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">F1-Score</p>
                      <p className="text-xl font-bold text-gray-900">{(model.f1_score * 100).toFixed(1)}%</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">AUC</p>
                      <p className="text-xl font-bold text-gray-900">{(model.auc * 100).toFixed(1)}%</p>
                    </div>
                  </div>
                </div>
              )
            ))}
          </div>

          {/* Performance Trends */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">24-Hour Performance Trend</h3>
            
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-600 font-medium">Average Accuracy (24h)</p>
                <p className="text-2xl font-bold text-blue-900">
                  {performanceData.length > 0 
                    ? (performanceData.reduce((sum, d) => sum + d.accuracy, 0) / performanceData.length * 100).toFixed(1)
                    : '0'
                  }%
                </p>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-green-600 font-medium">Average Latency (24h)</p>
                <p className="text-2xl font-bold text-green-900">
                  {performanceData.length > 0 
                    ? (performanceData.reduce((sum, d) => sum + d.latency, 0) / performanceData.length).toFixed(1)
                    : '0'
                  }ms
                </p>
              </div>
              
              <div className="bg-red-50 p-4 rounded-lg">
                <p className="text-sm text-red-600 font-medium">Average Error Rate (24h)</p>
                <p className="text-2xl font-bold text-red-900">
                  {performanceData.length > 0 
                    ? (performanceData.reduce((sum, d) => sum + d.error_rate, 0) / performanceData.length * 100).toFixed(2)
                    : '0'
                  }%
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Alerts and Recommendations */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">🚨 Alerts & Recommendations</h3>
        
        <div className="space-y-3">
          <div className="flex items-start p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <span className="text-yellow-600 mr-3">⚠️</span>
            <div>
              <p className="text-yellow-800 font-medium">Recommendation Model Performance</p>
              <p className="text-yellow-700 text-sm">Model accuracy has dropped to 74%. Consider retraining with recent data.</p>
            </div>
          </div>
          
          <div className="flex items-start p-3 bg-green-50 border border-green-200 rounded-md">
            <span className="text-green-600 mr-3">✅</span>
            <div>
              <p className="text-green-800 font-medium">Fraud Detection Performing Well</p>
              <p className="text-green-700 text-sm">96% accuracy maintained with low false positive rate.</p>
            </div>
          </div>
          
          <div className="flex items-start p-3 bg-blue-50 border border-blue-200 rounded-md">
            <span className="text-blue-600 mr-3">💡</span>
            <div>
              <p className="text-blue-800 font-medium">Model Optimization Opportunity</p>
              <p className="text-blue-700 text-sm">Price prediction model could benefit from feature engineering on location data.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
