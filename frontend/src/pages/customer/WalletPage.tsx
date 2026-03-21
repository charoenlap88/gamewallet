import {
  Container, Grid, Card, CardContent, Typography, Button,
  Box, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Pagination, CircularProgress, Alert,
} from '@mui/material';
import { AccountBalanceWallet, Add, ArrowUpward, ArrowDownward } from '@mui/icons-material';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { walletApi } from '../../api/wallet';
import { StatusChip } from '../../components/common/StatusChip';
import { PageHeader } from '../../components/common/PageHeader';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';
import { useMoneyDisplay } from '../../hooks/useMoneyDisplay';
import { Money } from '../../components/Money';

export const WalletPage = () => {
  const [openTopup, setOpenTopup] = useState(false);
  const [amount, setAmount] = useState('');
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();
  const { format: formatMoney } = useMoneyDisplay();

  const { data: wallet, isLoading: walletLoading } = useQuery({
    queryKey: ['wallet-balance'],
    queryFn: walletApi.getBalance,
  });

  const { data: txData, isLoading: txLoading } = useQuery({
    queryKey: ['wallet-transactions', page],
    queryFn: () => walletApi.getTransactions({ page, limit: 15 }),
  });

  const topupMutation = useMutation({
    mutationFn: () => walletApi.topup({ amount: Number(amount), description: 'เติมเงินผ่านระบบ' }),
    onSuccess: () => {
      toast.success(`เติมเงิน ${formatMoney(Number(amount))} สำเร็จ!`);
      queryClient.invalidateQueries({ queryKey: ['wallet-balance'] });
      queryClient.invalidateQueries({ queryKey: ['wallet-transactions'] });
      setOpenTopup(false);
      setAmount('');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'เกิดข้อผิดพลาด'),
  });

  const quickAmounts = [100, 200, 500, 1000, 2000, 5000];

  const totalPages = txData ? Math.ceil(txData.total / 15) : 1;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <PageHeader
        title="กระเป๋าเงิน"
        action={
          <Button variant="contained" startIcon={<Add />} onClick={() => setOpenTopup(true)}>
            เติมเงิน
          </Button>
        }
      />

      {/* Balance Card */}
      <Grid container spacing={3} mb={4}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ background: 'linear-gradient(135deg, #D32F2F, #B71C1C)', color: 'white' }}>
            <CardContent sx={{ p: 3 }}>
              <Box display="flex" alignItems="center" gap={1.5} mb={2}>
                <AccountBalanceWallet sx={{ fontSize: 32 }} />
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>ยอดเงินคงเหลือ</Typography>
              </Box>
              {walletLoading ? (
                <CircularProgress size={28} color="inherit" />
              ) : (
                <Money amount={Number(wallet?.balance || 0)} variant="h3" fontWeight={800} />
              )}
              <Button
                variant="outlined"
                size="small"
                startIcon={<Add />}
                onClick={() => setOpenTopup(true)}
                sx={{ mt: 2, borderColor: 'white', color: 'white', '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } }}
              >
                เติมเงิน
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 6, md: 4 }}>
          <Card>
            <CardContent sx={{ p: 3, textAlign: 'center' }}>
              <ArrowUpward color="success" sx={{ fontSize: 32, mb: 1 }} />
              <Money
                amount={txData?.data?.filter((t) => t.type === 'TOPUP').reduce((s, t) => s + Number(t.amount), 0) || 0}
                variant="h5"
                fontWeight={700}
                color="success"
              />
              <Typography variant="body2" color="text.secondary">รวมเติมเงิน</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 6, md: 4 }}>
          <Card>
            <CardContent sx={{ p: 3, textAlign: 'center' }}>
              <ArrowDownward color="error" sx={{ fontSize: 32, mb: 1 }} />
              <Money
                amount={txData?.data?.filter((t) => t.type === 'PURCHASE').reduce((s, t) => s + Number(t.amount), 0) || 0}
                variant="h5"
                fontWeight={700}
                color="error"
              />
              <Typography variant="body2" color="text.secondary">รวมใช้จ่าย</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Transactions */}
      <Typography variant="h6" fontWeight={700} mb={2}>ประวัติการเคลื่อนไหว</Typography>
      <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>วันที่</TableCell>
              <TableCell>ประเภท</TableCell>
              <TableCell>รายละเอียด</TableCell>
              <TableCell align="right">จำนวน</TableCell>
              <TableCell align="right">ยอดหลัง</TableCell>
              <TableCell>สถานะ</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {txLoading ? (
              <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4 }}><CircularProgress /></TableCell></TableRow>
            ) : txData?.data?.length === 0 ? (
              <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>ยังไม่มีรายการ</TableCell></TableRow>
            ) : txData?.data?.map((tx) => (
              <TableRow key={tx.id} hover>
                <TableCell>
                  <Typography variant="body2">{dayjs(tx.createdAt).format('DD/MM/YY')}</Typography>
                  <Typography variant="caption" color="text.secondary">{dayjs(tx.createdAt).format('HH:mm')}</Typography>
                </TableCell>
                <TableCell><StatusChip status={tx.type} /></TableCell>
                <TableCell>
                  <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>{tx.description || '-'}</Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography
                    variant="body2"
                    fontWeight={700}
                    color={tx.type === 'TOPUP' ? 'success.main' : 'error.main'}
                    component="span"
                  >
                    {tx.type === 'TOPUP' ? '+' : '-'}
                    {formatMoney(Number(tx.amount))}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2" component="span">
                    {formatMoney(Number(tx.balanceAfter))}
                  </Typography>
                </TableCell>
                <TableCell><StatusChip status={tx.status} /></TableCell>
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

      {/* Topup Dialog */}
      <Dialog open={openTopup} onClose={() => setOpenTopup(false)} maxWidth="xs" fullWidth>
        <DialogTitle fontWeight={700}>เติมเงินเข้ากระเป๋า</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={2}>
            ยอดเงินปัจจุบัน: {formatMoney(Number(wallet?.balance || 0))}
          </Typography>
          <TextField
            label="จำนวนเงิน (บาท)"
            type="number"
            fullWidth
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            inputProps={{ min: 1 }}
            sx={{ mb: 2 }}
          />
          <Typography variant="body2" color="text.secondary" mb={1}>เติมเร็ว:</Typography>
          <Box display="flex" gap={1} flexWrap="wrap">
            {quickAmounts.map((qa) => (
              <Button key={qa} variant="outlined" size="small" onClick={() => setAmount(String(qa))}>
                {formatMoney(qa)}
              </Button>
            ))}
          </Box>
          <Alert severity="info" sx={{ mt: 2 }}>
            ⚠️ นี่คือ Demo — เงินจะถูกเติมเข้าโดยตรง
          </Alert>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 0 }}>
          <Button onClick={() => setOpenTopup(false)}>ยกเลิก</Button>
          <Button
            variant="contained"
            disabled={!amount || Number(amount) <= 0 || topupMutation.isPending}
            onClick={() => topupMutation.mutate()}
          >
            {topupMutation.isPending ? <CircularProgress size={20} color="inherit" /> : 'ยืนยันเติมเงิน'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};
