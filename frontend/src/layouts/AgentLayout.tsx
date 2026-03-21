import { useMemo, useState } from 'react';
import {
  Box, Drawer, AppBar, Toolbar, Typography, IconButton, List, ListItemButton,
  ListItemIcon, ListItemText, Divider, Avatar, alpha, useMediaQuery, useTheme,
} from '@mui/material';
import { Menu as MenuIcon, Dashboard, People, Logout, Receipt } from '@mui/icons-material';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../stores/authStore';
import toast from 'react-hot-toast';
import { LanguageSwitcher } from '../components/LanguageSwitcher';

const DRAWER = 260;

export const AgentLayout = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const [open, setOpen] = useState(isDesktop);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();

  const items = useMemo(
    () =>
      [
        { labelKey: 'agent.overview', path: '/agent', Icon: Dashboard },
        { labelKey: 'agent.myCustomers', path: '/agent/customers', Icon: People },
      ] as const,
    [],
  );

  const nav = (path: string) => {
    navigate(path);
    setMobileOpen(false);
  };

  const drawer = (
    <>
      <Box sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box sx={{
          width: 40, height: 40, borderRadius: 2, bgcolor: 'primary.main',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Receipt sx={{ color: 'white' }} />
        </Box>
        <Box>
          <Typography fontWeight={800} color="white">{t('agent.salesAgent')}</Typography>
          <Typography variant="caption" sx={{ color: alpha('#fff', 0.65) }}>{t('app.brand')}</Typography>
        </Box>
      </Box>
      <Divider sx={{ borderColor: alpha('#fff', 0.12), mx: 2 }} />
      <Box sx={{ px: 2, py: 1.5, mx: 2, mt: 2, borderRadius: 2, bgcolor: alpha('#fff', 0.06) }}>
        <Typography fontWeight={700} color="white" noWrap>{user?.fullName || user?.username}</Typography>
        <Typography variant="caption" sx={{ color: alpha('#fff', 0.7) }}>
          {t('agent.codeLabel', { code: user?.agentCode || t('common.dash') })}
        </Typography>
      </Box>
      <List sx={{ mt: 2 }}>
        {items.map((it) => (
          <ListItemButton
            key={it.path}
            selected={
              it.path === '/agent'
                ? location.pathname === '/agent' || location.pathname === '/agent/'
                : location.pathname.startsWith(it.path)
            }
            onClick={() => nav(it.path)}
            sx={{ mx: 1, borderRadius: 2, mb: 0.5, color: alpha('#fff', 0.85) }}
          >
            <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}><it.Icon fontSize="small" /></ListItemIcon>
            <ListItemText primary={t(it.labelKey)} primaryTypographyProps={{ fontWeight: 600, fontSize: 14 }} />
          </ListItemButton>
        ))}
      </List>
      <Box sx={{ flex: 1 }} />
      <Divider sx={{ borderColor: alpha('#fff', 0.12), mx: 2 }} />
      <List sx={{ pb: 2 }}>
        <ListItemButton
          onClick={() => { logout(); toast.success(t('agent.logoutToast')); navigate('/login'); }}
          sx={{ mx: 1, borderRadius: 2, color: alpha('#fff', 0.75) }}
        >
          <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}><Logout fontSize="small" /></ListItemIcon>
          <ListItemText primary={t('common.logout')} />
        </ListItemButton>
      </List>
    </>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Drawer
        variant={isDesktop ? 'persistent' : 'temporary'}
        open={isDesktop ? open : mobileOpen}
        onClose={() => setMobileOpen(false)}
        sx={{
          '& .MuiDrawer-paper': {
            width: DRAWER,
            background: 'linear-gradient(180deg, #1a0a0c 0%, #3d0f18 100%)',
            border: 'none',
          },
        }}
      >
        {drawer}
      </Drawer>
      <Box component="main" sx={{ flex: 1, minWidth: 0, bgcolor: 'background.default' }}>
        <AppBar position="sticky" elevation={0} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Toolbar sx={{ gap: 1 }}>
            <IconButton edge="start" onClick={() => (isDesktop ? setOpen(!open) : setMobileOpen(true))}>
              <MenuIcon />
            </IconButton>
            <Typography fontWeight={800} flex={1}>{t('agent.portal')}</Typography>
            <LanguageSwitcher />
          </Toolbar>
        </AppBar>
        <Box sx={{ p: { xs: 2, md: 3 } }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};
