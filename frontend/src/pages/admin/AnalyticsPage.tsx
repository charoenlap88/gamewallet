import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableContainer,
  Alert,
  alpha,
  useTheme,
} from '@mui/material';
import { TrendingUp, ShoppingBag, ReceiptLong, Category as CategoryIcon } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { adminApi } from '../../api/admin';
import { StatusChip } from '../../components/common/StatusChip';
import { PageHeader } from '../../components/common/PageHeader';
import { LoadingScreen } from '../../components/common/LoadingScreen';
import dayjs from 'dayjs';
import type { AdminAnalytics, AdminDashboard } from '../../types';

function SummaryCard({
  title,
  value,
  subtitle,
  icon,
}: {
  title: string;
  value: string;
  subtitle?: string;
  icon: ReactNode;
}) {
  return (
    <Card sx={{ height: '100%', borderRadius: 2 }}>
      <CardContent>
        <Box display="flex" alignItems="flex-start" justifyContent="space-between" gap={1}>
          <Box>
            <Typography variant="caption" color="text.secondary" fontWeight={600}>
              {title}
            </Typography>
            <Typography variant="h5" fontWeight={800} sx={{ mt: 0.5, lineHeight: 1.2 }}>
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
                {subtitle}
              </Typography>
            )}
          </Box>
          <Box sx={{ color: 'primary.main', opacity: 0.9 }}>{icon}</Box>
        </Box>
      </CardContent>
    </Card>
  );
}

export const AnalyticsPage = () => {
  const theme = useTheme();
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('week');

  const {
    data: analytics,
    isLoading: analyticsLoading,
    isError: analyticsError,
    error: analyticsErr,
  } = useQuery<AdminAnalytics>({
    queryKey: ['analytics', period],
    queryFn: () => adminApi.getAnalytics(period),
  });

  const { data: dashboard, isLoading: dashboardLoading } = useQuery<AdminDashboard>({
    queryKey: ['admin-dashboard'],
    queryFn: adminApi.getDashboard,
  });

  const loading = analyticsLoading || dashboardLoading;

  if (loading) return <LoadingScreen />;

  if (analyticsError || !analytics) {
    const msg =
      (analyticsErr as { response?: { data?: { message?: string } } })?.response?.data?.message ||
      'โหลด Analytics ไม่สำเร็จ';
    return (
      <Box>
        <PageHeader title="Analytics & Report" />
        <Alert severity="error">{String(msg)}</Alert>
      </Box>
    );
  }

  const { summary, ordersByStatus, revenueByDay, topCategories, period: periodMeta } = analytics;
  const topProducts = dashboard?.topProducts ?? [];
  const stats = dashboard?.stats;
  const periodLabel =
    period === 'day'
      ? '24 ชม. ล่าสุด'
      : period === 'week'
        ? '7 วันล่าสุด'
        : '1 เดือนล่าสุด';

  return (
    <Box>
      <PageHeader
        title="Analytics & Report"
        subtitle={`ช่วง: ${periodLabel} · ${dayjs(periodMeta.from).format('DD/MM/YY HH:mm')} – ${dayjs(periodMeta.to).format('DD/MM/YY HH:mm')}`}
        action={
          <Box display="flex" gap={1}>
            {(['day', 'week', 'month'] as const).map((p) => (
              <Button
                key={p}
                variant={period === p ? 'contained' : 'outlined'}
                size="small"
                onClick={() => setPeriod(p)}
              >
                {p === 'day' ? 'วันนี้' : p === 'week' ? 'สัปดาห์' : 'เดือน'}
              </Button>
            ))}
          </Box>
        }
      />

      <Grid container spacing={2.5} mb={3}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="รายได้ (ช่วงที่เลือก)"
            value={`฿${summary.periodRevenue.toLocaleString('th-TH', { minimumFractionDigits: 2 })}`}
            subtitle="ออเดอร์สำเร็จเท่านั้น"
            icon={<TrendingUp fontSize="large" />}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="ออเดอร์สำเร็จ"
            value={String(summary.successfulOrdersInPeriod)}
            subtitle={`จากทั้งหมด ${summary.totalOrdersInPeriod} ออเดอร์ในช่วงนี้`}
            icon={<ReceiptLong fontSize="large" />}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="รายได้รวม (ทั้งระบบ)"
            value={`฿${Number(stats?.totalRevenue ?? 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}`}
            subtitle="ออเดอร์ SUCCESS ทุกช่วงเวลา"
            icon={<TrendingUp fontSize="large" />}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="ลูกค้า / Supplier"
            value={`${stats?.totalUsers ?? 0} / ${stats?.activeSuppliers ?? 0}`}
            subtitle="ลูกค้า · Supplier ที่ ACTIVE"
            icon={<ShoppingBag fontSize="large" />}
          />
        </Grid>
      </Grid>

      <Grid container spacing={2.5} mb={3}>
        <Grid size={{ xs: 12, md: 7 }}>
          <Card sx={{ borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} mb={2}>
                รายได้ตามวัน (ในช่วงที่เลือก)
              </Typography>
              {revenueByDay.length === 0 ? (
                <Box textAlign="center" py={4} color="text.secondary">
                  <Typography>ยังไม่มีรายได้ในช่วงนี้</Typography>
                </Box>
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>วันที่</TableCell>
                        <TableCell align="right">ออเดอร์</TableCell>
                        <TableCell align="right">รายได้</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {revenueByDay.map((row) => (
                        <TableRow key={row.date} hover>
                          <TableCell>{dayjs(row.date).format('DD/MM/YYYY')}</TableCell>
                          <TableCell align="right">{row.orders.toLocaleString()}</TableCell>
                          <TableCell align="right">
                            ฿{row.revenue.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 5 }}>
          <Card sx={{ height: '100%', borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} mb={2}>
                สถานะออเดอร์ (ในช่วงที่เลือก)
              </Typography>
              {ordersByStatus.length === 0 ? (
                <Typography color="text.secondary" variant="body2">
                  ยังไม่มีออเดอร์ในช่วงนี้
                </Typography>
              ) : (
                ordersByStatus.map((item) => (
                  <Box
                    key={item.status}
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                    mb={1.5}
                  >
                    <StatusChip status={item.status} />
                    <Typography variant="h6" fontWeight={700}>
                      {item._count?.status ?? 0}
                    </Typography>
                  </Box>
                ))
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={2.5} mb={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ borderRadius: 2 }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <CategoryIcon color="primary" />
                <Typography variant="h6" fontWeight={700}>
                  หมวดหมู่ขายดี (ในช่วงที่เลือก)
                </Typography>
              </Box>
              {topCategories.length === 0 ? (
                <Typography color="text.secondary" variant="body2">
                  ยังไม่มีข้อมูลหมวดหมู่ในช่วงนี้
                </Typography>
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>หมวดหมู่</TableCell>
                        <TableCell align="right">จำนวนชิ้น</TableCell>
                        <TableCell align="right">รายได้</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {topCategories.map((row) => (
                        <TableRow key={row.name} hover>
                          <TableCell>
                            <Typography fontWeight={600} component="span" variant="body2">
                              {row.name}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">{row.quantity.toLocaleString()}</TableCell>
                          <TableCell align="right">
                            ฿{row.revenue.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} mb={2}>
                สินค้าขายดี (ตลอดเวลา)
              </Typography>
              {topProducts.length === 0 ? (
                <Typography color="text.secondary" variant="body2">
                  ยังไม่มีข้อมูล
                </Typography>
              ) : (
                <Grid container spacing={2}>
                  {topProducts.map((product: AdminDashboard['topProducts'][number], index: number) => (
                    <Grid size={{ xs: 12, sm: 6 }} key={product.id ?? index}>
                      <Box
                        sx={{
                          p: 2,
                          borderRadius: 2,
                          border: '1px solid',
                          borderColor: index === 0 ? 'primary.main' : 'divider',
                          bgcolor:
                            index === 0 ? alpha(theme.palette.primary.main, 0.06) : 'transparent',
                        }}
                      >
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Typography variant="body2" fontWeight={700} noWrap sx={{ maxWidth: '70%' }}>
                            {product.name}
                          </Typography>
                          <Box
                            sx={{
                              px: 1,
                              py: 0.25,
                              borderRadius: 1,
                              bgcolor: index === 0 ? 'primary.main' : 'grey.200',
                              color: index === 0 ? 'primary.contrastText' : 'text.secondary',
                            }}
                          >
                            <Typography variant="caption" fontWeight={700}>
                              #{index + 1}
                            </Typography>
                          </Box>
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                          {product.orderCount ?? 0} รายการในคำสั่งซื้อ
                        </Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};
