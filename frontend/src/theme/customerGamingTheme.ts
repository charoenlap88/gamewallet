import { createTheme, alpha, lighten, darken } from '@mui/material/styles';
import type { CustomerAccent } from '../stores/customerThemeStore';
import { CUSTOMER_ACCENT_HEX } from '../stores/customerThemeStore';

/** Design tokens — Neon gaming + dark base */
export const GAMING_PRIMARY = '#FF2E63';
export const GAMING_BG = '#0F0F14';
export const GAMING_PAPER = '#16161E';

/**
 * Dark “gaming” theme for customer routes only.
 * Primary = neon red; accent = electric purple or cyan glow (user choice).
 */
export function createCustomerGamingTheme(accentKey: CustomerAccent) {
  const accentMain = CUSTOMER_ACCENT_HEX[accentKey];
  const accentContrast = accentKey === 'cyan' ? '#0A0A12' : '#FFFFFF';

  return createTheme({
    cssVariables: false,
    breakpoints: {
      values: { xs: 0, sm: 600, md: 900, lg: 1200, xl: 1536 },
    },
    palette: {
      mode: 'dark',
      primary: {
        main: GAMING_PRIMARY,
        light: lighten(GAMING_PRIMARY, 0.12),
        dark: darken(GAMING_PRIMARY, 0.15),
        contrastText: '#FFFFFF',
      },
      secondary: {
        main: '#1E1E28',
        light: '#2A2A36',
        dark: '#12121A',
        contrastText: '#F5F5F7',
      },
      accent: {
        main: accentMain,
        light: lighten(accentMain, 0.15),
        dark: darken(accentMain, 0.2),
        contrastText: accentContrast,
      },
      background: {
        default: GAMING_BG,
        paper: GAMING_PAPER,
      },
      text: {
        primary: '#F2F2F6',
        secondary: alpha('#F2F2F6', 0.68),
      },
      error: { main: '#FF5252' },
      warning: { main: '#FFB74D' },
      success: { main: '#69F0AE' },
      info: { main: accentMain },
      divider: alpha('#FFFFFF', 0.08),
    },
    typography: {
      fontFamily: '"Inter", "Noto Sans Thai", ui-sans-serif, system-ui, sans-serif',
      h1: { fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.2 },
      h2: { fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.25 },
      h3: { fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.25 },
      h4: { fontWeight: 700 },
      h5: { fontWeight: 700 },
      h6: { fontWeight: 700 },
      subtitle1: { fontWeight: 600 },
      subtitle2: { fontWeight: 600 },
      button: { fontWeight: 700, letterSpacing: '0.02em' },
      body1: { lineHeight: 1.65 },
      body2: { lineHeight: 1.6 },
    },
    shape: { borderRadius: 12 },
    components: {
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 700,
            borderRadius: 10,
            minHeight: 44,
            paddingLeft: 20,
            paddingRight: 20,
          },
          containedPrimary: {
            backgroundImage: `linear-gradient(180deg, ${alpha('#FFFFFF', 0.12)} 0%, transparent 100%)`,
            boxShadow: `0 4px 20px ${alpha(GAMING_PRIMARY, 0.45)}`,
            '&:hover': {
              boxShadow: `0 6px 28px ${alpha(GAMING_PRIMARY, 0.55)}`,
            },
          },
          outlined: {
            borderWidth: 2,
            '&:hover': { borderWidth: 2 },
          },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: { borderRadius: 10 },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            border: `1px solid ${alpha(accentMain, 0.14)}`,
            backgroundImage: `linear-gradient(165deg, ${alpha(GAMING_PAPER, 0.98)} 0%, ${alpha('#12121C', 0.95)} 100%)`,
            boxShadow: `0 4px 32px ${alpha('#000', 0.35)}, 0 0 0 1px ${alpha(accentMain, 0.06)}`,
            transition: 'box-shadow 0.25s ease, border-color 0.25s ease, transform 0.2s ease',
            '&:hover': {
              boxShadow: `0 12px 48px ${alpha(accentMain, 0.18)}, 0 0 40px ${alpha(accentMain, 0.08)}`,
              borderColor: alpha(accentMain, 0.35),
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          rounded: { borderRadius: 16 },
          elevation1: {
            backgroundImage: `linear-gradient(180deg, ${alpha(GAMING_PAPER, 1)} 0%, ${alpha('#12121A', 1)} 100%)`,
            boxShadow: `0 2px 16px ${alpha('#000', 0.4)}`,
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundImage: `linear-gradient(135deg, ${GAMING_BG} 0%, ${alpha(GAMING_PRIMARY, 0.12)} 42%, ${alpha(accentMain, 0.08)} 100%)`,
            boxShadow: `0 4px 32px ${alpha('#000', 0.55)}, 0 0 0 1px ${alpha(accentMain, 0.2)}`,
            borderBottom: `1px solid ${alpha(GAMING_PRIMARY, 0.35)}`,
            backdropFilter: 'blur(12px)',
          },
        },
      },
      MuiTextField: {
        defaultProps: { variant: 'outlined' },
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 10,
              backgroundColor: alpha('#fff', 0.04),
              transition: 'box-shadow 0.2s ease',
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: alpha(GAMING_PRIMARY, 0.45),
              },
              '&.Mui-focused': {
                boxShadow: `0 0 0 3px ${alpha(accentMain, 0.25)}`,
              },
            },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: { fontWeight: 600, borderRadius: 8 },
        },
      },
      MuiTableHead: {
        styleOverrides: {
          root: {
            '& .MuiTableCell-head': {
              fontWeight: 800,
              fontSize: '0.8125rem',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              color: alpha('#F2F2F6', 0.65),
              backgroundColor: alpha(GAMING_PRIMARY, 0.1),
              borderBottom: `2px solid ${alpha(accentMain, 0.35)}`,
            },
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            background: `linear-gradient(180deg, ${GAMING_BG} 0%, ${alpha('#12121C', 1)} 45%, ${alpha(GAMING_PAPER, 1)} 100%)`,
            color: '#FFFFFF',
            borderRight: `1px solid ${alpha(accentMain, 0.35)}`,
            boxShadow: `4px 0 40px ${alpha(accentMain, 0.12)}`,
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: 20,
            border: `1px solid ${alpha(accentMain, 0.2)}`,
            boxShadow: `0 24px 80px ${alpha('#000', 0.55)}, 0 0 60px ${alpha(accentMain, 0.1)}`,
            backgroundImage: `linear-gradient(180deg, ${GAMING_PAPER} 0%, ${alpha('#12121A', 1)} 100%)`,
          },
        },
      },
      MuiMenu: {
        styleOverrides: {
          paper: {
            borderRadius: 12,
            border: `1px solid ${alpha(accentMain, 0.15)}`,
            marginTop: 8,
            backgroundColor: GAMING_PAPER,
          },
        },
      },
      MuiContainer: {
        styleOverrides: {
          root: {
            '@media (max-width:600px)': {
              paddingLeft: 16,
              paddingRight: 16,
            },
          },
        },
      },
    },
  });
}
