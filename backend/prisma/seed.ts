import 'dotenv/config';
import { PrismaClient, UserRole, ApiKeyEnvironment, ProductStatus } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcryptjs';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

type CatSeed = {
  name: string;
  description: string;
  sortOrder: number;
  imageUrl?: string | null;
};

type ProductSeed = {
  name: string;
  categoryKey: string;
  description: string;
  sellingPrice: number;
  sortOrder: number;
  isFeatured?: boolean;
  status?: ProductStatus;
};

async function ensureProduct(params: {
  categoryId: string;
  name: string;
  description: string;
  sellingPrice: number;
  sortOrder: number;
  isFeatured?: boolean;
  status?: ProductStatus;
  imageUrl?: string | null;
}) {
  const existing = await prisma.product.findFirst({
    where: { name: params.name, categoryId: params.categoryId },
  });
  const data = {
    categoryId: params.categoryId,
    name: params.name,
    description: params.description,
    sellingPrice: params.sellingPrice,
    sortOrder: params.sortOrder,
    isFeatured: params.isFeatured ?? false,
    status: params.status ?? ProductStatus.ACTIVE,
    imageUrl: params.imageUrl ?? null,
  };
  if (existing) {
    return prisma.product.update({ where: { id: existing.id }, data });
  }
  return prisma.product.create({ data });
}

async function main() {
  console.log('🌱 Starting seed...');

  // ── Users ──────────────────────────────────────────────────────────
  const superAdminPassword = await bcrypt.hash('SuperAdmin123!', 10);
  const adminPassword = await bcrypt.hash('Admin123!', 10);
  const customerPassword = await bcrypt.hash('Customer123!', 10);

  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@gamewallet.com' },
    update: {},
    create: {
      email: 'superadmin@gamewallet.com',
      username: 'superadmin',
      password: superAdminPassword,
      fullName: 'Super Administrator',
      role: UserRole.SUPER_ADMIN,
      wallet: { create: { balance: 0 } },
    },
  });

  const admin = await prisma.user.upsert({
    where: { email: 'admin@gamewallet.com' },
    update: {},
    create: {
      email: 'admin@gamewallet.com',
      username: 'admin',
      password: adminPassword,
      fullName: 'Administrator',
      role: UserRole.ADMIN,
      wallet: { create: { balance: 0 } },
    },
  });

  const agentPassword = await bcrypt.hash('Agent123!', 10);
  const agent = await prisma.user.upsert({
    where: { email: 'agent@gamewallet.com' },
    update: { agentCode: 'GW-A1' },
    create: {
      email: 'agent@gamewallet.com',
      username: 'agent01',
      password: agentPassword,
      fullName: 'Sales Agent',
      role: UserRole.AGENT,
      agentCode: 'GW-A1',
      wallet: { create: { balance: 0 } },
    },
  });

  const customer = await prisma.user.upsert({
    where: { email: 'customer@gamewallet.com' },
    update: { agentId: agent.id },
    create: {
      email: 'customer@gamewallet.com',
      username: 'customer01',
      password: customerPassword,
      fullName: 'Test Customer',
      phone: '0812345678',
      role: UserRole.CUSTOMER,
      agentId: agent.id,
      wallet: { create: { balance: 500 } },
    },
  });

  const MENU_ALL = [
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
  ];

  await prisma.adminNavRole.upsert({
    where: { slug: 'full-admin' },
    update: { menuKeys: MENU_ALL },
    create: {
      slug: 'full-admin',
      name: 'Admin เห็นทุกเมนู',
      description: 'ค่าเริ่มต้นระบบ',
      menuKeys: MENU_ALL,
      isSystem: true,
    },
  });

  await prisma.adminNavRole.upsert({
    where: { slug: 'orders-only' },
    update: {},
    create: {
      slug: 'orders-only',
      name: 'เฉพาะออเดอร์ + Dashboard',
      description: 'ตัวอย่างจำกัดเมนู',
      menuKeys: ['dashboard', 'orders'],
      isSystem: false,
    },
  });

  console.log('✅ Users:', {
    superAdmin: superAdmin.email,
    admin: admin.email,
    agent: agent.email,
    customer: customer.email,
  });

  // ── Product Categories (mockup ขยาย) ───────────────────────────────
  const categories: CatSeed[] = [
    {
      name: 'Mobile Games',
      description: 'เติมเกมมือถือ MOBA, Battle Royale, FPS',
      sortOrder: 1,
      imageUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400&h=400&fit=crop&q=60',
    },
    {
      name: 'PC Games',
      description: 'Steam, Epic, Riot, Blizzard และเกม PC อื่นๆ',
      sortOrder: 2,
      imageUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&h=400&fit=crop&q=60',
    },
    {
      name: 'Console Games',
      description: 'PlayStation, Xbox, Nintendo eShop',
      sortOrder: 3,
      imageUrl: 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=400&h=400&fit=crop&q=60',
    },
    {
      name: 'Gift Cards',
      description: 'บัตรของขวัญดิจิทัล Google Play, App Store, แพลตฟอร์มต่างๆ',
      sortOrder: 4,
      imageUrl: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=400&fit=crop&q=60',
    },
    {
      name: 'Streaming',
      description: 'Netflix, Spotify, Disney+ และบริการสตรีมมิ่ง',
      sortOrder: 5,
      imageUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&h=400&fit=crop&q=60',
    },
    {
      name: 'Voucher & Top-up',
      description: 'บัตรเติมเงิน Shopee, Lazada, TrueMoney (mock)',
      sortOrder: 6,
      imageUrl: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=400&h=400&fit=crop&q=60',
    },
    {
      name: 'Apps & Premium',
      description: 'YouTube Premium, Discord Nitro, ChatGPT Plus (mock)',
      sortOrder: 7,
      imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=400&fit=crop&q=60',
    },
    {
      name: 'Game Keys & DLC',
      description: 'คีย์เกม Steam/Epic และ DLC (mock)',
      sortOrder: 8,
      imageUrl: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=400&h=400&fit=crop&q=60',
    },
  ];

  const createdCategories: Record<string, { id: string; name: string }> = {};
  for (const cat of categories) {
    const c = await prisma.productCategory.upsert({
      where: { name: cat.name },
      update: {
        description: cat.description,
        sortOrder: cat.sortOrder,
        imageUrl: cat.imageUrl ?? null,
        isActive: true,
      },
      create: {
        name: cat.name,
        description: cat.description,
        sortOrder: cat.sortOrder,
        imageUrl: cat.imageUrl ?? null,
        isActive: true,
      },
    });
    createdCategories[cat.name] = c;
  }

  console.log('✅ Product categories:', Object.keys(createdCategories).length, 'หมวด');

  // ── Products (mockup จำนวนมาก) ─────────────────────────────────────
  const products: ProductSeed[] = [
    // Mobile Games
    { name: 'Mobile Legends - 86 Diamonds', categoryKey: 'Mobile Games', description: 'เพชร Mobile Legends แพ็กเริ่มต้น', sellingPrice: 49, sortOrder: 1, isFeatured: true },
    { name: 'Mobile Legends - 100 Diamonds', categoryKey: 'Mobile Games', description: 'เพชร MLBB 100 เม็ด', sellingPrice: 59, sortOrder: 2, isFeatured: true },
    { name: 'Mobile Legends - 172 Diamonds', categoryKey: 'Mobile Games', description: 'แพ็กยอดนิยม', sellingPrice: 99, sortOrder: 3 },
    { name: 'Mobile Legends - 275 Diamonds', categoryKey: 'Mobile Games', description: 'เพชร 275 เม็ด', sellingPrice: 149, sortOrder: 4, isFeatured: true },
    { name: 'Mobile Legends - 568 Diamonds', categoryKey: 'Mobile Games', description: 'แพ็กกลาง', sellingPrice: 299, sortOrder: 5 },
    { name: 'Mobile Legends - 1150 Diamonds', categoryKey: 'Mobile Games', description: 'แพ็กใหญ่', sellingPrice: 599, sortOrder: 6 },
    { name: 'PUBG Mobile - 60 UC', categoryKey: 'Mobile Games', description: 'Unknown Cash 60 UC', sellingPrice: 49, sortOrder: 7 },
    { name: 'PUBG Mobile - 180 UC', categoryKey: 'Mobile Games', description: 'UC 180', sellingPrice: 139, sortOrder: 8 },
    { name: 'PUBG Mobile - 660 UC', categoryKey: 'Mobile Games', description: 'UC 660', sellingPrice: 449, sortOrder: 9 },
    { name: 'Free Fire - 100 Diamonds', categoryKey: 'Mobile Games', description: 'เพชร Free Fire', sellingPrice: 49, sortOrder: 10 },
    { name: 'Free Fire - 310 Diamonds', categoryKey: 'Mobile Games', description: 'แพ็ก 310', sellingPrice: 149, sortOrder: 11 },
    { name: 'Genshin Impact - 60 Genesis Crystals', categoryKey: 'Mobile Games', description: 'คริสตัล Genshin (mock)', sellingPrice: 35, sortOrder: 12, isFeatured: true },
    { name: 'Genshin Impact - 300 Genesis Crystals', categoryKey: 'Mobile Games', description: 'แพ็ก 300 คริสตัล', sellingPrice: 179, sortOrder: 13 },
    { name: 'Honkai: Star Rail - 60 Oneiric Shard', categoryKey: 'Mobile Games', description: 'Shard HSR (mock)', sellingPrice: 35, sortOrder: 14 },
    { name: 'Arena of Valor - 40 Vouchers', categoryKey: 'Mobile Games', description: 'บัตร AoV', sellingPrice: 39, sortOrder: 15 },
    { name: 'Call of Duty Mobile - 80 CP', categoryKey: 'Mobile Games', description: 'COD Points', sellingPrice: 45, sortOrder: 16 },
    { name: 'Roblox - 400 Robux', categoryKey: 'Mobile Games', description: 'Robux สำหรับ Roblox', sellingPrice: 149, sortOrder: 17 },

    // PC Games
    { name: 'Steam Wallet - 50 THB', categoryKey: 'PC Games', description: 'เติม Steam Wallet 50 บาท', sellingPrice: 50, sortOrder: 1 },
    { name: 'Steam Wallet - 100 THB', categoryKey: 'PC Games', description: 'Steam 100 บาท', sellingPrice: 100, sortOrder: 2, isFeatured: true },
    { name: 'Steam Wallet - 300 THB', categoryKey: 'PC Games', description: 'Steam 300 บาท', sellingPrice: 300, sortOrder: 3, isFeatured: true },
    { name: 'Steam Wallet - 500 THB', categoryKey: 'PC Games', description: 'Steam 500 บาท', sellingPrice: 500, sortOrder: 4 },
    { name: 'Steam Wallet - 1000 THB', categoryKey: 'PC Games', description: 'Steam 1000 บาท', sellingPrice: 1000, sortOrder: 5 },
    { name: 'Riot Points - 350 RP (TH)', categoryKey: 'PC Games', description: 'RP สำหรับ League / VALORANT (mock)', sellingPrice: 99, sortOrder: 6 },
    { name: 'Riot Points - 850 RP (TH)', categoryKey: 'PC Games', description: 'แพ็ก RP กลาง', sellingPrice: 249, sortOrder: 7 },
    { name: 'Epic Games - $10 USD Card', categoryKey: 'PC Games', description: 'บัตร Epic (mock)', sellingPrice: 369, sortOrder: 8 },
    { name: 'Blizzard Battle.net - 500 THB', categoryKey: 'PC Games', description: 'เติม Battle.net (mock)', sellingPrice: 500, sortOrder: 9 },

    // Console Games
    { name: 'PlayStation Store - 500 THB', categoryKey: 'Console Games', description: 'เครดิต PS Store ไทย (mock)', sellingPrice: 500, sortOrder: 1, isFeatured: true },
    { name: 'PlayStation Store - 1000 THB', categoryKey: 'Console Games', description: 'เครดิต PS 1000', sellingPrice: 1000, sortOrder: 2 },
    { name: 'PlayStation Plus - 1 Month', categoryKey: 'Console Games', description: 'สมาชิก PS Plus 1 เดือน (mock)', sellingPrice: 199, sortOrder: 3 },
    { name: 'Xbox Gift Card - 500 THB', categoryKey: 'Console Games', description: 'บัตร Xbox (mock)', sellingPrice: 500, sortOrder: 4 },
    { name: 'Nintendo eShop - 300 THB', categoryKey: 'Console Games', description: 'เครดิต Nintendo (mock)', sellingPrice: 300, sortOrder: 5 },
    { name: 'Nintendo eShop - 1000 THB', categoryKey: 'Console Games', description: 'เครดิต Nintendo 1000', sellingPrice: 1000, sortOrder: 6 },

    // Gift Cards
    { name: 'Google Play - 50 THB', categoryKey: 'Gift Cards', description: 'บัตร Google Play 50', sellingPrice: 50, sortOrder: 1 },
    { name: 'Google Play - 100 THB', categoryKey: 'Gift Cards', description: 'บัตร Google Play 100', sellingPrice: 100, sortOrder: 2, isFeatured: true },
    { name: 'Google Play - 300 THB', categoryKey: 'Gift Cards', description: 'บัตร Google Play 300', sellingPrice: 300, sortOrder: 3 },
    { name: 'Google Play - 500 THB', categoryKey: 'Gift Cards', description: 'บัตร Google Play 500', sellingPrice: 500, sortOrder: 4 },
    { name: 'App Store - 100 THB', categoryKey: 'Gift Cards', description: 'บัตร App Store / iTunes', sellingPrice: 100, sortOrder: 5 },
    { name: 'App Store - 300 THB', categoryKey: 'Gift Cards', description: 'บัตร App Store 300', sellingPrice: 300, sortOrder: 6 },
    { name: 'TrueMoney Wallet - 100 THB', categoryKey: 'Gift Cards', description: 'เติม TrueMoney (mock)', sellingPrice: 100, sortOrder: 7 },

    // Streaming
    { name: 'Netflix - 1 Month (Mobile)', categoryKey: 'Streaming', description: 'แพ็กมือถือ 1 เดือน (mock)', sellingPrice: 99, sortOrder: 1 },
    { name: 'Netflix - 1 Month (Standard)', categoryKey: 'Streaming', description: 'Netflix Standard 1 เดือน', sellingPrice: 219, sortOrder: 2, isFeatured: true },
    { name: 'Netflix - 1 Month (Premium)', categoryKey: 'Streaming', description: 'Netflix Premium 4K', sellingPrice: 319, sortOrder: 3 },
    { name: 'Spotify Premium - 1 Month', categoryKey: 'Streaming', description: 'Spotify ไม่มีโฆษณา', sellingPrice: 129, sortOrder: 4, isFeatured: true },
    { name: 'Spotify Premium - 3 Months', categoryKey: 'Streaming', description: 'แพ็ก 3 เดือน (mock)', sellingPrice: 349, sortOrder: 5 },
    { name: 'YouTube Premium - 1 Month', categoryKey: 'Streaming', description: 'ฟังเพลงปิดหน้าจอ (mock)', sellingPrice: 159, sortOrder: 6 },
    { name: 'Disney+ Hotstar - 1 Month', categoryKey: 'Streaming', description: 'Disney+ ไทย (mock)', sellingPrice: 149, sortOrder: 7 },
    { name: 'Viu Premium - 1 Month', categoryKey: 'Streaming', description: 'ซีรีส์เกาหลีไม่มีโฆษณา (mock)', sellingPrice: 79, sortOrder: 8 },

    // Voucher & Top-up
    { name: 'ShopeePay - 100 THB Voucher', categoryKey: 'Voucher & Top-up', description: 'เติม ShopeePay mock', sellingPrice: 100, sortOrder: 1 },
    { name: 'Lazada Wallet - 200 THB', categoryKey: 'Voucher & Top-up', description: 'เติม Lazada mock', sellingPrice: 200, sortOrder: 2 },
    { name: 'LINE Coins - 50 Coins', categoryKey: 'Voucher & Top-up', description: 'เหรียญ LINE (mock)', sellingPrice: 45, sortOrder: 3 },
    { name: 'LINE Coins - 150 Coins', categoryKey: 'Voucher & Top-up', description: 'แพ็ก LINE Coins', sellingPrice: 129, sortOrder: 4 },

    // Apps & Premium
    { name: 'Discord Nitro - 1 Month', categoryKey: 'Apps & Premium', description: 'Nitro Classic mock', sellingPrice: 189, sortOrder: 1, isFeatured: true },
    { name: 'ChatGPT Plus - 1 Month', categoryKey: 'Apps & Premium', description: 'สมาชิก Plus mock', sellingPrice: 650, sortOrder: 2 },
    { name: 'Canva Pro - 1 Month', categoryKey: 'Apps & Premium', description: 'Canva Pro mock', sellingPrice: 199, sortOrder: 3 },

    // Game Keys & DLC
    { name: 'Steam Random Key - Indie', categoryKey: 'Game Keys & DLC', description: 'คีย์เกมอินดี้สุ่ม (mock)', sellingPrice: 29, sortOrder: 1 },
    { name: 'Steam Random Key - AA Title', categoryKey: 'Game Keys & DLC', description: 'คีย์เกมคุณภาพสุ่ม (mock)', sellingPrice: 199, sortOrder: 2 },
    { name: 'DLC Expansion Pack (Mock)', categoryKey: 'Game Keys & DLC', description: 'แพ็ก DLC ตัวอย่าง', sellingPrice: 399, sortOrder: 3 },
  ];

  /** รูปตัวอย่างสินค้า (หมุนเวียน) — URL ตรงจาก Unsplash */
  const productImagePool = [
    'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&h=400&fit=crop&q=60',
    'https://images.unsplash.com/photo-1542751110-97427bbecf20?w=600&h=400&fit=crop&q=60',
    'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&h=400&fit=crop&q=60',
    'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=600&h=400&fit=crop&q=60',
    'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=600&h=400&fit=crop&q=60',
    'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=600&h=400&fit=crop&q=60',
  ];

  let productCount = 0;
  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    const category = createdCategories[p.categoryKey];
    if (!category) {
      console.warn('⚠️ ข้ามสินค้า — ไม่มีหมวด:', p.categoryKey, p.name);
      continue;
    }
    await ensureProduct({
      categoryId: category.id,
      name: p.name,
      description: p.description,
      sellingPrice: p.sellingPrice,
      sortOrder: p.sortOrder,
      isFeatured: p.isFeatured,
      status: p.status,
      imageUrl: productImagePool[i % productImagePool.length],
    });
    productCount += 1;
  }

  console.log('✅ Products upsert:', productCount, 'รายการ');

  // ── Suppliers ──────────────────────────────────────────────────────
  const suppliers = [
    {
      name: 'Supplier Alpha',
      code: 'SUPPLIER_ALPHA',
      description: 'Primary supplier with competitive pricing',
      baseUrl: 'https://api.supplier-alpha.example.com',
      priority: 1,
      timeout: 30000,
      maxRetries: 3,
    },
    {
      name: 'Supplier Beta',
      code: 'SUPPLIER_BETA',
      description: 'Backup supplier for high availability',
      baseUrl: 'https://api.supplier-beta.example.com',
      priority: 2,
      timeout: 25000,
      maxRetries: 2,
    },
    {
      name: 'Supplier Gamma',
      code: 'SUPPLIER_GAMMA',
      description: 'Specialized supplier for gift cards',
      baseUrl: 'https://api.supplier-gamma.example.com',
      priority: 3,
      timeout: 20000,
      maxRetries: 3,
    },
  ];

  const createdSuppliers: Record<string, any> = {};
  for (const s of suppliers) {
    const supplier = await prisma.supplier.upsert({
      where: { code: s.code },
      update: {},
      create: s,
    });
    createdSuppliers[s.code] = supplier;

    // Create demo API key
    await prisma.supplierApiKey.upsert({
      where: { id: (await prisma.supplierApiKey.findFirst({ where: { supplierId: supplier.id, keyName: 'Authorization' } }))?.id || 'none' },
      update: {},
      create: {
        supplierId: supplier.id,
        keyName: 'Authorization',
        keyValue: `Bearer demo_api_key_${s.code.toLowerCase()}_prod`,
        environment: ApiKeyEnvironment.PRODUCTION,
      },
    });

    // Create response mapping
    const mappings = [
      { fieldName: 'status', supplierField: 'status', systemField: 'orderStatus', valueMapping: { done: 'SUCCESS', processing: 'PENDING', failed: 'FAILED', error: 'FAILED' } },
      { fieldName: 'reference', supplierField: 'transaction_id', systemField: 'supplierRef' },
      { fieldName: 'errorCode', supplierField: 'error_code', systemField: 'errorCode' },
    ];

    for (const m of mappings) {
      const existing = await prisma.supplierResponseMapping.findFirst({
        where: { supplierId: supplier.id, fieldName: m.fieldName },
      });
      if (!existing) {
        await prisma.supplierResponseMapping.create({
          data: { supplierId: supplier.id, ...m },
        });
      }
    }
  }

  console.log('✅ Suppliers created with API keys and response mappings');

  // ── Supplier Products (ราคาต้นทุน mock — ทุกสินค้า x 3 suppliers) ───────
  const supplierAlpha = createdSuppliers['SUPPLIER_ALPHA'];
  const supplierBeta = createdSuppliers['SUPPLIER_BETA'];
  const supplierGamma = createdSuppliers['SUPPLIER_GAMMA'];

  const allProductsForSupplier = await prisma.product.findMany({
    where: { status: ProductStatus.ACTIVE },
    select: { id: true, name: true, sellingPrice: true },
  });

  for (const product of allProductsForSupplier) {
    const sell = Number(product.sellingPrice);
    const pairs: { supplierId: string; cost: number; sku: string }[] = [
      {
        supplierId: supplierAlpha.id,
        cost: Math.max(1, Math.round(sell * 0.82 * 100) / 100),
        sku: `ALPHA-${product.id.slice(0, 8).toUpperCase()}`,
      },
      {
        supplierId: supplierBeta.id,
        cost: Math.max(1, Math.round(sell * 0.86 * 100) / 100),
        sku: `BETA-${product.id.slice(0, 8).toUpperCase()}`,
      },
      {
        supplierId: supplierGamma.id,
        cost: Math.max(1, Math.round(sell * 0.88 * 100) / 100),
        sku: `GAMMA-${product.id.slice(0, 8).toUpperCase()}`,
      },
    ];

    for (const { supplierId, cost, sku } of pairs) {
      await prisma.supplierProduct.upsert({
        where: { supplierId_productId: { supplierId, productId: product.id } },
        update: { costPrice: cost, supplierSku: sku, isAvailable: true },
        create: { supplierId, productId: product.id, supplierSku: sku, costPrice: cost },
      });
    }
  }

  console.log(
    '✅ Supplier products:',
    allProductsForSupplier.length,
    'สินค้า × 3 suppliers =',
    allProductsForSupplier.length * 3,
    'แถว',
  );

  // ── Sample news (รูปจาก Unsplash — URL ตรง) ─────────────────────────
  const newsSamples: Array<{
    slug: string;
    title: string;
    excerpt: string;
    coverImageUrl: string;
    body: string;
    pinned: boolean;
    isPublished: boolean;
  }> = [
    {
      slug: 'gamewallet-welcome-digital-topup',
      title: 'ยินดีต้อนรับสู่ GameWallet — เติมเกม & สินค้าดิจิทัล ราคาดีที่สุด',
      excerpt:
        'แพลตฟอร์มเปรียบเทียบราคาจากหลาย Supplier อัตโนมัติ คัดราคาที่ดีที่สุดให้คุณทุกครั้ง',
      coverImageUrl:
        'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=900&auto=format&fit=crop&q=60',
      body: [
        'GameWallet คือแพลตฟอร์มเติมเกมและสินค้าดิจิทัลที่เชื่อมหลาย Supplier เข้าด้วยกัน',
        '',
        '• เปรียบเทียบราคาอัตโนมัติ',
        '• กระเป๋าเงินในตัว — เติมและจ่ายได้รวดเร็ว',
        '• ติดตามคำสั่งซื้อและประวัติการชำระเงินได้ในที่เดียว',
        '',
        'เราพัฒนาระบบอย่างต่อเนื่องเพื่อประสบการณ์ที่รวดเร็วและปลอดภัย ขอบคุณที่ไว้วางใจ GameWallet',
      ].join('\n'),
      pinned: true,
      isPublished: true,
    },
    {
      slug: 'security-two-factor-authentication',
      title: 'อัปเดตความปลอดภัย: เปิดใช้งาน 2FA ได้แล้ว',
      excerpt:
        'รองรับทั้ง Google Authenticator (TOTP) และรหัสยืนยันทางอีเมล — แนะนำให้เปิดใช้เพื่อความปลอดภัยของบัญชี',
      coverImageUrl:
        'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=900&auto=format&fit=crop&q=60',
      body: [
        'ตอนนี้คุณสามารถเปิดการยืนยันตัวตนสองขั้นตอน (2FA) ได้จากหน้าโปรไฟล์',
        '',
        'วิธีที่รองรับ:',
        '1) แอป Authenticator (เช่น Google Authenticator) — สแกน QR หรือใส่ Secret',
        '2) รหัสยืนยันทางอีเมล — ระบบจะส่งรหัส 6 หลักไปที่อีเมลของคุณ',
        '',
        'ค่าเริ่มต้นบัญชีไม่บังคับ 2FA — คุณเลือกเปิดเมื่อพร้อมได้',
      ].join('\n'),
      pinned: false,
      isPublished: true,
    },
    {
      slug: 'weekend-topup-bonus-hint',
      title: 'โปรโมชั่นสุดสัปดาห์: เติมเงินกระเป๋า รับโบนัสพิเศษ',
      excerpt: 'ติดตามประกาศโปรโมชั่นและเงื่อนไขได้ที่หน้าข่าวสารและอีเมลจากเรา',
      coverImageUrl:
        'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=900&auto=format&fit=crop&q=60',
      body: [
        'ช่วงสุดสัปดาห์นี้เรามีกิจกรรมเติมเงินกระเป๋า GameWallet พร้อมโบนัสสำหรับลูกค้าที่เข้าเงื่อนไข',
        '',
        'รายละเอียดและระยะเวลาโปรโมชั่นจะประกาศในหน้านี้และทางอีเมล — อย่าพลาด!',
        '',
        '* เงื่อนไขเป็นไปตามที่บริษัทกำหนด',
      ].join('\n'),
      pinned: false,
      isPublished: true,
    },
  ];

  const now = new Date();
  for (const n of newsSamples) {
    await prisma.newsArticle.upsert({
      where: { slug: n.slug },
      update: {
        title: n.title,
        excerpt: n.excerpt,
        coverImageUrl: n.coverImageUrl,
        body: n.body,
        isPublished: n.isPublished,
        pinned: n.pinned,
        publishedAt: n.isPublished ? now : null,
      },
      create: {
        slug: n.slug,
        title: n.title,
        excerpt: n.excerpt,
        coverImageUrl: n.coverImageUrl,
        body: n.body,
        isPublished: n.isPublished,
        pinned: n.pinned,
        publishedAt: n.isPublished ? now : null,
      },
    });
  }
  console.log('✅ Sample news articles:', newsSamples.length, 'รายการ (พร้อมรูปปก)');

  // ── Payment Channels ──────────────────────────────────────────────
  const paymentChannels = [
    { name: 'PromptPay QR', code: 'PROMPTPAY', description: 'PromptPay QR Code payment', sortOrder: 1 },
    { name: 'Omise', code: 'OMISE', description: 'Omise payment gateway', sortOrder: 2 },
    { name: 'Wallet', code: 'WALLET', description: 'GameWallet internal wallet', sortOrder: 3 },
    { name: 'Slip Verification', code: 'SLIP', description: 'Bank transfer with slip upload', sortOrder: 4 },
  ];

  for (const pc of paymentChannels) {
    await prisma.paymentChannel.upsert({
      where: { code: pc.code },
      update: {},
      create: pc,
    });
  }

  console.log('✅ Payment channels created');

  console.log('\n🎉 Seed completed successfully!');
  console.log('\n📋 Test Accounts:');
  console.log('  Super Admin: superadmin@gamewallet.com / SuperAdmin123!');
  console.log('  Admin:       admin@gamewallet.com / Admin123!');
  console.log('  Customer:    customer@gamewallet.com / Customer123!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
