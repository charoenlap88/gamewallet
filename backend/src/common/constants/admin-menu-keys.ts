/** คีย์เมนู Admin — ต้องตรงกับ frontend `config/adminMenuKeys.ts` */
export const ADMIN_MENU_KEYS = [
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
] as const;

export type AdminMenuKey = (typeof ADMIN_MENU_KEYS)[number];

const SET = new Set<string>(ADMIN_MENU_KEYS);

export function isValidMenuKey(k: string): k is AdminMenuKey {
  return SET.has(k);
}

export function sanitizeMenuKeys(keys: string[]): AdminMenuKey[] {
  return keys.filter((k) => isValidMenuKey(k)) as AdminMenuKey[];
}
