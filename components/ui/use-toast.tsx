'use client';

import { useState } from 'react';

type ToastProps = {
  id: string;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  variant?: 'default' | 'destructive';
};

type ToastActionElement = React.ReactElement<{
  altText: string;
  onClick: () => void;
}>;

const TOAST_LIMIT = 5;
const TOAST_REMOVE_DELAY = 5000;

type ToasterToast = ToastProps & {
  id: string;
  title?: string;
  description?: string;
  action?: ToastActionElement;
  variant?: 'default' | 'destructive';
};

const actionTypes = {
  ADD_TOAST: 'ADD_TOAST',
  UPDATE_TOAST: 'UPDATE_TOAST',
  DISMISS_TOAST: 'DISMISS_TOAST',
  REMOVE_TOAST: 'REMOVE_TOAST',
} as const;

let count = 0;

function generateId() {
  return `toast-${count++}`;
}

export function toast({
  title,
  description,
  action,
  variant,
}: {
  title?: string;
  description?: string;
  action?: ToastActionElement;
  variant?: 'default' | 'destructive';
}) {
  const id = generateId();

  // This is a minimal implementation of toast functionality
  // In a real application, you'd want to use a proper toast library or context
  console.log(`Toast: ${title} - ${description}`);
  
  return {
    id,
    title,
    description,
    action,
    variant,
  };
}

export function useToast() {
  const [toasts, setToasts] = useState<ToasterToast[]>([]);

  function addToast(toast: ToasterToast) {
    setToasts((prevToasts) => {
      const newToasts = [...prevToasts, toast];
      if (newToasts.length > TOAST_LIMIT) {
        newToasts.shift();
      }
      return newToasts;
    });
    
    // Auto dismiss
    setTimeout(() => {
      dismissToast(toast.id);
    }, TOAST_REMOVE_DELAY);
  }

  function dismissToast(id: string) {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  }

  return {
    toasts,
    addToast,
    dismissToast,
    toast,
  };
}
