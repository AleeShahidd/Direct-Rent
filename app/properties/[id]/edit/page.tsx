'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '../../../../lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { 
  Upload, 
  X, 
  Plus,
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
import { User, Property } from '@/types';

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

export default function EditPropertyPage() {
  const router = useRouter();
  const params = useParams();
  const propertyId = params.id as string;
  
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [property, setProperty] = useState<Property | null>(null);
  const [formData, setFormData] = useState<PropertyFormData | null>(null);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);
  const [removedImages, setRemovedImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    checkAuthAndLoadProperty();
  }, [propertyId]);

  const checkAuthAndLoadProperty = async () => {
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

      // Load property
      const { data: propertyData, error: propertyError } = await supabase
        .from('properties')
        .select('*')
        .eq('id', propertyId)
        .eq('landlord_id', userData.id)
        .single();

      if (propertyError || !propertyData) {
        router.push('/dashboard/unified');
        return;
      }

      setProperty(propertyData);
      setExistingImages(propertyData.images || []);
      setFormData({
        title: propertyData.title,
        description: propertyData.description,
        price_per_month: propertyData.price_per_month,
        deposit_amount: propertyData.deposit_amount || 0,
        postcode: propertyData.postcode,
        address_line1: propertyData.address_line1,
        address_line2: propertyData.address_line2 || '',
        city: propertyData.city,
        council_tax_band: propertyData.council_tax_band,
        epc_rating: propertyData.epc_rating,
        furnishing_status: propertyData.furnishing_status,
        bedrooms: propertyData.bedrooms,
        bathrooms: propertyData.bathrooms,
        property_type: propertyData.property_type,
        available_from: propertyData.available_from || '',
        minimum_tenancy_months: propertyData.minimum_tenancy_months || 6,
        parking: propertyData.parking,
        garden: propertyData.garden,
        balcony: propertyData.balcony,
        pets_allowed: propertyData.pets_allowed,
        smoking_allowed: propertyData.smoking_allowed,
        virtual_tour_url: propertyData.virtual_tour_url || '',
      });
    } catch (error) {
      console.log('Auth/Property load error:', error);
      router.push('/auth/login');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof PropertyFormData, value: any) => {
    if (!formData) return;
    setFormData(prev => ({
      ...prev!,
      [field]: value
    }));
  };

  const handleNewImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const totalImages = existingImages.length - removedImages.length + newImages.length + files.length;
    
    if (totalImages > 10) {
      setError('Maximum 10 images allowed');
      return;
    }

    setNewImages(prev => [...prev, ...files]);
    
    // Create preview URLs
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setNewImagePreviews(prev => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeExistingImage = (imageUrl: string) => {
    setRemovedImages(prev => [...prev, imageUrl]);
  };

  const restoreRemovedImage = (imageUrl: string) => {
    setRemovedImages(prev => prev.filter(img => img !== imageUrl));
  };

  const removeNewImage = (index: number) => {
    setNewImages(prev => prev.filter((_, i) => i !== index));
    setNewImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const uploadNewImages = async (): Promise<string[]> => {
    if (newImages.length === 0) return [];

    const imageUrls: string[] = [];
    
    for (const image of newImages) {
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
    if (!formData) return false;
    
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

    if (!validateForm() || !formData || !property) return;

    setUploading(true);

    try {
      // Upload new images
      const newImageUrls = await uploadNewImages();

      // Combine existing images (not removed) with new images
      const finalImages = [
        ...existingImages.filter(img => !removedImages.includes(img)),
        ...newImageUrls
      ];

      // Update property
      const { error } = await supabase
        .from('properties')
        .update({
          ...formData,
          images: finalImages,
          updated_at: new Date().toISOString(),
        })
        .eq('id', propertyId);

      if (error) {
        setError(error.message);
        return;
      }

      router.push('/dashboard/unified?tab=properties');
    } catch (error) {
      console.log('Property update error:', error);
      setError('Failed to update property');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this property? This action cannot be undone.')) {
      return;
    }

    setUploading(true);
    try {
      const { error } = await supabase
        .from('properties')
        .delete()
        .eq('id', propertyId);

      if (error) {
        setError(error.message);
        return;
      }

      router.push('/dashboard/unified?tab=properties');
    } catch (error) {
      console.log('Property deletion error:', error);
      setError('Failed to delete property');
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

  if (!formData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Property not found</h2>
          <Button onClick={() => router.push('/dashboard/unified')}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Edit Property</h1>
          <p className="text-gray-600">Update your property details</p>
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
            
            {/* Existing Images */}
            {existingImages.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-4">Current Images</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {existingImages.map((imageUrl, index) => (
                    <div key={index} className="relative">
                      <img
                        src={imageUrl}
                        alt={`Property ${index + 1}`}
                        className={`w-full h-24 object-cover rounded-lg ${
                          removedImages.includes(imageUrl) ? 'opacity-50' : ''
                        }`}
                      />
                      {removedImages.includes(imageUrl) ? (
                        <button
                          type="button"
                          onClick={() => restoreRemovedImage(imageUrl)}
                          className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full p-1 hover:bg-green-600"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => removeExistingImage(imageUrl)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* New Images Upload */}
            <div className="space-y-4">
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 mb-4 text-gray-500" />
                    <p className="mb-2 text-sm text-gray-500">
                      <span className="font-semibold">Click to upload new images</span>
                    </p>
                    <p className="text-xs text-gray-500">PNG, JPG or JPEG</p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    multiple
                    accept="image/*"
                    onChange={handleNewImageUpload}
                  />
                </label>
              </div>

              {newImagePreviews.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium mb-4">New Images to Add</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {newImagePreviews.map((preview, index) => (
                      <div key={index} className="relative">
                        <img
                          src={preview}
                          alt={`New ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removeNewImage(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
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
            <div className="flex space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleDelete}
                className="text-red-600 border-red-200 hover:bg-red-50"
                disabled={uploading}
              >
                Delete Property
              </Button>
            </div>
            <Button
              type="submit"
              disabled={uploading}
              className="min-w-32"
            >
              {uploading ? <LoadingSpinner /> : 'Update Property'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
