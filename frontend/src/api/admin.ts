import { apiClient, extractData } from './client';
import type {
  User,
  AuditLog,
  Payment,
  PaginatedResponse,
  AdminAnalytics,
  AdminDashboard,
  AuditActionType,
} from '../types';

export const adminApi = {
  getDashboard: () =>
    apiClient.get('/admin/dashboard').then((r) => extractData<AdminDashboard>(r)),

  getAnalytics: (period?: 'day' | 'week' | 'month') =>
    apiClient.get('/admin/analytics', { params: { period } }).then((r) => extractData<AdminAnalytics>(r)),

  // Users
  getUsers: (params?: { page?: number; limit?: number; search?: string; status?: string }) =>
    apiClient.get<{ data: PaginatedResponse<User> }>('/users', { params }).then(extractData),

  getUser: (id: string) =>
    apiClient.get<{ data: User }>(`/users/${id}`).then(extractData),

  updateUserStatus: (id: string, status: string) =>
    apiClient.patch(`/users/${id}/status`, { status }).then(extractData),

  updateUserNavRole: (id: string, navRoleId: string | null) =>
    apiClient.patch(`/users/${id}/nav-role`, { navRoleId }).then(extractData),

  // Admin nav roles (Super Admin)
  getNavRoles: () => apiClient.get('/admin-nav-roles').then(extractData),

  createNavRole: (data: { slug: string; name: string; description?: string; menuKeys: string[] }) =>
    apiClient.post('/admin-nav-roles', data).then(extractData),

  updateNavRole: (id: string, data: { name?: string; description?: string; menuKeys?: string[] }) =>
    apiClient.patch(`/admin-nav-roles/${id}`, data).then(extractData),

  deleteNavRole: (id: string) => apiClient.delete(`/admin-nav-roles/${id}`).then(extractData),

  // Payments
  getPayments: (params?: { page?: number; limit?: number; status?: string }) =>
    apiClient.get<{ data: PaginatedResponse<Payment> }>('/payments', { params }).then(extractData),

  getPayment: (id: string) =>
    apiClient.get<{ data: Payment }>(`/payments/${id}`).then(extractData),

  // Audit Logs
  getAuditLogs: (params?: {
    page?: number;
    limit?: number;
    module?: string;
    action?: AuditActionType;
    search?: string;
  }) =>
    apiClient.get<{ data: PaginatedResponse<AuditLog> }>('/audit-logs', { params }).then(extractData),
};
