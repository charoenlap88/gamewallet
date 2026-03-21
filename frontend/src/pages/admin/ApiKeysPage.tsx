import {
  Box, Card, CardContent, Typography, Button, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Grid, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Paper, Chip,
  FormControl, InputLabel, Select, MenuItem, CircularProgress,
} from '@mui/material';
import { Add, Key, Block, CheckCircle } from '@mui/icons-material';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { suppliersApi } from '../../api/suppliers';
import { StatusChip } from '../../components/common/StatusChip';
import { PageHeader } from '../../components/common/PageHeader';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';

export const ApiKeysPage = () => {
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [openAdd, setOpenAdd] = useState(false);
  const [apiKeyForm, setApiKeyForm] = useState<{
    keyName: string; keyValue: string; environment: 'PRODUCTION' | 'UAT'; expiresAt: string;
  }>({ keyName: '', keyValue: '', environment: 'PRODUCTION', expiresAt: '' });
  const queryClient = useQueryClient();

  const { data: suppliers, isLoading: suppliersLoading } = useQuery({
    queryKey: ['suppliers'],
    queryFn: suppliersApi.getAll,
  });

  const { data: supplierDetail, isLoading: detailLoading } = useQuery({
    queryKey: ['supplier-detail', selectedSupplierId],
    queryFn: () => suppliersApi.getOne(selectedSupplierId),
    enabled: !!selectedSupplierId,
  });

  const addKeyMutation = useMutation({
    mutationFn: () => suppliersApi.addApiKey(selectedSupplierId, {
      ...apiKeyForm,
      expiresAt: apiKeyForm.expiresAt || undefined,
    } as any),
    onSuccess: () => {
      toast.success('เพิ่ม API Key สำเร็จ');
      queryClient.invalidateQueries({ queryKey: ['supplier-detail', selectedSupplierId] });
      setOpenAdd(false);
      setApiKeyForm({ keyName: '', keyValue: '', environment: 'PRODUCTION', expiresAt: '' });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'เกิดข้อผิดพลาด'),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ keyId, status }: { keyId: string; status: string }) =>
      suppliersApi.updateApiKeyStatus(keyId, { status }),
    onSuccess: () => {
      toast.success('อัปเดตสถานะสำเร็จ');
      queryClient.invalidateQueries({ queryKey: ['supplier-detail', selectedSupplierId] });
    },
    onError: () => toast.error('เกิดข้อผิดพลาด'),
  });

  const deleteKeyMutation = useMutation({
    mutationFn: (keyId: string) => suppliersApi.deleteApiKey(keyId),
    onSuccess: () => {
      toast.success('ลบ API Key สำเร็จ');
      queryClient.invalidateQueries({ queryKey: ['supplier-detail', selectedSupplierId] });
    },
  });

  const apiKeys = (supplierDetail as any)?.apiKeys || [];

  return (
    <Box>
      <PageHeader
        title="API Key Management"
        subtitle="จัดการ API Keys ของแต่ละ Supplier"
        action={
          selectedSupplierId && (
            <Button variant="contained" startIcon={<Add />} onClick={() => setOpenAdd(true)}>
              เพิ่ม API Key
            </Button>
          )
        }
      />

      {/* Supplier Selector */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 2.5 }}>
          <Typography variant="subtitle2" fontWeight={600} mb={1.5}>เลือก Supplier</Typography>
          {suppliersLoading ? (
            <CircularProgress size={24} />
          ) : (
            <Box display="flex" gap={1.5} flexWrap="wrap">
              {suppliers?.map((sup) => (
                <Card
                  key={sup.id}
                  onClick={() => setSelectedSupplierId(sup.id)}
                  sx={{
                    cursor: 'pointer', px: 2, py: 1.5, minWidth: 140,
                    border: selectedSupplierId === sup.id ? '2px solid' : '1px solid',
                    borderColor: selectedSupplierId === sup.id ? 'primary.main' : 'divider',
                    bgcolor: selectedSupplierId === sup.id ? 'primary.50' : 'transparent',
                    '&:hover': { borderColor: 'primary.main' },
                  }}
                >
                  <Box display="flex" alignItems="center" gap={1}>
                    <Key fontSize="small" color={selectedSupplierId === sup.id ? 'primary' : 'action'} />
                    <Box>
                      <Typography variant="body2" fontWeight={700}>{sup.name}</Typography>
                      <Typography variant="caption" color="text.secondary">{sup.code}</Typography>
                    </Box>
                  </Box>
                  <Chip
                    label={`${sup._count?.apiKeys || 0} keys`}
                    size="small"
                    sx={{ mt: 0.75, fontSize: 10 }}
                    color={selectedSupplierId === sup.id ? 'primary' : 'default'}
                  />
                </Card>
              ))}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* API Keys Table */}
      {!selectedSupplierId ? (
        <Box textAlign="center" py={8} color="text.secondary">
          <Key sx={{ fontSize: 56, opacity: 0.3, mb: 2 }} />
          <Typography>เลือก Supplier เพื่อดู API Keys</Typography>
        </Box>
      ) : detailLoading ? (
        <Box display="flex" justifyContent="center" py={4}><CircularProgress /></Box>
      ) : (
        <Card>
          <CardContent sx={{ p: 0 }}>
            <Box px={3} py={2} display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="subtitle1" fontWeight={700}>
                API Keys ของ {suppliers?.find((s) => s.id === selectedSupplierId)?.name}
                <Chip label={`${apiKeys.length} keys`} size="small" sx={{ ml: 1 }} />
              </Typography>
              <Button variant="outlined" startIcon={<Add />} size="small" onClick={() => setOpenAdd(true)}>
                เพิ่ม Key
              </Button>
            </Box>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Key Name</TableCell>
                    <TableCell>Environment</TableCell>
                    <TableCell>สถานะ</TableCell>
                    <TableCell>หมดอายุ</TableCell>
                    <TableCell>สร้างเมื่อ</TableCell>
                    <TableCell>จัดการ</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {apiKeys.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                        ยังไม่มี API Key
                      </TableCell>
                    </TableRow>
                  ) : apiKeys.map((key: any) => (
                    <TableRow key={key.id} hover>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Key fontSize="small" color="action" />
                          <Typography variant="body2" fontWeight={600}>{key.keyName}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={key.environment}
                          size="small"
                          color={key.environment === 'PRODUCTION' ? 'error' : 'warning'}
                        />
                      </TableCell>
                      <TableCell><StatusChip status={key.status} /></TableCell>
                      <TableCell>
                        <Typography variant="caption">
                          {key.expiresAt ? dayjs(key.expiresAt).format('DD/MM/YYYY') : 'ไม่มีวันหมดอายุ'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption">{dayjs(key.createdAt).format('DD/MM/YY HH:mm')}</Typography>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" gap={1}>
                          {key.status === 'ACTIVE' ? (
                            <Button
                              size="small"
                              color="warning"
                              startIcon={<Block fontSize="small" />}
                              onClick={() => updateStatusMutation.mutate({ keyId: key.id, status: 'INACTIVE' })}
                              disabled={updateStatusMutation.isPending}
                            >
                              ระงับ
                            </Button>
                          ) : (
                            <Button
                              size="small"
                              color="success"
                              startIcon={<CheckCircle fontSize="small" />}
                              onClick={() => updateStatusMutation.mutate({ keyId: key.id, status: 'ACTIVE' })}
                              disabled={updateStatusMutation.isPending}
                            >
                              เปิดใช้
                            </Button>
                          )}
                          <Button
                            size="small"
                            color="error"
                            onClick={() => {
                              if (confirm('ต้องการลบ API Key นี้?')) deleteKeyMutation.mutate(key.id);
                            }}
                          >
                            ลบ
                          </Button>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Add API Key Dialog */}
      <Dialog open={openAdd} onClose={() => setOpenAdd(false)} maxWidth="sm" fullWidth>
        <DialogTitle fontWeight={700}>
          เพิ่ม API Key — {suppliers?.find((s) => s.id === selectedSupplierId)?.name}
        </DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <TextField
              label="Key Name * (เช่น Authorization, X-API-Key)"
              fullWidth
              value={apiKeyForm.keyName}
              onChange={(e) => setApiKeyForm({ ...apiKeyForm, keyName: e.target.value })}
            />
            <TextField
              label="Key Value *"
              fullWidth
              value={apiKeyForm.keyValue}
              onChange={(e) => setApiKeyForm({ ...apiKeyForm, keyValue: e.target.value })}
              helperText="ค่า API Key จะถูกเข้ารหัสก่อนเก็บ"
            />
            <FormControl fullWidth>
              <InputLabel>Environment *</InputLabel>
              <Select
                value={apiKeyForm.environment}
                label="Environment *"
                onChange={(e) => setApiKeyForm({ ...apiKeyForm, environment: e.target.value as 'PRODUCTION' | 'UAT' })}
              >
                <MenuItem value="PRODUCTION">
                  <Box display="flex" alignItems="center" gap={1}>
                    <Chip label="PROD" color="error" size="small" />
                    Production
                  </Box>
                </MenuItem>
                <MenuItem value="UAT">
                  <Box display="flex" alignItems="center" gap={1}>
                    <Chip label="UAT" color="warning" size="small" />
                    UAT / Testing
                  </Box>
                </MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="วันหมดอายุ (ไม่บังคับ)"
              type="date"
              fullWidth
              value={apiKeyForm.expiresAt}
              onChange={(e) => setApiKeyForm({ ...apiKeyForm, expiresAt: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 0 }}>
          <Button onClick={() => setOpenAdd(false)}>ยกเลิก</Button>
          <Button
            variant="contained"
            disabled={addKeyMutation.isPending || !apiKeyForm.keyName || !apiKeyForm.keyValue}
            onClick={() => addKeyMutation.mutate()}
          >
            {addKeyMutation.isPending ? <CircularProgress size={20} color="inherit" /> : 'เพิ่ม API Key'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
