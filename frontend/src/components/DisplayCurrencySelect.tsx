import { FormControl, MenuItem, Select, type SxProps, type Theme, Tooltip, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useMoneyDisplay } from '../hooks/useMoneyDisplay';
import { DISPLAY_CURRENCY_ORDER } from '../constants/displayCurrencies';

type Props = {
  dark?: boolean;
  sx?: SxProps<Theme>;
};

export function DisplayCurrencySelect({ dark, sx }: Props) {
  const { t } = useTranslation();
  const { displayCurrency, setDisplayCurrency, rates, isLoading, rateDate } = useMoneyDisplay();

  const options = DISPLAY_CURRENCY_ORDER.filter(
    (code) => code === 'THB' || (rates && code in rates),
  );

  return (
    <Tooltip
      title={
        rateDate
          ? t('customer.currency.hint', { date: rateDate })
          : t('customer.currency.hintLoading')
      }
    >
      <FormControl size="small" sx={{ minWidth: 108, ...sx }}>
        <Select
          variant="outlined"
          value={options.includes(displayCurrency as (typeof DISPLAY_CURRENCY_ORDER)[number]) ? displayCurrency : 'THB'}
          onChange={(e) => setDisplayCurrency(String(e.target.value))}
          disabled={isLoading && !rates}
          aria-label={t('customer.currency.label')}
          displayEmpty
          renderValue={(v) => (
            <Typography variant="body2" fontWeight={700} component="span">
              {String(v)}
            </Typography>
          )}
          sx={
            dark
              ? {
                  bgcolor: 'rgba(255,255,255,0.08)',
                  color: 'common.white',
                  borderRadius: 1,
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.25)' },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.45)' },
                  '& .MuiSelect-icon': { color: 'common.white' },
                }
              : { borderRadius: 1 }
          }
        >
          {options.map((code) => (
            <MenuItem key={code} value={code}>
              {code}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Tooltip>
  );
}
