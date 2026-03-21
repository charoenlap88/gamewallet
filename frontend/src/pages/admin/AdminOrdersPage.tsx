import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Typography, Box, Button, Pagination, CircularProgress, FormControl,
  InputLabel, Select, MenuItem, Stack, Alert, Dialog, DialogTitle, DialogContent,
  DialogContentText, DialogActions, ToggleButton, ToggleButtonGroup,
} from '@mui/material';
import { Cancel, PlayArrow, TaskAlt, TableChart, ViewColumn } from '@mui/icons-material';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ordersApi } from '../../api/orders';
import { StatusChip } from '../../components/common/StatusChip';
import { PageHeader } from '../../components/common/PageHeader';
import dayjs from 'dayjs';
import toast from 'react-hot-toast';
import { AdminOrdersBoard } from '../../components/admin/AdminOrdersBoard';
import { useAppLocale } from '../../i18n/useAppLocale';

export const AdminOrdersPage = () => {
  const { t } = useTranslation();
  const locale = useAppLocale();
  const [view, setView] = useState<'table' | 'board'>('table');
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [completeTargetId, setCompleteTargetId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const invalidateAllOrderQueries = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
    queryClient.invalidateQueries({ queryKey: ['admin-orders-board'] });
  };

  const { data, isLoading } = useQuery({
    queryKey: ['admin-orders', page, status],
    queryFn: () => ordersApi.getAllOrders({ page, limit: 20, status: status || undefined }),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => ordersApi.cancelOrder(id),
    onSuccess: () => {
      toast.success(t('admin.orders.cancelOk'));
      invalidateAllOrderQueries();
    },
    onError: (err: any) => toast.error(err.response?.data?.message || t('common.error')),
  });

  const processMutation = useMutation({
    mutationFn: (id: string) => ordersApi.markOrderProcessing(id),
    onSuccess: () => {
      toast.success(t('admin.orders.processingOk'));
      invalidateAllOrderQueries();
    },
    onError: (err: any) => toast.error(err.response?.data?.message || t('common.error')),
  });

  const completeMutation = useMutation({
    mutationFn: (id: string) => ordersApi.markOrderComplete(id),
    onSuccess: () => {
      toast.success(t('admin.orders.completeOk'));
      setCompleteTargetId(null);
      invalidateAllOrderQueries();
    },
    onError: (err: any) => toast.error(err.response?.data?.message || t('common.error')),
  });

  const totalPages = data ? Math.ceil(data.total / 20) : 1;

  return (
    <Box>
      <PageHeader
        title={t('admin.orders.title')}
        subtitle={t('admin.orders.subtitle', { count: data?.total ?? 0 })}
        action={
          <ToggleButtonGroup
            value={view}
            exclusive
            size="small"
            color="primary"
            onChange={(_, v) => v && setView(v)}
          >
            <ToggleButton value="table"><TableChart sx={{ mr: 0.5 }} fontSize="small" />{t('admin.orders.viewTable')}</ToggleButton>
            <ToggleButton value="board"><ViewColumn sx={{ mr: 0.5 }} fontSize="small" />{t('admin.orders.viewBoard')}</ToggleButton>
          </ToggleButtonGroup>
        }
      />

      {view === 'board' && (
        <Box mb={3}>
          <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
            {t('admin.orders.boardHint')}
          </Alert>
          <AdminOrdersBoard />
        </Box>
      )}

      {view === 'table' && !status && (
        <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
          {t('admin.orders.queueHint')}
        </Alert>
      )}

      {view === 'table' && (
      <Box display="flex" gap={2} mb={3}>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>{t('admin.orders.statusFilter')}</InputLabel>
          <Select value={status} label={t('admin.orders.statusFilter')} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
            <MenuItem value="">{t('admin.orders.statusAll')}</MenuItem>
            {['PROCESSING', 'PENDING', 'SUCCESS', 'FAILED', 'CANCELLED', 'REFUNDED'].map((s) => (
              <MenuItem key={s} value={s}>{s}</MenuItem>
            ))}
          </Select>
        </FormControl>
        {status === 'PROCESSING' || status === 'PENDING' || status === 'FAILED' ? (
          <Typography variant="caption" color="text.secondary" alignSelf="center">
            {t('admin.orders.fifoHint')}
          </Typography>
        ) : null}
      </Box>
      )}

      {view === 'table' && (
      <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>{t('admin.orders.orderId')}</TableCell>
              <TableCell>{t('admin.orders.customer')}</TableCell>
              <TableCell>{t('admin.orders.product')}</TableCell>
              <TableCell>{t('admin.orders.payMethod')}</TableCell>
              <TableCell align="right">{t('admin.orders.amount')}</TableCell>
              <TableCell>{t('common.status')}</TableCell>
              <TableCell>{t('admin.orders.date')}</TableCell>
              <TableCell align="right">{t('admin.orders.actions')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={8} align="center" sx={{ py: 4 }}><CircularProgress /></TableCell></TableRow>
            ) : !data?.data?.length ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                  <Typography color="text.secondary">{t('admin.orders.noOrders')}</Typography>
                </TableCell>
              </TableRow>
            ) : (
              data.data.map((order) => (
                <TableRow key={order.id} hover>
                  <TableCell>
                    <Typography variant="caption" fontFamily="monospace">{order.id.slice(0, 8)}...</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>{order.user?.username ?? '—'}</Typography>
                    <Typography variant="caption" color="text.secondary">{order.user?.email ?? ''}</Typography>
                  </TableCell>
                  <TableCell>
                    {order.items?.slice(0, 2).map((item) => (
                      <Typography key={item.id} variant="caption" display="block" noWrap sx={{ maxWidth: 160 }}>
                        {item.product?.name}
                      </Typography>
                    ))}
                    {(order.items?.length || 0) > 2 && (
                      <Typography variant="caption" color="text.secondary">+{(order.items?.length || 0) - 2}</Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {t(`paymentMethod.${order.paymentMethod}`, { defaultValue: order.paymentMethod })}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography fontWeight={700} color="primary.main">
                      ฿{Number(order.finalAmount).toLocaleString(locale, { minimumFractionDigits: 2 })}
                    </Typography>
                  </TableCell>
                  <TableCell><StatusChip status={order.status} /></TableCell>
                  <TableCell>
                    <Typography variant="caption">{dayjs(order.createdAt).format('DD/MM/YY HH:mm')}</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={0.5} justifyContent="flex-end" flexWrap="wrap" useFlexGap>
                      {order.status === 'PENDING' && (
                        <Button
                          size="small"
                          variant="contained"
                          color="secondary"
                          startIcon={<PlayArrow fontSize="small" />}
                          onClick={() => processMutation.mutate(order.id)}
                          disabled={processMutation.isPending || completeMutation.isPending}
                        >
                          {t('admin.orders.startProcessing')}
                        </Button>
                      )}
                      {(order.status === 'PROCESSING' || order.status === 'PENDING' || order.status === 'FAILED') && (
                        <Button
                          size="small"
                          variant="contained"
                          color="success"
                          startIcon={<TaskAlt fontSize="small" />}
                          onClick={() => setCompleteTargetId(order.id)}
                          disabled={processMutation.isPending || completeMutation.isPending}
                        >
                          {t('admin.orders.completeSuccess')}
                        </Button>
                      )}
                      {(order.status === 'PENDING' || order.status === 'FAILED') && (
                        <Button
                          size="small"
                          color="error"
                          startIcon={<Cancel fontSize="small" />}
                          onClick={() => cancelMutation.mutate(order.id)}
                          disabled={cancelMutation.isPending}
                        >
                          {t('admin.orders.cancel')}
                        </Button>
                      )}
                    </Stack>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      )}

      {view === 'table' && totalPages > 1 && (
        <Box display="flex" justifyContent="center" mt={3}>
          <Pagination count={totalPages} page={page} onChange={(_, p) => setPage(p)} color="primary" />
        </Box>
      )}

      <Dialog open={!!completeTargetId} onClose={() => !completeMutation.isPending && setCompleteTargetId(null)}>
        <DialogTitle>{t('admin.orders.completeDialogTitle')}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t('admin.orders.completeDialogBody')}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCompleteTargetId(null)} disabled={completeMutation.isPending}>{t('common.cancel')}</Button>
          <Button
            variant="contained"
            color="success"
            onClick={() => completeTargetId && completeMutation.mutate(completeTargetId)}
            disabled={completeMutation.isPending}
          >
            {completeMutation.isPending ? <CircularProgress size={22} /> : t('admin.orders.confirmComplete')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
