import { UserRole } from '@prisma/client';

/** null = แสดงเมนู admin ทั้งหมด */
export function resolveNavMenuKeys(
  role: UserRole,
  navRole?: { menuKeys: string[] } | null,
): string[] | null {
  if (role === UserRole.SUPER_ADMIN) return null;
  if (role === UserRole.ADMIN) {
    if (navRole?.menuKeys?.length) return [...navRole.menuKeys];
    return null;
  }
  return null;
}
