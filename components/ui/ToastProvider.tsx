'use client';

import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { Toast, ToastVariant } from '@/hooks/useToast';
import { ToastDisplay } from '@/components/ui/ToastDisplay';

interface ToastContextProps {
  toasts: Toast[];
  showToast: (data: Omit<Toast, 'id'>) => string;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextProps | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((data: Omit<Toast, 'id'>): string => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast = { id, ...data, duration: data.duration || 5000 };
    
    setToasts((prev) => [...prev, newToast]);
    
    // Auto dismiss
    setTimeout(() => {
      dismissToast(id);
    }, newToast.duration);

    return id;
  }, []);

  const dismissToast = useCallback((id: string): void => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, showToast, dismissToast }}>
      {children}
      <ToastDisplay />
    </ToastContext.Provider>
  );
}

export function useToasts() {
  const context = useContext(ToastContext);
  
  if (!context) {
    throw new Error('useToasts must be used within a ToastProvider');
  }
  
  return {
    toasts: context.toasts,
    showToast: context.showToast,
    dismissToast: context.dismissToast
  };
}
