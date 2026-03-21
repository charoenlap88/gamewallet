import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import {
  Prisma,
  AuditAction,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { CreateOrderDto, OrderQueryDto } from './dto/order.dto';
import { AuditLogService, type AuditActorContext } from '../audit-log/audit-log.service';

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly walletService: WalletService,
    private readonly auditLogService: AuditLogService,
  ) {}

  async create(userId: string, dto: CreateOrderDto) {
    // Validate products and calculate totals
    const productIds = dto.items.map((i) => i.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds }, status: 'ACTIVE' },
      include: {
        supplierPrices: {
          where: { isAvailable: true, supplier: { status: 'ACTIVE' } },
          orderBy: { costPrice: 'asc' },
          take: 1,
          include: { supplier: true },
        },
      },
    });

    if (products.length !== productIds.length) {
      throw new NotFoundException('One or more products not found or inactive');
    }

    const orderItems = dto.items.map((item) => {
      const product = products.find((p) => p.id === item.productId)!;
      const cheapestSupplier = product.supplierPrices[0];
      const quantity = item.quantity || 1;
      return {
        productId: product.id,
        supplierId: cheapestSupplier?.supplierId || null,
        quantity,
        unitPrice: Number(product.sellingPrice),
        costPrice: cheapestSupplier ? Number(cheapestSupplier.costPrice) : null,
      };
    });

    const totalAmount = orderItems.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0,
    );

    // Deduct wallet if paying with wallet
    if (dto.paymentMethod === PaymentMethod.WALLET) {
      await this.walletService.deductBalance(userId, totalAmount, `Order payment`);
    }

    const order = await this.prisma.order.create({
      data: {
        userId,
        totalAmount,
        finalAmount: totalAmount,
        paymentMethod: dto.paymentMethod,
        notes: dto.notes,
        status: dto.paymentMethod === PaymentMethod.WALLET ? OrderStatus.PROCESSING : OrderStatus.PENDING,
        items: {
          create: orderItems,
        },
        payment:
          dto.paymentMethod === PaymentMethod.WALLET
            ? {
                create: {
                  userId,
                  method: PaymentMethod.WALLET,
                  amount: totalAmount,
                  status: 'SUCCESS',
                  paidAt: new Date(),
                },
              }
            : undefined,
      },
      include: {
        items: { include: { product: { select: { id: true, name: true } } } },
        payment: true,
      },
    });

    return order;
  }

  async findAll(query: OrderQueryDto, userId?: string, isAdmin = false) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.OrderWhereInput = {};
    if (!isAdmin && userId) where.userId = userId;
    if (isAdmin && query.userId) where.userId = query.userId;
    if (query.status) where.status = query.status;

    const includeBase = {
      items: { include: { product: { select: { id: true, name: true } } } },
      payment: { select: { id: true, status: true, method: true, paidAt: true } },
    } as const;

    const includeAdmin = {
      ...includeBase,
      user: { select: { id: true, email: true, username: true } },
    };

    /** แอดมิน — คิวงาน: PROCESSING บนสุด (FIFO), SUCCESS/จบแล้ว ล่างสุด */
    const useAdminQueueOrder = isAdmin && !query.status;

    let orderBy: Prisma.OrderOrderByWithRelationInput | Prisma.OrderOrderByWithRelationInput[] = {
      createdAt: 'desc',
    };
    if (isAdmin && query.status) {
      if (
        query.status === OrderStatus.PROCESSING ||
        query.status === OrderStatus.PENDING ||
        query.status === OrderStatus.FAILED
      ) {
        orderBy = { createdAt: 'asc' };
      } else {
        orderBy = { createdAt: 'desc' };
      }
    }

    if (useAdminQueueOrder) {
      const filterSql = query.userId
        ? Prisma.sql`WHERE o.user_id = ${query.userId}`
        : Prisma.sql`WHERE TRUE`;

      const idRows = await this.prisma.$queryRaw<{ id: string }[]>`
        SELECT o.id FROM orders o
        ${filterSql}
        ORDER BY
          CASE o.status::text
            WHEN 'PROCESSING' THEN 0
            WHEN 'PENDING' THEN 1
            WHEN 'FAILED' THEN 2
            WHEN 'CANCELLED' THEN 3
            WHEN 'REFUNDED' THEN 4
            WHEN 'SUCCESS' THEN 5
            ELSE 6
          END ASC,
          o.created_at ASC
        LIMIT ${limit} OFFSET ${skip}
      `;

      const [total, ordersUnsorted] = await Promise.all([
        this.prisma.order.count({ where }),
        idRows.length
          ? this.prisma.order.findMany({
              where: { id: { in: idRows.map((r) => r.id) } },
              include: includeAdmin,
            })
          : Promise.resolve([]),
      ]);

      const map = new Map<string, (typeof ordersUnsorted)[number]>();
      for (const o of ordersUnsorted) map.set(o.id, o);
      const data = idRows.map((r) => map.get(r.id)).filter((o): o is NonNullable<typeof o> => o != null);

      return { data, total, page, limit };
    }

    const [data, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: isAdmin ? includeAdmin : includeBase,
      }),
      this.prisma.order.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  /** แอดมิน: PENDING / FAILED → PROCESSING */
  async manualMarkProcessing(orderId: string, audit?: AuditActorContext) {
    const order = await this.findOne(orderId);
    if (order.status !== OrderStatus.PENDING && order.status !== OrderStatus.FAILED) {
      throw new BadRequestException('เปลี่ยนเป็นกำลังดำเนินการได้จาก PENDING หรือ FAILED เท่านั้น');
    }

    const prev = order.status;
    await this.prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.PROCESSING },
      });
      await tx.orderItem.updateMany({
        where: { orderId },
        data: { status: OrderStatus.PROCESSING },
      });
    });

    if (audit) {
      await this.auditLogService.logSafe({
        userId: audit.actorId,
        action: AuditAction.UPDATE,
        module: 'ORDER',
        description: `Admin เริ่มดำเนินการคำสั่งซื้อ ${orderId}`,
        ipAddress: audit.ipAddress,
        userAgent: audit.userAgent,
        before: { status: prev },
        after: { status: OrderStatus.PROCESSING },
      });
    }

    return this.findOne(orderId);
  }

  /** แอดมิน: PENDING / PROCESSING → FAILED */
  async manualMarkFailed(orderId: string, audit?: AuditActorContext) {
    const order = await this.findOne(orderId);
    if (order.status !== OrderStatus.PENDING && order.status !== OrderStatus.PROCESSING) {
      throw new BadRequestException('ตั้ง FAILED ได้จาก PENDING หรือ PROCESSING เท่านั้น');
    }
    const prev = order.status;
    await this.prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.FAILED },
      });
      await tx.orderItem.updateMany({
        where: { orderId },
        data: { status: OrderStatus.FAILED },
      });
    });
    if (audit) {
      await this.auditLogService.logSafe({
        userId: audit.actorId,
        action: AuditAction.UPDATE,
        module: 'ORDER',
        description: `Admin ตั้งสถานะ FAILED คำสั่งซื้อ ${orderId}`,
        ipAddress: audit.ipAddress,
        userAgent: audit.userAgent,
        before: { status: prev },
        after: { status: OrderStatus.FAILED },
      });
    }
    return this.findOne(orderId);
  }

  /** แอดมิน: PROCESSING → PENDING (ย้อนกลับคิว) */
  async adminRevertToPending(orderId: string, audit?: AuditActorContext) {
    const order = await this.findOne(orderId);
    if (order.status !== OrderStatus.PROCESSING) {
      throw new BadRequestException('ย้อนเป็น PENDING ได้เฉพาะออเดอร์ที่กำลัง PROCESSING');
    }
    await this.prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.PENDING },
      });
      await tx.orderItem.updateMany({
        where: { orderId },
        data: { status: OrderStatus.PENDING },
      });
    });
    if (audit) {
      await this.auditLogService.logSafe({
        userId: audit.actorId,
        action: AuditAction.UPDATE,
        module: 'ORDER',
        description: `Admin ย้อนคำสั่งซื้อ ${orderId} เป็น PENDING`,
        ipAddress: audit.ipAddress,
        userAgent: audit.userAgent,
        before: { status: OrderStatus.PROCESSING },
        after: { status: OrderStatus.PENDING },
      });
    }
    return this.findOne(orderId);
  }

  /** แอดมิน: ลากวาง / เลือกสถานะ — ใช้กับ board */
  async adminApplyStatus(orderId: string, target: OrderStatus, audit?: AuditActorContext) {
    const order = await this.findOne(orderId);
    if (order.status === target) return order;

    switch (target) {
      case OrderStatus.PROCESSING:
        return this.manualMarkProcessing(orderId, audit);
      case OrderStatus.SUCCESS:
        return this.manualMarkComplete(orderId, audit);
      case OrderStatus.CANCELLED:
        return this.cancelOrder(orderId, undefined, audit);
      case OrderStatus.FAILED:
        return this.manualMarkFailed(orderId, audit);
      case OrderStatus.PENDING:
        return this.adminRevertToPending(orderId, audit);
      default:
        throw new BadRequestException(`ยังไม่รองรับการเปลี่ยนไปสถานะ ${target} ผ่านบอร์ด`);
    }
  }

  /** แอดมิน: จบกระบวนการด้วยมือ → SUCCESS (รายการสินค้า + payment ถ้ามี) */
  async manualMarkComplete(orderId: string, audit?: AuditActorContext) {
    const order = await this.findOne(orderId);
    if (
      order.status === OrderStatus.SUCCESS ||
      order.status === OrderStatus.CANCELLED ||
      order.status === OrderStatus.REFUNDED
    ) {
      throw new BadRequestException('ออเดอร์นี้จบกระบวนการแล้วหรือยกเลิกแล้ว');
    }

    const prevStatus = order.status;

    await this.prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.SUCCESS, completedAt: new Date() },
      });
      await tx.orderItem.updateMany({
        where: { orderId },
        data: { status: OrderStatus.SUCCESS },
      });
      const pay = await tx.payment.findUnique({ where: { orderId } });
      if (pay && pay.status !== PaymentStatus.SUCCESS) {
        await tx.payment.update({
          where: { orderId },
          data: { status: PaymentStatus.SUCCESS, paidAt: pay.paidAt ?? new Date() },
        });
      }
    });

    if (audit) {
      await this.auditLogService.logSafe({
        userId: audit.actorId,
        action: AuditAction.UPDATE,
        module: 'ORDER',
        description: `Admin ปิดงานคำสั่งซื้อสำเร็จ ${orderId} (เดิม: ${prevStatus})`,
        ipAddress: audit.ipAddress,
        userAgent: audit.userAgent,
        before: { status: prevStatus },
        after: { status: OrderStatus.SUCCESS },
      });
    }

    return this.findOne(orderId);
  }

  async findOne(id: string, userId?: string) {
    const order = await this.prisma.order.findFirst({
      where: { id, ...(userId ? { userId } : {}) },
      include: {
        items: {
          include: {
            product: true,
            supplier: { select: { id: true, name: true } },
          },
        },
        payment: true,
        user: { select: { id: true, email: true, username: true } },
      },
    });

    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async retryItem(itemId: string, audit?: AuditActorContext) {
    const item = await this.prisma.orderItem.findUnique({
      where: { id: itemId },
    });

    if (!item) throw new NotFoundException('Order item not found');
    if (item.status !== OrderStatus.FAILED) {
      throw new BadRequestException('Only failed items can be retried');
    }

    const updated = await this.prisma.orderItem.update({
      where: { id: itemId },
      data: { status: OrderStatus.PROCESSING, retryCount: { increment: 1 } },
    });

    if (audit) {
      await this.auditLogService.logSafe({
        userId: audit.actorId,
        action: AuditAction.RETRY,
        module: 'ORDER',
        description: `Retry รายการคำสั่งซื้อ (orderItem ${itemId}, order ${item.orderId})`,
        ipAddress: audit.ipAddress,
        userAgent: audit.userAgent,
      });
    }

    return updated;
  }

  async cancelOrder(orderId: string, userId?: string, audit?: AuditActorContext) {
    const order = await this.findOne(orderId, userId);

    const allowed: OrderStatus[] = userId
      ? [OrderStatus.PENDING, OrderStatus.FAILED]
      : [OrderStatus.PENDING, OrderStatus.FAILED, OrderStatus.PROCESSING];

    if (!allowed.some((s) => s === order.status)) {
      throw new BadRequestException(
        userId
          ? 'Only PENDING or FAILED orders can be cancelled'
          : 'ยกเลิกจากแอดมินได้เฉพาะ PENDING, PROCESSING หรือ FAILED',
      );
    }

    const prevStatus = order.status;
    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.CANCELLED },
    });

    if (audit) {
      await this.auditLogService.logSafe({
        userId: audit.actorId,
        action: AuditAction.CANCEL,
        module: 'ORDER',
        description: `ยกเลิกคำสั่งซื้อ ${orderId} (เดิม: ${prevStatus})`,
        ipAddress: audit.ipAddress,
        userAgent: audit.userAgent,
      });
    }

    return updated;
  }

  async getDashboardStats() {
    const [totalOrders, successOrders, totalRevenue, recentOrders] = await Promise.all([
      this.prisma.order.count(),
      this.prisma.order.count({ where: { status: OrderStatus.SUCCESS } }),
      this.prisma.order.aggregate({
        where: { status: OrderStatus.SUCCESS },
        _sum: { finalAmount: true },
      }),
      this.prisma.order.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { email: true, username: true } },
          items: { select: { product: { select: { name: true } } } },
        },
      }),
    ]);

    return {
      totalOrders,
      successOrders,
      totalRevenue: totalRevenue._sum.finalAmount || 0,
      recentOrders,
    };
  }
}
