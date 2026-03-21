import {
  Box, Card, CardContent, TextField, Button, Typography,
  InputAdornment, IconButton, Divider, CircularProgress, Alert,
} from '@mui/material';
import { Email, Lock, Visibility, VisibilityOff, Receipt, Security } from '@mui/icons-material';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../stores/authStore';
import { authApi, isLoginRequires2fa } from '../../api/auth';
import toast from 'react-hot-toast';
import { LanguageSwitcher } from '../../components/LanguageSwitcher';
import { GoogleSignInButton, isGoogleAuthConfigured } from '../../components/GoogleSignInButton';
import type { User } from '../../types';

export const LoginPage = () => {
  const { t } = useTranslation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'credentials' | '2fa'>('credentials');
  const [pendingToken, setPendingToken] = useState('');
  const [twoFactorMethod, setTwoFactorMethod] = useState<'TOTP' | 'EMAIL' | null>(null);
  const [otpCode, setOtpCode] = useState('');
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const navigateAfterAuth = (user: User) => {
    if (user.role === 'AGENT') navigate('/agent');
    else if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') navigate('/admin/dashboard');
    else navigate('/');
  };

  const handleGoogleCredential = async (idToken: string) => {
    setError('');
    setLoading(true);
    try {
      const res = await authApi.googleAuth({ idToken });
      if (isLoginRequires2fa(res)) {
        setPendingToken(res.pendingToken);
        setTwoFactorMethod(res.twoFactorMethod);
        setStep('2fa');
        setOtpCode('');
        if (res.twoFactorMethod === 'EMAIL') {
          toast.success(t('auth.twoFaCheckEmail'));
        }
        return;
      }
      setAuth(res.user, res.token);
      toast.success(t('auth.welcome', { name: res.user.fullName || res.user.username }));
      navigateAfterAuth(res.user);
    } catch (err: unknown) {
      const data = (err as { response?: { data?: { message?: string | string[] } } }).response?.data;
      const msg =
        typeof data?.message === 'string'
          ? data.message
          : Array.isArray(data?.message)
            ? data.message.join(', ')
            : t('auth.googleError');
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await authApi.login(form);
      if (isLoginRequires2fa(res)) {
        setPendingToken(res.pendingToken);
        setTwoFactorMethod(res.twoFactorMethod);
        setStep('2fa');
        setOtpCode('');
        if (res.twoFactorMethod === 'EMAIL') {
          toast.success(t('auth.twoFaCheckEmail'));
        }
        return;
      }
      setAuth(res.user, res.token);
      toast.success(t('auth.welcome', { name: res.user.fullName || res.user.username }));
      navigateAfterAuth(res.user);
    } catch (err: unknown) {
      const data = (err as { response?: { data?: { message?: string | string[] } }; code?: string }).response?.data;
      let msg: string =
        typeof data?.message === 'string'
          ? data.message
          : Array.isArray(data?.message)
            ? data.message.join(', ')
            : '';
      const code = (err as { code?: string }).code;
      if (!msg && code === 'ERR_NETWORK') {
        msg = t('auth.networkError');
      }
      setError(msg || t('auth.invalidCredentials'));
    } finally {
      setLoading(false);
    }
  };

  const handle2faSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await authApi.complete2fa({ pendingToken, code: otpCode.trim() });
      setAuth(res.user, res.token);
      toast.success(t('auth.welcome', { name: res.user.fullName || res.user.username }));
      navigateAfterAuth(res.user);
    } catch (err: unknown) {
      const data = (err as { response?: { data?: { message?: string | string[] } } }).response?.data;
      const msg =
        typeof data?.message === 'string'
          ? data.message
          : Array.isArray(data?.message)
            ? data.message.join(', ')
            : t('auth.twoFaInvalid');
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResendEmail = async () => {
    setError('');
    setLoading(true);
    try {
      await authApi.resendEmail2fa(pendingToken);
      toast.success(t('auth.twoFaResent'));
    } catch (err: unknown) {
      const data = (err as { response?: { data?: { message?: string } } }).response?.data;
      setError(typeof data?.message === 'string' ? data.message : t('auth.twoFaResendFail'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(145deg, #0D0D0D 0%, #1A0A0C 35%, #5C0F1A 70%, #C41E3A 100%)',
        p: 2,
        position: 'relative',
      }}
    >
      <Box sx={{ position: 'absolute', top: 16, right: 16, zIndex: 2 }}>
        <LanguageSwitcher dark />
      </Box>
      <Card sx={{ width: '100%', maxWidth: 420, borderRadius: 3 }}>
        <CardContent sx={{ p: 4 }}>
          <Box textAlign="center" mb={3}>
            <Box sx={{
              width: 56, height: 56, borderRadius: 3, bgcolor: 'primary.main',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              mx: 'auto', mb: 2,
            }}>
              {step === '2fa' ? (
                <Security sx={{ color: 'white', fontSize: 30 }} />
              ) : (
                <Receipt sx={{ color: 'white', fontSize: 30 }} />
              )}
            </Box>
            <Typography variant="h5" fontWeight={800} color="primary.main">{t('app.brand')}</Typography>
            <Typography variant="body2" color="text.secondary" mt={0.5}>
              {step === '2fa' ? t('auth.twoFaTitle') : t('auth.loginSubtitle')}
            </Typography>
          </Box>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          {step === '2fa' ? (
            <Box component="form" onSubmit={handle2faSubmit} display="flex" flexDirection="column" gap={2}>
              <Typography variant="body2" color="text.secondary">
                {twoFactorMethod === 'EMAIL'
                  ? t('auth.twoFaEmailHint')
                  : t('auth.twoFaTotpHint')}
              </Typography>
              <TextField
                label={t('auth.twoFaCode')}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 8))}
                required
                fullWidth
                autoFocus
                inputProps={{ inputMode: 'numeric', maxLength: 8 }}
              />
              <Button
                type="submit"
                variant="contained"
                fullWidth
                size="large"
                disabled={loading || otpCode.length < 6}
                sx={{ py: 1.5, fontWeight: 700 }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : t('auth.twoFaConfirm')}
              </Button>
              {twoFactorMethod === 'EMAIL' && (
                <Button type="button" variant="text" onClick={handleResendEmail} disabled={loading}>
                  {t('auth.twoFaResend')}
                </Button>
              )}
              <Button
                type="button"
                variant="outlined"
                fullWidth
                onClick={() => {
                  setStep('credentials');
                  setPendingToken('');
                  setOtpCode('');
                  setError('');
                }}
              >
                {t('auth.twoFaBack')}
              </Button>
            </Box>
          ) : (
            <>
              <Box component="form" onSubmit={handleSubmit} display="flex" flexDirection="column" gap={2.5}>
                <TextField
                  label={t('auth.email')}
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                  fullWidth
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start"><Email color="action" fontSize="small" /></InputAdornment>
                    ),
                  }}
                />
                <TextField
                  label={t('auth.password')}
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  fullWidth
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start"><Lock color="action" fontSize="small" /></InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton size="small" onClick={() => setShowPassword(!showPassword)}>
                          {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  size="large"
                  disabled={loading}
                  sx={{ py: 1.5, fontWeight: 700 }}
                >
                  {loading ? <CircularProgress size={24} color="inherit" /> : t('common.login')}
                </Button>
              </Box>

              {isGoogleAuthConfigured() && (
                <>
                  <Box display="flex" alignItems="center" gap={1.5} sx={{ my: 2.5 }}>
                    <Divider sx={{ flex: 1 }} />
                    <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
                      {t('auth.orContinueWith')}
                    </Typography>
                    <Divider sx={{ flex: 1 }} />
                  </Box>
                  <Box sx={{ mb: 1, opacity: loading ? 0.6 : 1, pointerEvents: loading ? 'none' : 'auto' }}>
                    <GoogleSignInButton onCredential={handleGoogleCredential} />
                  </Box>
                </>
              )}

              <Divider sx={{ my: 3 }} />

              <Box sx={{ bgcolor: 'grey.50', borderRadius: 2, p: 2, mb: 2 }}>
                <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" mb={1}>
                  {t('auth.demoAccounts')}
                </Typography>
                {[
                  { label: 'Super Admin', email: 'superadmin@gamewallet.com', pass: 'SuperAdmin123!' },
                  { label: 'Admin', email: 'admin@gamewallet.com', pass: 'Admin123!' },
                  { label: 'Customer', email: 'customer@gamewallet.com', pass: 'Customer123!' },
                ].map((acc) => (
                  <Box
                    key={acc.label}
                    onClick={() => setForm({ email: acc.email, password: acc.pass })}
                    sx={{ cursor: 'pointer', py: 0.5, '&:hover': { color: 'primary.main' } }}
                  >
                    <Typography variant="caption" fontWeight={600}>{acc.label}: </Typography>
                    <Typography variant="caption" color="text.secondary">{acc.email}</Typography>
                  </Box>
                ))}
              </Box>

              <Box textAlign="center">
                <Typography variant="body2" color="text.secondary">
                  {t('auth.noAccount')}{' '}
                  <Link to="/register" style={{ color: '#D32F2F', fontWeight: 600, textDecoration: 'none' }}>
                    {t('common.register')}
                  </Link>
                </Typography>
              </Box>
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};
