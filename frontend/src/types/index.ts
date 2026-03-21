export type UserRole = 'CUSTOMER' | 'AGENT' | 'ADMIN' | 'SUPER_ADMIN';
export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'INACTIVE';
export type OrderStatus = 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILED' | 'CANCELLED' | 'REFUNDED';
export type PaymentMethod = 'WALLET' | 'PROMPTPAY' | 'OMISE' | 'SLIP';
export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED' | 'REFUNDED';
export type SupplierStatus = 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
export type ProductStatus = 'ACTIVE' | 'INACTIVE' | 'OUT_OF_STOCK';

export interface User {
  id: string;
  email: string;
  username: string;
  fullName: string | null;
  phone: string | null;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
  wallet?: Wallet;
  /** null = เห็นเมนู admin ทั้งหมด (ADMIN) */
  navMenuKeys?: string[] | null;
  agentCode?: string | null;
  navRole?: { id: string; name: string; slug: string } | null;
  /** มีรหัสผ่านในระบบ (เข้าแบบ email/password ได้) */
  hasPassword?: boolean;
  /** เชื่อมบัญชี Google แล้ว */
  googleLinked?: boolean;
  /** 2FA — NONE | TOTP (แอป Authenticator) | EMAIL */
  twoFactorMethod?: 'NONE' | 'TOTP' | 'EMAIL';
}

export interface NewsArticle {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  /** URL รูปปก */
  coverImageUrl?: string | null;
  body: string;
  isPublished: boolean;
  pinned: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Wallet {
  id: string;
  userId: string;
  balance: string | number;
}

export interface WalletTransaction {
  id: string;
  type: 'TOPUP' | 'PURCHASE' | 'REFUND' | 'ADJUSTMENT';
  amount: string | number;
  balanceBefore: string | number;
  balanceAfter: string | number;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  description: string | null;
  createdAt: string;
}

export interface ProductCategory {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  isActive: boolean;
  sortOrder: number;
  _count?: { products: number };
}

export interface Product {
  id: string;
  categoryId: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  sellingPrice: string | number;
  status: ProductStatus;
  isFeatured: boolean;
  sortOrder: number;
  category?: ProductCategory;
}

export interface Supplier {
  id: string;
  name: string;
  code: string;
  description: string | null;
  baseUrl: string;
  status: SupplierStatus;
  priority: number;
  timeout: number;
  maxRetries: number;
  _count?: { apiKeys: number; supplierProducts: number };
}

export interface SupplierApiKey {
  id: string;
  supplierId: string;
  keyName: string;
  environment: 'UAT' | 'PRODUCTION';
  status: 'ACTIVE' | 'INACTIVE' | 'EXPIRED';
  expiresAt: string | null;
}

export interface SupplierResponseMapping {
  id: string;
  supplierId: string;
  fieldName: string;
  supplierField: string;
  systemField: string;
  valueMapping: Record<string, string> | null;
  description: string | null;
}

export interface Order {
  id: string;
  userId: string;
  status: OrderStatus;
  totalAmount: string | number;
  finalAmount: string | number;
  paymentMethod: PaymentMethod;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  items?: OrderItem[];
  payment?: Payment;
  user?: { email: string; username: string };
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  unitPrice: string | number;
  status: OrderStatus;
  retryCount: number;
  product?: { id: string; name: string };
  supplier?: { id: string; name: string };
}

export interface Payment {
  id: string;
  orderId: string;
  userId: string;
  method: PaymentMethod;
  amount: string | number;
  status: PaymentStatus;
  paidAt: string | null;
  createdAt: string;
}

export type AuditActionType =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'LOGIN'
  | 'LOGOUT'
  | 'RETRY'
  | 'CANCEL';

export interface AuditLog {
  id: string;
  userId: string | null;
  targetUserId?: string | null;
  action: AuditActionType | string;
  module: string;
  description: string;
  ipAddress: string | null;
  userAgent?: string | null;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  createdAt: string;
  user?: { id?: string; email: string; username: string };
}

/** GET /admin/dashboard */
export interface AdminDashboard {
  stats: {
    totalUsers: number;
    activeSuppliers: number;
    totalOrders: number;
    successOrders: number;
    pendingOrders: number;
    totalRevenue: number;
  };
  recentOrders?: unknown[];
  topProducts: Array<{ id?: string; name?: string; orderCount?: number }>;
}

/** GET /admin/analytics */
export interface AdminAnalytics {
  period: { key: 'day' | 'week' | 'month'; from: string; to: string };
  summary: {
    periodRevenue: number;
    successfulOrdersInPeriod: number;
    totalOrdersInPeriod: number;
  };
  ordersByStatus: Array<{ status: OrderStatus; _count: { status: number } }>;
  revenueByDay: Array<{ date: string; revenue: number; orders: number }>;
  topCategories: Array<{ name: string; quantity: number; revenue: number }>;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
}
