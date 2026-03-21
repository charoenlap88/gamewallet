import { apiClient, extractData } from './client';
import type { Payment, PaginatedResponse } from '../types';

export const paymentsApi = {
  getMyPayments: (params?: { page?: number; limit?: number; status?: string }) =>
    apiClient.get<{ data: PaginatedResponse<Payment> }>('/payments/my', { params }).then(extractData),
};
