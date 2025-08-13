'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useAuth } from '@/contexts/AuthContext';

export default function DashboardRedirect() {
  const router = useRouter();
  const { user, userProfile, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    // Check if user is authenticated
    if (!user || !userProfile) {
      router.push('/auth/login');
      return;
    }

    // Handle role-based redirection
    const validRoles = ['admin', 'landlord', 'tenant'] as const;
    const userRole = validRoles.includes(userProfile.role as any) ? userProfile.role : null;
    
    if (!userRole) {
      console.warn('Invalid or missing user role:', userProfile.role);
      router.push('/auth/select-role');
      return;
    }

    // Redirect based on role
    switch (userRole) {
      case 'admin':
        router.push('/dashboard/admin');
        break;
      case 'landlord':
        router.push('/dashboard/unified');
        break;
      case 'tenant':
        router.push('/dashboard/unified');
        break;
      default:
        console.warn('Unknown user role:', userRole);
        router.push('/auth/select-role');
    }
  }, [user, userProfile, loading, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <LoadingSpinner />
      <p className="mt-4 text-gray-600">
        {loading 
          ? "Loading your dashboard..." 
          : !user 
            ? "Checking authentication..." 
            : "Redirecting to your dashboard..."}
      </p>
    </div>
  );
}
