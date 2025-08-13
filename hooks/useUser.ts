import { useAuth } from '@/contexts/AuthContext';

// Custom hook to get user information
export function useUser() {
  const { user, userProfile, loading } = useAuth();
  
  return {
    // Supabase auth user
    authUser: user,
    // Our custom user profile from database
    user: userProfile,
    // Loading state
    loading,
    // Helper functions
    isAuthenticated: !!user,
    isLandlord: userProfile?.role === 'landlord',
    isTenant: userProfile?.role === 'tenant',
    isAdmin: userProfile?.role === 'admin',
    isEmailVerified: userProfile?.email_verified || false,
    isPhoneVerified: userProfile?.phone_verified || false,
    isProfileComplete: !!(userProfile?.first_name && userProfile?.last_name && userProfile?.date_of_birth),
  };
}

// Hook for checking permissions
export function usePermissions() {
  const { user } = useUser();
  
  return {
    canCreateProperty: user?.role === 'landlord',
    canViewAllProperties: user?.role === 'admin',
    canManageUsers: user?.role === 'admin',
    canEditProperty: (propertyLandlordId: string) => 
      user?.role === 'admin' || user?.id === propertyLandlordId,
    canViewBookings: (propertyLandlordId: string, bookingUserId: string) =>
      user?.role === 'admin' || user?.id === propertyLandlordId || user?.id === bookingUserId,
  };
}
