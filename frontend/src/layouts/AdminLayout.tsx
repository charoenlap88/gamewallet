import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box, Drawer, AppBar, Toolbar, Typography, IconButton,
  List, ListItemButton, ListItemIcon, ListItemText, Divider,
  Avatar, Menu, MenuItem, Collapse, Chip, alpha,
  useMediaQuery, useTheme,
} from '@mui/material';
import {
  Menu as MenuIcon, Receipt, Logout, ExpandLess, ExpandMore, AccountCircle,
} from '@mui/icons-material';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import toast from 'react-hot-toast';
import { ADMIN_NAV_ITEMS, type AdminNavItemDef } from '../config/adminMenuKeys';
import {
  filterAdminNavItems,
  isAdminPathAllowed,
  getFirstAllowedAdminPath,
} from '../lib/adminNavAccess';
import type { UserRole } from '../types';
import { LanguageSwitcher } from '../components/LanguageSwitcher';

const DRAWER_WIDTH = 280;

type NavItem = AdminNavItemDef;

const navStableKey = (item: NavItem) => item.menuKey ?? item.labelKey;

export const AdminLayout = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const [desktopOpen, setDesktopOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();

  const navItems = useMemo(
    () =>
      filterAdminNavItems(
        ADMIN_NAV_ITEMS,
        user?.navMenuKeys,
        (user?.role ?? 'CUSTOMER') as UserRole,
      ),
    [user?.navMenuKeys, user?.role],
  );

  useEffect(() => {
    if (!user?.role) return;
    if (!location.pathname.startsWith('/admin')) return;
    if (!isAdminPathAllowed(location.pathname, user.navMenuKeys, user.role as UserRole)) {
      navigate(getFirstAllowedAdminPath(user.navMenuKeys, user.role as UserRole), { replace: true });
    }
  }, [location.pathname, user, navigate]);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    toast.success(t('admin.logoutToast'));
    navigate('/login');
  };

  const isActive = (path?: string) => path && location.pathname === path;
  const isChildActive = (item: NavItem) =>
    item.children?.some((c) => c.path && location.pathname === c.path);

  const navTo = (path?: string) => {
    if (path) {
      navigate(path);
      setMobileOpen(false);
    }
  };

  const renderNavItem = (item: NavItem, depth = 0) => {
    const active = isActive(item.path);
    const childActive = isChildActive(item);
    const sk = navStableKey(item);
    const expanded = expandedItem === sk;

    if (item.children) {
      return (
        <Box key={sk}>
          <ListItemButton
            onClick={() => setExpandedItem(expanded ? null : sk)}
            sx={{
              mx: 1, borderRadius: 2, mb: 0.5,
              minHeight: 48,
              color: childActive ? 'primary.light' : 'rgba(255,255,255,0.78)',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.08)', color: 'white' },
              ...(childActive && { bgcolor: alpha('#C41E3A', 0.28), color: 'white' }),
            }}
          >
            <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}>
              <item.Icon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary={t(item.labelKey)} primaryTypographyProps={{ fontSize: 14, fontWeight: childActive ? 700 : 500 }} />
            {expanded || childActive ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
          </ListItemButton>
          <Collapse in={expanded || !!childActive}>
            <List disablePadding sx={{ pl: 1 }}>
              {item.children.map((child) => renderNavItem(child, 1))}
            </List>
          </Collapse>
        </Box>
      );
    }

    return (
      <ListItemButton
        key={sk}
        onClick={() => navTo(item.path)}
        sx={{
          mx: 1, borderRadius: 2, mb: 0.5, pl: depth > 0 ? 4 : 2,
          minHeight: 48,
          color: active ? 'white' : 'rgba(255,255,255,0.72)',
          '&:hover': { bgcolor: 'rgba(255,255,255,0.08)', color: 'white' },
          ...(active && {
            bgcolor: 'primary.main',
            '&:hover': { bgcolor: 'primary.dark' },
          }),
        }}
      >
        <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}>
          <item.Icon fontSize="small" />
        </ListItemIcon>
        <ListItemText primary={t(item.labelKey)} primaryTypographyProps={{ fontSize: 14, fontWeight: active ? 700 : 500 }} />
      </ListItemButton>
    );
  };

  const drawerInner = (
    <>
      <Box sx={{ p: 2.5, pb: 2 }}>
        <Box display="flex" alignItems="center" gap={1.5}>
          <Box sx={{
            width: 40, height: 40, borderRadius: 2,
            bgcolor: 'primary.main', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 0 0 2px ${alpha('#fff', 0.12)}`,
          }}>
            <Receipt sx={{ color: 'white', fontSize: 22 }} />
          </Box>
          <Box>
            <Typography variant="subtitle1" fontWeight={800} color="white" lineHeight={1.2}>
              GameWallet
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
              {t('admin.console')}
            </Typography>
          </Box>
        </Box>
      </Box>

      <Box sx={{ mx: 2, mb: 2, p: 1.5, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.06)' }}>
        <Box display="flex" alignItems="center" gap={1.5}>
          <Avatar sx={{ width: 40, height: 40, bgcolor: 'primary.main', fontSize: 15, fontWeight: 800 }}>
            {user?.username?.charAt(0).toUpperCase()}
          </Avatar>
          <Box flex={1} minWidth={0}>
            <Typography variant="body2" color="white" fontWeight={700} noWrap>
              {user?.fullName || user?.username}
            </Typography>
            <Chip
              label={user?.role?.replace('_', ' ')}
              size="small"
              sx={{ height: 18, fontSize: 10, bgcolor: alpha('#C41E3A', 0.55), color: 'white', mt: 0.3 }}
            />
          </Box>
        </Box>
      </Box>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', mx: 2, mb: 1 }} />

      <List sx={{ flex: 1, py: 0.5, overflowY: 'auto' }}>
        {navItems.map((item) => renderNavItem(item))}
      </List>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', mx: 2, my: 1 }} />

      <List sx={{ pb: 2 }}>
        <ListItemButton
          onClick={() => { navigate('/'); setMobileOpen(false); }}
          sx={{ mx: 1, borderRadius: 2, minHeight: 48, color: 'rgba(255,255,255,0.65)', '&:hover': { color: 'white', bgcolor: 'rgba(255,255,255,0.08)' } }}
        >
          <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}><AccountCircle fontSize="small" /></ListItemIcon>
          <ListItemText primary="Customer site" primaryTypographyProps={{ fontSize: 14, fontWeight: 600 }} />
        </ListItemButton>
        <ListItemButton
          onClick={handleLogout}
          sx={{ mx: 1, borderRadius: 2, minHeight: 48, color: 'rgba(255,255,255,0.65)', '&:hover': { color: '#FF8A80', bgcolor: alpha('#E53935', 0.12) } }}
        >
          <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}><Logout fontSize="small" /></ListItemIcon>
          <ListItemText primary={t('common.logout')} primaryTypographyProps={{ fontSize: 14, fontWeight: 600 }} />
        </ListItemButton>
      </List>
    </>
  );

  const pageTitle = useMemo(() => {
    const flat = navItems.flatMap((n) => (n.children ? n.children : [n]));
    const found = flat.find((n) => n.path === location.pathname);
    return found ? t(found.labelKey) : t('admin.pageTitleFallback');
  }, [navItems, location.pathname, t]);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Drawer
        variant={isDesktop ? 'persistent' : 'temporary'}
        open={isDesktop ? desktopOpen : mobileOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          width: isDesktop && desktopOpen ? DRAWER_WIDTH : 0,
          flexShrink: 0,
          transition: theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
            border: 'none',
            display: 'flex',
            flexDirection: 'column',
          },
        }}
      >
        {drawerInner}
      </Drawer>

      <Box
        component="main"
        sx={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          bgcolor: 'background.default',
        }}
      >
        <AppBar
          position="sticky"
          elevation={0}
          sx={{
            color: 'common.white',
            borderBottom: `1px solid ${alpha('#C41E3A', 0.25)}`,
          }}
        >
          <Toolbar sx={{ gap: 1, minHeight: { xs: 56, sm: 64 } }}>
            <IconButton
              color="inherit"
              edge="start"
              aria-label={isDesktop ? t('common.toggleMenu') : t('common.openMenu')}
              onClick={() => (isDesktop ? setDesktopOpen(!desktopOpen) : setMobileOpen(true))}
              sx={{ color: 'inherit' }}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="subtitle1" fontWeight={800} sx={{ flex: 1, color: 'inherit' }}>
              {pageTitle}
            </Typography>
            <LanguageSwitcher sx={{ mr: 1 }} />
            <IconButton color="inherit" onClick={(e) => setAnchorEl(e.currentTarget)} size="small">
              <Avatar sx={{ width: 34, height: 34, bgcolor: 'primary.main', fontSize: 14, fontWeight: 800 }}>
                {user?.username?.charAt(0).toUpperCase()}
              </Avatar>
            </IconButton>
          </Toolbar>
        </AppBar>

        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
          <MenuItem onClick={() => { setAnchorEl(null); navigate('/'); }}>{t('common.customerSite')}</MenuItem>
          <MenuItem onClick={() => { setAnchorEl(null); handleLogout(); }}>{t('common.logout')}</MenuItem>
        </Menu>

        <Box sx={{ flex: 1, p: { xs: 2, sm: 2.5, md: 3 }, overflow: 'auto' }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};
