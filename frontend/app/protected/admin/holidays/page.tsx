'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import axios from 'axios';
import Cookies from 'js-cookie';
import useSWR from 'swr';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://192.168.1.101:5000';

const fetcher = async (url: string) => {
  const token = Cookies.get('authToken');
  const response = await axios.get(url, {
    baseURL: API_BASE_URL,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return response.data;
};

export default function AdminHolidaysPage() {
  const { data: holidays = [], mutate } = useSWR('/api/holidays', fetcher);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    date: '',
    name: '',
    description: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const token = Cookies.get('authToken');
      await axios.post(`${API_BASE_URL}/api/holidays`, formData, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      setFormData({ date: '', name: '', description: '' });
      setShowForm(false);
      mutate();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create holiday');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (holidayId: number) => {
    if (!confirm('Are you sure you want to delete this holiday?')) return;

    try {
      const token = Cookies.get('authToken');
      await axios.delete(`${API_BASE_URL}/api/holidays/${holidayId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      mutate();
    } catch (error) {
      console.error('Failed to delete holiday:', error);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Manage Holidays</h1>
          <p className="text-gray-600">Add and manage company holidays</p>
        </div>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-6 rounded-lg transition"
        >
          {showForm ? 'Cancel' : 'Add Holiday'}
        </Button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow-md p-8 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Add New Holiday</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                  Date
                </label>
                <input
                  id="date"
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  required
                />
              </div>

              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Holiday Name
                </label>
                <input
                  id="name"
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description (Optional)
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              />
            </div>

            {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}

            <div className="flex gap-4">
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-6 rounded-lg transition"
              >
                {isLoading ? 'Creating...' : 'Create Holiday'}
              </Button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {holidays.length === 0 ? (
          <div className="p-6 text-center text-gray-600">
            No holidays found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Date</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Holiday Name</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Description</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {holidays.map((holiday: any) => (
                  <tr key={holiday.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 text-sm font-medium text-gray-800">{formatDate(holiday.date)}</td>
                    <td className="px-6 py-4 text-sm text-gray-800">{holiday.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-800">{holiday.description || '-'}</td>
                    <td className="px-6 py-4 text-sm">
                      <Button
                        onClick={() => handleDelete(holiday.id)}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded transition text-xs"
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
