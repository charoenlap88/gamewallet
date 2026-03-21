import { Box, ToggleButton, ToggleButtonGroup, Tooltip } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useCustomerThemeStore, type CustomerAccent, CUSTOMER_ACCENT_HEX } from '../stores/customerThemeStore';

/**
 * เลือกสี Accent (ม่วงไฟฟ้า / ฟ้าเรืองแสง) สำหรับหน้าลูกค้า — บันทึกใน localStorage
 */
export function CustomerAccentSwitcher() {
  const { t } = useTranslation();
  const accent = useCustomerThemeStore((s) => s.accent);
  const setAccent = useCustomerThemeStore((s) => s.setAccent);

  const dot = (key: CustomerAccent) => (
    <Box
      component="span"
      sx={{
        width: 12,
        height: 12,
        borderRadius: '50%',
        bgcolor: CUSTOMER_ACCENT_HEX[key],
        boxShadow:
          key === 'purple'
            ? '0 0 12px rgba(124,77,255,0.85)'
            : '0 0 12px rgba(0,229,255,0.85)',
        border: '2px solid rgba(255,255,255,0.35)',
      }}
    />
  );

  return (
    <ToggleButtonGroup
      exclusive
      value={accent}
      onChange={(_, value) => {
        if (value) setAccent(value);
      }}
      size="small"
      aria-label={t('customer.theme.label')}
      sx={{
        bgcolor: 'rgba(255,255,255,0.06)',
        borderRadius: 2,
        p: 0.25,
        border: '1px solid rgba(255,255,255,0.12)',
        '& .MuiToggleButtonGroup-grouped': {
          border: 0,
          px: 1,
          py: 0.5,
          minWidth: 40,
        },
        '& .Mui-selected': {
          bgcolor: 'rgba(255,255,255,0.14) !important',
        },
      }}
    >
      <Tooltip title={t('customer.theme.purple')}>
        <ToggleButton value="purple" aria-label={t('customer.theme.purple')}>
          {dot('purple')}
        </ToggleButton>
      </Tooltip>
      <Tooltip title={t('customer.theme.cyan')}>
        <ToggleButton value="cyan" aria-label={t('customer.theme.cyan')}>
          {dot('cyan')}
        </ToggleButton>
      </Tooltip>
    </ToggleButtonGroup>
  );
}
