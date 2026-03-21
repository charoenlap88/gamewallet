import type { ElementType } from 'react';
import {
  Dashboard,
  People,
  Inventory2,
  LocalShipping,
  ShoppingCart,
  Payment,
  BarChart,
  History,
  VpnKey,
  AccountTree,
  AdminPanelSettings,
  Newspaper,
} from '@mui/icons-material';

export type AdminMenuKey =
  | 'dashboard'
  | 'users'
  | 'products_categories'
  | 'products_list'
  | 'suppliers'
  | 'suppliers_api_keys'
  | 'orders'
  | 'payments'
  | 'analytics'
  | 'audit_logs'
  | 'nav_roles'
  | 'news';

export interface AdminNavItemDef {
  menuKey?: AdminMenuKey;
  /** i18n key e.g. admin.menu.dashboard */
  labelKey: string;
  path?: string;
  Icon: ElementType;
  children?: AdminNavItemDef[];
}

/** ลำดับสำหรับเลือก redirect เมนูแรก */
export const ADMIN_MENU_KEY_ORDER: AdminMenuKey[] = [
  'dashboard',
  'users',
  'products_categories',
  'products_list',
  'suppliers',
  'suppliers_api_keys',
  'orders',
  'payments',
  'analytics',
  'audit_logs',
  'nav_roles',
  'news',
];

export const ADMIN_NAV_ITEMS: AdminNavItemDef[] = [
  { menuKey: 'dashboard', labelKey: 'admin.menu.dashboard', path: '/admin/dashboard', Icon: Dashboard },
  { menuKey: 'users', labelKey: 'admin.menu.users', path: '/admin/users', Icon: People },
  {
    labelKey: 'admin.nav.products',
    Icon: Inventory2,
    children: [
      { menuKey: 'products_categories', labelKey: 'admin.menu.products_categories', path: '/admin/products/categories', Icon: AccountTree },
      { menuKey: 'products_list', labelKey: 'admin.menu.products_list', path: '/admin/products', Icon: Inventory2 },
    ],
  },
  {
    labelKey: 'admin.nav.suppliers',
    Icon: LocalShipping,
    children: [
      { menuKey: 'suppliers', labelKey: 'admin.menu.suppliers', path: '/admin/suppliers', Icon: LocalShipping },
      { menuKey: 'suppliers_api_keys', labelKey: 'admin.menu.suppliers_api_keys', path: '/admin/suppliers/api-keys', Icon: VpnKey },
    ],
  },
  { menuKey: 'orders', labelKey: 'admin.menu.orders', path: '/admin/orders', Icon: ShoppingCart },
  { menuKey: 'payments', labelKey: 'admin.menu.payments', path: '/admin/payments', Icon: Payment },
  { menuKey: 'analytics', labelKey: 'admin.menu.analytics', path: '/admin/analytics', Icon: BarChart },
  { menuKey: 'audit_logs', labelKey: 'admin.menu.audit_logs', path: '/admin/audit-logs', Icon: History },
  { menuKey: 'nav_roles', labelKey: 'admin.menu.nav_roles', path: '/admin/nav-roles', Icon: AdminPanelSettings },
  { menuKey: 'news', labelKey: 'admin.menu.news', path: '/admin/news', Icon: Newspaper },
];
