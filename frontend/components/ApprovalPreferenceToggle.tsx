'use client';

import { useState } from 'react';
import { employeeAPI } from '@/lib/api';

interface ApprovalPreferenceToggleProps {
  currentValue: boolean;
  onUpdate?: (newValue: boolean) => void;
}

export default function ApprovalPreferenceToggle({
  currentValue,
  onUpdate,
}: ApprovalPreferenceToggleProps) {
  const [optIn, setOptIn] = useState(currentValue);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    const newValue = !optIn;
    setLoading(true);
    setError('');
    try {
      await employeeAPI.updateApprovalPreference(newValue);
      setOptIn(newValue);
      onUpdate?.(newValue);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update preference');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="font-semibold text-gray-900">Receive leave approval requests</p>
          <p className="text-sm text-gray-500 mt-0.5">
            {optIn
              ? 'You will receive leave requests from employees who report to you.'
              : 'Leave requests will be escalated to the next approver in the chain.'}
          </p>
        </div>
        <button
          onClick={handleToggle}
          disabled={loading}
          aria-pressed={optIn}
          aria-label="Toggle approval preference"
          className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
            loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
          } ${optIn ? 'bg-indigo-600' : 'bg-gray-200'}`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${
              optIn ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>
      {error && (
        <p className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}
    </div>
  );
}
