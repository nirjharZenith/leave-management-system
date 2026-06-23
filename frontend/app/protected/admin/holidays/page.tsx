'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import RoleGuard from '@/components/RoleGuard';
import { holidayAPI } from '@/lib/api';
import { useHolidays } from '@/lib/hooks/useApi';
import { formatDate } from '@/lib/utils/format';
import { Calendar } from 'lucide-react';

export default function AdminHolidaysPage() {
  return (
    <RoleGuard allowedRoles={['admin']}>
      <HolidaysContent />
    </RoleGuard>
  );
}

function HolidaysContent() {
  const { holidays, isLoading, mutate } = useHolidays();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ date: '', name: '', description: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await holidayAPI.create(formData);
      setFormData({ date: '', name: '', description: '' });
      setShowForm(false);
      mutate();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create holiday');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (holidayId: number) => {
    if (!confirm('Are you sure you want to delete this holiday?')) return;

    try {
      await holidayAPI.delete(holidayId);
      mutate();
    } catch (err) {
      console.error('Failed to delete holiday:', err);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Calendar className="w-6 h-6 text-indigo-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Manage Holidays</h1>
          </div>
          <p className="text-gray-600">Add and manage company-wide holidays</p>
        </div>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-6 rounded-lg transition"
        >
          {showForm ? 'Cancel' : 'Add Holiday'}
        </Button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Add New Holiday</h2>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Date
                </label>
                <input
                  id="date"
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  required
                />
              </div>
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Holiday Name
                </label>
                <input
                  id="name"
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  required
                />
              </div>
            </div>
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1.5">
                Description (Optional)
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              />
            </div>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-6 rounded-lg"
            >
              {isSubmitting ? 'Creating...' : 'Create Holiday'}
            </Button>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
          </div>
        ) : holidays.length === 0 ? (
          <div className="p-12 text-center text-gray-500">No holidays found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50/80 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Holiday</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Description</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {holidays.map((holiday: Record<string, unknown>) => (
                  <tr key={holiday.id as number} className="hover:bg-gray-50/50 transition">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {formatDate(holiday.date as string)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{holiday.name as string}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {(holiday.description as string) || '—'}
                    </td>
                    <td className="px-6 py-4">
                      <Button
                        onClick={() => handleDelete(holiday.id as number)}
                        className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 px-3 py-1.5 rounded-lg text-xs font-medium"
                      >
                        Delete
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
