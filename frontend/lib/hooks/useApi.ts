'use client';

import useSWR from 'swr';
import axios from 'axios';
import { useAuth } from '@/lib/contexts/AuthContext';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://192.168.1.101:5000';

const fetcher = async (url: string) => {
  const response = await axios.get(`${API_BASE_URL}${url}`, {
    withCredentials: true,
  });

  return response.data;
};

export function useLeaves() {
  const { isAuthenticated, user } = useAuth();

  const endpoint =
    user?.role === 'employee'
      ? '/api/leaves/mine'
      : '/api/leaves';

  const { data, error, isLoading, mutate } = useSWR(
    isAuthenticated ? endpoint : null,
    fetcher
  );

  return {
    leaves: data ?? [],
    isLoading,
    error,
    mutate,
  };
}

export function useEmployees() {
  const { user } = useAuth();

  const { data, error, isLoading, mutate } = useSWR(
    user?.role === 'admin' ? '/api/employees' : null,
    fetcher
  );

  return {
    employees: data ?? [],
    isLoading,
    error,
    mutate,
  };
}

export function useHolidays() {
  const { isAuthenticated } = useAuth();

  const { data, error, isLoading, mutate } = useSWR(
    isAuthenticated ? '/api/holidays' : null,
    fetcher
  );

  return {
    holidays: data ?? [],
    isLoading,
    error,
    mutate,
  };
}