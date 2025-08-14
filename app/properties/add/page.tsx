'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import AddPropertyForm from '@/components/property/AddPropertyForm';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function AddPropertyPage() {
  const { userProfile, loading } = useAuth();
  const router = useRouter();

  // Redirect if user is not a landlord
  useEffect(() => {
    if (!loading && userProfile?.role !== 'landlord') {
      router.push('/auth/login?redirect=/properties/add&message=You must be logged in as a landlord to list a property');
    }
  }, [userProfile, loading, router]);

  if (loading) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <div className="animate-pulse bg-gray-100 rounded-lg h-[800px]"></div>
      </div>
    );
  }

  if (!userProfile || userProfile.role !== 'landlord') {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="flex items-center text-gray-600"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </div>
      
      <AddPropertyForm />
    </div>
  );
}
