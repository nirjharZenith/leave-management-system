'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import RoleGuard from '@/components/RoleGuard';
import { leaveAPI } from '@/lib/api';
import { useHolidays } from '@/lib/hooks/useApi';
import { formatDate } from '@/lib/utils/format';
import { CalendarPlus } from 'lucide-react';

export default function ApplyLeavePage() {
  return (
    <RoleGuard allowedRoles={['employee']}>
      <ApplyLeaveContent />
    </RoleGuard>
  );
}

function ApplyLeaveContent() {
  const router = useRouter();
  const { holidays } = useHolidays();

  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    type: 'Annual',
    reason: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (new Date(formData.startDate) > new Date(formData.endDate)) {
      setError('Start date cannot be after end date.');
      return;
    }

    if (formData.reason.trim().length < 5) {
      setError('Reason must be at least 5 characters.');
      return;
    }

    setIsLoading(true);

    try {
      await leaveAPI.create({
        start_date: formData.startDate,
        end_date: formData.endDate,
        type: formData.type,
        reason: formData.reason.trim(),
      });

      setSuccess('Leave request submitted successfully!');
      setTimeout(() => router.push('/protected/dashboard'), 1200);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to apply for leave.');
    } finally {
      setIsLoading(false);
    }
  };

  const upcomingHolidays = (holidays ?? [])
    .filter((h: Record<string, unknown>) => new Date(h.date as string) >= new Date())
    .slice(0, 5);

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 bg-indigo-100 rounded-lg">
          <CalendarPlus className="w-6 h-6 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Apply for Leave</h1>
          <p className="text-gray-600">Submit a new leave request for manager approval</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date
                  </label>
                  <input
                    id="startDate"
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleChange}
                    required
                    className="w-full text-black px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">
                    End Date
                  </label>
                  <input
                    id="endDate"
                    type="date"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleChange}
                    required
                    className="w-full text-black px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
                  Leave Type
                </label>
                <select
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="w-full text-black px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                >
                  <option value="Annual">Annual</option>
                  <option value="Sick">Sick</option>
                  <option value="Maternity">Maternity</option>
                  <option value="Paternity">Paternity</option>
                  <option value="Unpaid">Unpaid</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-2">
                  Reason
                </label>
                <textarea
                  id="reason"
                  name="reason"
                  rows={4}
                  required
                  minLength={5}
                  value={formData.reason}
                  onChange={handleChange}
                  placeholder="Please provide a reason for your leave request"
                  className="w-full text-black px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
                  {error}
                </div>
              )}
              {success && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg px-4 py-3 text-sm">
                  {success}
                </div>
              )}

              <div className="flex gap-4">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-6 rounded-lg"
                >
                  {isLoading ? 'Submitting...' : 'Submit Request'}
                </Button>
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium py-2.5 px-6 rounded-lg transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>

        {upcomingHolidays.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-fit">
            <h3 className="font-semibold text-gray-900 mb-4">Upcoming Holidays</h3>
            <ul className="space-y-3">
              {upcomingHolidays.map((h: Record<string, unknown>) => (
                <li key={h.id as number} className="flex justify-between text-sm">
                  <span className="text-gray-700">{h.name as string}</span>
                  <span className="text-gray-500">{formatDate(h.date as string)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
