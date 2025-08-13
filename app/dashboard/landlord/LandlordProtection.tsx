'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function LandlordProtection({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { userProfile, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    if (!userProfile || userProfile.role !== 'landlord') {
      router.push('/dashboard');
    }
  }, [userProfile, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!userProfile || userProfile.role !== 'landlord') {
    return null;
  }

  return <>{children}</>;
}
