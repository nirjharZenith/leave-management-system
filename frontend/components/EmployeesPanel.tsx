'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { employeeAPI } from '@/lib/api';
import { useEmployees } from '@/lib/hooks/useApi';
import { 
  UserPlus, 
  Users, 
  Edit2, 
  Trash2, 
  X, 
  Search, 
  Filter, 
  Briefcase, 
  UserCheck, 
  Shield, 
  Building,
  Mail,
  User,
  Lock
} from 'lucide-react';
import { Employee } from '@/lib/types';

interface EmployeesPanelProps {
  mode: 'admin' | 'manager';
}

export default function EmployeesPanel({ mode }: EmployeesPanelProps) {
  const { employees, isLoading, mutate } = useEmployees();
  const [showForm, setShowForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  
  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [deptFilter, setDeptFilter] = useState('all');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'employee',
    department: '',
    manager_id: '',
    reporting_manager_id: '',
  });

  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    role: 'employee',
    department: '',
    manager_id: '',
    reporting_manager_id: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [editError, setEditError] = useState('');

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const payload: Record<string, unknown> = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        department: formData.department || undefined,
        manager_id: formData.manager_id ? parseInt(formData.manager_id) : null,
        reporting_manager_id: formData.reporting_manager_id ? parseInt(formData.reporting_manager_id) : null,
      };

      if (mode === 'admin') {
        payload.role = formData.role;
      } else {
        payload.role = 'employee';
      }

      await employeeAPI.create(payload);
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'employee',
        department: '',
        manager_id: '',
        reporting_manager_id: '',
      });
      setShowForm(false);
      mutate();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create employee');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmployee) return;
    setEditError('');
    setIsSubmitting(true);

    try {
      const payload: Record<string, unknown> = {
        name: editFormData.name,
        email: editFormData.email,
        role: editFormData.role,
        department: editFormData.department || null,
        manager_id: editFormData.manager_id ? parseInt(editFormData.manager_id) : null,
        reporting_manager_id: editFormData.reporting_manager_id ? parseInt(editFormData.reporting_manager_id) : null,
      };

      await employeeAPI.update(editingEmployee.id, payload);
      setEditingEmployee(null);
      mutate();
    } catch (err: unknown) {
      setEditError(err instanceof Error ? err.message : 'Failed to update employee');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClick = (employee: any) => {
    setEditingEmployee(employee);
    setEditFormData({
      name: employee.name,
      email: employee.email,
      role: employee.role,
      department: employee.department || '',
      manager_id: employee.manager_id ? String(employee.manager_id) : '',
      reporting_manager_id: employee.reporting_manager_id ? String(employee.reporting_manager_id) : '',
    });
    setEditError('');
  };

  const handleDelete = async (employeeId: number) => {
    if (!confirm('Are you sure you want to delete this employee? This will also clean up their leave requests.')) return;

    try {
      await employeeAPI.delete(employeeId);
      mutate();
    } catch (err) {
      console.error('Failed to delete employee:', err);
    }
  };

  const title = mode === 'admin' ? 'Manage Employees' : 'My Team';
  const subtitle =
    mode === 'admin'
      ? 'Add, view, promote, and manage all employee accounts'
      : 'View team members who report to you';

  // Filter candidates for direct manager dropdown (must be manager)
  const managerCandidates = employees.filter(
    (e: any) => e.role === 'manager'
  );

  // Dynamic Statistics
  const totalCount = employees.length;
  const managerCount = employees.filter((e: any) => e.role === 'manager').length;
  const adminCount = employees.filter((e: any) => e.role === 'admin').length;
  const uniqueDepartments = Array.from(new Set(employees.map((e: any) => e.department).filter(Boolean)));

  // Filtered employees list
  const filteredEmployees = employees.filter((e: any) => {
    const matchesSearch = 
      e.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      e.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || e.role === roleFilter;
    const matchesDept = deptFilter === 'all' || e.department === deptFilter;
    return matchesSearch && matchesRole && matchesDept;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2.5 bg-indigo-50 rounded-lg text-indigo-600">
              <Users className="w-6 h-6" />
            </div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">{title}</h1>
          </div>
          <p className="text-gray-500 font-medium">{subtitle}</p>
        </div>
        {mode === 'admin' && (
          <Button
            onClick={() => setShowForm(!showForm)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-6 rounded-lg transition shadow-sm flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            {showForm ? 'Cancel' : 'Add Employee'}
          </Button>
        )}
      </div>

      {/* Statistics Dashboard Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-400">Total Directory</p>
            <p className="text-2xl font-bold text-gray-900 mt-0.5">{totalCount}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-400">Managers</p>
            <p className="text-2xl font-bold text-gray-900 mt-0.5">{managerCount}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-violet-50 rounded-xl text-violet-600">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-400">Administrators</p>
            <p className="text-2xl font-bold text-gray-900 mt-0.5">{adminCount}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
            <Building className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-400">Departments</p>
            <p className="text-2xl font-bold text-gray-900 mt-0.5">{uniqueDepartments.length}</p>
          </div>
        </div>
      </div>

      {/* Add Employee Form */}
      {showForm && mode === 'admin' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
          <div className="flex items-center gap-2 mb-6 border-b border-gray-100 pb-4">
            <UserPlus className="w-5 h-5 text-indigo-600" />
            <h2 className="text-xl font-bold text-gray-900">Add New Employee</h2>
          </div>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="relative">
                <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                  <User className="w-4 h-4 text-gray-400" /> Full Name
                </label>
                <input
                  id="name"
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full text-black px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                  placeholder="John Doe"
                  required
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                  <Mail className="w-4 h-4 text-gray-400" /> Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full text-black px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                  placeholder="john.doe@company.com"
                  required
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-gray-400" /> Temporary Password
                </label>
                <input
                  id="password"
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  minLength={8}
                  className="w-full text-black px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                  placeholder="••••••••"
                  required
                />
              </div>

              <div>
                <label htmlFor="role" className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-gray-400" /> Account Role
                </label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full text-black px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-white transition"
                >
                  <option value="employee">Employee</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div>
                <label htmlFor="department" className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                  <Building className="w-4 h-4 text-gray-400" /> Department
                </label>
                <input
                  id="department"
                  type="text"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  placeholder="e.g. Engineering"
                  className="w-full text-black px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                />
              </div>

              <div>
                <label htmlFor="manager_id" className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-gray-400" /> Direct Manager (Hierarchical Parent)
                </label>
                <select
                  id="manager_id"
                  name="manager_id"
                  value={formData.manager_id}
                  onChange={handleChange}
                  className="w-full text-black px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-white transition"
                >
                  <option value="">None</option>
                  {managerCandidates.map((m: any) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.role})
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label htmlFor="reporting_manager_id" className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                  <Briefcase className="w-4 h-4 text-gray-400" /> Reporting Manager (Direct Leave Approver)
                </label>
                <select
                  id="reporting_manager_id"
                  name="reporting_manager_id"
                  value={formData.reporting_manager_id}
                  onChange={handleChange}
                  className="w-full text-black px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-white transition"
                >
                  <option value="">None</option>
                  {employees
                    .filter((e: any) => e.role !== 'admin')
                    .map((e: any) => (
                      <option key={e.id} value={e.id}>
                        {e.name} ({e.role} - {e.department || 'No department'})
                      </option>
                    ))}
                </select>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm font-medium">
                {error}
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <Button
                type="button"
                onClick={() => setShowForm(false)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-5 py-2.5 rounded-lg font-medium transition"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-6 rounded-lg transition"
              >
                {isSubmitting ? 'Creating...' : 'Create Employee'}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Real-time Search and Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search employees by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-black pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
          />
        </div>

        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="text-gray-400 w-4 h-4" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="text-black border border-gray-200 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
            >
              <option value="all">All Roles</option>
              <option value="employee">Employees</option>
              <option value="manager">Managers</option>
              <option value="admin">Admins</option>
            </select>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Building className="text-gray-400 w-4 h-4" />
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="text-black border border-gray-200 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
            >
              <option value="all">All Departments</option>
              {uniqueDepartments.map((dept: any) => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Edit Employee Modal */}
      {editingEmployee && mode === 'admin' && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-gray-100 max-w-2xl w-full overflow-hidden">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-gray-50">
              <div className="flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-indigo-600" />
                <h2 className="text-xl font-bold text-gray-900">Edit Profile</h2>
              </div>
              <button
                onClick={() => setEditingEmployee(null)}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="edit_name" className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                    <User className="w-4 h-4 text-gray-400" /> Full Name
                  </label>
                  <input
                    id="edit_name"
                    type="text"
                    name="name"
                    value={editFormData.name}
                    onChange={handleEditChange}
                    className="w-full text-black px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="edit_email" className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                    <Mail className="w-4 h-4 text-gray-400" /> Email Address
                  </label>
                  <input
                    id="edit_email"
                    type="email"
                    name="email"
                    value={editFormData.email}
                    onChange={handleEditChange}
                    className="w-full text-black px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="edit_role" className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-gray-400" /> Account Role
                  </label>
                  <select
                    id="edit_role"
                    name="role"
                    value={editFormData.role}
                    onChange={handleEditChange}
                    className="w-full text-black px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-white transition"
                  >
                    <option value="employee">Employee</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="edit_department" className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                    <Building className="w-4 h-4 text-gray-400" /> Department
                  </label>
                  <input
                    id="edit_department"
                    type="text"
                    name="department"
                    value={editFormData.department}
                    onChange={handleEditChange}
                    className="w-full text-black px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                  />
                </div>

                <div>
                  <label htmlFor="edit_manager_id" className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-gray-400" /> Direct Manager
                  </label>
                  <select
                    id="edit_manager_id"
                    name="manager_id"
                    value={editFormData.manager_id}
                    onChange={handleEditChange}
                    className="w-full text-black px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-white transition"
                  >
                    <option value="">None</option>
                    {managerCandidates
                      .filter((e: any) => e.id !== editingEmployee.id)
                      .map((m: any) => (
                        <option key={m.id} value={m.id}>
                          {m.name} ({m.role})
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="edit_reporting_manager_id" className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                    <Briefcase className="w-4 h-4 text-gray-400" /> Reporting Manager
                  </label>
                  <select
                    id="edit_reporting_manager_id"
                    name="reporting_manager_id"
                    value={editFormData.reporting_manager_id}
                    onChange={handleEditChange}
                    className="w-full text-black px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-white transition"
                  >
                    <option value="">None</option>
                    {employees
                      .filter((e: any) => e.id !== editingEmployee.id && e.role !== 'admin')
                      .map((e: any) => (
                        <option key={e.id} value={e.id}>
                          {e.name} ({e.role})
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {editError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm font-medium">
                  {editError}
                </div>
              )}

              <div className="flex gap-3 justify-end pt-4 border-t border-gray-100">
                <Button
                  type="button"
                  onClick={() => setEditingEmployee(null)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-5 py-2 rounded-lg font-medium transition"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg font-medium transition"
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Directory Table Grid */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
            <p className="mt-4 text-gray-500 font-semibold">Loading employees...</p>
          </div>
        ) : filteredEmployees.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="font-semibold text-lg text-gray-700">No employees found</p>
            <p className="text-sm text-gray-400 mt-1">
              Try adjusting your search query or role/department filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50/80 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Department</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Manager</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Reporting Manager</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Opt-In</th>
                  {mode === 'admin' && (
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredEmployees.map((employee: any) => (
                  <tr key={employee.id} className="hover:bg-gray-50/50 transition">
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">{employee.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{employee.email}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${
                        employee.role === 'admin'
                          ? 'bg-red-50 text-red-700 border border-red-100'
                          : employee.role === 'manager'
                          ? 'bg-blue-50 text-blue-700 border border-blue-100'
                          : 'bg-slate-50 text-slate-700 border border-slate-100'
                      }`}>
                        {employee.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{employee.department || '—'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 font-medium">{employee.manager_name || '—'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 font-medium">{employee.reporting_manager_name || '—'}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        employee.approval_opt_in
                          ? 'bg-green-50 text-green-700 border border-green-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {employee.approval_opt_in ? 'Opt-In' : 'Opt-Out'}
                      </span>
                    </td>
                    {mode === 'admin' && (
                      <td className="px-6 py-4 text-sm">
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleEditClick(employee)}
                            className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-3 py-1.5 rounded-lg transition text-xs font-semibold flex items-center gap-1"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            Edit
                          </Button>
                          <Button
                            onClick={() => handleDelete(employee.id)}
                            className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 px-3 py-1.5 rounded-lg transition text-xs font-semibold flex items-center gap-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Delete
                          </Button>
                        </div>
                      </td>
                    )}
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
