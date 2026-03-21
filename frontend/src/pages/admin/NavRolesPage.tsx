import {
  Box, Button, Card, CardContent, Checkbox, Dialog, DialogActions, DialogContent,
  DialogTitle, FormControlLabel, FormGroup, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TextField, Typography, IconButton, Tooltip,
} from '@mui/material';
import { Add, Delete, Edit } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { adminApi } from '../../api/admin';
import { PageHeader } from '../../components/common/PageHeader';
import { ADMIN_MENU_KEY_ORDER, type AdminMenuKey } from '../../config/adminMenuKeys';
import toast from 'react-hot-toast';

type NavRoleRow = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  menuKeys: string[];
  isSystem: boolean;
};

export const NavRolesPage = () => {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { data: roles, isLoading } = useQuery({
    queryKey: ['admin-nav-roles'],
    queryFn: () => adminApi.getNavRoles() as Promise<NavRoleRow[]>,
  });

  const [dialog, setDialog] = useState<'create' | 'edit' | null>(null);
  const [editing, setEditing] = useState<NavRoleRow | null>(null);
  const [slug, setSlug] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [keys, setKeys] = useState<Record<string, boolean>>({});

  const openCreate = () => {
    setDialog('create');
    setEditing(null);
    setSlug('');
    setName('');
    setDescription('');
    setKeys({});
  };

  const openEdit = (r: NavRoleRow) => {
    setDialog('edit');
    setEditing(r);
    setSlug(r.slug);
    setName(r.name);
    setDescription(r.description || '');
    const m: Record<string, boolean> = {};
    ADMIN_MENU_KEY_ORDER.forEach((k) => {
      m[k] = r.menuKeys.includes(k);
    });
    setKeys(m);
  };

  const createMut = useMutation({
    mutationFn: () =>
      adminApi.createNavRole({
        slug,
        name,
        description: description || undefined,
        menuKeys: ADMIN_MENU_KEY_ORDER.filter((k) => keys[k]),
      }),
    onSuccess: () => {
      toast.success(t('admin.navRoles.createOk'));
      qc.invalidateQueries({ queryKey: ['admin-nav-roles'] });
      setDialog(null);
    },
    onError: (e: any) => toast.error(e.response?.data?.message || t('admin.navRoles.createFail')),
  });

  const updateMut = useMutation({
    mutationFn: () =>
      adminApi.updateNavRole(editing!.id, {
        name,
        description: description || undefined,
        menuKeys: ADMIN_MENU_KEY_ORDER.filter((k) => keys[k]),
      }),
    onSuccess: () => {
      toast.success(t('admin.navRoles.updateOk'));
      qc.invalidateQueries({ queryKey: ['admin-nav-roles'] });
      setDialog(null);
    },
    onError: (e: any) => toast.error(e.response?.data?.message || t('admin.navRoles.updateFail')),
  });

  const delMut = useMutation({
    mutationFn: (id: string) => adminApi.deleteNavRole(id),
    onSuccess: () => {
      toast.success(t('admin.navRoles.deleteOk'));
      qc.invalidateQueries({ queryKey: ['admin-nav-roles'] });
    },
    onError: (e: any) => toast.error(e.response?.data?.message || t('admin.navRoles.deleteFail')),
  });

  return (
    <Box>
      <PageHeader
        title={t('admin.navRoles.title')}
        subtitle={t('admin.navRoles.subtitle')}
        action={
          <Button variant="contained" startIcon={<Add />} onClick={openCreate}>
            {t('admin.navRoles.create')}
          </Button>
        }
      />

      <AlertInfo />

      <TableContainer component={Paper} sx={{ borderRadius: 2, mt: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>{t('admin.navRoles.nameSlug')}</TableCell>
              <TableCell>{t('admin.navRoles.menus')}</TableCell>
              <TableCell>{t('admin.navRoles.system')}</TableCell>
              <TableCell align="right">{t('admin.navRoles.actions')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={4}>{t('admin.navRoles.loading')}</TableCell></TableRow>
            ) : (
              roles?.map((r) => (
                <TableRow key={r.id} hover>
                  <TableCell>
                    <Typography fontWeight={700}>{r.name}</Typography>
                    <Typography variant="caption" color="text.secondary">{r.slug}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ maxWidth: 360 }}>
                      {r.menuKeys.map((k) => t(`admin.menu.${k}`) || k).join(', ')}
                    </Typography>
                  </TableCell>
                  <TableCell>{r.isSystem ? t('common.yes') : t('common.dash')}</TableCell>
                  <TableCell align="right">
                    <Tooltip title={t('common.edit')}>
                      <IconButton size="small" onClick={() => openEdit(r)}><Edit fontSize="small" /></IconButton>
                    </Tooltip>
                    {!r.isSystem && (
                      <Tooltip title={t('common.delete')}>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => {
                            if (window.confirm(t('admin.navRoles.deleteConfirm'))) delMut.mutate(r.id);
                          }}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={!!dialog} onClose={() => setDialog(null)} maxWidth="sm" fullWidth>
        <DialogTitle>{dialog === 'create' ? t('admin.navRoles.dialogCreate') : t('admin.navRoles.dialogEdit')}</DialogTitle>
        <DialogContent>
          {dialog === 'create' && (
            <TextField
              fullWidth
              label={t('admin.navRoles.slugLabel')}
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              sx={{ mt: 1 }}
              required
            />
          )}
          <TextField
            fullWidth
            label={t('admin.navRoles.displayName')}
            value={name}
            onChange={(e) => setName(e.target.value)}
            sx={{ mt: 2 }}
            required
          />
          <TextField
            fullWidth
            label={t('admin.navRoles.description')}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            sx={{ mt: 2 }}
            multiline
            minRows={2}
          />
          <Typography variant="subtitle2" fontWeight={700} sx={{ mt: 2, mb: 1 }}>
            {t('admin.navRoles.allowedMenus')}
          </Typography>
          <FormGroup>
            {ADMIN_MENU_KEY_ORDER.map((k) => (
              <FormControlLabel
                key={k}
                control={
                  <Checkbox
                    checked={!!keys[k]}
                    onChange={(e) => setKeys((prev) => ({ ...prev, [k]: e.target.checked }))}
                  />
                }
                label={`${t(`admin.menu.${k}`)} (${k})`}
              />
            ))}
          </FormGroup>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialog(null)}>{t('common.cancel')}</Button>
          <Button
            variant="contained"
            disabled={createMut.isPending || updateMut.isPending}
            onClick={() => {
              if (!name.trim()) {
                toast.error(t('admin.navRoles.fillName'));
                return;
              }
              if (dialog === 'create') {
                if (!slug.trim()) {
                  toast.error(t('admin.navRoles.fillSlug'));
                  return;
                }
                createMut.mutate();
              } else {
                updateMut.mutate();
              }
            }}
          >
            {t('common.save')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

function AlertInfo() {
  const { t } = useTranslation();
  return (
    <Card variant="outlined" sx={{ borderRadius: 2 }}>
      <CardContent sx={{ py: 1.5 }}>
        <Typography variant="body2" color="text.secondary">
          <strong>{t('common.note')}:</strong> {t('admin.navRoles.infoNoteRest')}
        </Typography>
      </CardContent>
    </Card>
  );
}
