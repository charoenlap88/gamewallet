import { Chip } from '@mui/material';
import { useTranslation } from 'react-i18next';

interface StatusChipProps {
  status: string;
  size?: 'small' | 'medium';
}

const statusConfig: Record<string, { color: 'success' | 'error' | 'warning' | 'info' | 'default' }> = {
  CUSTOMER: { color: 'info' },
  ADMIN: { color: 'warning' },
  SUPER_ADMIN: { color: 'error' },
  AGENT: { color: 'success' },
  ACTIVE: { color: 'success' },
  INACTIVE: { color: 'default' },
  SUSPENDED: { color: 'error' },
  MAINTENANCE: { color: 'warning' },
  PENDING: { color: 'warning' },
  PROCESSING: { color: 'info' },
  SUCCESS: { color: 'success' },
  FAILED: { color: 'error' },
  CANCELLED: { color: 'default' },
  REFUNDED: { color: 'info' },
  OUT_OF_STOCK: { color: 'warning' },
  TOPUP: { color: 'success' },
  PURCHASE: { color: 'info' },
  REFUND: { color: 'warning' },
  ADJUSTMENT: { color: 'default' },
  EXPIRED: { color: 'error' },
};

export const StatusChip = ({ status, size = 'small' }: StatusChipProps) => {
  const { t } = useTranslation();
  const config = statusConfig[status] || { color: 'default' as const };
  const label = t(`status.${status}`, status);
  return (
    <Chip
      label={label}
      color={config.color}
      size={size}
      sx={{ fontWeight: 600, borderRadius: 1 }}
    />
  );
};
