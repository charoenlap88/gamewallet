import { createTheme, alpha } from '@mui/material/styles';

declare module '@mui/material/styles' {
  interface Palette {
    accent: Palette['primary'];
  }
  interface PaletteOptions {
    accent?: PaletteOptions['primary'];
  }
}

/** Premium red + black — friendly contrast, responsive-friendly tap targets */
export const theme = createTheme({
  cssVariables: false,
  breakpoints: {
    values: { xs: 0, sm: 600, md: 900, lg: 1200, xl: 1536 },
  },
  palette: {
    mode: 'light',
    primary: {
      main: '#C41E3A',
      light: '#E53950',
      dark: '#8B1530',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#0D0D0D',
      light: '#2A2A2A',
      dark: '#000000',
      contrastText: '#FFFFFF',
    },
    accent: {
      main: '#FF4D5C',
      light: '#FF7A85',
      dark: '#C41E3A',
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#F5F3F1',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#121212',
      secondary: '#5C5A58',
    },
    error: { main: '#C62828' },
    warning: { main: '#E65100' },
    success: { main: '#1B5E20' },
    info: { main: '#0D47A1' },
    divider: alpha('#0D0D0D', 0.08),
  },
  typography: {
    fontFamily:
      '"Inter", "Noto Sans Thai", ui-sans-serif, system-ui, sans-serif',
    h1: { fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.2 },
    h2: { fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.25 },
    h3: { fontWeight: 700, letterSpacing: '-0.015em', lineHeight: 1.3 },
    h4: { fontWeight: 700, letterSpacing: '-0.01em' },
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
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#F5F3F1',
          backgroundImage: `
            radial-gradient(ellipse 120% 80% at 100% -20%, ${alpha('#C41E3A', 0.07)} 0%, transparent 50%),
            radial-gradient(ellipse 80% 50% at 0% 100%, ${alpha('#0D0D0D', 0.04)} 0%, transparent 45%)
          `,
          backgroundAttachment: 'fixed',
        },
      },
    },
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
        sizeSmall: { minHeight: 36, paddingLeft: 14, paddingRight: 14 },
        contained: {
          backgroundImage: `linear-gradient(180deg, ${alpha('#FF4D5C', 0.15)} 0%, transparent 100%)`,
          '&:hover': {
            boxShadow: `0 6px 20px ${alpha('#C41E3A', 0.35)}`,
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
          border: `1px solid ${alpha('#0D0D0D', 0.06)}`,
          boxShadow: `0 4px 24px ${alpha('#0D0D0D', 0.06)}`,
          backgroundImage: `linear-gradient(180deg, ${alpha('#FFFFFF', 0.9)} 0%, #FFFFFF 100%)`,
          transition: 'box-shadow 0.25s ease, border-color 0.25s ease, transform 0.2s ease',
          '&:hover': {
            boxShadow: `0 12px 40px ${alpha('#C41E3A', 0.1)}`,
            borderColor: alpha('#C41E3A', 0.15),
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        rounded: { borderRadius: 16 },
        elevation1: {
          boxShadow: `0 2px 12px ${alpha('#0D0D0D', 0.06)}`,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundImage: `linear-gradient(135deg, #0D0D0D 0%, #1A0A0C 45%, #2D1218 100%)`,
          boxShadow: `0 4px 24px ${alpha('#000', 0.35)}`,
          borderBottom: `1px solid ${alpha('#C41E3A', 0.35)}`,
        },
      },
    },
    MuiTextField: {
      defaultProps: { variant: 'outlined' },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 10,
            backgroundColor: alpha('#FFF', 0.85),
            transition: 'box-shadow 0.2s ease',
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: alpha('#C41E3A', 0.4),
            },
            '&.Mui-focused': {
              boxShadow: `0 0 0 3px ${alpha('#C41E3A', 0.15)}`,
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
            color: alpha('#0D0D0D', 0.65),
            backgroundColor: alpha('#C41E3A', 0.06),
            borderBottom: `2px solid ${alpha('#C41E3A', 0.2)}`,
          },
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          background: 'linear-gradient(180deg, #0A0A0A 0%, #121010 40%, #1A1214 100%)',
          color: '#FFFFFF',
          borderRight: `1px solid ${alpha('#C41E3A', 0.25)}`,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 20,
          border: `1px solid ${alpha('#0D0D0D', 0.08)}`,
          boxShadow: `0 24px 80px ${alpha('#000', 0.2)}`,
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          borderRadius: 12,
          border: `1px solid ${alpha('#0D0D0D', 0.08)}`,
          marginTop: 8,
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
