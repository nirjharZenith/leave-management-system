'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import axios from 'axios';
import Cookies from 'js-cookie';
import useSWR from 'swr';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://192.168.1.101:5000';

const fetcher = async (url: string) => {
  const token = Cookies.get('authToken');
  const response = await axios.get(url, {
    baseURL: API_BASE_URL,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return response.data;
};

export default function ManagerApprovalsPage() {
  const { user } = useAuth();
  const { data: leaves = [], mutate } = useSWR('/api/leaves', fetcher);
  const [processingId, setProcessingId] = useState<number | null>(null);

  const pendingLeaves = leaves.filter((leave: any) => leave.status === 'Pending');

  const handleApprove = async (leaveId: number) => {
    setProcessingId(leaveId);
    try {
      const token = Cookies.get('authToken');
      await axios.put(
        `${API_BASE_URL}/api/leaves/${leaveId}`,
        { status: 'Approved' },
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );
      mutate();
    } catch (error) {
      console.error('Failed to approve leave:', error);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (leaveId: number, rejectionReason: string) => {
    if (!rejectionReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }

    setProcessingId(leaveId);
    try {
      const token = Cookies.get('authToken');
      await axios.put(
        `${API_BASE_URL}/api/leaves/${leaveId}`,
        { status: 'Rejected', rejectionReason },
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );
      mutate();
    } catch (error) {
      console.error('Failed to reject leave:', error);
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-2">Leave Approvals</h1>
      <p className="text-gray-600 mb-6">Manage leave requests from your team members</p>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {pendingLeaves.length === 0 ? (
          <div className="p-6 text-center text-gray-600">
            No pending leave requests at the moment.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Employee</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Start Date</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">End Date</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Type</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Reason</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {pendingLeaves.map((leave: any) => (
                  <tr key={leave.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 text-sm font-medium text-gray-800">{leave.employeeName || 'Unknown'}</td>
                    <td className="px-6 py-4 text-sm text-gray-800">{formatDate(leave.startDate)}</td>
                    <td className="px-6 py-4 text-sm text-gray-800">{formatDate(leave.endDate)}</td>
                    <td className="px-6 py-4 text-sm text-gray-800">{leave.type}</td>
                    <td className="px-6 py-4 text-sm text-gray-800">{leave.reason}</td>
                    <td className="px-6 py-4 text-sm space-x-2 flex">
                      <Button
                        onClick={() => handleApprove(leave.id)}
                        disabled={processingId === leave.id}
                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded transition text-xs"
                      >
                        {processingId === leave.id ? 'Processing...' : 'Approve'}
                      </Button>
                      <Button
                        onClick={() => {
                          const reason = prompt('Enter rejection reason:');
                          if (reason) handleReject(leave.id, reason);
                        }}
                        disabled={processingId === leave.id}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded transition text-xs"
                      >
                        Reject
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
