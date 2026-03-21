import {
  Container,   Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Paper, Typography, Box, Pagination, CircularProgress,
  Button, Select, MenuItem, FormControl, InputLabel,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ordersApi } from '../../api/orders';
import { StatusChip } from '../../components/common/StatusChip';
import { PageHeader } from '../../components/common/PageHeader';
import { Money } from '../../components/Money';
import dayjs from 'dayjs';

const METHOD_LABEL: Record<string, string> = {
  WALLET: '💰 Wallet', PROMPTPAY: '📱 PromptPay', OMISE: '💳 Omise', SLIP: '🧾 Slip',
};

export const OrdersPage = () => {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['my-orders', page, status],
    queryFn: () => ordersApi.getMyOrders({ page, limit: 15, status: status || undefined }),
  });

  const totalPages = data ? Math.ceil(data.total / 15) : 1;

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <PageHeader title="ประวัติคำสั่งซื้อ" subtitle={`${data?.total || 0} รายการ`} />

      <Box display="flex" gap={2} mb={3}>
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>สถานะ</InputLabel>
          <Select value={status} label="สถานะ" onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
            <MenuItem value="">ทั้งหมด</MenuItem>
            {['PENDING', 'PROCESSING', 'SUCCESS', 'FAILED', 'CANCELLED'].map(s => (
              <MenuItem key={s} value={s}>{s}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>วันที่</TableCell>
              <TableCell>รายการ</TableCell>
              <TableCell>วิธีชำระ</TableCell>
              <TableCell align="right">ยอดรวม</TableCell>
              <TableCell>สถานะ</TableCell>
              <TableCell></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4 }}><CircularProgress /></TableCell></TableRow>
            ) : data?.data?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                  <Typography fontSize={40} mb={1}>📦</Typography>
                  <Typography color="text.secondary">ยังไม่มีคำสั่งซื้อ</Typography>
                  <Button onClick={() => navigate('/products')} sx={{ mt: 1 }}>เริ่มช้อปปิ้ง</Button>
                </TableCell>
              </TableRow>
            ) : data?.data?.map((order) => (
              <TableRow key={order.id} hover>
                <TableCell>
                  <Typography variant="body2">{dayjs(order.createdAt).format('DD/MM/YY HH:mm')}</Typography>
                  <Typography variant="caption" color="text.secondary" noWrap>{order.id.slice(0, 8)}...</Typography>
                </TableCell>
                <TableCell>
                  {order.items?.slice(0, 2).map((item) => (
                    <Typography key={item.id} variant="body2" noWrap sx={{ maxWidth: 200 }}>
                      {item.product?.name} × {item.quantity}
                    </Typography>
                  ))}
                  {(order.items?.length || 0) > 2 && (
                    <Typography variant="caption" color="text.secondary">+{(order.items?.length || 0) - 2} รายการ</Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{METHOD_LABEL[order.paymentMethod] || order.paymentMethod}</Typography>
                </TableCell>
                <TableCell align="right">
                  <Money
                    amount={Number(order.finalAmount)}
                    component="span"
                    variant="body2"
                    fontWeight={700}
                    color="primary"
                  />
                </TableCell>
                <TableCell><StatusChip status={order.status} /></TableCell>
                <TableCell>
                  <Button size="small" onClick={() => navigate(`/orders/${order.id}`)}>ดูรายละเอียด</Button>
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
    </Container>
  );
};
