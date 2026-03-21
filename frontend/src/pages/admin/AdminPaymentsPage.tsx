import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Typography, Box, Pagination, CircularProgress, FormControl,
  InputLabel, Select, MenuItem, Card, CardContent, Grid,
} from '@mui/material';
import { AttachMoney, CheckCircle, Cancel, Pending } from '@mui/icons-material';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../../api/admin';
import { StatusChip } from '../../components/common/StatusChip';
import { PageHeader } from '../../components/common/PageHeader';
import { StatCard } from '../../components/common/StatCard';
import dayjs from 'dayjs';

const METHOD_LABEL: Record<string, string> = {
  WALLET: '💰 Wallet', PROMPTPAY: '📱 PromptPay', OMISE: '💳 Omise', SLIP: '🧾 Slip',
};

export const AdminPaymentsPage = () => {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-payments', page, status],
    queryFn: () => adminApi.getPayments({ page, limit: 20, status: status || undefined }),
  });

  const totalPages = data ? Math.ceil(data.total / 20) : 1;

  const payments = data?.data || [];
  const successCount = payments.filter((p) => p.status === 'SUCCESS').length;
  const pendingCount = payments.filter((p) => p.status === 'PENDING').length;
  const totalAmount = payments
    .filter((p) => p.status === 'SUCCESS')
    .reduce((sum, p) => sum + Number(p.amount), 0);

  return (
    <Box>
      <PageHeader title="Payment Management" subtitle={`${data?.total || 0} รายการ`} />

      {/* Summary Cards */}
      <Grid container spacing={2.5} mb={3}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="รวมทั้งหมด"
            value={data?.total || 0}
            Icon={AttachMoney}
            color="#1565C0"
            subtitle="รายการ Payment"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="สำเร็จ"
            value={successCount}
            Icon={CheckCircle}
            color="#2E7D32"
            subtitle="รายการในหน้านี้"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="รอดำเนินการ"
            value={pendingCount}
            Icon={Pending}
            color="#F57C00"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="ยอดสำเร็จ"
            value={`฿${totalAmount.toLocaleString('th-TH', { minimumFractionDigits: 0 })}`}
            Icon={AttachMoney}
            color="#D32F2F"
            subtitle="ในหน้านี้"
          />
        </Grid>
      </Grid>

      {/* Filters */}
      <Box display="flex" gap={2} mb={3}>
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>สถานะ</InputLabel>
          <Select value={status} label="สถานะ" onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
            <MenuItem value="">ทั้งหมด</MenuItem>
            {['PENDING', 'SUCCESS', 'FAILED', 'CANCELLED', 'REFUNDED'].map((s) => (
              <MenuItem key={s} value={s}>{s}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Payment ID</TableCell>
              <TableCell>Order ID</TableCell>
              <TableCell>ผู้ชำระ</TableCell>
              <TableCell>วิธีชำระ</TableCell>
              <TableCell align="right">จำนวน</TableCell>
              <TableCell>สถานะ</TableCell>
              <TableCell>ชำระเมื่อ</TableCell>
              <TableCell>สร้างเมื่อ</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={8} align="center" sx={{ py: 4 }}><CircularProgress /></TableCell></TableRow>
            ) : payments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                  <Typography fontSize={36} mb={1}>💳</Typography>
                  <Typography color="text.secondary">ยังไม่มีรายการ Payment</Typography>
                </TableCell>
              </TableRow>
            ) : payments.map((payment) => (
              <TableRow key={payment.id} hover>
                <TableCell>
                  <Typography variant="caption" fontFamily="monospace">
                    {payment.id.slice(0, 8)}...
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="caption" fontFamily="monospace" color="text.secondary">
                    {payment.orderId.slice(0, 8)}...
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{payment.userId.slice(0, 8)}...</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{METHOD_LABEL[payment.method] || payment.method}</Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography fontWeight={700} color="primary.main">
                    ฿{Number(payment.amount).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                  </Typography>
                </TableCell>
                <TableCell><StatusChip status={payment.status} /></TableCell>
                <TableCell>
                  <Typography variant="caption">
                    {payment.paidAt ? dayjs(payment.paidAt).format('DD/MM/YY HH:mm') : '-'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="caption">{dayjs(payment.createdAt).format('DD/MM/YY HH:mm')}</Typography>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {totalPages > 1 && (
        <Box display="flex" justifyContent="center" mt={3}>
          <Pagination count={totalPages} page={page} onChange={(_, p) => setPage(p)} color="primary" />
        </Box>
      )}
    </Box>
  );
};
