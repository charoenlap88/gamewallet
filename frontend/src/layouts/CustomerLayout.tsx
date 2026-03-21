import {
  AppBar, Toolbar, Typography, Box, Button, Avatar, Menu,
  MenuItem, IconButton, Divider, Container, Drawer, List,
  ListItemButton, ListItemIcon, ListItemText, useMediaQuery, useTheme,
} from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { alpha } from '@mui/material/styles';
import {
  ShoppingCart, AccountBalanceWallet, Logout, Person, Receipt,
  AdminPanelSettings, Menu as MenuIcon, Payment, Home, Storefront, Newspaper,
} from '@mui/icons-material';
import { useMemo, useState } from 'react';
import { useNavigate, Outlet, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../stores/authStore';
import { useQuery } from '@tanstack/react-query';
import { walletApi } from '../api/wallet';
import toast from 'react-hot-toast';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { CustomerAccentSwitcher } from '../components/CustomerAccentSwitcher';
import { DisplayCurrencySelect } from '../components/DisplayCurrencySelect';
import { useMoneyDisplay } from '../hooks/useMoneyDisplay';
import { createCustomerGamingTheme, GAMING_BG } from '../theme/customerGamingTheme';
import { useCustomerThemeStore } from '../stores/customerThemeStore';

const DRAWER_WIDTH = 280;

function CustomerLayoutInner() {
  const theme = useTheme();
  const { t } = useTranslation();
  const { format: formatMoney } = useMoneyDisplay();
  const isMdUp = useMediaQuery(theme.breakpoints.up('md'));
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuthStore();

  const { data: walletData } = useQuery({
    queryKey: ['wallet-balance'],
    queryFn: walletApi.getBalance,
    enabled: isAuthenticated,
    refetchInterval: 30000,
  });

  const handleLogout = () => {
    logout();
    toast.success(t('auth.logoutToast'));
    navigate('/login');
    setAnchorEl(null);
    setMobileOpen(false);
  };

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  const go = (path: string) => {
    navigate(path);
    setMobileOpen(false);
    setAnchorEl(null);
  };

  const navItems = useMemo(
    () =>
      [
        { to: '/', labelKey: 'nav.home', Icon: Home },
        { to: '/news', labelKey: 'nav.news', Icon: Newspaper },
        { to: '/products', labelKey: 'nav.products', Icon: Storefront },
        { to: '/orders', labelKey: 'nav.orders', Icon: ShoppingCart, auth: true },
        { to: '/wallet', labelKey: 'nav.wallet', Icon: AccountBalanceWallet, auth: true },
        { to: '/payments', labelKey: 'nav.payments', Icon: Payment, auth: true },
        { to: '/profile', labelKey: 'nav.profile', Icon: Person, auth: true },
      ] as {
        to: string;
        labelKey:
          | 'nav.home'
          | 'nav.news'
          | 'nav.products'
          | 'nav.orders'
          | 'nav.wallet'
          | 'nav.payments'
          | 'nav.profile';
        Icon: typeof Home;
        auth?: boolean;
      }[],
    [],
  );

  const primary = theme.palette.primary.main;
  const accent = theme.palette.accent.main;

  const drawer = (
    <Box sx={{ pt: 2, pb: 2 }} role="navigation">
      <Box sx={{ px: 2, pb: 2 }}>
        <Typography variant="overline" sx={{ color: 'rgba(255,255,255,0.5)', letterSpacing: 2 }}>
          {t('common.menu')}
        </Typography>
      </Box>
      <List disablePadding>
        {navItems
          .filter((item) => !item.auth || isAuthenticated)
          .map(({ to, labelKey, Icon }) => (
            <ListItemButton
              key={to}
              component={Link}
              to={to}
              onClick={() => setMobileOpen(false)}
              sx={{
                mx: 1,
                mb: 0.5,
                borderRadius: 2,
                color: 'rgba(255,255,255,0.85)',
                '&:hover': { bgcolor: alpha(primary, 0.22), color: '#fff' },
              }}
            >
              <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}>
                <Icon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary={t(labelKey)} primaryTypographyProps={{ fontWeight: 600 }} />
            </ListItemButton>
          ))}
        {isAuthenticated && isAdmin && (
          <ListItemButton
            onClick={() => go('/admin/dashboard')}
            sx={{
              mx: 1,
              mb: 0.5,
              borderRadius: 2,
              color: 'accent.main',
              '&:hover': { bgcolor: alpha(accent, 0.18) },
            }}
          >
            <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}>
              <AdminPanelSettings fontSize="small" />
            </ListItemIcon>
            <ListItemText primary={t('common.adminPanel')} primaryTypographyProps={{ fontWeight: 700 }} />
          </ListItemButton>
        )}
      </List>
    </Box>
  );

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: GAMING_BG,
        backgroundImage: `
          radial-gradient(ellipse 100% 80% at 100% -25%, ${alpha(primary, 0.16)} 0%, transparent 55%),
          radial-gradient(ellipse 70% 50% at 0% 100%, ${alpha(accent, 0.14)} 0%, transparent 52%),
          radial-gradient(ellipse 45% 35% at 70% 40%, ${alpha(accent, 0.06)} 0%, transparent 55%)
        `,
        backgroundAttachment: 'fixed',
      }}
    >
      <AppBar position="sticky" elevation={0}>
        <Container maxWidth="xl">
          <Toolbar
            disableGutters
            sx={{
              gap: { xs: 1, md: 2 },
              minHeight: { xs: 56, sm: 64 },
              py: { xs: 0.5, sm: 0 },
              color: 'common.white',
            }}
          >
            {!isMdUp && (
              <IconButton
                color="inherit"
                edge="start"
                aria-label={t('common.openMenu')}
                onClick={() => setMobileOpen(true)}
                sx={{ mr: 0.5 }}
              >
                <MenuIcon />
              </IconButton>
            )}

            <Box
              component={Link}
              to="/"
              sx={{ display: 'flex', alignItems: 'center', gap: 1, textDecoration: 'none', color: 'inherit', mr: 'auto' }}
            >
              <Box
                sx={{
                  width: { xs: 34, sm: 40 },
                  height: { xs: 34, sm: 40 },
                  borderRadius: 2,
                  bgcolor: 'primary.main',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: `0 0 0 2px ${alpha('#fff', 0.15)}, 0 0 20px ${alpha(primary, 0.45)}`,
                }}
              >
                <Receipt sx={{ color: 'white', fontSize: { xs: 18, sm: 22 } }} />
              </Box>
              <Box>
                <Typography variant="h6" fontWeight={800} sx={{ fontSize: { xs: '1rem', sm: '1.15rem' }, lineHeight: 1.2 }}>
                  {t('app.brand')}
                </Typography>
                <Typography variant="caption" sx={{ display: { xs: 'none', sm: 'block' }, opacity: 0.75 }}>
                  {t('app.tagline')}
                </Typography>
              </Box>
            </Box>

            {isMdUp && (
              <Box sx={{ display: 'flex', gap: 0.5, flex: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
                {navItems
                  .filter((item) => !item.auth || isAuthenticated)
                  .map(({ to, labelKey }) => (
                    <Button
                      key={to}
                      component={Link}
                      to={to}
                      color="inherit"
                      sx={{
                        fontWeight: 600,
                        px: 1.5,
                        color: 'rgba(255,255,255,0.88)',
                        '&:hover': { bgcolor: 'rgba(255,255,255,0.08)' },
                      }}
                    >
                      {t(labelKey)}
                    </Button>
                  ))}
              </Box>
            )}

            <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 1 } }} flexShrink={0}>
              <CustomerAccentSwitcher />
              <DisplayCurrencySelect dark />
              {isAuthenticated ? (
                <>
                  <LanguageSwitcher dark />
                  <Box
                    component={Link}
                    to="/wallet"
                    sx={{
                      display: { xs: 'none', sm: 'flex' },
                      alignItems: 'center',
                      gap: 0.75,
                      bgcolor: 'primary.main',
                      color: 'white',
                      px: 2,
                      py: 0.85,
                      borderRadius: 999,
                      textDecoration: 'none',
                      fontWeight: 800,
                      fontSize: '0.875rem',
                      boxShadow: `0 4px 18px ${alpha(primary, 0.55)}`,
                      '&:hover': { bgcolor: 'primary.dark', transform: 'translateY(-1px)' },
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <AccountBalanceWallet sx={{ fontSize: 18 }} />
                    {formatMoney(Number(walletData?.balance || 0))}
                  </Box>

                  <IconButton
                    onClick={(e) => setAnchorEl(e.currentTarget)}
                    aria-label={t('common.account')}
                    sx={{
                      p: 0.5,
                      border: '2px solid rgba(255,255,255,0.2)',
                      '&:hover': { borderColor: 'rgba(255,255,255,0.45)' },
                    }}
                  >
                    <Avatar sx={{ width: 36, height: 36, bgcolor: 'primary.main', fontSize: 15, fontWeight: 800 }}>
                      {user?.username?.charAt(0).toUpperCase()}
                    </Avatar>
                  </IconButton>

                  <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={() => setAnchorEl(null)}
                    PaperProps={{ sx: { minWidth: 220, mt: 1.5, borderRadius: 2 } }}
                    transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                    anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                  >
                    <Box sx={{ px: 2, py: 1.5 }}>
                      <Typography variant="subtitle2" fontWeight={800}>
                        {user?.fullName || user?.username}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {user?.email}
                      </Typography>
                    </Box>
                    <Divider />
                    <MenuItem onClick={() => go('/profile')}>
                      <Person fontSize="small" sx={{ mr: 1.5 }} /> {t('nav.profile')}
                    </MenuItem>
                    <MenuItem onClick={() => go('/wallet')}>
                      <AccountBalanceWallet fontSize="small" sx={{ mr: 1.5 }} /> {t('nav.wallet')}
                    </MenuItem>
                    <MenuItem onClick={() => go('/orders')}>
                      <ShoppingCart fontSize="small" sx={{ mr: 1.5 }} /> {t('nav.orders')}
                    </MenuItem>
                    <MenuItem onClick={() => go('/payments')}>
                      <Payment fontSize="small" sx={{ mr: 1.5 }} /> {t('common.paymentHistory')}
                    </MenuItem>
                    {isAdmin && (
                      <>
                        <Divider />
                        <MenuItem onClick={() => go('/admin/dashboard')}>
                          <AdminPanelSettings fontSize="small" sx={{ mr: 1.5, color: 'accent.main' }} />
                          <Typography color="accent.main" fontWeight={700}>{t('common.adminPanel')}</Typography>
                        </MenuItem>
                      </>
                    )}
                    <Divider />
                    <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
                      <Logout fontSize="small" sx={{ mr: 1.5 }} /> {t('common.logout')}
                    </MenuItem>
                  </Menu>
                </>
              ) : (
                <>
                  <LanguageSwitcher dark />
                  <Button
                    variant="outlined"
                    color="inherit"
                    size="small"
                    onClick={() => navigate('/login')}
                    sx={{ borderColor: 'rgba(255,255,255,0.5)', color: 'white', display: { xs: 'none', sm: 'inline-flex' } }}
                  >
                    {t('common.login')}
                  </Button>
                  <Button
                    variant="contained"
                    size="small"
                    onClick={() => navigate('/login')}
                    sx={{ display: { xs: 'inline-flex', sm: 'none' }, minWidth: 'auto', px: 1.5 }}
                  >
                    {t('common.login')}
                  </Button>
                  <Button
                    variant="contained"
                    color="secondary"
                    size="small"
                    onClick={() => navigate('/register')}
                    sx={{
                      bgcolor: 'rgba(255,255,255,0.12)',
                      color: 'white',
                      border: '1px solid rgba(255,255,255,0.25)',
                      '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' },
                    }}
                  >
                    {t('common.registerShort')}
                  </Button>
                </>
              )}
            </Box>
          </Toolbar>
        </Container>
      </AppBar>

      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' },
        }}
      >
        {drawer}
      </Drawer>

      <Box component="main" sx={{ flex: 1, width: '100%' }}>
        <Outlet />
      </Box>

      <Box
        component="footer"
        sx={{
          mt: 'auto',
          py: { xs: 3, md: 4 },
          px: 2,
          background: `linear-gradient(180deg, ${alpha(GAMING_BG, 0.95)} 0%, #050508 100%)`,
          color: 'rgba(255,255,255,0.65)',
          borderTop: `1px solid ${alpha(primary, 0.28)}`,
          boxShadow: `0 -8px 40px ${alpha(accent, 0.08)}`,
        }}
      >
        <Container maxWidth="xl">
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              gap: { xs: 2, sm: 0 },
              justifyContent: 'space-between',
              alignItems: { xs: 'flex-start', sm: 'center' },
            }}
          >
            <Typography variant="body2" sx={{ maxWidth: 480 }}>
              {t('app.footer', { year: new Date().getFullYear() })}
            </Typography>
            <Typography variant="caption" sx={{ color: 'accent.main', fontWeight: 600 }}>
              Premium experience · Secure wallet
            </Typography>
          </Box>
        </Container>
      </Box>
    </Box>
  );
}

/** Layout ลูกค้า — ธีมเกมมิ่งเข้ม + เลือก Accent (ม่วง/ฟ้า) */
export const CustomerLayout = () => {
  const accent = useCustomerThemeStore((s) => s.accent);
  const customerTheme = useMemo(() => createCustomerGamingTheme(accent), [accent]);

  return (
    <ThemeProvider theme={customerTheme}>
      <CustomerLayoutInner />
    </ThemeProvider>
  );
};
