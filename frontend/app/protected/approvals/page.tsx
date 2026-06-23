'use client';

import { usePendingForMe } from '@/lib/hooks/useApi';
import ApprovalsPanel from '@/components/ApprovalsPanel';
import { CheckSquare } from 'lucide-react';

export default function ApprovalsPage() {
  const { pendingLeaves, isLoading, mutate } = usePendingForMe();

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 bg-indigo-100 rounded-lg">
          <CheckSquare className="w-6 h-6 text-indigo-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Approvals</h1>
      </div>
      <p className="text-gray-600 mb-8">Review and action leave requests where you are the designated approver.</p>

      {isLoading ? (
        <div className="p-12 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
          <p className="mt-4 text-gray-500">Loading pending requests...</p>
        </div>
      ) : (
        <ApprovalsPanel leaves={pendingLeaves} onAction={mutate} />
      )}
    </div>
  );
}
