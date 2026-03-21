import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Box,
  Pagination,
  CircularProgress,
  Chip,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
} from '@mui/material';
import { Visibility, Close, FilterList } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { adminApi } from '../../api/admin';
import { PageHeader } from '../../components/common/PageHeader';
import dayjs from 'dayjs';
import type { AuditLog, AuditActionType } from '../../types';

const ACTION_COLOR: Record<string, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
  CREATE: 'success',
  UPDATE: 'info',
  DELETE: 'error',
  LOGIN: 'default',
  LOGOUT: 'default',
  RETRY: 'warning',
  CANCEL: 'warning',
};

const ACTIONS: AuditActionType[] = ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'RETRY', 'CANCEL'];

function jsonBlock(label: string, value: unknown) {
  if (value == null) return null;
  let text: string;
  try {
    text = JSON.stringify(value, null, 2);
  } catch {
    text = String(value);
  }
  return (
    <Box mb={2}>
      <Typography variant="subtitle2" fontWeight={700} gutterBottom>
        {label}
      </Typography>
      <Paper
        variant="outlined"
        sx={{
          p: 1.5,
          maxHeight: 240,
          overflow: 'auto',
          bgcolor: 'grey.50',
          borderRadius: 1,
        }}
      >
        <Typography
          component="pre"
          variant="caption"
          sx={{ fontFamily: 'ui-monospace, monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-word', m: 0 }}
        >
          {text}
        </Typography>
      </Paper>
    </Box>
  );
}

export const AuditLogsPage = () => {
  const [page, setPage] = useState(1);
  const [moduleFilter, setModuleFilter] = useState('');
  const [actionFilter, setActionFilter] = useState<AuditActionType | ''>('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [detail, setDetail] = useState<AuditLog | null>(null);
  const limit = 30;

  useEffect(() => {
    setPage(1);
  }, [moduleFilter, actionFilter, search]);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['audit-logs', page, limit, moduleFilter, actionFilter, search],
    queryFn: () =>
      adminApi.getAuditLogs({
        page,
        limit,
        ...(moduleFilter.trim() ? { module: moduleFilter.trim() } : {}),
        ...(actionFilter ? { action: actionFilter } : {}),
        ...(search.trim() ? { search: search.trim() } : {}),
      }),
  });

  const totalPages = data ? Math.ceil(data.total / limit) : 1;

  const applySearch = () => setSearch(searchInput);

  return (
    <Box>
      <PageHeader
        title="Audit Logs"
        subtitle={`${data?.total ?? 0} รายการ · บันทึกจากการล็อกอิน แก้ไขผู้ใช้/สินค้า ยกเลิกออเดอร์ และอื่นๆ`}
      />

      <Paper sx={{ p: 2, mb: 2, borderRadius: 2 }}>
        <Box display="flex" alignItems="center" gap={1} mb={2}>
          <FilterList color="action" />
          <Typography variant="subtitle2" fontWeight={700}>
            ตัวกรอง
          </Typography>
          {isFetching && !isLoading && (
            <CircularProgress size={18} sx={{ ml: 1 }} />
          )}
        </Box>
        <Box display="flex" flexWrap="wrap" gap={2} alignItems="flex-end">
          <TextField
            size="small"
            label="ค้นหาในคำอธิบาย"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && applySearch()}
            sx={{ minWidth: 220 }}
          />
          <TextField
            size="small"
            label="Module (เช่น AUTH, USER)"
            value={moduleFilter}
            onChange={(e) => setModuleFilter(e.target.value)}
            sx={{ minWidth: 200 }}
          />
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Action</InputLabel>
            <Select
              value={actionFilter}
              label="Action"
              onChange={(e) => setActionFilter(e.target.value as AuditActionType | '')}
            >
              <MenuItem value="">ทั้งหมด</MenuItem>
              {ACTIONS.map((a) => (
                <MenuItem key={a} value={a}>
                  {a}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button variant="contained" size="medium" onClick={applySearch}>
            ค้นหา
          </Button>
          <Button
            variant="text"
            size="medium"
            onClick={() => {
              setSearchInput('');
              setModuleFilter('');
              setActionFilter('');
              setSearch('');
            }}
          >
            ล้างตัวกรอง
          </Button>
        </Box>
      </Paper>

      <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>เวลา</TableCell>
              <TableCell>ผู้กระทำ</TableCell>
              <TableCell>Action</TableCell>
              <TableCell>Module</TableCell>
              <TableCell>รายละเอียด</TableCell>
              <TableCell>IP</TableCell>
              <TableCell align="right">ดู</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : data?.data?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                  <Typography>ไม่พบ Audit Log ตามเงื่อนไข</Typography>
                  <Typography variant="caption" display="block" mt={1}>
                    ลองล็อกอิน / แก้ไขสถานะผู้ใช้ / สร้างสินค้า แล้วกลับมาดูอีกครั้ง
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              data?.data?.map((log) => (
                <TableRow key={log.id} hover>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>
                    <Typography variant="caption">{dayjs(log.createdAt).format('DD/MM/YY HH:mm:ss')}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>
                      {log.user?.username || '-'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block" noWrap sx={{ maxWidth: 180 }}>
                      {log.user?.email}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={log.action}
                      size="small"
                      color={ACTION_COLOR[log.action] || 'default'}
                      sx={{ fontWeight: 600 }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>
                      {log.module}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ maxWidth: 280 }} noWrap title={log.description}>
                      {log.description}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" fontFamily="monospace">
                      {log.ipAddress || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="รายละเอียด JSON">
                      <IconButton size="small" color="primary" onClick={() => setDetail(log)}>
                        <Visibility fontSize="small" />
                      </IconButton>
                    </Tooltip>
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

      <Dialog open={!!detail} onClose={() => setDetail(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          รายละเอียด Audit
          <IconButton size="small" onClick={() => setDetail(null)} aria-label="close">
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {detail && (
            <>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                ID: <Typography component="span" variant="body2" fontFamily="monospace">{detail.id}</Typography>
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>เวลา:</strong> {dayjs(detail.createdAt).format('DD/MM/YYYY HH:mm:ss')}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>ผู้กระทำ:</strong> {detail.user?.username} ({detail.user?.email || '-'})
              </Typography>
              {detail.targetUserId && (
                <Typography variant="body2" gutterBottom>
                  <strong>เป้าหมาย userId:</strong>{' '}
                  <Typography component="span" variant="body2" fontFamily="monospace">
                    {detail.targetUserId}
                  </Typography>
                </Typography>
              )}
              <Typography variant="body2" gutterBottom>
                <strong>Action / Module:</strong> {detail.action} · {detail.module}
              </Typography>
              <Typography variant="body2" paragraph>
                <strong>คำอธิบาย:</strong> {detail.description}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>IP:</strong> {detail.ipAddress || '-'}
              </Typography>
              {detail.userAgent && (
                <Typography variant="body2" paragraph sx={{ wordBreak: 'break-word' }}>
                  <strong>User-Agent:</strong> {detail.userAgent}
                </Typography>
              )}
              {jsonBlock('ก่อนเปลี่ยน (before)', detail.before)}
              {jsonBlock('หลังเปลี่ยน (after)', detail.after)}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetail(null)}>ปิด</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
