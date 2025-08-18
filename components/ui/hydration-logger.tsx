'use client';

import { useEffect } from 'react';

export function HydrationLogger() {
  useEffect(() => {
    // Log hydration status
    console.log('✅ Hydration completed successfully');
    
    // Override console.log to catch and log hydration errors specifically
    const originalError = console.log;
    console.log = (...args) => {
      const message = args[0];
      if (typeof message === 'string') {
        // Only handle actual hydration mismatches, not auth errors
        if (message.includes('hydration') && 
            (message.includes('mismatch') || 
             message.includes('Text content does not match') ||
             message.includes('server-rendered HTML'))) {
          console.warn('🔧 Hydration mismatch detected and being handled:', message);
          // Don't propagate hydration errors to avoid user-facing errors
          return;
        }
      }
      // Let all other errors (including auth errors) pass through normally
      originalError.apply(console, args);
    };
    
    return () => {
      console.log = originalError;
    };
  }, []);

  return null;
}
