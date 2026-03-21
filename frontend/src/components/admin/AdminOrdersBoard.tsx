import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { Box, Paper, Typography, CircularProgress } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useQueries, useMutation, useQueryClient } from '@tanstack/react-query';
import { ordersApi } from '../../api/orders';
import { StatusChip } from '../common/StatusChip';
import type { Order, OrderStatus } from '../../types';
import dayjs from 'dayjs';
import toast from 'react-hot-toast';
import { useAppLocale } from '../../i18n/useAppLocale';

const BOARD_STATUSES: OrderStatus[] = [
  'PROCESSING',
  'PENDING',
  'FAILED',
  'SUCCESS',
  'CANCELLED',
];

function DroppableColumn({
  status,
  title,
  children,
}: {
  status: OrderStatus;
  title: string;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `col-${status}` });
  return (
    <Paper
      ref={setNodeRef}
      elevation={0}
      sx={{
        minHeight: 360,
        p: 1.5,
        flex: '1 1 220px',
        maxWidth: 320,
        bgcolor: isOver ? 'action.hover' : 'grey.50',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
      }}
    >
      <Typography fontWeight={800} mb={1.5} fontSize={14}>
        {title}
      </Typography>
      {children}
    </Paper>
  );
}

function DraggableOrderCard({ order, locale }: { order: Order; locale: string }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `order-${order.id}`,
    data: { order },
  });
  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, zIndex: 10 }
    : undefined;

  return (
    <Paper
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      sx={{
        p: 1.25,
        mb: 1,
        cursor: 'grab',
        opacity: isDragging ? 0.85 : 1,
        boxShadow: 2,
        touchAction: 'none',
        ...style,
      }}
    >
      <Typography variant="caption" fontFamily="monospace" color="text.secondary">
        {order.id.slice(0, 8)}…
      </Typography>
      <Typography variant="body2" fontWeight={700} noWrap>
        {order.user?.username || '—'}
      </Typography>
      <Typography variant="caption" color="text.secondary" display="block" noWrap>
        {dayjs(order.createdAt).format('DD/MM HH:mm')}
      </Typography>
      <Typography variant="body2" color="primary.main" fontWeight={800}>
        ฿{Number(order.finalAmount).toLocaleString(locale, { minimumFractionDigits: 2 })}
      </Typography>
      <Box mt={0.5}>
        <StatusChip status={order.status} />
      </Box>
    </Paper>
  );
}

export function AdminOrdersBoard() {
  const { t } = useTranslation();
  const locale = useAppLocale();
  const qc = useQueryClient();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const results = useQueries({
    queries: BOARD_STATUSES.map((status) => ({
      queryKey: ['admin-orders-board', status],
      queryFn: () => ordersApi.getAllOrders({ status, limit: 100, page: 1 }),
    })),
  });

  const loading = results.some((r) => r.isLoading);

  const columns: Record<OrderStatus, Order[]> = {
    PROCESSING: [],
    PENDING: [],
    FAILED: [],
    SUCCESS: [],
    CANCELLED: [],
    REFUNDED: [],
  };
  BOARD_STATUSES.forEach((s, i) => {
    columns[s] = (results[i].data?.data ?? []) as Order[];
  });

  const moveMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatus }) =>
      ordersApi.adminSetOrderStatus(id, status),
    onSuccess: () => {
      toast.success(t('admin.orderBoard.updateOk'));
      BOARD_STATUSES.forEach((s) => qc.invalidateQueries({ queryKey: ['admin-orders-board', s] }));
      qc.invalidateQueries({ queryKey: ['admin-orders'] });
    },
    onError: (e: any) => {
      toast.error(e.response?.data?.message || t('admin.orderBoard.updateFail'));
    },
  });

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over) return;
    const overId = String(over.id);
    if (!overId.startsWith('col-')) return;
    const target = overId.replace('col-', '') as OrderStatus;
    const aid = String(active.id);
    if (!aid.startsWith('order-')) return;
    const orderId = aid.slice(6);
    const fromOrder = BOARD_STATUSES.flatMap((s) => columns[s]).find((o) => o.id === orderId);
    if (!fromOrder || fromOrder.status === target) return;
    moveMut.mutate({ id: orderId, status: target });
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" py={6}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <DndContext sensors={sensors} onDragEnd={onDragEnd}>
      <Box display="flex" gap={2} flexWrap="wrap" alignItems="flex-start">
        {BOARD_STATUSES.map((status) => (
          <DroppableColumn
            key={status}
            status={status}
            title={t(`admin.orderBoard.${status}`)}
          >
            {columns[status].map((order) => (
              <DraggableOrderCard key={order.id} order={order} locale={locale} />
            ))}
            {columns[status].length === 0 && (
              <Typography variant="caption" color="text.secondary">
                {t('admin.orderBoard.emptyHint')}
              </Typography>
            )}
          </DroppableColumn>
        ))}
      </Box>
      {moveMut.isPending && (
        <Box display="flex" justifyContent="center" mt={2}>
          <CircularProgress size={28} />
        </Box>
      )}
    </DndContext>
  );
}
