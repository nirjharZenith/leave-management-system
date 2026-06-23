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

export const authAPI = {
  login: (email: string, password: string) =>
    apiClient.post('/api/auth/login', { email, password }),
  me: () => apiClient.get('/api/auth/me'),
  logout: () => apiClient.post('/api/auth/logout'),
};

export const employeeAPI = {
  getAll: () => apiClient.get('/api/employees'),
  getById: (id: number) => apiClient.get(`/api/employees/${id}`),
  create: (data: Record<string, unknown>) => apiClient.post('/api/employees', data),
  update: (id: number, data: Record<string, unknown>) =>
    apiClient.put(`/api/employees/${id}`, data),
  delete: (id: number) => apiClient.delete(`/api/employees/${id}`),
  getHierarchy: () => apiClient.get('/api/employees/hierarchy'),
  updateApprovalPreference: (optIn: boolean) =>
    apiClient.patch('/api/employees/me/approval-preference', { approval_opt_in: optIn }),
};

export const leaveAPI = {
  getAll: () => apiClient.get('/api/leaves'),
  getMine: () => apiClient.get('/api/leaves/user/mine'),
  getById: (id: number) => apiClient.get(`/api/leaves/${id}`),
  create: (data: Record<string, unknown>) => apiClient.post('/api/leaves', data),
  update: (id: number, data: Record<string, unknown>) =>
    apiClient.put(`/api/leaves/${id}`, data),
  getPendingForMe: () => apiClient.get('/api/leaves/pending-for-me'),
};

export const holidayAPI = {
  getAll: () => apiClient.get('/api/holidays'),
  create: (data: Record<string, unknown>) => apiClient.post('/api/holidays', data),
  update: (id: number, data: Record<string, unknown>) =>
    apiClient.put(`/api/holidays/${id}`, data),
  delete: (id: number) => apiClient.delete(`/api/holidays/${id}`),
};

export default apiClient;
