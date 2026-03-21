/**
 * ลำดับใน dropdown — แสดงเฉพาะสกุลที่ Frankfurter มีใน rates (THB มีเสมอ)
 */
export const DISPLAY_CURRENCY_ORDER = [
  'THB',
  'USD',
  'EUR',
  'GBP',
  'SGD',
  'MYR',
  'CNY',
  'JPY',
  'KRW',
  'PHP',
  'HKD',
  'AUD',
  'IDR',
  'INR',
] as const;

export type DisplayCurrencyOption = (typeof DISPLAY_CURRENCY_ORDER)[number];
