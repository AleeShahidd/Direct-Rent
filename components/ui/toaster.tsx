'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

interface ToastContextType {
  toasts: Toast[];
  showToast: (message: string, type: Toast['type']) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: Toast['type']) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast = { id, message, type };
    
    setToasts(prev => [...prev, newToast]);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, showToast, removeToast }}>
      {children}
      <Toaster />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}

// Simple toast object for backward compatibility
export const toast = {
  success: (message: string) => {
    // This will be replaced by proper implementation when react-hot-toast is available
    console.log('Success:', message);
    alert(`Success: ${message}`);
  },
  error: (message: string) => {
    console.log('Error:', message);
    alert(`Error: ${message}`);
  },
  info: (message: string) => {
    console.log('Info:', message);
    alert(`Info: ${message}`);
  }
};

export function Toaster() {
  const context = useContext(ToastContext);
  if (!context) return null;

  const { toasts, removeToast } = context;

  const getToastStyle = (type: Toast['type']) => {
    const baseStyle = "p-4 rounded-lg shadow-lg text-white font-medium flex items-center justify-between min-w-80";
    switch (type) {
      case 'success': return `${baseStyle} bg-green-500`;
      case 'error': return `${baseStyle} bg-red-500`;
      case 'warning': return `${baseStyle} bg-yellow-500`;
      case 'info': return `${baseStyle} bg-blue-500`;
      default: return `${baseStyle} bg-gray-500`;
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <div key={toast.id} className={getToastStyle(toast.type)}>
          <span>{toast.message}</span>
          <button
            onClick={() => removeToast(toast.id)}
            className="ml-4 text-white hover:text-gray-200"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
