import { apiClient, extractData } from './client';
import type { Order, PaginatedResponse } from '../types';

export const ordersApi = {
  // Customer
  createOrder: (data: { items: { productId: string; quantity?: number }[]; paymentMethod: string; notes?: string }) =>
    apiClient.post<{ data: Order }>('/orders', data).then(extractData),

  getMyOrders: (params?: { page?: number; limit?: number; status?: string }) =>
    apiClient.get<{ data: PaginatedResponse<Order> }>('/orders/my', { params }).then(extractData),

  getMyOrder: (id: string) =>
    apiClient.get<{ data: Order }>(`/orders/my/${id}`).then(extractData),

  cancelMyOrder: (id: string) =>
    apiClient.patch(`/orders/my/${id}/cancel`).then(extractData),

  // Admin
  getAllOrders: (params?: { page?: number; limit?: number; status?: string; userId?: string }) =>
    apiClient.get<{ data: PaginatedResponse<Order> }>('/orders', { params }).then(extractData),

  getOrder: (id: string) =>
    apiClient.get<{ data: Order }>(`/orders/${id}`).then(extractData),

  cancelOrder: (id: string) =>
    apiClient.patch(`/orders/${id}/cancel`).then(extractData),

  /** Admin: PENDING → PROCESSING */
  markOrderProcessing: (id: string) =>
    apiClient.patch(`/orders/${id}/mark-processing`).then(extractData),

  /** Admin: จบงานด้วยมือ → SUCCESS */
  markOrderComplete: (id: string) =>
    apiClient.patch(`/orders/${id}/mark-complete`).then(extractData),

  /** Admin: ลากวางบอร์ด / เปลี่ยนสถานะ */
  adminSetOrderStatus: (id: string, status: string) =>
    apiClient.patch(`/orders/${id}/admin-status`, { status }).then(extractData),

  retryItem: (itemId: string) =>
    apiClient.patch(`/orders/items/${itemId}/retry`).then(extractData),

  getDashboardStats: () =>
    apiClient.get('/orders/dashboard/stats').then(extractData),
};
