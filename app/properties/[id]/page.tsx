'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Property, User } from '@/types';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { 
  MapPin, 
  Bed, 
  Bath, 
  Car, 
  Calendar, 
  Heart,
  Share2,
  Flag,
  Phone,
  Mail,
  MessageCircle,
  Home
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { InquiryForm } from '@/components/property/InquiryForm';

// Simple notification function
const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
  console.log(`${type.toUpperCase()}: ${message}`);
  // For now, using alert - can be replaced with proper toast when environment is set up
  alert(`${type.charAt(0).toUpperCase() + type.slice(1)}: ${message}`);
};

export default function PropertyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [property, setProperty] = useState<Property | null>(null);
  const [landlord, setLandlord] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showInquiryForm, setShowInquiryForm] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        const response = await fetch(`/api/properties/${params.id}`);
        if (!response.ok) {
          throw new Error('Property not found');
        }
        const data = await response.json();
        setProperty(data);

        // Fetch landlord details
        if (data.landlord_id) {
          const { data: landlordData } = await supabase
            .from('users')
            .select('*')
            .eq('id', data.landlord_id)
            .single();
          
          if (landlordData) {
            setLandlord(landlordData);
          }
        }

        // Check if property is saved by current user
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: userData } = await supabase
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single();
          setCurrentUser(userData);

          const { data: savedProperty } = await supabase
            .from('saved_properties')
            .select('*')
            .eq('user_id', user.id)
            .eq('property_id', params.id)
            .single();
          
          setIsSaved(!!savedProperty);
        }

        // Record property view
        if (user) {
          await supabase
            .from('property_views')
            .insert({
              property_id: params.id,
              user_id: user.id,
              viewed_at: new Date().toISOString()
            });
        }

      } catch (error) {
        console.error('Error fetching property:', error);
        showNotification('Failed to load property details', 'error');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchProperty();
    }
  }, [params.id]);

  const handleSaveProperty = async () => {
    if (!currentUser) {
      showNotification('Please login to save properties', 'error');
      router.push('/auth/login');
      return;
    }

    try {
      if (isSaved) {
        await supabase
          .from('saved_properties')
          .delete()
          .eq('user_id', currentUser.id)
          .eq('property_id', params.id);
        setIsSaved(false);
        showNotification('Property removed from saved', 'success');
      } else {
        await supabase
          .from('saved_properties')
          .insert({
            user_id: currentUser.id,
            property_id: params.id
          });
        setIsSaved(true);
        showNotification('Property saved successfully', 'success');
      }
    } catch (error) {
      console.error('Error saving property:', error);
      showNotification('Failed to save property', 'error');
    }
  };

  const handleShare = async () => {
    if (typeof window === 'undefined') return;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: property?.title,
          text: property?.description,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback to copying to clipboard
      navigator.clipboard.writeText(window.location.href);
      showNotification('Link copied to clipboard', 'success');
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getEPCColor = (rating: string) => {
    const colors: { [key: string]: string } = {
      'A': 'bg-green-600',
      'B': 'bg-green-500',
      'C': 'bg-yellow-500',
      'D': 'bg-orange-500',
      'E': 'bg-red-500',
      'F': 'bg-red-600',
      'G': 'bg-red-700'
    };
    return colors[rating] || 'bg-gray-500';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Property not found</h1>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    );
  }

  const images = property.images || ['/placeholder-property.jpg'];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Image Gallery */}
        <div className="relative h-96 md:h-[500px] rounded-xl overflow-hidden mb-8">
          <Image
            src={images[currentImageIndex]}
            alt={property.title}
            fill
            className="object-cover"
          />
          
          {/* Image Navigation */}
          {images.length > 1 && (
            <>
              <button
                onClick={() => setCurrentImageIndex((prev: number) => prev === 0 ? images.length - 1 : prev - 1)}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70"
              >
                ←
              </button>
              <button
                onClick={() => setCurrentImageIndex((prev: number) => prev === images.length - 1 ? 0 : prev + 1)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70"
              >
                →
              </button>
              
              {/* Image Indicators */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                {images.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`w-3 h-3 rounded-full ${
                      index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                    }`}
                  />
                ))}
              </div>
            </>
          )}

          {/* Action Buttons */}
          <div className="absolute top-4 right-4 flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSaveProperty}
              className="bg-white/90 hover:bg-white"
            >
              <Heart className={`h-4 w-4 ${isSaved ? 'fill-red-500 text-red-500' : ''}`} />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleShare}
              className="bg-white/90 hover:bg-white"
            >
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Property Title and Price */}
            <div className="bg-white rounded-xl p-6 mb-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{property.title}</h1>
                  <div className="flex items-center text-gray-600 mb-2">
                    <MapPin className="h-4 w-4 mr-1" />
                    {property.address || property.address_line_1}, {property.city}, {property.postcode}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-blue-600">
                    {formatPrice(property.price || property.price_per_month)}
                  </div>
                  <div className="text-gray-600">per month</div>
                </div>
              </div>

              {/* Property Features */}
              <div className="flex items-center space-x-6 text-gray-600">
                <div className="flex items-center">
                  <Bed className="h-5 w-5 mr-2" />
                  {property.bedrooms} beds
                </div>
                <div className="flex items-center">
                  <Bath className="h-5 w-5 mr-2" />
                  {property.bathrooms} baths
                </div>
                {property.parking_spaces && property.parking_spaces > 0 && (
                  <div className="flex items-center">
                    <Car className="h-5 w-5 mr-2" />
                    {property.parking_spaces} parking
                  </div>
                )}
                <div className="flex items-center">
                  <Home className="h-5 w-5 mr-2" />
                  {property.property_type}
                </div>
              </div>
            </div>

            {/* Property Details */}
            <div className="bg-white rounded-xl p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Property Details</h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Furnishing:</span> {property.furnishing_status}
                </div>
                <div>
                  <span className="font-medium">Council Tax Band:</span> {property.council_tax_band}
                </div>
                <div>
                  <span className="font-medium">Available from:</span> {property.available_from ? new Date(property.available_from).toLocaleDateString() : 'Now'}
                </div>
                <div>
                  <span className="font-medium">Deposit:</span> {formatPrice(property.deposit_amount || 0)}
                </div>
                {property.minimum_tenancy_months && (
                  <div>
                    <span className="font-medium">Min. tenancy:</span> {property.minimum_tenancy_months} months
                  </div>
                )}
                {property.pets_allowed !== null && (
                  <div>
                    <span className="font-medium">Pets:</span> {property.pets_allowed ? 'Allowed' : 'Not allowed'}
                  </div>
                )}
                {property.smoking_allowed !== null && (
                  <div>
                    <span className="font-medium">Smoking:</span> {property.smoking_allowed ? 'Allowed' : 'Not allowed'}
                  </div>
                )}
                {property.students_allowed !== null && property.students_allowed !== undefined && (
                  <div>
                    <span className="font-medium">Students:</span> {property.students_allowed ? 'Welcome' : 'No students'}
                  </div>
                )}
              </div>

              {/* EPC Rating */}
              {property.epc_rating && (
                <div className="mt-4">
                  <span className="font-medium">EPC Rating:</span>
                  <span className={`ml-2 px-3 py-1 rounded text-white text-sm font-bold ${getEPCColor(property.epc_rating)}`}>
                    {property.epc_rating}
                  </span>
                </div>
              )}
            </div>

            {/* Description */}
            <div className="bg-white rounded-xl p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Description</h2>
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                {property.description}
              </p>
            </div>

            {/* Amenities */}
            {property.amenities && Array.isArray(property.amenities) && property.amenities.length > 0 && (
              <div className="bg-white rounded-xl p-6 mb-6">
                <h2 className="text-xl font-semibold mb-4">Amenities</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {property.amenities.map((amenity: string, index: number) => (
                    <div key={index} className="flex items-center text-gray-700">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                      {amenity}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Landlord Info */}
            {landlord && (
              <div className="bg-white rounded-xl p-6 mb-6">
                <h3 className="text-lg font-semibold mb-4">Contact Landlord</h3>
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                    <span className="text-blue-600 font-semibold">
                      {landlord.first_name?.[0] || landlord.full_name?.[0] || 'L'}{landlord.last_name?.[0] || ''}
                    </span>
                  </div>
                  <div>
                    <div className="font-medium">
                      {landlord.first_name || landlord.full_name} {landlord.last_name || ''}
                    </div>
                    <div className="text-sm text-gray-600">Landlord</div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Button
                    onClick={() => setShowInquiryForm(true)}
                    className="w-full"
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Send Message
                  </Button>
                  
                  {landlord.phone && (
                    <Button variant="outline" className="w-full">
                      <Phone className="h-4 w-4 mr-2" />
                      Call Landlord
                    </Button>
                  )}
                  
                  {landlord.email && (
                    <Button variant="outline" className="w-full">
                      <Mail className="h-4 w-4 mr-2" />
                      Email Landlord
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="bg-white rounded-xl p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    showNotification('Booking system coming soon!', 'info');
                  }}
                  className="w-full"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Book Viewing
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => {
                    showNotification('Report functionality coming soon!', 'info');
                  }}
                  className="w-full text-red-600 border-red-200 hover:bg-red-50"
                >
                  <Flag className="h-4 w-4 mr-2" />
                  Report Property
                </Button>
              </div>
            </div>

            {/* Price Breakdown */}
            <div className="bg-white rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">Price Breakdown</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Monthly rent:</span>
                  <span className="font-medium">{formatPrice(property.price || property.price_per_month)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Deposit:</span>
                  <span className="font-medium">{formatPrice(property.deposit_amount || 0)}</span>
                </div>
                <hr className="my-2" />
                <div className="flex justify-between font-semibold">
                  <span>Total upfront:</span>
                  <span>{formatPrice((property.price || property.price_per_month) + (property.deposit_amount || 0))}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Inquiry Form Modal */}
      {showInquiryForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <InquiryForm
              property={property}
              landlord={landlord}
              currentUser={currentUser}
              onSuccess={() => {
                setShowInquiryForm(false);
                showNotification('Message sent successfully!', 'success');
              }}
              onCancel={() => setShowInquiryForm(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
