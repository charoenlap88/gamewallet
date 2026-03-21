import { Box, FormControl, MenuItem, Select, type SxProps, type Theme } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { LANGUAGE_FLAGS, SUPPORTED_LANGUAGES, normalizeAppLanguage, type AppLanguage } from '../i18n';

type Props = {
  /** สไตล์สำหรับ AppBar โทนสีเข้ม (ข้อความขาว) */
  dark?: boolean;
  sx?: SxProps<Theme>;
};

export function LanguageSwitcher({ dark, sx }: Props) {
  const { i18n, t } = useTranslation();
  const value = normalizeAppLanguage(i18n.language);

  return (
    <FormControl size="small" sx={{ minWidth: 148, ...sx }}>
      <Select
        value={value}
        onChange={(e) => {
          void i18n.changeLanguage(e.target.value as AppLanguage);
        }}
        aria-label={t('lang.label')}
        renderValue={(selected) => (
          <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <span aria-hidden>{LANGUAGE_FLAGS[selected as AppLanguage]}</span>
            <span>{t(`lang.${selected}`)}</span>
          </Box>
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
        {SUPPORTED_LANGUAGES.map((lng) => (
          <MenuItem key={lng} value={lng}>
            <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <span aria-hidden>{LANGUAGE_FLAGS[lng]}</span>
              <span>{t(`lang.${lng}`)}</span>
            </Box>
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
