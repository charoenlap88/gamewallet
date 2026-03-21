import {
  Container, Grid, Card, CardContent, Typography, Box, Button,
  TextField, Avatar, Divider, Alert, CircularProgress, Chip,
} from '@mui/material';
import { Person, Email, Phone, Edit, Save, Cancel, Lock, Security } from '@mui/icons-material';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../stores/authStore';
import { apiClient, extractData } from '../../api/client';
import { authApi } from '../../api/auth';
import { walletApi } from '../../api/wallet';
import { StatusChip } from '../../components/common/StatusChip';
import { PageHeader } from '../../components/common/PageHeader';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';
import { useMoneyDisplay } from '../../hooks/useMoneyDisplay';
import { Money } from '../../components/Money';

export const ProfilePage = () => {
  const { t } = useTranslation();
  const { user, updateUser } = useAuthStore();
  const queryClient = useQueryClient();
  const { format: formatMoney } = useMoneyDisplay();
  const [editing, setEditing] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [form, setForm] = useState({
    fullName: user?.fullName || '',
    phone: user?.phone || '',
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [totpSetupData, setTotpSetupData] = useState<{ secret: string; otpauthUrl: string } | null>(null);
  const [totpEnableCode, setTotpEnableCode] = useState('');
  const [emailEnablePassword, setEmailEnablePassword] = useState('');
  const [emailEnableCode, setEmailEnableCode] = useState('');
  const [emailEnableStep, setEmailEnableStep] = useState<'idle' | 'sent'>('idle');
  const [disablePassword, setDisablePassword] = useState('');
  const [disableCode, setDisableCode] = useState('');

  const refreshProfile = async () => {
    const u = await authApi.getProfile();
    updateUser(u);
  };

  const totpSetupMutation = useMutation({
    mutationFn: () => authApi.totpSetup(),
    onSuccess: (data) => {
      setTotpSetupData(data);
      setTotpEnableCode('');
      toast.success(t('auth.twoFaTotpReady'));
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'TOTP setup failed'),
  });

  const totpEnableMutation = useMutation({
    mutationFn: (code: string) => authApi.totpEnable(code),
    onSuccess: async () => {
      toast.success('2FA (TOTP) enabled');
      setTotpSetupData(null);
      setTotpEnableCode('');
      await refreshProfile();
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Invalid code'),
  });

  const emailRequestMutation = useMutation({
    mutationFn: (password: string) => authApi.emailRequestEnable(password),
    onSuccess: () => {
      toast.success(t('auth.twoFaEmailSent'));
      setEmailEnableStep('sent');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Request failed'),
  });

  const emailConfirmMutation = useMutation({
    mutationFn: (code: string) => authApi.emailConfirmEnable(code),
    onSuccess: async () => {
      toast.success('Email 2FA enabled');
      setEmailEnableCode('');
      setEmailEnablePassword('');
      setEmailEnableStep('idle');
      await refreshProfile();
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Invalid code'),
  });

  const sendDisableEmailMutation = useMutation({
    mutationFn: () => authApi.sendDisable2faEmail(),
    onSuccess: () => toast.success(t('auth.twoFaCheckEmail')),
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed'),
  });

  const disable2faMutation = useMutation({
    mutationFn: ({ password, code }: { password: string; code: string }) =>
      authApi.disable2fa(password, code),
    onSuccess: async () => {
      toast.success('2FA disabled');
      setDisablePassword('');
      setDisableCode('');
      await refreshProfile();
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed'),
  });

  const twoFa = user?.twoFactorMethod || 'NONE';

  const { data: wallet } = useQuery({
    queryKey: ['wallet-balance'],
    queryFn: walletApi.getBalance,
  });

  const { data: txData } = useQuery({
    queryKey: ['wallet-transactions', 1],
    queryFn: () => walletApi.getTransactions({ page: 1, limit: 5 }),
  });

  const updateProfileMutation = useMutation({
    mutationFn: (data: { fullName?: string; phone?: string }) =>
      apiClient.patch('/users/me', data).then(extractData),
    onSuccess: (updatedUser: any) => {
      updateUser(updatedUser);
      toast.success('อัปเดตโปรไฟล์สำเร็จ');
      setEditing(false);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'เกิดข้อผิดพลาด'),
  });

  const changePasswordMutation = useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) =>
      apiClient.patch('/auth/change-password', data).then(extractData),
    onSuccess: () => {
      toast.success('เปลี่ยนรหัสผ่านสำเร็จ');
      setChangingPassword(false);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'รหัสผ่านปัจจุบันไม่ถูกต้อง'),
  });

  const handleSaveProfile = () => {
    updateProfileMutation.mutate({
      fullName: form.fullName || undefined,
      phone: form.phone || undefined,
    });
  };

  const handleChangePassword = () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('รหัสผ่านใหม่ไม่ตรงกัน');
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      toast.error('รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร');
      return;
    }
    changePasswordMutation.mutate({
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword,
    });
  };

  const roleLabel: Record<string, string> = {
    CUSTOMER: 'ลูกค้า',
    ADMIN: 'ผู้ดูแล',
    SUPER_ADMIN: 'ผู้ดูแลระดับสูง',
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <PageHeader title="โปรไฟล์ของฉัน" subtitle="จัดการข้อมูลส่วนตัวและความปลอดภัย" />

      <Grid container spacing={3}>
        {/* Left: Profile Card */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent sx={{ p: 3, textAlign: 'center' }}>
              <Avatar
                sx={{
                  width: 88, height: 88, mx: 'auto', mb: 2,
                  bgcolor: 'primary.main', fontSize: 36, fontWeight: 700,
                }}
              >
                {user?.username?.charAt(0).toUpperCase()}
              </Avatar>
              <Typography variant="h6" fontWeight={700}>{user?.fullName || user?.username}</Typography>
              <Typography variant="body2" color="text.secondary" mb={1}>{user?.email}</Typography>
              <Chip
                label={roleLabel[user?.role || ''] || user?.role}
                color="primary"
                size="small"
                sx={{ mb: 2 }}
              />
              <Divider sx={{ my: 2 }} />
              <Box textAlign="left">
                <Typography variant="caption" color="text.secondary" display="block" mb={1.5}>ข้อมูลบัญชี</Typography>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2" color="text.secondary">สมัครเมื่อ</Typography>
                  <Typography variant="body2">{dayjs(user?.createdAt).format('DD/MM/YYYY')}</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2" color="text.secondary">สถานะ</Typography>
                  <StatusChip status={user?.status || 'ACTIVE'} />
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">กระเป๋าเงิน</Typography>
                  <Money
                    amount={Number(wallet?.balance || 0)}
                    variant="body2"
                    fontWeight={700}
                    color="primary"
                    component="span"
                  />
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Recent Transactions Mini */}
          <Card sx={{ mt: 2 }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="subtitle2" fontWeight={700} mb={1.5}>รายการล่าสุด</Typography>
              {txData?.data?.slice(0, 4).map((tx) => (
                <Box key={tx.id} display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Box>
                    <StatusChip status={tx.type} size="small" />
                    <Typography variant="caption" color="text.secondary" display="block">
                      {dayjs(tx.createdAt).format('DD/MM HH:mm')}
                    </Typography>
                  </Box>
                  <Typography
                    variant="body2"
                    fontWeight={700}
                    color={tx.type === 'TOPUP' ? 'success.main' : 'error.main'}
                    component="span"
                  >
                    {tx.type === 'TOPUP' ? '+' : '-'}
                    {formatMoney(Number(tx.amount))}
                  </Typography>
                </Box>
              ))}
              {(!txData?.data || txData.data.length === 0) && (
                <Typography variant="body2" color="text.secondary">ยังไม่มีรายการ</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Right: Edit Forms */}
        <Grid size={{ xs: 12, md: 8 }}>
          {/* Profile Info */}
          <Card sx={{ mb: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2.5}>
                <Typography variant="h6" fontWeight={700}>ข้อมูลส่วนตัว</Typography>
                {!editing ? (
                  <Button
                    variant="outlined"
                    startIcon={<Edit />}
                    size="small"
                    onClick={() => {
                      setForm({ fullName: user?.fullName || '', phone: user?.phone || '' });
                      setEditing(true);
                    }}
                  >
                    แก้ไข
                  </Button>
                ) : (
                  <Box display="flex" gap={1}>
                    <Button
                      variant="outlined"
                      startIcon={<Cancel />}
                      size="small"
                      onClick={() => setEditing(false)}
                    >
                      ยกเลิก
                    </Button>
                    <Button
                      variant="contained"
                      startIcon={updateProfileMutation.isPending ? <CircularProgress size={14} color="inherit" /> : <Save />}
                      size="small"
                      onClick={handleSaveProfile}
                      disabled={updateProfileMutation.isPending}
                    >
                      บันทึก
                    </Button>
                  </Box>
                )}
              </Box>

              <Grid container spacing={2.5}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    label="Username"
                    value={user?.username || ''}
                    disabled
                    fullWidth
                    InputProps={{ startAdornment: <Box mr={1}><Person color="disabled" fontSize="small" /></Box> }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    label="อีเมล"
                    value={user?.email || ''}
                    disabled
                    fullWidth
                    InputProps={{ startAdornment: <Box mr={1}><Email color="disabled" fontSize="small" /></Box> }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    label="ชื่อ-นามสกุล"
                    value={editing ? form.fullName : (user?.fullName || '-')}
                    onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                    disabled={!editing}
                    fullWidth
                    InputProps={{ startAdornment: <Box mr={1}><Person color={editing ? 'action' : 'disabled'} fontSize="small" /></Box> }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    label="เบอร์โทรศัพท์"
                    value={editing ? form.phone : (user?.phone || '-')}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    disabled={!editing}
                    fullWidth
                    InputProps={{ startAdornment: <Box mr={1}><Phone color={editing ? 'action' : 'disabled'} fontSize="small" /></Box> }}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Change Password */}
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2.5}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Lock color="action" />
                  <Typography variant="h6" fontWeight={700}>เปลี่ยนรหัสผ่าน</Typography>
                </Box>
                {!changingPassword && (
                  <Button
                    variant="outlined"
                    size="small"
                    color="warning"
                    onClick={() => setChangingPassword(true)}
                  >
                    เปลี่ยนรหัสผ่าน
                  </Button>
                )}
              </Box>

              {changingPassword ? (
                <Box display="flex" flexDirection="column" gap={2}>
                  <TextField
                    label="รหัสผ่านปัจจุบัน"
                    type="password"
                    fullWidth
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  />
                  <TextField
                    label="รหัสผ่านใหม่ (อย่างน้อย 8 ตัวอักษร)"
                    type="password"
                    fullWidth
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  />
                  <TextField
                    label="ยืนยันรหัสผ่านใหม่"
                    type="password"
                    fullWidth
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    error={!!passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword}
                    helperText={
                      passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword
                        ? 'รหัสผ่านไม่ตรงกัน'
                        : ''
                    }
                  />
                  <Box display="flex" gap={1} justifyContent="flex-end">
                    <Button
                      variant="outlined"
                      onClick={() => {
                        setChangingPassword(false);
                        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                      }}
                    >
                      ยกเลิก
                    </Button>
                    <Button
                      variant="contained"
                      color="warning"
                      disabled={changePasswordMutation.isPending || !passwordForm.currentPassword || !passwordForm.newPassword}
                      onClick={handleChangePassword}
                    >
                      {changePasswordMutation.isPending ? <CircularProgress size={20} color="inherit" /> : 'ยืนยันเปลี่ยนรหัสผ่าน'}
                    </Button>
                  </Box>
                </Box>
              ) : (
                <Alert severity="info" sx={{ borderRadius: 2 }}>
                  รหัสผ่านของคุณได้รับการตั้งค่าแล้ว กด "เปลี่ยนรหัสผ่าน" เพื่อเปลี่ยนรหัสผ่านใหม่
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Two-factor authentication */}
          <Card sx={{ mt: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <Security color="action" />
                <Typography variant="h6" fontWeight={700}>{t('auth.securityTitle')}</Typography>
              </Box>
              <Box display="flex" alignItems="center" gap={1} mb={2} flexWrap="wrap">
                <Typography variant="body2" color="text.secondary">{t('auth.twoFaStatus')}:</Typography>
                <Chip
                  size="small"
                  label={
                    twoFa === 'NONE'
                      ? t('auth.twoFaNone')
                      : twoFa === 'TOTP'
                        ? t('auth.twoFaTotpLabel')
                        : t('auth.twoFaEmailLabel')
                  }
                  color={twoFa === 'NONE' ? 'default' : 'success'}
                />
              </Box>

              {twoFa === 'NONE' && (
                <Box display="flex" flexDirection="column" gap={2}>
                  <Typography variant="subtitle2" fontWeight={700}>{t('auth.twoFaSetupTotp')}</Typography>
                  {!totpSetupData ? (
                    <Button
                      variant="outlined"
                      size="small"
                      disabled={totpSetupMutation.isPending}
                      onClick={() => totpSetupMutation.mutate()}
                    >
                      {totpSetupMutation.isPending ? <CircularProgress size={18} /> : t('auth.twoFaSetupTotp')}
                    </Button>
                  ) : (
                    <Box display="flex" flexDirection="column" gap={1.5}>
                      <Alert severity="info">{t('auth.twoFaSecretHint')}</Alert>
                      <TextField
                        label="otpauth URL"
                        value={totpSetupData.otpauthUrl}
                        fullWidth
                        multiline
                        minRows={2}
                        InputProps={{ readOnly: true }}
                        size="small"
                      />
                      <TextField
                        label={t('auth.twoFaEnable')}
                        value={totpEnableCode}
                        onChange={(e) => setTotpEnableCode(e.target.value.replace(/\D/g, '').slice(0, 8))}
                        fullWidth
                        size="small"
                      />
                      <Box display="flex" gap={1} flexWrap="wrap">
                        <Button
                          variant="contained"
                          size="small"
                          disabled={totpEnableMutation.isPending || totpEnableCode.length < 6}
                          onClick={() => totpEnableMutation.mutate(totpEnableCode)}
                        >
                          {totpEnableMutation.isPending ? <CircularProgress size={18} color="inherit" /> : t('common.confirm')}
                        </Button>
                        <Button variant="text" size="small" onClick={() => setTotpSetupData(null)}>
                          {t('common.cancel')}
                        </Button>
                      </Box>
                    </Box>
                  )}

                  <Divider sx={{ my: 1 }} />

                  <Typography variant="subtitle2" fontWeight={700}>{t('auth.twoFaSetupEmail')}</Typography>
                  {!user?.hasPassword ? (
                    <Alert severity="warning">{t('auth.twoFaNeedPassword')}</Alert>
                  ) : (
                    <>
                      {emailEnableStep === 'idle' && (
                        <Box display="flex" flexDirection="column" gap={1.5} maxWidth={400}>
                          <TextField
                            type="password"
                            label={t('auth.twoFaEmailPassword')}
                            value={emailEnablePassword}
                            onChange={(e) => setEmailEnablePassword(e.target.value)}
                            fullWidth
                            size="small"
                          />
                          <Button
                            variant="outlined"
                            size="small"
                            disabled={emailRequestMutation.isPending || !emailEnablePassword}
                            onClick={() => emailRequestMutation.mutate(emailEnablePassword)}
                          >
                            {emailRequestMutation.isPending ? <CircularProgress size={18} /> : t('auth.twoFaEmailSendRequest')}
                          </Button>
                        </Box>
                      )}
                      {emailEnableStep === 'sent' && (
                        <Box display="flex" flexDirection="column" gap={1.5} maxWidth={400}>
                          <Alert severity="success">{t('auth.twoFaEmailSent')}</Alert>
                          <TextField
                            label={t('auth.twoFaEmailConfirm')}
                            value={emailEnableCode}
                            onChange={(e) => setEmailEnableCode(e.target.value.replace(/\D/g, '').slice(0, 8))}
                            fullWidth
                            size="small"
                          />
                          <Box display="flex" gap={1}>
                            <Button
                              variant="contained"
                              size="small"
                              disabled={emailConfirmMutation.isPending || emailEnableCode.length < 6}
                              onClick={() => emailConfirmMutation.mutate(emailEnableCode)}
                            >
                              {t('common.confirm')}
                            </Button>
                            <Button variant="text" size="small" onClick={() => { setEmailEnableStep('idle'); setEmailEnableCode(''); }}>
                              {t('common.cancel')}
                            </Button>
                          </Box>
                        </Box>
                      )}
                    </>
                  )}
                </Box>
              )}

              {twoFa !== 'NONE' && (
                <Box display="flex" flexDirection="column" gap={2} maxWidth={480}>
                  <Typography variant="body2" color="text.secondary">{t('auth.twoFaDisableHint')}</Typography>
                  {twoFa === 'EMAIL' && (
                    <Button
                      variant="outlined"
                      size="small"
                      disabled={sendDisableEmailMutation.isPending}
                      onClick={() => sendDisableEmailMutation.mutate()}
                    >
                      {t('auth.twoFaSendDisableEmail')}
                    </Button>
                  )}
                  <TextField
                    type="password"
                    label={t('auth.password')}
                    value={disablePassword}
                    onChange={(e) => setDisablePassword(e.target.value)}
                    fullWidth
                    size="small"
                  />
                  <TextField
                    label={t('auth.twoFaCode')}
                    value={disableCode}
                    onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, '').slice(0, 8))}
                    fullWidth
                    size="small"
                    helperText={twoFa === 'TOTP' ? t('auth.twoFaTotpHint') : t('auth.twoFaEmailHint')}
                  />
                  <Button
                    variant="contained"
                    color="warning"
                    size="small"
                    disabled={disable2faMutation.isPending || !disablePassword || disableCode.length < 6}
                    onClick={() =>
                      disable2faMutation.mutate({ password: disablePassword, code: disableCode })
                    }
                  >
                    {disable2faMutation.isPending ? <CircularProgress size={20} color="inherit" /> : t('auth.twoFaDisable')}
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};
