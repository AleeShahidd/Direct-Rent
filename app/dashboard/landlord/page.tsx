'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Property, User, Booking } from '@/types';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { 
  Plus,
  Home,
  MessageSquare,
  Users,
  TrendingUp,
  Edit,
  Trash2,
  Eye,
  MapPin,
  Bed,
  Bath,
  Clock
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';

import LandlordProtection from './LandlordProtection';

function LandlordDashboard() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
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

      if (!userData || userData.role !== 'landlord') {
        router.push('/');
        return;
      }

      setCurrentUser(userData);
      fetchDashboardData(userData.id);
    };

    checkAuth();
  }, [router]);

  const fetchDashboardData = async (landlordId: string) => {
    try {
      // Fetch properties
      const { data: propertiesData } = await supabase
        .from('properties')
        .select('*')
        .eq('landlord_id', landlordId);

      // Fetch inquiries/bookings
      const { data: inquiriesData } = await supabase
        .from('bookings')
        .select(`
          *,
          property:properties(title, address, city),
          user:users(first_name, last_name, email, phone)
        `)
        .in('property_id', propertiesData?.map(p => p.id) || []);

      setProperties(propertiesData || []);
      setInquiries(inquiriesData || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
    }).format(price);
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

  const handleInquiryResponse = async (inquiryId: string, status: 'accepted' | 'rejected', response: string) => {
    try {
      await supabase
        .from('bookings')
        .update({
          status,
          landlord_response: response,
          updated_at: new Date().toISOString()
        })
        .eq('id', inquiryId);

      // Refresh inquiries
      if (currentUser) {
        fetchDashboardData(currentUser.id);
      }
    } catch (error) {
      console.error('Error updating inquiry:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  const totalInquiries = inquiries.length;
  const pendingInquiries = inquiries.filter(i => i.status === 'pending').length;
  const totalProperties = properties.length;
  const totalRevenue = properties.reduce((sum, p) => sum + p.price, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome back, {currentUser?.first_name}
            </h1>
            <p className="text-gray-600">Manage your properties and tenant inquiries</p>
          </div>
          <Button onClick={() => router.push('/properties/new')}>
            <Plus className="h-4 w-4 mr-2" />
            Add Property
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Home className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Properties</p>
                <p className="text-2xl font-bold text-gray-900">{totalProperties}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
                <p className="text-2xl font-bold text-gray-900">{formatPrice(totalRevenue)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <MessageSquare className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Inquiries</p>
                <p className="text-2xl font-bold text-gray-900">{pendingInquiries}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Inquiries</p>
                <p className="text-2xl font-bold text-gray-900">{totalInquiries}</p>
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
              onClick={() => setActiveTab('properties')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'properties'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Properties ({totalProperties})
            </button>
            <button
              onClick={() => setActiveTab('inquiries')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'inquiries'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Inquiries ({pendingInquiries})
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
                    <p className="text-sm text-gray-600">
                      From: {inquiry.user?.first_name} {inquiry.user?.last_name}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(inquiry.status)}`}>
                    {inquiry.status}
                  </span>
                </div>
              ))}
              {inquiries.length === 0 && (
                <p className="text-gray-500 text-center py-4">No inquiries yet</p>
              )}
            </div>

            {/* Top Properties */}
            <div className="bg-white rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">Your Properties</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {properties.slice(0, 6).map((property) => (
                  <div key={property.id} className="border rounded-lg p-4">
                    <h4 className="font-medium mb-2">{property.title}</h4>
                    <p className="text-sm text-gray-600 mb-2">{property.city}</p>
                    <p className="text-lg font-bold text-blue-600">{formatPrice(property.price)}/month</p>
                    <div className="flex items-center text-xs text-gray-500 mt-2">
                      <Bed className="h-3 w-3 mr-1" />
                      {property.bedrooms}
                      <Bath className="h-3 w-3 ml-2 mr-1" />
                      {property.bathrooms}
                    </div>
                  </div>
                ))}
              </div>
              {properties.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">You haven&apos;t added any properties yet</p>
                  <Button onClick={() => router.push('/properties/new')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Property
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'properties' && (
          <div className="bg-white rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">All Properties</h3>
                <Button onClick={() => router.push('/properties/new')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Property
                </Button>
              </div>
            </div>
            
            {properties.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Property</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {properties.map((property) => (
                      <tr key={property.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-gray-900">{property.title}</p>
                            <div className="flex items-center text-sm text-gray-500 mt-1">
                              <Bed className="h-3 w-3 mr-1" />
                              {property.bedrooms}
                              <Bath className="h-3 w-3 ml-2 mr-1" />
                              {property.bathrooms}
                              <Home className="h-3 w-3 ml-2 mr-1" />
                              {property.property_type}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 text-gray-400 mr-1" />
                            <span className="text-sm text-gray-900">{property.city}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-medium text-gray-900">
                            {formatPrice(property.price)}/month
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                            Active
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => router.push(`/properties/${property.id}`)}
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => router.push(`/properties/${property.id}/edit`)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="text-red-600 border-red-200 hover:bg-red-50"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <Home className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No properties added yet</p>
                <Button onClick={() => router.push('/properties/new')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Property
                </Button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'inquiries' && (
          <div className="bg-white rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-semibold">Property Inquiries</h3>
            </div>
            
            {inquiries.length > 0 ? (
              <div className="space-y-4 p-6">
                {inquiries.map((inquiry) => (
                  <InquiryCard 
                    key={inquiry.id} 
                    inquiry={inquiry} 
                    onResponse={handleInquiryResponse}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No inquiries yet</p>
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
  onResponse 
}: { 
  inquiry: any; 
  onResponse: (id: string, status: 'accepted' | 'rejected', response: string) => void 
}) {
  const [showResponse, setShowResponse] = useState(false);
  const [response, setResponse] = useState('');

  const handleSubmitResponse = (status: 'accepted' | 'rejected') => {
    if (!response.trim() && status === 'accepted') {
      alert('Please provide a response message');
      return;
    }
    onResponse(inquiry.id, status, response);
    setShowResponse(false);
    setResponse('');
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

  return (
    <div className="border rounded-lg p-4">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h4 className="font-medium text-gray-900">{inquiry.property?.title}</h4>
          <p className="text-sm text-gray-600">{inquiry.property?.address}, {inquiry.property?.city}</p>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(inquiry.status)}`}>
          {inquiry.status}
        </span>
      </div>

      <div className="mb-4">
        <p className="text-sm text-gray-600 mb-2">
          <strong>From:</strong> {inquiry.user?.first_name} {inquiry.user?.last_name}
        </p>
        <p className="text-sm text-gray-600 mb-2">
          <strong>Email:</strong> {inquiry.user?.email}
        </p>
        {inquiry.user?.phone && (
          <p className="text-sm text-gray-600 mb-2">
            <strong>Phone:</strong> {inquiry.user?.phone}
          </p>
        )}
        {inquiry.preferred_viewing_date && (
          <p className="text-sm text-gray-600 mb-2">
            <strong>Preferred viewing:</strong> {new Date(inquiry.preferred_viewing_date).toLocaleDateString()}
            {inquiry.preferred_viewing_time && ` at ${inquiry.preferred_viewing_time}`}
          </p>
        )}
      </div>

      <div className="mb-4">
        <p className="text-sm font-medium text-gray-900 mb-2">Message:</p>
        <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">{inquiry.message}</p>
      </div>

      {inquiry.landlord_response && (
        <div className="mb-4">
          <p className="text-sm font-medium text-gray-900 mb-2">Your Response:</p>
          <p className="text-sm text-gray-700 bg-blue-50 p-3 rounded">{inquiry.landlord_response}</p>
        </div>
      )}

      {inquiry.status === 'pending' && (
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowResponse(!showResponse)}
          >
            <MessageSquare className="h-3 w-3 mr-1" />
            Respond
          </Button>
          <Button
            size="sm"
            onClick={() => onResponse(inquiry.id, 'accepted', 'Thank you for your inquiry. I would be happy to arrange a viewing.')}
          >
            Accept
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onResponse(inquiry.id, 'rejected', 'Thank you for your interest, but this property is no longer available.')}
            className="text-red-600 border-red-200 hover:bg-red-50"
          >
            Decline
          </Button>
        </div>
      )}

      {showResponse && (
        <div className="mt-4 p-4 bg-gray-50 rounded">
          <textarea
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            placeholder="Write your response..."
            rows={3}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex items-center space-x-2 mt-3">
            <Button size="sm" onClick={() => handleSubmitResponse('accepted')}>
              Accept & Send
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handleSubmitResponse('rejected')}
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              Decline & Send
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowResponse(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      <div className="text-xs text-gray-500 mt-4">
        <Clock className="h-3 w-3 inline mr-1" />
        Received {new Date(inquiry.created_at).toLocaleDateString()} at {new Date(inquiry.created_at).toLocaleTimeString()}
      </div>
    </div>
  );
}
