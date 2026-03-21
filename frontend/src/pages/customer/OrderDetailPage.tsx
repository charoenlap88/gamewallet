import {
  Container,
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
  Alert,
  CircularProgress,
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ordersApi } from '../../api/orders';
import { StatusChip } from '../../components/common/StatusChip';
import { PageHeader } from '../../components/common/PageHeader';
import { LoadingScreen } from '../../components/common/LoadingScreen';
import dayjs from 'dayjs';
import toast from 'react-hot-toast';
import { Money } from '../../components/Money';

const METHOD_LABEL: Record<string, string> = {
  WALLET: '💰 Wallet',
  PROMPTPAY: '📱 PromptPay',
  OMISE: '💳 Omise',
  SLIP: '🧾 Slip',
};

export const OrderDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: order, isLoading, isError, error } = useQuery({
    queryKey: ['my-order', id],
    queryFn: () => ordersApi.getMyOrder(id!),
    enabled: !!id,
  });

  const cancelMutation = useMutation({
    mutationFn: () => ordersApi.cancelMyOrder(id!),
    onSuccess: () => {
      toast.success('ยกเลิกคำสั่งซื้อแล้ว');
      queryClient.invalidateQueries({ queryKey: ['my-order', id] });
      queryClient.invalidateQueries({ queryKey: ['my-orders'] });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message;
      toast.error(Array.isArray(msg) ? msg[0] : msg || 'ยกเลิกไม่สำเร็จ');
    },
  });

  if (!id) {
    return (
      <Container sx={{ py: 4 }}>
        <Alert severity="error">ไม่พบรหัสคำสั่งซื้อ</Alert>
      </Container>
    );
  }

  if (isLoading) return <LoadingScreen />;

  if (isError || !order) {
    const status = (error as any)?.response?.status;
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/orders')} sx={{ mb: 2 }}>
          กลับ
        </Button>
        <Alert severity="error">
          {status === 404 ? 'ไม่พบคำสั่งซื้อนี้ หรือไม่ใช่ของคุณ' : 'โหลดรายละเอียดไม่สำเร็จ'}
        </Alert>
      </Container>
    );
  }

  const canCancel = order.status === 'PENDING' || order.status === 'FAILED';

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Button startIcon={<ArrowBack />} onClick={() => navigate('/orders')} sx={{ mb: 2 }}>
        กลับไปประวัติคำสั่งซื้อ
      </Button>

      <PageHeader
        title="รายละเอียดคำสั่งซื้อ"
        subtitle={dayjs(order.createdAt).format('DD/MM/YYYY HH:mm')}
      />

      <Paper sx={{ p: 3, borderRadius: 2, mb: 3 }}>
        <Box display="flex" flexWrap="wrap" gap={2} alignItems="center" justifyContent="space-between" mb={2}>
          <Box>
            <Typography variant="caption" color="text.secondary" display="block">
              Order ID
            </Typography>
            <Typography variant="body2" fontFamily="monospace" sx={{ wordBreak: 'break-all' }}>
              {order.id}
            </Typography>
          </Box>
          <Box textAlign="right">
            <Typography variant="caption" color="text.secondary" display="block">
              สถานะ
            </Typography>
            <StatusChip status={order.status} />
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box display="grid" gridTemplateColumns={{ xs: '1fr', sm: '1fr 1fr' }} gap={2}>
          <Box>
            <Typography variant="caption" color="text.secondary">
              วิธีชำระเงิน
            </Typography>
            <Typography variant="body1">
              {METHOD_LABEL[order.paymentMethod] || order.paymentMethod}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">
              ยอดรวม
            </Typography>
            <Money amount={Number(order.finalAmount)} variant="h6" color="primary" fontWeight={800} />
          </Box>
        </Box>

        {order.notes && (
          <Box mt={2}>
            <Typography variant="caption" color="text.secondary">
              หมายเหตุ
            </Typography>
            <Typography variant="body2">{order.notes}</Typography>
          </Box>
        )}

        {order.payment && (
          <Box mt={2}>
            <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
              การชำระเงิน
            </Typography>
            <Typography variant="body2">
              สถานะ: <StatusChip status={String(order.payment.status)} />
              {order.payment.paidAt && (
                <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                  ({dayjs(order.payment.paidAt).format('DD/MM/YY HH:mm')})
                </Typography>
              )}
            </Typography>
          </Box>
        )}
      </Paper>

      <Typography variant="subtitle1" fontWeight={700} gutterBottom>
        รายการสินค้า
      </Typography>
      <TableContainer component={Paper} sx={{ borderRadius: 2, mb: 3 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>สินค้า</TableCell>
              <TableCell align="right">จำนวน</TableCell>
              <TableCell align="right">ราคา/หน่วย</TableCell>
              <TableCell align="right">รวม</TableCell>
              <TableCell>สถานะรายการ</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(order.items || []).map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <Typography fontWeight={600}>{item.product?.name || item.productId}</Typography>
                  {item.supplier?.name && (
                    <Typography variant="caption" color="text.secondary" display="block">
                      Supplier: {item.supplier.name}
                    </Typography>
                  )}
                </TableCell>
                <TableCell align="right">{item.quantity}</TableCell>
                <TableCell align="right">
                  <Money
                    amount={Number(item.unitPrice)}
                    component="span"
                    variant="body2"
                  />
                </TableCell>
                <TableCell align="right">
                  <Money
                    amount={Number(item.unitPrice) * item.quantity}
                    component="span"
                    variant="body2"
                    fontWeight={600}
                  />
                </TableCell>
                <TableCell>
                  <StatusChip status={item.status} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {canCancel && (
        <Box display="flex" justifyContent="flex-end">
          <Button
            color="error"
            variant="outlined"
            disabled={cancelMutation.isPending}
            onClick={() => {
              if (window.confirm('ยืนยันยกเลิกคำสั่งซื้อนี้?')) cancelMutation.mutate();
            }}
          >
            {cancelMutation.isPending ? <CircularProgress size={22} /> : 'ยกเลิกคำสั่งซื้อ'}
          </Button>
        </Box>
      )}
    </Container>
  );
};
