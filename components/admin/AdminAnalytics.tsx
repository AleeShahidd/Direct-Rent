'use client';

import React, { useState, useEffect } from 'react';
import { AdminStats } from '@/types/enhanced';

interface AdminStatsCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  trend?: number;
  suffix?: string;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
}

const AdminStatsCard: React.FC<AdminStatsCardProps> = ({ 
  title, 
  value, 
  icon, 
  trend, 
  suffix = '', 
  color = 'blue' 
}) => {
  const colorClasses = {
    blue: 'border-blue-200 bg-blue-50 text-blue-600',
    green: 'border-green-200 bg-green-50 text-green-600',
    yellow: 'border-yellow-200 bg-yellow-50 text-yellow-600',
    red: 'border-red-200 bg-red-50 text-red-600',
    purple: 'border-purple-200 bg-purple-50 text-purple-600',
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {value.toLocaleString()}{suffix}
          </p>
          {trend !== undefined && (
            <p className={`text-sm mt-2 ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {trend >= 0 ? '↗' : '↘'} {Math.abs(trend)}% from last month
            </p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

interface AdminAnalyticsProps {
  onRefresh?: () => void;
}

export const AdminAnalytics: React.FC<AdminAnalyticsProps> = ({ onRefresh }) => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/stats');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch stats');
      }

      setStats(data.data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    if (onRefresh) {
      onRefresh();
    }
  }, [onRefresh]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center">
          <div className="text-red-600 mr-3">⚠️</div>
          <div>
            <h3 className="text-red-800 font-semibold">Error Loading Statistics</h3>
            <p className="text-red-600 mt-1">{error}</p>
            <button
              onClick={fetchStats}
              className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No statistics available</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Admin Analytics</h2>
          <p className="text-gray-600 mt-1">Real-time insights into your rental platform</p>
        </div>
        <button
          onClick={fetchStats}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Users Section */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">User Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AdminStatsCard
            title="Total Users"
            value={stats.users.total}
            icon={<span className="text-xl">👥</span>}
            color="blue"
          />
          <AdminStatsCard
            title="Active Users"
            value={stats.users.active}
            icon={<span className="text-xl">✅</span>}
            color="green"
          />
          <AdminStatsCard
            title="Landlords"
            value={stats.users.landlords}
            icon={<span className="text-xl">🏠</span>}
            color="purple"
          />
          <AdminStatsCard
            title="Tenants"
            value={stats.users.tenants}
            icon={<span className="text-xl">👤</span>}
            color="blue"
          />
          <AdminStatsCard
            title="Verified Users"
            value={stats.users.verified}
            icon={<span className="text-xl">🔒</span>}
            color="green"
          />
          <AdminStatsCard
            title="New This Month"
            value={stats.users.new_this_month}
            icon={<span className="text-xl">📈</span>}
            color="yellow"
          />
        </div>
      </div>

      {/* Properties Section */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Property Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AdminStatsCard
            title="Total Properties"
            value={stats.properties.total}
            icon={<span className="text-xl">🏘️</span>}
            color="blue"
          />
          <AdminStatsCard
            title="Active Properties"
            value={stats.properties.active}
            icon={<span className="text-xl">✅</span>}
            color="green"
          />
          <AdminStatsCard
            title="Pending Verification"
            value={stats.properties.pending_verification}
            icon={<span className="text-xl">⏳</span>}
            color="yellow"
          />
          <AdminStatsCard
            title="Featured Properties"
            value={stats.properties.featured}
            icon={<span className="text-xl">⭐</span>}
            color="purple"
          />
          <AdminStatsCard
            title="Average Price"
            value={stats.properties.average_price}
            icon={<span className="text-xl">💰</span>}
            suffix="£/month"
            color="green"
          />
          <AdminStatsCard
            title="New This Month"
            value={stats.properties.new_this_month}
            icon={<span className="text-xl">📈</span>}
            color="blue"
          />
        </div>
      </div>

      {/* Bookings Section */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Booking Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AdminStatsCard
            title="Total Bookings"
            value={stats.bookings.total}
            icon={<span className="text-xl">📅</span>}
            color="blue"
          />
          <AdminStatsCard
            title="Pending"
            value={stats.bookings.pending}
            icon={<span className="text-xl">⏳</span>}
            color="yellow"
          />
          <AdminStatsCard
            title="Confirmed"
            value={stats.bookings.confirmed}
            icon={<span className="text-xl">✅</span>}
            color="green"
          />
          <AdminStatsCard
            title="Completed"
            value={stats.bookings.completed}
            icon={<span className="text-xl">🏁</span>}
            color="purple"
          />
          <AdminStatsCard
            title="Cancelled"
            value={stats.bookings.cancelled}
            icon={<span className="text-xl">❌</span>}
            color="red"
          />
          <AdminStatsCard
            title="New This Month"
            value={stats.bookings.new_this_month}
            icon={<span className="text-xl">📈</span>}
            color="blue"
          />
        </div>
      </div>

      {/* Reviews & Fraud Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Review Metrics</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AdminStatsCard
              title="Total Reviews"
              value={stats.reviews.total}
              icon={<span className="text-xl">⭐</span>}
              color="blue"
            />
            <AdminStatsCard
              title="Average Rating"
              value={stats.reviews.average_rating}
              icon={<span className="text-xl">📊</span>}
              suffix="/5"
              color="green"
            />
            <AdminStatsCard
              title="Pending Moderation"
              value={stats.reviews.pending_moderation}
              icon={<span className="text-xl">⏳</span>}
              color="yellow"
            />
            <AdminStatsCard
              title="Flagged Reviews"
              value={stats.reviews.flagged}
              icon={<span className="text-xl">🚩</span>}
              color="red"
            />
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Fraud & Security</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AdminStatsCard
              title="Fraud Reports"
              value={stats.fraud.reports}
              icon={<span className="text-xl">🚨</span>}
              color="red"
            />
            <AdminStatsCard
              title="Active Investigations"
              value={stats.fraud.investigations}
              icon={<span className="text-xl">🔍</span>}
              color="yellow"
            />
            <AdminStatsCard
              title="Flagged Users"
              value={stats.fraud.flagged_users}
              icon={<span className="text-xl">⚠️</span>}
              color="red"
            />
            <AdminStatsCard
              title="Flagged Properties"
              value={stats.fraud.flagged_properties}
              icon={<span className="text-xl">🏠⚠️</span>}
              color="red"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
