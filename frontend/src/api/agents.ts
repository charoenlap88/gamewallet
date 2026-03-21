import { apiClient, extractData } from './client';

export const agentsApi = {
  getMySummary: () => apiClient.get('/agents/me/summary').then(extractData),
  getMyCustomers: (params?: { page?: number; limit?: number }) =>
    apiClient.get('/agents/me/customers', { params }).then(extractData),
};
