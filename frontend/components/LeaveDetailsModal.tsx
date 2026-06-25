'use client';

import { Button } from '@/components/ui/button';
import { X, Calendar, User, Clock, Check, AlertTriangle, Building, Tag, FileText } from 'lucide-react';
import { formatDate } from '@/lib/utils/format';

interface LeaveDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  leave: {
    id: number;
    employeeName?: string;
    employee_name?: string;
    employeeEmail?: string;
    employee_email?: string;
    startDate?: string;
    start_date?: string;
    endDate?: string;
    end_date?: string;
    type: string;
    reason: string;
    status: 'Pending' | 'Approved' | 'Rejected';
    rejectionReason?: string;
    rejection_reason?: string;
    approvedByName?: string;
    approved_by_name?: string;
    currentApproverName?: string;
    current_approver_name?: string;
    createdAt?: string;
    created_at?: string;
    approvedAt?: string;
    approved_at?: string;
    rejectedAt?: string;
    rejected_at?: string;
  } | null;
}

function getDurationDays(startDate: string, endDate: string): number {
  if (!startDate || !endDate) return 0;
  const start = new Date(startDate);
  const end = new Date(endDate);
  return Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
}

export default function LeaveDetailsModal({ isOpen, onClose, leave }: LeaveDetailsModalProps) {
  if (!isOpen || !leave) return null;

  const employeeName = leave.employeeName || leave.employee_name || 'Employee';
  const employeeEmail = leave.employeeEmail || leave.employee_email || '';
  const startDate = leave.startDate || leave.start_date || '';
  const endDate = leave.endDate || leave.end_date || '';
  const duration = getDurationDays(startDate, endDate);
  const rejectionReason = leave.rejectionReason || leave.rejection_reason || '';
  const approvedByName = leave.approvedByName || leave.approved_by_name || '';
  const currentApproverName = leave.currentApproverName || leave.current_approver_name || '';
  const createdAt = leave.createdAt || leave.created_at || '';
  const approvedAt = leave.approvedAt || leave.approved_at || '';
  const rejectedAt = leave.rejectedAt || leave.rejected_at || '';

  const getStatusBadge = () => {
    switch (leave.status) {
      case 'Approved':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Check className="w-3 h-3" /> Approved
          </span>
        );
      case 'Rejected':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200">
            <X className="w-3 h-3" /> Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3 animate-pulse" /> Pending
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-all duration-300">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-lg w-full border border-gray-100 dark:border-slate-800 overflow-hidden transform scale-100 transition-all duration-300">
        
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Leave Request Details</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          
          {/* Status and Type */}
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs text-gray-400 dark:text-gray-500 uppercase font-semibold tracking-wider">Status</p>
              <div className="mt-1">{getStatusBadge()}</div>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400 dark:text-gray-500 uppercase font-semibold tracking-wider">Leave Type</p>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100 mt-1">
                <Tag className="w-3.5 h-3.5" /> {leave.type}
              </span>
            </div>
          </div>

          {/* Employee Section */}
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 flex items-start gap-3">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 rounded-lg">
              <User className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900 dark:text-white">{employeeName}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{employeeEmail}</p>
            </div>
          </div>

          {/* Dates and Duration */}
          <div className="grid grid-cols-2 gap-4">
            <div className="border border-gray-100 dark:border-slate-800 rounded-xl p-3.5 flex items-center gap-3">
              <Calendar className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-[11px] text-gray-400 uppercase font-bold tracking-wide">Duration</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">
                  {duration} Day{duration !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <div className="border border-gray-100 dark:border-slate-800 rounded-xl p-3.5">
              <p className="text-[11px] text-gray-400 uppercase font-bold tracking-wide">Leave Dates</p>
              <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 mt-1">
                {formatDate(startDate)} — {formatDate(endDate)}
              </p>
            </div>
          </div>

          {/* Application Reason */}
          <div className="space-y-1.5">
            <p className="text-xs text-gray-400 dark:text-gray-500 uppercase font-semibold tracking-wider">Application Reason</p>
            <div className="bg-gray-50 dark:bg-slate-800/30 rounded-xl p-3.5 border border-gray-100/50 dark:border-slate-800 text-sm text-gray-700 dark:text-gray-300 italic">
              "{leave.reason}"
            </div>
          </div>

          {/* Rejection Alert */}
          {leave.status === 'Rejected' && rejectionReason && (
            <div className="bg-red-50 dark:bg-red-950/20 border border-red-200/50 dark:border-red-900/30 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-red-700 dark:text-red-400 font-semibold text-sm">
                <AlertTriangle className="w-4.5 h-4.5 flex-shrink-0" />
                <span>Rejection Reason</span>
              </div>
              <p className="text-sm text-red-700/90 dark:text-red-300/90 pl-6.5 font-medium">
                "{rejectionReason}"
              </p>
              {approvedByName && (
                <p className="text-[10px] text-red-500/70 dark:text-red-400/70 pl-6.5">
                  Rejected by {approvedByName} {rejectedAt && `on ${formatDate(rejectedAt)}`}
                </p>
              )}
            </div>
          )}

          {/* Approval details for approved/pending requests */}
          {leave.status === 'Approved' && approvedByName && (
            <div className="bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-100/50 dark:border-emerald-900/20 rounded-xl p-4 text-xs space-y-1">
              <p className="font-semibold text-emerald-800 dark:text-emerald-400">
                Approved by {approvedByName}
              </p>
              {approvedAt && (
                <p className="text-gray-400 dark:text-gray-500">
                  Approved on {formatDate(approvedAt)}
                </p>
              )}
            </div>
          )}

          {leave.status === 'Pending' && currentApproverName && (
            <div className="bg-amber-50/50 dark:bg-amber-950/10 border border-amber-100/50 dark:border-amber-900/20 rounded-xl p-4 text-xs space-y-1">
              <p className="font-semibold text-amber-800 dark:text-amber-400">
                Awaiting Approval From
              </p>
              <p className="text-gray-600 dark:text-gray-300 font-medium">
                {currentApproverName}
              </p>
            </div>
          )}

          <div className="text-[10px] text-gray-400 dark:text-gray-500 text-right">
            Submitted on {formatDate(createdAt)}
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-slate-800/50 border-t border-gray-100 dark:border-slate-800 flex justify-end">
          <Button
            onClick={onClose}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-5 py-2 rounded-xl transition text-sm shadow-sm"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
