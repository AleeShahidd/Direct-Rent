'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Heart,
  Share2,
  Printer,
  Flag,
  Calendar,
  Clock,
  MapPin,
  Home,
  Bed,
  Bath,
  Sofa,
  Car,
  ArrowLeft,
  ExternalLink,
  Loader2,
  Info,
  Banknote,
  Users,
  Leaf,
  LandPlot,
  Wifi,
  Snowflake,
  PawPrint,
  X,
  AlarmSmoke
} from 'lucide-react';
import { Property } from '@/types/enhanced';
import { format } from 'date-fns';
import { useUser } from '@/hooks/useUser';

interface PropertyDetailPageProps {
  id: string;
}

const PropertyDetailPage = ({ id }: PropertyDetailPageProps) => {
  const router = useRouter();
  const { user } = useUser();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isContactOpen, setIsContactOpen] = useState(false);

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        setLoading(true);
        
        // Fetch the property details
        const { data, error } = await supabase
          .from('properties')
          .select(`
            *,
            landlord: landlord_id (
              id,
              first_name,
              last_name,
              email,
              phone,
              profile_image
            )
          `)
          .eq('id', id)
          .single();
        
        if (error) {
          throw error;
        }
        
        if (!data) {
          setError('Property not found');
          return;
        }
        
        setProperty(data);
        
        // Increment view count
        await supabase
          .rpc('increment_property_views', { property_id: id })
          .then(({ error }) => {
            if (error) console.error('Error incrementing views:', error);
          });
        
        // Check if favorited by current user (if logged in)
        if (user) {
          const { data: favoriteData } = await supabase
            .from('favorites')
            .select()
            .eq('user_id', user.id)
            .eq('property_id', id)
            .maybeSingle();
            
          setIsFavorite(!!favoriteData);
        }
      } catch (err) {
        console.error('Error fetching property:', err);
        setError('Failed to load property details');
      } finally {
        setLoading(false);
      }
    };
    
    fetchProperty();
  }, [id, user]);
  
  const toggleFavorite = async () => {
    if (!user) {
      router.push('/auth/login?redirect=/properties/' + id);
      return;
    }
    
    try {
      if (isFavorite) {
        // Remove from favorites
        await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('property_id', id);
      } else {
        // Add to favorites
        await supabase
          .from('favorites')
          .insert({
            user_id: user.id,
            property_id: id
          });
      }
      
      setIsFavorite(!isFavorite);
    } catch (err) {
      console.error('Error toggling favorite:', err);
    }
  };
  
  const handleBookViewing = () => {
    if (!user) {
      router.push('/auth/login?redirect=/properties/' + id);
      return;
    }
    
    // Open booking modal or redirect to booking page
    router.push(`/bookings/new?property=${id}`);
  };
  
  const formatPropertyFeature = (value: any) => {
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    if (value === null || value === undefined) {
      return 'Not specified';
    }
    return value;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
        <span className="text-lg">Loading property details...</span>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-lg mx-auto">
          <h2 className="text-2xl font-bold text-red-800 mb-4">Property Not Found</h2>
          <p className="text-red-600 mb-6">
            {error || 'The property you are looking for may have been removed or is no longer available.'}
          </p>
          <Link href="/properties" passHref>
            <Button>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Properties
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const {
    title,
    description,
    property_type,
    bedrooms,
    bathrooms,
    price_per_month,
    rent_amount,
    deposit_amount,
    address_line_1,
    address_line_2,
    city,
    postcode,
    furnishing_status,
    available_from,
    minimum_tenancy_months: minimum_tenancy,
    maximum_tenancy_months: maximum_tenancy,
    parking: parking_available,
    garden,
    pets_allowed,
    bills_included,
    created_at,
    images,
    latitude,
    longitude,
    epc_rating: energy_rating,
    smoking_allowed,
    landlord
  } = property;

  // Format dates
  const createdDate = new Date(created_at);
  const formattedCreatedDate = format(createdDate, 'PPP');
  
  const availableDate = available_from ? new Date(available_from) : null;
  const formattedAvailableDate = availableDate ? 
    format(availableDate, 'PPP') : 
    'Available Now';

  // Images
  const imageArray = images || [];
  const imageUrls = Array.isArray(imageArray) 
    ? imageArray.map(img => typeof img === 'string' ? img : '')
    : [];
  const displayImages = imageUrls.length > 0 ? imageUrls : ['/placeholder-property.jpg'];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back Button */}
      <div className="mb-6">
        <Button variant="ghost" onClick={() => router.back()} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Search Results
        </Button>
      </div>
      
      {/* Property Header */}
      <div className="flex flex-col md:flex-row justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">{title}</h1>
          <div className="flex items-center text-gray-600 mb-2">
            <MapPin className="h-5 w-5 mr-1" />
            <span>
              {address_line_1}
              {address_line_2 ? `, ${address_line_2}` : ''}, 
              {city}, {postcode}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="secondary" className="text-lg px-3 py-1">
              £{price_per_month || rent_amount}/month
            </Badge>
            
            {deposit_amount && (
              <Badge variant="outline" className="text-gray-700">
                £{deposit_amount} deposit
              </Badge>
            )}
            
            <Badge variant="outline" className="text-gray-700 capitalize">
              {property_type}
            </Badge>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2 mt-4 md:mt-0">
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-2"
            onClick={toggleFavorite}
          >
            <Heart className={`h-4 w-4 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
            {isFavorite ? 'Saved' : 'Save'}
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-2"
            onClick={() => window.print()}
          >
            <Printer className="h-4 w-4" />
            Print
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-2"
            onClick={() => {
              navigator.share({
                title: title,
                url: window.location.href
              }).catch(console.error);
            }}
          >
            <Share2 className="h-4 w-4" />
            Share
          </Button>
        </div>
      </div>
      
      {/* Image Gallery */}
      <div className="mb-8">
        <div className="aspect-video relative rounded-lg overflow-hidden mb-2">
          <Image
            src={displayImages[selectedImage]}
            alt={title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover"
          />
        </div>
        
        {displayImages.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-2">
            {displayImages.map((image, index) => (
              <button
                key={index}
                onClick={() => setSelectedImage(index)}
                className={`relative w-24 h-16 rounded-md overflow-hidden flex-shrink-0 border-2 ${
                  selectedImage === index ? 'border-primary' : 'border-transparent'
                }`}
              >
                <Image
                  src={image}
                  alt={`${title} - Image ${index + 1}`}
                  fill
                  sizes="100px"
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>
      
      {/* Property Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <div className="lg:col-span-2">
          <Tabs defaultValue="details">
            <TabsList className="mb-4">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="features">Features</TabsTrigger>
              <TabsTrigger value="location">Location</TabsTrigger>
            </TabsList>
            
            <TabsContent value="details" className="mt-0">
              <div className="bg-white rounded-lg border p-6">
                <h2 className="text-xl font-semibold mb-4">Property Description</h2>
                <div className="prose max-w-none">
                  <p className="whitespace-pre-line">{description}</p>
                </div>
                
                <hr className="my-6" />
                
                <h3 className="text-lg font-semibold mb-4">Key Information</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <span className="text-gray-600 text-sm block">Property Type</span>
                    <div className="flex items-center mt-1">
                      <Home className="h-4 w-4 mr-2 text-gray-500" />
                      <span className="capitalize">{property_type}</span>
                    </div>
                  </div>
                  
                  <div>
                    <span className="text-gray-600 text-sm block">Bedrooms</span>
                    <div className="flex items-center mt-1">
                      <Bed className="h-4 w-4 mr-2 text-gray-500" />
                      <span>{bedrooms}</span>
                    </div>
                  </div>
                  
                  <div>
                    <span className="text-gray-600 text-sm block">Bathrooms</span>
                    <div className="flex items-center mt-1">
                      <Bath className="h-4 w-4 mr-2 text-gray-500" />
                      <span>{bathrooms}</span>
                    </div>
                  </div>
                  
                  <div>
                    <span className="text-gray-600 text-sm block">Furnishing</span>
                    <div className="flex items-center mt-1">
                      <Sofa className="h-4 w-4 mr-2 text-gray-500" />
                      <span className="capitalize">{furnishing_status?.replace('_', ' ') || 'Not specified'}</span>
                    </div>
                  </div>
                  
                  <div>
                    <span className="text-gray-600 text-sm block">Available From</span>
                    <div className="flex items-center mt-1">
                      <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                      <span>{formattedAvailableDate}</span>
                    </div>
                  </div>
                  
                  <div>
                    <span className="text-gray-600 text-sm block">Minimum Tenancy</span>
                    <div className="flex items-center mt-1">
                      <Clock className="h-4 w-4 mr-2 text-gray-500" />
                      <span>{minimum_tenancy || 'Not specified'} months</span>
                    </div>
                  </div>
                  
                  {energy_rating && (
                    <div>
                      <span className="text-gray-600 text-sm block">Energy Rating</span>
                      <div className="flex items-center mt-1">
                        <Badge className={`
                          ${energy_rating === 'A' ? 'bg-green-500' : ''}
                          ${energy_rating === 'B' ? 'bg-green-400' : ''}
                          ${energy_rating === 'C' ? 'bg-green-300' : ''}
                          ${energy_rating === 'D' ? 'bg-yellow-300' : ''}
                          ${energy_rating === 'E' ? 'bg-yellow-400' : ''}
                          ${energy_rating === 'F' ? 'bg-orange-400' : ''}
                          ${energy_rating === 'G' ? 'bg-red-500' : ''}
                        `}>
                          EPC {energy_rating}
                        </Badge>
                      </div>
                    </div>
                  )}
                </div>
                
                <hr className="my-6" />
                
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    <span>Listed on {formattedCreatedDate}</span>
                  </div>
                  
                  <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 gap-1">
                    <Flag className="h-4 w-4" />
                    Report Listing
                  </Button>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="features" className="mt-0">
              <div className="bg-white rounded-lg border p-6">
                <h2 className="text-xl font-semibold mb-4">Property Features</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-medium mb-3">General</h3>
                    <ul className="space-y-3">
                      <li className="flex items-center">
                        <div className={`mr-3 ${parking_available ? 'text-green-500' : 'text-red-500'}`}>
                          {parking_available ? <Car /> : <X />}
                        </div>
                        <div>
                          <span className="font-medium">Parking</span>
                          <p className="text-sm text-gray-600">
                            {parking_available ? 'Available' : 'Not available'}
                          </p>
                        </div>
                      </li>
                      
                      <li className="flex items-center">
                        <div className={`mr-3 ${garden ? 'text-green-500' : 'text-red-500'}`}>
                          {garden ? <LandPlot /> : <X />}
                        </div>
                        <div>
                          <span className="font-medium">Garden</span>
                          <p className="text-sm text-gray-600">
                            {garden ? 'Available' : 'Not available'}
                          </p>
                        </div>
                      </li>
                      
                      <li className="flex items-center">
                        <div className={`mr-3 ${bills_included ? 'text-green-500' : 'text-red-500'}`}>
                          {bills_included ? <Banknote /> : <X />}
                        </div>
                        <div>
                          <span className="font-medium">Bills Included</span>
                          <p className="text-sm text-gray-600">
                            {bills_included ? 'Yes - included in rent' : 'No - tenant responsibility'}
                          </p>
                        </div>
                      </li>
                      
                      <li className="flex items-center">
                        <div className={`mr-3 ${pets_allowed ? 'text-green-500' : 'text-red-500'}`}>
                          {pets_allowed ? <PawPrint /> : <X />}
                        </div>
                        <div>
                          <span className="font-medium">Pets</span>
                          <p className="text-sm text-gray-600">
                            {pets_allowed ? 'Allowed' : 'Not allowed'}
                          </p>
                        </div>
                      </li>
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-3">Additional Details</h3>
                    <ul className="space-y-3">
                      <li className="flex items-center">
                        <div className={`mr-3 ${smoking_allowed ? 'text-green-500' : 'text-red-500'}`}>
                          {smoking_allowed ? <AlarmSmoke /> : <X />}
                        </div>
                        <div>
                          <span className="font-medium">Smoking</span>
                          <p className="text-sm text-gray-600">
                            {smoking_allowed ? 'Allowed' : 'Not allowed'}
                          </p>
                        </div>
                      </li>
                      
                      {maximum_tenancy && (
                        <li className="flex items-center">
                          <div className="mr-3 text-blue-500">
                            <Calendar />
                          </div>
                          <div>
                            <span className="font-medium">Maximum Tenancy</span>
                            <p className="text-sm text-gray-600">
                              {maximum_tenancy} months
                            </p>
                          </div>
                        </li>
                      )}
                      
                      <li className="flex items-center">
                        <div className="mr-3 text-blue-500">
                          <Info />
                        </div>
                        <div>
                          <span className="font-medium">Deposit Protection</span>
                          <p className="text-sm text-gray-600">
                            Deposit secured in government-approved scheme
                          </p>
                        </div>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="location" className="mt-0">
              <div className="bg-white rounded-lg border p-6">
                <h2 className="text-xl font-semibold mb-4">Property Location</h2>
                
                {latitude && longitude ? (
                  <div className="aspect-[16/9] relative rounded overflow-hidden mb-4">
                    <iframe
                      width="100%"
                      height="100%"
                      loading="lazy"
                      allowFullScreen
                      referrerPolicy="no-referrer-when-downgrade"
                      src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyCWWWLVkR-1pJvrELu5Ij0UFjsWRJzgwEo&q=${latitude},${longitude}&zoom=15`}
                    ></iframe>
                  </div>
                ) : (
                  <div className="bg-gray-100 rounded p-4 text-center">
                    <p>Map location not available for this property</p>
                  </div>
                )}
                
                <div>
                  <h3 className="text-lg font-medium mb-2">Address</h3>
                  <p className="text-gray-700 mb-4">
                    {address_line_1}
                    {address_line_2 ? <><br />{address_line_2}</> : ''}
                    <br />
                    {city}, {postcode}
                  </p>
                  
                  <Button variant="outline" className="gap-2">
                    <ExternalLink className="h-4 w-4" />
                    View on Google Maps
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
        
        {/* Contact & Booking Sidebar */}
        <div>
          <div className="bg-white rounded-lg border p-6 mb-4">
            <h2 className="text-xl font-semibold mb-4">Book a Viewing</h2>
            
            <div className="space-y-4 mb-6">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                <span>Available from {formattedAvailableDate}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Banknote className="h-5 w-5 text-primary" />
                  <span>
                £{price_per_month || rent_amount} per month
              </span>
              </div>
              
              {deposit_amount && (
                <div className="flex items-center gap-2">
                  <Banknote className="h-5 w-5 text-primary" />
                  <span>£{deposit_amount} deposit</span>
                </div>
              )}
            </div>
            
            <div className="space-y-3">
              <Button onClick={handleBookViewing} className="w-full gap-2">
                <Calendar className="h-4 w-4" />
                Book a Viewing
              </Button>
              
              <Button variant="outline" className="w-full gap-2" onClick={() => setIsContactOpen(!isContactOpen)}>
                Contact Landlord
              </Button>
            </div>
            
            {isContactOpen && landlord && (
              <div className="mt-4 pt-4 border-t">
                <h3 className="font-medium mb-2">Landlord Contact</h3>
                
                <div className="space-y-2">
                  {landlord.avatar_url && (
                    <div className="flex items-center gap-3 mb-3">
                      <div className="relative w-10 h-10 rounded-full overflow-hidden">
                        <Image 
                          src={landlord.avatar_url} 
                          alt={`${landlord.first_name} ${landlord.last_name}`}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <p className="font-medium">{landlord.first_name} {landlord.last_name}</p>
                        <p className="text-sm text-gray-500">Property Owner</p>
                      </div>
                    </div>
                  )}
                  
                  <p className="text-sm">
                    <span className="font-medium">Email: </span>
                    <a href={`mailto:${landlord.email}`} className="text-blue-600 hover:underline">
                      {landlord.email}
                    </a>
                  </p>
                  
                  {landlord.phone && (
                    <p className="text-sm">
                      <span className="font-medium">Phone: </span>
                      <a href={`tel:${landlord.phone}`} className="text-blue-600 hover:underline">
                        {landlord.phone}
                      </a>
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
          
          <div className="bg-blue-50 rounded-lg border border-blue-100 p-4">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium text-blue-800 mb-1">Direct-Rent Protection</h3>
                <p className="text-sm text-blue-700">
                  This property is verified by Direct-Rent. We ensure all listings are legitimate and offer tenant protection.
                </p>
                <Link href="/report" className="text-sm text-blue-600 hover:underline mt-2 inline-block">
                  See something suspicious? Report it
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Similar Properties (Placeholder) */}
      <div className="border-t pt-8 mt-8">
        <h2 className="text-2xl font-semibold mb-6">Similar Properties</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* This would be populated with actual similar properties */}
          <div className="bg-gray-100 rounded-lg h-64 flex items-center justify-center">
            <p className="text-gray-500">Similar property recommendations would appear here</p>
          </div>
          <div className="bg-gray-100 rounded-lg h-64 flex items-center justify-center">
            <p className="text-gray-500">Similar property recommendations would appear here</p>
          </div>
          <div className="bg-gray-100 rounded-lg h-64 flex items-center justify-center">
            <p className="text-gray-500">Similar property recommendations would appear here</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyDetailPage;
