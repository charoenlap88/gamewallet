import { apiClient, extractData } from './client';
import type { NewsArticle, PaginatedResponse } from '../types';

export const newsApi = {
  list: (params?: { page?: number; limit?: number }): Promise<PaginatedResponse<NewsArticle>> =>
    apiClient.get('/news', { params }).then((res) => extractData<PaginatedResponse<NewsArticle>>(res)),

  getBySlug: (slug: string): Promise<NewsArticle> =>
    apiClient.get(`/news/${encodeURIComponent(slug)}`).then((res) => extractData<NewsArticle>(res)),

  adminList: (params?: { page?: number; limit?: number }): Promise<PaginatedResponse<NewsArticle>> =>
    apiClient.get('/admin/news', { params }).then((res) => extractData<PaginatedResponse<NewsArticle>>(res)),

  create: (data: {
    title: string;
    excerpt?: string;
    coverImageUrl?: string;
    body: string;
    isPublished?: boolean;
    pinned?: boolean;
  }): Promise<NewsArticle> =>
    apiClient.post('/admin/news', data).then((res) => extractData<NewsArticle>(res)),

  update: (
    id: string,
    data: Partial<{
      title: string;
      excerpt: string;
      coverImageUrl: string;
      body: string;
      isPublished: boolean;
      pinned: boolean;
    }>,
  ): Promise<NewsArticle> =>
    apiClient.patch(`/admin/news/${id}`, data).then((res) => extractData<NewsArticle>(res)),

  remove: (id: string) => apiClient.delete(`/admin/news/${id}`).then((res) => extractData(res)),
};
