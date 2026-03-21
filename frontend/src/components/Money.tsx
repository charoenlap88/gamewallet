import { Typography, type TypographyProps } from '@mui/material';
import { useMoneyDisplay } from '../hooks/useMoneyDisplay';

type Props = TypographyProps & {
  amount: number | string;
};

/** แสดงยอดเงินจากค่า THB ในระบบ — แปลงตามสกุลที่เลือก (ต้องอยู่ใต้ QueryClientProvider) */
export function Money({ amount, ...typographyProps }: Props) {
  const { format } = useMoneyDisplay();
  const n = typeof amount === 'string' ? Number(amount) : amount;
  return <Typography {...typographyProps}>{format(n)}</Typography>;
}
