'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { X, AlertCircle } from 'lucide-react';
import { formatDate } from '@/lib/utils/format';

interface RejectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => Promise<void>;
  leave: {
    id: number;
    employeeName?: string;
    employee_name?: string;
    type: string;
    startDate?: string;
    start_date?: string;
    endDate?: string;
    end_date?: string;
    reason: string;
  } | null;
}

export default function RejectionModal({ isOpen, onClose, onSubmit, leave }: RejectionModalProps) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !leave) return null;

  const employeeName = leave.employeeName || leave.employee_name || 'Employee';
  const startDate = leave.startDate || leave.start_date || '';
  const endDate = leave.endDate || leave.end_date || '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (reason.trim().length < 5) {
      setError('Rejection reason must be at least 5 characters long.');
      return;
    }
    if (reason.trim().length > 500) {
      setError('Rejection reason cannot exceed 500 characters.');
      return;
    }

    setError('');
    setIsSubmitting(true);
    try {
      await onSubmit(reason.trim());
      setReason('');
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Rejection failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-all duration-300">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full border border-gray-100 dark:border-slate-800 overflow-hidden transform scale-100 transition-all duration-300">
        
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2 text-red-600">
            <X className="w-5 h-5" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Reject Leave Request</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Info Card */}
          <div className="p-3.5 bg-red-50/50 dark:bg-red-950/20 border border-red-100/50 dark:border-red-900/30 rounded-xl text-sm space-y-1">
            <p className="font-semibold text-gray-800 dark:text-gray-200">
              {employeeName}
            </p>
            <p className="text-gray-500 dark:text-gray-400">
              Type: <span className="font-medium text-gray-700 dark:text-gray-300">{leave.type}</span>
            </p>
            <p className="text-gray-500 dark:text-gray-400">
              Dates: <span className="font-medium text-gray-700 dark:text-gray-300">{formatDate(startDate)} — {formatDate(endDate)}</span>
            </p>
            <p className="text-gray-500 dark:text-gray-400 italic">
              "{leave.reason}"
            </p>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="rejection_reason" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
              Reason for Rejection <span className="text-red-500">*</span>
            </label>
            <textarea
              id="rejection_reason"
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (e.target.value.trim().length >= 5) setError('');
              }}
              rows={4}
              className="w-full text-black px-3.5 py-2.5 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition bg-white dark:bg-slate-800 dark:text-white"
              placeholder="Explain the reason for rejecting this leave request..."
              required
            />
            <p className="text-[11px] text-gray-400 dark:text-gray-500">
              Minimum 5 characters, maximum 500 characters.
            </p>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400 px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 justify-end pt-3 border-t border-gray-100 dark:border-slate-800">
            <Button
              type="button"
              onClick={onClose}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-gray-300 px-4 py-2 rounded-xl font-semibold transition text-sm"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl font-semibold transition text-sm flex items-center gap-1.5"
            >
              {isSubmitting ? 'Confirming...' : 'Reject Request'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
