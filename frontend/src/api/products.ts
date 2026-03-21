import { apiClient, extractData } from './client';
import type { Product, ProductCategory, PaginatedResponse } from '../types';

export const productsApi = {
  getCategories: () =>
    apiClient.get<{ data: ProductCategory[] }>('/products/categories').then(extractData),

  getProducts: (params?: { search?: string; categoryId?: string; page?: number; limit?: number }) =>
    apiClient.get<{ data: PaginatedResponse<Product> }>('/products', { params }).then(extractData),

  getProduct: (id: string) =>
    apiClient.get<{ data: Product }>(`/products/${id}`).then(extractData),

  // Admin
  createCategory: (data: Partial<ProductCategory>) =>
    apiClient.post('/products/categories', data).then(extractData),

  updateCategory: (id: string, data: Partial<ProductCategory>) =>
    apiClient.patch(`/products/categories/${id}`, data).then(extractData),

  createProduct: (data: Partial<Product>) =>
    apiClient.post('/products', data).then(extractData),

  updateProduct: (id: string, data: Partial<Product>) =>
    apiClient.patch(`/products/${id}`, data).then(extractData),

  deleteProduct: (id: string) =>
    apiClient.delete(`/products/${id}`).then(extractData),
};
