'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { leaveAPI } from '@/lib/api';
import { formatDate } from '@/lib/utils/format';
import { CheckSquare, X, AlertCircle } from 'lucide-react';
import { Leave } from '@/lib/types';
import RejectionModal from './RejectionModal';

interface ApprovalsPanelProps {
  leaves: Leave[];
  onAction: () => void;
}

function getDurationDays(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
}

export default function ApprovalsPanel({ leaves, onAction }: ApprovalsPanelProps) {
  const [optimisticLeaves, setOptimisticLeaves] = useState<Leave[]>(leaves);
  const [errorMap, setErrorMap] = useState<Record<number, string>>({});
  const [selectedLeaveToReject, setSelectedLeaveToReject] = useState<Leave | null>(null);
  const [processingId, setProcessingId] = useState<number | null>(null);

  useEffect(() => {
    setOptimisticLeaves(leaves);
  }, [leaves]);

  const handleApprove = async (leaveId: number) => {
    // Optimistically remove from list
    setOptimisticLeaves((prev) => prev.filter((l) => l.id !== leaveId));
    setErrorMap((prev) => { const n = { ...prev }; delete n[leaveId]; return n; });
    setProcessingId(leaveId);
    try {
      await leaveAPI.update(leaveId, { status: 'Approved' });
      onAction();
    } catch (err) {
      // Restore with error indicator
      setOptimisticLeaves((prev) => {
        const original = leaves.find((l) => l.id === leaveId);
        if (!original) return prev;
        return [...prev, original].sort((a, b) => a.id - b.id);
      });
      setErrorMap((prev) => ({
        ...prev,
        [leaveId]: err instanceof Error ? err.message : 'Approval failed. Please try again.',
      }));
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectSubmit = async (reason: string) => {
    if (!selectedLeaveToReject) return;
    const leaveId = selectedLeaveToReject.id;
    setOptimisticLeaves((prev) => prev.filter((l) => l.id !== leaveId));
    setErrorMap((prev) => { const n = { ...prev }; delete n[leaveId]; return n; });
    setProcessingId(leaveId);
    try {
      await leaveAPI.update(leaveId, { status: 'Rejected', rejection_reason: reason });
      onAction();
    } catch (err) {
      setOptimisticLeaves((prev) => {
        const original = leaves.find((l) => l.id === leaveId);
        if (!original) return prev;
        return [...prev, original].sort((a, b) => a.id - b.id);
      });
      setErrorMap((prev) => ({
        ...prev,
        [leaveId]: err instanceof Error ? err.message : 'Rejection failed. Please try again.',
      }));
    } finally {
      setProcessingId(null);
      setSelectedLeaveToReject(null);
    }
  };

  if (optimisticLeaves.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center text-gray-500">
        <CheckSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
        <p className="font-medium">No pending requests</p>
        <p className="text-sm mt-1">All caught up! New requests will appear here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {optimisticLeaves.map((leave) => (
        <div
          key={leave.id}
          className={`bg-white border rounded-xl p-5 shadow-sm ${errorMap[leave.id] ? 'border-red-200' : 'border-gray-100'}`}
        >
          {errorMap[leave.id] && (
            <div className="flex items-center gap-2 mb-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {errorMap[leave.id]}
            </div>
          )}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="space-y-1 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-900">{leave.employee_name}</span>
                <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                  {leave.type}
                </span>
              </div>
              <p className="text-sm text-gray-600">
                {formatDate(leave.start_date)} — {formatDate(leave.end_date)}
                <span className="ml-2 text-gray-400">
                  ({getDurationDays(leave.start_date, leave.end_date)} day{getDurationDays(leave.start_date, leave.end_date) !== 1 ? 's' : ''})
                </span>
              </p>
              <p className="text-sm text-gray-600 italic">"{leave.reason}"</p>
              <p className="text-xs text-gray-400">Submitted {formatDate(leave.created_at)}</p>
            </div>

            <div className="flex gap-2 flex-shrink-0">
              <Button
                onClick={() => handleApprove(leave.id)}
                disabled={processingId === leave.id}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
              >
                {processingId === leave.id ? '...' : 'Approve'}
              </Button>
              <Button
                onClick={() => setSelectedLeaveToReject(leave)}
                disabled={processingId === leave.id}
                className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 px-4 py-2 rounded-lg text-sm font-medium"
              >
                <X className="w-3.5 h-3.5 mr-1 inline" />
                Reject
              </Button>
            </div>
          </div>
        </div>
      ))}

      <RejectionModal
        isOpen={selectedLeaveToReject !== null}
        onClose={() => setSelectedLeaveToReject(null)}
        onSubmit={handleRejectSubmit}
        leave={selectedLeaveToReject}
      />
    </div>
  );
}
