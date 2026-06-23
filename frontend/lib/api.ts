import axios, { AxiosError } from 'axios';
import { API_BASE_URL } from '@/lib/utils/format';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.response.use(
  (response) => response.data,
  (error: AxiosError<{ message?: string; error?: string }>) => {
    if (
      error.response?.status === 401 &&
      typeof window !== 'undefined' &&
      !window.location.pathname.startsWith('/login')
    ) {
      window.location.href = '/login';
    }
    const errorMessage =
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.message;
    return Promise.reject(new Error(errorMessage));
  }
);

export interface ApiClient {
  get<T = any>(url: string, config?: any): Promise<T>;
  post<T = any>(url: string, data?: any, config?: any): Promise<T>;
  put<T = any>(url: string, data?: any, config?: any): Promise<T>;
  delete<T = any>(url: string, config?: any): Promise<T>;
  patch<T = any>(url: string, data?: any, config?: any): Promise<T>;
}

const api = apiClient as unknown as ApiClient;

export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/api/auth/login', { email, password }),
  me: () => api.get('/api/auth/me'),
  logout: () => api.post('/api/auth/logout'),
};

export const employeeAPI = {
  getAll: () => api.get('/api/employees'),
  getById: (id: number) => api.get(`/api/employees/${id}`),
  create: (data: Record<string, unknown>) => api.post('/api/employees', data),
  update: (id: number, data: Record<string, unknown>) =>
    api.put(`/api/employees/${id}`, data),
  delete: (id: number) => api.delete(`/api/employees/${id}`),
  getHierarchy: () => api.get('/api/employees/hierarchy'),
  updateApprovalPreference: (optIn: boolean) =>
    api.patch('/api/employees/me/approval-preference', { approval_opt_in: optIn }),
};

export const leaveAPI = {
  getAll: () => api.get('/api/leaves'),
  getMine: () => api.get('/api/leaves/user/mine'),
  getById: (id: number) => api.get(`/api/leaves/${id}`),
  create: (data: Record<string, unknown>) => api.post('/api/leaves', data),
  update: (id: number, data: Record<string, unknown>) =>
    api.put(`/api/leaves/${id}`, data),
  getPendingForMe: () => api.get('/api/leaves/pending-for-me'),
};

export const holidayAPI = {
  getAll: () => api.get('/api/holidays'),
  create: (data: Record<string, unknown>) => api.post('/api/holidays', data),
  update: (id: number, data: Record<string, unknown>) =>
    api.put(`/api/holidays/${id}`, data),
  delete: (id: number) => api.delete(`/api/holidays/${id}`),
};

export default api;
