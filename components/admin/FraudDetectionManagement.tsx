'use client';

import React, { useState, useEffect } from 'react';
import { FraudCheckResponse } from '@/types';

interface FraudReport {
  id: string;
  property_id: string;
  property_title: string;
  landlord_id: string;
  landlord_name: string;
  fraud_score: number;
  is_fraudulent: boolean;
  reasons: string[];
  risk_factors: {
    price_deviation: number;
    posting_frequency: number;
    content_similarity: number;
    image_authenticity: number;
  };
  status: 'pending' | 'reviewed' | 'approved' | 'rejected';
  created_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
}

export function FraudDetectionManagement() {
  const [reports, setReports] = useState<FraudReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'high_risk'>('pending');

  useEffect(() => {
    fetchFraudReports();
  }, [filter]);

  const fetchFraudReports = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/fraud-reports?filter=${filter}`);
      const result = await response.json();
      
      if (result.success) {
        setReports(result.data);
      }
    } catch (error) {
      console.log('Failed to fetch fraud reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReviewAction = async (reportId: string, action: 'approve' | 'reject') => {
    try {
      const response = await fetch(`/api/admin/fraud-reports/${reportId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      });

      const result = await response.json();
      
      if (result.success) {
        // Refresh the reports
        fetchFraudReports();
      }
    } catch (error) {
      console.log('Failed to update fraud report:', error);
    }
  };

  const getRiskLevel = (score: number) => {
    if (score >= 0.8) return { level: 'Critical', color: 'bg-red-100 text-red-800' };
    if (score >= 0.6) return { level: 'High', color: 'bg-orange-100 text-orange-800' };
    if (score >= 0.4) return { level: 'Medium', color: 'bg-yellow-100 text-yellow-800' };
    return { level: 'Low', color: 'bg-green-100 text-green-800' };
  };

  const mockData: FraudReport[] = [
    {
      id: '1',
      property_id: 'prop_001',
      property_title: 'Luxury 3-bed flat in Central London - Amazing Deal!',
      landlord_id: 'user_001',
      landlord_name: 'John Smith',
      fraud_score: 0.85,
      is_fraudulent: true,
      reasons: ['Price significantly below market average', 'Contains suspicious keyword: urgent'],
      risk_factors: {
        price_deviation: 0.4,
        posting_frequency: 0.1,
        content_similarity: 0.2,
        image_authenticity: 0.15
      },
      status: 'pending',
      created_at: '2025-01-10T10:30:00Z'
    },
    {
      id: '2',
      property_id: 'prop_002',
      property_title: 'Modern studio apartment in Manchester',
      landlord_id: 'user_002',
      landlord_name: 'Sarah Wilson',
      fraud_score: 0.45,
      is_fraudulent: false,
      reasons: ['Few images provided'],
      risk_factors: {
        price_deviation: 0.1,
        posting_frequency: 0.05,
        content_similarity: 0.1,
        image_authenticity: 0.2
      },
      status: 'pending',
      created_at: '2025-01-10T09:15:00Z'
    }
  ];

  const displayReports = reports.length > 0 ? reports : mockData;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Fraud Detection Management</h2>
          <p className="text-gray-600 mt-1">Review and manage potentially fraudulent property listings</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as typeof filter)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Reports</option>
            <option value="pending">Pending Review</option>
            <option value="high_risk">High Risk Only</option>
          </select>
          
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            Generate Report
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center mr-3">
              <span className="text-red-600">🚨</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">12</p>
              <p className="text-sm text-gray-600">Pending Reviews</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
              <span className="text-orange-600">⚠️</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">8</p>
              <p className="text-sm text-gray-600">High Risk</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
              <span className="text-green-600">✅</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">45</p>
              <p className="text-sm text-gray-600">Approved Today</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
              <span className="text-blue-600">📊</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">96.2%</p>
              <p className="text-sm text-gray-600">Detection Accuracy</p>
            </div>
          </div>
        </div>
      </div>

      {/* Reports Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Property
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Landlord
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Risk Score
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Risk Factors
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-2"></div>
                      Loading fraud reports...
                    </div>
                  </td>
                </tr>
              ) : displayReports.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    No fraud reports found
                  </td>
                </tr>
              ) : (
                displayReports.map((report) => {
                  const riskLevel = getRiskLevel(report.fraud_score);
                  
                  return (
                    <tr key={report.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900 max-w-xs truncate">
                            {report.property_title}
                          </div>
                          <div className="text-sm text-gray-500">ID: {report.property_id}</div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{report.landlord_name}</div>
                          <div className="text-sm text-gray-500">{report.landlord_id}</div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${riskLevel.color}`}>
                            {riskLevel.level}
                          </span>
                          <span className="text-sm text-gray-600 mt-1">
                            {(report.fraud_score * 100).toFixed(1)}%
                          </span>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          {Object.entries(report.risk_factors).map(([factor, value]) => (
                            value > 0 && (
                              <div key={factor} className="flex items-center">
                                <div className="w-16 text-xs text-gray-600 capitalize">
                                  {factor.replace('_', ' ')}:
                                </div>
                                <div className="flex-1 bg-gray-200 rounded-full h-2 ml-2">
                                  <div
                                    className="bg-red-500 h-2 rounded-full"
                                    style={{ width: `${value * 100}%` }}
                                  ></div>
                                </div>
                              </div>
                            )
                          ))}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          report.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          report.status === 'approved' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                        </span>
                      </td>
                      
                      <td className="px-6 py-4">
                        {report.status === 'pending' && (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleReviewAction(report.id, 'approve')}
                              className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleReviewAction(report.id, 'reject')}
                              className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detailed View Modal would go here */}
    </div>
  );
}
