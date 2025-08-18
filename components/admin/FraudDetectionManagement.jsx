/**
 * Fraud Detection Management Component
 * Admin component for reviewing and managing flagged properties
 */

'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { createClient } from '@/lib/supabase';

export default function FraudDetectionManagement() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fraudReports, setFraudReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [priorityFilter, setPriorityFilter] = useState('all');
  
  useEffect(() => {
    fetchFraudReports();
  }, [statusFilter, priorityFilter]);
  
  // Fetch fraud reports from database
  const fetchFraudReports = async () => {
    setLoading(true);
    
    try {
      const supabase = createClient();
      
      // Build query
      let query = supabase
        .from('fraud_reports')
        .select(`
          *,
          properties (id, title, price_per_month, postcode, property_type, bedrooms, bathrooms, images),
          users:landlord_id (id, full_name, email)
        `)
        .order('created_at', { ascending: false });
      
      // Apply filters
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }
      
      if (priorityFilter !== 'all') {
        query = query.eq('priority', priorityFilter);
      }
      
      const { data, error } = await query;
      
      if (error) {
        throw new Error(error.message);
      }
      
      setFraudReports(data || []);
    } catch (err) {
      console.log('Error fetching fraud reports:', err);
      setError('Failed to load fraud reports');
    } finally {
      setLoading(false);
    }
  };
  
  // Update report status
  const updateReportStatus = async (reportId, status) => {
    try {
      const supabase = createClient();
      
      const { error } = await supabase
        .from('fraud_reports')
        .update({
          status,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', reportId);
      
      if (error) {
        throw new Error(error.message);
      }
      
      // Update property status if needed
      if (status === 'approved' && selectedReport) {
        await supabase
          .from('properties')
          .update({
            status: 'suspended',
            admin_notes: `Suspended due to fraud detection (${new Date().toLocaleString()})`
          })
          .eq('id', selectedReport.property_id);
      } else if (status === 'rejected' && selectedReport) {
        await supabase
          .from('properties')
          .update({
            status: 'active',
            admin_notes: `Cleared fraud review (${new Date().toLocaleString()})`
          })
          .eq('id', selectedReport.property_id);
      }
      
      // Refresh reports
      fetchFraudReports();
      setSelectedReport(null);
      
    } catch (err) {
      console.log('Error updating report:', err);
      alert('Failed to update report status');
    }
  };
  
  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-GB', { 
      style: 'currency', 
      currency: 'GBP',
      maximumFractionDigits: 0
    }).format(amount);
  };
  
  // Get risk score color
  const getRiskScoreColor = (score) => {
    if (score >= 0.7) return 'text-red-600';
    if (score >= 0.4) return 'text-orange-500';
    return 'text-yellow-500';
  };
  
  // Get status badge style
  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'reviewed':
        return 'bg-blue-100 text-blue-800';
      case 'approved':
        return 'bg-red-100 text-red-800';
      case 'rejected':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Get priority badge style
  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'low':
        return 'bg-blue-100 text-blue-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'critical':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold mb-6">Fraud Detection Management</h2>
      
      <div className="flex flex-wrap gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="reviewed">Reviewed</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
            <option value="all">All</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>
      </div>
      
      {loading && (
        <div className="animate-pulse">
          <div className="h-10 bg-gray-200 rounded mb-4"></div>
          <div className="h-10 bg-gray-200 rounded mb-4"></div>
          <div className="h-10 bg-gray-200 rounded mb-4"></div>
        </div>
      )}
      
      {error && (
        <div className="bg-red-50 text-red-500 p-4 rounded-lg">
          {error}
        </div>
      )}
      
      {!loading && fraudReports.length === 0 && (
        <div className="bg-gray-50 p-4 rounded-lg text-gray-500 text-center">
          No fraud reports found with the current filters.
        </div>
      )}
      
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Reports list */}
        <div className="w-full lg:w-1/2">
          {fraudReports.length > 0 && (
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">Property</th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Risk Score</th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {fraudReports.map((report) => (
                    <tr 
                      key={report.id} 
                      className={`cursor-pointer hover:bg-gray-50 ${selectedReport?.id === report.id ? 'bg-indigo-50' : ''}`}
                      onClick={() => setSelectedReport(report)}
                    >
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900">
                        {report.properties?.title || 'Property'}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm">
                        <span className={`font-medium ${getRiskScoreColor(report.fraud_score)}`}>
                          {Math.round(report.fraud_score * 100)}%
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(report.status)}`}>
                          {report.status}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {new Date(report.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        {/* Report details */}
        <div className="w-full lg:w-1/2">
          {selectedReport ? (
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="mb-4 flex justify-between items-start">
                <h3 className="font-semibold text-lg">Report Details</h3>
                <div className="flex gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(selectedReport.status)}`}>
                    {selectedReport.status}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityBadge(selectedReport.priority)}`}>
                    {selectedReport.priority}
                  </span>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Property</h4>
                  <p className="font-medium">
                    {selectedReport.properties?.title || 'Unknown property'}
                  </p>
                  <p className="text-sm text-gray-600">
                    {selectedReport.properties?.property_type}, {selectedReport.properties?.bedrooms} bed, {selectedReport.properties?.postcode}
                  </p>
                  <p className="text-sm font-medium text-indigo-600">
                    {formatCurrency(selectedReport.properties?.price_per_month || 0)} per month
                  </p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Landlord</h4>
                  <p className="font-medium">
                    {selectedReport.users?.full_name || 'Unknown user'}
                  </p>
                  <p className="text-sm text-gray-600">
                    {selectedReport.users?.email || ''}
                  </p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Fraud Risk Score</h4>
                  <div className="flex items-center">
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2">
                      <div 
                        className={`h-2.5 rounded-full ${
                          selectedReport.fraud_score >= 0.7 ? 'bg-red-600' : 
                          selectedReport.fraud_score >= 0.4 ? 'bg-orange-500' : 'bg-yellow-500'
                        }`}
                        style={{ width: `${selectedReport.fraud_score * 100}%` }}
                      ></div>
                    </div>
                    <span className={`text-sm font-medium ${getRiskScoreColor(selectedReport.fraud_score)}`}>
                      {Math.round(selectedReport.fraud_score * 100)}%
                    </span>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Risk Factors</h4>
                  <div className="space-y-2 mt-2">
                    {Object.entries(selectedReport.risk_factors || {}).map(([key, value]) => (
                      value > 0 && (
                        <div key={key} className="flex justify-between items-center">
                          <span className="text-sm capitalize">{key.replace(/_/g, ' ')}</span>
                          <div className="flex items-center">
                            <div className="w-20 bg-gray-200 rounded-full h-1.5 mr-2">
                              <div 
                                className="h-1.5 rounded-full bg-indigo-600"
                                style={{ width: `${value * 100}%` }}
                              ></div>
                            </div>
                            <span className="text-xs font-medium">
                              {Math.round(value * 100)}%
                            </span>
                          </div>
                        </div>
                      )
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Reasons ({(selectedReport.reasons || []).length})</h4>
                  <ul className="list-disc pl-5 mt-1 space-y-1">
                    {(selectedReport.reasons || []).map((reason, index) => (
                      <li key={index} className="text-sm">
                        {reason}
                      </li>
                    ))}
                  </ul>
                </div>
                
                {selectedReport.status === 'pending' && (
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => updateReportStatus(selectedReport.id, 'approved')}
                      className="px-3 py-2 bg-red-600 text-white text-sm font-medium rounded hover:bg-red-700"
                    >
                      Confirm Fraud
                    </button>
                    <button
                      onClick={() => updateReportStatus(selectedReport.id, 'rejected')}
                      className="px-3 py-2 bg-green-600 text-white text-sm font-medium rounded hover:bg-green-700"
                    >
                      Reject Report
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 p-4 rounded-lg text-center text-gray-500">
              Select a report to view details
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
