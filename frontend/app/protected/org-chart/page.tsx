'use client';

import { useHierarchy } from '@/lib/hooks/useApi';
import OrgChartTree from '@/components/OrgChartTree';
import { Network } from 'lucide-react';

export default function OrgChartPage() {
  const { hierarchy, isLoading, error } = useHierarchy();

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2.5 bg-indigo-50 rounded-lg text-indigo-600">
            <Network className="w-6 h-6" />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Organization Chart</h1>
        </div>
        <p className="text-gray-500 font-medium">Visual representation of company reporting hierarchy and lines of command.</p>
      </div>

      {/* Main Org Tree Container */}
      <div className="bg-white rounded-xl border border-gray-100 p-8 shadow-sm overflow-x-auto min-h-[500px]">
        {isLoading ? (
          <div className="p-12 text-center flex flex-col items-center justify-center min-h-[300px]">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
            <p className="mt-4 text-gray-500 font-semibold">Loading organization structure...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center bg-red-50 border border-red-100 rounded-xl text-red-600">
            <p className="font-semibold">Error loading organization chart</p>
            <p className="text-sm mt-1">{error.message || 'Please check your connection and try again.'}</p>
          </div>
        ) : hierarchy && hierarchy.length > 0 ? (
          <div className="inline-block min-w-full">
            <OrgChartTree nodes={hierarchy} />
          </div>
        ) : (
          <div className="p-12 text-center text-gray-500 min-h-[300px] flex flex-col items-center justify-center">
            <Network className="w-12 h-12 text-gray-300 mb-3" />
            <p className="font-bold text-lg text-gray-700">No hierarchy data available</p>
            <p className="text-sm text-gray-400 mt-1">Please ensure employees are created and assigned to managers.</p>
          </div>
        )}
      </div>
    </div>
  );
}
