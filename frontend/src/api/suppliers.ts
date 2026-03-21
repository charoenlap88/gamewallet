import { apiClient, extractData } from './client';
import type { Supplier, SupplierApiKey, SupplierResponseMapping } from '../types';

export const suppliersApi = {
  getAll: () =>
    apiClient.get<{ data: Supplier[] }>('/suppliers').then(extractData),

  getOne: (id: string) =>
    apiClient.get<{ data: Supplier }>(`/suppliers/${id}`).then(extractData),

  create: (data: Partial<Supplier>) =>
    apiClient.post('/suppliers', data).then(extractData),

  update: (id: string, data: Partial<Supplier>) =>
    apiClient.patch(`/suppliers/${id}`, data).then(extractData),

  addApiKey: (supplierId: string, data: Partial<SupplierApiKey> & { keyValue?: string }) =>
    apiClient.post(`/suppliers/${supplierId}/api-keys`, data).then(extractData),

  updateApiKeyStatus: (keyId: string, data: { status: string }) =>
    apiClient.patch(`/suppliers/api-keys/${keyId}/status`, data).then(extractData),

  deleteApiKey: (keyId: string) =>
    apiClient.delete(`/suppliers/api-keys/${keyId}`).then(extractData),

  addMapping: (supplierId: string, data: Partial<SupplierResponseMapping>) =>
    apiClient.post(`/suppliers/${supplierId}/mappings`, data).then(extractData),

  updateMapping: (mappingId: string, data: Partial<SupplierResponseMapping>) =>
    apiClient.patch(`/suppliers/mappings/${mappingId}`, data).then(extractData),

  deleteMapping: (mappingId: string) =>
    apiClient.delete(`/suppliers/mappings/${mappingId}`).then(extractData),
};
