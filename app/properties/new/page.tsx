'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { PriceEstimator } from '@/components/property/PriceEstimator';
import { 
  Upload, 
  X, 
  MapPin, 
  Home, 
  Bed, 
  Bath, 
  Car, 
  TreePine,
  Building,
  PawPrint,
  Cigarette 
} from 'lucide-react';
import { User, PriceEstimateResponse } from '@/types';

interface PropertyFormData {
  title: string;
  description: string;
  price_per_month: number;
  deposit_amount: number;
  postcode: string;
  address_line1: string;
  address_line2: string;
  city: string;
  council_tax_band: string;
  epc_rating: string;
  furnishing_status: string;
  bedrooms: number;
  bathrooms: number;
  property_type: string;
  available_from: string;
  minimum_tenancy_months: number;
  parking: boolean;
  garden: boolean;
  balcony: boolean;
  pets_allowed: boolean;
  smoking_allowed: boolean;
  virtual_tour_url: string;
}

const initialFormData: PropertyFormData = {
  title: '',
  description: '',
  price_per_month: 0,
  deposit_amount: 0,
  postcode: '',
  address_line1: '',
  address_line2: '',
  city: '',
  council_tax_band: 'D',
  epc_rating: 'C',
  furnishing_status: 'Unfurnished',
  bedrooms: 1,
  bathrooms: 1,
  property_type: 'Flat',
  available_from: '',
  minimum_tenancy_months: 6,
  parking: false,
  garden: false,
  balcony: false,
  pets_allowed: false,
  smoking_allowed: false,
  virtual_tour_url: '',
};

export default function AddPropertyPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<PropertyFormData>(initialFormData);
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [priceEstimate, setPriceEstimate] = useState<PriceEstimateResponse | null>(null);
  const [showPriceEstimator, setShowPriceEstimator] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }

      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (!userData || userData.role !== 'landlord') {
        router.push('/');
        return;
      }

      setCurrentUser(userData);
    } catch (error) {
      console.log('Auth error:', error);
      router.push('/auth/login');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof PropertyFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Show price estimator when key fields are filled
    if (['postcode', 'property_type', 'bedrooms', 'bathrooms', 'furnishing_status'].includes(field)) {
      const updatedData = { ...formData, [field]: value };
      if (updatedData.postcode && updatedData.property_type && updatedData.bedrooms && updatedData.bathrooms) {
        setShowPriceEstimator(true);
      }
    }
  };

  const handlePriceEstimated = (estimate: PriceEstimateResponse) => {
    console.log('Price estimate received:', estimate);
    setPriceEstimate(estimate);
    
    // Auto-fill the rent field with the estimate if it's still 0
    if (formData.price_per_month === 0 && estimate && typeof estimate.estimated_price === 'number') {
      setFormData(prev => ({
        ...prev,
        price_per_month: Math.round(estimate.estimated_price) // Round to nearest pound
      }));
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + images.length > 10) {
      setError('Maximum 10 images allowed');
      return;
    }

    setImages(prev => [...prev, ...files]);
    
    // Create preview URLs
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreviews(prev => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const uploadImages = async (): Promise<string[]> => {
    if (images.length === 0) return [];

    const imageUrls: string[] = [];
    
    for (const image of images) {
      const fileExt = image.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random()}.${fileExt}`;
      const filePath = `property-images/${fileName}`;

      const { error } = await supabase.storage
        .from('property-images')
        .upload(filePath, image);

      if (error) {
        console.log('Image upload error:', error);
        continue;
      }

      const { data } = supabase.storage
        .from('property-images')
        .getPublicUrl(filePath);

      imageUrls.push(data.publicUrl);
    }

    return imageUrls;
  };

  const validateForm = (): boolean => {
    if (!formData.title.trim()) {
      setError('Property title is required');
      return false;
    }
    if (!formData.description.trim()) {
      setError('Property description is required');
      return false;
    }
    if (formData.price_per_month <= 0) {
      setError('Valid rent price is required');
      return false;
    }
    if (!formData.postcode.trim()) {
      setError('Postcode is required');
      return false;
    }
    if (!formData.address_line1.trim()) {
      setError('Address is required');
      return false;
    }
    if (!formData.city.trim()) {
      setError('City is required');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) return;
    if (!currentUser) return;

    setUploading(true);

    try {
      // Upload images
      const imageUrls = await uploadImages();

      // Create property
      const { data, error } = await supabase
        .from('properties')
        .insert({
          title: formData.title,
          description: formData.description,
          rent_amount: formData.price_per_month, // Use the correct database field
          price_per_month: formData.price_per_month, // For backwards compatibility
          deposit_amount: formData.deposit_amount,
          postcode: formData.postcode,
          address_line_1: formData.address_line1, // Match DB schema field name
          address_line_2: formData.address_line2, // Match DB schema field name
          city: formData.city,
          council_tax_band: formData.council_tax_band,
          epc_rating: formData.epc_rating,
          furnishing_status: formData.furnishing_status,
          bedrooms: formData.bedrooms,
          bathrooms: formData.bathrooms,
          property_type: formData.property_type,
          available_from: formData.available_from,
          minimum_tenancy_months: formData.minimum_tenancy_months,
          parking: formData.parking,
          garden: formData.garden,
          balcony: formData.balcony,
          pets_allowed: formData.pets_allowed,
          smoking_allowed: formData.smoking_allowed,
          virtual_tour_url: formData.virtual_tour_url,
          landlord_id: currentUser.id,
          images: imageUrls,
          is_active: true,
        })
        .select()
        .single();

      if (error) {
        console.log('Database error:', error);
        setError(`Failed to save property: ${error.message}`);
        return;
      }

      console.log('Property created successfully:', data);
      router.push('/dashboard/unified?tab=properties');
    } catch (error) {
      console.log('Property creation error:', error);
      setError('Failed to create property');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Add New Property</h1>
          <p className="text-gray-600">Fill in the details to list your property</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              {error}
            </div>
          )}

          {/* Basic Information */}
          <div className="bg-white rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-6">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Property Title
                </label>
                <Input
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="e.g., Modern 2-bed flat in Central London"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={4}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe your property, its features, and surrounding area..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Property Type
                </label>
                <Select
                  value={formData.property_type}
                  onChange={(e) => handleInputChange('property_type', e.target.value)}
                >
                  <option value="Flat">Flat</option>
                  <option value="House">House</option>
                  <option value="Studio">Studio</option>
                  <option value="Bungalow">Bungalow</option>
                  <option value="Maisonette">Maisonette</option>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Furnishing Status
                </label>
                <Select
                  value={formData.furnishing_status}
                  onChange={(e) => handleInputChange('furnishing_status', e.target.value)}
                >
                  <option value="Furnished">Furnished</option>
                  <option value="Unfurnished">Unfurnished</option>
                  <option value="Part-Furnished">Part-Furnished</option>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bedrooms
                </label>
                <Input
                  type="number"
                  min="0"
                  max="10"
                  value={formData.bedrooms}
                  onChange={(e) => handleInputChange('bedrooms', parseInt(e.target.value))}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bathrooms
                </label>
                <Input
                  type="number"
                  min="1"
                  max="10"
                  value={formData.bathrooms}
                  onChange={(e) => handleInputChange('bathrooms', parseInt(e.target.value))}
                  required
                />
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="bg-white rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-6">Location</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address Line 1
                </label>
                <Input
                  value={formData.address_line1}
                  onChange={(e) => handleInputChange('address_line1', e.target.value)}
                  placeholder="123 Example Street"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address Line 2 (Optional)
                </label>
                <Input
                  value={formData.address_line2}
                  onChange={(e) => handleInputChange('address_line2', e.target.value)}
                  placeholder="Apartment, suite, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City
                </label>
                <Input
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  placeholder="London"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Postcode
                </label>
                <Input
                  value={formData.postcode}
                  onChange={(e) => handleInputChange('postcode', e.target.value.toUpperCase())}
                  placeholder="SW1A 1AA"
                  required
                />
              </div>
            </div>
          </div>

          {/* Pricing & Availability */}
          <div className="bg-white rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-6">Pricing & Availability</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Monthly Rent (£)
                </label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price_per_month}
                  onChange={(e) => handleInputChange('price_per_month', parseFloat(e.target.value))}
                  placeholder="1500"
                  required
                />
                {priceEstimate && (
                  <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm">
                    <span className="text-blue-700">
                      💡 AI Estimate: £{priceEstimate.estimated_price.toLocaleString()}/month
                      ({(priceEstimate.confidence * 100).toFixed(0)}% confidence)
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Deposit Amount (£)
                </label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.deposit_amount}
                  onChange={(e) => handleInputChange('deposit_amount', parseFloat(e.target.value))}
                  placeholder="3000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Available From
                </label>
                <Input
                  type="date"
                  value={formData.available_from}
                  onChange={(e) => handleInputChange('available_from', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Tenancy (Months)
                </label>
                <Input
                  type="number"
                  min="1"
                  max="24"
                  value={formData.minimum_tenancy_months}
                  onChange={(e) => handleInputChange('minimum_tenancy_months', parseInt(e.target.value))}
                />
              </div>
            </div>
          </div>

          {/* AI Price Estimator */}
          {showPriceEstimator && (
            <PriceEstimator
              initialData={{
                postcode: formData.postcode,
                property_type: formData.property_type,
                bedrooms: formData.bedrooms,
                bathrooms: formData.bathrooms,
                furnishing_status: formData.furnishing_status
              }}
              onPriceEstimated={handlePriceEstimated}
              className="animate-in slide-in-from-top duration-300"
            />
          )}

          {/* Property Features */}
          <div className="bg-white rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-6">Property Features</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[
                { key: 'parking', label: 'Parking', icon: Car },
                { key: 'garden', label: 'Garden', icon: TreePine },
                { key: 'balcony', label: 'Balcony', icon: Building },
                { key: 'pets_allowed', label: 'Pets Allowed', icon: PawPrint },
                { key: 'smoking_allowed', label: 'Smoking Allowed', icon: Cigarette },
              ].map(({ key, label, icon: Icon }) => (
                <label key={key} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData[key as keyof PropertyFormData] as boolean}
                    onChange={(e) => handleInputChange(key as keyof PropertyFormData, e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <Icon className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-700">{label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Energy & Council Tax */}
          <div className="bg-white rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-6">Energy & Council Tax</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  EPC Rating
                </label>
                <Select
                  value={formData.epc_rating}
                  onChange={(e) => handleInputChange('epc_rating', e.target.value)}
                >
                  <option value="A">A (Most Efficient)</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                  <option value="D">D</option>
                  <option value="E">E</option>
                  <option value="F">F</option>
                  <option value="G">G (Least Efficient)</option>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Council Tax Band
                </label>
                <Select
                  value={formData.council_tax_band}
                  onChange={(e) => handleInputChange('council_tax_band', e.target.value)}
                >
                  <option value="A">Band A</option>
                  <option value="B">Band B</option>
                  <option value="C">Band C</option>
                  <option value="D">Band D</option>
                  <option value="E">Band E</option>
                  <option value="F">Band F</option>
                  <option value="G">Band G</option>
                  <option value="H">Band H</option>
                </Select>
              </div>
            </div>
          </div>

          {/* Images */}
          <div className="bg-white rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-6">Property Images</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 mb-4 text-gray-500" />
                    <p className="mb-2 text-sm text-gray-500">
                      <span className="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-gray-500">PNG, JPG or JPEG (MAX. 10 images)</p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                  />
                </label>
              </div>

              {imagePreviews.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative">
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Virtual Tour */}
          <div className="bg-white rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-6">Virtual Tour (Optional)</h2>
            <Input
              type="url"
              value={formData.virtual_tour_url}
              onChange={(e) => handleInputChange('virtual_tour_url', e.target.value)}
              placeholder="https://example.com/virtual-tour"
            />
          </div>

          {/* Submit */}
          <div className="flex items-center justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={uploading}
              className="min-w-32"
            >
              {uploading ? <LoadingSpinner /> : 'List Property'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
