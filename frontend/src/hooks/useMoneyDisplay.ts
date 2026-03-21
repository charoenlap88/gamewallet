import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { currencyApi } from '../api/currency';
import { useDisplayCurrencyStore } from '../stores/displayCurrencyStore';
import { useAppLocale } from '../i18n/useAppLocale';

/**
 * ราคาใน API/DB เป็นบาท (THB) เสมอ — แปลงแสดงผลตามสกุลที่เลือก (Frankfurter rates)
 */
export function useMoneyDisplay() {
  const locale = useAppLocale();
  const displayCurrency = useDisplayCurrencyStore((s) => s.displayCurrency);
  const setDisplayCurrency = useDisplayCurrencyStore((s) => s.setDisplayCurrency);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['currency-rates-thb'],
    queryFn: currencyApi.getRates,
    staleTime: 55 * 60 * 1000,
    gcTime: 2 * 60 * 60 * 1000,
    retry: 2,
  });

  const rates = data?.rates;

  const format = useCallback(
    (amountThb: number) => {
      const safe = Number.isFinite(amountThb) ? amountThb : 0;
      if (displayCurrency === 'THB' || !rates) {
        return new Intl.NumberFormat(locale, {
          style: 'currency',
          currency: 'THB',
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(safe);
      }
      const rate = rates[displayCurrency];
      if (rate == null) {
        return new Intl.NumberFormat(locale, {
          style: 'currency',
          currency: 'THB',
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(safe);
      }
      const converted = safe * rate;
      const maxFrac = displayCurrency === 'JPY' || displayCurrency === 'KRW' ? 0 : 2;
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: displayCurrency,
        minimumFractionDigits: 0,
        maximumFractionDigits: maxFrac,
      }).format(converted);
    },
    [locale, displayCurrency, rates],
  );

  return {
    format,
    displayCurrency,
    setDisplayCurrency,
    rates,
    rateDate: data?.date,
    isLoading,
    isError,
    error,
    refetch,
  };
}
