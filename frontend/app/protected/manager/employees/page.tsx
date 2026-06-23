'use client';

import RoleGuard from '@/components/RoleGuard';
import EmployeesPanel from '@/components/EmployeesPanel';

export default function ManagerEmployeesPage() {
  return (
    <RoleGuard allowedRoles={['manager']}>
      <EmployeesPanel mode="manager" />
    </RoleGuard>
  );
}
