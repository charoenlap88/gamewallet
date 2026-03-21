import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { AuditAction, UserRole, UserStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  UpdateProfileDto,
  UpdateUserStatusDto,
  ListUsersQueryDto,
  UpdateUserNavRoleDto,
} from './dto/user.dto';
import { AuditLogService, type AuditActorContext } from '../audit-log/audit-log.service';
import { resolveNavMenuKeys } from '../../common/utils/nav-menu-keys.util';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogService: AuditLogService,
  ) {}

  async findAll(query: ListUsersQueryDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.status) where.status = query.status;
    if (query.search) {
      where.OR = [
        { email: { contains: query.search, mode: 'insensitive' } },
        { username: { contains: query.search, mode: 'insensitive' } },
        { fullName: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          username: true,
          fullName: true,
          phone: true,
          role: true,
          status: true,
          agentCode: true,
          createdAt: true,
          wallet: { select: { balance: true } },
          navRole: { select: { id: true, name: true, slug: true } },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        username: true,
        fullName: true,
        phone: true,
        role: true,
        status: true,
        agentCode: true,
        createdAt: true,
        updatedAt: true,
        wallet: { select: { id: true, balance: true } },
        orders: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: { id: true, status: true, finalAmount: true, createdAt: true },
        },
        navRole: { select: { id: true, name: true, slug: true, menuKeys: true } },
      },
    });

    if (!user) throw new NotFoundException('User not found');
    const navMenuKeys = resolveNavMenuKeys(user.role, user.navRole);
    return { ...user, navMenuKeys };
  }

  async assignNavRole(userId: string, dto: UpdateUserNavRoleDto) {
    const u = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!u) throw new NotFoundException('User not found');
    if (u.role !== UserRole.ADMIN) {
      throw new BadRequestException('กำหนดเมนูได้เฉพาะผู้ใช้ที่ role เป็น ADMIN');
    }
    if (dto.navRoleId === undefined) {
      throw new BadRequestException('ต้องส่ง navRoleId (uuid) หรือ null');
    }
    if (dto.navRoleId === null) {
      const updated = await this.prisma.user.update({
        where: { id: userId },
        data: { navRoleId: null },
        select: {
          id: true,
          email: true,
          username: true,
          role: true,
          navRole: { select: { id: true, name: true, slug: true, menuKeys: true } },
        },
      });
      return {
        ...updated,
        navMenuKeys: resolveNavMenuKeys(updated.role, updated.navRole),
      };
    }
    const role = await this.prisma.adminNavRole.findUnique({ where: { id: dto.navRoleId } });
    if (!role) throw new NotFoundException('Nav role not found');
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { navRoleId: dto.navRoleId },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        navRole: { select: { id: true, name: true, slug: true, menuKeys: true } },
      },
    });
    return {
      ...updated,
      navMenuKeys: resolveNavMenuKeys(updated.role, updated.navRole),
    };
  }

  async updateProfile(id: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    return this.prisma.user.update({
      where: { id },
      data: { fullName: dto.fullName, phone: dto.phone },
      select: {
        id: true, email: true, username: true, fullName: true, phone: true, role: true, status: true,
      },
    });
  }

  async updateStatus(id: string, dto: UpdateUserStatusDto, audit?: AuditActorContext) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    const prevStatus = user.status;
    const updated = await this.prisma.user.update({
      where: { id },
      data: { status: dto.status },
      select: { id: true, email: true, username: true, status: true },
    });

    if (audit) {
      await this.auditLogService.logSafe({
        userId: audit.actorId,
        targetUserId: id,
        action: AuditAction.UPDATE,
        module: 'USER',
        description: `อัปเดตสถานะผู้ใช้ ${updated.email}: ${prevStatus} → ${dto.status}`,
        ipAddress: audit.ipAddress,
        userAgent: audit.userAgent,
        before: { status: prevStatus },
        after: { status: dto.status },
      });
    }

    return updated;
  }
}
