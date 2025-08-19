'use client';

import React, { useState, useEffect } from 'react';
import { 
  Loader2, 
  RefreshCw, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Home,
  MapPin,
  Calendar,
  DollarSign,
  MoreHorizontal
} from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { useToasts } from '@/components/ui/ToastProvider';
import PropertyDetailsModal from './PropertyDetailsModal';

export interface Property {
  id: string;
  title: string;
  description: string;
  address: string;
  city: string;
  postcode: string;
  country: string;
  property_type: string;
  bedrooms: number;
  bathrooms: number;
  price: number;
  created_at: string;
  updated_at: string;
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'expired';
  user_id: string;
  owner: {
    id: string;
    full_name: string;
    email: string;
  };
  images?: string[];
  is_featured?: boolean;
  has_garden?: boolean;
  has_parking?: boolean;
  pets_allowed?: boolean;
  furnished?: boolean;
  amenities?: string[];
  is_verified?: boolean;
  available_from?: string;
  minimum_tenancy?: number;
  deposit_amount?: number;
  fraud_score?: number;
}

const PropertyManagement: React.FC = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [propertiesPerPage] = useState(10);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const { showToast } = useToasts();

  // Fetch properties
  const fetchProperties = async () => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('properties')
        .select(`
          *
        `)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setProperties(data || []);
      applyFilters(data || [], searchQuery, statusFilter, typeFilter);
    } catch (error) {
      console.log('Error fetching properties:', error);
      showToast({
        title: 'Error',
        description: 'Failed to load properties. Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchProperties();
  }, []);

  // Apply filters
  const applyFilters = (
    propertiesData: Property[],
    search: string,
    status: string,
    type: string
  ) => {
    let filtered = propertiesData;

    // Apply status filter
    if (status !== 'all') {
      filtered = filtered.filter((property) => property.status === status);
    }

    // Apply property type filter
    if (type !== 'all') {
      filtered = filtered.filter((property) => property.property_type === type);
    }

    // Apply search filter
    if (search.trim() !== '') {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        (property) =>
          property.title?.toLowerCase().includes(searchLower) ||
          property.address?.toLowerCase().includes(searchLower) ||
          property.city?.toLowerCase().includes(searchLower) ||
          property.postcode?.toLowerCase().includes(searchLower) ||
          property.owner?.full_name?.toLowerCase().includes(searchLower)
      );
    }

    setFilteredProperties(filtered);
    setTotalPages(Math.ceil(filtered.length / propertiesPerPage));
    setCurrentPage(1); // Reset to first page when filters change
  };

  // Handle search and filter changes
  useEffect(() => {
    applyFilters(properties, searchQuery, statusFilter, typeFilter);
  }, [searchQuery, statusFilter, typeFilter, properties]);

  // Refresh properties
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchProperties();
    setIsRefreshing(false);
    showToast({
      title: 'Refreshed',
      description: 'Property list has been updated with the latest data.',
    });
  };

  // Open details modal
  const handleViewDetails = (property: Property) => {
    setSelectedProperty(property);
    setShowDetailsModal(true);
  };

  // Update property status
  const handleStatusChange = async (propertyId: string, newStatus: Property['status']) => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('properties')
        .update({ status: newStatus })
        .eq('id', propertyId);

      if (error) {
        throw error;
      }

      // Update local state
      setProperties((prevProperties) =>
        prevProperties.map((property) =>
          property.id === propertyId ? { ...property, status: newStatus } : property
        )
      );

      showToast({
        title: 'Success',
        description: `Property status changed to ${newStatus} successfully.`,
      });
    } catch (error) {
      console.log('Error changing property status:', error);
      showToast({
        title: 'Error',
        description: 'Failed to change property status. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Delete property
  const handleDeleteProperty = async (propertyId: string) => {
    // Confirm deletion
    if (!window.confirm('Are you sure you want to delete this property? This action cannot be undone.')) {
      return;
    }

    try {
      const supabase = createClient();
      const { error } = await supabase.from('properties').delete().eq('id', propertyId);

      if (error) {
        throw error;
      }

      // Update local state
      setProperties((prevProperties) => 
        prevProperties.filter((property) => property.id !== propertyId)
      );
      
      showToast({
        title: 'Success',
        description: 'Property has been deleted successfully.',
      });
    } catch (error) {
      console.log('Error deleting property:', error);
      showToast({
        title: 'Error',
        description: 'Failed to delete property. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Feature/Unfeature property
  const handleToggleFeature = async (propertyId: string, currentFeatured: boolean) => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('properties')
        .update({ is_featured: !currentFeatured })
        .eq('id', propertyId);

      if (error) {
        throw error;
      }

      // Update local state
      setProperties((prevProperties) =>
        prevProperties.map((property) =>
          property.id === propertyId ? { ...property, is_featured: !currentFeatured } : property
        )
      );

      showToast({
        title: 'Success',
        description: `Property ${currentFeatured ? 'removed from' : 'added to'} featured listings.`,
      });
    } catch (error) {
      console.log('Error updating featured status:', error);
      showToast({
        title: 'Error',
        description: 'Failed to update featured status. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Get current properties for pagination
  const indexOfLastProperty = currentPage * propertiesPerPage;
  const indexOfFirstProperty = indexOfLastProperty - propertiesPerPage;
  const currentProperties = filteredProperties.slice(indexOfFirstProperty, indexOfLastProperty);

  // Status badge component
  const StatusBadge = ({ status }: { status: Property['status'] }) => {
    let bgColor = '';
    let textColor = '';
    let icon = null;

    switch (status) {
      case 'approved':
        bgColor = 'bg-green-100';
        textColor = 'text-green-800';
        icon = <CheckCircle2 className="w-3 h-3 mr-1" />;
        break;
      case 'rejected':
        bgColor = 'bg-red-100';
        textColor = 'text-red-800';
        icon = <XCircle className="w-3 h-3 mr-1" />;
        break;
      case 'pending':
        bgColor = 'bg-yellow-100';
        textColor = 'text-yellow-800';
        icon = <AlertTriangle className="w-3 h-3 mr-1" />;
        break;
      case 'draft':
        bgColor = 'bg-gray-100';
        textColor = 'text-gray-800';
        icon = <Edit className="w-3 h-3 mr-1" />;
        break;
      case 'expired':
        bgColor = 'bg-gray-100';
        textColor = 'text-gray-800';
        icon = <Calendar className="w-3 h-3 mr-1" />;
        break;
      default:
        bgColor = 'bg-gray-100';
        textColor = 'text-gray-800';
    }

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bgColor} ${textColor}`}
      >
        {icon}
        <span className="hidden sm:inline">{status.charAt(0).toUpperCase() + status.slice(1)}</span>
        <span className="sm:hidden">{status.charAt(0).toUpperCase()}</span>
      </span>
    );
  };

  // Mobile property card component
  const MobilePropertyCard = ({ property }: { property: Property }) => (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4 shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center flex-1">
          <div className="flex-shrink-0 h-12 w-12 bg-gray-200 rounded flex items-center justify-center mr-3">
            {property.images && property.images.length > 0 ? (
              <img
                src={property.images[0]}
                alt={property.title}
                className="h-12 w-12 object-cover rounded"
              />
            ) : (
              <Home className="h-6 w-6 text-gray-500" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-gray-900 truncate">{property.title}</h3>
            <p className="text-xs text-gray-500">
              {property.property_type} • {property.bedrooms} bed • {property.bathrooms} bath
            </p>
          </div>
        </div>
        <StatusBadge status={property.status} />
      </div>
      
      <div className="space-y-2 mb-3">
        <div className="flex items-center text-sm text-gray-600">
          <MapPin className="h-4 w-4 mr-2 text-gray-400" />
          <span className="truncate">{property.city}, {property.postcode}</span>
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <DollarSign className="h-4 w-4 mr-2 text-gray-400" />
          <span>£{property.price?.toLocaleString() || ((property as any).rent_amount?.toLocaleString())}{(property as any).price_frequency ? `/${(property as any).price_frequency}` : '/month'}</span>
        </div>
        <div className="text-sm text-gray-600">
          <span className="font-medium">Owner:</span> {property.owner?.full_name || 'Unknown'}
        </div>
      </div>

      {property.is_featured && (
        <div className="mb-3">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            Featured
          </span>
        </div>
      )}

      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <div className="text-xs text-gray-500">
          Listed: {new Date(property.created_at).toLocaleDateString()}
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => handleViewDetails(property)}
            className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded"
            title="View Details"
          >
            <Eye className="h-4 w-4" />
          </button>
          
          {property.status === 'pending' && (
            <>
              <button
                onClick={() => handleStatusChange(property.id, 'approved')}
                className="p-2 text-green-600 hover:text-green-900 hover:bg-green-50 rounded"
                title="Approve Property"
              >
                <CheckCircle2 className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleStatusChange(property.id, 'rejected')}
                className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded"
                title="Reject Property"
              >
                <XCircle className="h-4 w-4" />
              </button>
            </>
          )}
          
          <button
            onClick={() => handleToggleFeature(property.id, !!property.is_featured)}
            className={`p-2 rounded ${
              property.is_featured 
                ? 'text-yellow-600 hover:text-yellow-900 hover:bg-yellow-50' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
            title={property.is_featured ? 'Remove from Featured' : 'Add to Featured'}
          >
            <span className={`text-xs px-2 py-1 rounded ${
              property.is_featured ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
            }`}>
              {property.is_featured ? 'Unfeature' : 'Feature'}
            </span>
          </button>
          
          <button
            onClick={() => handleDeleteProperty(property.id)}
            className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded"
            title="Delete Property"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  // Render loading state
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-4 sm:p-8 h-full flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto" />
          <p className="mt-2 text-gray-500">Loading properties...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Property Management</h2>
        <div className="flex space-x-2">
          <button
            onClick={handleRefresh}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Mobile filter toggle */}
      <div className="sm:hidden mb-4">
        <button
          onClick={() => setShowMobileFilters(!showMobileFilters)}
          className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <Filter className="h-4 w-4 mr-2" />
          {showMobileFilters ? 'Hide Filters' : 'Show Filters'}
        </button>
      </div>

      {/* Filters and search */}
      <div className={`${showMobileFilters ? 'block' : 'hidden'} sm:block mb-6`}>
        <div className="flex flex-col gap-4">
          {/* Search */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
              placeholder="Search by title, address, city or landlord name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          {/* Filters row */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="w-full sm:w-40">
              <label htmlFor="status-filter" className="sr-only">
                Filter by status
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Filter className="h-4 w-4 text-gray-400" />
                </div>
                <select
                  id="status-filter"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="draft">Draft</option>
                  <option value="expired">Expired</option>
                </select>
              </div>
            </div>
            <div className="w-full sm:w-40">
              <label htmlFor="type-filter" className="sr-only">
                Filter by property type
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Home className="h-4 w-4 text-gray-400" />
                </div>
                <select
                  id="type-filter"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                >
                  <option value="all">All Types</option>
                  <option value="house">House</option>
                  <option value="flat">Flat</option>
                  <option value="apartment">Apartment</option>
                  <option value="studio">Studio</option>
                  <option value="bungalow">Bungalow</option>
                  <option value="detached">Detached</option>
                  <option value="semi-detached">Semi-Detached</option>
                  <option value="terraced">Terraced</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Properties display */}
      {currentProperties.length > 0 ? (
        <>
          {/* Desktop table view */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Property
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Location
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Price
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Owner
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Status
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Listed
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentProperties.map((property) => (
                  <tr key={property.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded flex items-center justify-center">
                          {property.images && property.images.length > 0 ? (
                            <img
                              src={property.images[0]}
                              alt={property.title}
                              className="h-10 w-10 object-cover rounded"
                            />
                          ) : (
                            <Home className="h-6 w-6 text-gray-500" />
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {property.title}
                          </div>
                          <div className="text-sm text-gray-500">
                            {property.property_type} • {property.bedrooms} bed • {property.bathrooms} bath
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 text-gray-400 mr-1" />
                        <div className="text-sm text-gray-900">
                          {property.city}, {property.postcode}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <DollarSign className="h-4 w-4 text-gray-400 mr-1" />
                        <div className="text-sm text-gray-900">
                          £{property.price?.toLocaleString() || ((property as any).rent_amount?.toLocaleString())}{(property as any).price_frequency ? `/${(property as any).price_frequency}` : '/month'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{property.owner?.full_name || 'Unknown'}</div>
                      <div className="text-sm text-gray-500">{property.owner?.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={property.status} />
                      {property.is_featured && (
                        <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Featured
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(property.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleViewDetails(property)}
                          className="text-blue-600 hover:text-blue-900"
                          title="View Details"
                        >
                          <Eye className="h-5 w-5" />
                        </button>
                        
                        {property.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleStatusChange(property.id, 'approved')}
                              className="text-green-600 hover:text-green-900"
                              title="Approve Property"
                            >
                              <CheckCircle2 className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleStatusChange(property.id, 'rejected')}
                              className="text-red-600 hover:text-red-900"
                              title="Reject Property"
                            >
                              <XCircle className="h-5 w-5" />
                            </button>
                          </>
                        )}
                        
                        <button
                          onClick={() => handleToggleFeature(property.id, !!property.is_featured)}
                          className={`${
                            property.is_featured ? 'text-yellow-600 hover:text-yellow-900' : 'text-gray-600 hover:text-gray-900'
                          }`}
                          title={property.is_featured ? 'Remove from Featured' : 'Add to Featured'}
                        >
                          <span className={`${
                            property.is_featured ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                          } text-xs px-2 py-1 rounded`}>
                            {property.is_featured ? 'Unfeature' : 'Feature'}
                          </span>
                        </button>
                        
                        <button
                          onClick={() => handleDeleteProperty(property.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete Property"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Tablet view - simplified table */}
          <div className="hidden md:block lg:hidden overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Property
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location & Price
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentProperties.map((property) => (
                  <tr key={property.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-12 w-12 bg-gray-200 rounded flex items-center justify-center">
                          {property.images && property.images.length > 0 ? (
                            <img
                              src={property.images[0]}
                              alt={property.title}
                              className="h-12 w-12 object-cover rounded"
                            />
                          ) : (
                            <Home className="h-6 w-6 text-gray-500" />
                          )}
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900 truncate max-w-[200px]">
                            {property.title}
                          </div>
                          <div className="text-sm text-gray-500">
                            {property.property_type} • {property.bedrooms} bed • {property.bathrooms} bath
                          </div>
                          <div className="text-sm text-gray-500">
                            {property.owner?.full_name || 'Unknown'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center text-sm text-gray-900">
                          <MapPin className="h-4 w-4 text-gray-400 mr-1" />
                          <span className="truncate max-w-[150px]">{property.city}, {property.postcode}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-900">
                          <DollarSign className="h-4 w-4 text-gray-400 mr-1" />
                          <span>£{property.price?.toLocaleString() || ((property as any).rent_amount?.toLocaleString())}{(property as any).price_frequency ? `/${(property as any).price_frequency}` : '/month'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="space-y-2">
                        <StatusBadge status={property.status} />
                        {property.is_featured && (
                          <span className="block inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Featured
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col space-y-2">
                        <button
                          onClick={() => handleViewDetails(property)}
                          className="text-blue-600 hover:text-blue-900 text-sm"
                        >
                          View Details
                        </button>
                        
                        {property.status === 'pending' && (
                          <div className="space-y-1">
                            <button
                              onClick={() => handleStatusChange(property.id, 'approved')}
                              className="block w-full text-green-600 hover:text-green-900 text-sm"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleStatusChange(property.id, 'rejected')}
                              className="block w-full text-red-600 hover:text-red-900 text-sm"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                        
                        <button
                          onClick={() => handleToggleFeature(property.id, !!property.is_featured)}
                          className={`text-sm ${
                            property.is_featured ? 'text-yellow-600 hover:text-yellow-900' : 'text-gray-600 hover:text-gray-900'
                          }`}
                        >
                          {property.is_featured ? 'Unfeature' : 'Feature'}
                        </button>
                        
                        <button
                          onClick={() => handleDeleteProperty(property.id)}
                          className="text-red-600 hover:text-red-900 text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile card view */}
          <div className="md:hidden space-y-4">
            {currentProperties.map((property) => (
              <MobilePropertyCard key={property.id} property={property} />
            ))}
          </div>
        </>
      ) : (
        <div className="text-center py-12">
          <Home className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No properties found</h3>
          <p className="mt-1 text-sm text-gray-500">
            No properties match your current filters.
          </p>
        </div>
      )}

      {/* Pagination */}
      {filteredProperties.length > 0 && (
        <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3 sm:px-6 mt-6">
          <div className="flex-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="text-sm text-gray-700">
              <span className="hidden sm:inline">Showing </span>
              <span className="font-medium">{indexOfFirstProperty + 1}</span>
              <span className="hidden sm:inline"> to </span>
              <span className="font-medium">
                {Math.min(indexOfLastProperty, filteredProperties.length)}
              </span>
              <span className="hidden sm:inline"> of </span>
              <span className="font-medium">{filteredProperties.length}</span>
              <span className="hidden sm:inline"> results</span>
              <span className="sm:hidden"> of {filteredProperties.length}</span>
            </div>
            <div>
              <nav
                className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                aria-label="Pagination"
              >
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                    currentPage === 1
                      ? 'text-gray-300 cursor-not-allowed'
                      : 'text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <span className="sr-only">Previous</span>
                  <svg
                    className="h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
                
                {/* Show limited page numbers on mobile */}
                {totalPages <= 5 ? (
                  [...Array(totalPages)].map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentPage(index + 1)}
                      className={`relative inline-flex items-center px-3 sm:px-4 py-2 border text-sm font-medium ${
                        currentPage === index + 1
                          ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {index + 1}
                    </button>
                  ))
                ) : (
                  // Show ellipsis for many pages
                  <>
                    {currentPage <= 3 && (
                      <>
                        {[1, 2, 3, 4].map((page) => (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`relative inline-flex items-center px-3 sm:px-4 py-2 border text-sm font-medium ${
                              currentPage === page
                                ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            {page}
                          </button>
                        ))}
                        <span className="relative inline-flex items-center px-3 sm:px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                          ...
                        </span>
                        <button
                          onClick={() => setCurrentPage(totalPages)}
                          className="relative inline-flex items-center px-3 sm:px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                        >
                          {totalPages}
                        </button>
                      </>
                    )}
                    
                    {currentPage > 3 && currentPage < totalPages - 2 && (
                      <>
                        <button
                          onClick={() => setCurrentPage(1)}
                          className="relative inline-flex items-center px-3 sm:px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                        >
                          1
                        </button>
                        <span className="relative inline-flex items-center px-3 sm:px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                          ...
                        </span>
                        {[currentPage - 1, currentPage, currentPage + 1].map((page) => (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`relative inline-flex items-center px-3 sm:px-4 py-2 border text-sm font-medium ${
                              currentPage === page
                                ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            {page}
                          </button>
                        ))}
                        <span className="relative inline-flex items-center px-3 sm:px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                          ...
                        </span>
                        <button
                          onClick={() => setCurrentPage(totalPages)}
                          className="relative inline-flex items-center px-3 sm:px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                        >
                          {totalPages}
                        </button>
                      </>
                    )}
                    
                    {currentPage >= totalPages - 2 && (
                      <>
                        <button
                          onClick={() => setCurrentPage(1)}
                          className="relative inline-flex items-center px-3 sm:px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                        >
                          1
                        </button>
                        <span className="relative inline-flex items-center px-3 sm:px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                          ...
                        </span>
                        {[totalPages - 3, totalPages - 2, totalPages - 1, totalPages].map((page) => (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`relative inline-flex items-center px-3 sm:px-4 py-2 border text-sm font-medium ${
                              currentPage === page
                                ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            {page}
                          </button>
                        ))}
                      </>
                    )}
                  </>
                )}
                
                <button
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                    currentPage === totalPages
                      ? 'text-gray-300 cursor-not-allowed'
                      : 'text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <span className="sr-only">Next</span>
                  <svg
                    className="h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Property Details Modal */}
      {showDetailsModal && selectedProperty && (
        <PropertyDetailsModal
          property={selectedProperty}
          onClose={() => setShowDetailsModal(false)}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  );
};

export default PropertyManagement;
