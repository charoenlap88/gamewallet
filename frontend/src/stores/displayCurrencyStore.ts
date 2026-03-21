import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/** สกุลเงินแสดงผล (ราคาในระบบเก็บเป็น THB เสมอ) — default บาท */
export type DisplayCurrencyCode = string;

type State = {
  /** ISO 4217, default THB */
  displayCurrency: DisplayCurrencyCode;
  setDisplayCurrency: (code: DisplayCurrencyCode) => void;
};

export const useDisplayCurrencyStore = create<State>()(
  persist(
    (set) => ({
      displayCurrency: 'THB',
      setDisplayCurrency: (displayCurrency) => set({ displayCurrency }),
    }),
    { name: 'gamewallet_display_currency' },
  ),
);
