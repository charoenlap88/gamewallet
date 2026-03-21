import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateSupplierDto,
  UpdateSupplierDto,
  CreateApiKeyDto,
  UpdateApiKeyStatusDto,
  CreateResponseMappingDto,
  CreateSupplierProductDto,
} from './dto/supplier.dto';

@Injectable()
export class SuppliersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.supplier.findMany({
      orderBy: { priority: 'asc' },
      include: {
        _count: { select: { apiKeys: true, supplierProducts: true } },
      },
    });
  }

  async findOne(id: string) {
    const supplier = await this.prisma.supplier.findUnique({
      where: { id },
      include: {
        apiKeys: { select: { id: true, keyName: true, environment: true, status: true, expiresAt: true } },
        responseMappings: true,
        supplierProducts: {
          include: { product: { select: { id: true, name: true } } },
        },
      },
    });
    if (!supplier) throw new NotFoundException('Supplier not found');
    return supplier;
  }

  async create(dto: CreateSupplierDto) {
    return this.prisma.supplier.create({ data: dto });
  }

  async update(id: string, dto: UpdateSupplierDto) {
    const s = await this.prisma.supplier.findUnique({ where: { id } });
    if (!s) throw new NotFoundException('Supplier not found');
    return this.prisma.supplier.update({ where: { id }, data: dto });
  }

  // ── API Keys ──────────────────────────────────────────────────────

  async addApiKey(supplierId: string, dto: CreateApiKeyDto, updatedBy?: string) {
    await this.ensureSupplierExists(supplierId);
    return this.prisma.supplierApiKey.create({
      data: {
        supplierId,
        keyName: dto.keyName,
        keyValue: dto.keyValue,
        environment: dto.environment,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
        lastUpdatedBy: updatedBy,
      },
    });
  }

  async updateApiKeyStatus(keyId: string, dto: UpdateApiKeyStatusDto) {
    const key = await this.prisma.supplierApiKey.findUnique({ where: { id: keyId } });
    if (!key) throw new NotFoundException('API key not found');
    return this.prisma.supplierApiKey.update({ where: { id: keyId }, data: { status: dto.status } });
  }

  async deleteApiKey(keyId: string) {
    const key = await this.prisma.supplierApiKey.findUnique({ where: { id: keyId } });
    if (!key) throw new NotFoundException('API key not found');
    return this.prisma.supplierApiKey.delete({ where: { id: keyId } });
  }

  // ── Response Mappings ─────────────────────────────────────────────

  async addResponseMapping(supplierId: string, dto: CreateResponseMappingDto) {
    await this.ensureSupplierExists(supplierId);
    return this.prisma.supplierResponseMapping.create({
      data: { supplierId, ...dto },
    });
  }

  async updateResponseMapping(mappingId: string, dto: Partial<CreateResponseMappingDto>) {
    const m = await this.prisma.supplierResponseMapping.findUnique({ where: { id: mappingId } });
    if (!m) throw new NotFoundException('Mapping not found');
    return this.prisma.supplierResponseMapping.update({ where: { id: mappingId }, data: dto });
  }

  async deleteResponseMapping(mappingId: string) {
    const m = await this.prisma.supplierResponseMapping.findUnique({ where: { id: mappingId } });
    if (!m) throw new NotFoundException('Mapping not found');
    return this.prisma.supplierResponseMapping.delete({ where: { id: mappingId } });
  }

  // ── Supplier Products ─────────────────────────────────────────────

  async addProduct(supplierId: string, dto: CreateSupplierProductDto) {
    await this.ensureSupplierExists(supplierId);
    return this.prisma.supplierProduct.upsert({
      where: { supplierId_productId: { supplierId, productId: dto.productId } },
      create: { supplierId, ...dto },
      update: { supplierSku: dto.supplierSku, costPrice: dto.costPrice, isAvailable: true },
    });
  }

  async getCheapestSupplier(productId: string) {
    const prices = await this.prisma.supplierProduct.findMany({
      where: {
        productId,
        isAvailable: true,
        supplier: { status: 'ACTIVE' },
      },
      orderBy: { costPrice: 'asc' },
      include: { supplier: true },
    });
    return prices[0] || null;
  }

  private async ensureSupplierExists(id: string) {
    const s = await this.prisma.supplier.findUnique({ where: { id } });
    if (!s) throw new NotFoundException('Supplier not found');
  }
}
