import {
  Grid, Typography, Card, CardContent, Box, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, CircularProgress,
} from '@mui/material';
import { People, ShoppingCart, AttachMoney, LocalShipping } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../../api/admin';
import { StatCard } from '../../components/common/StatCard';
import { StatusChip } from '../../components/common/StatusChip';
import { PageHeader } from '../../components/common/PageHeader';
import { LoadingScreen } from '../../components/common/LoadingScreen';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import { useAppLocale } from '../../i18n/useAppLocale';

export const DashboardPage = () => {
  const { t } = useTranslation();
  const locale = useAppLocale();
  const { data, isLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: adminApi.getDashboard,
    refetchInterval: 60000,
  });

  if (isLoading) return <LoadingScreen />;

  const stats = (data as any)?.stats || {};
  const recentOrders = (data as any)?.recentOrders || [];
  const topProducts = (data as any)?.topProducts || [];

  return (
    <Box>
      <PageHeader
        title={t('admin.dashboard.title')}
        subtitle={t('admin.dashboard.subtitle', { time: dayjs().format('DD/MM/YYYY HH:mm') })}
      />

      {/* Stats */}
      <Grid container spacing={2.5} mb={3}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title={t('admin.dashboard.totalUsers')}
            value={stats.totalUsers?.toLocaleString(locale) || '0'}
            Icon={People}
            color="#1565C0"
            subtitle={t('admin.dashboard.userAccounts')}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title={t('admin.dashboard.totalOrders')}
            value={stats.totalOrders?.toLocaleString(locale) || '0'}
            Icon={ShoppingCart}
            color="#D32F2F"
            subtitle={t('admin.dashboard.successOrders', { n: stats.successOrders || 0 })}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title={t('admin.dashboard.totalRevenue')}
            value={`฿${Number(stats.totalRevenue || 0).toLocaleString(locale, { minimumFractionDigits: 0 })}`}
            Icon={AttachMoney}
            color="#2E7D32"
            subtitle={t('admin.dashboard.fromSuccess')}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title={t('admin.dashboard.activeSuppliers')}
            value={stats.activeSuppliers?.toLocaleString(locale) || '0'}
            Icon={LocalShipping}
            color="#F57C00"
            subtitle={t('admin.dashboard.connected')}
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Recent Orders */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={700} mb={2}>{t('admin.dashboard.recentOrders')}</Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>{t('admin.orders.customer')}</TableCell>
                      <TableCell>{t('admin.orders.product')}</TableCell>
                      <TableCell align="right">{t('admin.dashboard.amount')}</TableCell>
                      <TableCell>{t('common.status')}</TableCell>
                      <TableCell>{t('admin.dashboard.time')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recentOrders?.map((order: any) => (
                      <TableRow key={order.id} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>{order.user?.username}</Typography>
                          <Typography variant="caption" color="text.secondary">{order.user?.email}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" noWrap sx={{ maxWidth: 160 }}>
                            {order.items?.[0]?.product?.name || '-'}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight={700} color="primary.main">
                            ฿{Number(order.finalAmount).toLocaleString(locale)}
                          </Typography>
                        </TableCell>
                        <TableCell><StatusChip status={order.status} /></TableCell>
                        <TableCell>
                          <Typography variant="caption" color="text.secondary">
                            {dayjs(order.createdAt).format('HH:mm')}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Top Products */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} mb={2}>{t('admin.dashboard.topProducts')}</Typography>
              {topProducts?.map((product: any, index: number) => (
                <Box key={product.id} display="flex" alignItems="center" gap={2} mb={2}>
                  <Box sx={{
                    width: 32, height: 32, borderRadius: 1, bgcolor: index === 0 ? 'primary.main' : 'grey.200',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <Typography variant="caption" fontWeight={700} color={index === 0 ? 'white' : 'text.secondary'}>
                      #{index + 1}
                    </Typography>
                  </Box>
                  <Box flex={1} minWidth={0}>
                    <Typography variant="body2" fontWeight={600} noWrap>{product.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {t('admin.dashboard.ordersCount', { n: product.orderCount })}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};
