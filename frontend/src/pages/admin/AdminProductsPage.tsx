import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Typography, Box, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, FormControl, InputLabel, Select, MenuItem, Grid, Chip,
  CircularProgress, Pagination, Switch, FormControlLabel,
} from '@mui/material';
import { Add, Edit } from '@mui/icons-material';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productsApi } from '../../api/products';
import { StatusChip } from '../../components/common/StatusChip';
import { PageHeader } from '../../components/common/PageHeader';
import toast from 'react-hot-toast';

const EMPTY_PRODUCT = {
  categoryId: '',
  name: '',
  description: '',
  imageUrl: '',
  sellingPrice: 0,
  isFeatured: false,
  sortOrder: 0,
};

export const AdminProductsPage = () => {
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>(EMPTY_PRODUCT);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-products', page],
    queryFn: () => productsApi.getProducts({ page, limit: 20 }),
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: productsApi.getCategories,
  });

  const saveMutation = useMutation({
    mutationFn: () =>
      editing
        ? productsApi.updateProduct(editing.id, form)
        : productsApi.createProduct(form),
    onSuccess: () => {
      toast.success(editing ? 'อัปเดตสินค้าสำเร็จ' : 'เพิ่มสินค้าสำเร็จ');
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      setOpen(false);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'เกิดข้อผิดพลาด'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => productsApi.deleteProduct(id),
    onSuccess: () => {
      toast.success('ปิดการขายสินค้าแล้ว');
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    },
  });

  const openCreate = () => { setEditing(null); setForm({ ...EMPTY_PRODUCT }); setOpen(true); };
  const openEdit = (p: any) => {
    setEditing(p);
    setForm({
      ...p,
      sellingPrice: Number(p.sellingPrice),
      imageUrl: p.imageUrl || '',
      description: p.description || '',
    });
    setOpen(true);
  };

  const totalPages = data ? Math.ceil(data.total / 20) : 1;

  return (
    <Box>
      <PageHeader
        title="จัดการสินค้า"
        subtitle={`${data?.total || 0} รายการ`}
        action={
          <Button variant="contained" startIcon={<Add />} onClick={openCreate}>เพิ่มสินค้า</Button>
        }
      />

      <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell width={72} />
              <TableCell>สินค้า</TableCell>
              <TableCell>หมวดหมู่</TableCell>
              <TableCell align="right">ราคา</TableCell>
              <TableCell>สถานะ</TableCell>
              <TableCell>แนะนำ</TableCell>
              <TableCell>จัดการ</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4 }}><CircularProgress /></TableCell></TableRow>
            ) : data?.data?.map((product) => (
              <TableRow key={product.id} hover>
                <TableCell sx={{ py: 0.5 }}>
                  {product.imageUrl ? (
                    <Box
                      component="img"
                      src={product.imageUrl}
                      alt=""
                      sx={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 1 }}
                    />
                  ) : (
                    <Box sx={{ width: 48, height: 48, borderRadius: 1, bgcolor: 'action.hover', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      🎮
                    </Box>
                  )}
                </TableCell>
                <TableCell>
                  <Typography variant="body2" fontWeight={600}>{product.name}</Typography>
                  <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 200, display: 'block' }}>
                    {product.description || '—'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip label={product.category?.name} size="small" />
                </TableCell>
                <TableCell align="right">
                  <Typography fontWeight={700} color="primary.main">
                    ฿{Number(product.sellingPrice).toLocaleString()}
                  </Typography>
                </TableCell>
                <TableCell><StatusChip status={product.status} /></TableCell>
                <TableCell>
                  {product.isFeatured ? <Chip label="แนะนำ" color="warning" size="small" /> : '-'}
                </TableCell>
                <TableCell>
                  <Box display="flex" gap={1}>
                    <Button size="small" startIcon={<Edit fontSize="small" />} onClick={() => openEdit(product)}>แก้ไข</Button>
                    {product.status === 'ACTIVE' && (
                      <Button size="small" color="error" onClick={() => deleteMutation.mutate(product.id)}>ปิด</Button>
                    )}
                  </Box>
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

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle fontWeight={700}>{editing ? 'แก้ไขสินค้า' : 'เพิ่มสินค้าใหม่'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid size={{ xs: 12 }}>
              <FormControl fullWidth>
                <InputLabel>หมวดหมู่ *</InputLabel>
                <Select
                  value={form.categoryId}
                  label="หมวดหมู่ *"
                  onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                >
                  {categories?.map((cat) => (
                    <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField label="ชื่อสินค้า *" fullWidth value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField label="คำอธิบาย" fullWidth multiline rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                label="URL รูปสินค้า (เกม / แพ็กเกจ)"
                placeholder="https://..."
                fullWidth
                value={form.imageUrl}
                onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                helperText="ลิงก์รูปโดยตรง — แสดงในรายการสินค้าและหน้ารายละเอียด"
              />
              {form.imageUrl?.trim().startsWith('http') && (
                <Box
                  component="img"
                  src={form.imageUrl.trim()}
                  alt=""
                  sx={{ mt: 1, maxWidth: '100%', maxHeight: 200, objectFit: 'cover', borderRadius: 1 }}
                />
              )}
            </Grid>
            <Grid size={{ xs: 6 }}>
              <TextField
                label="ราคาขาย (บาท) *"
                type="number"
                fullWidth
                value={form.sellingPrice}
                onChange={(e) => setForm({ ...form, sellingPrice: Number(e.target.value) })}
              />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <TextField
                label="ลำดับการแสดง"
                type="number"
                fullWidth
                value={form.sortOrder}
                onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <FormControlLabel
                control={<Switch checked={form.isFeatured} onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })} color="primary" />}
                label="สินค้าแนะนำ"
              />
            </Grid>
            {editing && (
              <Grid size={{ xs: 12 }}>
                <FormControl fullWidth>
                  <InputLabel>สถานะ</InputLabel>
                  <Select value={form.status} label="สถานะ" onChange={(e) => setForm({ ...form, status: e.target.value })}>
                    <MenuItem value="ACTIVE">ACTIVE</MenuItem>
                    <MenuItem value="INACTIVE">INACTIVE</MenuItem>
                    <MenuItem value="OUT_OF_STOCK">OUT_OF_STOCK</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 0 }}>
          <Button onClick={() => setOpen(false)}>ยกเลิก</Button>
          <Button
            variant="contained"
            disabled={saveMutation.isPending || !form.categoryId || !form.name || !form.sellingPrice}
            onClick={() => saveMutation.mutate()}
          >
            {saveMutation.isPending ? <CircularProgress size={20} color="inherit" /> : 'บันทึก'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
