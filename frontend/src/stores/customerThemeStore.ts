import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/** Highlight accent for gaming UI (purple vs cyan glow) */
export type CustomerAccent = 'purple' | 'cyan';

export const CUSTOMER_ACCENT_HEX: Record<CustomerAccent, string> = {
  purple: '#7C4DFF',
  cyan: '#00E5FF',
};

type State = {
  accent: CustomerAccent;
  setAccent: (accent: CustomerAccent) => void;
};

export const useCustomerThemeStore = create<State>()(
  persist(
    (set) => ({
      accent: 'purple',
      setAccent: (accent) => set({ accent }),
    }),
    { name: 'gamewallet_customer_accent' },
  ),
);
