/**
 * ML System Hook
 * Custom hook for monitoring and managing the ML system
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

export interface ModelHealth {
  status: 'active' | 'partial' | 'degraded' | 'not_found';
  model_type?: string;
  metrics?: {
    [key: string]: any;
  };
  error?: string;
}

export interface MLSystemHealth {
  status: 'healthy' | 'warning' | 'degraded' | 'critical';
  timestamp: string;
  models: {
    price_prediction: ModelHealth;
    fraud_detection: ModelHealth;
    recommendation_engine: ModelHealth;
    [key: string]: ModelHealth;
  };
  runtime_environment?: {
    node_version: string;
    tensorflow_backend: string;
    memory_usage: {
      rss: number;
      heapTotal: number;
      heapUsed: number;
      external: number;
    };
  };
}

export interface ModelMetrics {
  date: string;
  price_accuracy: number;
  recommendation_precision: number;
  fraud_precision: number;
  latency_ms: number;
  [key: string]: any;
}

interface UseMLSystemOptions {
  pollingInterval?: number;
  onStatusChange?: (status: string, health: MLSystemHealth) => void;
  onError?: (error: any) => void;
}

/**
 * Custom hook for monitoring and managing the ML system
 * @param options - Configuration options
 */
export function useMLSystem(options: UseMLSystemOptions = {}) {
  const [health, setHealth] = useState<MLSystemHealth | null>(null);
  const [metrics, setMetrics] = useState<ModelMetrics[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  
  const { 
    pollingInterval = 5 * 60 * 1000, // 5 minutes
    onStatusChange,
    onError 
  } = options;
  
  /**
   * Fetch ML system health
   */
  const checkHealth = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.get('/api/ml/health');
      const healthData = response.data as MLSystemHealth;
      
      setHealth(healthData);
      setLastChecked(new Date());
      
      // Call callback if status changed
      if (onStatusChange && health && health.status !== healthData.status) {
        onStatusChange(healthData.status, healthData);
      }
      
      return healthData;
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'Error checking ML system health';
      setError(errorMessage);
      if (onError) onError(err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [health, onStatusChange, onError]);
  
  /**
   * Fetch ML metrics data
   */
  const fetchMetrics = useCallback(async (days: number = 7) => {
    setIsLoading(true);
    
    try {
      const response = await axios.get('/api/ml/metrics', {
        params: { days }
      });
      
      setMetrics(response.data.metrics || []);
    } catch (err: any) {
      // Don't set main error state for metrics
      console.log('Error fetching ML metrics:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  /**
   * Trigger model retraining
   */
  const retrainModel = useCallback(async (
    modelType: 'price' | 'fraud' | 'recommendation' | 'all'
  ) => {
    setIsLoading(true);
    
    try {
      const response = await axios.post('/api/ml/train', {
        model: modelType
      });
      
      // Refresh health after training
      await checkHealth();
      
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'Error retraining model';
      setError(errorMessage);
      if (onError) onError(err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [checkHealth, onError]);
  
  // Check health on initial render
  useEffect(() => {
    checkHealth();
    fetchMetrics();
  }, [checkHealth, fetchMetrics]);
  
  // Set up polling interval
  useEffect(() => {
    if (pollingInterval <= 0) return;
    
    const interval = setInterval(() => {
      checkHealth();
    }, pollingInterval);
    
    return () => clearInterval(interval);
  }, [pollingInterval, checkHealth]);
  
  return {
    health,
    metrics,
    isLoading,
    error,
    lastChecked,
    checkHealth,
    fetchMetrics,
    retrainModel
  };
}
