import {
  Grid, Card, CardContent, Typography, Box, Button, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Accordion, AccordionSummary, AccordionDetails, Divider,
  CircularProgress, Select, MenuItem, FormControl, InputLabel,
} from '@mui/material';
import { Add, ExpandMore, Edit, Key, AccountTree } from '@mui/icons-material';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { suppliersApi } from '../../api/suppliers';
import { StatusChip } from '../../components/common/StatusChip';
import { PageHeader } from '../../components/common/PageHeader';
import toast from 'react-hot-toast';

export const SuppliersPage = () => {
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null);
  const [openCreate, setOpenCreate] = useState(false);
  const [openApiKey, setOpenApiKey] = useState(false);
  const [openMapping, setOpenMapping] = useState(false);
  const [supplierForm, setSupplierForm] = useState<any>({});
  const [apiKeyForm, setApiKeyForm] = useState<{ keyName: string; keyValue: string; environment: 'PRODUCTION' | 'UAT' }>({ keyName: '', keyValue: '', environment: 'PRODUCTION' });
  const [mappingForm, setMappingForm] = useState({ fieldName: '', supplierField: '', systemField: '', description: '' });
  const queryClient = useQueryClient();

  const { data: suppliers, isLoading } = useQuery({
    queryKey: ['suppliers'],
    queryFn: suppliersApi.getAll,
  });

  const { data: supplierDetail } = useQuery({
    queryKey: ['supplier-detail', selectedSupplier?.id],
    queryFn: () => suppliersApi.getOne(selectedSupplier.id),
    enabled: !!selectedSupplier,
  });

  const createMutation = useMutation({
    mutationFn: () => suppliersApi.create(supplierForm),
    onSuccess: () => { toast.success('เพิ่ม Supplier สำเร็จ'); queryClient.invalidateQueries({ queryKey: ['suppliers'] }); setOpenCreate(false); },
    onError: (err: any) => toast.error(err.response?.data?.message || 'เกิดข้อผิดพลาด'),
  });

  const updateMutation = useMutation({
    mutationFn: () => suppliersApi.update(selectedSupplier.id, { status: supplierForm.status }),
    onSuccess: () => { toast.success('อัปเดตสำเร็จ'); queryClient.invalidateQueries({ queryKey: ['suppliers'] }); },
  });

  const addApiKeyMutation = useMutation({
    mutationFn: () => suppliersApi.addApiKey(selectedSupplier.id, apiKeyForm),
    onSuccess: () => {
      toast.success('เพิ่ม API Key สำเร็จ');
      queryClient.invalidateQueries({ queryKey: ['supplier-detail', selectedSupplier?.id] });
      setOpenApiKey(false);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'เกิดข้อผิดพลาด'),
  });

  const addMappingMutation = useMutation({
    mutationFn: () => suppliersApi.addMapping(selectedSupplier.id, mappingForm),
    onSuccess: () => {
      toast.success('เพิ่ม Mapping สำเร็จ');
      queryClient.invalidateQueries({ queryKey: ['supplier-detail', selectedSupplier?.id] });
      setOpenMapping(false);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'เกิดข้อผิดพลาด'),
  });

  return (
    <Box>
      <PageHeader
        title="Supplier Management"
        action={
          <Button variant="contained" startIcon={<Add />} onClick={() => { setSupplierForm({}); setOpenCreate(true); }}>
            เพิ่ม Supplier
          </Button>
        }
      />

      <Grid container spacing={2.5}>
        {/* Supplier list */}
        <Grid size={{ xs: 12, md: 4 }}>
          {isLoading ? (
            <Box display="flex" justifyContent="center" py={4}><CircularProgress /></Box>
          ) : suppliers?.map((supplier) => (
            <Card
              key={supplier.id}
              onClick={() => setSelectedSupplier(supplier)}
              sx={{
                mb: 2, cursor: 'pointer',
                border: selectedSupplier?.id === supplier.id ? '2px solid' : '1px solid transparent',
                borderColor: selectedSupplier?.id === supplier.id ? 'primary.main' : 'transparent',
              }}
            >
              <CardContent sx={{ p: 2.5 }}>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                  <Box>
                    <Typography variant="subtitle1" fontWeight={700}>{supplier.name}</Typography>
                    <Typography variant="caption" color="text.secondary">{supplier.code}</Typography>
                  </Box>
                  <StatusChip status={supplier.status} />
                </Box>
                <Typography variant="body2" color="text.secondary" mt={1} noWrap>
                  {supplier.baseUrl}
                </Typography>
                <Box display="flex" gap={1} mt={1.5}>
                  <Chip label={`Priority: ${supplier.priority}`} size="small" />
                  <Chip label={`${supplier._count?.apiKeys || 0} keys`} size="small" icon={<Key fontSize="small" />} />
                </Box>
              </CardContent>
            </Card>
          ))}
        </Grid>

        {/* Supplier detail */}
        <Grid size={{ xs: 12, md: 8 }}>
          {!selectedSupplier ? (
            <Box display="flex" alignItems="center" justifyContent="center" height={300} color="text.secondary">
              <Box textAlign="center">
                <AccountTree sx={{ fontSize: 48, mb: 1, opacity: 0.3 }} />
                <Typography>เลือก Supplier เพื่อดูรายละเอียด</Typography>
              </Box>
            </Box>
          ) : (
            <Card>
              <CardContent sx={{ p: 3 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                  <Box>
                    <Typography variant="h6" fontWeight={700}>{selectedSupplier.name}</Typography>
                    <Typography variant="body2" color="text.secondary">{selectedSupplier.baseUrl}</Typography>
                  </Box>
                  <Box display="flex" gap={1}>
                <Button size="small" variant="outlined" startIcon={<Key />} onClick={() => setOpenApiKey(true)}>
                  Add API Key
                </Button>
                <Button size="small" variant="outlined" startIcon={<Add />} onClick={() => setOpenMapping(true)}>
                  Add Mapping
                </Button>
              </Box>
            </Box>

            {/* API Keys */}
            <Accordion defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography fontWeight={600}>API Keys ({(supplierDetail as any)?.apiKeys?.length || 0})</Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ p: 0 }}>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Key Name</TableCell>
                        <TableCell>Environment</TableCell>
                        <TableCell>สถานะ</TableCell>
                        <TableCell>หมดอายุ</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(supplierDetail as any)?.apiKeys?.map((key: any) => (
                            <TableRow key={key.id}>
                              <TableCell><Typography variant="body2" fontWeight={600}>{key.keyName}</Typography></TableCell>
                              <TableCell><Chip label={key.environment} size="small" color={key.environment === 'PRODUCTION' ? 'error' : 'warning'} /></TableCell>
                              <TableCell><StatusChip status={key.status} /></TableCell>
                              <TableCell><Typography variant="caption">{key.expiresAt ? new Date(key.expiresAt).toLocaleDateString('th') : 'ไม่มีวันหมดอายุ'}</Typography></TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </AccordionDetails>
                </Accordion>

                {/* Response Mappings */}
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography fontWeight={600}>Response Mappings ({(supplierDetail as any)?.responseMappings?.length || 0})</Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ p: 0 }}>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Field Name</TableCell>
                        <TableCell>Supplier Field</TableCell>
                        <TableCell>System Field</TableCell>
                        <TableCell>Value Mapping</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(supplierDetail as any)?.responseMappings?.map((m: any) => (
                            <TableRow key={m.id}>
                              <TableCell>{m.fieldName}</TableCell>
                              <TableCell><code>{m.supplierField}</code></TableCell>
                              <TableCell><code>{m.systemField}</code></TableCell>
                              <TableCell>
                                {m.valueMapping ? (
                                  <Box>
                                    {Object.entries(m.valueMapping).map(([k, v]) => (
                                      <Typography key={k} variant="caption" display="block">
                                        {k} → {String(v)}
                                      </Typography>
                                    ))}
                                  </Box>
                                ) : '-'}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </AccordionDetails>
                </Accordion>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>

      {/* Create Supplier Dialog */}
      <Dialog open={openCreate} onClose={() => setOpenCreate(false)} maxWidth="sm" fullWidth>
        <DialogTitle fontWeight={700}>เพิ่ม Supplier ใหม่</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <TextField label="ชื่อ *" fullWidth value={supplierForm.name || ''} onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })} />
            <TextField label="Code * (ตัวพิมพ์ใหญ่)" fullWidth value={supplierForm.code || ''} onChange={(e) => setSupplierForm({ ...supplierForm, code: e.target.value.toUpperCase() })} />
            <TextField label="Base URL *" fullWidth value={supplierForm.baseUrl || ''} onChange={(e) => setSupplierForm({ ...supplierForm, baseUrl: e.target.value })} />
            <TextField label="คำอธิบาย" fullWidth value={supplierForm.description || ''} onChange={(e) => setSupplierForm({ ...supplierForm, description: e.target.value })} />
            <TextField label="Priority (1=สูงสุด)" type="number" fullWidth value={supplierForm.priority || 1} onChange={(e) => setSupplierForm({ ...supplierForm, priority: Number(e.target.value) })} />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenCreate(false)}>ยกเลิก</Button>
          <Button variant="contained" onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>บันทึก</Button>
        </DialogActions>
      </Dialog>

      {/* Add API Key Dialog */}
      <Dialog open={openApiKey} onClose={() => setOpenApiKey(false)} maxWidth="sm" fullWidth>
        <DialogTitle fontWeight={700}>เพิ่ม API Key — {selectedSupplier?.name}</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <TextField label="Key Name * (เช่น Authorization)" fullWidth value={apiKeyForm.keyName} onChange={(e) => setApiKeyForm({ ...apiKeyForm, keyName: e.target.value })} />
            <TextField label="Key Value *" fullWidth value={apiKeyForm.keyValue} onChange={(e) => setApiKeyForm({ ...apiKeyForm, keyValue: e.target.value })} />
            <FormControl fullWidth>
              <InputLabel>Environment</InputLabel>
              <Select value={apiKeyForm.environment} label="Environment" onChange={(e) => setApiKeyForm({ ...apiKeyForm, environment: e.target.value as 'PRODUCTION' | 'UAT' })}>
                <MenuItem value="PRODUCTION">PRODUCTION</MenuItem>
                <MenuItem value="UAT">UAT</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenApiKey(false)}>ยกเลิก</Button>
          <Button variant="contained" onClick={() => addApiKeyMutation.mutate()} disabled={addApiKeyMutation.isPending}>เพิ่ม</Button>
        </DialogActions>
      </Dialog>

      {/* Add Mapping Dialog */}
      <Dialog open={openMapping} onClose={() => setOpenMapping(false)} maxWidth="sm" fullWidth>
        <DialogTitle fontWeight={700}>เพิ่ม Response Mapping — {selectedSupplier?.name}</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <TextField label="Field Name * (เช่น status)" fullWidth value={mappingForm.fieldName} onChange={(e) => setMappingForm({ ...mappingForm, fieldName: e.target.value })} />
            <TextField label="Supplier Field * (field ของ Supplier)" fullWidth value={mappingForm.supplierField} onChange={(e) => setMappingForm({ ...mappingForm, supplierField: e.target.value })} />
            <TextField label="System Field * (field ของระบบเรา)" fullWidth value={mappingForm.systemField} onChange={(e) => setMappingForm({ ...mappingForm, systemField: e.target.value })} />
            <TextField label="คำอธิบาย" fullWidth value={mappingForm.description} onChange={(e) => setMappingForm({ ...mappingForm, description: e.target.value })} />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenMapping(false)}>ยกเลิก</Button>
          <Button variant="contained" onClick={() => addMappingMutation.mutate()} disabled={addMappingMutation.isPending}>เพิ่ม</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
