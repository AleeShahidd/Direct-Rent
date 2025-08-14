'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { usePricePrediction } from '@/hooks/usePricePrediction';
import { useFraudDetection } from '@/hooks/useFraudDetection';
import { useAuth } from '@/contexts/AuthContext';
import { useML } from '@/contexts/MLContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '../ui';
import { Loader2, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';

// Define the property schema with validation
const propertySchema = z.object({
  title: z.string().min(10, 'Title must be at least 10 characters'),
  description: z.string().min(50, 'Description must be at least 50 characters'),
  price_per_month: z.number().positive('Price must be greater than 0'),
  deposit_amount: z.number().positive('Deposit must be greater than 0'),
  postcode: z.string().min(5, 'Enter a valid UK postcode'),
  address_line1: z.string().min(5, 'Address is required'),
  address_line2: z.string().optional(),
  city: z.string().min(2, 'City is required'),
  country: z.string().default('United Kingdom'),
  council_tax_band: z.enum(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']),
  epc_rating: z.enum(['A', 'B', 'C', 'D', 'E', 'F', 'G']),
  furnishing_status: z.enum(['Furnished', 'Unfurnished', 'Part-Furnished']),
  bedrooms: z.number().int().positive('Number of bedrooms is required'),
  bathrooms: z.number().int().positive('Number of bathrooms is required'),
  property_type: z.enum(['Flat', 'House', 'Studio', 'Bungalow', 'Maisonette']),
  available_from: z.string(),
  minimum_tenancy_months: z.number().int().min(1, 'Minimum tenancy is required'),
  parking: z.boolean().default(false),
  garden: z.boolean().default(false),
  balcony: z.boolean().default(false),
  pets_allowed: z.boolean().default(false),
  smoking_allowed: z.boolean().default(false),
});

type PropertyFormData = z.infer<typeof propertySchema>;

export default function AddPropertyForm() {
  const router = useRouter();
  const { userProfile } = useAuth();
  const { isMLEnabled } = useML();
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [geocodeError, setGeocodeError] = useState<string | null>(null);

  // Initialize form with react-hook-form and zod validation
  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isValid },
  } = useForm<PropertyFormData>({
    resolver: zodResolver(propertySchema),
    defaultValues: {
      title: '',
      description: '',
      price_per_month: 0,
      deposit_amount: 0,
      postcode: '',
      address_line1: '',
      address_line2: '',
      city: '',
      country: 'United Kingdom',
      council_tax_band: 'C',
      epc_rating: 'D',
      furnishing_status: 'Furnished',
      bedrooms: 1,
      bathrooms: 1,
      property_type: 'Flat',
      available_from: new Date().toISOString().split('T')[0],
      minimum_tenancy_months: 6,
      parking: false,
      garden: false,
      balcony: false,
      pets_allowed: false,
      smoking_allowed: false,
    },
  });

  // Watch values for real-time price prediction
  const watchedValues = watch();

  // Initialize price prediction hook
  const {
    property,
    updateProperty,
    prediction,
    isLoading: isPredicting,
    error: predictionError,
  } = usePricePrediction(
    {
      postcode: watchedValues.postcode,
      property_type: watchedValues.property_type,
      bedrooms: watchedValues.bedrooms,
      bathrooms: watchedValues.bathrooms,
      furnishing_status: watchedValues.furnishing_status,
      city: watchedValues.city,
    },
    {
      autoPredict: isMLEnabled,
      debounceMs: 1000,
    }
  );

  // Initialize fraud detection hook
  const {
    detectFraud,
    result: fraudResult,
    isLoading: isDetectingFraud,
    error: fraudError,
  } = useFraudDetection({}, { 
    autoDetect: false,
    threshold: 0.6,
  });

  // Update price prediction property when form values change
  useEffect(() => {
    if (isMLEnabled && (
      watchedValues.property_type ||
      watchedValues.bedrooms ||
      watchedValues.bathrooms ||
      watchedValues.postcode ||
      watchedValues.city
    )) {
      updateProperty({
        property_type: watchedValues.property_type,
        bedrooms: watchedValues.bedrooms,
        bathrooms: watchedValues.bathrooms,
        postcode: watchedValues.postcode,
        city: watchedValues.city,
        furnishing_status: watchedValues.furnishing_status,
      });
    }
  }, [
    watchedValues.property_type,
    watchedValues.bedrooms,
    watchedValues.bathrooms,
    watchedValues.postcode,
    watchedValues.city,
    watchedValues.furnishing_status,
    isMLEnabled,
    updateProperty
  ]);

  // Geocode postcode to get latitude/longitude
  useEffect(() => {
    const geocodePostcode = async () => {
      if (!watchedValues.postcode || watchedValues.postcode.length < 5) {
        setGeocodeError(null);
        return;
      }

      try {
        const response = await fetch(`https://api.postcodes.io/postcodes/${watchedValues.postcode.trim()}`);
        const data = await response.json();

        if (data.status === 200 && data.result) {
          setLatitude(data.result.latitude);
          setLongitude(data.result.longitude);
          setGeocodeError(null);
        } else {
          setGeocodeError('Invalid postcode');
          setLatitude(null);
          setLongitude(null);
        }
      } catch (error) {
        console.error('Geocoding error:', error);
        setGeocodeError('Error validating postcode');
        setLatitude(null);
        setLongitude(null);
      }
    };

    const timer = setTimeout(() => {
      if (watchedValues.postcode && watchedValues.postcode.length >= 5) {
        geocodePostcode();
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [watchedValues.postcode]);

  // Handle image file selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      
      // Check file types and sizes
      const validFiles = newFiles.filter(file => {
        const isValidType = ['image/jpeg', 'image/png', 'image/webp'].includes(file.type);
        const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB max
        
        if (!isValidType) {
          toast.error(`${file.name} is not a supported image format`);
        }
        if (!isValidSize) {
          toast.error(`${file.name} exceeds the 5MB size limit`);
        }
        
        return isValidType && isValidSize;
      });
      
      // Create preview URLs for the images
      const newImageUrls = validFiles.map(file => URL.createObjectURL(file));
      
      setImageFiles(prev => [...prev, ...validFiles]);
      setImageUrls(prev => [...prev, ...newImageUrls]);
    }
  };

  // Remove an image
  const removeImage = (index: number) => {
    setImageFiles(prev => {
      const newFiles = [...prev];
      newFiles.splice(index, 1);
      return newFiles;
    });
    
    setImageUrls(prev => {
      // Revoke the object URL to avoid memory leaks
      URL.revokeObjectURL(prev[index]);
      
      const newUrls = [...prev];
      newUrls.splice(index, 1);
      return newUrls;
    });
  };

  // Upload images to Supabase storage
  const uploadImages = async () => {
    if (imageFiles.length === 0) return [];
    
    setIsUploading(true);
    const uploadedUrls: string[] = [];
    
    try {
      for (const file of imageFiles) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${uuidv4()}.${fileExt}`;
        const filePath = `properties/${userProfile?.id}/${fileName}`;
        
        const { data, error } = await supabase.storage
          .from('property_images')
          .upload(filePath, file);
          
        if (error) {
          console.error('Error uploading image:', error);
          throw error;
        }
        
        // Get the public URL
        const { data: publicUrlData } = supabase.storage
          .from('property_images')
          .getPublicUrl(filePath);
          
        uploadedUrls.push(publicUrlData.publicUrl);
      }
      
      return uploadedUrls;
    } catch (error) {
      console.error('Image upload error:', error);
      toast.error('Failed to upload one or more images');
      return uploadedUrls; // Return any successfully uploaded images
    } finally {
      setIsUploading(false);
    }
  };

  // Handle form submission
  const onSubmit = async (data: PropertyFormData) => {
    if (!userProfile || userProfile.role !== 'landlord') {
      toast.error('You must be logged in as a landlord to list a property');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Upload images first
      const uploadedImageUrls = await uploadImages();
      
      // Prepare property data
      const propertyData = {
        ...data,
        landlord_id: userProfile.id,
        images: uploadedImageUrls,
        latitude: latitude,
        longitude: longitude,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_verified: false,
        is_active: true,
      };
      
      // Run fraud detection if ML is enabled
      let fraud_score = 0;
      let is_flagged = false;
      
      if (isMLEnabled) {
        const fraudCheckResult = await detectFraud({
          title: data.title,
          description: data.description,
          price_per_month: data.price_per_month,
          property_type: data.property_type,
          bedrooms: data.bedrooms,
          bathrooms: data.bathrooms,
          city: data.city,
          postcode: data.postcode,
          images: uploadedImageUrls,
          landlord_id: userProfile.id,
        });
        
        if (fraudCheckResult) {
          fraud_score = fraudCheckResult.risk_score;
          is_flagged = fraudCheckResult.flagged;
          
          // If high risk, notify user
          if (is_flagged) {
            toast.error('Your listing has been flagged for review by our team');
          }
        }
      }
      
      // Insert property into database
      const { data: insertedProperty, error } = await supabase
        .from('properties')
        .insert({
          ...propertyData,
          fraud_score,
          is_flagged,
        })
        .select()
        .single();
        
      if (error) {
        throw error;
      }
      
      toast.success('Property listing created successfully!');
      
      // Redirect to the property page
      router.push(`/properties/${insertedProperty.id}`);
    } catch (error) {
      console.error('Error creating property listing:', error);
      toast.error('Failed to create property listing');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render form
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h1 className="text-2xl font-bold mb-6">List Your Property</h1>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Basic Information */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Property Details</h2>
          
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Property Title
            </label>
            <Input
              id="title"
              placeholder="e.g. Modern 2-bedroom flat in Central London"
              {...register('title')}
              className={errors.title ? 'border-red-300' : ''}
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
            )}
          </div>
          
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <Textarea
              id="description"
              placeholder="Describe your property in detail, including features and nearby amenities"
              rows={6}
              {...register('description')}
              className={errors.description ? 'border-red-300' : ''}
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="property_type" className="block text-sm font-medium text-gray-700 mb-1">
                Property Type
              </label>
              <select
                id="property_type"
                {...register('property_type')}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="Flat">Flat/Apartment</option>
                <option value="House">House</option>
                <option value="Studio">Studio</option>
                <option value="Bungalow">Bungalow</option>
                <option value="Maisonette">Maisonette</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="furnishing_status" className="block text-sm font-medium text-gray-700 mb-1">
                Furnishing
              </label>
              <select
                id="furnishing_status"
                {...register('furnishing_status')}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="Furnished">Furnished</option>
                <option value="Unfurnished">Unfurnished</option>
                <option value="Part-Furnished">Part-Furnished</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="bedrooms" className="block text-sm font-medium text-gray-700 mb-1">
                Bedrooms
              </label>
              <input
                id="bedrooms"
                type="number"
                min="0"
                {...register('bedrooms', { valueAsNumber: true })}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
              {errors.bedrooms && (
                <p className="mt-1 text-sm text-red-600">{errors.bedrooms.message}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="bathrooms" className="block text-sm font-medium text-gray-700 mb-1">
                Bathrooms
              </label>
              <input
                id="bathrooms"
                type="number"
                min="0"
                {...register('bathrooms', { valueAsNumber: true })}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
              {errors.bathrooms && (
                <p className="mt-1 text-sm text-red-600">{errors.bathrooms.message}</p>
              )}
            </div>
          </div>
        </div>
        
        {/* Location Information */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Location</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="address_line1" className="block text-sm font-medium text-gray-700 mb-1">
                Address Line 1
              </label>
              <Input
                id="address_line1"
                placeholder="Street address"
                {...register('address_line1')}
                className={errors.address_line1 ? 'border-red-300' : ''}
              />
              {errors.address_line1 && (
                <p className="mt-1 text-sm text-red-600">{errors.address_line1.message}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="address_line2" className="block text-sm font-medium text-gray-700 mb-1">
                Address Line 2 (Optional)
              </label>
              <Input
                id="address_line2"
                placeholder="Apartment, suite, etc."
                {...register('address_line2')}
              />
            </div>
            
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                City
              </label>
              <Input
                id="city"
                placeholder="e.g. London"
                {...register('city')}
                className={errors.city ? 'border-red-300' : ''}
              />
              {errors.city && (
                <p className="mt-1 text-sm text-red-600">{errors.city.message}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="postcode" className="block text-sm font-medium text-gray-700 mb-1">
                Postcode
              </label>
              <Input
                id="postcode"
                placeholder="e.g. SW1A 1AA"
                {...register('postcode')}
                className={errors.postcode || geocodeError ? 'border-red-300' : ''}
              />
              {errors.postcode && (
                <p className="mt-1 text-sm text-red-600">{errors.postcode.message}</p>
              )}
              {geocodeError && (
                <p className="mt-1 text-sm text-red-600">{geocodeError}</p>
              )}
              {latitude && longitude && (
                <p className="mt-1 text-xs text-green-600">✓ Valid postcode</p>
              )}
            </div>
          </div>
        </div>
        
        {/* Pricing and Availability */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Pricing & Availability</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="price_per_month" className="block text-sm font-medium text-gray-700 mb-1">
                Monthly Rent (£)
              </label>
              <input
                id="price_per_month"
                type="number"
                min="0"
                step="0.01"
                {...register('price_per_month', { valueAsNumber: true })}
                className={`block w-full rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                  errors.price_per_month 
                    ? 'border-red-300' 
                    : prediction && watchedValues.price_per_month < prediction.price_range.min
                      ? 'border-yellow-300'
                      : prediction && watchedValues.price_per_month > prediction.price_range.max
                        ? 'border-yellow-300'
                        : 'border-gray-300'
                }`}
              />
              {errors.price_per_month && (
                <p className="mt-1 text-sm text-red-600">{errors.price_per_month.message}</p>
              )}
              
              {/* Price prediction */}
              {isMLEnabled && (
                <div className="mt-2">
                  {isPredicting ? (
                    <div className="flex items-center text-sm text-gray-500">
                      <Loader2 className="animate-spin h-4 w-4 mr-2" />
                      Calculating suggested price...
                    </div>
                  ) : prediction ? (
                    <div>
                      <p className="text-sm font-medium text-gray-700">
                        Suggested price range: £{prediction.price_range.min.toFixed(0)} - £{prediction.price_range.max.toFixed(0)}
                      </p>
                      
                      {watchedValues.price_per_month < prediction.price_range.min && (
                        <p className="flex items-center mt-1 text-xs text-yellow-600">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Your price is below the suggested range for similar properties
                        </p>
                      )}
                      
                      {watchedValues.price_per_month > prediction.price_range.max && (
                        <p className="flex items-center mt-1 text-xs text-yellow-600">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Your price is above the suggested range for similar properties
                        </p>
                      )}
                      
                      {watchedValues.price_per_month >= prediction.price_range.min && 
                       watchedValues.price_per_month <= prediction.price_range.max && (
                        <p className="flex items-center mt-1 text-xs text-green-600">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Your price is within the suggested range
                        </p>
                      )}
                    </div>
                  ) : predictionError ? (
                    <p className="mt-1 text-xs text-red-500">
                      Couldn't calculate suggested price
                    </p>
                  ) : null}
                </div>
              )}
            </div>
            
            <div>
              <label htmlFor="deposit_amount" className="block text-sm font-medium text-gray-700 mb-1">
                Deposit Amount (£)
              </label>
              <input
                id="deposit_amount"
                type="number"
                min="0"
                step="0.01"
                {...register('deposit_amount', { valueAsNumber: true })}
                className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                  errors.deposit_amount ? 'border-red-300' : ''
                }`}
              />
              {errors.deposit_amount && (
                <p className="mt-1 text-sm text-red-600">{errors.deposit_amount.message}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="available_from" className="block text-sm font-medium text-gray-700 mb-1">
                Available From
              </label>
              <input
                id="available_from"
                type="date"
                {...register('available_from')}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            
            <div>
              <label htmlFor="minimum_tenancy_months" className="block text-sm font-medium text-gray-700 mb-1">
                Minimum Tenancy (months)
              </label>
              <input
                id="minimum_tenancy_months"
                type="number"
                min="1"
                {...register('minimum_tenancy_months', { valueAsNumber: true })}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
          </div>
        </div>
        
        {/* Additional Details */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Additional Details</h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="council_tax_band" className="block text-sm font-medium text-gray-700 mb-1">
                Council Tax Band
              </label>
              <select
                id="council_tax_band"
                {...register('council_tax_band')}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].map(band => (
                  <option key={band} value={band}>Band {band}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="epc_rating" className="block text-sm font-medium text-gray-700 mb-1">
                EPC Rating
              </label>
              <select
                id="epc_rating"
                {...register('epc_rating')}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                {['A', 'B', 'C', 'D', 'E', 'F', 'G'].map(rating => (
                  <option key={rating} value={rating}>Rating {rating}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">Features</label>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="flex items-center">
                <input
                  id="parking"
                  type="checkbox"
                  {...register('parking')}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="parking" className="ml-2 text-sm text-gray-700">
                  Parking available
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  id="garden"
                  type="checkbox"
                  {...register('garden')}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="garden" className="ml-2 text-sm text-gray-700">
                  Garden
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  id="balcony"
                  type="checkbox"
                  {...register('balcony')}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="balcony" className="ml-2 text-sm text-gray-700">
                  Balcony
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  id="pets_allowed"
                  type="checkbox"
                  {...register('pets_allowed')}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="pets_allowed" className="ml-2 text-sm text-gray-700">
                  Pets allowed
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  id="smoking_allowed"
                  type="checkbox"
                  {...register('smoking_allowed')}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="smoking_allowed" className="ml-2 text-sm text-gray-700">
                  Smoking allowed
                </label>
              </div>
            </div>
          </div>
        </div>
        
        {/* Image Upload */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Property Images</h2>
          
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <input
              id="image-upload"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={handleImageChange}
              className="hidden"
            />
            
            <label htmlFor="image-upload" className="cursor-pointer">
              <div className="space-y-1">
                <svg 
                  className="mx-auto h-12 w-12 text-gray-400" 
                  stroke="currentColor" 
                  fill="none" 
                  viewBox="0 0 48 48" 
                  aria-hidden="true"
                >
                  <path 
                    d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" 
                    strokeWidth={2} 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                  />
                </svg>
                <div className="text-sm text-gray-600">
                  <span className="font-medium text-blue-600 hover:text-blue-500">
                    Click to upload
                  </span>
                  {' '}or drag and drop
                </div>
                <p className="text-xs text-gray-500">
                  PNG, JPG, WEBP up to 5MB each
                </p>
              </div>
            </label>
          </div>
          
          {/* Image previews */}
          {imageUrls.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-4">
              {imageUrls.map((url, index) => (
                <div key={index} className="relative group">
                  <img
                    src={url}
                    alt={`Property image ${index + 1}`}
                    className="h-32 w-full object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-1 right-1 bg-white rounded-full p-1 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <XCircle className="h-5 w-5 text-red-500" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Form actions */}
        <div className="border-t pt-6 flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting || isUploading}
          >
            Cancel
          </Button>
          
          <Button
            type="submit"
            disabled={!isValid || isSubmitting || isUploading || !!geocodeError}
            className="min-w-[120px]"
          >
            {isSubmitting || isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isUploading ? 'Uploading...' : 'Creating...'}
              </>
            ) : (
              'List Property'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
