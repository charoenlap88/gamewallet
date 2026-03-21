import { Injectable, ForbiddenException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AgentsService {
  constructor(private readonly prisma: PrismaService) {}

  private assertAgent(userId: string, role: UserRole) {
    if (role !== UserRole.AGENT) throw new ForbiddenException('เฉพาะตัวแทนขาย');
  }

  async getMySummary(userId: string, role: UserRole) {
    this.assertAgent(userId, role);
    const agent = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, agentCode: true, username: true, email: true },
    });
    if (!agent) throw new ForbiddenException();
    const whereOrders = { user: { agentId: userId } };
    const [customerCount, orderCount, sumOrders] = await Promise.all([
      this.prisma.user.count({ where: { agentId: userId, role: UserRole.CUSTOMER } }),
      this.prisma.order.count({ where: whereOrders }),
      this.prisma.order.aggregate({
        where: whereOrders,
        _sum: { finalAmount: true },
      }),
    ]);
    return {
      agent,
      customerCount,
      orderCount,
      /** ยอดรวมออเดอร์ของลูกค้าที่ผูกตัวแทน (ทุกสถานะ — ใช้ดูภาพรวม) */
      orderVolumeApprox: sumOrders._sum.finalAmount ?? 0,
    };
  }

  async getMyCustomers(userId: string, role: UserRole, page = 1, limit = 20) {
    this.assertAgent(userId, role);
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where: { agentId: userId, role: UserRole.CUSTOMER },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          username: true,
          fullName: true,
          phone: true,
          status: true,
          createdAt: true,
          _count: { select: { orders: true } },
        },
      }),
      this.prisma.user.count({ where: { agentId: userId, role: UserRole.CUSTOMER } }),
    ]);
    return { data, total, page, limit };
  }
}
