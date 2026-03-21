import { apiClient, extractData } from './client';

export type CurrencyRatesResponse = {
  base: 'THB';
  date: string;
  rates: Record<string, number>;
  source: string;
  cachedAt: string;
};

export const currencyApi = {
  getRates: async (): Promise<CurrencyRatesResponse> => {
    const res = await apiClient.get('/currency/rates');
    return extractData(res);
  },
};
