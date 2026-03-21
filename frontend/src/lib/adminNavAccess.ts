import {
  ADMIN_MENU_KEY_ORDER,
  type AdminMenuKey,
  type AdminNavItemDef,
} from '../config/adminMenuKeys';
import type { UserRole } from '../types';

/** ตรวจว่า path ปัจจุบันอยู่ในสิทธิ์เมนูหรือไม่ */
export function isAdminPathAllowed(
  pathname: string,
  navMenuKeys: string[] | null | undefined,
  role: UserRole,
): boolean {
  if (pathname.startsWith('/admin/nav-roles') && role !== 'SUPER_ADMIN') return false;
  if (role === 'SUPER_ADMIN') return true;
  if (role !== 'ADMIN') return false;
  if (!navMenuKeys?.length) return true;
  if (pathname === '/admin' || pathname === '/admin/') return true;

  return navMenuKeys.some((k) => keyAllowsPath(k as AdminMenuKey, pathname));
}

function keyAllowsPath(key: AdminMenuKey, pathname: string): boolean {
  switch (key) {
    case 'dashboard':
      return pathname === '/admin/dashboard' || pathname.startsWith('/admin/dashboard/');
    case 'users':
      return pathname.startsWith('/admin/users');
    case 'products_categories':
      return pathname.startsWith('/admin/products/categories');
    case 'products_list':
      return (
        pathname.startsWith('/admin/products') &&
        !pathname.startsWith('/admin/products/categories')
      );
    case 'suppliers':
      return (
        pathname.startsWith('/admin/suppliers') &&
        !pathname.startsWith('/admin/suppliers/api-keys')
      );
    case 'suppliers_api_keys':
      return pathname.startsWith('/admin/suppliers/api-keys');
    case 'orders':
      return pathname.startsWith('/admin/orders');
    case 'payments':
      return pathname.startsWith('/admin/payments');
    case 'analytics':
      return pathname.startsWith('/admin/analytics');
    case 'audit_logs':
      return pathname.startsWith('/admin/audit-logs');
    case 'nav_roles':
      return pathname.startsWith('/admin/nav-roles');
    case 'news':
      return pathname.startsWith('/admin/news');
    default:
      return false;
  }
}

export function getFirstAllowedAdminPath(
  navMenuKeys: string[] | null | undefined,
  role: UserRole,
): string {
  if (role === 'SUPER_ADMIN' || !navMenuKeys?.length) return '/admin/dashboard';
  for (const k of ADMIN_MENU_KEY_ORDER) {
    if (navMenuKeys.includes(k)) {
      const p = pathForMenuKey(k);
      if (p) return p;
    }
  }
  return '/admin/dashboard';
}

function pathForMenuKey(key: AdminMenuKey): string | null {
  const map: Record<AdminMenuKey, string> = {
    dashboard: '/admin/dashboard',
    users: '/admin/users',
    products_categories: '/admin/products/categories',
    products_list: '/admin/products',
    suppliers: '/admin/suppliers',
    suppliers_api_keys: '/admin/suppliers/api-keys',
    orders: '/admin/orders',
    payments: '/admin/payments',
    analytics: '/admin/analytics',
    audit_logs: '/admin/audit-logs',
    nav_roles: '/admin/nav-roles',
    news: '/admin/news',
  };
  return map[key] ?? null;
}

export function filterAdminNavItems(
  items: AdminNavItemDef[],
  navMenuKeys: string[] | null | undefined,
  role: UserRole,
): AdminNavItemDef[] {
  const withoutSuperOnly = items.filter((i) => i.menuKey !== 'nav_roles');
  if (role === 'SUPER_ADMIN') return items;
  if (role !== 'ADMIN' || !navMenuKeys?.length) return withoutSuperOnly;
  const set = new Set(navMenuKeys);
  return withoutSuperOnly
    .map((item) => {
      if (item.children?.length) {
        const ch = item.children.filter((c) => c.menuKey && set.has(c.menuKey));
        if (ch.length === 0) return null;
        return { ...item, children: ch };
      }
      if (item.menuKey && set.has(item.menuKey)) return item;
      return null;
    })
    .filter((x): x is AdminNavItemDef => x != null);
}
