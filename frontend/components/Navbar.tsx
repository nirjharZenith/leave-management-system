'use client';

import { useAuth } from '@/lib/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  CalendarPlus,
  CheckSquare,
  Users,
  Calendar,
  LogOut,
  Network,
  Settings2,
} from 'lucide-react';
import { usePendingForMe } from '@/lib/hooks/useApi';

const navItems = [
  { href: '/protected/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'manager', 'employee'] },
  { href: '/protected/apply-leave', label: 'Apply Leave', icon: CalendarPlus, roles: ['employee'] },
  { href: '/protected/approvals', label: 'Approvals', icon: CheckSquare, roles: ['admin'] },
  { href: '/protected/manager/approvals', label: 'Approvals', icon: CheckSquare, roles: ['manager'] },
  { href: '/protected/admin/employees', label: 'Employees', icon: Users, roles: ['admin'] },
  { href: '/protected/admin/holidays', label: 'Holidays', icon: Calendar, roles: ['admin'] },
  { href: '/protected/org-chart', label: 'Org Chart', icon: Network, roles: ['admin', 'manager', 'employee'] },
  { href: '/protected/settings', label: 'Settings', icon: Settings2, roles: ['admin', 'manager', 'employee'] },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { pendingCount } = usePendingForMe();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const visibleItems = navItems.filter((item) =>
    user?.role ? item.roles.includes(user.role) : false
  );

  // For non-manager/non-admin roles (e.g. employees who are also reporting managers),
  // show Approvals link when they have pending items.
  const showReportingManagerLinks = user?.role === 'employee' && pendingCount > 0;

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex justify-between items-center">
        <div className="flex items-center gap-6 lg:gap-10">
          <Link href="/protected/dashboard" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Calendar className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900 group-hover:text-indigo-600 transition">
              LeaveMS
            </span>
          </Link>

          <div className="hidden md:flex gap-1">
            {visibleItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              const isManagerApprovals = item.href === '/protected/manager/approvals';
              const isApprovals = item.href === '/protected/approvals';
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-gray-600 hover:text-indigo-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                  {(isManagerApprovals || isApprovals) && pendingCount > 0 && (
                    <span className="ml-1 inline-flex items-center justify-center w-5 h-5 text-xs font-bold bg-red-500 text-white rounded-full">
                      {pendingCount > 99 ? '99+' : pendingCount}
                    </span>
                  )}
                </Link>
              );
            })}

            {showReportingManagerLinks && (
              <Link
                href="/protected/approvals"
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition ${
                  pathname === '/protected/approvals'
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-gray-600 hover:text-indigo-600 hover:bg-gray-50'
                }`}
              >
                <CheckSquare className="w-4 h-4" />
                Approvals
                <span className="ml-1 inline-flex items-center justify-center w-5 h-5 text-xs font-bold bg-red-500 text-white rounded-full">
                  {pendingCount > 99 ? '99+' : pendingCount}
                </span>
              </Link>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:block text-right">
            <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
            <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
          </div>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="flex items-center gap-2 text-gray-600 hover:text-red-600 hover:border-red-200"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>
      </div>

      <div className="md:hidden border-t border-gray-100 px-4 py-2 flex gap-1 overflow-x-auto">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          const isManagerApprovals = item.href === '/protected/manager/approvals';
          const isApprovals = item.href === '/protected/approvals';
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                isActive
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {item.label}
              {(isManagerApprovals || isApprovals) && pendingCount > 0 && (
                <span className="ml-1 inline-flex items-center justify-center w-5 h-5 text-xs font-bold bg-red-500 text-white rounded-full">
                  {pendingCount > 99 ? '99+' : pendingCount}
                </span>
              )}
            </Link>
          );
        })}

        {showReportingManagerLinks && (
          <Link
            href="/protected/approvals"
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition ${
              pathname === '/protected/approvals'
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5" />
            Approvals
            <span className="ml-1 inline-flex items-center justify-center w-5 h-5 text-xs font-bold bg-red-500 text-white rounded-full">
              {pendingCount > 99 ? '99+' : pendingCount}
            </span>
          </Link>
        )}
      </div>
    </nav>
  );
}
