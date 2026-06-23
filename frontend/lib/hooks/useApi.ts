'use client';

import useSWR from 'swr';
import apiClient from '@/lib/api';
import { useAuth } from '@/lib/contexts/AuthContext';
import { OrgNode, Leave } from '@/lib/types';

const fetcher = (url: string) => apiClient.get(url);

export function useLeaves() {
  const { isAuthenticated, user } = useAuth();

  const endpoint =
    user?.role === 'employee' ? '/api/leaves/user/mine' : '/api/leaves';

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
    user?.role === 'admin' || user?.role === 'manager' ? '/api/employees' : null,
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

export function useHierarchy() {
  const { isAuthenticated } = useAuth();
  const { data, error, isLoading, mutate } = useSWR(
    isAuthenticated ? '/api/employees/hierarchy' : null,
    fetcher
  );
  return {
    hierarchy: (data ?? []) as OrgNode[],
    isLoading,
    error,
    mutate,
  };
}

export function usePendingForMe() {
  const { isAuthenticated } = useAuth();
  const { data, error, isLoading, mutate } = useSWR(
    isAuthenticated ? '/api/leaves/pending-for-me' : null,
    fetcher,
    { refreshInterval: 30_000 }
  );
  const leaves = (data ?? []) as Leave[];
  return {
    pendingLeaves: leaves,
    pendingCount: leaves.length,
    isLoading,
    error,
    mutate,
  };
}
