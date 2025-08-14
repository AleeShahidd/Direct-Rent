'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { User as AppUser } from '@/types';

interface AuthContextType {
  user: User | null;
  userProfile: AppUser | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = async (userId: string, sessionUser?: User | null) => {
    try {
      // Add delay to ensure auth is propagated
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Always try to get the existing profile first
      const { data: existingProfile, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      // Log any fetch errors for debugging
      if (fetchError) {
        console.warn('Error fetching user profile:', fetchError);
      }

      if (!fetchError && existingProfile) {
        return existingProfile;
      }

      // If no session user, we can't create a profile
      if (!sessionUser?.id || !sessionUser.email) {
        console.error('No session user data available for profile creation');
        return null;
      }

      // Extract metadata for new profile creation
      const metadata = sessionUser.user_metadata || {};
      const email = sessionUser.email;
      const fullName = metadata.full_name || metadata.name || email.split('@')[0];
      const firstName = metadata.first_name || metadata.given_name || fullName.split(' ')[0];
      const lastName = metadata.last_name || metadata.family_name || fullName.split(' ').slice(1).join(' ');
      const role = metadata.role || 'tenant';
      const phone = metadata.phone || null;
      const avatarUrl = metadata.avatar_url || metadata.picture || null;
      const dateOfBirth = metadata.date_of_birth || null;

      // Create the base profile - use a flexible approach that works with either schema
      const profileData = {
        id: userId,
        email: sessionUser.email,
        // Include both name and full_name to handle schema differences
        name: fullName,
        full_name: fullName,
        first_name: firstName,
        last_name: lastName,
        role: role,
        email_verified: Boolean(sessionUser.email_confirmed_at),
        phone_verified: false,
        verification_status: 'pending',
        account_status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_login: new Date().toISOString(),
        phone: phone,
        avatar_url: avatarUrl,
        date_of_birth: dateOfBirth
      };

      // Try to create or update the profile
      const { data: createdProfile, error: createError } = await supabase
        .from('users')
        .upsert(profileData, {
          onConflict: 'id',
          ignoreDuplicates: false
        })
        .select()
        .single();

      if (createError) {
        console.error('Profile creation/update failed:', createError);
        // Try one more time after a delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        const { data: retryProfile, error: retryError } = await supabase
          .from('users')
          .upsert(profileData, {
            onConflict: 'id',
            ignoreDuplicates: false
          })
          .select()
          .single();

        if (retryError) {
          console.error('Profile retry failed:', retryError);
          return null;
        }
        return retryProfile;
      }

      // After successful creation, update with additional details
      if (createdProfile) {
        // Get optional metadata
        const additionalData = {
          avatar_url: metadata.avatar_url || metadata.picture || null,
          phone: metadata.phone || null,
          phone_verified: metadata.phone_verified || false
        };

        // Try to get IP address
        try {
          const ipResponse = await fetch('https://api.ipify.org?format=json');
          const ipData = await ipResponse.json();
          additionalData['registration_ip'] = ipData.ip;
        } catch (ipError) {
          console.warn('Could not fetch IP address:', ipError);
        }

        // Update the profile with additional data
        const { error: updateError } = await supabase
          .from('users')
          .update(additionalData)
          .eq('id', userId);

        if (updateError) {
          console.warn('Error updating additional profile data:', updateError);
        }

        return { ...createdProfile, ...additionalData };
      }

      return createdProfile;
    } catch (error) {
      console.error('Unexpected error in fetchUserProfile:', error);
      return null;
    }
  };

  const refreshUser = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) {
        console.error('Error refreshing user:', error.message || error);
        setUser(null);
        setUserProfile(null);
        return;
      }

      setUser(user);

      if (user) {
        const profile = await fetchUserProfile(user.id);
        setUserProfile(profile);
      } else {
        setUserProfile(null);
      }
    } catch (error) {
      console.error('Unexpected error refreshing user:', error);
      setUser(null);
      setUserProfile(null);
    }
  };

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Error getting initial session:', error.message || error);
          setLoading(false);
          return;
        }

        const currentUser = session?.user ?? null;
        setUser(currentUser);

        if (currentUser) {
          const profile = await fetchUserProfile(currentUser.id, currentUser);
          if (profile) {
            // Check if we need to update the role from metadata
            if (currentUser.user_metadata?.role && profile.role !== currentUser.user_metadata.role) {
              await supabase
                .from('users')
                .update({ 
                  role: currentUser.user_metadata.role,
                  updated_at: new Date().toISOString()
                })
                .eq('id', currentUser.id);
              
              // Fetch updated profile
              const updatedProfile = await fetchUserProfile(currentUser.id, currentUser);
              setUserProfile(updatedProfile);
            } else {
              setUserProfile(profile);
            }
          } else {
            setUserProfile(null);
          }
        } else {
          setUserProfile(null);
        }
      } catch (error) {
        console.error('Unexpected error getting initial session:', error);
        setUser(null);
        setUserProfile(null);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        try {
          setUser(session?.user ?? null);

          if (session?.user) {
            const profile = await fetchUserProfile(session.user.id, session.user);
            
            if (profile) {
              // Update last login time
              await supabase
                .from('users')
                .update({ 
                  last_login: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                })
                .eq('id', session.user.id);

              // Update user metadata if needed
              if (session.user.user_metadata?.role && profile.role !== session.user.user_metadata.role) {
                await supabase
                  .from('users')
                  .update({ 
                    role: session.user.user_metadata.role,
                    updated_at: new Date().toISOString()
                  })
                  .eq('id', session.user.id);
                
                // Fetch updated profile
                const updatedProfile = await fetchUserProfile(session.user.id, session.user);
                setUserProfile(updatedProfile);
              } else {
                setUserProfile(profile);
              }
            } else {
              setUserProfile(null);
            }
          } else {
            setUserProfile(null);
          }
        } catch (error) {
          console.error('Unexpected error during auth state change:', error);
        } finally {
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const value: AuthContextType = {
    user,
    userProfile,
    loading,
    signOut,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
