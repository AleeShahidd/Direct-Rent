import { Booking } from '@/types';
import { Button } from '@/components/ui/button';
import { 
  MessageSquare,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Calendar,
  User,
  Phone,
  Mail,
  MapPin,
  Eye,
  Filter
} from 'lucide-react';
import { useState } from 'react';

interface InquiriesTabProps {
  inquiries: Booking[];
  filter: string;
  onFilterChange: (filter: string) => void;
  onInquiryResponse?: (id: string, status: 'accepted' | 'rejected', response: string) => void;
  onViewProperty: (id: string) => void;
  isLandlord: boolean;
  formatPrice: (price: number) => string;
}

export default function InquiriesTab({
  inquiries,
  filter,
  onFilterChange,
  onInquiryResponse,
  onViewProperty,
  isLandlord,
  formatPrice
}: InquiriesTabProps) {
  const [responseModal, setResponseModal] = useState<{
    inquiryId: string;
    isOpen: boolean;
    response: string;
  }>({
    inquiryId: '',
    isOpen: false,
    response: ''
  });

  const filterOptions = [
    { value: 'all', label: 'All Inquiries' },
    { value: 'pending', label: 'Pending' },
    { value: 'accepted', label: 'Accepted' },
    { value: 'rejected', label: 'Rejected' },
    ...(isLandlord ? [] : [{ value: 'withdrawn', label: 'Withdrawn' }])
  ];

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

  const handleQuickResponse = (inquiryId: string, status: 'accepted' | 'rejected') => {
    const defaultResponses = {
      accepted: 'Thank you for your inquiry. I would be happy to arrange a viewing. Please let me know your preferred times.',
      rejected: 'Thank you for your interest. Unfortunately, this property is no longer available.'
    };
    
    if (onInquiryResponse) {
      onInquiryResponse(inquiryId, status, defaultResponses[status]);
    }
  };

  const handleCustomResponse = (status: 'accepted' | 'rejected') => {
    if (onInquiryResponse && responseModal.response.trim()) {
      onInquiryResponse(responseModal.inquiryId, status, responseModal.response);
      setResponseModal({ inquiryId: '', isOpen: false, response: '' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            {isLandlord ? 'Property Inquiries' : 'My Inquiries'}
          </h2>
          <p className="text-gray-600 mt-1">
            {inquiries.length} {inquiries.length === 1 ? 'inquiry' : 'inquiries'} total
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <select
            value={filter}
            onChange={(e) => onFilterChange(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {filterOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Inquiries List */}
      {inquiries.length > 0 ? (
        <div className="space-y-4">
          {inquiries.map((inquiry) => (
            <InquiryCard
              key={inquiry.id}
              inquiry={inquiry}
              isLandlord={isLandlord}
              formatPrice={formatPrice}
              getStatusIcon={getStatusIcon}
              getStatusColor={getStatusColor}
              onViewProperty={onViewProperty}
              onQuickResponse={handleQuickResponse}
              onCustomResponse={(inquiryId) => 
                setResponseModal({ inquiryId, isOpen: true, response: '' })
              }
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl p-12 text-center">
          <MessageSquare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {filter === 'all' 
              ? (isLandlord ? 'No inquiries yet' : 'No inquiries sent') 
              : `No ${filter} inquiries`
            }
          </h3>
          <p className="text-gray-500">
            {isLandlord 
              ? 'Inquiries from potential tenants will appear here'
              : 'Your property inquiries will appear here'
            }
          </p>
        </div>
      )}

      {/* Response Modal */}
      {responseModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Send Custom Response</h3>
            <textarea
              value={responseModal.response}
              onChange={(e) => setResponseModal(prev => ({ ...prev, response: e.target.value }))}
              placeholder="Write your response..."
              rows={4}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex justify-end space-x-3 mt-4">
              <Button 
                variant="outline" 
                onClick={() => setResponseModal({ inquiryId: '', isOpen: false, response: '' })}
              >
                Cancel
              </Button>
              <Button onClick={() => handleCustomResponse('rejected')} variant="outline">
                Decline
              </Button>
              <Button onClick={() => handleCustomResponse('accepted')}>
                Accept
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Individual Inquiry Card Component
function InquiryCard({ 
  inquiry, 
  isLandlord, 
  formatPrice, 
  getStatusIcon, 
  getStatusColor,
  onViewProperty,
  onQuickResponse,
  onCustomResponse
}: {
  inquiry: any;
  isLandlord: boolean;
  formatPrice: (price: number) => string;
  getStatusIcon: (status: string) => React.ReactElement;
  getStatusColor: (status: string) => string;
  onViewProperty: (id: string) => void;
  onQuickResponse: (id: string, status: 'accepted' | 'rejected') => void;
  onCustomResponse: (id: string) => void;
}) {
  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <h3 className="text-lg font-semibold text-gray-900">
              {inquiry.property?.title}
            </h3>
            <div className="flex items-center space-x-1">
              {getStatusIcon(inquiry.status)}
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(inquiry.status)}`}>
                {inquiry.status}
              </span>
            </div>
          </div>
          
          <div className="flex items-center text-sm text-gray-600 mb-2">
            <MapPin className="h-4 w-4 mr-1" />
            {inquiry.property?.address}, {inquiry.property?.city}
          </div>
          
          <div className="text-lg font-bold text-blue-600">
            {formatPrice(inquiry.property?.price || 0)}/month
          </div>
        </div>
      </div>

      {/* Contact Information */}
      {isLandlord && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Contact Information</h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center">
              <User className="h-4 w-4 text-gray-400 mr-2" />
              <span>{inquiry.user?.first_name} {inquiry.user?.last_name}</span>
            </div>
            <div className="flex items-center">
              <Mail className="h-4 w-4 text-gray-400 mr-2" />
              <span>{inquiry.user?.email}</span>
            </div>
            {inquiry.user?.phone && (
              <div className="flex items-center">
                <Phone className="h-4 w-4 text-gray-400 mr-2" />
                <span>{inquiry.user.phone}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Viewing Preferences */}
      {inquiry.preferred_viewing_date && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Viewing Request</h4>
          <div className="flex items-center text-sm text-blue-700">
            <Calendar className="h-4 w-4 mr-2" />
            <span>
              {new Date(inquiry.preferred_viewing_date).toLocaleDateString()}
              {inquiry.preferred_viewing_time && ` at ${inquiry.preferred_viewing_time}`}
            </span>
          </div>
        </div>
      )}

      {/* Message */}
      <div className="mb-4">
        <h4 className="font-medium text-gray-900 mb-2">
          {isLandlord ? 'Tenant Message:' : 'Your Message:'}
        </h4>
        <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
          {inquiry.message}
        </p>
      </div>

      {/* Landlord Response */}
      {inquiry.landlord_response && (
        <div className="mb-4">
          <h4 className="font-medium text-gray-900 mb-2">
            {isLandlord ? 'Your Response:' : 'Landlord Response:'}
          </h4>
          <p className="text-sm text-gray-700 bg-blue-50 p-3 rounded-lg border-l-4 border-blue-200">
            {inquiry.landlord_response}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <div className="text-xs text-gray-500">
          <Clock className="h-3 w-3 inline mr-1" />
          {isLandlord ? 'Received' : 'Sent'} {new Date(inquiry.created_at).toLocaleDateString()} 
          at {new Date(inquiry.created_at).toLocaleTimeString()}
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewProperty(inquiry.property?.id)}
          >
            <Eye className="h-4 w-4 mr-1" />
            View Property
          </Button>
          
          {isLandlord && inquiry.status === 'pending' && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onCustomResponse(inquiry.id)}
              >
                <MessageSquare className="h-4 w-4 mr-1" />
                Custom Response
              </Button>
              <Button
                size="sm"
                onClick={() => onQuickResponse(inquiry.id, 'accepted')}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Accept
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onQuickResponse(inquiry.id, 'rejected')}
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                <XCircle className="h-4 w-4 mr-1" />
                Decline
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
