/**
 * ML Context Provider
 * Provides ML functionality to React components
 */

'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useMLSystem, MLSystemHealth } from '@/hooks/useMLSystem';

interface MLContextProviderProps {
  children: ReactNode;
}

interface MLContextValue {
  isMLEnabled: boolean;
  isMLHealthy: boolean;
  mlSystemHealth: MLSystemHealth | null;
  lastHealthCheck: Date | null;
  checkMLHealth: () => Promise<MLSystemHealth | null>;
  setMLEnabled: (enabled: boolean) => void;
}

const MLContext = createContext<MLContextValue | undefined>(undefined);

/**
 * ML Context Provider
 * @param children - React children
 */
export function MLContextProvider({ children }: MLContextProviderProps) {
  const [isMLEnabled, setIsMLEnabled] = useState<boolean>(true);
  const { health, lastChecked, checkHealth } = useMLSystem({
    pollingInterval: 10 * 60 * 1000, // 10 minutes
    onStatusChange: (status, health) => {
      // If ML system becomes critical, disable ML features
      if (status === 'critical') {
        setIsMLEnabled(false);
        console.warn('ML system is in critical state. ML features have been disabled.');
      }
    }
  });
  
  // Check if ML system is healthy
  const isMLHealthy = health?.status === 'healthy' || health?.status === 'warning';
  
  useEffect(() => {
    // Check if ML features should be enabled based on system health
    if (health && health.status === 'critical') {
      setIsMLEnabled(false);
    }
  }, [health]);
  
  const value: MLContextValue = {
    isMLEnabled,
    isMLHealthy,
    mlSystemHealth: health,
    lastHealthCheck: lastChecked,
    checkMLHealth: checkHealth,
    setMLEnabled: setIsMLEnabled
  };
  
  return <MLContext.Provider value={value}>{children}</MLContext.Provider>;
}

/**
 * Hook to use ML Context
 */
export function useML() {
  const context = useContext(MLContext);
  
  if (context === undefined) {
    throw new Error('useML must be used within an MLContextProvider');
  }
  
  return context;
}

/**
 * HOC that provides ML functionality to a component
 * @param Component - Component to wrap
 */
export function withML<P extends object>(Component: React.ComponentType<P>) {
  return function WithMLComponent(props: P) {
    return (
      <MLContextProvider>
        <Component {...props} />
      </MLContextProvider>
    );
  };
}
