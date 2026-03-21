import {
  Box, Card, CardContent, Typography, Button, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Grid, Switch, FormControlLabel,
  CircularProgress, IconButton, Chip,
} from '@mui/material';
import { Add, Edit, Category } from '@mui/icons-material';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productsApi } from '../../api/products';
import { PageHeader } from '../../components/common/PageHeader';
import toast from 'react-hot-toast';

const EMPTY_FORM = { name: '', description: '', imageUrl: '', isActive: true, sortOrder: 0 };

export const CategoriesPage = () => {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>(EMPTY_FORM);
  const queryClient = useQueryClient();

  const { data: categories, isLoading } = useQuery({
    queryKey: ['categories-admin'],
    queryFn: () =>
      productsApi.getCategories().then((cats) =>
        cats.map((c) => ({ ...c }))
      ),
  });

  const saveMutation = useMutation({
    mutationFn: () =>
      editing
        ? productsApi.updateCategory(editing.id, form)
        : productsApi.createCategory(form),
    onSuccess: () => {
      toast.success(editing ? 'อัปเดตหมวดหมู่สำเร็จ' : 'เพิ่มหมวดหมู่สำเร็จ');
      queryClient.invalidateQueries({ queryKey: ['categories-admin'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setOpen(false);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'เกิดข้อผิดพลาด'),
  });

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setOpen(true);
  };

  const openEdit = (cat: any) => {
    setEditing(cat);
    setForm({
      name: cat.name,
      description: cat.description || '',
      imageUrl: cat.imageUrl || '',
      isActive: cat.isActive,
      sortOrder: cat.sortOrder,
    });
    setOpen(true);
  };

  const CATEGORY_ICONS: Record<string, string> = {
    'Mobile Games': '📱', 'PC Games': '💻', 'Console Games': '🎮',
    'Gift Cards': '🎁', 'Streaming': '📺',
  };

  return (
    <Box>
      <PageHeader
        title="หมวดหมู่สินค้า"
        subtitle={`${categories?.length || 0} หมวดหมู่`}
        action={
          <Button variant="contained" startIcon={<Add />} onClick={openCreate}>
            เพิ่มหมวดหมู่
          </Button>
        }
      />

      {isLoading ? (
        <Box display="flex" justifyContent="center" py={6}><CircularProgress /></Box>
      ) : (
        <Grid container spacing={2.5}>
          {categories?.map((cat) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={cat.id}>
              <Card>
                <CardContent sx={{ p: 3 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                    <Box display="flex" alignItems="center" gap={1.5}>
                      <Box sx={{
                        width: 48, height: 48, borderRadius: 2, bgcolor: 'primary.50',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 24, overflow: 'hidden',
                      }}>
                        {cat.imageUrl ? (
                          <Box
                            component="img"
                            src={cat.imageUrl}
                            alt=""
                            sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          CATEGORY_ICONS[cat.name] || '🎮'
                        )}
                      </Box>
                      <Box>
                        <Typography variant="subtitle1" fontWeight={700}>{cat.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {cat._count?.products || 0} สินค้า
                        </Typography>
                      </Box>
                    </Box>
                    <IconButton size="small" onClick={() => openEdit(cat)}>
                      <Edit fontSize="small" />
                    </IconButton>
                  </Box>

                  {cat.description && (
                    <Typography variant="body2" color="text.secondary" mt={1.5} mb={1}>
                      {cat.description}
                    </Typography>
                  )}

                  <Box display="flex" justifyContent="space-between" alignItems="center" mt={1.5}>
                    <Chip
                      label={cat.isActive ? 'ใช้งาน' : 'ปิดใช้งาน'}
                      color={cat.isActive ? 'success' : 'default'}
                      size="small"
                    />
                    <Typography variant="caption" color="text.secondary">
                      ลำดับ: {cat.sortOrder}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}

          {categories?.length === 0 && (
            <Grid size={{ xs: 12 }}>
              <Box textAlign="center" py={8} color="text.secondary">
                <Category sx={{ fontSize: 56, opacity: 0.3, mb: 2 }} />
                <Typography>ยังไม่มีหมวดหมู่ กด "เพิ่มหมวดหมู่" เพื่อเริ่มต้น</Typography>
              </Box>
            </Grid>
          )}
        </Grid>
      )}

      {/* Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle fontWeight={700}>{editing ? 'แก้ไขหมวดหมู่' : 'เพิ่มหมวดหมู่ใหม่'}</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <TextField
              label="ชื่อหมวดหมู่ *"
              fullWidth
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <TextField
              label="คำอธิบาย"
              fullWidth
              multiline
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
            <TextField
              label="URL รูปหมวดหมู่"
              placeholder="https://..."
              fullWidth
              value={form.imageUrl}
              onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
              helperText="วางลิงก์รูปโดยตรง (เช่น Unsplash, CDN) — แสดงแทนไอคอนในหน้าร้าน"
            />
            {form.imageUrl?.trim().startsWith('http') && (
              <Box
                component="img"
                src={form.imageUrl.trim()}
                alt=""
                sx={{ maxWidth: '100%', maxHeight: 160, objectFit: 'cover', borderRadius: 1 }}
              />
            )}
            <TextField
              label="ลำดับการแสดง (ต่ำ = แสดงก่อน)"
              type="number"
              fullWidth
              value={form.sortOrder}
              onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  color="primary"
                />
              }
              label="เปิดใช้งาน"
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 0 }}>
          <Button onClick={() => setOpen(false)}>ยกเลิก</Button>
          <Button
            variant="contained"
            disabled={saveMutation.isPending || !form.name}
            onClick={() => saveMutation.mutate()}
          >
            {saveMutation.isPending ? <CircularProgress size={20} color="inherit" /> : 'บันทึก'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
