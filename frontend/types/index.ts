export interface User {
  id: number;
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'employee';
  department?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Employee {
  id: number;
  email: string;
  name: string;
  role: string;
  department?: string;
  managerId?: number;
  createdAt: string;
}

export interface Leave {
  id: number;
  employeeId: number;
  employeeName?: string;
  startDate: string;
  endDate: string;
  reason: string;
  type: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  approvedBy?: number;
  rejectionReason?: string;
  createdAt: string;
}

export interface Holiday {
  id: number;
  date: string;
  name: string;
  description?: string;
}
