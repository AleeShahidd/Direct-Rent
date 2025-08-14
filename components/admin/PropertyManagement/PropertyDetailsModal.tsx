'use client';

import React, { useState } from 'react';
import { X, Home, MapPin, DollarSign, Calendar, User, Phone, Mail, Clock, AlertTriangle, CheckCircle2, XCircle, Eye } from 'lucide-react';
import Image from 'next/image';
import { Property } from './PropertyManagement';

interface PropertyDetailsModalProps {
  property: Property;
  onClose: () => void;
  onStatusChange: (propertyId: string, newStatus: Property['status']) => Promise<void>;
}

const PropertyDetailsModal: React.FC<PropertyDetailsModalProps> = ({
  property,
  onClose,
  onStatusChange,
}) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const handleStatusChange = async (newStatus: Property['status']) => {
    setIsUpdating(true);
    try {
      await onStatusChange(property.id, newStatus);
    } catch (error) {
      console.error('Error updating property status:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const nextImage = () => {
    if (property.images && property.images.length > 0) {
      setCurrentImageIndex((prevIndex) => 
        prevIndex === property.images!.length - 1 ? 0 : prevIndex + 1
      );
    }
  };

  const prevImage = () => {
    if (property.images && property.images.length > 0) {
      setCurrentImageIndex((prevIndex) => 
        prevIndex === 0 ? property.images!.length - 1 : prevIndex - 1
      );
    }
  };

  // Format amenities for display
  const formatAmenities = (amenities: string[] | undefined) => {
    if (!amenities || amenities.length === 0) return 'None listed';
    
    return amenities.map(item => 
      item.charAt(0).toUpperCase() + item.slice(1)
    ).join(', ');
  };

  // Format fraud score for display
  const getFraudRiskLevel = (score: number | undefined) => {
    if (score === undefined) return { text: 'Not Assessed', color: 'text-gray-500' };
    
    if (score < 0.3) return { text: 'Low Risk', color: 'text-green-600' };
    if (score < 0.7) return { text: 'Medium Risk', color: 'text-yellow-600' };
    return { text: 'High Risk', color: 'text-red-600' };
  };

  const fraudRisk = getFraudRiskLevel(property.fraud_score);

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
      <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-xl font-semibold text-gray-900">Property Details</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 focus:outline-none"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          {/* Property Status Banner */}
          <div className={`px-4 py-3 rounded-md mb-6 flex items-center justify-between
            ${property.status === 'approved' ? 'bg-green-100' : 
              property.status === 'rejected' ? 'bg-red-100' : 
              property.status === 'pending' ? 'bg-yellow-100' : 'bg-gray-100'}`}>
            <div className="flex items-center">
              {property.status === 'approved' ? (
                <CheckCircle2 className="h-5 w-5 text-green-600 mr-2" />
              ) : property.status === 'rejected' ? (
                <XCircle className="h-5 w-5 text-red-600 mr-2" />
              ) : property.status === 'pending' ? (
                <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
              ) : (
                <Clock className="h-5 w-5 text-gray-600 mr-2" />
              )}
              <span className={`font-medium 
                ${property.status === 'approved' ? 'text-green-800' : 
                  property.status === 'rejected' ? 'text-red-800' : 
                  property.status === 'pending' ? 'text-yellow-800' : 'text-gray-800'}`}>
                Status: {property.status.charAt(0).toUpperCase() + property.status.slice(1)}
              </span>
            </div>
            {property.status === 'pending' && (
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

          {/* Property Header */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{property.title}</h2>
            <div className="flex items-center text-gray-500 mb-2">
              <MapPin className="h-5 w-5 mr-1" />
              <span>{property.address}, {property.city}, {property.postcode}, {property.country}</span>
            </div>
            <div className="flex items-center text-gray-500">
              <Home className="h-5 w-5 mr-1" />
              <span>{property.property_type} • {property.bedrooms} bed • {property.bathrooms} bath</span>
            </div>
          </div>

          {/* Image Gallery */}
          {property.images && property.images.length > 0 ? (
            <div className="relative mb-6 h-80 bg-gray-200 rounded-lg overflow-hidden">
              <img
                src={property.images[currentImageIndex]}
                alt={`Property image ${currentImageIndex + 1}`}
                className="w-full h-full object-cover"
              />
              
              {property.images.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                  <div className="absolute bottom-2 left-0 right-0 flex justify-center">
                    <div className="bg-black bg-opacity-50 px-2 py-1 rounded-full text-white text-xs">
                      {currentImageIndex + 1} / {property.images.length}
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-60 mb-6 bg-gray-100 rounded-lg">
              <Home className="h-16 w-16 text-gray-400" />
              <p className="ml-2 text-gray-500">No images available</p>
            </div>
          )}

          {/* Property Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Left Column */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Property Details</h3>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <dl className="grid grid-cols-1 gap-4">
                  <div className="flex justify-between">
                    <dt className="text-sm font-medium text-gray-500">Type</dt>
                    <dd className="text-sm text-gray-900 capitalize">{property.property_type}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm font-medium text-gray-500">Price</dt>
                    <dd className="text-sm text-gray-900">£{property.price.toLocaleString()}{property?.price_frequency ? `/${property.price_frequency}` : '/month'}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm font-medium text-gray-500">Deposit</dt>
                    <dd className="text-sm text-gray-900">{property.deposit_amount ? `£${property.deposit_amount.toLocaleString()}` : 'Not specified'}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm font-medium text-gray-500">Bedrooms</dt>
                    <dd className="text-sm text-gray-900">{property.bedrooms}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm font-medium text-gray-500">Bathrooms</dt>
                    <dd className="text-sm text-gray-900">{property.bathrooms}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm font-medium text-gray-500">Available From</dt>
                    <dd className="text-sm text-gray-900">{property.available_from ? new Date(property.available_from).toLocaleDateString() : 'Not specified'}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm font-medium text-gray-500">Minimum Tenancy</dt>
                    <dd className="text-sm text-gray-900">{property.minimum_tenancy ? `${property.minimum_tenancy} months` : 'Not specified'}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm font-medium text-gray-500">Furnished</dt>
                    <dd className="text-sm text-gray-900">{property.furnished ? 'Yes' : 'No'}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm font-medium text-gray-500">Pets Allowed</dt>
                    <dd className="text-sm text-gray-900">{property.pets_allowed ? 'Yes' : 'No'}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm font-medium text-gray-500">Garden</dt>
                    <dd className="text-sm text-gray-900">{property.has_garden ? 'Yes' : 'No'}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm font-medium text-gray-500">Parking</dt>
                    <dd className="text-sm text-gray-900">{property.has_parking ? 'Yes' : 'No'}</dd>
                  </div>
                </dl>
              </div>
            </div>
            
            {/* Right Column */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Landlord Information</h3>
              
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <div className="flex items-center mb-4">
                  <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-500 mr-3">
                    <User className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">{property.owner?.full_name || 'Unknown'}</h4>
                    <p className="text-sm text-gray-500">Owner/Landlord</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <Mail className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-500">{property.owner?.email || 'No email provided'}</span>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-500">Listed on {new Date(property.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              
              <h3 className="text-lg font-medium text-gray-900 mb-4">Additional Information</h3>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <dl className="grid grid-cols-1 gap-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500 mb-1">Description</dt>
                    <dd className="text-sm text-gray-900">{property.description || 'No description provided'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500 mb-1">Amenities</dt>
                    <dd className="text-sm text-gray-900">{formatAmenities(property.amenities)}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500 mb-1">Verification Status</dt>
                    <dd className="text-sm text-gray-900">
                      {property.is_verified ? (
                        <span className="inline-flex items-center text-green-600">
                          <CheckCircle2 className="h-4 w-4 mr-1" /> Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-gray-600">
                          <XCircle className="h-4 w-4 mr-1" /> Not Verified
                        </span>
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500 mb-1">Fraud Risk Assessment</dt>
                    <dd className={`text-sm ${fraudRisk.color} font-medium`}>
                      {fraudRisk.text}
                      {property.fraud_score !== undefined && ` (Score: ${(property.fraud_score * 100).toFixed(1)}%)`}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Close
            </button>
            <a 
              href={`/properties/${property.id}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Eye className="h-4 w-4 mr-2" />
              View Public Listing
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyDetailsModal;
