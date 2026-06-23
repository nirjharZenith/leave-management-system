export interface Employee {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'employee';
  department: string | null;
  manager_id: number | null;
  manager_name: string | null;
  reporting_manager_id: number | null;
  reporting_manager_name: string | null;
  approval_opt_in: boolean;
  created_at: string;
}

export interface OrgNode {
  id: number;
  name: string;
  role: 'admin' | 'manager' | 'employee';
  department: string | null;
  reporting_manager_id: number | null;
  children: OrgNode[];
}

export interface Leave {
  id: number;
  employee_id: number;
  employee_name: string;
  employee_email?: string;
  start_date: string;
  end_date: string;
  reason: string;
  type: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  approved_by: number | null;
  approved_by_name: string | null;
  rejection_reason: string | null;
  current_approver_id: number | null;
  current_approver_name: string | null;
  chain_length: number;
  approved_at: string | null;
  rejected_at: string | null;
  approval_chain_snapshot: number[] | null;
  created_at: string;
  updated_at: string;
}
