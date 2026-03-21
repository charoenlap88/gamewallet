import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PaymentStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: { page?: number; limit?: number; status?: PaymentStatus; userId?: string }) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.status) where.status = query.status;
    if (query.userId) where.userId = query.userId;

    const [data, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          order: { select: { id: true, status: true, finalAmount: true } },
          user: { select: { id: true, email: true, username: true } },
        },
      }),
      this.prisma.payment.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findOne(id: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: {
        order: { include: { items: { include: { product: true } } } },
        user: { select: { id: true, email: true, username: true } },
      },
    });

    if (!payment) throw new NotFoundException('Payment not found');
    return payment;
  }

  async handleWebhook(gatewayRef: string, webhookData: Record<string, any>) {
    const payment = await this.prisma.payment.findFirst({
      where: { gatewayRef },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found for gateway reference');
    }

    if (payment.status === PaymentStatus.SUCCESS) {
      throw new BadRequestException('Payment already processed (duplicate webhook)');
    }

    const isSuccess = this.parseWebhookStatus(webhookData);

    return this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: isSuccess ? PaymentStatus.SUCCESS : PaymentStatus.FAILED,
        webhookData,
        webhookVerified: true,
        paidAt: isSuccess ? new Date() : null,
      },
    });
  }

  async getMyPayments(userId: string, query: { page?: number; limit?: number }) {
    return this.findAll({ ...query, userId });
  }

  private parseWebhookStatus(webhookData: Record<string, any>): boolean {
    const status = webhookData?.status || webhookData?.data?.status || '';
    return ['success', 'successful', 'paid', 'completed'].includes(String(status).toLowerCase());
  }
}
