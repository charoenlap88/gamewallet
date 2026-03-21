import {
  Container, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Paper, Typography, Box, Pagination, CircularProgress,
  FormControl, InputLabel, Select, MenuItem,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { paymentsApi } from '../../api/payments';
import { StatusChip } from '../../components/common/StatusChip';
import { PageHeader } from '../../components/common/PageHeader';
import { Money } from '../../components/Money';
import dayjs from 'dayjs';

const METHOD_LABEL: Record<string, string> = {
  WALLET: 'Wallet',
  PROMPTPAY: 'PromptPay',
  OMISE: 'Omise',
  SLIP: 'สลิป',
};

export const PaymentHistoryPage = () => {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['my-payments', page, status],
    queryFn: () => paymentsApi.getMyPayments({ page, limit: 15, status: status || undefined }),
  });

  const totalPages = data ? Math.ceil(data.total / 15) : 1;

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 3, md: 4 } }}>
      <PageHeader
        title="ประวัติการชำระเงิน"
        subtitle={`${data?.total ?? 0} รายการ — ดูสถานะการชำระแยกจากกระเป๋าเงิน`}
      />

      <Box display="flex" gap={2} mb={2} flexWrap="wrap">
        <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 200 } }}>
          <InputLabel>สถานะ</InputLabel>
          <Select
            value={status}
            label="สถานะ"
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          >
            <MenuItem value="">ทั้งหมด</MenuItem>
            {['PENDING', 'SUCCESS', 'FAILED', 'CANCELLED', 'REFUNDED'].map((s) => (
              <MenuItem key={s} value={s}>{s}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <TableContainer
        component={Paper}
        sx={{
          borderRadius: 2,
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        <Table size="small" sx={{ minWidth: 560 }}>
          <TableHead>
            <TableRow>
              <TableCell>วันที่</TableCell>
              <TableCell>วิธีชำระ</TableCell>
              <TableCell align="right">จำนวน</TableCell>
              <TableCell>สถานะ</TableCell>
              <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>ชำระเมื่อ</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 5 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : data?.data?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                  <Typography>ยังไม่มีประวัติการชำระเงิน</Typography>
                  <Typography variant="caption" display="block" mt={1}>
                    เมื่อสั่งซื้อและชำระผ่านระบบ รายการจะแสดงที่นี่
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              data?.data?.map((p) => (
                <TableRow key={p.id} hover>
                  <TableCell>
                    <Typography variant="body2">{dayjs(p.createdAt).format('DD/MM/YY HH:mm')}</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: { xs: 'block', sm: 'none' } }}>
                      {p.paidAt ? `ชำระ ${dayjs(p.paidAt).format('HH:mm')}` : '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>{METHOD_LABEL[p.method] || p.method}</TableCell>
                  <TableCell align="right">
                    <Money
                      amount={Number(p.amount)}
                      component="span"
                      variant="body2"
                      fontWeight={800}
                      color="primary"
                    />
                  </TableCell>
                  <TableCell><StatusChip status={p.status} /></TableCell>
                  <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                    <Typography variant="body2">
                      {p.paidAt ? dayjs(p.paidAt).format('DD/MM/YY HH:mm') : '—'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))
            )}
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
