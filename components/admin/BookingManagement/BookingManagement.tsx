'use client';

import React, { useState, useEffect } from 'react';
import { 
  Loader2, 
  RefreshCw, 
  Search, 
  Filter, 
  Eye, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Calendar,
  Home,
  Users,
  Clock
} from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { useToasts } from '@/components/ui/ToastProvider';
import BookingDetailsModal from './BookingDetailsModal';

export interface Booking {
  id: string;
  property_id: string;
  tenant_id: string;
  landlord_id: string;
  start_date: string;
  end_date: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'completed';
  created_at: string;
  updated_at: string;
  notes: string | null;
  monthly_rent: number;
  deposit_amount: number;
  deposit_paid: boolean;
  move_in_date: string | null;
  move_out_date: string | null;
  property: {
    id: string;
    title: string;
    address: string;
    city: string;
    postcode: string;
    property_type: string;
    bedrooms: number;
    bathrooms: number;
    images?: string[];
  };
  tenant: {
    id: string;
    full_name: string;
    email: string;
    phone: string | null;
  };
  landlord: {
    id: string;
    full_name: string;
    email: string;
    phone: string | null;
  };
}

const BookingManagement: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [bookingsPerPage] = useState(10);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { showToast } = useToasts();

  // Fetch bookings
  const fetchBookings = async () => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          property:property_id (
           *
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setBookings(data || []);
      applyFilters(data || [], searchQuery, statusFilter);
    } catch (error) {
      console.log('Error fetching bookings:', error);
      showToast({
        title: 'Error',
        description: 'Failed to load bookings. Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchBookings();
  }, []);

  // Apply filters
  const applyFilters = (
    bookingsData: Booking[],
    search: string,
    status: string
  ) => {
    let filtered = bookingsData;

    // Apply status filter
    if (status !== 'all') {
      filtered = filtered.filter((booking) => booking.status === status);
    }

    // Apply search filter
    if (search.trim() !== '') {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        (booking) =>
          booking.property?.title?.toLowerCase().includes(searchLower) ||
          booking.property?.address?.toLowerCase().includes(searchLower) ||
          booking.tenant?.full_name?.toLowerCase().includes(searchLower) ||
          booking.landlord?.full_name?.toLowerCase().includes(searchLower) ||
          booking.property?.city?.toLowerCase().includes(searchLower)
      );
    }

    setFilteredBookings(filtered);
    setTotalPages(Math.ceil(filtered.length / bookingsPerPage));
    setCurrentPage(1); // Reset to first page when filters change
  };

  // Handle search and filter changes
  useEffect(() => {
    applyFilters(bookings, searchQuery, statusFilter);
  }, [searchQuery, statusFilter, bookings]);

  // Refresh bookings
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchBookings();
    setIsRefreshing(false);
    showToast({
      title: 'Refreshed',
      description: 'Booking list has been updated with the latest data.',
    });
  };

  // Open details modal
  const handleViewDetails = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowDetailsModal(true);
  };

  // Update booking status
  const handleStatusChange = async (bookingId: string, newStatus: Booking['status']) => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('bookings')
        .update({ status: newStatus })
        .eq('id', bookingId);

      if (error) {
        throw error;
      }

      // Update local state
      setBookings((prevBookings) =>
        prevBookings.map((booking) =>
          booking.id === bookingId ? { ...booking, status: newStatus } : booking
        )
      );

      showToast({
        title: 'Success',
        description: `Booking status changed to ${newStatus} successfully.`,
      });
    } catch (error) {
      console.log('Error changing booking status:', error);
      showToast({
        title: 'Error',
        description: 'Failed to change booking status. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Get current bookings for pagination
  const indexOfLastBooking = currentPage * bookingsPerPage;
  const indexOfFirstBooking = indexOfLastBooking - bookingsPerPage;
  const currentBookings = filteredBookings.slice(indexOfFirstBooking, indexOfLastBooking);

  // Status badge component
  const StatusBadge = ({ status }: { status: Booking['status'] }) => {
    let bgColor = '';
    let textColor = '';
    let icon = null;

    switch (status) {
      case 'approved':
        bgColor = 'bg-green-100';
        textColor = 'text-green-800';
        icon = <CheckCircle className="w-3 h-3 mr-1" />;
        break;
      case 'rejected':
        bgColor = 'bg-red-100';
        textColor = 'text-red-800';
        icon = <XCircle className="w-3 h-3 mr-1" />;
        break;
      case 'cancelled':
        bgColor = 'bg-gray-100';
        textColor = 'text-gray-800';
        icon = <XCircle className="w-3 h-3 mr-1" />;
        break;
      case 'pending':
        bgColor = 'bg-yellow-100';
        textColor = 'text-yellow-800';
        icon = <AlertTriangle className="w-3 h-3 mr-1" />;
        break;
      case 'completed':
        bgColor = 'bg-blue-100';
        textColor = 'text-blue-800';
        icon = <CheckCircle className="w-3 h-3 mr-1" />;
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
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  // Render loading state
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8 h-full flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto" />
          <p className="mt-2 text-gray-500">Loading bookings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Booking Management</h2>
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
            Refresh
          </button>
        </div>
      </div>

      {/* Filters and search */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="Search by property, tenant, or landlord..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="w-40">
          <label htmlFor="status-filter" className="sr-only">
            Filter by status
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Filter className="h-4 w-4 text-gray-400" />
            </div>
            <select
              id="status-filter"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="cancelled">Cancelled</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bookings table */}
      <div className="overflow-x-auto">
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
                Tenant
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Landlord
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Dates
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
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentBookings.length > 0 ? (
              currentBookings.map((booking) => (
                <tr key={booking.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded flex items-center justify-center">
                        {booking.property?.images && booking.property.images.length > 0 ? (
                          <img
                            src={booking.property.images[0]}
                            alt={booking.property.title}
                            className="h-10 w-10 object-cover rounded"
                          />
                        ) : (
                          <Home className="h-6 w-6 text-gray-500" />
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {booking.property?.title || 'Unknown Property'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {booking.property?.city}, {booking.property?.postcode}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Users className="h-4 w-4 text-gray-400 mr-2" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {booking.tenant?.full_name || 'Unknown'}
                        </div>
                        <div className="text-sm text-gray-500">{booking.tenant?.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Users className="h-4 w-4 text-gray-400 mr-2" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {booking.landlord?.full_name || 'Unknown'}
                        </div>
                        <div className="text-sm text-gray-500">{booking.landlord?.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                      <div>
                        <div className="text-sm text-gray-900">
                          From: {new Date(booking.start_date).toLocaleDateString()}
                        </div>
                        {booking.end_date && (
                          <div className="text-sm text-gray-500">
                            To: {new Date(booking.end_date).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={booking.status} />
                    <div className="text-xs text-gray-500 mt-1">
                      <Clock className="h-3 w-3 inline mr-1" />
                      {new Date(booking.created_at).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleViewDetails(booking)}
                        className="text-blue-600 hover:text-blue-900"
                        title="View Details"
                      >
                        <Eye className="h-5 w-5" />
                      </button>
                      
                      {booking.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleStatusChange(booking.id, 'approved')}
                            className="text-green-600 hover:text-green-900"
                            title="Approve Booking"
                          >
                            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                              Approve
                            </span>
                          </button>
                          <button
                            onClick={() => handleStatusChange(booking.id, 'rejected')}
                            className="text-red-600 hover:text-red-900"
                            title="Reject Booking"
                          >
                            <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded">
                              Reject
                            </span>
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                  No bookings found matching your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {filteredBookings.length > 0 && (
        <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3 sm:px-6 mt-4">
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing{' '}
                <span className="font-medium">{indexOfFirstBooking + 1}</span> to{' '}
                <span className="font-medium">
                  {Math.min(indexOfLastBooking, filteredBookings.length)}
                </span>{' '}
                of <span className="font-medium">{filteredBookings.length}</span> results
              </p>
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
                {[...Array(totalPages)].map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentPage(index + 1)}
                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                      currentPage === index + 1
                        ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                        : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    {index + 1}
                  </button>
                ))}
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

      {/* Booking Details Modal */}
      {showDetailsModal && selectedBooking && (
        <BookingDetailsModal
          booking={selectedBooking}
          onClose={() => setShowDetailsModal(false)}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  );
};

export default BookingManagement;
