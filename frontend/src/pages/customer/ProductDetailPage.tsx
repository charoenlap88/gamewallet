import {
  Container, Grid, Card, Typography, Button, Box,
  Chip, Divider, Alert, FormControl, RadioGroup, FormControlLabel,
  Radio, CircularProgress, alpha,
} from '@mui/material';
import { ShoppingCart, AccountBalanceWallet, ArrowBack, LocalShipping } from '@mui/icons-material';
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productsApi } from '../../api/products';
import { ordersApi } from '../../api/orders';
import { walletApi } from '../../api/wallet';
import { useAuthStore } from '../../stores/authStore';
import { LoadingScreen } from '../../components/common/LoadingScreen';
import toast from 'react-hot-toast';
import { useMoneyDisplay } from '../../hooks/useMoneyDisplay';
import { Money } from '../../components/Money';

export const ProductDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuthStore();
  const { format: formatMoney } = useMoneyDisplay();
  const [paymentMethod, setPaymentMethod] = useState('WALLET');

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: () => productsApi.getProduct(id!),
    enabled: !!id,
  });

  const { data: wallet } = useQuery({
    queryKey: ['wallet-balance'],
    queryFn: walletApi.getBalance,
    enabled: isAuthenticated,
  });

  const orderMutation = useMutation({
    mutationFn: () => ordersApi.createOrder({
      items: [{ productId: id!, quantity: 1 }],
      paymentMethod,
    }),
    onSuccess: () => {
      toast.success('สั่งซื้อสำเร็จ!');
      queryClient.invalidateQueries({ queryKey: ['wallet-balance'] });
      queryClient.invalidateQueries({ queryKey: ['my-orders'] });
      navigate('/orders');
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message;
      toast.error(Array.isArray(msg) ? msg[0] : msg || 'เกิดข้อผิดพลาด');
    },
  });

  if (isLoading) return <LoadingScreen />;
  if (!product) return <Container><Alert severity="error">ไม่พบสินค้า</Alert></Container>;

  const balance = Number(wallet?.balance || 0);
  const price = Number(product.sellingPrice);
  const canAfford = balance >= price;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Button startIcon={<ArrowBack />} onClick={() => navigate(-1)} sx={{ mb: 3 }}>
        กลับ
      </Button>

      <Grid container spacing={4}>
        {/* Product Image */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Card sx={{ overflow: 'hidden' }}>
            <Box sx={{
              height: 280, bgcolor: alpha('#D32F2F', 0.06),
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {product.imageUrl ? (
                <Box
                  component="img"
                  src={product.imageUrl}
                  alt=""
                  sx={{ width: '100%', height: 280, objectFit: 'cover' }}
                />
              ) : (
                <Typography fontSize={80}>🎮</Typography>
              )}
            </Box>
          </Card>
        </Grid>

        {/* Product Info */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Box mb={1}>
            <Chip label={product.category?.name} size="small" color="primary" variant="outlined" />
          </Box>
          <Typography variant="h4" fontWeight={800} mb={1}>{product.name}</Typography>

          {product.description && (
            <Typography color="text.secondary" mb={2}>{product.description}</Typography>
          )}

          <Box mb={3}>
            <Money amount={price} variant="h3" fontWeight={800} color="primary" />
          </Box>

          {/* Supplier info */}
          {(product as any).supplierPrices?.length > 0 && (
            <Box mb={3}>
              <Typography variant="body2" fontWeight={600} mb={1} display="flex" alignItems="center" gap={1}>
                <LocalShipping fontSize="small" color="primary" />
                Suppliers ที่รองรับ ({(product as any).supplierPrices.length} ราย)
              </Typography>
              {(product as any).supplierPrices?.map((sp: any) => (
                <Chip
                  key={sp.id}
                  label={`${sp.supplier?.name} — ${formatMoney(Number(sp.costPrice))}`}
                  size="small"
                  color="default"
                  sx={{ mr: 1, mb: 1 }}
                />
              ))}
            </Box>
          )}

          <Divider sx={{ my: 2 }} />

          {isAuthenticated ? (
            <>
              {/* Payment method */}
              <Typography variant="subtitle2" fontWeight={700} mb={1}>วิธีชำระเงิน</Typography>
              <FormControl component="fieldset" sx={{ mb: 2, width: '100%' }}>
                <RadioGroup value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                  <Card variant="outlined" sx={{
                    mb: 1.5, p: 1,
                    borderColor: paymentMethod === 'WALLET' ? 'primary.main' : 'divider',
                    bgcolor: paymentMethod === 'WALLET' ? alpha('#D32F2F', 0.04) : 'transparent',
                  }}>
                    <FormControlLabel
                      value="WALLET"
                      control={<Radio color="primary" />}
                      label={
                        <Box>
                          <Typography variant="body2" fontWeight={600} display="flex" alignItems="center" gap={1}>
                            <AccountBalanceWallet fontSize="small" color="primary" />
                            กระเป๋าเงิน
                          </Typography>
                          <Typography variant="caption" color={canAfford ? 'success.main' : 'error.main'}>
                            ยอดคงเหลือ: {formatMoney(balance)}
                            {!canAfford && ' (ไม่เพียงพอ)'}
                          </Typography>
                        </Box>
                      }
                    />
                  </Card>
                  <Card variant="outlined" sx={{ p: 1, borderColor: paymentMethod === 'PROMPTPAY' ? 'primary.main' : 'divider' }}>
                    <FormControlLabel
                      value="PROMPTPAY"
                      control={<Radio color="primary" />}
                      label={
                        <Typography variant="body2" fontWeight={600}>📱 PromptPay QR</Typography>
                      }
                    />
                  </Card>
                </RadioGroup>
              </FormControl>

              {!canAfford && paymentMethod === 'WALLET' && (
                <Alert severity="warning" action={
                  <Button size="small" onClick={() => navigate('/wallet')}>เติมเงิน</Button>
                } sx={{ mb: 2 }}>
                  ยอดเงินไม่เพียงพอ กรุณาเติมเงิน
                </Alert>
              )}

              <Button
                variant="contained"
                fullWidth
                size="large"
                startIcon={orderMutation.isPending ? <CircularProgress size={16} color="inherit" /> : <ShoppingCart />}
                disabled={orderMutation.isPending || (paymentMethod === 'WALLET' && !canAfford)}
                onClick={() => orderMutation.mutate()}
                sx={{ py: 1.5, fontWeight: 700 }}
              >
                {orderMutation.isPending ? 'กำลังสั่งซื้อ...' : `ซื้อทันที — ${formatMoney(price)}`}
              </Button>
            </>
          ) : (
            <Button
              variant="contained"
              fullWidth
              size="large"
              onClick={() => navigate('/login')}
              sx={{ py: 1.5, fontWeight: 700 }}
            >
              เข้าสู่ระบบเพื่อซื้อ
            </Button>
          )}
        </Grid>
      </Grid>
    </Container>
  );
};
