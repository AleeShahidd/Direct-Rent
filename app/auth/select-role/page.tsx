'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

export default function RoleSelection() {
  const router = useRouter();
  const { user, userProfile, refreshUser } = useAuth();
  const [selectedRole, setSelectedRole] = useState<'tenant' | 'landlord' | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect if user already has a role
  if (userProfile?.role && user.role !== 'authenticated') {
    router.push('/dashboard');
    return null;
  }

  const handleRoleSelection = async () => {
    if (!selectedRole || !user) return;
    
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase
        .from('users')
        .update({ 
          role: selectedRole,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;

      // Refresh user profile to get the new role
      await refreshUser();
      
      // Redirect to appropriate dashboard
      router.push('/dashboard');
    } catch (err) {
      setError('Failed to update role. Please try again.');
      console.error('Error updating role:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Welcome to DirectRent UK
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Please select your role to continue
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <button
            onClick={() => setSelectedRole('tenant')}
            className={`relative w-full flex justify-center py-4 px-4 border ${
              selectedRole === 'tenant'
                ? 'border-primary-500 ring-2 ring-primary-500 bg-primary-50'
                : 'border-gray-300 hover:border-primary-500'
            } rounded-lg transition-all duration-200`}
          >
            <div className="text-left">
              <div className="text-lg font-medium text-gray-900">I want to rent a property</div>
              <div className="text-sm text-gray-500">
                Browse available properties and connect with landlords
              </div>
            </div>
          </button>

          <button
            onClick={() => setSelectedRole('landlord')}
            className={`relative w-full flex justify-center py-4 px-4 border ${
              selectedRole === 'landlord'
                ? 'border-primary-500 ring-2 ring-primary-500 bg-primary-50'
                : 'border-gray-300 hover:border-primary-500'
            } rounded-lg transition-all duration-200`}
          >
            <div className="text-left">
              <div className="text-lg font-medium text-gray-900">I want to list my property</div>
              <div className="text-sm text-gray-500">
                List your properties and manage tenant inquiries
              </div>
            </div>
          </button>
        </div>

        <button
          onClick={handleRoleSelection}
          disabled={!selectedRole || loading}
          className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white ${
            selectedRole && !loading
              ? 'bg-primary-600 hover:bg-primary-700'
              : 'bg-gray-400 cursor-not-allowed'
          } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500`}
        >
          {loading ? 'Setting up your account...' : 'Continue'}
        </button>

        <p className="text-xs text-center text-gray-500 mt-4">
          You can change your role later from your account settings
        </p>
      </div>
    </div>
  );
}
