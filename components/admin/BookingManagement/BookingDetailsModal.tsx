'use client';

import React, { useState } from 'react';
import { X, Home, MapPin, Calendar, User, CheckCircle, XCircle, AlertTriangle, DollarSign, Clock, FileText } from 'lucide-react';
import { Booking } from './BookingManagement';

interface BookingDetailsModalProps {
  booking: Booking;
  onClose: () => void;
  onStatusChange: (bookingId: string, newStatus: Booking['status']) => Promise<void>;
}

const BookingDetailsModal: React.FC<BookingDetailsModalProps> = ({
  booking,
  onClose,
  onStatusChange,
}) => {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleStatusChange = async (newStatus: Booking['status']) => {
    setIsUpdating(true);
    try {
      await onStatusChange(booking.id, newStatus);
    } catch (error) {
      console.log('Error updating booking status:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  // Format status with icon
  const StatusWithIcon = ({ status }: { status: Booking['status'] }) => {
    let icon = null;
    let textColor = '';
    
    switch (status) {
      case 'approved':
        icon = <CheckCircle className="h-5 w-5 text-green-600 mr-2" />;
        textColor = 'text-green-600';
        break;
      case 'rejected':
        icon = <XCircle className="h-5 w-5 text-red-600 mr-2" />;
        textColor = 'text-red-600';
        break;
      case 'pending':
        icon = <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />;
        textColor = 'text-yellow-600';
        break;
      case 'cancelled':
        icon = <XCircle className="h-5 w-5 text-gray-600 mr-2" />;
        textColor = 'text-gray-600';
        break;
      case 'completed':
        icon = <CheckCircle className="h-5 w-5 text-blue-600 mr-2" />;
        textColor = 'text-blue-600';
        break;
    }
    
    return (
      <div className={`flex items-center ${textColor} font-medium`}>
        {icon}
        <span className="capitalize">{status}</span>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
      <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-xl font-semibold text-gray-900">Booking Details</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 focus:outline-none"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          {/* Booking Status Banner */}
          <div className={`px-4 py-3 rounded-md mb-6 flex items-center justify-between
            ${booking.status === 'approved' ? 'bg-green-100' : 
              booking.status === 'rejected' ? 'bg-red-100' : 
              booking.status === 'pending' ? 'bg-yellow-100' : 
              booking.status === 'cancelled' ? 'bg-gray-100' : 'bg-blue-100'}`}>
            <div className="flex items-center">
              <StatusWithIcon status={booking.status} />
            </div>
            {booking.status === 'pending' && (
              <div className="flex space-x-2">
                <button
                  onClick={() => handleStatusChange('approved')}
                  disabled={isUpdating}
                  className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                >
                  {isUpdating ? 'Updating...' : 'Approve'}
                </button>
                <button
                  onClick={() => handleStatusChange('rejected')}
                  disabled={isUpdating}
                  className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                >
                  {isUpdating ? 'Updating...' : 'Reject'}
                </button>
              </div>
            )}
          </div>

          {/* Booking ID and Creation Date */}
          <div className="mb-6 text-sm text-gray-500">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-medium">Booking ID:</span> {booking.id}
              </div>
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                Created: {new Date(booking.created_at).toLocaleString()}
              </div>
            </div>
          </div>

          {/* Property Details */}
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <Home className="h-5 w-5 mr-2 text-gray-600" />
              Property Details
            </h4>
            
            <div className="flex items-start">
              <div className="flex-shrink-0 w-24 h-24 bg-gray-200 rounded overflow-hidden mr-4">
                {booking.property?.images && booking.property.images.length > 0 ? (
                  <img
                    src={booking.property.images[0]}
                    alt={booking.property.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Home className="h-10 w-10 text-gray-400" />
                  </div>
                )}
              </div>
              
              <div className="flex-grow">
                <h5 className="text-md font-medium text-gray-900">
                  {booking.property?.title || 'Unknown Property'}
                </h5>
                <div className="flex items-center text-sm text-gray-500 mt-1">
                  <MapPin className="h-4 w-4 mr-1 flex-shrink-0" />
                  <span>
                    {booking.property?.address}, {booking.property?.city}, {booking.property?.postcode}
                  </span>
                </div>
                <div className="mt-2 text-sm text-gray-600">
                  <span className="font-medium">Type:</span> {booking.property?.property_type || 'N/A'} • 
                  <span className="font-medium"> Bedrooms:</span> {booking.property?.bedrooms || 'N/A'} • 
                  <span className="font-medium"> Bathrooms:</span> {booking.property?.bathrooms || 'N/A'}
                </div>
              </div>
            </div>
          </div>

          {/* People Involved */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Tenant */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <User className="h-5 w-5 mr-2 text-gray-600" />
                Tenant
              </h4>
              
              <div className="space-y-2">
                <div className="text-sm">
                  <span className="font-medium text-gray-700">Name:</span>{' '}
                  {booking.tenant?.full_name || 'Unknown'}
                </div>
                <div className="text-sm">
                  <span className="font-medium text-gray-700">Email:</span>{' '}
                  {booking.tenant?.email || 'N/A'}
                </div>
                <div className="text-sm">
                  <span className="font-medium text-gray-700">Phone:</span>{' '}
                  {booking.tenant?.phone || 'N/A'}
                </div>
              </div>
            </div>
            
            {/* Landlord */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <User className="h-5 w-5 mr-2 text-gray-600" />
                Landlord
              </h4>
              
              <div className="space-y-2">
                <div className="text-sm">
                  <span className="font-medium text-gray-700">Name:</span>{' '}
                  {booking.landlord?.full_name || 'Unknown'}
                </div>
                <div className="text-sm">
                  <span className="font-medium text-gray-700">Email:</span>{' '}
                  {booking.landlord?.email || 'N/A'}
                </div>
                <div className="text-sm">
                  <span className="font-medium text-gray-700">Phone:</span>{' '}
                  {booking.landlord?.phone || 'N/A'}
                </div>
              </div>
            </div>
          </div>

          {/* Booking Details */}
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-gray-600" />
              Booking Details
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h5 className="text-sm font-medium text-gray-700 mb-2">Dates</h5>
                <div className="space-y-2">
                  <div className="text-sm">
                    <span className="font-medium">Start Date:</span>{' '}
                    {new Date(booking.start_date).toLocaleDateString()}
                  </div>
                  {booking.end_date && (
                    <div className="text-sm">
                      <span className="font-medium">End Date:</span>{' '}
                      {new Date(booking.end_date).toLocaleDateString()}
                    </div>
                  )}
                  {booking.move_in_date && (
                    <div className="text-sm">
                      <span className="font-medium">Move-in Date:</span>{' '}
                      {new Date(booking.move_in_date).toLocaleDateString()}
                    </div>
                  )}
                  {booking.move_out_date && (
                    <div className="text-sm">
                      <span className="font-medium">Move-out Date:</span>{' '}
                      {new Date(booking.move_out_date).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <h5 className="text-sm font-medium text-gray-700 mb-2">Financial</h5>
                <div className="space-y-2">
                  <div className="text-sm flex items-center">
                    <DollarSign className="h-4 w-4 mr-1 text-gray-500" />
                    <span className="font-medium">Monthly Rent:</span>{' '}
                    £{booking.monthly_rent.toLocaleString()}
                  </div>
                  <div className="text-sm flex items-center">
                    <DollarSign className="h-4 w-4 mr-1 text-gray-500" />
                    <span className="font-medium">Deposit Amount:</span>{' '}
                    £{booking.deposit_amount.toLocaleString()}
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Deposit Paid:</span>{' '}
                    <span className={booking.deposit_paid ? 'text-green-600' : 'text-red-600'}>
                      {booking.deposit_paid ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          {booking.notes && (
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <h4 className="text-lg font-medium text-gray-900 mb-2 flex items-center">
                <FileText className="h-5 w-5 mr-2 text-gray-600" />
                Notes
              </h4>
              <p className="text-gray-700 whitespace-pre-wrap">{booking.notes}</p>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Close
            </button>
            
            {booking.status === 'pending' && (
              <>
                <button
                  onClick={() => handleStatusChange('approved')}
                  disabled={isUpdating}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                >
                  {isUpdating ? 'Updating...' : 'Approve Booking'}
                </button>
                <button
                  onClick={() => handleStatusChange('rejected')}
                  disabled={isUpdating}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                >
                  {isUpdating ? 'Updating...' : 'Reject Booking'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingDetailsModal;
