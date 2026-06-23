'use client';

import { useAuth } from '@/lib/contexts/AuthContext';
import ApprovalPreferenceToggle from '@/components/ApprovalPreferenceToggle';
import { Settings } from 'lucide-react';
import useSWR from 'swr';
import apiClient from '@/lib/api';

const fetcher = (url: string) => apiClient.get(url);

export default function SettingsPage() {
  const { user, isAuthenticated } = useAuth();

  const { data: employee, error, isLoading, mutate } = useSWR(
    isAuthenticated && user?.id ? `/api/employees/${user.id}` : null,
    fetcher
  );

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 bg-indigo-100 rounded-lg">
          <Settings className="w-6 h-6 text-indigo-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
      </div>
      <p className="text-gray-600 mb-8">Manage your profile configurations and approval preferences.</p>

      {isLoading ? (
        <div className="p-12 text-center bg-white border border-gray-200 rounded-xl shadow-sm">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
          <p className="mt-4 text-gray-500 font-medium">Loading settings...</p>
        </div>
      ) : error ? (
        <div className="p-8 text-center bg-white border border-red-200 rounded-xl shadow-sm text-red-600">
          <p className="font-semibold">Error loading settings</p>
          <p className="text-sm mt-1">{error.message || 'Please try again later.'}</p>
        </div>
      ) : employee ? (
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Profile Information</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Full Name</p>
                <p className="text-base text-gray-900 mt-0.5">{employee.name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Email Address</p>
                <p className="text-base text-gray-900 mt-0.5">{employee.email}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Role</p>
                <p className="text-base text-gray-900 capitalize mt-0.5">{employee.role}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Department</p>
                <p className="text-base text-gray-900 mt-0.5">{employee.department || '—'}</p>
              </div>
            </div>
          </div>

          <ApprovalPreferenceToggle
            currentValue={!!employee.approval_opt_in}
            onUpdate={() => mutate()}
          />
        </div>
      ) : null}
    </div>
  );
}
