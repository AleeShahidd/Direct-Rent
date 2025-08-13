'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Property, User, Booking } from '@/types';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { PropertyCard } from '@/components/property/PropertyCard';
import { useAuth } from '@/contexts/AuthContext';
// Import the tab components
import { 
  OverviewTab,
  PropertiesTab,
  SavedPropertiesTab,
  InquiriesTab,
  AnalyticsTab 
} from './components';
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
  Clock,
  Heart,
  Search,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
  Building2,
  DollarSign,
  Activity,
  PieChart,
  Filter,
  SortAsc,
  Download,
  Settings
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';

interface DashboardStats {
  totalProperties: number;
  activeProperties: number;
  totalInquiries: number;
  pendingInquiries: number;
  acceptedInquiries: number;
  monthlyRevenue: number;
  totalViews: number;
  savedProperties: number;
}

export default function UnifiedDashboard() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><LoadingSpinner /></div>}>
      <DashboardContent />
    </Suspense>
  );
}

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get('tab') || 'overview';
  const { user: authUser, userProfile, loading: authLoading } = useAuth();
  
  const [properties, setProperties] = useState<Property[]>([]);
  const [savedProperties, setSavedProperties] = useState<Property[]>([]);
  const [inquiries, setInquiries] = useState<Booking[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalProperties: 0,
    activeProperties: 0,
    totalInquiries: 0,
    pendingInquiries: 0,
    acceptedInquiries: 0,
    monthlyRevenue: 0,
    totalViews: 0,
    savedProperties: 0
  });
  const [loading, setLoading] = useState(true);
  const [propertyFilter, setPropertyFilter] = useState('all');
  const [inquiryFilter, setInquiryFilter] = useState('all');

  useEffect(() => {
    if (authLoading) return;
    
    if (!authUser || !userProfile) {
      router.push('/auth/login');
      return;
    }

    // If user has 'authenticated' role or no role, redirect to role selection
    // Check if role is valid for this dashboard
    const role = userProfile.role;
    if (!['tenant', 'landlord'].includes(role)) {
      // For admin or unassigned roles, redirect appropriately
      router.push(role === 'admin' ? '/dashboard/admin' : '/auth/select-role');
      return;
    }

    // Proceed with fetching dashboard data
    fetchDashboardData(userProfile);
  }, [authUser, userProfile, authLoading, router]);

  const fetchDashboardData = async (user: User | null) => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // Validate user role
      if (!['tenant', 'landlord'].includes(user.role)) {
        console.error('Invalid user role for dashboard:', user.role);
        setLoading(false);
        return;
      }

      // Fetch data based on role
      if (user.role === 'landlord') {
        await fetchLandlordData(user.id);
      } else {
        await fetchTenantData(user.id);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Set empty states on error
      setProperties([]);
      setSavedProperties([]);
      setInquiries([]);
      setStats({
        totalProperties: 0,
        activeProperties: 0,
        totalInquiries: 0,
        pendingInquiries: 0,
        acceptedInquiries: 0,
        monthlyRevenue: 0,
        totalViews: 0,
        savedProperties: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchLandlordData = async (landlordId: string) => {
    // Fetch properties
    const { data: propertiesData } = await supabase
      .from('properties')
      .select(`
        *,
        _count:bookings(count)
      `)
      .eq('landlord_id', landlordId);

    // Fetch inquiries/bookings
    const { data: inquiriesData } = await supabase
      .from('bookings')
      .select(`
        *,
        property:properties(title, address, city, price),
        user:users(first_name, last_name, email, phone)
      `)
      .in('property_id', propertiesData?.map(p => p.id) || [])
      .order('created_at', { ascending: false });

    // Calculate stats
    const totalProperties = propertiesData?.length || 0;
    const activeProperties = propertiesData?.filter(p => p.is_active)?.length || 0;
    const totalInquiries = inquiriesData?.length || 0;
    const pendingInquiries = inquiriesData?.filter(i => i.status === 'pending')?.length || 0;
    const acceptedInquiries = inquiriesData?.filter(i => i.status === 'accepted')?.length || 0;
    const monthlyRevenue = propertiesData?.reduce((sum, p) => sum + (p.price || p.price_per_month || 0), 0) || 0;

    setProperties(propertiesData || []);
    setInquiries(inquiriesData || []);
    setStats({
      totalProperties,
      activeProperties,
      totalInquiries,
      pendingInquiries,
      acceptedInquiries,
      monthlyRevenue,
      totalViews: 0,
      savedProperties: 0
    });
  };

  const fetchTenantData = async (userId: string) => {
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

    const savedProps = (savedPropertiesData?.map(sp => sp.property) || []) as unknown as Property[];
    const totalInquiries = inquiriesData?.length || 0;
    const pendingInquiries = inquiriesData?.filter(i => i.status === 'pending')?.length || 0;
    const acceptedInquiries = inquiriesData?.filter(i => i.status === 'accepted')?.length || 0;

    setSavedProperties(savedProps);
    setInquiries(inquiriesData || []);
    setStats({
      totalProperties: 0,
      activeProperties: 0,
      totalInquiries,
      pendingInquiries,
      acceptedInquiries,
      monthlyRevenue: 0,
      totalViews: 0,
      savedProperties: savedProps.length
    });
  };

  const handleDeleteProperty = async (propertyId: string) => {
    if (!confirm('Are you sure you want to delete this property?')) return;

    try {
      await supabase
        .from('properties')
        .delete()
        .eq('id', propertyId);

      setProperties(prev => prev.filter(p => p.id !== propertyId));
      // Update stats
      setStats(prev => ({
        ...prev,
        totalProperties: prev.totalProperties - 1
      }));
    } catch (error) {
      console.error('Error deleting property:', error);
      alert('Failed to delete property');
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

      setInquiries(prev => 
        prev.map(inq => 
          inq.id === inquiryId 
            ? { ...inq, status, landlord_response: response }
            : inq
        )
      );

      // Update stats
      if (status === 'accepted') {
        setStats(prev => ({
          ...prev,
          pendingInquiries: prev.pendingInquiries - 1,
          acceptedInquiries: prev.acceptedInquiries + 1
        }));
      } else {
        setStats(prev => ({
          ...prev,
          pendingInquiries: prev.pendingInquiries - 1
        }));
      }
    } catch (error) {
      console.error('Error updating inquiry:', error);
    }
  };

  const removeSavedProperty = async (propertyId: string) => {
    if (!userProfile) return;

    try {
      await supabase
        .from('saved_properties')
        .delete()
        .eq('user_id', userProfile.id)
        .eq('property_id', propertyId);

      setSavedProperties(prev => prev.filter(p => p.id !== propertyId));
      setStats(prev => ({
        ...prev,
        savedProperties: prev.savedProperties - 1
      }));
    } catch (error) {
      console.error('Error removing saved property:', error);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const filteredProperties = properties.filter(property => {
    if (propertyFilter === 'all') return true;
    if (propertyFilter === 'active') return property.is_active;
    if (propertyFilter === 'inactive') return !property.is_active;
    return true;
  });

  const filteredInquiries = inquiries.filter(inquiry => {
    if (inquiryFilter === 'all') return true;
    return inquiry.status === inquiryFilter;
  });

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  // Early return for invalid states
  if (!userProfile || !['tenant', 'landlord'].includes(userProfile.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">Please select a valid user role to access the dashboard.</p>
          <button
            onClick={() => router.push('/auth/select-role')}
            className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Select Role
          </button>
        </div>
      </div>
    );
  }

  const isLandlord = userProfile.role === 'landlord';
  const isTenant = userProfile.role === 'tenant';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {isLandlord ? 'Landlord Dashboard' : 'Tenant Dashboard'}
            </h1>
            <p className="text-gray-600 mt-1">
              Welcome back, {userProfile?.first_name || userProfile?.name}
            </p>
          </div>
          <div className="flex items-center space-x-3 mt-4 md:mt-0">
            {isLandlord && (
              <Button onClick={() => router.push('/properties/new')}>
                <Plus className="h-4 w-4 mr-2" />
                Add Property
              </Button>
            )}
            {isTenant && (
              <Button onClick={() => router.push('/search')}>
                <Search className="h-4 w-4 mr-2" />
                Search Properties
              </Button>
            )}
            <Button variant="outline" onClick={() => router.push('/dashboard/settings')}>
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {isLandlord ? (
            <>
              <StatCard
                title="Total Properties"
                value={stats.totalProperties}
                icon={Building2}
                color="blue"
              />
              <StatCard
                title="Monthly Revenue"
                value={formatPrice(stats.monthlyRevenue)}
                icon={DollarSign}
                color="green"
              />
              <StatCard
                title="Pending Inquiries"
                value={stats.pendingInquiries}
                icon={MessageSquare}
                color="yellow"
              />
              <StatCard
                title="Total Inquiries"
                value={stats.totalInquiries}
                icon={Activity}
                color="purple"
              />
            </>
          ) : (
            <>
              <StatCard
                title="Saved Properties"
                value={stats.savedProperties}
                icon={Heart}
                color="red"
              />
              <StatCard
                title="Total Inquiries"
                value={stats.totalInquiries}
                icon={MessageSquare}
                color="blue"
              />
              <StatCard
                title="Pending Inquiries"
                value={stats.pendingInquiries}
                icon={Clock}
                color="yellow"
              />
              <StatCard
                title="Accepted Inquiries"
                value={stats.acceptedInquiries}
                icon={CheckCircle}
                color="green"
              />
            </>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8 overflow-x-auto">
            <TabButton
              label="Overview"
              value="overview"
              active={activeTab === 'overview'}
              onClick={() => router.push('/dashboard/unified?tab=overview')}
            />
            {isLandlord && (
              <>
                <TabButton
                  label={`Properties (${stats.totalProperties})`}
                  value="properties"
                  active={activeTab === 'properties'}
                  onClick={() => router.push('/dashboard/unified?tab=properties')}
                />
                <TabButton
                  label={`Inquiries (${stats.pendingInquiries})`}
                  value="inquiries"
                  active={activeTab === 'inquiries'}
                  onClick={() => router.push('/dashboard/unified?tab=inquiries')}
                />
              </>
            )}
            {isTenant && (
              <>
                <TabButton
                  label={`Saved (${stats.savedProperties})`}
                  value="saved"
                  active={activeTab === 'saved'}
                  onClick={() => router.push('/dashboard/unified?tab=saved')}
                />
                <TabButton
                  label={`My Inquiries (${stats.totalInquiries})`}
                  value="inquiries"
                  active={activeTab === 'inquiries'}
                  onClick={() => router.push('/dashboard/unified?tab=inquiries')}
                />
              </>
            )}
            <TabButton
              label="Analytics"
              value="analytics"
              active={activeTab === 'analytics'}
              onClick={() => router.push('/dashboard/unified?tab=analytics')}
            />
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <OverviewTab
            user={userProfile}
            stats={stats}
            properties={properties.slice(0, 6)}
            savedProperties={savedProperties.slice(0, 6)}
            inquiries={inquiries.slice(0, 5)}
            onViewProperty={(id) => router.push(`/properties/${id}`)}
            onEditProperty={(id) => router.push(`/properties/${id}/edit`)}
            formatPrice={formatPrice}
          />
        )}

        {activeTab === 'properties' && isLandlord && (
          <PropertiesTab
            properties={filteredProperties}
            filter={propertyFilter}
            onFilterChange={setPropertyFilter}
            onEditProperty={(id) => router.push(`/properties/${id}/edit`)}
            onDeleteProperty={handleDeleteProperty}
            onViewProperty={(id) => router.push(`/properties/${id}`)}
            formatPrice={formatPrice}
          />
        )}

        {activeTab === 'saved' && isTenant && (
          <SavedPropertiesTab
            savedProperties={savedProperties}
            onRemoveSaved={removeSavedProperty}
            onViewProperty={(id) => router.push(`/properties/${id}`)}
          />
        )}

        {activeTab === 'inquiries' && (
          <InquiriesTab
            inquiries={filteredInquiries}
            filter={inquiryFilter}
            onFilterChange={setInquiryFilter}
            onInquiryResponse={isLandlord ? handleInquiryResponse : undefined}
            onViewProperty={(id) => router.push(`/properties/${id}`)}
            isLandlord={isLandlord}
            formatPrice={formatPrice}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsTab
            user={userProfile}
            stats={stats}
            properties={properties}
            inquiries={inquiries}
          />
        )}
      </div>
    </div>
  );
}

// Component definitions for each tab and stat card
function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  color 
}: { 
  title: string; 
  value: string | number; 
  icon: any; 
  color: string 
}) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    purple: 'bg-purple-100 text-purple-600',
    red: 'bg-red-100 text-red-600'
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <div className="flex items-center">
        <div className={`p-2 rounded-lg ${colorClasses[color as keyof typeof colorClasses]}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
}

function TabButton({ 
  label, 
  value, 
  active, 
  onClick 
}: { 
  label: string; 
  value: string; 
  active: boolean; 
  onClick: () => void 
}) {
  return (
    <button
      onClick={onClick}
      className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
        active
          ? 'border-blue-500 text-blue-600'
          : 'border-transparent text-gray-500 hover:text-gray-700'
      }`}
    >
      {label}
    </button>
  );
}
