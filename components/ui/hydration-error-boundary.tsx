'use client';

import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  isHydrationError: boolean;
}

export class HydrationErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, isHydrationError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Check if it's a hydration error
    const isHydrationError = 
      error.message.includes('hydrated') ||
      error.message.includes('Hydration') ||
      error.message.includes('server rendered HTML didn\'t match') ||
      error.message.includes('SSR');

    return {
      hasError: true,
      isHydrationError,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (this.state.isHydrationError) {
      console.warn('Hydration error caught and suppressed:', error.message);
      // For hydration errors, we'll try to recover
      this.setState({ hasError: false, isHydrationError: false });
    } else {
      console.error('Unexpected error:', error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError && !this.state.isHydrationError) {
      return this.props.fallback || <div>Something went wrong.</div>;
    }

    return this.props.children;
  }
}
