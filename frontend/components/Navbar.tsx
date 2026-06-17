'use client';

import { useAuth } from '@/lib/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-8">
          <Link href="/dashboard" className="text-2xl font-bold text-indigo-600">
            LeaveMS
          </Link>

          <div className="hidden md:flex gap-6">
            <Link href="/dashboard" className="text-gray-700 hover:text-indigo-600 transition">
              Dashboard
            </Link>

            {user?.role === 'employee' && (
              <Link href="/apply-leave" className="text-gray-700 hover:text-indigo-600 transition">
                Apply Leave
              </Link>
            )}

            {user?.role === 'manager' && (
              <Link href="/manager/approvals" className="text-gray-700 hover:text-indigo-600 transition">
                Approvals
              </Link>
            )}

            {user?.role === 'admin' && (
              <>
                <Link href="/admin/employees" className="text-gray-700 hover:text-indigo-600 transition">
                  Employees
                </Link>
                <Link href="/admin/holidays" className="text-gray-700 hover:text-indigo-600 transition">
                  Holidays
                </Link>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-sm">
            <p className="font-semibold text-gray-800">{user?.name}</p>
            <p className="text-gray-600 capitalize">{user?.role}</p>
          </div>
          <Button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition"
          >
            Logout
          </Button>
        </div>
      </div>
    </nav>
  );
}
