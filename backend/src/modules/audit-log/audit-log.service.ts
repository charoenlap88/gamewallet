import { Injectable, Logger } from '@nestjs/common';
import { AuditAction } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export interface CreateAuditLogDto {
  userId?: string;
  targetUserId?: string;
  action: AuditAction;
  module: string;
  description: string;
  ipAddress?: string;
  userAgent?: string;
  before?: Record<string, any>;
  after?: Record<string, any>;
}

/** ส่งจาก controller หลัง JWT ยืนยันแล้ว */
export type AuditActorContext = {
  actorId: string;
  ipAddress?: string;
  userAgent?: string;
};

@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateAuditLogDto) {
    return this.prisma.auditLog.create({ data: dto });
  }

  /** ไม่ throw — กันบล็อก flow หลักถ้า audit ล้ม */
  async logSafe(dto: CreateAuditLogDto): Promise<void> {
    try {
      await this.prisma.auditLog.create({ data: dto });
    } catch (e) {
      this.logger.warn(`Audit log failed: ${(e as Error).message}`);
    }
  }

  async findAll(query: {
    page?: number;
    limit?: number;
    module?: string;
    action?: AuditAction;
    userId?: string;
    search?: string;
  }) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 50;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.module) where.module = { contains: query.module, mode: 'insensitive' };
    if (query.action) where.action = query.action;
    if (query.userId) where.userId = query.userId;
    if (query.search?.trim()) {
      where.description = { contains: query.search.trim(), mode: 'insensitive' };
    }

    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, email: true, username: true } },
        },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return { data, total, page, limit };
  }
}
