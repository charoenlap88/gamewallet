import { apiClient, extractData } from './client';
import type { WalletTransaction, PaginatedResponse } from '../types';

export const walletApi = {
  getBalance: () =>
    apiClient.get<{ data: { balance: string; walletId: string } }>('/wallet/balance').then(extractData),

  topup: (data: { amount: number; description?: string }) =>
    apiClient.post('/wallet/topup', data).then(extractData),

  getTransactions: (params?: { page?: number; limit?: number }) =>
    apiClient.get<{ data: PaginatedResponse<WalletTransaction> }>('/wallet/transactions', { params }).then(extractData),

  /** สร้าง Omise Charge เติมเงิน — ส่ง token จาก Omise.js หรือ source id (พร้อมเพย์ ฯลฯ) */
  createOmiseTopupCharge: (data: { amount: number; card?: string; source?: string }) =>
    apiClient.post('/wallet/omise/charges', data).then((res) => extractData(res)),
};
