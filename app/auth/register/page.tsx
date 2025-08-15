'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'

interface RegisterFormData {
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  password: string;
  confirmPassword: string;
  role: 'landlord' | 'tenant';
  acceptTerms: boolean;
}

export default function RegisterPage() {
  const [formData, setFormData] = useState<RegisterFormData>({
    firstName: '',
    lastName: '',
    fullName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    password: '',
    confirmPassword: '',
    role: 'tenant',
    acceptTerms: false,
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => {
      const updated = {
        ...prev,
        [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
      }
      
      // Auto-generate full name when first or last name changes
      if (name === 'firstName' || name === 'lastName') {
        updated.fullName = `${updated.firstName} ${updated.lastName}`.trim()
      }
      
      return updated
    })
  }

  const validateForm = () => {
    if (!formData.firstName.trim()) {
      setError('First name is required')
      return false
    }
    if (!formData.lastName.trim()) {
      setError('Last name is required')
      return false
    }
    if (!formData.email.trim()) {
      setError('Email is required')
      return false
    }
    if (!formData.dateOfBirth) {
      setError('Date of birth is required')
      return false
    }
    
    // Check age requirement (18+)
    const birthDate = new Date(formData.dateOfBirth)
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    
    if (age < 18) {
      setError('You must be at least 18 years old to register')
      return false
    }
    
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long')
      return false
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return false
    }
    if (!formData.acceptTerms) {
      setError('You must accept the terms and conditions')
      return false
    }
    return true
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Validate email format
      if (!formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
        throw new Error('Please enter a valid email address');
      }

      // Get user's IP address
      let userIP = '';
      try {
        const ipResponse = await fetch('https://api.ipify.org?format=json');
        const ipData = await ipResponse.json();
        userIP = ipData.ip;
        console.log('User IP address retrieved:', userIP);
      } catch (ipError) {
        console.warn('Could not fetch IP address:', ipError);
      }

      // Check for existing user with proper error handling
      try {
        const { data: existingUser, error: existingUserError } = await supabase
          .from('users')
          .select('id')
          .eq('email', formData.email)
          .maybeSingle(); // Use maybeSingle() instead of single() to avoid errors if no match

        if (existingUserError) {
          console.warn('Error checking for existing user:', existingUserError);
          // Continue with registration anyway - the unique constraint will catch duplicates
        } else if (existingUser) {
          throw new Error('An account with this email already exists');
        }
      } catch (existingUserCheckError) {
        // Only rethrow if it's our custom error about existing accounts
        if (existingUserCheckError instanceof Error && 
            existingUserCheckError.message.includes('already exists')) {
          throw existingUserCheckError;
        }
        // Otherwise log and continue
        console.warn('Error during existing user check:', existingUserCheckError);
      }

      // Format phone number
      const formattedPhone = formData.phone ? formData.phone.replace(/\s+/g, '') : null;

      // IMPORTANT: Include the user data directly in the signUp call to fix the auth error
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            name: formData.fullName,
            first_name: formData.firstName,
            last_name: formData.lastName,
            phone: formattedPhone,
            role: formData.role,
            date_of_birth: formData.dateOfBirth
          }
        }
      });

      if (authError) {
        console.error('Auth signup error:', authError);
        throw new Error(authError.message || 'Failed to create account');
      }

      if (!authData.user) {
        throw new Error('Failed to create account - no user returned');
      }
      
      console.log('Auth user created successfully with ID:', authData.user.id);

      // Now create or update the user profile in the users table
      // Create a user object that matches the schema
      const userData = {
        id: authData.user.id,
        email: formData.email,
        name: formData.fullName,
        first_name: formData.firstName,
        last_name: formData.lastName,
        phone: formattedPhone,
        role: formData.role,
        date_of_birth: formData.dateOfBirth,
        email_verified: false,
        phone_verified: false,
        verification_status: 'pending',
        account_status: 'active',
        registration_ip: userIP || null
      };

      // Use upsert to handle both insert and update cases
      const { error: profileError } = await supabase
        .from('users')
        .upsert(userData, { onConflict: 'id', ignoreDuplicates: false });

      if (profileError) {
        console.error('Profile creation failed:', profileError);
        
        // Don't throw error here - the auth account is already created
        // Just show a warning that profile setup may be incomplete
        console.warn('User account created but profile setup may be incomplete.');
      } else {
        console.log('User profile created successfully');
      }
      
      alert('Registration successful! Please check your email to verify your account.');
      router.push('/auth/login');

    } catch (error) {
      console.error('Registration error:', error);
      
      // Provide more specific error messages based on error types
      let displayError = error instanceof Error ? error.message : 'An unexpected error occurred';
      
      // Handle Supabase API errors
      if (typeof error === 'object' && error !== null) {
        // Cast error to a type that matches Supabase error shape
        const supabaseError = error as { code?: string; statusCode?: number; message?: string };
        
        if (supabaseError.code === 'auth/internal-error' || supabaseError.statusCode === 500) {
          displayError = 'Authentication service temporarily unavailable. Please try again later.';
        }
        
        // Handle transaction errors explicitly
        if (typeof supabaseError.message === 'string' && supabaseError.message.includes('current transaction is aborted')) {
          displayError = 'Database transaction error. Please try again.';
        }
        
        // Handle schema mismatch errors
        if (typeof supabaseError.message === 'string' && supabaseError.message.includes('column') && supabaseError.message.includes('does not exist')) {
          displayError = 'Database schema mismatch. Please contact support.';
        }
      }
      
      setError(displayError);
    } finally {
      setLoading(false);
    }
  };
    
      // Proceed with signup

  const handleGoogleSignUp = async () => {
    try {
      setLoading(true);
      const redirectTo = typeof window !== 'undefined' 
        ? `${window.location.origin}/auth/callback`
        : '/auth/callback'
        
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      })

    

      if (error) {
        console.error('Google signup error:', error);
        setError(error.message);
        return;
      }

      if (!data.url) {
        setError('Failed to get authorization URL');
        return;
      }

      // Redirect to the OAuth URL
      window.location.href = data.url;
    } catch (error) {
      console.error('Google sign up error:', error)
      setError('An unexpected error occurred')
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <Link href="/" className="flex justify-center">
            <div className="flex items-center space-x-2">
              <div className="w-12 h-12 bg-primary-600 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">DirectRent</h1>
                <p className="text-sm text-primary-600">UK</p>
              </div>
            </div>
          </Link>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link href="/auth/login" className="font-medium text-primary-600 hover:text-primary-500">
              Sign in here
            </Link>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleRegister}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              {error}
            </div>
          )}

          <div className="space-y-4">
            {/* Account Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                I am a:
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className={`
                  relative flex cursor-pointer rounded-lg border p-4 focus:outline-none
                  ${formData.role === 'tenant' ? 'border-primary-600 bg-primary-50' : 'border-gray-300 bg-white'}
                `}>
                  <input
                    type="radio"
                    name="role"
                    value="tenant"
                    checked={formData.role === 'tenant'}
                    onChange={handleInputChange}
                    className="sr-only"
                  />
                  <div className="flex items-center space-x-3">
                    <div className="text-sm">
                      <div className="font-medium text-gray-900">Tenant</div>
                      <div className="text-gray-500">Looking for a property</div>
                    </div>
                  </div>
                </label>
                <label className={`
                  relative flex cursor-pointer rounded-lg border p-4 focus:outline-none
                  ${formData.role === 'landlord' ? 'border-primary-600 bg-primary-50' : 'border-gray-300 bg-white'}
                `}>
                  <input
                    type="radio"
                    name="role"
                    value="landlord"
                    checked={formData.role === 'landlord'}
                    onChange={handleInputChange}
                    className="sr-only"
                  />
                  <div className="flex items-center space-x-3">
                    <div className="text-sm">
                      <div className="font-medium text-gray-900">Landlord</div>
                      <div className="text-gray-500">Listing properties</div>
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* First Name and Last Name */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                  First Name
                </label>
                <Input
                  id="firstName"
                  name="firstName"
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={handleInputChange}
                  placeholder="Enter your first name"
                  className="mt-1"
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                  Last Name
                </label>
                <Input
                  id="lastName"
                  name="lastName"
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={handleInputChange}
                  placeholder="Enter your last name"
                  className="mt-1"
                />
              </div>
            </div>

            {/* Full Name (Auto-generated and read-only) */}
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <Input
                id="fullName"
                name="fullName"
                type="text"
                value={formData.fullName}
                readOnly
                placeholder="Auto-generated from first and last name"
                className="mt-1 bg-gray-50"
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Enter your email"
                className="mt-1"
              />
            </div>

            {/* Date of Birth */}
            <div>
              <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700">
                Date of Birth
              </label>
              <Input
                id="dateOfBirth"
                name="dateOfBirth"
                type="date"
                required
                value={formData.dateOfBirth}
                onChange={handleInputChange}
                className="mt-1"
                max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
              />
              <p className="mt-1 text-sm text-gray-500">You must be at least 18 years old</p>
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                Phone Number (UK)
              </label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="+44 7xxx xxx xxx"
                className="mt-1"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1 relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Create a password (min. 8 characters)"
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <div className="mt-1 relative">
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="Confirm your password"
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Terms and Conditions */}
          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="acceptTerms"
                name="acceptTerms"
                type="checkbox"
                checked={formData.acceptTerms}
                onChange={handleInputChange}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor="acceptTerms" className="text-gray-700">
                I agree to the{' '}
                <Link href="/terms" className="text-primary-600 hover:text-primary-500">
                  Terms and Conditions
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className="text-primary-600 hover:text-primary-500">
                  Privacy Policy
                </Link>
              </label>
            </div>
          </div>

          <div>
            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? 'Creating account...' : 'Create account'}
            </Button>
          </div>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gray-50 text-gray-500">Or continue with</span>
              </div>
            </div>

            <div className="mt-6">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleGoogleSignUp}
                disabled={loading}
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Sign up with Google
              </Button>
            </div>
          </div>

          <div className="text-center">
            <p className="text-xs text-gray-600">
              By creating an account, you agree to receive marketing communications from DirectRent UK. 
              You can unsubscribe at any time.
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}
