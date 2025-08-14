'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '../ui/checkbox';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '../ui/use-toast';
import { useUser } from '@/hooks/useUser';
import { useFraudDetection } from '@/hooks/useFraudDetection';
import { Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const PropertyCreateForm = () => {
  const router = useRouter();
  const { user } = useUser();
  const { checkProperty } = useFraudDetection();
  
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [formError, setFormError] = useState<string | null>(null);
  const [fraudDetectionStatus, setFraudDetectionStatus] = useState<{
    loading: boolean;
    risk: 'low' | 'medium' | 'high' | null;
    message: string | null;
  }>({
    loading: false,
    risk: null,
    message: null
  });
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    property_type: '',
    bedrooms: 1,
    bathrooms: 1,
    rent_amount: '',
    deposit_amount: '',
    address_line_1: '',
    address_line_2: '',
    city: '',
    postcode: '',
    latitude: '',
    longitude: '',
    furnishing_status: 'unfurnished',
    available_from: '',
    minimum_tenancy: 6,
    maximum_tenancy: 12,
    parking_available: false,
    garden: false,
    pets_allowed: false,
    smoking_allowed: false,
    bills_included: false,
    energy_rating: '',
    image_urls: [] as string[]
  });
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value
    }));
  };
  
  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }));
  };
  
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      return;
    }
    
    try {
      setLoading(true);
      const files = Array.from(e.target.files);
      const uploadPromises = files.map(async (file) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
        const filePath = `properties/${fileName}`;
        
        const { error: uploadError, data } = await supabase.storage
          .from('property-images')
          .upload(filePath, file);
          
        if (uploadError) {
          throw uploadError;
        }
        
        const { data: { publicUrl } } = supabase.storage
          .from('property-images')
          .getPublicUrl(filePath);
          
        return publicUrl;
      });
      
      const uploadedUrls = await Promise.all(uploadPromises);
      
      setFormData(prev => ({
        ...prev,
        image_urls: [...prev.image_urls, ...uploadedUrls]
      }));
      
      toast({
        title: 'Images uploaded successfully',
        description: `${uploadedUrls.length} images have been added to your property listing.`
      });
    } catch (error) {
      console.error('Error uploading images:', error);
      toast({
        title: 'Error uploading images',
        description: 'There was a problem uploading your images. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };
  
  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      image_urls: prev.image_urls.filter((_, i) => i !== index)
    }));
  };
  
  const validateForm = () => {
    const requiredFields = [
      'title', 'description', 'property_type', 'bedrooms', 
      'rent_amount', 'address_line_1', 'city', 'postcode'
    ];
    
    for (const field of requiredFields) {
      if (!formData[field as keyof typeof formData]) {
        setFormError(`Please complete all required fields. Missing: ${field.replace('_', ' ')}`);
        return false;
      }
    }
    
    if (formData.image_urls.length === 0) {
      setFormError('Please upload at least one image of the property');
      return false;
    }
    
    setFormError(null);
    return true;
  };
  
  const handleFraudDetection = async () => {
    if (!validateForm()) return;
    
    try {
      setFraudDetectionStatus({
        loading: true,
        risk: null,
        message: null
      });
      
      const result = await checkProperty(formData);
      
      setFraudDetectionStatus({
        loading: false,
        risk: result.risk as 'low' | 'medium' | 'high',
        message: result.message
      });
      
      if (result.risk === 'high') {
        toast({
          title: 'Warning: High Risk Detected',
          description: result.message || 'This listing has been flagged as potentially fraudulent. Please review and edit before submitting.',
          variant: 'destructive'
        });
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error during fraud detection:', error);
      setFraudDetectionStatus({
        loading: false,
        risk: null,
        message: 'Error checking property for fraud. You can still submit, but please ensure your listing is accurate.'
      });
      return true; // Allow submission despite error
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      router.push('/auth/login?redirect=/properties/create');
      return;
    }
    
    if (!validateForm()) return;
    
    // Run fraud detection
    const passedFraudCheck = await handleFraudDetection();
    if (!passedFraudCheck) return;
    
    try {
      setLoading(true);
      
      // Create the property
      const { data: property, error } = await supabase
        .from('properties')
        .insert({
          ...formData,
          landlord_id: user.id,
          status: 'available'
        })
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      toast({
        title: 'Property Created Successfully',
        description: 'Your property listing has been created and is now live.'
      });
      
      // Redirect to the property page
      router.push(`/properties/${property.id}`);
    } catch (error) {
      console.error('Error creating property:', error);
      toast({
        title: 'Error Creating Property',
        description: 'There was a problem creating your property listing. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };
  
  const navigateTabs = (direction: 'next' | 'prev') => {
    const tabs = ['basic', 'details', 'location', 'features', 'images', 'review'];
    const currentIndex = tabs.indexOf(activeTab);
    
    if (direction === 'next' && currentIndex < tabs.length - 1) {
      setActiveTab(tabs[currentIndex + 1]);
    } else if (direction === 'prev' && currentIndex > 0) {
      setActiveTab(tabs[currentIndex - 1]);
    }
  };
  
  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Create New Property Listing</h1>
      
      {formError && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}
      
      <form onSubmit={handleSubmit}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-6">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="location">Location</TabsTrigger>
            <TabsTrigger value="features">Features</TabsTrigger>
            <TabsTrigger value="images">Images</TabsTrigger>
            <TabsTrigger value="review">Review</TabsTrigger>
          </TabsList>
          
          {/* Basic Info */}
          <TabsContent value="basic" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Basic Property Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title">Property Title *</Label>
                  <Input
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="e.g., Spacious 2-Bedroom Apartment in City Center"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Provide a detailed description of your property..."
                    rows={5}
                    required
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="property_type">Property Type *</Label>
                    <select
                      id="property_type"
                      name="property_type"
                      value={formData.property_type}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      required
                    >
                      <option value="">Select property type</option>
                      <option value="flat">Flat/Apartment</option>
                      <option value="house">House</option>
                      <option value="studio">Studio</option>
                      <option value="bungalow">Bungalow</option>
                      <option value="maisonette">Maisonette</option>
                    </select>
                  </div>
                  
                  <div>
                    <Label htmlFor="furnishing_status">Furnishing Status</Label>
                    <select
                      id="furnishing_status"
                      name="furnishing_status"
                      value={formData.furnishing_status}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    >
                      <option value="furnished">Furnished</option>
                      <option value="part_furnished">Part Furnished</option>
                      <option value="unfurnished">Unfurnished</option>
                    </select>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="bedrooms">Bedrooms *</Label>
                    <Input
                      id="bedrooms"
                      name="bedrooms"
                      type="number"
                      min="0"
                      value={formData.bedrooms}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="bathrooms">Bathrooms *</Label>
                    <Input
                      id="bathrooms"
                      name="bathrooms"
                      type="number"
                      min="0"
                      value={formData.bathrooms}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="rent_amount">Monthly Rent (£) *</Label>
                    <Input
                      id="rent_amount"
                      name="rent_amount"
                      type="number"
                      min="0"
                      value={formData.rent_amount}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="deposit_amount">Deposit Amount (£)</Label>
                    <Input
                      id="deposit_amount"
                      name="deposit_amount"
                      type="number"
                      min="0"
                      value={formData.deposit_amount}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button type="button" onClick={() => navigateTabs('next')}>
                  Next: Property Details
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          {/* Details */}
          <TabsContent value="details" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Property Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="available_from">Available From</Label>
                  <Input
                    id="available_from"
                    name="available_from"
                    type="date"
                    value={formData.available_from}
                    onChange={handleInputChange}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="minimum_tenancy">Minimum Tenancy (months)</Label>
                    <Input
                      id="minimum_tenancy"
                      name="minimum_tenancy"
                      type="number"
                      min="1"
                      value={formData.minimum_tenancy}
                      onChange={handleInputChange}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="maximum_tenancy">Maximum Tenancy (months)</Label>
                    <Input
                      id="maximum_tenancy"
                      name="maximum_tenancy"
                      type="number"
                      min="1"
                      value={formData.maximum_tenancy}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="energy_rating">Energy Rating (EPC)</Label>
                  <select
                    id="energy_rating"
                    name="energy_rating"
                    value={formData.energy_rating}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="">Select energy rating</option>
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                    <option value="D">D</option>
                    <option value="E">E</option>
                    <option value="F">F</option>
                    <option value="G">G</option>
                  </select>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button type="button" variant="outline" onClick={() => navigateTabs('prev')}>
                  Back
                </Button>
                <Button type="button" onClick={() => navigateTabs('next')}>
                  Next: Location
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          {/* Location */}
          <TabsContent value="location" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Property Location</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="address_line_1">Address Line 1 *</Label>
                  <Input
                    id="address_line_1"
                    name="address_line_1"
                    value={formData.address_line_1}
                    onChange={handleInputChange}
                    placeholder="e.g., 123 Main Street"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="address_line_2">Address Line 2</Label>
                  <Input
                    id="address_line_2"
                    name="address_line_2"
                    value={formData.address_line_2}
                    onChange={handleInputChange}
                    placeholder="e.g., Apartment 4B"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city">City/Town *</Label>
                    <Input
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      placeholder="e.g., London"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="postcode">Postcode *</Label>
                    <Input
                      id="postcode"
                      name="postcode"
                      value={formData.postcode}
                      onChange={handleInputChange}
                      placeholder="e.g., SW1A 1AA"
                      required
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="latitude">Latitude</Label>
                    <Input
                      id="latitude"
                      name="latitude"
                      type="number"
                      step="0.000001"
                      value={formData.latitude}
                      onChange={handleInputChange}
                      placeholder="e.g., 51.507351"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="longitude">Longitude</Label>
                    <Input
                      id="longitude"
                      name="longitude"
                      type="number"
                      step="0.000001"
                      value={formData.longitude}
                      onChange={handleInputChange}
                      placeholder="e.g., -0.127758"
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button type="button" variant="outline" onClick={() => navigateTabs('prev')}>
                  Back
                </Button>
                <Button type="button" onClick={() => navigateTabs('next')}>
                  Next: Features
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          {/* Features */}
          <TabsContent value="features" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Property Features</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-medium mb-3">General Features</h3>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="parking_available"
                          checked={formData.parking_available}
                          onCheckedChange={(checked) => 
                            handleCheckboxChange('parking_available', checked === true)
                          }
                        />
                        <Label htmlFor="parking_available">Parking Available</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="garden"
                          checked={formData.garden}
                          onCheckedChange={(checked) => 
                            handleCheckboxChange('garden', checked === true)
                          }
                        />
                        <Label htmlFor="garden">Garden</Label>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-3">Policy Features</h3>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="pets_allowed"
                          checked={formData.pets_allowed}
                          onCheckedChange={(checked) => 
                            handleCheckboxChange('pets_allowed', checked === true)
                          }
                        />
                        <Label htmlFor="pets_allowed">Pets Allowed</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="smoking_allowed"
                          checked={formData.smoking_allowed}
                          onCheckedChange={(checked) => 
                            handleCheckboxChange('smoking_allowed', checked === true)
                          }
                        />
                        <Label htmlFor="smoking_allowed">Smoking Allowed</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="bills_included"
                          checked={formData.bills_included}
                          onCheckedChange={(checked) => 
                            handleCheckboxChange('bills_included', checked === true)
                          }
                        />
                        <Label htmlFor="bills_included">Bills Included in Rent</Label>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button type="button" variant="outline" onClick={() => navigateTabs('prev')}>
                  Back
                </Button>
                <Button type="button" onClick={() => navigateTabs('next')}>
                  Next: Images
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          {/* Images */}
          <TabsContent value="images" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Property Images</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Label htmlFor="images" className="block cursor-pointer">
                    <div className="space-y-2">
                      <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-primary">
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                          <circle cx="8.5" cy="8.5" r="1.5"></circle>
                          <polyline points="21 15 16 10 5 21"></polyline>
                        </svg>
                      </div>
                      <div className="text-sm text-gray-500">
                        <span className="font-medium text-primary">Click to upload</span> or drag and drop
                      </div>
                      <p className="text-xs text-gray-500">
                        PNG, JPG, GIF up to 10MB each (maximum 10 images)
                      </p>
                    </div>
                    <Input
                      id="images"
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      className="hidden"
                      disabled={loading || formData.image_urls.length >= 10}
                    />
                  </Label>
                </div>
                
                {loading && (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    <span>Uploading images...</span>
                  </div>
                )}
                
                {formData.image_urls.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium mb-3">Uploaded Images</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {formData.image_urls.map((url, index) => (
                        <div key={index} className="relative aspect-square rounded-md overflow-hidden border">
                          <img
                            src={url}
                            alt={`Property Image ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
                            aria-label="Remove image"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <line x1="18" y1="6" x2="6" y2="18"></line>
                              <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button type="button" variant="outline" onClick={() => navigateTabs('prev')}>
                  Back
                </Button>
                <Button type="button" onClick={() => navigateTabs('next')}>
                  Next: Review
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          {/* Review */}
          <TabsContent value="review" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Review Your Listing</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-medium mb-3">Basic Information</h3>
                      <ul className="space-y-2">
                        <li><strong>Title:</strong> {formData.title}</li>
                        <li><strong>Type:</strong> {formData.property_type}</li>
                        <li><strong>Bedrooms:</strong> {formData.bedrooms}</li>
                        <li><strong>Bathrooms:</strong> {formData.bathrooms}</li>
                        <li><strong>Rent:</strong> £{formData.rent_amount}/month</li>
                        <li><strong>Deposit:</strong> {formData.deposit_amount ? `£${formData.deposit_amount}` : 'Not specified'}</li>
                      </ul>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-medium mb-3">Location</h3>
                      <ul className="space-y-2">
                        <li><strong>Address:</strong> {formData.address_line_1}</li>
                        {formData.address_line_2 && (
                          <li><strong>Address Line 2:</strong> {formData.address_line_2}</li>
                        )}
                        <li><strong>City:</strong> {formData.city}</li>
                        <li><strong>Postcode:</strong> {formData.postcode}</li>
                      </ul>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-3">Description</h3>
                    <p className="text-sm text-gray-700 whitespace-pre-line">{formData.description}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-3">Features</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      <div><strong>Furnishing:</strong> {formData.furnishing_status.replace('_', ' ')}</div>
                      <div><strong>Parking:</strong> {formData.parking_available ? 'Yes' : 'No'}</div>
                      <div><strong>Garden:</strong> {formData.garden ? 'Yes' : 'No'}</div>
                      <div><strong>Pets Allowed:</strong> {formData.pets_allowed ? 'Yes' : 'No'}</div>
                      <div><strong>Smoking Allowed:</strong> {formData.smoking_allowed ? 'Yes' : 'No'}</div>
                      <div><strong>Bills Included:</strong> {formData.bills_included ? 'Yes' : 'No'}</div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-3">Images</h3>
                    {formData.image_urls.length > 0 ? (
                      <p>{formData.image_urls.length} images uploaded</p>
                    ) : (
                      <p className="text-red-500">No images uploaded. Please add at least one image.</p>
                    )}
                  </div>
                  
                  {/* Fraud Detection Status */}
                  {fraudDetectionStatus.risk && (
                    <div className={`p-4 rounded-lg border ${
                      fraudDetectionStatus.risk === 'low' ? 'bg-green-50 border-green-200' :
                      fraudDetectionStatus.risk === 'medium' ? 'bg-yellow-50 border-yellow-200' :
                      'bg-red-50 border-red-200'
                    }`}>
                      <h3 className={`font-medium ${
                        fraudDetectionStatus.risk === 'low' ? 'text-green-800' :
                        fraudDetectionStatus.risk === 'medium' ? 'text-yellow-800' :
                        'text-red-800'
                      }`}>
                        Fraud Risk Assessment: {fraudDetectionStatus.risk.toUpperCase()}
                      </h3>
                      <p className="mt-1 text-sm">
                        {fraudDetectionStatus.message}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button type="button" variant="outline" onClick={() => navigateTabs('prev')}>
                  Back
                </Button>
                <Button 
                  type="submit" 
                  disabled={loading || fraudDetectionStatus.loading}
                  className="min-w-[150px]"
                >
                  {loading || fraudDetectionStatus.loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {fraudDetectionStatus.loading ? 'Checking...' : 'Creating...'}
                    </>
                  ) : (
                    'Create Listing'
                  )}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </form>
    </div>
  );
};

export default PropertyCreateForm;
