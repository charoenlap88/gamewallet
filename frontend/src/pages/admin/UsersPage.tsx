import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Typography, Box, Pagination, CircularProgress, TextField,
  InputAdornment, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, Select, MenuItem, FormControl, InputLabel, Avatar,
} from '@mui/material';
import { Search } from '@mui/icons-material';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../api/admin';
import { StatusChip } from '../../components/common/StatusChip';
import { PageHeader } from '../../components/common/PageHeader';
import dayjs from 'dayjs';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../stores/authStore';
import type { User } from '../../types';
import { useAppLocale } from '../../i18n/useAppLocale';

type NavRoleOption = { id: string; slug: string; name: string };

export const UsersPage = () => {
  const { t } = useTranslation();
  const locale = useAppLocale();
  const me = useAuthStore((s) => s.user);
  const updateMe = useAuthStore((s) => s.updateUser);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newStatus, setNewStatus] = useState('');
  const [selectedNavRoleId, setSelectedNavRoleId] = useState<string | null>(null);
  const [savePending, setSavePending] = useState(false);
  const queryClient = useQueryClient();
  const isSuperAdmin = me?.role === 'SUPER_ADMIN';

  const { data: navRoleOptions = [] } = useQuery({
    queryKey: ['admin-nav-roles'],
    queryFn: () => adminApi.getNavRoles() as Promise<NavRoleOption[]>,
    enabled: isSuperAdmin,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', page, search],
    queryFn: () => adminApi.getUsers({ page, limit: 20, search: search || undefined }),
  });

  useEffect(() => {
    if (selectedUser) {
      setNewStatus(selectedUser.status);
      setSelectedNavRoleId(selectedUser.navRole?.id ?? null);
    }
  }, [selectedUser]);

  const totalPages = data ? Math.ceil(data.total / 20) : 1;

  const openManage = (user: User) => {
    setSelectedUser(user);
    setNewStatus(user.status);
    setSelectedNavRoleId(user.navRole?.id ?? null);
  };

  const handleSaveUser = async () => {
    if (!selectedUser) return;
    setSavePending(true);
    try {
      if (newStatus !== selectedUser.status) {
        await adminApi.updateUserStatus(selectedUser.id, newStatus);
      }
      if (isSuperAdmin && selectedUser.role === 'ADMIN') {
        const currentNav = selectedUser.navRole?.id ?? null;
        if (selectedNavRoleId !== currentNav) {
          const r = (await adminApi.updateUserNavRole(
            selectedUser.id,
            selectedNavRoleId,
          )) as {
            navMenuKeys?: string[] | null;
            navRole?: { id: string; name: string; slug: string; menuKeys?: string[] } | null;
          };
          if (me?.id === selectedUser.id && r.navMenuKeys !== undefined) {
            updateMe({
              navMenuKeys: r.navMenuKeys ?? null,
              navRole: r.navRole
                ? { id: r.navRole.id, name: r.navRole.name, slug: r.navRole.slug }
                : null,
            });
          }
        }
      }
      toast.success(t('admin.users.saveSuccess'));
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setSelectedUser(null);
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        t('common.error');
      toast.error(msg);
    } finally {
      setSavePending(false);
    }
  };

  return (
    <Box>
      <PageHeader
        title={t('admin.users.title')}
        subtitle={t('admin.users.subtitle', { count: data?.total || 0 })}
      />

      <Box display="flex" gap={2} mb={3}>
        <TextField
          placeholder={t('admin.users.searchPlaceholder')}
          size="small"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          sx={{ minWidth: 300 }}
          InputProps={{
            startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment>,
          }}
        />
      </Box>

      <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>{t('admin.users.user')}</TableCell>
              <TableCell>{t('admin.users.username')}</TableCell>
              <TableCell>{t('admin.users.phone')}</TableCell>
              <TableCell>{t('admin.users.role')}</TableCell>
              <TableCell>{t('admin.users.navPack')}</TableCell>
              <TableCell>{t('admin.users.balance')}</TableCell>
              <TableCell>{t('admin.users.status')}</TableCell>
              <TableCell>{t('admin.users.joined')}</TableCell>
              <TableCell>{t('admin.users.actions')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={9} align="center" sx={{ py: 4 }}><CircularProgress /></TableCell></TableRow>
            ) : data?.data?.map((user) => (
              <TableRow key={user.id} hover>
                <TableCell>
                  <Box display="flex" alignItems="center" gap={1.5}>
                    <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: 13 }}>
                      {user.username.charAt(0).toUpperCase()}
                    </Avatar>
                    <Box>
                      <Typography variant="body2" fontWeight={600}>{user.fullName || '-'}</Typography>
                      <Typography variant="caption" color="text.secondary">{user.email}</Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>{user.username}</TableCell>
                <TableCell>{user.phone || '-'}</TableCell>
                <TableCell>
                  <StatusChip status={user.role} />
                </TableCell>
                <TableCell>
                  {user.role === 'ADMIN' ? (
                    <Typography variant="body2">
                      {user.navRole?.name ?? t('admin.users.navPackFull')}
                    </Typography>
                  ) : (
                    <Typography variant="body2" color="text.secondary">—</Typography>
                  )}
                </TableCell>
                <TableCell>
                  ฿{Number((user as any).wallet?.balance || 0).toLocaleString(locale, { minimumFractionDigits: 2 })}
                </TableCell>
                <TableCell><StatusChip status={user.status} /></TableCell>
                <TableCell>
                  <Typography variant="caption">{dayjs(user.createdAt).format('DD/MM/YY')}</Typography>
                </TableCell>
                <TableCell>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => openManage(user)}
                  >
                    {t('common.manage')}
                  </Button>
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

      {/* Edit Dialog */}
      <Dialog
        open={!!selectedUser}
        onClose={() => setSelectedUser(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle fontWeight={700}>
          {selectedUser && t('admin.users.dialogTitle', { username: selectedUser.username })}
        </DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 1 }}>
            <InputLabel>{t('admin.users.accountStatus')}</InputLabel>
            <Select value={newStatus} label={t('admin.users.accountStatus')} onChange={(e) => setNewStatus(e.target.value)}>
              <MenuItem value="ACTIVE">ACTIVE</MenuItem>
              <MenuItem value="SUSPENDED">SUSPENDED</MenuItem>
              <MenuItem value="INACTIVE">INACTIVE</MenuItem>
            </Select>
          </FormControl>
          {isSuperAdmin && selectedUser?.role === 'ADMIN' && (
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>{t('admin.users.navPackLabel')}</InputLabel>
              <Select
                value={selectedNavRoleId ?? ''}
                label={t('admin.users.navPackLabel')}
                onChange={(e) =>
                  setSelectedNavRoleId(e.target.value === '' ? null : e.target.value)
                }
              >
                <MenuItem value="">{t('admin.users.adminMenuSelectFull')}</MenuItem>
                {navRoleOptions.map((r) => (
                  <MenuItem key={r.id} value={r.id}>
                    {r.name} ({r.slug})
                  </MenuItem>
                ))}
              </Select>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                {t('admin.users.navPackHint')}
              </Typography>
            </FormControl>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setSelectedUser(null)}>{t('common.cancel')}</Button>
          <Button
            variant="contained"
            disabled={savePending}
            onClick={() => handleSaveUser()}
          >
            {t('common.save')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
