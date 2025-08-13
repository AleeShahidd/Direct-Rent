'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Property, User, Booking } from '@/types';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { PropertyCard } from '@/components/property/PropertyCard';
import { 
  Heart,
  MessageSquare,
  Search,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Trash2
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';

import TenantProtection from './TenantProtection';

function TenantDashboard() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [savedProperties, setSavedProperties] = useState<Property[]>([]);
  const [inquiries, setInquiries] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const checkAuth = async () => {
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

      if (!userData) {
        router.push('/auth/login');
        return;
      }

      setCurrentUser(userData);
      fetchDashboardData(userData.id);
    };

    checkAuth();
  }, [router]);

  const fetchDashboardData = async (userId: string) => {
    try {
      // Fetch saved properties
      const { data: savedPropertiesData } = await supabase
        .from('saved_properties')
        .select(`
          property:properties(
            *,
            landlord:users(first_name, last_name, email, phone)
          )
        `)
        .eq('user_id', userId);

      // Fetch user's inquiries
      const { data: inquiriesData } = await supabase
        .from('bookings')
        .select(`
          *,
          property:properties(
            id, title, address, city, price, bedrooms, bathrooms, property_type,
            landlord:users(first_name, last_name, email, phone)
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      setSavedProperties((savedPropertiesData?.map(sp => sp.property) || []) as unknown as Property[]);
      setInquiries((inquiriesData || []) as unknown as Booking[]);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeSavedProperty = async (propertyId: string) => {
    if (!currentUser) return;

    try {
      await supabase
        .from('saved_properties')
        .delete()
        .eq('user_id', currentUser.id)
        .eq('property_id', propertyId);

      setSavedProperties(prev => prev.filter(p => p.id !== propertyId));
    } catch (error) {
      console.error('Error removing saved property:', error);
    }
  };

  const withdrawInquiry = async (inquiryId: string) => {
    try {
      await supabase
        .from('bookings')
        .update({ 
          status: 'withdrawn',
          updated_at: new Date().toISOString()
        })
        .eq('id', inquiryId);

      setInquiries(prev => 
        prev.map(inq => 
          inq.id === inquiryId 
            ? { ...inq, status: 'withdrawn' }
            : inq
        )
      );
    } catch (error) {
      console.error('Error withdrawing inquiry:', error);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'accepted':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'withdrawn':
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'withdrawn': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  const pendingInquiries = inquiries.filter(i => i.status === 'pending').length;
  const acceptedInquiries = inquiries.filter(i => i.status === 'accepted').length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome back, {currentUser?.first_name}
            </h1>
            <p className="text-gray-600">Track your property search and inquiries</p>
          </div>
          <Button onClick={() => router.push('/search')}>
            <Search className="h-4 w-4 mr-2" />
            Search Properties
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <Heart className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Saved Properties</p>
                <p className="text-2xl font-bold text-gray-900">{savedProperties.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <MessageSquare className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Inquiries</p>
                <p className="text-2xl font-bold text-gray-900">{inquiries.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">{pendingInquiries}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Accepted</p>
                <p className="text-2xl font-bold text-gray-900">{acceptedInquiries}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('saved')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'saved'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Saved Properties ({savedProperties.length})
            </button>
            <button
              onClick={() => setActiveTab('inquiries')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'inquiries'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              My Inquiries ({inquiries.length})
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Recent Inquiries */}
            <div className="bg-white rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">Recent Inquiries</h3>
              {inquiries.slice(0, 5).map((inquiry) => (
                <div key={inquiry.id} className="flex items-center justify-between py-3 border-b last:border-b-0">
                  <div>
                    <p className="font-medium">{inquiry.property?.title}</p>
                    <p className="text-sm text-gray-600">{inquiry.property?.address}, {inquiry.property?.city}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Sent {new Date(inquiry.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(inquiry.status)}
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(inquiry.status)}`}>
                      {inquiry.status}
                    </span>
                  </div>
                </div>
              ))}
              {inquiries.length === 0 && (
                <p className="text-gray-500 text-center py-4">No inquiries sent yet</p>
              )}
            </div>

            {/* Saved Properties Preview */}
            <div className="bg-white rounded-xl p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Saved Properties</h3>
                {savedProperties.length > 0 && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setActiveTab('saved')}
                  >
                    View All
                  </Button>
                )}
              </div>
              
              {savedProperties.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {savedProperties.slice(0, 6).map((property) => (
                    <div key={property.id} className="border rounded-lg p-4">
                      <h4 className="font-medium mb-2">{property.title}</h4>
                      <p className="text-sm text-gray-600 mb-2">{property.city}</p>
                      <p className="text-lg font-bold text-blue-600">{formatPrice(property.price)}/month</p>
                      <Button 
                        size="sm" 
                        className="w-full mt-3"
                        onClick={() => router.push(`/properties/${property.id}`)}
                      >
                        View Details
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Heart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">No saved properties yet</p>
                  <Button onClick={() => router.push('/search')}>
                    <Search className="h-4 w-4 mr-2" />
                    Start Searching
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'saved' && (
          <div>
            {savedProperties.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {savedProperties.map((property) => (
                  <div key={property.id} className="relative">
                    <PropertyCard property={property} />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeSavedProperty(property.id)}
                      className="absolute top-3 right-3 bg-white hover:bg-red-50 text-red-600 border-red-200"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl p-12 text-center">
                <Heart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No saved properties</h3>
                <p className="text-gray-500 mb-6">Start browsing properties and save your favorites</p>
                <Button onClick={() => router.push('/search')}>
                  <Search className="h-4 w-4 mr-2" />
                  Browse Properties
                </Button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'inquiries' && (
          <div>
            {inquiries.length > 0 ? (
              <div className="space-y-4">
                {inquiries.map((inquiry) => (
                  <InquiryCard 
                    key={inquiry.id} 
                    inquiry={inquiry} 
                    onWithdraw={withdrawInquiry}
                    onViewProperty={(id) => router.push(`/properties/${id}`)}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl p-12 text-center">
                <MessageSquare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No inquiries sent</h3>
                <p className="text-gray-500 mb-6">Browse properties and send inquiries to landlords</p>
                <Button onClick={() => router.push('/search')}>
                  <Search className="h-4 w-4 mr-2" />
                  Find Properties
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Inquiry Card Component
function InquiryCard({ 
  inquiry, 
  onWithdraw,
  onViewProperty
}: { 
  inquiry: any; 
  onWithdraw: (id: string) => void;
  onViewProperty: (id: string) => void;
}) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'accepted':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'withdrawn':
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'withdrawn': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="bg-white rounded-xl p-6 border">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h4 className="text-lg font-medium text-gray-900">{inquiry.property?.title}</h4>
          <p className="text-sm text-gray-600">{inquiry.property?.address}, {inquiry.property?.city}</p>
          <p className="text-lg font-bold text-blue-600 mt-1">
            {formatPrice(inquiry.property?.price)}/month
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {getStatusIcon(inquiry.status)}
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(inquiry.status)}`}>
            {inquiry.status}
          </span>
        </div>
      </div>

      <div className="mb-4">
        <p className="text-sm font-medium text-gray-900 mb-2">Your Message:</p>
        <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">{inquiry.message}</p>
      </div>

      {inquiry.preferred_viewing_date && (
        <div className="mb-4">
          <p className="text-sm text-gray-600">
            <Calendar className="h-4 w-4 inline mr-1" />
            Preferred viewing: {new Date(inquiry.preferred_viewing_date).toLocaleDateString()}
            {inquiry.preferred_viewing_time && ` at ${inquiry.preferred_viewing_time}`}
          </p>
        </div>
      )}

      {inquiry.landlord_response && (
        <div className="mb-4">
          <p className="text-sm font-medium text-gray-900 mb-2">Landlord Response:</p>
          <p className="text-sm text-gray-700 bg-blue-50 p-3 rounded border-l-4 border-blue-200">
            {inquiry.landlord_response}
          </p>
        </div>
      )}

      <div className="flex items-center justify-between pt-4 border-t">
        <div className="text-xs text-gray-500">
          <Clock className="h-3 w-3 inline mr-1" />
          Sent {new Date(inquiry.created_at).toLocaleDateString()} at {new Date(inquiry.created_at).toLocaleTimeString()}
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewProperty(inquiry.property?.id)}
          >
            View Property
          </Button>
          
          {inquiry.status === 'pending' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onWithdraw(inquiry.id)}
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              Withdraw
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
