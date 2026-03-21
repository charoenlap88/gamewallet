import { Injectable, NotFoundException } from '@nestjs/common';
import { AuditAction, ProductStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogService, type AuditActorContext } from '../audit-log/audit-log.service';
import {
  CreateProductDto,
  UpdateProductDto,
  ProductQueryDto,
  CreateProductCategoryDto,
  UpdateProductCategoryDto,
} from './dto/product.dto';

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogService: AuditLogService,
  ) {}

  private normImageUrl(url?: string | null): string | null {
    const t = url?.trim();
    return t ? t : null;
  }

  // ── Categories ─────────────────────────────────────────────────────

  async findAllCategories() {
    return this.prisma.productCategory.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: { _count: { select: { products: true } } },
    });
  }

  async createCategory(dto: CreateProductCategoryDto, audit?: AuditActorContext) {
    const cat = await this.prisma.productCategory.create({
      data: { ...dto, imageUrl: this.normImageUrl(dto.imageUrl) },
    });
    if (audit) {
      await this.auditLogService.logSafe({
        userId: audit.actorId,
        action: AuditAction.CREATE,
        module: 'CATEGORY',
        description: `สร้างหมวดหมู่: ${cat.name}`,
        ipAddress: audit.ipAddress,
        userAgent: audit.userAgent,
      });
    }
    return cat;
  }

  async updateCategory(id: string, dto: UpdateProductCategoryDto, audit?: AuditActorContext) {
    const cat = await this.prisma.productCategory.findUnique({ where: { id } });
    if (!cat) throw new NotFoundException('Category not found');
    const data = { ...dto };
    if (dto.imageUrl !== undefined) {
      (data as { imageUrl?: string | null }).imageUrl = this.normImageUrl(dto.imageUrl);
    }
    const updated = await this.prisma.productCategory.update({ where: { id }, data });
    if (audit) {
      await this.auditLogService.logSafe({
        userId: audit.actorId,
        action: AuditAction.UPDATE,
        module: 'CATEGORY',
        description: `แก้ไขหมวดหมู่: ${updated.name}`,
        ipAddress: audit.ipAddress,
        userAgent: audit.userAgent,
        before: { name: cat.name, isActive: cat.isActive },
        after: dto as Record<string, unknown>,
      });
    }
    return updated;
  }

  // ── Products ───────────────────────────────────────────────────────

  async findAll(query: ProductQueryDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.status) where.status = query.status;
    if (query.categoryId) where.categoryId = query.categoryId;
    if (query.search) {
      where.name = { contains: query.search, mode: 'insensitive' };
    }

    const [data, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
        include: { category: { select: { id: true, name: true } } },
      }),
      this.prisma.product.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findPublic(query: ProductQueryDto) {
    return this.findAll({ ...query, status: ProductStatus.ACTIVE });
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        supplierPrices: {
          include: { supplier: { select: { id: true, name: true, status: true } } },
          where: { isAvailable: true },
        },
      },
    });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async create(dto: CreateProductDto, audit?: AuditActorContext) {
    const category = await this.prisma.productCategory.findUnique({
      where: { id: dto.categoryId },
    });
    if (!category) throw new NotFoundException('Category not found');
    const product = await this.prisma.product.create({
      data: { ...dto, imageUrl: this.normImageUrl(dto.imageUrl) },
    });
    if (audit) {
      await this.auditLogService.logSafe({
        userId: audit.actorId,
        action: AuditAction.CREATE,
        module: 'PRODUCT',
        description: `สร้างสินค้า: ${product.name}`,
        ipAddress: audit.ipAddress,
        userAgent: audit.userAgent,
      });
    }
    return product;
  }

  async update(id: string, dto: UpdateProductDto, audit?: AuditActorContext) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('Product not found');
    const data = { ...dto };
    if (dto.imageUrl !== undefined) {
      (data as { imageUrl?: string | null }).imageUrl = this.normImageUrl(dto.imageUrl);
    }
    const updated = await this.prisma.product.update({ where: { id }, data });
    if (audit) {
      await this.auditLogService.logSafe({
        userId: audit.actorId,
        action: AuditAction.UPDATE,
        module: 'PRODUCT',
        description: `แก้ไขสินค้า: ${updated.name}`,
        ipAddress: audit.ipAddress,
        userAgent: audit.userAgent,
        before: { name: product.name, status: product.status, sellingPrice: String(product.sellingPrice) },
        after: dto as Record<string, unknown>,
      });
    }
    return updated;
  }

  async remove(id: string, audit?: AuditActorContext) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('Product not found');
    const updated = await this.prisma.product.update({
      where: { id },
      data: { status: ProductStatus.INACTIVE },
    });
    if (audit) {
      await this.auditLogService.logSafe({
        userId: audit.actorId,
        action: AuditAction.DELETE,
        module: 'PRODUCT',
        description: `ปิดการใช้งานสินค้า: ${product.name}`,
        ipAddress: audit.ipAddress,
        userAgent: audit.userAgent,
        before: { status: product.status },
        after: { status: ProductStatus.INACTIVE },
      });
    }
    return updated;
  }
}
