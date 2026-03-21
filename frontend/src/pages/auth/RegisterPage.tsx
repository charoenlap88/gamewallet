import {
  Box, Card, CardContent, TextField, Button, Typography,
  CircularProgress, Alert, InputAdornment, Divider,
} from '@mui/material';
import { Email, Lock, Person, Phone, Receipt } from '@mui/icons-material';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../stores/authStore';
import { authApi, isLoginRequires2fa } from '../../api/auth';
import toast from 'react-hot-toast';
import { LanguageSwitcher } from '../../components/LanguageSwitcher';
import { GoogleSignInButton, isGoogleAuthConfigured } from '../../components/GoogleSignInButton';
import type { User } from '../../types';

export const RegisterPage = () => {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    email: '', username: '', password: '', fullName: '', phone: '', referralCode: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await authApi.register({
        email: form.email,
        username: form.username,
        password: form.password,
        fullName: form.fullName || undefined,
        phone: form.phone || undefined,
        referralCode: form.referralCode.trim() || undefined,
      });
      setAuth(res.user, res.token);
      toast.success(t('auth.registerSuccess'));
      navigate('/');
    } catch (err: any) {
      const msg = err.response?.data?.message;
      setError(Array.isArray(msg) ? msg.join(', ') : msg || t('auth.registerError'));
    } finally {
      setLoading(false);
    }
  };

  const field = (key: keyof typeof form) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [key]: e.target.value }),
  });

  const navigateAfterAuth = (user: User) => {
    if (user.role === 'AGENT') navigate('/agent');
    else if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') navigate('/admin/dashboard');
    else navigate('/');
  };

  const handleGoogleCredential = async (idToken: string) => {
    setError('');
    setLoading(true);
    try {
      const res = await authApi.googleAuth({
        idToken,
        referralCode: form.referralCode.trim() || undefined,
      });
      if (isLoginRequires2fa(res)) {
        toast.error(t('auth.twoFaTitle'));
        navigate('/login');
        return;
      }
      setAuth(res.user, res.token);
      toast.success(t('auth.registerSuccess'));
      navigateAfterAuth(res.user);
    } catch (err: any) {
      const msg = err.response?.data?.message;
      setError(Array.isArray(msg) ? msg.join(', ') : msg || t('auth.googleError'));
      toast.error(Array.isArray(msg) ? msg.join(', ') : msg || t('auth.googleError'));
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
      <Card sx={{ width: '100%', maxWidth: 440, borderRadius: 3 }}>
        <CardContent sx={{ p: 4 }}>
          <Box textAlign="center" mb={3}>
            <Box sx={{
              width: 56, height: 56, borderRadius: 3, bgcolor: 'primary.main',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              mx: 'auto', mb: 2,
            }}>
              <Receipt sx={{ color: 'white', fontSize: 30 }} />
            </Box>
            <Typography variant="h5" fontWeight={800} color="primary.main">{t('auth.registerTitle')}</Typography>
            <Typography variant="body2" color="text.secondary">{t('auth.registerSubtitle')}</Typography>
          </Box>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <Box component="form" onSubmit={handleSubmit} display="flex" flexDirection="column" gap={2}>
            <TextField
              label={t('auth.emailRequired')}
              type="email"
              required
              fullWidth
              {...field('email')}
              InputProps={{ startAdornment: <InputAdornment position="start"><Email color="action" fontSize="small" /></InputAdornment> }}
            />
            <TextField
              label={t('auth.usernameRequired')}
              required
              fullWidth
              {...field('username')}
              InputProps={{ startAdornment: <InputAdornment position="start"><Person color="action" fontSize="small" /></InputAdornment> }}
            />
            <TextField
              label={t('auth.passwordHint')}
              type="password"
              required
              fullWidth
              {...field('password')}
              InputProps={{ startAdornment: <InputAdornment position="start"><Lock color="action" fontSize="small" /></InputAdornment> }}
            />
            <TextField
              label={t('auth.referralCode')}
              fullWidth
              placeholder={t('auth.referralPlaceholder')}
              helperText={t('auth.referralHelper')}
              {...field('referralCode')}
            />
            <TextField
              label={t('auth.fullName')}
              fullWidth
              {...field('fullName')}
              InputProps={{ startAdornment: <InputAdornment position="start"><Person color="action" fontSize="small" /></InputAdornment> }}
            />
            <TextField
              label={t('auth.phone')}
              fullWidth
              {...field('phone')}
              InputProps={{ startAdornment: <InputAdornment position="start"><Phone color="action" fontSize="small" /></InputAdornment> }}
            />
            <Button
              type="submit"
              variant="contained"
              fullWidth
              size="large"
              disabled={loading}
              sx={{ py: 1.5, fontWeight: 700, mt: 1 }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : t('common.register')}
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
              <Typography variant="caption" color="text.secondary" display="block" textAlign="center" sx={{ mb: 1 }}>
                {t('auth.googleReferralHint')}
              </Typography>
              <Box sx={{ mb: 1, opacity: loading ? 0.6 : 1, pointerEvents: loading ? 'none' : 'auto' }}>
                <GoogleSignInButton onCredential={handleGoogleCredential} />
              </Box>
            </>
          )}

          <Divider sx={{ my: 2.5 }} />

          <Box textAlign="center">
            <Typography variant="body2" color="text.secondary">
              {t('auth.hasAccount')}{' '}
              <Link to="/login" style={{ color: '#D32F2F', fontWeight: 600, textDecoration: 'none' }}>
                {t('common.login')}
              </Link>
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};
