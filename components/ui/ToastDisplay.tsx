'use client';

import React from 'react';
import { Toast } from '@/hooks/useToast';
import { useToasts } from './ToastProvider';

export function ToastDisplay() {
  const { toasts, dismissToast } = useToasts();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-0 right-0 p-4 z-50 max-w-sm space-y-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`rounded-lg shadow-md p-4 transition-all duration-300 transform translate-y-0 opacity-100 ${
            toast.variant === 'destructive'
              ? 'bg-red-50 border border-red-200 text-red-800'
              : toast.variant === 'success'
              ? 'bg-green-50 border border-green-200 text-green-800'
              : 'bg-white border border-gray-200 text-gray-800'
          }`}
        >
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-medium">{toast.title}</h3>
              {toast.description && <p className="text-sm mt-1">{toast.description}</p>}
            </div>
            <button
              onClick={() => dismissToast(toast.id)}
              className="ml-4 text-gray-400 hover:text-gray-500"
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
