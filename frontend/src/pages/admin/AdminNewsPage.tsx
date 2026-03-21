import {
  Container, Typography, Button, Table, TableBody, TableCell, TableHead, TableRow,
  TableContainer, Paper, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Switch,
  FormControlLabel, Box, IconButton,
} from '@mui/material';
import { Add, Delete, Edit } from '@mui/icons-material';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { newsApi } from '../../api/news';
import type { NewsArticle } from '../../types';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';

const emptyForm = {
  title: '',
  excerpt: '',
  coverImageUrl: '',
  body: '',
  isPublished: false,
  pinned: false,
};

export const AdminNewsPage = () => {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<NewsArticle | null>(null);
  const [form, setForm] = useState(emptyForm);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-news'],
    queryFn: () => newsApi.adminList({ page: 1, limit: 100 }),
  });

  const saveMut = useMutation({
    mutationFn: () =>
      editing
        ? newsApi.update(editing.id, form)
        : newsApi.create(form),
    onSuccess: () => {
      toast.success(t('common.success'));
      qc.invalidateQueries({ queryKey: ['admin-news'] });
      setOpen(false);
      setEditing(null);
      setForm(emptyForm);
    },
    onError: (e: unknown) => {
      const m = (e as { response?: { data?: { message?: string } } }).response?.data?.message;
      toast.error(typeof m === 'string' ? m : t('common.error'));
    },
  });

  const delMut = useMutation({
    mutationFn: (id: string) => newsApi.remove(id),
    onSuccess: () => {
      toast.success(t('common.success'));
      qc.invalidateQueries({ queryKey: ['admin-news'] });
    },
  });

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const openEdit = (row: NewsArticle) => {
    setEditing(row);
    setForm({
      title: row.title,
      excerpt: row.excerpt || '',
      coverImageUrl: row.coverImageUrl || '',
      body: row.body,
      isPublished: row.isPublished,
      pinned: row.pinned,
    });
    setOpen(true);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5" fontWeight={700}>{t('admin.menu.news')}</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={openCreate}>
          {t('admin.navRoles.create')}
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell width={72} />
              <TableCell>{t('admin.navRoles.displayName')}</TableCell>
              <TableCell>Slug</TableCell>
              <TableCell>Published</TableCell>
              <TableCell></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5}>…</TableCell></TableRow>
            ) : (
              data?.data?.map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell sx={{ py: 0.5 }}>
                    {row.coverImageUrl ? (
                      <Box
                        component="img"
                        src={row.coverImageUrl}
                        alt=""
                        sx={{ width: 56, height: 40, objectFit: 'cover', borderRadius: 1, bgcolor: 'action.hover' }}
                      />
                    ) : (
                      <Box sx={{ width: 56, height: 40, borderRadius: 1, bgcolor: 'action.hover' }} />
                    )}
                  </TableCell>
                  <TableCell>{row.title}</TableCell>
                  <TableCell>{row.slug}</TableCell>
                  <TableCell>{row.isPublished ? dayjs(row.publishedAt).format('DD/MM/YY') : '—'}</TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => openEdit(row)}><Edit fontSize="small" /></IconButton>
                    <IconButton size="small" color="error" onClick={() => {
                      if (window.confirm('Delete?')) delMut.mutate(row.id);
                    }}><Delete fontSize="small" /></IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>{editing ? t('admin.navRoles.dialogEdit') : t('admin.navRoles.dialogCreate')}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField
            label="Title"
            fullWidth
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <TextField
            label="Excerpt"
            fullWidth
            multiline
            minRows={2}
            value={form.excerpt}
            onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
          />
          <TextField
            label={t('admin.news.coverImageUrl')}
            placeholder="https://..."
            fullWidth
            value={form.coverImageUrl}
            onChange={(e) => setForm({ ...form, coverImageUrl: e.target.value })}
            helperText={t('admin.news.coverImageHint')}
          />
          {form.coverImageUrl.trim().startsWith('http') && (
            <Box
              component="img"
              src={form.coverImageUrl.trim()}
              alt=""
              sx={{ maxWidth: '100%', maxHeight: 200, objectFit: 'cover', borderRadius: 1 }}
            />
          )}
          <TextField
            label="Body"
            fullWidth
            multiline
            minRows={8}
            value={form.body}
            onChange={(e) => setForm({ ...form, body: e.target.value })}
          />
          <FormControlLabel
            control={<Switch checked={form.isPublished} onChange={(_, v) => setForm({ ...form, isPublished: v })} />}
            label="Published"
          />
          <FormControlLabel
            control={<Switch checked={form.pinned} onChange={(_, v) => setForm({ ...form, pinned: v })} />}
            label="Pinned"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>{t('common.cancel')}</Button>
          <Button
            variant="contained"
            disabled={!form.title.trim() || !form.body.trim() || saveMut.isPending}
            onClick={() => saveMut.mutate()}
          >
            {t('common.save')}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};
