import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboard() {
    const [
      totalUsers,
      activeSuppliers,
      totalOrders,
      successOrders,
      pendingOrders,
      revenue,
      recentOrders,
      topProducts,
    ] = await Promise.all([
      this.prisma.user.count({ where: { role: 'CUSTOMER' } }),
      this.prisma.supplier.count({ where: { status: 'ACTIVE' } }),
      this.prisma.order.count(),
      this.prisma.order.count({ where: { status: 'SUCCESS' } }),
      this.prisma.order.count({ where: { status: 'PENDING' } }),
      this.prisma.order.aggregate({
        where: { status: 'SUCCESS' },
        _sum: { finalAmount: true },
      }),
      this.prisma.order.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { email: true, username: true } },
          items: { select: { product: { select: { name: true } } } },
          payment: { select: { status: true, method: true } },
        },
      }),
      this.prisma.orderItem.groupBy({
        by: ['productId'],
        _count: { productId: true },
        orderBy: { _count: { productId: 'desc' } },
        take: 5,
      }),
    ]);

    const topProductDetails = await Promise.all(
      topProducts.map(async (item) => {
        const product = await this.prisma.product.findUnique({
          where: { id: item.productId },
          select: { id: true, name: true },
        });
        return { ...product, orderCount: item._count.productId };
      }),
    );

    return {
      stats: {
        totalUsers,
        activeSuppliers,
        totalOrders,
        successOrders,
        pendingOrders,
        totalRevenue: revenue._sum.finalAmount || 0,
      },
      recentOrders,
      topProducts: topProductDetails,
    };
  }

  async getAnalytics(period: 'day' | 'week' | 'month' = 'week') {
    const now = new Date();
    const startDate = new Date(now);

    if (period === 'day') startDate.setDate(now.getDate() - 1);
    else if (period === 'week') startDate.setDate(now.getDate() - 7);
    else startDate.setMonth(now.getMonth() - 1);

    const [ordersByStatus, revenueRows, topCategoryRows, periodTotals] = await Promise.all([
      this.prisma.order.groupBy({
        by: ['status'],
        _count: { status: true },
        where: { createdAt: { gte: startDate } },
      }),
      this.prisma.$queryRaw<Array<{ date: Date; revenue: unknown; orders: unknown }>>`
        SELECT 
          DATE("created_at") AS date,
          SUM("final_amount") AS revenue,
          COUNT(*)::int AS orders
        FROM orders
        WHERE status = 'SUCCESS' AND "created_at" >= ${startDate}
        GROUP BY DATE("created_at")
        ORDER BY date ASC
      `,
      this.prisma.$queryRaw<Array<{ name: string; quantity: unknown; revenue: unknown }>>`
        SELECT 
          pc.name AS name,
          SUM(oi.quantity)::int AS quantity,
          SUM(oi.unit_price * oi.quantity) AS revenue
        FROM order_items oi
        INNER JOIN orders o ON o.id = oi.order_id
        INNER JOIN products p ON p.id = oi.product_id
        INNER JOIN product_categories pc ON pc.id = p.category_id
        WHERE o.status = 'SUCCESS' AND o.created_at >= ${startDate}
        GROUP BY pc.id, pc.name
        ORDER BY revenue DESC NULLS LAST
        LIMIT 10
      `,
      this.prisma.order.aggregate({
        where: { createdAt: { gte: startDate }, status: 'SUCCESS' },
        _sum: { finalAmount: true },
        _count: true,
      }),
    ]);

    const totalOrdersInPeriod = await this.prisma.order.count({
      where: { createdAt: { gte: startDate } },
    });

    const revenueByDay = revenueRows.map((row) => ({
      date:
        row.date instanceof Date
          ? row.date.toISOString().slice(0, 10)
          : String(row.date).slice(0, 10),
      revenue: Number(row.revenue ?? 0),
      orders: Number(row.orders ?? 0),
    }));

    const topCategories = topCategoryRows.map((row) => ({
      name: row.name,
      quantity: Number(row.quantity ?? 0),
      revenue: Number(row.revenue ?? 0),
    }));

    const periodRevenue = Number(periodTotals._sum.finalAmount ?? 0);
    const successfulOrdersInPeriod = periodTotals._count;

    return {
      period: { key: period, from: startDate.toISOString(), to: now.toISOString() },
      summary: {
        periodRevenue,
        successfulOrdersInPeriod,
        totalOrdersInPeriod,
      },
      ordersByStatus,
      revenueByDay,
      topCategories,
    };
  }
}
