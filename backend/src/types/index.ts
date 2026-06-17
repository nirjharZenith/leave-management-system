export interface User {
  id: number;
  email: string;
  name: string;
  role_id: number;
  manager_id: number | null;
  created_at: string;
}

export interface Role {
  id: number;
  name: 'admin' | 'manager' | 'employee';
}

export interface Leave {
  id: number;
  employee_id: number;
  start_date: string;
  end_date: string;
  reason: string;
  type: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  created_at: string;
}

export interface Holiday {
  id: number;
  date: string;
  name: string;
  description?: string;
  created_at: string;
}

export interface JWTPayload {
  id: number;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

export interface AuthRequest {
  email: string;
  password: string;
}

export interface CreateEmployeeRequest {
  email: string;
  password: string;
  name: string;
  role_id: number;
  manager_id?: number | null;
}

export interface CreateLeaveRequest {
  start_date: string;
  end_date: string;
  reason: string;
  type: string;
}

export interface ApproveLeaveRequest {
  status: 'Approved' | 'Rejected';
  reason?: string;
}

export interface CreateHolidayRequest {
  date: string;
  name: string;
  description?: string;
}
