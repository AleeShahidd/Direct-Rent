'use client';

import React from 'react';
import { X, Mail, Phone, CalendarDays, User as UserIcon, Shield, Info } from 'lucide-react';
import { User } from './UserManagement';

interface UserDetailsModalProps {
  user: User;
  onClose: () => void;
}

const UserDetailsModal: React.FC<UserDetailsModalProps> = ({ user, onClose }) => {
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
      <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-xl font-semibold text-gray-900">User Details</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 focus:outline-none"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          {/* Header with avatar */}
          <div className="flex items-center mb-6">
            <div className="flex-shrink-0 h-20 w-20 mr-4">
              {user.avatar_url ? (
                <img
                  className="h-20 w-20 rounded-full object-cover"
                  src={user.avatar_url}
                  alt={user.full_name}
                />
              ) : (
                <div className="h-20 w-20 rounded-full bg-blue-100 flex items-center justify-center text-blue-500">
                  <UserIcon className="h-10 w-10" />
                </div>
              )}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{user.full_name}</h2>
              <p className="text-sm text-gray-500">
                User ID: {user.id}
              </p>
              <div className="mt-1">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  user.role === 'admin' 
                    ? 'bg-purple-100 text-purple-800' 
                    : user.role === 'landlord' 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-green-100 text-green-800'
                }`}>
                  {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                </span>
                <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  user.account_status === 'active' 
                    ? 'bg-green-100 text-green-800' 
                    : user.account_status === 'suspended' 
                    ? 'bg-red-100 text-red-800' 
                    : user.account_status === 'pending' 
                    ? 'bg-yellow-100 text-yellow-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {user.account_status.charAt(0).toUpperCase() + user.account_status.slice(1)}
                </span>
              </div>
            </div>
          </div>

          {/* Basic information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h3>
              <div className="space-y-3">
                <div className="flex">
                  <Mail className="h-5 w-5 text-gray-400 mr-2" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Email</p>
                    <p className="text-sm text-gray-900">{user.email}</p>
                    <span className={`text-xs ${user.email_verified ? 'text-green-600' : 'text-red-600'}`}>
                      {user.email_verified ? '✓ Verified' : '✗ Not verified'}
                    </span>
                  </div>
                </div>
                <div className="flex">
                  <Phone className="h-5 w-5 text-gray-400 mr-2" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Phone</p>
                    <p className="text-sm text-gray-900">{user.phone || 'Not provided'}</p>
                    {user.phone && (
                      <span className={`text-xs ${user.phone_verified ? 'text-green-600' : 'text-red-600'}`}>
                        {user.phone_verified ? '✓ Verified' : '✗ Not verified'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h3>
              <div className="space-y-3">
                <div className="flex">
                  <UserIcon className="h-5 w-5 text-gray-400 mr-2" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Name</p>
                    <p className="text-sm text-gray-900">
                      {user.first_name || ''} {user.last_name || ''}
                      {!user.first_name && !user.last_name && 'Not provided'}
                    </p>
                  </div>
                </div>
                <div className="flex">
                  <CalendarDays className="h-5 w-5 text-gray-400 mr-2" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Date of Birth</p>
                    <p className="text-sm text-gray-900">
                      {user.date_of_birth ? new Date(user.date_of_birth).toLocaleDateString() : 'Not provided'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Account information */}
          <div className="bg-gray-50 p-4 rounded-lg mb-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Account Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex">
                <Shield className="h-5 w-5 text-gray-400 mr-2" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Verification Status</p>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    user.verification_status === 'verified' 
                      ? 'bg-green-100 text-green-800' 
                      : user.verification_status === 'rejected' 
                      ? 'bg-red-100 text-red-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {user.verification_status.charAt(0).toUpperCase() + user.verification_status.slice(1)}
                  </span>
                </div>
              </div>
              <div className="flex">
                <CalendarDays className="h-5 w-5 text-gray-400 mr-2" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Created On</p>
                  <p className="text-sm text-gray-900">{new Date(user.created_at).toLocaleString()}</p>
                </div>
              </div>
              <div className="flex">
                <Info className="h-5 w-5 text-gray-400 mr-2" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Last Updated</p>
                  <p className="text-sm text-gray-900">{user.updated_at ? new Date(user.updated_at).toLocaleString() : 'N/A'}</p>
                </div>
              </div>
              <div className="flex">
                <Info className="h-5 w-5 text-gray-400 mr-2" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Last Login</p>
                  <p className="text-sm text-gray-900">{user.last_login ? new Date(user.last_login).toLocaleString() : 'Never'}</p>
                </div>
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDetailsModal;
