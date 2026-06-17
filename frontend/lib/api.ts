import axios, { AxiosError } from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://192.168.1.101:5000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Handle responses and errors
apiClient.interceptors.response.use(
  (response) => response.data,
  (error: AxiosError<any>) => {
    if (error.response?.status === 401) {
      // Clear cookies and redirect to login
      window.location.href = '/login';
    }
    const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message;
    return Promise.reject(new Error(errorMessage));
  }
);

export const authAPI = {
  login: (email: string, password: string) =>
    apiClient.post('/api/auth/login', { email, password }),
};

export const employeeAPI = {
  getAll: () => apiClient.get('/api/employees'),
  getById: (id: number) => apiClient.get(`/api/employees/${id}`),
  create: (data: any) => apiClient.post('/api/employees', data),
  update: (id: number, data: any) => apiClient.put(`/api/employees/${id}`, data),
  delete: (id: number) => apiClient.delete(`/api/employees/${id}`),
};

export const leaveAPI = {
  getAll: () => apiClient.get('/api/leaves'),
  getMine: () => apiClient.get('/api/leaves/mine'),
  getById: (id: number) => apiClient.get(`/api/leaves/${id}`),
  create: (data: any) => apiClient.post('/api/leaves', data),
  update: (id: number, data: any) => apiClient.put(`/api/leaves/${id}`, data),
};

export const holidayAPI = {
  getAll: () => apiClient.get('/api/holidays'),
  create: (data: any) => apiClient.post('/api/holidays', data),
  update: (id: number, data: any) => apiClient.put(`/api/holidays/${id}`, data),
  delete: (id: number) => apiClient.delete(`/api/holidays/${id}`),
};

export default apiClient;
