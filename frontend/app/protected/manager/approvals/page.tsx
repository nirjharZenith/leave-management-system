'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import RoleGuard from '@/components/RoleGuard';
import { leaveAPI } from '@/lib/api';
import { useLeaves } from '@/lib/hooks/useApi';
import { formatDate, mapLeave } from '@/lib/utils/format';
import { CheckSquare, X } from 'lucide-react';
import RejectionModal from '@/components/RejectionModal';

export default function ManagerApprovalsPage() {
  return (
    <RoleGuard allowedRoles={['manager']}>
      <ApprovalsContent />
    </RoleGuard>
  );
}

function ApprovalsContent() {
  const { leaves: rawLeaves, isLoading, mutate } = useLeaves();
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [selectedLeaveToReject, setSelectedLeaveToReject] = useState<any | null>(null);
  const [error, setError] = useState('');

  const leaves = (rawLeaves ?? []).map((l: Record<string, unknown>) => mapLeave(l));
  const pendingLeaves = leaves.filter((leave:any) => leave.status === 'Pending');
  const processedLeaves = leaves.filter((leave:any) => leave.status !== 'Pending');

  const handleApprove = async (leaveId: number) => {
    setProcessingId(leaveId);
    setError('');
    try {
      await leaveAPI.update(leaveId, { status: 'Approved' });
      mutate();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to approve leave');
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectSubmit = async (rejectionReason: string) => {
    if (!selectedLeaveToReject) return;
    const leaveId = selectedLeaveToReject.id;

    setProcessingId(leaveId);
    setError('');
    try {
      await leaveAPI.update(leaveId, {
        status: 'Rejected',
        rejection_reason: rejectionReason,
      });
      mutate();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to reject leave');
      throw err; // propagates to RejectionModal error handler
    } finally {
      setProcessingId(null);
      setSelectedLeaveToReject(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 bg-emerald-100 rounded-lg">
          <CheckSquare className="w-6 h-6 text-emerald-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Leave Approvals</h1>
      </div>
      <p className="text-gray-600 mb-8">Review and manage leave requests from your team</p>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 ">
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <p className="text-sm text-gray-500">Pending</p>
          <p className="text-3xl font-bold text-amber-600 mt-1">{pendingLeaves.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <p className="text-sm text-gray-500">Approved</p>
          <p className="text-3xl font-bold text-emerald-600 mt-1">
            {processedLeaves.filter((l:any) => l.status === 'Approved').length}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <p className="text-sm text-gray-500">Rejected</p>
          <p className="text-3xl font-bold text-red-600 mt-1">
            {processedLeaves.filter((l:any) => l.status === 'Rejected').length}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Pending Requests</h2>
        </div>

        {isLoading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
          </div>
        ) : pendingLeaves.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <CheckSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="font-medium">No pending requests</p>
            <p className="text-sm mt-1">All caught up! New requests will appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50/80 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Employee</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Dates</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Reason</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pendingLeaves.map((leave:any) => (
                  <tr key={leave.id} className="hover:bg-gray-50/50 transition">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {leave.employeeName || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {formatDate(leave.startDate)} — {formatDate(leave.endDate)}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                        {leave.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                      {leave.reason}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleApprove(leave.id)}
                          disabled={processingId === leave.id}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium"
                        >
                          {processingId === leave.id ? '...' : 'Approve'}
                        </Button>
                        <Button
                          onClick={() => setSelectedLeaveToReject(leave)}
                          disabled={processingId === leave.id}
                          className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 px-3 py-1.5 rounded-lg text-xs font-medium"
                        >
                          <X className="w-3 h-3 mr-1 inline" />
                          Reject
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <RejectionModal
        isOpen={selectedLeaveToReject !== null}
        onClose={() => setSelectedLeaveToReject(null)}
        onSubmit={handleRejectSubmit}
        leave={selectedLeaveToReject}
      />
    </div>
  );
}
