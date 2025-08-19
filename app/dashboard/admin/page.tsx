'use client';

import React, { useState } from 'react';
import { AdminAnalytics } from '@/components/admin/AdminAnalytics';
import { FraudDetectionManagement } from '@/components/admin/FraudDetectionManagement';
import { MLModelMonitoring } from '@/components/admin/MLModelMonitoring';
import UserManagement from '@/components/admin/UserManagement/UserManagement';
import PropertyManagement from '@/components/admin/PropertyManagement/PropertyManagement';
import BookingManagement from '@/components/admin/BookingManagement/BookingManagement';

// Tab definitions
const ADMIN_TABS = [
  { id: 'ml-monitoring', label: 'ML Monitoring', icon: '🤖' },
  { id: 'fraud', label: 'Fraud Detection', icon: '🚨' },
  { id: 'users', label: 'User Management', icon: '👥' },
  { id: 'properties', label: 'Property Management', icon: '🏠' },
  { id: 'bookings', label: 'Booking Management', icon: '📅' },
] as const;

type AdminTabType = typeof ADMIN_TABS[number]['id'];

import AdminProtection from './AdminProtection';

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<AdminTabType>('ml-monitoring');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'ml-monitoring':
        return <MLModelMonitoring />;
      case 'fraud':
        return <FraudDetectionManagement />;
      case 'users':
        return <UserManagementTab />;
      case 'properties':
        return <PropertyManagementTab />;
      case 'bookings':
        return <BookingManagementTab />;
      default:
        return <MLModelMonitoring />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600 mt-1">DirectRent UK Platform Management</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                🟢 System Online
              </div>
            
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex space-x-8">
          {/* Sidebar Navigation */}
          <div className="w-64 flex-shrink-0">
            <nav className="bg-white rounded-lg shadow-sm p-4">
              <div className="space-y-2">
                {ADMIN_TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 text-left rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-100 text-blue-700 border border-blue-200'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <span className="text-lg">{tab.icon}</span>
                    <span className="font-medium">{tab.label}</span>
                  </button>
                ))}
              </div>
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  );
}

// Placeholder components for other tabs
function UserManagementTab() {
  return <UserManagement />;
}

function PropertyManagementTab() {
  return <PropertyManagement />;
}

function BookingManagementTab() {
  return <BookingManagement />;
}

function ReviewManagementTab() {
  return (
    <div className="bg-white rounded-lg shadow-sm p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Review Management</h2>
      <p className="text-gray-600">Moderate reviews and manage review disputes.</p>
      <div className="mt-8 text-center text-gray-500">
        🚧 Under Development - Review management interface coming soon
      </div>
    </div>
  );
}

function FraudDetectionTab() {
  return <FraudDetectionManagement />;
}

function ReportsTab() {
  return (
    <div className="bg-white rounded-lg shadow-sm p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Reports</h2>
      <p className="text-gray-600">Generate comprehensive platform reports and insights.</p>
      <div className="mt-8 text-center text-gray-500">
        🚧 Under Development - Reporting interface coming soon
      </div>
    </div>
  );
}

function PlatformSettingsTab() {
  return (
    <div className="bg-white rounded-lg shadow-sm p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Platform Settings</h2>
      <p className="text-gray-600">Configure platform-wide settings and preferences.</p>
      <div className="mt-8 text-center text-gray-500">
        🚧 Under Development - Platform settings interface coming soon
      </div>
    </div>
  );
}

// Export the protected component
export default function ProtectedAdminDashboard() {
  return (
    <AdminProtection>
      <AdminDashboard />
    </AdminProtection>
  )
}
