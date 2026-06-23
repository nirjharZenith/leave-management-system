export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export function formatDate(date: string | undefined | null): string {
  if (!date) return '—';
  const [year, month, day] = date.split('T')[0].split('-').map(Number);
  const d = new Date(year, month - 1, day);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function mapLeave(raw: Record<string, unknown>) {
  return {
    id: raw.id as number,
    employeeId: (raw.employeeId ?? raw.employee_id) as number,
    employeeName: (raw.employeeName ?? raw.employee_name) as string | undefined,
    startDate: (raw.startDate ?? raw.start_date) as string,
    endDate: (raw.endDate ?? raw.end_date) as string,
    reason: raw.reason as string,
    type: raw.type as string,
    status: raw.status as 'Pending' | 'Approved' | 'Rejected',
    approvedBy: (raw.approvedBy ?? raw.approved_by) as number | undefined,
    rejectionReason: (raw.rejectionReason ?? raw.rejection_reason) as string | undefined,
    createdAt: (raw.createdAt ?? raw.created_at) as string,
  };
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'Approved':
      return 'bg-emerald-100 text-emerald-800';
    case 'Rejected':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-amber-100 text-amber-800';
  }
}

export const ROLE_IDS: Record<string, number> = {
  admin: 1,
  manager: 2,
  employee: 3,
};
